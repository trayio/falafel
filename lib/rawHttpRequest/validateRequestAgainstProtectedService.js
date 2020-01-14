module.exports = function ({ url }, params) {
	const authApp = params['#auth_app'];
	if (authApp && authApp.protected) {
		if (authApp.whitelist_base_urls) {
			const validUrl = _.some(authApp.whitelist_base_urls, (whitelistConfig) => {
				if (whitelistConfig.type === 'base') {
					return url.startsWith(whitelistConfig.value);
				} else if (whitelistConfig.type === 'regex') {
					return new RegExp(whitelistConfig.value).test(url);
				}
				return false;
			});
		}
	}
};
