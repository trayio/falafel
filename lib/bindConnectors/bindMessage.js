var when             = require('when');
var _ 				 = require('lodash');

const { camelCase }  = require('../utils/mout');
var getMissingParams = require('./getMissingParams');
var formatInputBody  = require('./formatInputBody');
const interceptAfterSuccess = require('./interceptAfterSuccess');
const logger = require('../logger');


module.exports = function (message, threadneedle, connectorConfig) {

	// Add the connector to the falafel global if not already there.
	var connectorName = camelCase(connectorConfig.name);
	falafel[connectorName] = falafel[connectorName] || {};


	logger.info('yolo', { name: connectorConfig.name });

	// Nice method names only please
	var methodName = camelCase(message.name);

	//camelCasing loses the hash, so add it back if it was in the original name
	if (message.name[0] === '#') {
		methodName = '#' + methodName;
	}

	//Intercept afterSuccess
	message = interceptAfterSuccess(message);

	// Add the threadneedle method
	threadneedle.addMethod(methodName, message.model, message.afterHeaders);

	/*	Add the threadneedle method to the falafel global -
		The falafel version of the operation should expose only
		the body part of the response	*/
	falafel[connectorName][methodName] = function (params) {
		return when.promise(function (resolve, reject) {

			function getBody (resolver) {
				return function (response) {
					logger.info('get body called');
					resolver(response.body);
				};
			}

			threadneedle[methodName](params)

			.done(getBody(resolve), getBody(reject));

		});
	};

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
					headers: {},
					body: {
						code: '#user_input_error',
						message: 'The following required parameters are missing: ' + missingParams.join(', ')
					}
				});

			} else {   // Otherwise run the method

				var body = formatInputBody(event.body, message.schema);

				threadneedle[methodName](body)

				.done(resolve, reject);

			}

		});
	};

};
