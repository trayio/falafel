/*
* Given the connectors config, fully bind all of the operations in-line
* with the node connector sdk. Throws error if validations fail. We don't
* wanna be starting a server with invalid config.
*/
var util 					   = require('util');
var _ 					     = require('lodash');
var TrayConnector    = require('trayio-connector-sdk');
var Threadneedle     = require('@trayio/threadneedle');
var camelCase 			 = require('mout/string/camelCase');
var bindHealthCheck  = require('./bindHealthCheck');
var bindMessage      = require('./bindMessage');
var bindTrigger 		 = require('./bindTrigger');


module.exports = function (config) {
	// console.log(util.inspect(config, false, null));

	// Create a connector. Note that although a connector app can contain
	// many connectors, they're only one instance and one app.
	var connector = new TrayConnector({});
	
	// add a generic health check method
	bindHealthCheck(connector);


	// For each connector, bind all the messages. Note that we can't
	// have a conflict in namings.
	_.each(config, function (connectorConfig) {

		console.log('Binding connector:', connectorConfig.name);

		// Declare threadneedle global config for the connector
		var threadneedle = new Threadneedle();
		threadneedle.global(connectorConfig.globalModel);

		// Add the connector to the falafel global - methods will be added
		falafel[connectorConfig.name] = {};


		// Bind each message
		_.each(connectorConfig.messages || [], function (message) {

			bindMessage(message, threadneedle, connector);

			// Add the threadneedle method to the falafel global
			var methodName = camelCase(message.name);
			falafel[connectorConfig.name][methodName] = threadneedle[methodName];

		});


		// Bind trigger message if declared
		if (_.isFunction(connectorConfig.trigger)) {
			bindTrigger(connectorConfig.trigger, connector);
		}
	
	});



};