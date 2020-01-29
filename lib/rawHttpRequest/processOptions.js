const getContentTypeFromBody = require('./getContentTypeFromBody.js');
const convertArrayFormatToObject = require('./convertArrayFormatToObject.js');

module.exports = function (params) {

	let contentType = undefined,
		json = true;

	/*
		`processedBody` is set in the operation's `before`, and so dependning on
		HTTP verb or body contents, will be processed or set to undefined
	*/
	const { processedBody } = params;
	if (!_.isUndefined(processedBody)) {
		const bodyType = _.keysIn(params.body)[0];

		contentType = getContentTypeFromBody(bodyType, processedBody);

		if (contentType) {
			if (contentType === 'multipart/form-data') {
				json = false;
			}
			if (contentType === 'application/x-www-form-urlencoded') {
				json = false;
			}
			if (contentType === 'text/plain') {
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
		parse_response,
		//Needed for file processing if form_data
		multipart: contentType.includes('multipart/form-data')
	};


};
