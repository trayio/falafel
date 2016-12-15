/*
* Get a fully list of all the connectors and the configuration
* attached to all of them. No validation at this stage, just get
* the data out from the filesystem.
*/
var _ 	 					 = require('lodash');
var util 				   = require('util');
var fs 				 		 = require('fs');
var getFiles 			 = require('../utils/getFiles');
var getDirectories = require('../utils/getDirectories');


module.exports = function (directory) {

	var connectors;

	// Get all the directories within the `connectors` folder. Usually
	// one, except when there's also a trigger connector.
	var connectorDirectories = getDirectories(directory+'/connectors');


	connectors = _.map(connectorDirectories, function (connectorDirectory) {

		var connector;

		// Require the connector file
		var result = getFiles(directory+'/connectors/'+connectorDirectory);
		connector = (
			result.indexOf('connector.js') !== -1 ?
			require(directory+'/connectors/'+connectorDirectory+'/connector') :
			{}
		);

		// default to directory name
		connector.name = connector.name || connectorDirectory;

		// Add the global model file
		if (result.indexOf('global_model.js') !== -1) {
			connector.globalModel = require(directory+'/connectors/'+connectorDirectory+'/global_model');			// deprecated file name
		} else if (result.indexOf('global.js') !== -1) {
			connector.globalModel = require(directory+'/connectors/'+connectorDirectory+'/global');
		} else {
			connector.globalModel = {};
		}

		// Add the global schema file
		connector.globalSchema = (
			result.indexOf('global_schema.js') !== -1 ?
			require(directory+'/connectors/'+connectorDirectory+'/global_schema') :
			{}
		);

		// Add the trigger file (if declared)
		if (result.indexOf('trigger.js') !== -1)
			connector.trigger = require(directory+'/connectors/'+connectorDirectory+'/trigger');

		// Add the help file (if declared)
		if (result.indexOf('help.md') !== -1)
			connector.help = fs.readFileSync(directory+'/connectors/'+connectorDirectory+'/help.md').toString();

		// Add the messages
		connector.messages = _.map(
			getDirectories(directory + '/connectors/' + connectorDirectory ),
			function (message) {

				var messageDir = directory + '/connectors/' + connectorDirectory + '/' + message;

				var files = getFiles(messageDir);

				var output = {};

				_.forEach(
					[
						'model', 	// Add the model
						'destroy',	// Add the destroy model
						'request',	// Add the request (trigger) handler
						'response'	// Add the response (trigger response from workflow) handler. Nothing to do with the response.sample.json
					],
					function (key) {
						if (files.indexOf( key + '.js' ) !== -1)
							output[key] = require(messageDir + '/' + key);
					}
				);

				// Add the schema
				if (files.indexOf('schema.js') !== -1) {
					output.schema = require(messageDir + '/schema');
					output.schema.name = output.schema.name || message;
					if (files.indexOf('response.sample.json') !== -1)
						output.schema.responseSample = require(messageDir + '/response.sample.json');
				}

				// Set the name on the top level
				output.name = _.get(output, 'schema.name', message);

				return output;

			}
		);


		return connector;

	});

	return connectors;

};
