const { client, v2 } = require('@datadog/datadog-api-client');

const buildDatadogMetric = (params) => {
	const { connectorName, connectorVersion, operationName, status, runDuration, metricsVersion } = params;

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
							'name': metricsVersion,
							'type': 'metricsVersion'
						}
					]
				},
			],
		},
	};
};

const sendMetricToDatadog = (datadogInstance, metricBody) => {
	return datadogInstance
	.submitMetrics(metricBody)
	.catch((error) => { console.error('Datadog submit metric error: ', error); });
};

const metricsApiWrapper = (dataDogApi, metricsVersion) => {
	return {
		submitMetric: (params, runDuration) => {
			const metricBody = buildDatadogMetric({ ...params, runDuration, metricsVersion });
			return sendMetricToDatadog(dataDogApi, metricBody);
		}
	};
};


const initMetrics = async (host, apiKey, metricsVersion) => {
	if (host === undefined) {
		throw new Error('Connector is missing ENV value DATADOG_HOST');
	}
	try {
		const configurationOpts = {
			authMethods: {
				apiKeyAuth: apiKey,
			},

		};

		const configuration = client.createConfiguration(configurationOpts);
		client.setServerVariables(configuration, { site: host });

		const dataDogApi = new v2.MetricsApi(configuration);
		return metricsApiWrapper(dataDogApi, metricsVersion);

	} catch (error) {
		throw new Error(`Datadog initialisation failed: ${error.message}`);
	}
};

module.exports = { initMetrics };