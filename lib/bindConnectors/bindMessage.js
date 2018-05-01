var when             = require('when');
var camelCase        = require('mout/string/camelCase');
var _ 				 = require('lodash');
var getMissingParams = require('./getMissingParams');
var formatInputBody  = require('./formatInputBody');
const interceptAfterSuccess = require('./interceptAfterSuccess');


module.exports = function (message, threadneedle, connectorConfig) {

	// console.log('Adding connector message:', message.name);

	// Add the connector to the falafel global if not already there.
	var connectorName = camelCase(connectorConfig.name);
	falafel[connectorName] = falafel[connectorName] || {};

	// Nice method names only please
	var methodName = camelCase(message.name);

	//camelCasing loses the hash, so add it back if it was in the original name
	if (message.name[0] === '#') {
		methodName = '#' + methodName;
	}

	//Intercept afterSuccess
	message = interceptAfterSuccess(message);

	// Add the threadneedle method
	threadneedle.addMethod(methodName, message.model);

	// Add the threadneedle method to the falafel global
	if (_.isFunction(message.model)) {
		/*
			If the model is a function, expose only the body part
			of the response as the falafel operation
		*/
		falafel[connectorName][methodName] = function (params) {
			return when.promise(function (resolve, reject) {

				function getBody (resolver) {
					return function (response) {
						resolver(response.body);
					};
				}

				threadneedle[methodName](params)

				.done(getBody(resolve), getBody(reject));

			});
		};
	} else {
		falafel[connectorName][methodName] = threadneedle[methodName];
	}

	// console.log(threadneedle[methodName]);

	// Bind the method to the internal handler object - this is how the connector
	// processes the inbound messages below.
	return function (event) {
		return when.promise(function (resolve, reject) {

			var missingParams = (
				methodName[0] === '#' ?
					[] :
					getMissingParams(event.body, message.schema, connectorConfig.globalSchema)
			);

			// If missing parameters, error before sending the API call
			if (missingParams.length) {

				return reject({
					code: 'invalid_input',
					message: 'The following required parameters are missing: ' + missingParams.join(', ')
				});

			} else {   // Otherwise run the method

				var body = formatInputBody(event.body, message.schema);

				threadneedle[methodName](body)

				.done(resolve, reject);

			}

		});
	};

};
