const { performance } = require('perf_hooks');
const { getDatadogSecret } = require('./getDatadogSecret');
const { initLogger } = require('./logger');
const { initDataDogMetricsApi } = require('./metricsApiWrapper');

const initDependencies = async () => {
	const logVersion = 'v1';
	if (process.env.FALAFEL_ENABLE_LOGGING !== 'true') {
		return { metricsApiWrapper: undefined, logger: undefined };
	}
	try {
		const apiKey = await getDatadogSecret(process.env.DATADOG_SSM_PARAM_KEY, process.env.AWS_REGION);
		const metricsApiWrapper = await initDataDogMetricsApi(process.env.DATADOG_HOST, apiKey, logVersion);
		const logger = initLogger(process.env.DATADOG_HOST, apiKey, logVersion);
		return { metricsApiWrapper, logger };
	} catch (error) {
		if (process.env.FALAFEL_ENABLE_LOGGING === 'true') {
			console.error('Error initialising falafel logging: ', error);
		}
		return { metricsApiWrapper: undefined, logger: undefined };
	}
};

const bindLogger = async () => {

	const { metricsApiWrapper, logger } = await initDependencies();

	const loggingEnabledAndInitialised = (logger) => {
		return !!(process.env.FALAFEL_ENABLE_LOGGING === 'true' && logger);
	};

	falafel.logger = {
		log: (message, metaData) => {
			if (loggingEnabledAndInitialised) {
				logger.info(message, metaData);
			}
		},
		warn: (message, metaData) => {
			if (loggingEnabledAndInitialised) {
				logger.warn(message, metaData);
			}
		},
		error: (message, metaData) => {
			if (loggingEnabledAndInitialised) {
				logger.error(message, metaData);
			}
		},
		metric: {
			startTime: null,
			start: () => {
				falafel.logger.metric.startTime = performance.now();
			},
			end: (params) => {
				const endTime = performance.now();
				const runDuration = endTime - falafel.logger.metric.startTime;
				if (metricsApiWrapper) {
					metricsApiWrapper.submitMetric(params, runDuration);
				}
			}
		}

	};
	return true;
};

module.exports = bindLogger;