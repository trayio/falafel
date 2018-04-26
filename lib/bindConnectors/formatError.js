/*
* Given a `details` object containing details about the error,
* and the original message that came in, return an error in the
* format desired by the cluster service.
*/
var _ = require('lodash');

module.exports = function (response, event) {

	var details = response.body;

	var body = {};

	if (_.isError(details)) {
		body.message = details.message || 'API error';
		body.code = 'api_error';
	}

	else {
		body = _.defaults(details, {
			code: 'api_error',
			message: 'API error'
		});
	}

	// Force the body.response.body to be a string if its a buffer
	// so that some uncaught error messages are properly passed back
	if (_.has(body, 'response.body')) {
		var rb = _.get(body, 'response.body');
		if (rb && _.isBuffer(rb)) {
			try {
				body.response.body = rb.toString();
			} catch (e) {}
		}
	}

	return {
		id: event.id,
		header: _.assign(
			response.header,
			{
				error: true
			}
		),
		body: body
	};

};
