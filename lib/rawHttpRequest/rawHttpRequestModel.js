const _ = require('lodash');

const processBody = require('./processBody.js');
const validateUrlInput = require('./validateUrlInput.js');
const validateRequestAgainstProtectedService = require('./validateRequestAgainstProtectedService.js');
const formatOutput = require('./formatOutput.js');

function convertArrayFormatToObject (targetArray) {
	return _.reduce(targetArray, (acc, { key, value }) => {
		return ( acc[key] = value, acc );
	}, {});
}

module.exports = {

	globals: true, //Use global model

	before: (params) => {

		validateUrlInput(params); //Validate `endpoint` and `full_url`

		return processBody(params.body)
		.then((body) => {
			params.processedBody = body;
			return params;
		});

	},

	method: '{{method}}',

	options: {
		headers: ({ headers }) => {
			return convertArrayFormatToObject(headers);
		}
	},

	url: (params) => {

		const { url: { full_url, endpoint } } = params;

		if (full_url) {
			return full_url;
		}

		/*
			This is to allow requests on solely the specified base URL itself.
			Also, some APIs are sensitive about there being a slash at the end
			or not,	so don't set it if there's no endpoint specified.
		*/
		return (
			endpoint ?
			( endpoint[0] === '/' ? endpoint : `/${endpoint}` ) :
			''
		);

	},

	query: ({ query_parameters }) => {
		return convertArrayFormatToObject(query_parameters);
	},

	data: '{{processedBody}}',

	/*
		Performs validation of the request against protected service whitelist
		if enabled and configured
	*/
	beforeRequest: validateRequestAgainstProtectedService,

	//Transform the API response into a standardised format
	afterSuccess: formatOutput

};
