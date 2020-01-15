
const processBody = require('../rawHttpRequest/processBody');
const validateRequestAgainstProtectedService = require('../rawHttpRequest/validateRequestAgainstProtectedService.js');
function setupRawHttpRequestUtils () {
	falafel.utils.rawHttpRequest = {
		processBody,
		validateRequestAgainstProtectedService
	};
}

function setupUtils () {
	falafel.utils = {};
	setupRawHttpRequestUtils();
}

module.exports = setupUtils;
