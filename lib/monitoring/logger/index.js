const { initLogger } = require('./loggerWrapper');

const initDependencies = async (apiKey) => {
	const logVersion = 'v2';
	if (process.env.FALAFEL_ENABLE_LOGGING !== 'true') {
		return undefined;
	}
	try {
		const loggerWrapper = initLogger(process.env.DATADOG_HOST, apiKey, logVersion);
		return loggerWrapper;
	} catch (error) {
		console.error('Error initialising falafel logging: ', error);
		return undefined;
	}
};

const createLogger = async (apiKey) => {
	const loggerWrapper = await initDependencies(apiKey);

	const loggingEnabledAndInitialised = (loggerWrapper) => {
		return !!(process.env.FALAFEL_ENABLE_LOGGING === 'true' && loggerWrapper);
	};

	const logger = {
		log: (message, metaData) => {
			if (loggingEnabledAndInitialised(loggerWrapper)) {
				loggerWrapper.info(message, metaData);
			}
		},
		warn: (message, metaData) => {
			if (loggingEnabledAndInitialised(loggerWrapper)) {
				loggerWrapper.warn(message, metaData);
			}
		},
		error: (message, metaData) => {
			if (loggingEnabledAndInitialised(loggerWrapper)) {
				loggerWrapper.error(message, metaData);
			}
		}
	};
	return logger;
};

module.exports = createLogger;