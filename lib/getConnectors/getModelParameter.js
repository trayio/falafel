/*
* Reads the value of model parameter, automatically adapting to the 
* the type of parameter it is (basic, or function). In the case of 
* functions, return a wrapped function that will `eval` the function 
* string that's been passed in.
*/
var _ = require('lodash');
var denormalizeModelParameter = require('./denormalizeModelParameter');

module.exports = function (model, key) {

	var parameter = _.get(model, key);

	// data is a denormalized key, so needs to be denormalized first
	if (key === 'data') {
		var denormalized = denormalizeModelParameter(parameter);
		if (!_.keys(denormalized).length) {
			return;
		}
	}

	// if it's a "basic" key, just return the value as is
	else if (parameter.type === 'basic') {
		return parameter.value;
	}

	// If it's a "function" key, wrap and eval the function at runtime 
	// so we can respond with errors if the function errors in dev mode
	else {
		if (parameter.value) {	
			return function () {
				try {
					eval('var operationFn = '+parameter.value);	
					if (_.isFunction(operationFn)) {
						operationFn.apply(null, arguments);	
					}
				} catch (e) {
					var helpfulError = new Error('Error evaluating operation "'+key+'": '+e.message);
					helpfulError.stack = e.stack;
					return when.reject(helpfulError)

				}
			}
		}

	}

};










