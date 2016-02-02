/*
* Given the connectors config, fully bind all of the operations in-line
* with the node connector sdk. Throws error if validations fail. We don't
* wanna be starting a server with invalid config.
*/
var util 					= require('util');
var _ 					  = require('lodash');
var camelCase 		= require('mout/string/camelCase');
var TrayConnector = require('trayio-connector-sdk');
var Threadneedle  = require('@trayio/threadneedle');


module.exports = function (config) {
	// console.log(util.inspect(config, false, null));

	var connector    = new TrayConnector({});
	var threadneedle = new Threadneedle();


	// add a generic health check method
	connector.onHealthCheck(function(reply) {
		reply('healthy');
	});

	// For each connector, bind all the messages. Note that we can't
	// have a conflict in namings.
	_.each(config, function (connectorConfig) {

		// console.log('binding for', connectorConfig.name);

		// Bind each message
		_.each(connectorConfig.messages || [], function (message) {
			// console.log(message);

			// Nice method names only please
			var methodName = camelCase(message.schema.name);

			// Add the threadneedle method
			threadneedle.addMethod(methodName, message.model);

			// TODO pre-validate required parameters against the schema
			// using Ali's built in SDK or similar
			var requiredKeys = [];
			_.each(message.schema.input, function (obj, key) {
				if (obj.required === true) {
					requiredKeys.push(key);
				}
			});

			// And then wrap it into a connector SDK function
			connector.on(
				message.schema.name, 
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

						error(err.code || 'api_error', err.message, data);
					});

			}));


		});

	});



};