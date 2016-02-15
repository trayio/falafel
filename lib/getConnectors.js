/*
* Get a fully list of all the connectors and the configuration
* attached to all of them. No validation at this stage, just get 
* the data out from the filesystem.
*/
var _ 	 					 = require('lodash');
var util 				   = require('util');
var getFiles 			 = require('./utils/getFiles');
var getDirectories = require('./utils/getDirectories');


module.exports = function (directory) {

	var connectors;

	// Get all the directories within the `connectors` folder. Usually
	// one, except when there's also a trigger connector.
	var connectorDirectories = getDirectories(directory+'/connectors');


	connectors = _.map(connectorDirectories, function (connectorDirectory) {

		var connector;

		// Require the connector file
		var result = getFiles(directory+'/connectors/'+connectorDirectory);
		if (result.indexOf('connector.js') !== -1) {
			connector = require(directory+'/connectors/'+connectorDirectory+'/connector');
		} else {
			connector = {};
		}

		// default to directory name
		connector.name = connector.name || connectorDirectory; 

		// Add the global file
		if (result.indexOf('global.js') !== -1) {
			connector.global = require(directory+'/connectors/'+connectorDirectory+'/global');
		} else {
			connector.global = {};
		}

		// Add the trigger file (if declared)
		if (result.indexOf('trigger.js') !== -1) {
			connector.trigger = require(directory+'/connectors/'+connectorDirectory+'/trigger');
		}

		// Add the messages
		var messages = getDirectories(directory+'/connectors/'+connectorDirectory);

		connector.messages = _.map(messages, function (message) {

			var messageDir = directory+'/connectors/'+connectorDirectory+'/'+message;

			var files = getFiles(messageDir);

			var output = {};

			// Add the model
			if (files.indexOf('model.js') !== -1) {
				output.model = require(messageDir+'/model');
			}

			// Add the schema
			if (files.indexOf('schema.js') !== -1) {
				output.schema = require(messageDir+'/schema');
				output.schema.name = output.schema.name || message;
				if (files.indexOf('response.sample.json') !== -1) {
					output.schema.responseSample = require(messageDir+'/response.sample.json');
				}
			}

			// Set the name on the top level
			if (output.schema && output.schema.name) {
				output.name = output.schema.name;
			} else {
				output.name = message;
			}


			return output;

		});


		return connector;

	});

	// console.log(util.inspect(connectors, false, null));


	return connectors;

};




