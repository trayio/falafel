const validateRequestAgainstWhitelistedUrls = require('../protectedService/validateRequestAgainstWhitelistedUrls.js');
function setupProtectedServiceUtils () {
	falafel.utils.protectedService = {
		validateRequestAgainstWhitelistedUrls
	};
}

const processBody = require('../rawHttpRequest/processBody');
const validateUrlInput = require('../rawHttpRequest/validateUrlInput');
const formatOutput = require('../rawHttpRequest/formatOutput');
function setupRawHttpRequestUtils () {
	falafel.utils.rawHttpRequest = {
		validateUrlInput,
		processBody,
		formatOutput
	};
}

function setupUtils () {
	falafel.utils = {};
	setupRawHttpRequestUtils();
}

module.exports = setupUtils;
