const { createLogger, format, transports } = require('winston');

const httpTransportOptions = (datadogToken) => {
	return {
		host: `http-intake.logs.${process.env.DATADOG_HOST || 'datadoghq.com'}`,
		path: `/api/v2/logs?dd-api-key=${datadogToken}&ddsource=nodejs&service=connectors`,
		ssl: true
	};
};


const versionLogs = format((info) => {
	const logVersion = 'v1';
	info.logVersion = logVersion;
	return info;
});

const initialiseLogger = (datadogToken) => {
	if (process.env.FALAFEL_ENABLE_LOGGING === 'false' || datadogToken == null) {
		return undefined;
	}
	const logger = createLogger({
		level: 'info',
		exitOnError: false,
		format: format.combine(
			versionLogs(),
			format.json(),
		),
		transports: [new transports.Http(httpTransportOptions(datadogToken))],
	});

	return logger;
};

module.exports = { initialiseLogger };