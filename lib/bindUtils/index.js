
const processBody = require('../rawHttpRequest/processBody');
const validateUrlInput = require('../rawHttpRequest/validateUrlInput');
const validateRequestAgainstProtectedService = require('../rawHttpRequest/validateRequestAgainstProtectedService.js');
function setupRawHttpRequestUtils () {
	falafel.utils.rawHttpRequest = {
		processBody,
		validateUrlInput,
		validateRequestAgainstProtectedService
	};
}

function setupUtils () {
	falafel.utils = {};
	setupRawHttpRequestUtils();
}

module.exports = setupUtils;
