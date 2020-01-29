const validateBody = require('./validateBody.js');
const processBody = require('./processBody.js');

module.exports = async function (params) {
	if (validateBody(params)) {
		params.processedBody = await processBody(params.body);
		return params;
	} //else params.processedBody = undefined; This is the case by default.
};
