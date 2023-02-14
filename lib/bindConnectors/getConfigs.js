const AWS = require('aws-sdk');

const getCurrentRegion = () => {
	return process.env.AWS_REGION === 'dev'
		? process.env.dev_region
		: process.env.AWS_REGION; 
};


const getDatadogSecrets = async () => {
	const ssm = new AWS.SSM({ region: getCurrentRegion() });
	const ssmParameter = await ssm
	.getParameter({
		Name: process.env.DATADOG_API_SECRET_TOKEN,
	})
	.promise();

	try {
		const datadogToken = ssmParameter.Parameter.Value;
		return datadogToken;
	} catch (err) {
		console.log(`Could not get datadog token from SSM: ${err}`);
	}
};

module.exports = {
	getCurrentRegion,
	getDatadogSecrets
};
