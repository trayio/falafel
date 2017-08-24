/*
* Parse connector config, as specified in the `config.json` file, or the 
* `test_config` payload sent from the cluster service.
*/
var _ 					= require('lodash');
var getGlobalModel 		= require('./getGlobalModel');
var getModel 			= require('./getModel');
var normalizeModelParameter = require('./normalizeModelParameter');


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

	// Global schema is now DEPRECATED. Global parameters
	// are now added on the individual message level.
	// The reason for this is because global parameters no 
	// longer have to be universal - they can be optionally 
	// switched off at the operation level via the `excludeGlobalProperties`
	// key.
	connector.globalSchema = {};

	connector.messages = [];

	_.each(config.operations, function (operation) {

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

		var globalSchema = operation.globalSchema || config.schema;

		// Add in the extra global schema properties we should include on the schema level
		var globalProperties = _.omit(globalSchema.properties, operation.excludeGlobalProperties);
		message.schema.input = _.defaults(message.schema.input, globalProperties);

		// Also add in the global schema required parameters for those that are added in
		_.each(globalSchema.required, (requiredKey) => {
			var isExcluded = _.includes(operation.excludeGlobalProperties, requiredKey);
			var notInRequired = !_.includes(message.schema.required, requiredKey);

			if (!isExcluded && notInRequired) {
				message.schema.required.push(requiredKey);
			}
		});


		if (_.isObject(operation.subOperations)) {	
			var subOperations = operation.subOperations;

			if (_.isObject(subOperations.destroy)) {
				message.destroy = getModel(subOperations.destroy);
			}
			if (_.isObject(subOperations.dynamic_output)) {
				message.dynamicOutput = getModel(subOperations.dynamic_output);
			}
			if (_.isObject(subOperations.request)) {
				message.request = normalizeModelParameter(subOperations.request.model);
			}
			if (_.isObject(subOperations.response)) {
				message.response = normalizeModelParameter(subOperations.response.model);
			}
		}
		

		connector.messages.push(message);


	});


	return [ connector ];

};