const _ = require('lodash');

const INVALID_URL_ERROR_MESSAGE = `The URL provided is not allowed.`;
function generateErrorMessage (whitelistedBaseUrls) {
	const whitelistBases = [],
		whitelistRegexes = [];
	_.forEach(whitelistedBaseUrls, (whitelistConfig) => {
		if (whitelistConfig.type === 'base') {
			whitelistBases.push(whitelistConfig.value);
		} else if (whitelistConfig.type === 'regex') {
			whitelistRegexes.push(whitelistConfig.value);
		}
	});

	let errorMessage = INVALID_URL_ERROR_MESSAGE;
	if (whitelistBases.length && whitelistRegexes.length) {
		errorMessage += ` The URL must either:\n- start with: ${whitelistBases.join(' or ')}\n- match the following regex(es): ${whitelistRegexes.join(' or ')}`;
	} else if (whitelistBases.length) {
		errorMessage += ` The URL must start with: ${whitelistBases.join(' or ')}.`;
	} else if (whitelistRegexes.length) {
		errorMessage += ` The URL must match the following regex(es): ${whitelistRegexes.join(' or ')}.`;
	}

	return errorMessage;
}

module.exports = function ({ url }, params) {
	const authApp = params['#auth_app'];
	if (_.isPlainObject(authApp) && authApp.protected) {
		const whitelistedBaseUrls = authApp.whitelist_base_urls;
		if (_.isArray(whitelistedBaseUrls) && whitelistedBaseUrls.length) {
			const validUrl = _.some(whitelistedBaseUrls, (whitelistConfig) => {
				if (whitelistConfig.type === 'base') {
					return url.startsWith(whitelistConfig.value);
				} else if (whitelistConfig.type === 'regex') {
					return new RegExp(whitelistConfig.value).test(url);
				}
				return false;
			});
			if (!validUrl) {
				throw new Error(generateErrorMessage(whitelistedBaseUrls));
			}
		}
	}
};
