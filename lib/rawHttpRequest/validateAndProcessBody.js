const validateBody = require('./validateBody.js');
const processBody = require('./processBody.js');

module.exports = function (params) {
	if (validateBody(params)) {
		return processBody(params.body)
		.then((body) => {
			params.processedBody = body;
			return params;
		});
	} //else params.processedBody = undefined; This is the case by default.
};
