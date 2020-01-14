const _ = require('lodash');

const processBody = require('./processBody.js');
const validateRequestAgainstProtectedService = require('./validateRequestAgainstProtectedService.js');

//TODO
module.exports = {

	globals: true,

	before: (params) => {
		return processBody(params)
		.then((body) => {
			params.body = body;
			return params;
		});
	},

	method: '{{method}}',

	options: {
		headers: '{{headers}}'
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

	query: '{{query}}',

	body: '{{body}}',

	beforeRequest: validateRequestAgainstProtectedService,

	afterSuccess: (body, params, res) => {
		if (body instanceof Buffer) {
			body = body.toString('utf8');
			try {
				body = JSON.parse(body);
			} catch (e) {
				//Continue as normal
			}
		}
		const result = {
			status_code: res.status_code,
			headers: res.headers,
			body: body
		};
		if (params.include_raw_body) {
			result.raw_body = res.raw.toString();
		}
		return result;
	}

};
