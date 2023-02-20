const AWS = require('aws-sdk');

const getDatadogSecret = async () => {
	if (process.env.FALAFEL_ENABLE_LOGGING !== 'true') {
		return undefined;
	}
	if (!process.env.DATADOG_SSM_PARAM_KEY) {
		console.error('Connector is missing ENV value DATADOG_SSM_PARAM_KEY');
		return undefined;
	}
	try {
		const ssm = new AWS.SSM({ region: process.env.AWS_REGION });
		const ssmParameter = await ssm
		.getParameter({
			Name: process.env.DATADOG_SSM_PARAM_KEY,
			WithDecryption: true,
		})
		.promise();
		const datadogToken = ssmParameter.Parameter.Value;
		return datadogToken;

	} catch (err) {
		console.error(`Could not get datadog token from SSM: ${err}`);
	}
};

module.exports = getDatadogSecret;
