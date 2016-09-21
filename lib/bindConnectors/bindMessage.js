var when             = require('when');
var camelCase        = require('mout/string/camelCase');
var _ 				       = require('lodash');
var getMissingParams = require('./getMissingParams');


module.exports = function (message, threadneedle, connectorConfig) {

  // console.log('Adding connector message:', message.name);

  // Add the connector to the falafel global if not already there.
  var connectorName = camelCase(connectorConfig.name);
  falafel[connectorName] = falafel[connectorName] || {};

	// Nice method names only please
	var methodName = camelCase(message.name);

	// Add the threadneedle method
	threadneedle.addMethod(methodName, message.model);

  // Add the threadneedle method to the falafel global
  falafel[connectorName][methodName] = threadneedle[methodName];

	// Bind the method to the internal handler object - this is how the connector
	// processes the inbound messages below.
	return function (event) {
		return when.promise(function (resolve, reject) {

			var missingParams = getMissingParams(event.body, message.schema, connectorConfig.globalSchema);

			// If missing parameters, error before sending the API call
			if (missingParams.length) {
				return reject({
					code: 'invalid_input',
					message: 'The following required parameters are missing: ' + missingParams.join(', ')
				});
			}

			// Otherwise run the method
			else {
				threadneedle[methodName](event.body).done(function (result) {
          resolve({
            body: result
          });
        }, reject);
			}

		});
	};

};
