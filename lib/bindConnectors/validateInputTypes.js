/*
 * Validates input values against their schema type definitions.
 * 
 * This module catches type mismatches that JavaScript's dynamic typing
 * would otherwise allow to slip through to production.
 * 
 * Validates:
 * - Value types match schema type declarations
 * - Default values match their declared types
 * - Enum values are valid
 * - Nested object and array item types
 */

var _ = require('lodash');

/**
 * Type checking functions for JSON Schema types
 */
var typeCheckers = {
	string: function (value) {
		return typeof value === 'string';
	},
	number: function (value) {
		return typeof value === 'number' && !isNaN(value);
	},
	integer: function (value) {
		return typeof value === 'number' && Number.isInteger(value) && !isNaN(value);
	},
	boolean: function (value) {
		return typeof value === 'boolean';
	},
	array: function (value) {
		return Array.isArray(value);
	},
	object: function (value) {
		return value !== null && typeof value === 'object' && !Array.isArray(value);
	},
	null: function (value) {
		return value === null;
	}
};

/**
 * Check if a value matches a given type or array of types
 * @param {*} value - The value to check
 * @param {string|string[]} type - The type(s) to check against
 * @returns {boolean} - Whether the value matches the type
 */
function matchesType(value, type) {
	if (_.isUndefined(value)) {
		return true; // undefined values are handled by required validation
	}

	var types = _.isArray(type) ? type : [type];

	return types.some(function (t) {
		var checker = typeCheckers[t];
		return checker ? checker(value) : true; // unknown types pass
	});
}

/**
 * Get a human-readable type name for a value
 * @param {*} value - The value to describe
 * @returns {string} - The type name
 */
function getActualType(value) {
	if (value === null) return 'null';
	if (Array.isArray(value)) return 'array';
	return typeof value;
}

/**
 * Format type for error messages
 * @param {string|string[]} type - The type(s)
 * @returns {string} - Formatted type string
 */
function formatType(type) {
	if (_.isArray(type)) {
		return type.join(' | ');
	}
	return type;
}

/**
 * Extract actual values from enum definitions
 * Handles both simple values and {text, value} objects used in Tray.io connectors
 * @param {Array} enumDef - The enum definition
 * @returns {Array} - Array of actual enum values
 */
function getEnumValues(enumDef) {
	if (!_.isArray(enumDef)) {
		return [];
	}
	
	return enumDef.map(function(item) {
		// Handle {text, value} object format
		if (_.isObject(item) && !_.isUndefined(item.value)) {
			return item.value;
		}
		return item;
	});
}

/**
 * Validate a single value against its schema property definition
 * @param {*} value - The value to validate
 * @param {Object} schemaProperty - The schema property definition
 * @param {string} path - The path to this property (for error messages)
 * @returns {string[]} - Array of validation error messages
 */
function validateValue(value, schemaProperty, path) {
	var errors = [];

	if (!schemaProperty || _.isUndefined(value)) {
		return errors;
	}

	var type = schemaProperty.type;

	// Skip validation if no type is defined
	if (!type) {
		return errors;
	}

	// Type validation
	if (!matchesType(value, type)) {
		errors.push(
			'Type mismatch at "' + path + '": expected ' + formatType(type) +
			', got ' + getActualType(value) + ' (' + JSON.stringify(value) + ')'
		);
		return errors; // Don't continue validation if type is wrong
	}

	// Enum validation
	if (schemaProperty.enum && !_.isUndefined(value)) {
		var enumValues = getEnumValues(schemaProperty.enum);
		if (!enumValues.includes(value)) {
			errors.push(
				'Invalid enum value at "' + path + '": got ' + JSON.stringify(value) +
				', expected one of: ' + enumValues.map(function(v) { return JSON.stringify(v); }).join(', ')
			);
		}
	}

	// Nested object validation
	if (type === 'object' || (_.isArray(type) && type.includes('object'))) {
		if (_.isObject(value) && !_.isArray(value) && schemaProperty.properties) {
			_.each(value, function (nestedValue, nestedKey) {
				var nestedSchema = schemaProperty.properties[nestedKey];
				if (nestedSchema) {
					var nestedErrors = validateValue(nestedValue, nestedSchema, path + '.' + nestedKey);
					errors = errors.concat(nestedErrors);
				}
			});
		}
	}

	// Array items validation
	if ((type === 'array' || (_.isArray(type) && type.includes('array'))) && _.isArray(value)) {
		var itemsSchema = schemaProperty.items;
		if (itemsSchema) {
			value.forEach(function (item, index) {
				var itemSchema = _.isArray(itemsSchema) ? itemsSchema[index] : itemsSchema;
				if (itemSchema) {
					var itemErrors = validateValue(item, itemSchema, path + '[' + index + ']');
					errors = errors.concat(itemErrors);
				}
			});
		}
	}

	return errors;
}

