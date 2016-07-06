/*
* Given the connectors config, fully bind all of the operations in-line
* with the node connector sdk. Throws error if validations fail. We don't
* wanna be starting a server with invalid config.
*/
var util 					     = require('util');
var _ 					       = require('lodash');
var when 						   = require('when');
var Threadneedle       = require('@trayio/threadneedle');
var camelCase 			   = require('mout/string/camelCase');
var bindMessage        = require('./bindMessage');
var bindTriggerRequest = require('./bindTriggerRequest');
var formatError 		   = require('./formatError');
var formatMessage      = require('./formatMessage');


module.exports = function (config) {
	// console.log(util.inspect(config, false, null));

	// Internal-only message function handlers. Exactly the same as
	// falafel[connectorName][methodName](), but only set for use below
	// in the handler.
	var messageHooks = {};

	// For each connector, bind all the messages. Note that we can't
	// have a conflict in namings.
	_.each(config, function (connectorConfig) {

		console.log('Binding connector:', connectorConfig.name);

		// Declare threadneedle global config for the connector
		var threadneedle = new Threadneedle();
		threadneedle.global(connectorConfig.globalModel);

		// Bind each message
		_.each(connectorConfig.messages || [], function (message) {

			// Add the message into threadneedle
			messageHooks[message.name] = bindMessage(message, threadneedle, connectorConfig);

			// var possibleSubMessages = _.pick(message, ['model', 'request', 'response', 'destroy']);
			if (_.isFunction(message.destroy) || _.isObject(message.destroy)) {
				var destroyMessageName = message.name+'_destroy';
				messageHooks[destroyMessageName] = bindMessage(_.defaults({
					name: destroyMessageName
				}, message), threadneedle, connectorConfig);
			}

			if (_.isFunction(message.request) || _.isObject(message.request)) {
				messageHooks[message.name+'_request'] = bindTriggerRequest(message);
			}

			//
			// // Bind the method to the internal handler object - this is how the connector
			// // processes the inbound messages below.
			// // TODO Also add a required variables checker
			// messageHooks[message.name] = function (event) {
			// 	return when.promise(function (resolve, reject) {
			//
			// 		var missingParams = getMissingParams(event.body, message.schema, connectorConfig.globalSchema);
			//
			// 		// If missing parameters, error before sending the API call
			// 		if (missingParams.length) {
			// 			return reject({
			// 				code: 'invalid_input',
			// 				message: 'The following required parameters are missing: ' + missingParams.join(', ')
			// 			});
			// 		}
			//
			// 		// Otherwise run the method
			// 		else {
			// 			threadneedle[methodName](event.body).done(resolve, reject);
			// 		}
			//
			// 	});
			// };


			// Also bind the possible extra messages
			// _.each(['request', 'response', 'destroy'], function (extra) {
			//
			// 	if (message[extra]) {
			// 		console.log('got', extra, message[extra]);
			// 		messageHooks[message.name+'_'+extra] =
			// 	} else {
			// 		console.log('not got', extra)
			// 	}
			//
			// });

		});

		// TODO: Bind trigger message if declared
		// if (_.isFunction(connectorConfig.trigger)) {
		// 	bindTrigger(connectorConfig.trigger, connector);
		// }

	});


	// Return a message handler function. This is what is exported
	// at the top level.
	return function (events, context, callback) {

		// The array of events should all be executed in parallel
		var promises = _.map(events, function (event) {
			return when.promise(function (resolve, reject) {

				var output;

				// Handle error invalid payload
				if (!event.header || !event.header.message) {
					resolve(formatError({
						code: 'invalid_input',
						message: 'Invalid message received.'
					}, event));
				}

				// If it's a trigger,

				// Handle message not existing
				else if (!_.isFunction(messageHooks[event.header.message])) {
					resolve(formatError({
						code: 'not_implemented',
						message: 'Could not find a valid message handler for ' + event.header.message
					}, event));
				}

				// All good, let's run
				else {

					// NOTE: we actually need try catch as when.js
					// promises catch errors in the reject anyway.

					// Run the API call, and respond with the appropriate stuff
					messageHooks[event.header.message](event).done(function (response) {
						resolve(formatMessage(response, event, response));
					}, function (err) {
						resolve(formatError(err, event));
					});


				}
			});
		});

		// Wait for all of the above to finish, then resolve
		when.all(promises).done(function (result) {
			callback(null, result);
		}, function (err) {
			callback(err, []);
		});

	};

};
