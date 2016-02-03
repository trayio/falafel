/*
* Get a fully list of all the connectors and the configuration
* attached to all of them. No validation at this stage, just get 
* the data out from the filesystem.
*/
var _ 	 					 = require('lodash');
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
			connector.name = connector.name || connectorDirectory; // default to directory name
		} else {
			connector = {};
		}

		// Add the messages
		var messages = getDirectories(directory+'/connectors/'+connectorDirectory);

		connector.messages = _.map(messages, function (message) {

			var messageDir = directory+'/connectors/'+connectorDirectory+'/'+message

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

			return output;

		});


		return connector;

	});

	return connectors;

};




