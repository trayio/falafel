/*
* Given our simplified superset of the JSON schema in JavaScript,
* generate an actual JSON schema.
*/
var _            = require('lodash');
var sentenceCase = require('mout/string/sentenceCase');
var uncamelCase  = require('mout/string/uncamelCase');


module.exports = function (config) {
	return generateSchema(config);
};

// Separate function down here so it can recursively call itself
function generateSchema(config) {

	var schema = {
		$schema: "http://json-schema.org/draft-04/schema#",
    type: "object",
    properties: {}
	};

	// console.log('config', config);

	// Set variables as required
	var inputKeys = _.keys(config);
	schema.required = _.filter(inputKeys, function (key) {
		var messageInput = schema[key];
		return (_.isObject(messageInput) && messageInput.required === true);
	});	

	// Set variables as advanced
	var inputKeys = _.keys(config);
	schema.advanced = _.filter(inputKeys, function (key) {
		var messageInput = config[key];
		return (_.isObject(messageInput) && messageInput.advanced === true);
	});	

	// Add the variables in
	_.each(config, function (param, key) {
		var newParam = {};

		// Recursively generate the schema for objects
		if (param.type === 'object') {
			newParam = generateSchema(param.properties || {});
		}

		// Add in all the fluff
		_.extend(newParam, _.pick(param, [
			'type',
			'name',
			'title',
			'description',
			'default',
			'enum',
			'additionalProperties',
			'additionalItems'
		]));

		// Un camelcase the default jsonpath
		if (param.defaultJsonPath) {
			newParam.default_jsonpath = param.defaultJsonPath;
		}

		// Make a pretty title if not explicitly defined
		if (!newParam.title) {
			newParam.title = sentenceCase(uncamelCase(key).replace(/_|-/g, ' '));
		}

		// Default to no additional properties
		if (newParam.type === 'object' && !_.isBoolean(newParam.additionalProperties)) {
			newParam.additionalProperties = false;
		}

		// ... and arrays
		if (param.type === 'array' && _.isObject(param.items)) {
			newParam.items = generateSchema(param.items || {});
			if (!_.isBoolean(newParam.additionalItems)) {
				newParam.additionalItems = true;
			}
		}
		
		schema.properties[key] = newParam;
	});

	return schema;

}