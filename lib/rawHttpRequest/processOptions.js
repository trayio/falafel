const getContentType = require('./getContentType.js');
const convertArrayFormatToObject = require('./convertArrayFormatToObject.js');

module.exports = function (params) {

	const { processedBody, parse_response } = params;

	let contentType = undefined,
		json = true;

	if (!_.isUndefined(processedBody)) {
		const bodyType = _.keysIn(params.body)[0];

		contentType = getContentType(bodyType, processedBody);

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

	let parse;
	switch (parse_response) {
		case 'true':
			parse = true;
			break;
		case 'false':
			parse = false;
			break;
		default:
			parse = parse_response;
	}

	const headers = convertArrayFormatToObject(params.headers);

	return {
		headers,
		json,
		parse
	};


};
