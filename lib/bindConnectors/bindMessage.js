var when              = require('when');
var _ 				  = require('lodash');
const { performance } = require('perf_hooks');
const { client, v2 }  = require('@datadog/datadog-api-client');


const { camelCase }  = require('../utils/mout');
var getMissingParams = require('./getMissingParams');
var formatInputBody  = require('./formatInputBody');
const interceptAfterSuccess = require('./interceptAfterSuccess');
const logger = require('../logger');


const initDataDogApi = () => {
	const configurationOpts = {
		authMethods: {
			apiKeyAuth: '7106b349d44ff9d5ba9a943b6488a467'
		},

	};

	const configuration = client.createConfiguration(configurationOpts);

	client.setServerVariables(configuration, {
		site: 'datadoghq.eu'
	});

	const apiInstance = new v2.MetricsApi(configuration);

	return apiInstance;
};

const buildDatadogMetric = (params) => {
	const { connectorName, connectorVersion, operationName, status, runDuration } = params;

	return {
		body: {
			series: [
				{
					metric: 'connector.operation.runtime.duration',
					type: 0,
					points: [
						{
							timestamp: Math.round(new Date().getTime() / 1000),
							value: runDuration,
						},
					],
					resources: [
						{
							'name': connectorName,
							'type': 'connector'
						},
						{
							'name': operationName,
							'type': 'operation'
						},
						{
							'name': connectorVersion,
							'type': 'version'
						},
						{
							'name': status,
							'type': 'status'
						}
					]
				},
			],
		},
	};
};

const sendMetricToDatadog = (datadogInstance, metricBody) => {
	datadogInstance
	.submitMetrics(metricBody)
	.then((data) => {
		console.log('API called successfully. Returned data: ' + JSON.stringify(data));
	})
	.catch((error) => { return console.error(error); });
};

const requestEnd = (startTime, params, dataDogInstance) => {
	const endTime = performance.now();
	const runDuration = endTime - startTime;

	const metricBody = buildDatadogMetric({ ...params, runDuration });
	sendMetricToDatadog(dataDogInstance, metricBody);
};



module.exports = function (message, threadneedle, connectorConfig) {

	// Add the connector to the falafel global if not already there.
	var connectorName = camelCase(connectorConfig.name);
	falafel[connectorName] = falafel[connectorName] || {};

	// Nice method names only please
	var methodName = camelCase(message.name);

	//camelCasing loses the hash, so add it back if it was in the original name
	if (message.name[0] === '#') {
		methodName = '#' + methodName;
	}

	//Intercept afterSuccess
	message = interceptAfterSuccess(message);

	// Add the threadneedle method
	threadneedle.addMethod(methodName, message.model, message.afterHeaders);

	/*	Add the threadneedle method to the falafel global -
		The falafel version of the operation should expose only
		the body part of the response	*/
	falafel[connectorName][methodName] = function (params) {
		return when.promise(function (resolve, reject) {

			function getBody (resolver) {
				return function (response) {
					logger.info('get body called');
					resolver(response.body);
				};
			}

			threadneedle[methodName](params)

			.done(getBody(resolve), getBody(reject));

		});
	};

	// Bind the method to the internal handler object - this is how the connector
	// processes the inbound messages below.
	return function (event) {
		const startTime = performance.now();
		const dataDogInstance = initDataDogApi();
		return when.promise(function (resolve, reject) {
			var missingParams = (
				methodName[0] === '#' ?
					[] :
					getMissingParams(event.body, message.schema, connectorConfig.globalSchema)
			);

			// If missing parameters, error before sending the API call
			if (missingParams.length) {

				return reject({
					headers: {},
					body: {
						code: '#user_input_error',
						message: 'The following required parameters are missing: ' + missingParams.join(', ')
					}
				});

			} else {   // Otherwise run the method

				var body = formatInputBody(event.body, message.schema);

				threadneedle[methodName](body)

				.done(function (data) {
					requestEnd(startTime, { connectorName, operationName: methodName, connectorVersion: connectorConfig.version, status: 'success' }, dataDogInstance);
					resolve(data);
				}, function (data) {
					logger.error(`Workflow_ID: ${event.id}\nConnector_name: ${connectorConfig.title}\nVersion: ${connectorConfig.version} \nOperation: ${event.header.message}\nRequest_URL: ${connectorConfig.globalModel.baseUrl + message.model.url}\nResponse: ${JSON.stringify(data)}`, { name: connectorConfig.name });
					requestEnd(startTime, { connectorName, operationName: methodName, connectorVersion: connectorConfig.version, status: 'failure' }, dataDogInstance);
					reject(data);
				});

			}

		});
	};

};

