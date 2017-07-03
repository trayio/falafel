/*
* Denormalize a model parameter to get the "pure" parameter as it should
* be passed into Falafel.
* 
* Currently this is only done for the `data` key, in post/put/patch/delete requests.
*/
var _ = require('lodash');
var getFunctionParameter = require('./getFunctionParameter');


module.exports = function (parameter) {

	var denormalized = {};

	function denormalize(param, keyPath) {

		// set all of the keys beneath an object
		if (param.type === 'object') {
			_.each(param.value, function (subParam, subKey) {
				denormalize(subParam, keyPath+'.'+subKey);
			});
		} 

		// set a blank array, and add all of the children to it
		else if (param.type === 'array') {
			_.set(denormalized, keyPath, []);
			_.each(param.value, function (item, index) {
				return denormalize(item, keyPath+'['+index+']');
			});
		} 

		// return a function that can be evaluated, if a function has actually 
		// been declared
		else if (param.type === 'function') {
			if (param.value) {
				_.set(denormalized, keyPath, getFunctionParameter(param, keyPath));	
			}
		}

		// set a basic parameter
		else {
			_.set(denormalized, keyPath, param.value);
		}

	}

	_.each(parameter.value, function (param, key) {
		denormalize(param, key);
	})


	return denormalized;

};