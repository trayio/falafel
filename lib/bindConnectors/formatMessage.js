/*
* Given a `details` object containing details about the error,
* and the response that the method returned, return a message
* in the cluster service format.
*/
var _ = require('lodash');

module.exports = function (event, response, version) {

	return {
		id: event.id,
		version: (version === 2) ? 2 : undefined, // only declare on v2
		header: response.headers,
		body: response.body
	};

};