/**
 * Validate default values in a schema match their declared types
 * @param {Object} schemaInput - The schema input definition
 * @param {string} [prefix=''] - Path prefix for error messages
 * @returns {string[]} - Array of validation error messages
 */
function validateSchemaDefaults(schemaInput, prefix) {
	var errors = [];
	prefix = prefix || '';

	_.each(schemaInput, function (schemaProperty, key) {
		var path = prefix ? prefix + '.' + key : key;

		if (!schemaProperty || !schemaProperty.type) {
			return;
		}

		// Validate default value type
		if (!_.isUndefined(schemaProperty.default)) {
			if (!matchesType(schemaProperty.default, schemaProperty.type)) {
				errors.push(
					'Schema default type mismatch at "' + path + '": ' +
					'schema declares type ' + formatType(schemaProperty.type) +
					', but default value is ' + getActualType(schemaProperty.default) +
					' (' + JSON.stringify(schemaProperty.default) + ')'
				);
			}
		}

		// Validate default against enum
		if (!_.isUndefined(schemaProperty.default) && schemaProperty.enum) {
			var enumValues = getEnumValues(schemaProperty.enum);
			if (!enumValues.includes(schemaProperty.default)) {
				errors.push(
					'Schema default enum mismatch at "' + path + '": ' +
					'default value ' + JSON.stringify(schemaProperty.default) +
					' is not in enum: ' + enumValues.map(function(v) { return JSON.stringify(v); }).join(', ')
				);
			}
		}

		// Recursively validate nested object properties
		if (schemaProperty.type === 'object' && schemaProperty.properties) {
			var nestedErrors = validateSchemaDefaults(schemaProperty.properties, path);
			errors = errors.concat(nestedErrors);
		}

		// Validate array items schema defaults
		if (schemaProperty.type === 'array' && schemaProperty.items) {
			if (_.isArray(schemaProperty.items)) {
				schemaProperty.items.forEach(function (itemSchema, index) {
					var itemErrors = validateSchemaDefaults({ item: itemSchema }, path + '.items[' + index + ']');
					errors = errors.concat(itemErrors);
				});
			} else if (_.isObject(schemaProperty.items)) {
				var itemErrors = validateSchemaDefaults({ item: schemaProperty.items }, path + '.items');
				errors = errors.concat(itemErrors);
			}
		}
	});

	return errors;
}

/**
 * Validate input parameters against schema type definitions
 * @param {Object} params - The input parameters to validate
 * @param {Object} messageSchema - The message schema
 * @param {Object} globalSchema - The global schema
 * @returns {string[]} - Array of validation error messages
 */
function validateInputTypes(params, messageSchema, globalSchema) {
	var errors = [];

	// Combine schemas for validation
	var combinedInput = {};

	if (globalSchema && globalSchema.input) {
		_.assign(combinedInput, globalSchema.input);
	}

	if (messageSchema && messageSchema.input) {
		_.assign(combinedInput, messageSchema.input);
	}

	// Validate each parameter
	_.each(params, function (value, key) {
		var schemaProperty = combinedInput[key];
		if (schemaProperty) {
			var valueErrors = validateValue(value, schemaProperty, key);
			errors = errors.concat(valueErrors);
		}
	});

	return errors;
}

/**
 * Validate schema definitions for type consistency (defaults match types)
 * This should be run at build/test time, not runtime
 * @param {Object} messageSchema - The message schema
 * @param {Object} globalSchema - The global schema
 * @returns {string[]} - Array of validation error messages
 */
function validateSchemaConsistency(messageSchema, globalSchema) {
	var errors = [];

	if (globalSchema && globalSchema.input) {
		var globalErrors = validateSchemaDefaults(globalSchema.input, 'global');
		errors = errors.concat(globalErrors);
	}

	if (messageSchema && messageSchema.input) {
		var messageErrors = validateSchemaDefaults(messageSchema.input);
		errors = errors.concat(messageErrors);
	}

	return errors;
}

module.exports = {
	validateInputTypes: validateInputTypes,
	validateSchemaConsistency: validateSchemaConsistency,
	validateValue: validateValue,
	validateSchemaDefaults: validateSchemaDefaults,
	matchesType: matchesType,
	getActualType: getActualType,
	getEnumValues: getEnumValues
};
