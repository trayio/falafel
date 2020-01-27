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
				return true;
			}
		}
	}

};
