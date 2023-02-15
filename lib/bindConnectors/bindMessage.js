var when              = require('when');
var _ 				  = require('lodash');
const { performance } = require('perf_hooks');
const { client, v2 }  = require('@datadog/datadog-api-client');


const { camelCase }  = require('../utils/mout');
var getMissingParams = require('./getMissingParams');
var formatInputBody  = require('./formatInputBody');
const interceptAfterSuccess = require('./interceptAfterSuccess');
const logger = require('../logger');
const { getDatadogSecrets } = require('./getConfigs');


const initDataDogApi = async () => {
	const token = await getDatadogSecrets();
	const configurationOpts = {
		authMethods: {
			apiKeyAuth: token,
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
	if (!datadogInstance) return;

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

	const onFinishHandler = (event, startTime, datadogInstance) => {
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
					requestEnd(startTime, { connectorName, operationName: methodName, connectorVersion: connectorConfig.version, status: 'success' }, datadogInstance);
					resolve(data);
				}, function (data) {
					if (process.env.enable_logging === 'enabled') {
						logger.error(
							data,
							{
								connectorName: connectorConfig.name,
								connectorVersion: connectorConfig.version,
								operation: event.header.message,
								requestUrl: connectorConfig.globalModel.baseUrl + message.model.url,
								workflowId: event.id,
							}
						);
					}
					requestEnd(startTime, { connectorName, operationName: methodName, connectorVersion: connectorConfig.version, status: 'failure' }, datadogInstance);
					reject(data);
				});

			}

		});
	};

	// Bind the method to the internal handler object - this is how the connector
	// processes the inbound messages below.
	return function (event) {
		const startTime = performance.now();
		const dataDogInstance = when(initDataDogApi());

		return dataDogInstance.then(function (datadogInstance) {
			return onFinishHandler(event, startTime, datadogInstance);
		}).catch(function (rejection) {
			console.log(`could not get datadog token`, { rejection });
			return onFinishHandler(event, startTime, undefined);
		});
	};

};

