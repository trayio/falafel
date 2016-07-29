/*
* Given our simplified superset of the JSON schema in JavaScript,
* generate an actual JSON schema.
*/
var _            = require('lodash');
var prettyTitle  = require('./prettyTitle');


module.exports = function (config) {
	return generateSchema(config, true);
};

// Separate function down here so it can recursively call itself
function generateSchema(config, topLevel) {

	var schema = {
    type: "object",
    properties: {}
	};

	if (topLevel === true) {
		schema.$schema = "http://json-schema.org/draft-04/schema#";
	}


	var inputKeys = _.keys(config);

	// Set variables as required
	schema.required = _.filter(inputKeys, function (key) {
		var messageInput = config[key];
		return (_.isObject(messageInput) && messageInput.required === true);
	});

	// Set variables as advanced
	schema.advanced = _.filter(inputKeys, function (key) {
		var messageInput = config[key];
		return (_.isObject(messageInput) && messageInput.advanced === true);
	});

	// Standard restriction: top level schema never allows for additional properties
	schema.additionalProperties = false;

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
			'additionalItems',
			'format',
			'timeout_millis',
      'lookup'
		]));

		// Un camelcase the default jsonpath
		if (param.defaultJsonPath) {
			newParam.default_jsonpath = param.defaultJsonPath;
		}

		// Make a pretty title if not explicitly defined
		if (!newParam.title) {
			newParam.title = prettyTitle(newParam.name || key);
		}

		// Default to no additional properties
		if (newParam.type === 'object' && !_.isBoolean(newParam.additionalProperties)) {
			newParam.additionalProperties = false;
		}

		// ... and arrays
		if (param.type === 'array' && _.isObject(param.items)) {

			var itemsKeys = [
				'type',
				'title',
				'enum',
				'name',
				'default',
				'description',
				'lookup'
			];

			// Get the type for the item config
			newParam.items = _.pick(param.items, itemsKeys);

			// If the item is an object we'll also need to recursively generate more of a schema
			if (param.items.type === 'object') {
				_.extend(newParam.items, generateSchema(param.items.properties || {}));
				if (_.isBoolean(param.items.additionalProperties)) {
					newParam.items.additionalProperties = param.items.additionalProperties;
				}
			}

			// If the item is an array then we need to go one level deeper
			if (param.items.type === 'array') {
				param.items.items || {};
				newParam.items.items = _.pick(param.items.items, itemsKeys);
				if (param.items.items.type === 'object') {
					_.extend(newParam.items.items, generateSchema(param.items.items.properties || {}));
					if (_.isBoolean(param.items.items.additionalProperties)) {
						newParam.items.items.additionalProperties = param.items.items.additionalProperties;
					}
				}
			}

			// Make a pretty title for the items if not explicitly defined
			if (!newParam.items.title) {
				newParam.items.title = prettyTitle(newParam.items.name || 'items');
			}

			if (!_.isBoolean(newParam.additionalItems)) {
				newParam.additionalItems = true;
			}
		}

		schema.properties[key] = newParam;
	});

	return schema;

}
