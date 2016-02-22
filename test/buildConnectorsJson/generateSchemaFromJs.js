var _ 									 = require('lodash');
var assert 							 = require('assert');
var util 							   = require('util');
var generateSchemaFromJs = require('../../lib/buildConnectorsJson/generateSchemaFromJs');


describe('#generateSchemaFromJs', function () {

	it('should set the standard top level schema keys', function () {
		var output = generateSchemaFromJs({});

		assert.equal(output.$schema, "http://json-schema.org/draft-04/schema#");
		assert.equal(output.type, 'object');
		assert.deepEqual(output.properties, {});
	});

	it('should set required variables', function () {
		var output = generateSchemaFromJs({
			name: {
				required: true,
				type: 'string'
			},
			age: {
				required: true,
				type: 'integer'
			},
			job: {
				type: 'string'
			}
		});
		assert.deepEqual(output.required, ['name', 'age']);
	});

	it('should set advanced variables', function () {
		var output = generateSchemaFromJs({
			name: {
				advanced: true,
				type: 'string'
			},
			age: {
				advanced: true,
				type: 'integer'
			},
			job: {
				type: 'string'
			}
		});
		assert.deepEqual(output.advanced, ['name', 'age']);
	});

	it('should do a shallow set fine', function () {
		var output = generateSchemaFromJs({
			name: {
				type: 'string',
				name: 'full_name',
				title: 'Full name',
				description: 'Your full name',
				default: 'Chris',
				enum: ['Chris', 'John']
			},
			age: {
				type: 'integer'
			}
		});
		assert.equal(output.properties.name.type, 'string');
		assert.equal(output.properties.name.name, 'full_name');
		assert.equal(output.properties.name.title, 'Full name');
		assert.equal(output.properties.name.description, 'Your full name');
		assert.equal(output.properties.name.default, 'Chris');
		assert.deepEqual(output.properties.name.enum, ['Chris', 'John']);
	});

	it('should auto generate the title', function () {
		var output = generateSchemaFromJs({
			name: {
				type: 'string',
				name: 'full_name'
			},
			age: {
				type: 'string'
			}
		});
		assert.equal(output.properties.name.title, 'Full name');
		assert.equal(output.properties.age.title, 'Age');
	});

	it('should handle default json path', function () {
		var output = generateSchemaFromJs({
			name: {
				type: 'string',
				defaultJsonPath: '$.auth.name'
			}
		});
		assert.equal(output.properties.name.default_jsonpath, '$.auth.name');
	});

	it('should add additionalProperties defaulting to false for objects', function () {
		var output = generateSchemaFromJs({
			data: {
				type: 'object'
			}
		});
		assert.strictEqual(output.properties.data.additionalProperties, false);

		output = generateSchemaFromJs({
			data: {
				type: 'object',
				additionalProperties: true
			}
		});
		assert.strictEqual(output.properties.data.additionalProperties, true);
	});

	it('should recursively generate the schema for objects', function () {
		var output = generateSchemaFromJs({
			data: {
				type: 'object'
			}
		});

		assert(_.isUndefined(output.properties.data.$schema));
		assert(_.isArray(output.properties.data.required));
		assert(_.isArray(output.properties.data.advanced));
		assert(_.isObject(output.properties.data.properties));

		output = generateSchemaFromJs({
			data: {
				type: 'object',
				properties: {
					age: {
						type: 'integer'
					}
				}
			}
		});

		assert.equal(output.properties.data.properties.age.type, 'integer');
		assert.equal(output.properties.data.properties.age.title, 'Age');

		output = generateSchemaFromJs({
			data: {
				type: 'object',
				properties: {
					sub: {
						type: 'object'
					}
				}
			}
		});

		assert(_.isObject(output.properties.data.properties.sub.properties));

		output = generateSchemaFromJs({
			data: {
				type: 'object',
				properties: {
					sub: {
						type: 'object',
						properties: {
							age: {
								type: 'number'
							}
						}
					}
				}
			}
		});

		assert.equal(output.properties.data.properties.sub.properties.age.type, 'number');
	});

	it('should default to allowing additionalItems', function () {
		
	});

	it('should recursively generate schema for arrays', function () {
		var output = generateSchemaFromJs({
			data: {
				type: 'array',
				items: {
					type: 'string',
					enum: ['Option 1', 'Option 2']
				}
			},
			deepData: {
				type: 'array',
				items: {
					type: 'object',
					properties: {
						name: {
							type: 'string'
						},
						age: {
							type: 'number'
						},
						subArray: {
							type: 'array',
							items: {
								title: 'Sub array',
								type: 'number'
							}
						},
						subObject: {
							type: 'object',
							properties: {
								color: {
									type: 'string',
									default: 'red'
								}
							}
						}
					}
				}
			}
		});

		assert(output.properties.data.items);
		assert.equal(output.properties.data.items.type, 'string');

		assert.equal(output.properties.deepData.type, 'array');
		assert.equal(output.properties.deepData.items.type, 'object');
		assert.equal(output.properties.deepData.items.title, 'Items');
		assert.equal(output.properties.deepData.items.properties.name.type, 'string');
		assert.equal(output.properties.deepData.items.properties.age.type, 'number');
		assert.equal(output.properties.deepData.items.properties.subArray.type, 'array');
		assert.equal(output.properties.deepData.items.properties.subArray.items.type, 'number');
		assert.equal(output.properties.deepData.items.properties.subArray.items.title, 'Sub array');
		assert.equal(output.properties.deepData.items.properties.subArray.additionalItems, true);

		assert.equal(output.properties.deepData.items.properties.subObject.type, 'object');
		assert.equal(output.properties.deepData.items.properties.subObject.properties.color.type, 'string');
		assert.equal(output.properties.deepData.items.properties.subObject.properties.color.default, 'red');
	});

});


