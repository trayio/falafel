/*
* Parse connector config, as specified in the `config.json` file, or the 
* `test_config` payload sent from the cluster service.
*/
var _ 					= require('lodash');
var getGlobalModel 		= require('./getGlobalModel');
var getModel 			= require('./getModel');


module.exports = function (config) {

	if (_.isString(config)) {
		try {
			config = JSON.parse(config);
		} catch (e) {
			throw new Error('Failed to parse connector test data.');
		}
	}


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
			required: operation.inputSchema.required || [],
			advanced: operation.inputSchema.advanced || [],
		};

		return message;

	});


	return [ connector ];

};