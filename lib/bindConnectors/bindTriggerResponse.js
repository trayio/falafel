var _                = require('lodash');
var when             = require('when');
var qs               = require('qs');
var parseRequestBody = require('./parseRequestBody');

function formatResponse(resolver) {
	return function(body) {
		resolver({
			headers: {},
			body: body
		});
	};
}

module.exports = function (message, options) {
	// console.log('Adding connector response handler:', message.name+'_response');

	return function (event) {

		// Decode and auto-parse the body
		event.body.http = parseRequestBody(event.body.http, options);

		// Run and ensure it's a promise
		return when.promise(function (resolve, reject) {
			var response = message.response(event.input, event.body.http, event.body.reply || {});
			when(response)
			.done(formatResponse(resolve), formatResponse(reject));
		});

	};
};
