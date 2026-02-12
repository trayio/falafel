var assert = require('assert');
var validateInputTypes = require('../../lib/bindConnectors/validateInputTypes');

describe('#validateInputTypes', function () {

	describe('matchesType', function () {

		it('should return true for string type with string value', function () {
			assert.strictEqual(validateInputTypes.matchesType('hello', 'string'), true);
		});

		it('should return false for string type with number value', function () {
			assert.strictEqual(validateInputTypes.matchesType(123, 'string'), false);
		});

		it('should return true for number type with number value', function () {
			assert.strictEqual(validateInputTypes.matchesType(123.45, 'number'), true);
		});

		it('should return false for number type with string value', function () {
			assert.strictEqual(validateInputTypes.matchesType('123', 'number'), false);
		});

		it('should return true for integer type with integer value', function () {
			assert.strictEqual(validateInputTypes.matchesType(123, 'integer'), true);
		});

		it('should return false for integer type with float value', function () {
			assert.strictEqual(validateInputTypes.matchesType(123.45, 'integer'), false);
		});

		it('should return false for integer type with string value', function () {
			assert.strictEqual(validateInputTypes.matchesType('123', 'integer'), false);
		});

		it('should return true for boolean type with boolean value', function () {
			assert.strictEqual(validateInputTypes.matchesType(true, 'boolean'), true);
			assert.strictEqual(validateInputTypes.matchesType(false, 'boolean'), true);
		});

		it('should return false for boolean type with string value', function () {
			assert.strictEqual(validateInputTypes.matchesType('true', 'boolean'), false);
		});

		it('should return true for array type with array value', function () {
			assert.strictEqual(validateInputTypes.matchesType([1, 2, 3], 'array'), true);
		});

		it('should return false for array type with object value', function () {
			assert.strictEqual(validateInputTypes.matchesType({ a: 1 }, 'array'), false);
		});

		it('should return true for object type with object value', function () {
			assert.strictEqual(validateInputTypes.matchesType({ a: 1 }, 'object'), true);
		});

		it('should return false for object type with array value', function () {
			assert.strictEqual(validateInputTypes.matchesType([1, 2], 'object'), false);
		});

		it('should return false for object type with null value', function () {
			assert.strictEqual(validateInputTypes.matchesType(null, 'object'), false);
		});

		it('should return true for null type with null value', function () {
			assert.strictEqual(validateInputTypes.matchesType(null, 'null'), true);
		});

		it('should return true for undefined values (handled by required validation)', function () {
			assert.strictEqual(validateInputTypes.matchesType(undefined, 'string'), true);
		});

		it('should return true when value matches one of multiple types', function () {
			assert.strictEqual(validateInputTypes.matchesType('hello', ['string', 'number']), true);
			assert.strictEqual(validateInputTypes.matchesType(123, ['string', 'number']), true);
		});

		it('should return false when value matches none of multiple types', function () {
			assert.strictEqual(validateInputTypes.matchesType(true, ['string', 'number']), false);
		});

		it('should return true for null when null is in type array', function () {
			assert.strictEqual(validateInputTypes.matchesType(null, ['string', 'null']), true);
		});

	});

	describe('getActualType', function () {

		it('should return "null" for null', function () {
			assert.strictEqual(validateInputTypes.getActualType(null), 'null');
		});

		it('should return "array" for arrays', function () {
			assert.strictEqual(validateInputTypes.getActualType([1, 2]), 'array');
		});

		it('should return "object" for objects', function () {
			assert.strictEqual(validateInputTypes.getActualType({ a: 1 }), 'object');
		});

		it('should return "string" for strings', function () {
			assert.strictEqual(validateInputTypes.getActualType('hello'), 'string');
		});

		it('should return "number" for numbers', function () {
			assert.strictEqual(validateInputTypes.getActualType(123), 'number');
		});

		it('should return "boolean" for booleans', function () {
			assert.strictEqual(validateInputTypes.getActualType(true), 'boolean');
		});

	});

	describe('getEnumValues', function () {

		it('should return simple values as-is', function () {
			var values = validateInputTypes.getEnumValues(['a', 'b', 'c']);
			assert.deepStrictEqual(values, ['a', 'b', 'c']);
		});

		it('should extract value from {text, value} objects', function () {
			var values = validateInputTypes.getEnumValues([
				{ text: 'Option A', value: 'a' },
				{ text: 'Option B', value: 'b' }
			]);
			assert.deepStrictEqual(values, ['a', 'b']);
		});

		it('should handle mixed enum formats', function () {
			var values = validateInputTypes.getEnumValues([
				'simple',
				{ text: 'Complex', value: 'complex' },
				123
			]);
			assert.deepStrictEqual(values, ['simple', 'complex', 123]);
		});

		it('should return empty array for non-array input', function () {
			assert.deepStrictEqual(validateInputTypes.getEnumValues(null), []);
			assert.deepStrictEqual(validateInputTypes.getEnumValues(undefined), []);
			assert.deepStrictEqual(validateInputTypes.getEnumValues('string'), []);
		});

	});

	describe('validateValue', function () {

		it('should return no errors for valid string', function () {
			var errors = validateInputTypes.validateValue('hello', { type: 'string' }, 'test');
			assert.strictEqual(errors.length, 0);
		});

		it('should return error for type mismatch', function () {
			var errors = validateInputTypes.validateValue(123, { type: 'string' }, 'test');
			assert.strictEqual(errors.length, 1);
			assert(errors[0].includes('Type mismatch'));
			assert(errors[0].includes('expected string'));
			assert(errors[0].includes('got number'));
		});

		it('should return error for invalid enum value', function () {
			var errors = validateInputTypes.validateValue('invalid', {
				type: 'string',
				enum: ['valid1', 'valid2']
			}, 'test');
			assert.strictEqual(errors.length, 1);
			assert(errors[0].includes('Invalid enum value'));
		});

		it('should return no errors for valid enum value', function () {
			var errors = validateInputTypes.validateValue('valid1', {
				type: 'string',
				enum: ['valid1', 'valid2']
			}, 'test');
			assert.strictEqual(errors.length, 0);
		});

		it('should validate enum with {text, value} objects', function () {
			var errors = validateInputTypes.validateValue('ALL', {
				type: 'string',
				enum: [
					{ text: 'All', value: 'ALL' },
					{ text: 'Daily', value: 'DAILY' }
				]
			}, 'test');
			assert.strictEqual(errors.length, 0);
		});

		it('should return error for invalid value with {text, value} enum', function () {
			var errors = validateInputTypes.validateValue('INVALID', {
				type: 'string',
				enum: [
					{ text: 'All', value: 'ALL' },
					{ text: 'Daily', value: 'DAILY' }
				]
			}, 'test');
			assert.strictEqual(errors.length, 1);
			assert(errors[0].includes('Invalid enum value'));
		});

		it('should validate nested object properties', function () {
			var errors = validateInputTypes.validateValue(
				{ nested: 123 },
				{
					type: 'object',
					properties: {
						nested: { type: 'string' }
					}
				},
				'test'
			);
			assert.strictEqual(errors.length, 1);
			assert(errors[0].includes('test.nested'));
		});

		it('should validate array items', function () {
			var errors = validateInputTypes.validateValue(
				['hello', 123, 'world'],
				{
					type: 'array',
					items: { type: 'string' }
				},
				'test'
			);
			assert.strictEqual(errors.length, 1);
			assert(errors[0].includes('test[1]'));
		});

		it('should return no errors for undefined value', function () {
			var errors = validateInputTypes.validateValue(undefined, { type: 'string' }, 'test');
			assert.strictEqual(errors.length, 0);
		});

		it('should return no errors when no schema property', function () {
			var errors = validateInputTypes.validateValue('hello', null, 'test');
			assert.strictEqual(errors.length, 0);
		});

	});

	describe('validateSchemaDefaults', function () {

		it('should return no errors for valid default', function () {
			var errors = validateInputTypes.validateSchemaDefaults({
				test: {
					type: 'string',
					default: 'hello'
				}
			});
			assert.strictEqual(errors.length, 0);
		});

		it('should return error for string default with number type', function () {
			var errors = validateInputTypes.validateSchemaDefaults({
				test: {
					type: 'number',
					default: '123'
				}
			});
			assert.strictEqual(errors.length, 1);
			assert(errors[0].includes('Schema default type mismatch'));
			assert(errors[0].includes('type number'));
			assert(errors[0].includes('default value is string'));
		});

		it('should return error for string default with integer type', function () {
			var errors = validateInputTypes.validateSchemaDefaults({
				limit: {
					type: 'integer',
					default: '1000'
				}
			});
			assert.strictEqual(errors.length, 1);
			assert(errors[0].includes('Schema default type mismatch'));
		});

		it('should return no errors when default matches one of multiple types', function () {
			var errors = validateInputTypes.validateSchemaDefaults({
				test: {
					type: ['string', 'integer'],
					default: '1000'
				}
			});
			assert.strictEqual(errors.length, 0);
		});

		it('should return error for default not in enum', function () {
			var errors = validateInputTypes.validateSchemaDefaults({
				test: {
					type: 'string',
					enum: ['a', 'b', 'c'],
					default: 'd'
				}
			});
			assert.strictEqual(errors.length, 1);
			assert(errors[0].includes('Schema default enum mismatch'));
		});

		it('should validate default against {text, value} enum', function () {
			var errors = validateInputTypes.validateSchemaDefaults({
				time_granularity: {
					type: 'string',
					default: 'ALL',
					enum: [
						{ text: 'All', value: 'ALL' },
						{ text: 'Daily', value: 'DAILY' }
					]
				}
			});
			assert.strictEqual(errors.length, 0);
		});

		it('should return error for invalid default with {text, value} enum', function () {
			var errors = validateInputTypes.validateSchemaDefaults({
				time_granularity: {
					type: 'string',
					default: 'INVALID',
					enum: [
						{ text: 'All', value: 'ALL' },
						{ text: 'Daily', value: 'DAILY' }
					]
				}
			});
			assert.strictEqual(errors.length, 1);
			assert(errors[0].includes('Schema default enum mismatch'));
		});

		it('should validate nested object defaults', function () {
			var errors = validateInputTypes.validateSchemaDefaults({
				parent: {
					type: 'object',
					properties: {
						child: {
							type: 'number',
							default: 'not a number'
						}
					}
				}
			});
			assert.strictEqual(errors.length, 1);
			assert(errors[0].includes('parent.child'));
		});

		it('should validate array items schema defaults', function () {
			var errors = validateInputTypes.validateSchemaDefaults({
				items: {
					type: 'array',
					items: {
						type: 'number',
						default: 'not a number'
					}
				}
			});
			assert.strictEqual(errors.length, 1);
		});

		it('should return no errors when no default is specified', function () {
			var errors = validateInputTypes.validateSchemaDefaults({
				test: {
					type: 'number'
				}
			});
			assert.strictEqual(errors.length, 0);
		});

		it('should return no errors when no type is specified', function () {
			var errors = validateInputTypes.validateSchemaDefaults({
				test: {
					default: 'hello'
				}
			});
			assert.strictEqual(errors.length, 0);
		});

	});

	describe('validateInputTypes', function () {

		it('should validate params against message schema', function () {
			var errors = validateInputTypes.validateInputTypes(
				{ test: 123 },
				{
					input: {
						test: { type: 'string' }
					}
				},
				null
			);
			assert.strictEqual(errors.length, 1);
		});

		it('should validate params against global schema', function () {
			var errors = validateInputTypes.validateInputTypes(
				{ api_key: 123 },
				null,
				{
					input: {
						api_key: { type: 'string' }
					}
				}
			);
			assert.strictEqual(errors.length, 1);
		});

		it('should validate params against combined schemas', function () {
			var errors = validateInputTypes.validateInputTypes(
				{
					api_key: 123,
					test: true
				},
				{
					input: {
						test: { type: 'string' }
					}
				},
				{
					input: {
						api_key: { type: 'string' }
					}
				}
			);
			assert.strictEqual(errors.length, 2);
		});

		it('should return no errors for valid params', function () {
			var errors = validateInputTypes.validateInputTypes(
				{
					api_key: 'key123',
					count: 10
				},
				{
					input: {
						count: { type: 'integer' }
					}
				},
				{
					input: {
						api_key: { type: 'string' }
					}
				}
			);
			assert.strictEqual(errors.length, 0);
		});

		it('should skip validation for params not in schema', function () {
			var errors = validateInputTypes.validateInputTypes(
				{ unknown: 123 },
				{
					input: {
						test: { type: 'string' }
					}
				},
				null
			);
			assert.strictEqual(errors.length, 0);
		});

	});

	describe('validateSchemaConsistency', function () {

		it('should validate both message and global schema defaults', function () {
			var errors = validateInputTypes.validateSchemaConsistency(
				{
					input: {
						limit: {
							type: 'integer',
							default: '100'
						}
					}
				},
				{
					input: {
						timeout: {
							type: 'number',
							default: '30'
						}
					}
				}
			);
			assert.strictEqual(errors.length, 2);
		});

		it('should return no errors for consistent schemas', function () {
			var errors = validateInputTypes.validateSchemaConsistency(
				{
					input: {
						limit: {
							type: 'integer',
							default: 100
						}
					}
				},
				{
					input: {
						timeout: {
							type: 'number',
							default: 30
						}
					}
				}
			);
			assert.strictEqual(errors.length, 0);
		});

	});

	describe('Real-world scenarios', function () {

		it('should catch Google Ads style bug - number type with string default', function () {
			var errors = validateInputTypes.validateSchemaDefaults({
				customer_id: {
					type: 'number',
					default: '1234567890',
					description: 'The customer ID'
				}
			});
			assert.strictEqual(errors.length, 1);
			assert(errors[0].includes('customer_id'));
			assert(errors[0].includes('type number'));
			assert(errors[0].includes('string'));
		});

		it('should catch pagination limit bug - integer type with string default', function () {
			var errors = validateInputTypes.validateSchemaDefaults({
				page_limit: {
					type: 'integer',
					default: '100',
					required: true
				}
			});
			assert.strictEqual(errors.length, 1);
		});

		it('should allow mixed type with string default (valid case)', function () {
			var errors = validateInputTypes.validateSchemaDefaults({
				limit: {
					type: ['string', 'integer'],
					default: '1000'
				}
			});
			assert.strictEqual(errors.length, 0);
		});

		it('should validate runtime input - string passed for integer field', function () {
			var errors = validateInputTypes.validateInputTypes(
				{ page_number: '5' },
				{
					input: {
						page_number: {
							type: 'integer',
							default: 1
						}
					}
				},
				null
			);
			assert.strictEqual(errors.length, 1);
			assert(errors[0].includes('page_number'));
		});

		it('should validate complex nested structure', function () {
			var errors = validateInputTypes.validateInputTypes(
				{
					filters: {
						date_range: {
							start: '2024-01-01',
							end: 12345  // Should be string
						}
					}
				},
				{
					input: {
						filters: {
							type: 'object',
							properties: {
								date_range: {
									type: 'object',
									properties: {
										start: { type: 'string' },
										end: { type: 'string' }
									}
								}
							}
						}
					}
				},
				null
			);
			assert.strictEqual(errors.length, 1);
			assert(errors[0].includes('filters.date_range.end'));
		});

	});

});
