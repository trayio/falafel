/*
* Given a function parameter, return a function that can be run at runtime
* which evaluates the function string, and errors if required.
*/

module.exports = function (parameter, key) {
	return function () {
		try {
			eval('var evaluatedFn = '+parameter.value);	
			if (_.isFunction(evaluatedFn)) {
				return evaluatedFn.apply(null, arguments);	
			}
		} catch (e) {
			var helpfulError = new Error('Error evaluating operation "'+key+'": '+e.message);
			helpfulError.stack = e.stack;
			return when.reject(helpfulError)

		}
	}
}