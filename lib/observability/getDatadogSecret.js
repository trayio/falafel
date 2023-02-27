const AWS = require('aws-sdk');

const getDatadogSecret = async (dataDogSsmParamKey, awsRegion) => {
	if (!dataDogSsmParamKey) {
		throw new Error('Connector is missing ENV value DATADOG_SSM_PARAM_KEY');
	}
	try {
		const ssm = new AWS.SSM({ region: awsRegion });
		const ssmParameter = await ssm
		.getParameter({
			Name: dataDogSsmParamKey,
			WithDecryption: true,
		})
		.promise();
		const datadogToken = ssmParameter.Parameter.Value;
		return datadogToken;

	} catch (error) {
		throw new Error(`Could not get datadog token from SSM: ${error.message}`);
	}
};

module.exports = { getDatadogSecret };
