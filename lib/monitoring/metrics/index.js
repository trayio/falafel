const { performance } = require('perf_hooks');
const { initMetrics } = require('./metricsApiWrapper');

const initDependencies = async (apiKey) => {
	const metricsVersion = 'v1';
	if (process.env.FALAFEL_ENABLE_METRICS !== 'true') {
		return undefined;
	}
	try {
		const metricsApiWrapper = await initMetrics(process.env.DATADOG_HOST, apiKey, metricsVersion);
		return metricsApiWrapper;
	} catch (error) {
		console.error('Error initialising falafel metrics: ', error);
		return undefined;
	}
};

const createMetrics = async (apiKey) => {
	const metricsApiWrapper = await initDependencies(apiKey);

	const metricsEnabledAndInitialised = (metricsApiWrapper) => {
		return !!(process.env.FALAFEL_ENABLE_METRICS === 'true' && metricsApiWrapper);
	};

	const metrics = {
		startTime: null,
		start: () => {
			this.startTime = performance.now();
		},
		end: async (params) => {
			const endTime = performance.now();
			const runDuration = endTime - this.startTime;
			if (metricsEnabledAndInitialised(metricsApiWrapper)) {
				await metricsApiWrapper.submitMetric(params, runDuration);
			}
		}
	};
	return metrics;
};

module.exports = createMetrics;