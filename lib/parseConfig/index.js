/*
* Parse connector config, as specified in the `config.json` file, or the 
* `test_config` payload sent from the cluster service.
*/
var _ 					= require('lodash');
var getGlobalModel 		= require('./getGlobalModel');
var getModel 			= require('./getModel');

module.exports = function (config) {

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

		// create the schema.js equivalent directly from the input schema. 
		// The only things that need passing are the name and properties 
		// - used for required variable checking, and auto date formatting.
		message.schema = {
			name: operation.name,
			input: operation.inputSchema.properties,
		};

		return message;

	});


	return [ connector ];

};