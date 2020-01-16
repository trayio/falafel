module.exports = function validateFullUrl (params) {
	const fullUrl = (_.get(params, 'url.full_url'));
	if (_.isString(fullUrl)) {
		if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
			const invalidUrlError = new Error('Full URL must start with either `http://` or `https://`.');
			invalidUrlError.code = '#user_input_error';
			throw invalidUrlError;
		}
	}
};
