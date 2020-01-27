const smartSubstitution = require('@trayio/threadneedle/smartSubstitution');
function setupThreadneedleUtils () {
	falafel.utils.threadneedle = {
		smartSubstitution
	};
}

const validateRequestAgainstWhitelistedUrls = require('../protectedService/validateRequestAgainstWhitelistedUrls.js');
function setupProtectedServiceUtils () {
	falafel.utils.protectedService = {
		validateRequestAgainstWhitelistedUrls
	};
}

const validateBody = require('../rawHttpRequest/validateBody');
const processBody = require('../rawHttpRequest/processBody');
const validateUrlInput = require('../rawHttpRequest/validateUrlInput');
const formatOutput = require('../rawHttpRequest/formatOutput');
function setupRawHttpRequestUtils () {
	falafel.utils.rawHttpRequest = {
		validateBody,
		processBody,
		validateUrlInput,
		formatOutput
	};
}

function setupUtils () {
	falafel.utils = {};
	setupThreadneedleUtils();
	setupProtectedServiceUtils();
	setupRawHttpRequestUtils();
}

module.exports = setupUtils;
