const { getDatadogSecret } = require('./getDatadogSecret');
const createLogger = require('./logger');
const createMetrics = require('./metrics');

const initDependencies = async () => {
	if (process.env.FALAFEL_ENABLE_LOGGING !== 'true' && process.env.FALAFEL_ENABLE_METRICS !== 'true') {
		return undefined;
	}
	try {
		const apiKey = await getDatadogSecret(process.env.DATADOG_SSM_PARAM_KEY, process.env.AWS_REGION);
		return apiKey;
	} catch (error) {
		console.error('Error initialising falafel monitoring: ', error);
		return undefined;
	}
};

const bindMonitoring = async () => {
	const apiKey = await initDependencies();
	const loggerReady = createLogger(apiKey).then((logger) => {
		falafel.logger = logger;
	});
	const metricsReady = createMetrics(apiKey).then((metrics) => {
		falafel.metrics = metrics;
	});
	return Promise.all([ loggerReady, metricsReady ]);
};

module.exports = bindMonitoring;