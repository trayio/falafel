/*
* Reads the value of model parameter, automatically adapting to the 
* the type of parameter it is (basic, or function). In the case of 
* functions, return a wrapped function that will `eval` the function 
* string that's been passed in.
*/
var _ = require('lodash');

module.exports = function (model, key) {

	var parameter = _.get(model, key);


	if (parameter.type === 'basic') {
		return parameter.value;
	}

	else {
		// TODO wrapped function inputs
	}

};