const { createLogger, format, transports } = require('winston');

const httpTransportOptions = (host, datadogToken) => {
	return {
		host: `http-intake.logs.${host}`,
		path: `/api/v2/logs?dd-api-key=${datadogToken}&ddsource=nodejs&service=connectors`,
		ssl: true
	};
};


const versionLogs = (logVersion) => {
	return format((info) => {
		info.logVersion = logVersion;
		return info;
	});
};

const initLogger = (host, apiKey, logVersion) => {
	if (host === undefined) {
		throw new Error('Connector is missing ENV value DATADOG_HOST');
	}
	const logger = createLogger({
		level: 'info',
		exitOnError: false,
		format: format.combine(
			versionLogs(logVersion)(),
			format.json(),
		),
		transports: [new transports.Http(httpTransportOptions(host, apiKey))],
	});

	return logger;
};

module.exports = { initLogger };