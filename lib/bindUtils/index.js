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
const validateAndProcessBody = require('../rawHttpRequest/validateAndProcessBody');
const processOptions = require('../rawHttpRequest/processOptions');
const validateUrlInput = require('../rawHttpRequest/validateUrlInput');
const formatOutput = require('../rawHttpRequest/formatOutput');
function setupRawHttpRequestUtils () {
	falafel.utils.rawHttpRequest = {
		validateBody,
		processBody,
		validateAndProcessBody,
		processOptions,
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
