/*
* Denormalize a model parameter to get the "pure" parameter as it should
* be passed into Falafel.
*
* Currently this is only done for the `data` key, in post/put/patch/delete requests.
*/
var _ = require('lodash');
var getFunctionParameter = require('./getFunctionParameter');


module.exports = function (parameter, topLevelName) {

	var normalized = {};

	function normalize (param, keyPath) {

		// set all of the keys beneath an object
		if (param.type === 'object') {
			_.set(normalized, keyPath, {});
			_.each(param.value, function (subParam, subKey) {
				normalize(subParam, keyPath+'.'+subKey);
			});
		}

		// set a blank array, and add all of the children to it
		else if (param.type === 'array') {
			_.set(normalized, keyPath, []);
			_.each(param.value, function (item, index) {
				return normalize(item, keyPath+'['+index+']');
			});
		}

		// return a function that can be evaluated, if a function has actually
		// been declared
		else if (param.type === 'function') {
			if (param.value) {
				_.set(normalized, keyPath, getFunctionParameter(param, keyPath, topLevelName));
			}
		}

		// set a basic parameter
		else if (!_.isUndefined(param.value)) {
			_.set(normalized, keyPath, param.value);
		}

	}

	// For object parameters, set each of the parameters recursively
	if (parameter.type === 'object') {
		_.each(parameter.value, function (param, key) {
			normalize(param, key);
		});
	}

	// For function parameters, simply get the function parameter.
	// If the function parameter has no value, then fall back to a function
	// that just returns a blank object.
	else if (parameter.type === 'function') {
		if (parameter.value) {
			normalized = getFunctionParameter(parameter, topLevelName, topLevelName);
		} else {
			normalized = function () {
				return {};
			};
		}
	}


	return normalized;

};
