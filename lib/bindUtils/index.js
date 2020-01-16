
const processBody = require('../rawHttpRequest/processBody');
const validateFullUrl = require('../rawHttpRequest/validateFullUrl');
const validateRequestAgainstProtectedService = require('../rawHttpRequest/validateRequestAgainstProtectedService.js');
function setupRawHttpRequestUtils () {
	falafel.utils.rawHttpRequest = {
		processBody,
		validateFullUrl,
		validateRequestAgainstProtectedService
	};
}

function setupUtils () {
	falafel.utils = {};
	setupRawHttpRequestUtils();
}

module.exports = setupUtils;
