const when              = require('when');
const _ 				  = require('lodash');
const { performance } = require('perf_hooks');
const { client, v2 }  = require('@datadog/datadog-api-client');


const { camelCase }  = require('../utils/mout');
const getMissingParams = require('./getMissingParams');
const formatInputBody  = require('./formatInputBody');
const interceptAfterSuccess = require('./interceptAfterSuccess');
const { initialiseLogger } = require('../logger');
const getDatadogSecret = require('./getDatadogSecret');


const initDataDogApi = async () => {
	const datadogToken = await getDatadogSecret();
	if (datadogToken === undefined) {
		return { datadogApiInstance: undefined, datadogToken: undefined };
	}
	try {
		const configurationOpts = {
			authMethods: {
				apiKeyAuth: datadogToken,
			},

		};

		const configuration = client.createConfiguration(configurationOpts);

		client.setServerVariables(configuration, {
			site: 'datadoghq.eu'
		});

		const datadogApiInstance = new v2.MetricsApi(configuration);
		const logger = initialiseLogger(datadogToken);

		return { datadogApiInstance, logger } ;
	} catch (e) {
		console.error(`Datadog initialisation failed`);
		return { datadogApiInstance: undefined, logger: undefined } ;
	}
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
						},
						{
							'name': 'v1',
							'type': 'logVersion'
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
	.catch((error) => { console.error('Datadog submit metric error: ', error); });
};

const requestEnd = async (startTime, params, dataDogInstance) => {
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
					resolver(response.body);
				};
			}

			threadneedle[methodName](params)

			.done(getBody(resolve), getBody(reject));

		});
	};

	const constructRequestUrl = (baseUrl, body, path) => {
		if (typeof baseUrl === 'function') {
			return baseUrl(body) + path;
		}
		return baseUrl + path;
	};

	const onFinishHandler = (event, startTime, datadogInstance, logger) => {
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
					if (process.env.FALAFEL_ENABLE_LOGGING === 'true' && logger) {
						logger.error(
							data,
							{
								connectorName: connectorConfig.name,
								connectorVersion: connectorConfig.version,
								operation: event.header.message,
								requestUrl: constructRequestUrl(connectorConfig.globalModel.baseUrl, event.body, message.model.url),
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
		const dataDogInitialisation = when(initDataDogApi());

		return dataDogInitialisation.then(function ({ datadogApiInstance, logger }) {
			return onFinishHandler(event, startTime, datadogApiInstance, logger);
		});
	};

};

