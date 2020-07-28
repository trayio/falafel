/*
* Each helper is simply a function, keyed against a certain name
*/
var getFunctionParameter = require('./getFunctionParameter');

module.exports = function (helperParameter, helperKey) {
	return getFunctionParameter(helperParameter, 'helper', helperKey);
};
