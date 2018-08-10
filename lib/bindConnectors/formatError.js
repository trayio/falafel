/*
* Given a `details` object containing details about the error,
* and the original message that came in, return an error in the
* format desired by the cluster service.
*/
var _ = require('lodash');

module.exports = function (response, event) {

	if (_.isError(response)) {
		response = {
			body: response,
			headers: {}
		};
	}

	var details = response.body;

	if (_.isError(details)) {
		details = {
			message: details.message || 'API error',
			code: 'api_error'
		};
	}

	else if (_.isPlainObject(details)) {

		// Force the details.response.body to be a string if its a buffer
		// so that some uncaught error messages are properly passed back
		var responseBody = _.get(details, 'response.body', undefined);

		if (responseBody && _.isBuffer(responseBody)) {

			try {

				details.response.body = responseBody.toString();

			} catch (error) {

				// eslint-disable-next-line no-console
				console.log('formatError - Could not toString body');
				// eslint-disable-next-line no-console
				console.log(error);

			}
		}

	} else { //If details is not an object, refactor it into an object

		details = {
			response: details
		};

	}

	return {
		id: event.id,
		header: _.defaultsDeep(
			{
				error: true
			},
			response.headers
		),
		body: _.defaults(
			details,
			{
				code: 'api_error',
				message: 'API error'
			}
		)
	};

};
