var normalizeModelParameter = require('./normalizeModelParameter');


module.exports = function (operation) {

	if (operation.model.dynamic_output) {
		return normalizeModelParameter(operation.model.dynamic_output)
	}

};