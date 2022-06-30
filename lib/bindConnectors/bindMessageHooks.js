var Threadneedle 		= require('@trayio/threadneedle');
var _ 					= require('lodash');

const { camelCase }  = require('../utils/mout');
var bindMessage         = require('./bindMessage');
var bindDynamicOutput   = require('./bindDynamicOutput');
var bindTriggerRequest  = require('./bindTriggerRequest');
var bindTriggerResponse = require('./bindTriggerResponse');

function formatOperationName (name) {
	var methodName = camelCase(name);
	//camelCasing loses the hash, so add it back if it was in the original name
	if (name[0] === '#') {
		methodName = '#' + methodName;
	}
	return methodName;
}

module.exports = function (config, options) {

	// Internal-only message function handlers. Exactly the same as
	// falafel[connectorName][methodName](), but only set for use below
	// in the handler.
	var messageHooks = {};

	// For each connector, bind all the messages. Note that we can't
	// have a conflict in namings.
	_.each(config, function (connectorConfig) {

		var connectorName = camelCase(connectorConfig.name);

		// Declare threadneedle global config for the connector
		var threadneedle = new Threadneedle(connectorConfig.globalModel.soap || false);
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
				var requestOpName = message.name + '_request';
				messageHooks[requestOpName] = bindTriggerRequest(message, options);
				if (options.test) {
					falafel[connectorName][formatOperationName(requestOpName)] = messageHooks[requestOpName];
				}
			}

			if (_.isFunction(message.response)) {
				var responseOpName = message.name + '_response';
				messageHooks[responseOpName] = bindTriggerResponse(message, options);
				if (options.test) {
					falafel[connectorName][formatOperationName(responseOpName)] = messageHooks[responseOpName];
				}
			}

			if (_.isFunction(message.dynamicOutput)) {
				var dynamicOutputOpName = message.name + '_output_schema';
				messageHooks[dynamicOutputOpName] = bindDynamicOutput(message, options);
				if (options.test) {
					falafel[connectorName][formatOperationName(dynamicOutputOpName)] = messageHooks[dynamicOutputOpName];
				}
			}

		});

	});

	return messageHooks;

};
