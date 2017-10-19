/*
* Given a function parameter, return a function that can be run at runtime
* which evaluates the function string, and errors if required.
*/
var when = require('when');
var _ = require('lodash');

module.exports = function (parameter, key) {
	return function () {
		try {
			eval('var evaluatedFn = '+parameter.value);	
			if (_.isFunction(evaluatedFn)) {
				return evaluatedFn.apply(null, arguments);	
			} else {
				throw new Error('Should be a function');
			}
		} catch (e) {
			var helpfulError = new Error('Error evaluating operation "'+key+'": '+e.message);
			helpfulError.stack = e.stack;
			throw helpfulError;
		}
	}
}