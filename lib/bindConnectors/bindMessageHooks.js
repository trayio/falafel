var Threadneedle 		= require('@trayio/threadneedle');
var _ 					= require('lodash');
var bindMessage         = require('./bindMessage');
var bindDynamicOutput   = require('./bindDynamicOutput');
var bindTriggerRequest  = require('./bindTriggerRequest');
var bindTriggerResponse = require('./bindTriggerResponse');


module.exports = function (config, options) {

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
				messageHooks[message.name + '_output_schema'] = bindDynamicOutput(message, options);
			}

		});


	});


	return messageHooks;

};