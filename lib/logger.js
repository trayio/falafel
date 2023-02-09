const { createLogger, format, transports } = require('winston');

const httpTransportOptions = {
	host: 'http-intake.logs.datadoghq.eu',
	path: '/api/v2/logs?dd-api-key=7106b349d44ff9d5ba9a943b6488a467&ddsource=nodejs&service=connectors',
	ssl: true
};

const transportsList = [process.env.NODE_ENV === 'production' ? new transports.Http(httpTransportOptions) : new transports.Console()];

const logger = createLogger({
	level: 'info',
	exitOnError: false,
	format: format.json(),
	transports: transportsList,
});

module.exports = logger;