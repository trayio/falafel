const { createLogger, format, transports } = require('winston');

const httpTransportOptions = (datadogToken) => {
	return {
		host: 'http-intake.logs.datadoghq.com',
		path: `/api/v2/logs?dd-api-key=${datadogToken}&ddsource=nodejs&service=connectors`,
		ssl: true
	}; 
};


const initialiseLogger = (datadogToken) => {
	const transportsList = [process.env.NODE_ENV === 'production' ? new transports.Http(httpTransportOptions(datadogToken)) : new transports.Console()];
	const logger = createLogger({
		level: 'info',
		exitOnError: false,
		format: format.json(),
		transports: transportsList,
	});

	return logger;
};

module.exports = { initialiseLogger };