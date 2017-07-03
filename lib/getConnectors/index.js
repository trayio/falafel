/*
* Get a fully list of all the connectors and the configuration
* attached to all of them. No validation at this stage, just get
* the data out from the filesystem.
*/
var _ 					= require('lodash');
var fs					= require('fs');
var isLegacy 			= require('../utils/isLegacy');
var legacyGetConnectors = require('./legacy');
var getGlobalModel 		= require('./getGlobalModel');
var getModel 			= require('./getModel');


module.exports = function (directory) {

	// LEGACY CONNECTORS - read the connectors from the file system
	if (isLegacy(directory)) {
		return legacyGetConnectors(directory);
	}

	var config = require(directory+'/config.json');

	// console.log(config);


	var connector = _.pick(config, [
		'name',
		'title'
	]);


	connector.globalModel = getGlobalModel(config);

	connector.globalSchema = {}; // for now! 

	connector.messages = _.map(config.operations, function (operation) {

		var message = {
			name: operation.name
		};

		message.model = getModel(operation);

		// create the schema (required for required variables and auto date 
		// formatting)
		message.schema = {
			input: operation.input_schema.properties,
		}

		return message;

	});


	return [ connector ];


};
