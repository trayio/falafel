/*
* Middleware for request and response. Decodes the base64 encoded
* body, and parses according to the content type.
*
* The original body is set to `http.rawBody`.
*/
var _  = require('lodash');
var qs = require('qs');
var startsWith = require('mout/string/startsWith');

module.exports = function (http, options) {

	// Set all headers as lowercase
	var newHeaders = {};
	_.each(http.headers, function (value, key) {
		newHeaders[key.toLowerCase()] = value;
	});
	http.headers = newHeaders;

	// Decode and auto-parse the body
	if (http.body) {

		var contentType;
		var headers = http.headers;
		if (_.isArray(headers['content-type']) && headers['content-type']) {
			contentType = headers['content-type'][0];
		}

		// On dev, we don't send the body base64 encoded, we send it via Postman
		var body;

		// On dev or test, don't require base64 encoding. Allow objects/strings to be sent
		if (options.dev || options.test) {
			if (_.isObject(http.body)) {
				body = http.rawBody = JSON.stringify(http.body);
			} else if (options.dev) {
				body = http.rawBody = http.body;
			}
		} else {
			body = http.rawBody = new Buffer(http.body, 'base64').toString();
		}

		http.body = parseBody(body, contentType);

	}

	return http;

};




function parseBody (body, contentType) {

	if (startsWith(contentType, 'application/json')) {
		try {
			return JSON.parse(body);
		} catch (e) {
			return body;
		}
	}

	else if (startsWith(contentType, 'application/x-www-form-urlencoded')) {
		return extendedUrlParser(body);
	}

	// Parse as text/html - needed for anything? Don't think so.
	else {
		return body;
	}

}


/*
* Parse a URL encoded body
*/
function extendedUrlParser (body) {
	var parameterLimit = 1000;

	var paramCount = parameterCount(body, parameterLimit);
	var arrayLimit = Math.max(100, paramCount);

	return qs.parse(body, {
		allowPrototypes: true,
		arrayLimit: arrayLimit,
		depth: Infinity,
		parameterLimit: parameterLimit
	});
}



/**
 * Count the number of parameters, stopping once limit reached
 *
 * @param {string} body
 * @param {number} limit
 * @api private
 */

function parameterCount (body, limit) {
	var count = 0;
	var index = 0;

	while ((index = body.indexOf('&', index)) !== -1) {
		count++;
		index++;

		if (count === limit) {
			return undefined;
		}
	}

	return count;
}
