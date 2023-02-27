const { client, v2 } = require('@datadog/datadog-api-client');

const buildDatadogMetric = (params) => {
	const { connectorName, connectorVersion, operationName, status, runDuration, logVersion } = params;

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
							'name': logVersion,
							'type': 'logVersion'
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

const metricsApiWrapper = (dataDogApi, logVersion) => {
	return {
		submitMetric: (params, runDuration) => {
			const metricBody = buildDatadogMetric({ ...params, runDuration, logVersion });
			return sendMetricToDatadog(dataDogApi, metricBody);
		}
	};
};


const initDataDogMetricsApi = async (host, apiKey, logVersion) => {
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
		return metricsApiWrapper(dataDogApi, logVersion);

	} catch (error) {
		throw new Error(`Datadog initialisation failed: ${error.message}`);
	}
};

module.exports = { initDataDogMetricsApi };