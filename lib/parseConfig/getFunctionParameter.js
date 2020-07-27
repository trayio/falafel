/*
* Given a function parameter, return a function that can be run at runtime
* which evaluates the function string, and errors if required.
*/
const _ = require('lodash');
const when = require('when');

module.exports = function (parameter, key, topLevelName) {
	return function () {
		try {
			eval('var evaluatedFn = '+parameter.value);
			if (_.isFunction(evaluatedFn)) {
				return evaluatedFn.apply(null, arguments);
			} else {
				throw new Error('Should be a function');
			}
		} catch (functionError) {
			const helpfulError = new Error(`Error occured for module '${topLevelName}'. Error evaluating function '${key}': ${functionError.message}`);
			helpfulError.stack = functionError.stack;
			helpfulError.code = '#connector_error';
			throw helpfulError;
		}
	};
};
