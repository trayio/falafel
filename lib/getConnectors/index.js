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

	console.log('getting model: global');


	connector.globalModel = getGlobalModel(config);


	// console.log(connector.globalModel);


	connector.globalSchema = {}; // for now! 


	connector.messages = _.map(config.operations, function (operation) {

		var message = {
			name: operation.name
		};

		console.log('getting model:' + operation.name);
		message.model = getModel(operation);

		// console.log(operation.input_schema);

		message.schema = operation.input_schema;

		return message;

	});


	return [ connector ];


};
