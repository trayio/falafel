const { createLogger, format, transports } = require('winston');

const httpTransportOptions = (datadogToken) => {
	return {
		host: 'http-intake.logs.datadoghq.eu',
		path: `/api/v2/logs?dd-api-key=${datadogToken}&ddsource=nodejs&service=connectors`,
		ssl: true
	}; 
};


const initialiseLogger = (datadogToken) => {
	if (process.env.FALAFEL_ENABLE_LOGGING === 'true' && datadogToken == null) {
		return undefined;
	}
	const transportsList = [process.env.FALAFEL_ENABLE_LOGGING === 'true' ? new transports.Http(httpTransportOptions(datadogToken)) : new transports.Console()];
	const logger = createLogger({
		level: 'info',
		exitOnError: false,
		format: format.json(),
		transports: transportsList,
	});

	return logger;
};

module.exports = { initialiseLogger };