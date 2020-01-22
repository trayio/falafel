function startsWithValidRESTProtocol (targetString) {
	return targetString.startsWith('http://') || targetString.startsWith('https://');
}

module.exports = function (params) {
	const fullUrl = (_.get(params, 'url.full_url'));
	const endpoint = (_.get(params, 'url.endpoint'));
	if (_.isString(fullUrl)) {
		if (!startsWithValidRESTProtocol(fullUrl)) {
			const invalidUrlError = new Error('Full URL must start with either `http://` or `https://`.');
			invalidUrlError.code = '#user_input_error';
			throw invalidUrlError;
		}
	}
	if (_.isString(endpoint)) {
		if (startsWithValidRESTProtocol(endpoint)) {
			const invalidUrlError = new Error('Endpoint will be appended unto the base URL defined by the connector. Please use `Full URL` to specify a URL starting with `http://` or `https://`.');
			invalidUrlError.code = '#user_input_error';
			throw invalidUrlError;
		}
	}
};
