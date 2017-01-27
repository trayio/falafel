/*
* Given the connectors config, fully bind all of the operations in-line
* with the node connector sdk. Throws error if validations fail. We don't
* wanna be starting a server with invalid config.
*/
var util 					      = require('util');
var _ 					        = require('lodash');
var when 						    = require('when');
var Threadneedle        = require('@trayio/threadneedle');
var camelCase 			    = require('mout/string/camelCase');
var bindMessage         = require('./bindMessage');
var bindDynamicOutput         = require('./bindDynamicOutput');
var bindTriggerRequest  = require('./bindTriggerRequest');
var bindTriggerResponse = require('./bindTriggerResponse');
var formatError 		    = require('./formatError');
var formatMessage       = require('./formatMessage');


module.exports = function (config, options) {
	// console.log(util.inspect(config, false, null));

	// Internal-only message function handlers. Exactly the same as
	// falafel[connectorName][methodName](), but only set for use below
	// in the handler.
	var messageHooks = {};

	// For each connector, bind all the messages. Note that we can't
	// have a conflict in namings.
	_.each(config, function (connectorConfig) {

		// console.log('Binding connector:', connectorConfig.name);

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
					name: destroyMessageName,
					model: message.destroy
				}, message, options), threadneedle, connectorConfig);
			}

			if (_.isFunction(message.request) || _.isObject(message.request)) {
				messageHooks[message.name+'_request'] = bindTriggerRequest(message, options);
			}

			if (_.isFunction(message.response)) {
				messageHooks[message.name+'_response'] = bindTriggerResponse(message, options);
			}

			if (_.isFunction(message.dynamicOutput)) {
				messageHooks[message.name + '_dynamic_output'] = bindDynamicOutput(message, options);
			}

		});


	});
	console.log(messageHooks);

	// Return a message handler function. This is what is exported
	// at the top level.
	return function (events, context, callback) {

		// Dont wait for event loop to be empty when callback is called
		context.callbackWaitsForEmptyEventLoop = false;

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
					messageHooks[event.header.message](event)

					.done(
						function (response) {
							resolve(formatMessage(event, response.body, response.version));
						}, function (err) {
							resolve(formatError(err, event));
						}
					);


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
