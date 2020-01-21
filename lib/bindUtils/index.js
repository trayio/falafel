
const processBody = require('../rawHttpRequest/processBody');
const validateUrlInput = require('../rawHttpRequest/validateUrlInput');
const validateRequestAgainstProtectedService = require('../rawHttpRequest/validateRequestAgainstProtectedService.js');
const formatOutput = require('../rawHttpRequest/formatOutput');
function setupRawHttpRequestUtils () {
	falafel.utils.rawHttpRequest = {
		validateUrlInput,
		processBody,
		validateRequestAgainstProtectedService,
		formatOutput
	};
}

function setupUtils () {
	falafel.utils = {};
	setupRawHttpRequestUtils();
}

module.exports = setupUtils;
