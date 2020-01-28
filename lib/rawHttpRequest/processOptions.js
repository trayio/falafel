const getContentTypeFromBody = require('./getContentTypeFromBody.js');
const convertArrayFormatToObject = require('./convertArrayFormatToObject.js');

module.exports = function (params) {

	const { processedBody } = params;

	let contentType = undefined,
		json = true;

	if (!_.isUndefined(processedBody)) {
		const bodyType = _.keysIn(params.body)[0];

		contentType = getContentTypeFromBody(bodyType, processedBody);

		if (contentType) {
			if (contentType.includes('application/x-www-form-urlencoded')) {
				json = false;
			}
			if (contentType.includes('text/plain')) {
				json = false;
			}
		} else {
			json = false;
		}

	}

	let { parse_response } = params;
	switch (parse_response) {
		case 'true':
			parse_response = true;
			break;
		case 'false':
			parse_response = false;
			break;
	}

	const headers = convertArrayFormatToObject(params.headers);

	if (_.isUndefined(headers['Content-Type']) && contentType) {
		//The naming maintains same format as HTTP client connector
		headers['Content-Type'] = contentType;
	}

	return {
		headers,
		json,
		parse_response
	};


};
