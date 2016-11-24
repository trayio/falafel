/*
* Given our simplified superset of the JSON schema in JavaScript,
* generate an actual JSON schema.
*/
var _            = require('lodash');
var prettyTitle  = require('./prettyTitle');

//Standard supported keys
var supportedKeys = [
	'type',
	'title',
	'enum',
	'oneOf',
	'name',
	'default',
	'description',
	'lookup',
	'format'
];

module.exports = function (rawSchema) {
	var schema = generateSchema(rawSchema);
	//Since $schema is only required at root level, assign it here.
	schema.$schema = "http://json-schema.org/draft-04/schema#";
	 // Standard restriction: top level schema never allows for additional properties
	schema.additionalProperties = false;
	return schema;
};

//Generates the whole schema for a given  (but not necessarily the schema of a object value)
function generateSchema(rawSchema) {

	var schema = {
	    type: "object",
	    properties: {},
		required: [],
		advanced: []
	};

	//Set required and advanced variables respectively
	_.forEach(rawSchema, function (valObj, key) {
		if (_.isObject(valObj)) {
			if (valObj.required === true) schema.required.push(key);
			if (valObj.advanced === true) schema.advanced.push(key);
		}
	});

	// Add the variables in
	_.each(rawSchema, function (rawObject, key) {
		schema.properties[key] = generateSchemaObject(rawObject, prettyTitle(key));
	});

	return schema;

}

//The generation of a schema object is seperate, so that selective recursion can be applied
function generateSchemaObject(rawObject, title) {

	var validObject = {};

	//If type is object, recurse via generateSchema and set additionalProperties
	if (rawObject.type === 'object') {
		validObject = generateSchema(rawObject.properties || {}); //Recurse from generateSchema
		var additionalProperties = rawObject.additionalProperties;
		validObject.additionalProperties = ( _.isBoolean(additionalProperties) || _.isObject(additionalProperties)  ? additionalProperties : false );
	}

	//Copy over all valid properties existing in the rawObject
	_.extend(
		validObject,
		_.pick(
			rawObject,
			( validObject.type !== 'array' ? supportedKeys : supportedKeys.concat([ 'timeout_millis' ]) ) //Extend supportedKeys if not an array
		)
	);

	// Un camelcase the default jsonpath
	if (rawObject.defaultJsonPath)
		validObject.default_jsonpath = rawObject.defaultJsonPath;

	//Set title if possible
	if (!validObject.title && (rawObject.name || title))
		validObject.title = prettyTitle(rawObject.name) || title;

	//If type is array, recurse via generateSchemaObject and set additionalItems
	if ( rawObject.type === 'array' && _.isObject(rawObject.items) ) {
		validObject.items = generateSchemaObject(rawObject.items, rawObject.items.title || "Item"); //Recurse from generateSchemaObject
		var additionalItems = rawObject.additionalItems;
		validObject.additionalItems = ( _.isBoolean(additionalItems) ? additionalItems : true);
	}

	//If oneOf, process each object in the array
	if (_.isArray(rawObject['oneOf'])){
		//This reduce does filter and map in one go
		validObject['oneOf'] = _.reduce(rawObject['oneOf'], function (acc, rawOneOfObject, key) {
			var processedObject = generateSchemaObject(rawOneOfObject);
			if (!_.isEmpty(processedObject)) {
				processedObject.title = rawOneOfObject.title || prettyTitle(rawOneOfObject.name) || 'Item ' + acc.length;
				acc.push(processedObject);
			};
			return acc;
		}, []);
	}

	return validObject;

}
