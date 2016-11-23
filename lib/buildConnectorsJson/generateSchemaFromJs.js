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
	var schema = generateSchema(rawSchema, true);
	//Since $schema is only required at root level, assign it here.
	schema['$schema'] = "http://json-schema.org/draft-04/schema#";
	 // Standard restriction: top level schema never allows for additional properties
	schema['additionalProperties'] = false;
	return schema;
};

//Generates the whole schema for a given  (but not necessarily the schema of a object value)
function generateSchema(rawSchema, topLevel) {

	var schema = {
	    type: "object",
	    properties: {},
		required: []
	};

	//Advanced only need for top level
	if (topLevel) schema.advanced = [];

	//Set required and advanced variables respectively
	_.forEach(rawSchema, function (valObj, key) {
		if (_.isObject(valObj)) {
			if (valObj.required === true) schema.required.push(key);
			if (topLevel && valObj.advanced === true) schema.advanced.push(key);
		}
	});

	// Add the variables in
	_.each(rawSchema, function (rawObject, key) {
		schema.properties[key] = generateSchemaObject(rawObject, key);
	});

	return schema;

}

//The generation of a schema object is seperate, so that selective recusion can be applied
function generateSchemaObject(rawObject, title) {
	var validObject = {};

	//If type is object, recurse via generateSchema and set additionalProperties
	if (rawObject.type === 'object') {
		validObject = generateSchema(rawObject.properties || {}, false); //Recurse from generateSchema
		var aP = rawObject.additionalProperties;
		validObject.additionalProperties = ( _.isBoolean(aP) || _.isObject(aP)  ? aP : false );
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

	//Set title
	if (!validObject.title)
		validObject.title = prettyTitle(rawObject.name || title);

	//If type is array, recurse via generateSchemaObject and set additionalItems
	if ( rawObject.type === 'array' && _.isObject(rawObject.items) ) {
		validObject.items = generateSchemaObject(rawObject.items, rawObject.items.tittle || "Item"); //Recurse from generateSchemaObject
		var aI = rawObject.additionalItems;
		validObject.additionalItems = ( _.isBoolean(aI) ? aI : true);
	}

	return validObject;

}
