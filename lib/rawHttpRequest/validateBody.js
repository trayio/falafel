function checkForValidBodyKey (body) {
	switch (_.keysIn(body)[0]) {
		case 'raw':
		case 'form_urlencoded':
		case 'form_data':
		case 'binary':
		case 'none':
			break;
		default:
			throw new Error('The `body` object must contain only one of the following valid properties: `raw`, `form_urlencoded`, `form_data`, `binary`, or `none`.');
	}
}

module.exports = function ({ method, body }) {

	switch (method.toLowerCase()) {
		case 'get':
		case 'head':
		case 'options':
			//No body should be processed for these HTTP verbs.
			return false;
		default: {
			if (_.isUndefined(body)) {
				throw new Error('`body` must be supplied. Please select a valid "Body Type".');
			} else {
				checkForValidBodyKey(body);
				return true;
			}
		}
	}

};
