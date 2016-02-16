var camelCase = require('mout/string/camelCase');
var _ 				= require('lodash');


module.exports = function (message, threadneedle, connector) {

	// console.log(message);
	
	console.log('Adding connector message:', message.name);

	// Nice method names only please
	var methodName = camelCase(message.name);

	// Add the threadneedle method
	threadneedle.addMethod(methodName, message.model);

	// Note: private methods are still bound, they're just not in the connectors.json
	// so not exposed to the UI.

	// TODO pre-validate required parameters against the schema
	// using Ali's built in SDK or similar
	var requiredKeys = [];
	if (message.schema) {
		_.each(message.schema.input || {}, function (obj, key) {
			if (obj.required === true) {
				requiredKeys.push(key);
			}
		});
	}

	// And then wrap it into a connector SDK function
	connector.on(
		message.name, 
		connector.hasRequiredParams(requiredKeys, function (data, done, error) {

			// console.log('running', message.schema.name, data);

			threadneedle[methodName](data)

			// TODO - add some generic validations. E.g. can't 
			// resolve with an array.
			.then(function (result) {
				return result;
			})

			// Pass data directly back to the 
			.done(done, function (err) {
				// TODO - bugsnag in some form
				console.log(err.stack);	

				// Also add the data input for context
				err.input = data;
				
				error(err.code || 'api_error', err.message, err);
			});

	}));

};