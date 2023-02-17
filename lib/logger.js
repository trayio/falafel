const { createLogger, format, transports } = require('winston');

const httpTransportOptions = (datadogToken) => {
	return {
		host: 'http-intake.logs.datadoghq.eu',
		path: `/api/v2/logs?dd-api-key=${datadogToken}&ddsource=nodejs&service=connectors`,
		ssl: true
	}; 
};


const initialiseLogger = (datadogToken) => {
	if (process.env.FALAFEL_ENABLE_LOGGING === 'false' || datadogToken == null) {
		return undefined;
	}
	const logger = createLogger({
		level: 'info',
		exitOnError: false,
		format: format.json(),
		transports: [new transports.Http(httpTransportOptions(datadogToken))],
	});

	return logger;
};

module.exports = { initialiseLogger };