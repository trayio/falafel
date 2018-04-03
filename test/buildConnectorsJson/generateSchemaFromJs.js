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

	it('should accept minimum/maximum for type integer/number', function () {
		var output = generateSchemaFromJs({
			val: {
				type: 'number',
				minimum: -10,
				maximum: 100.1
			}
		});
		assert.equal(output.properties.val.minimum, -10);
		assert.equal(output.properties.val.maximum, 100.1);

		var output2 = generateSchemaFromJs({
			val: {
				type: 'integer',
				minimum: 0,
				maximum: 130
			}
		});
		assert.equal(output2.properties.val.minimum, 0);
		assert.equal(output2.properties.val.maximum, 130);

		var output3 = generateSchemaFromJs({
			val: {
				type: 'integer',
				minimum: 0
			}
		});
		assert.equal(output3.properties.val.minimum, 0);
		assert.ok(_.isUndefined(output3.properties.val.maximum));

		var output4 = generateSchemaFromJs({
			val: {
				type: 'integer',
				maximum: 100
			}
		});
		assert.ok(_.isUndefined(output4.properties.val.minimum));
		assert.equal(output4.properties.val.maximum, 100);

		var output5 = generateSchemaFromJs({
			val: {
				type: 'integer',
				minimum: 'abc',
				maximum: 'xyz'
			}
		});
		assert.ok(_.isUndefined(output5.properties.val.minimum));
		assert.ok(_.isUndefined(output5.properties.val.maximum));
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
		assert(_.isArray(output.required));
		assert(_.isArray(output.properties.data.required));
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

		var output = generateSchemaFromJs({
			data: {
				type: 'array',
				items: {
					type: 'string',
					enum: ['Option 1', 'Option 2']
				}
			}
		});

		assert.equal(output.properties.data.additionalItems, true);

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
		assert.equal(output.properties.deepData.items.title, 'Item');
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

	it('should generate array of schemas if items is an array of schemas', function () {
		var output = generateSchemaFromJs({
			data: {
				type: 'array',
				items: [

					{
						type: 'string'
					},

					{
						type: 'array',
						items: {
							type: 'string'
						}
					},

					{
						type: 'object',
						properties: {

							abc: {
								type: 'array'
							},

							xyz: {
								type: 'string'
							},

							pqr: {
								type: 'object',
								properties: {

									test: {
										type: 'string'
									}

								}
							}

						}
					}

				]
			}
		});

		assert.equal(_.isArray(output.properties.data.items), true);
	});

	it('should recursively generate schema for deep arrays', function () {
		var output = generateSchemaFromJs({
			deepData: {
				type: 'array',
				items: {
					type: 'array',
					items: {
						type: 'array',
						items: {
							type: 'string'
						}
					}
				}
			},
			deepDataX: {
				type: 'array',
				items: {
					type: 'object',
					additionalProperties: true
				}
			}
		});

		assert.equal(output.properties.deepData.type, 'array');
		assert.equal(output.properties.deepData.items.type, 'array');
		assert.equal(output.properties.deepData.items.title, 'Item');
		assert.equal(output.properties.deepData.items.items.type, 'array');
		assert.equal(output.properties.deepData.items.items.items.type, 'string');
		assert.equal(output.properties.deepDataX.items.type, 'object');

	});

	it('should add expand "oneOf" property properly', function () {
		var outputObject = generateSchemaFromJs({
			body_type: {
				title: 'Body Type',
				oneOf: [

					{
						title: 'raw',
						type: 'object',
						additionalProperties: false,
						properties: {
							raw: {
								type: 'string',
								title: 'raw',
								format: 'code'
							}
						},
						random: 'random'
					},

					{
						title: 'form-urlencoded',
						type: 'object',
						additionalProperties: false,
						properties: {
							form_urlencoded: {
								type: 'object',
								title: 'form-urlencoded',
								additionalProperties: true
							}
						}
					},

					{
						random: 'random'
					},

					{
						type: 'string'
					},

					{
						title: 'form-data',
						type: 'object',
						additionalProperties: false,
						properties: {
							form_data: {
								title: 'form-data',
								type: 'object',
								additionalProperties: {
									oneOf: [

										{
											title: 'Text',
											type: 'string'
										},

										{
											title: 'File',
											type: 'object',
											format: 'file',
											additionalProperties: false
										}

									]
								}
							}
						}
					}

				]
			}
		});

		assert.equal(_.isArray(outputObject['properties']['body_type']['oneOf']), true);
		assert(_.isUndefined(outputObject['properties']['body_type']['oneOf'][0]['random']));
		assert.equal(outputObject['properties']['body_type']['oneOf'][0]['title'], 'raw');
		assert.equal(outputObject['properties']['body_type']['oneOf'][2]['title'], 'Schema 3');
		assert.equal(_.isBoolean(outputObject['properties']['body_type']['oneOf'][0]['additionalProperties']), true);
		assert.equal(_.isBoolean(outputObject['properties']['body_type']['oneOf'][1]['properties']['form_urlencoded']['additionalProperties']), true);
		assert.equal(_.isObject(outputObject['properties']['body_type']['oneOf'][3]['properties']['form_data']['additionalProperties']), true);

	});

	it('should add expand "oneOf" property properly (array in arrays)', function () {
		var outputArray = generateSchemaFromJs({
			content: {
				type: 'array',
				title: 'form-data',
				items: {
					oneOf: [

						{
							id: 'text',
							title: 'text',
							type: 'object',
							properties: {
								key: {
									type: 'string'
								},
								value: {
									type: 'string'
								}
							}
						},

						{
							id: 'file',
							title: 'file',
							format: 'file',
							type: 'object',
							properties: {
								key: {
									type: 'string'
								},
								value: {
									type: 'object'
								}
							}
						}

					]
				}
			}
		});

		assert.equal(_.isArray(outputArray['properties']['content']['items']['oneOf']), true);
	});

	it('should not error if format hidden has either default or defaultJsonPath', function () {
		assert(
			generateSchemaFromJs({
				body_type: {
					title: 'Test',
					type: 'string',
					format: 'hidden',
					default: '123'
				}
			})
		);
		assert(
			generateSchemaFromJs({
				body_type: {
					title: 'Test',
					type: 'string',
					format: 'hidden',
					defaultJsonPath: '$.config.a'
				}
			})
		);
	});

	it('should error if format hidden does not have a default', function () {
		assert.throws(
			function () {
				generateSchemaFromJs({
					body_type: {
						title: 'Body Type',
						type: 'object',
						additionalProperties: false,
						format: 'hidden'
					}
				})
			},
			Error,
			'Error: Schema\'s that have "format":"hidden" require a default to also be provided.'
		);
	});


});
