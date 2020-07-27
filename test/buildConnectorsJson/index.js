const _ = require('lodash');
const assert = require('assert');
const proxyquire = require('proxyquire');

let fileOutput;

const buildConnectorsJson = proxyquire(
	'../../lib/buildConnectorsJson',
	{
		fs: {
			writeFileSync: function (path, contents) {
				fileOutput = contents;
			}
		}
	}
);

describe('#buildConnectorsJson', function () {

	const exampleConfig = {
		name: 'mailchimp',
		title: 'MailChimp',
		icon: {
			value: 'http://myicon.com/icon.png',
			type: 'url'
		},
		version: '2.0',
		description: 'This is a great connector',
		customkey: 'This won\'t get added',
		auth: false
	};

	it('should pick the top level connectors keys', function () {

		const inputConfig = _.cloneDeep(exampleConfig);

		const outputJsonString = buildConnectorsJson(null, [inputConfig]);

		assert.deepEqual(
			_.defaults(
				{
					icon: _.pick(inputConfig.icon, [ 'value', 'type' ]),
					messages: []
				},
				_.pick(
					inputConfig,
					[ 'name', 'title', 'description', 'version', 'auth' ]
				)
			),
			outputJsonString[0]
		);

	});

	it('should have name for all operation variants', function () {
		const outputJsonString = buildConnectorsJson(null, [
			_.defaults(
				{
					messages: [
						{
							name: 'my_operation',
							model: {
								url: '..'
							},
							schema: {
								input: {
									name: {
										type: 'string'
									}
								}
							}
						},
						{
							name: 'my_private_operation',
							model: {
								url: '..'
							}
						},
						{
							name: 'my_operation_ddl',
							model: {
								url: '..'
							},
							schema: {
								type: 'ddl',
								input: {
									name: {
										type: 'string'
									}
								}
							}
						},
						{
							name: 'my_operation_two_ddl',
							model: {
								url: '..'
							}
						}
					]
				},
				exampleConfig
			)
		]);

		assert.equal(outputJsonString[0].messages.length, 3);
		assert.equal(outputJsonString[0].messages[0].name, 'my_operation');
		assert.equal(outputJsonString[0].messages[1].name, 'my_operation_ddl');
		assert.equal(outputJsonString[0].messages[2].name, 'my_operation_two_ddl');
	});

	it('should validate `branches` property', function () {

		const inputConfig = _.cloneDeep(exampleConfig);
		inputConfig.branches = [
			{
				name: 'test',
				display_name: 'test'
			},
			{
				name: 'hello',
				display_name: 'world'
			},
		];

		const outputJsonString = buildConnectorsJson(null, [inputConfig]);

		assert.deepEqual(
			_.defaults(
				{
					icon: _.pick(inputConfig.icon, [ 'value', 'type' ]),
					messages: [],
					branches: [
						{
							name: 'test',
							display_name: 'test'
						},
						{
							name: 'hello',
							display_name: 'world'
						},
					]
				},
				_.pick(
					inputConfig,
					[ 'name', 'title', 'description', 'version', 'auth' ]
				)
			),
			outputJsonString[0]
		);

		const invalidInputConfig = _.cloneDeep(exampleConfig);
		invalidInputConfig.branches = [
			{
				name: 'test',
			},
			{
				name: 'hello',
				display_name: 'world'
			},
		];

		try {
			buildConnectorsJson(null, [invalidInputConfig]);
		} catch (branchError) {
			assert.equal(branchError.message, '`branches` must be an array of objects with `name` and `display_name`');
		}

		try {
			invalidInputConfig.branches = {};
			buildConnectorsJson(null, [invalidInputConfig]);
		} catch (branchError) {
			assert.equal(branchError.message, '`branches` must be an array of objects with `name` and `display_name`');
			return;
		}

		assert.fail('buildConnectorsJson should have thrown an error');

	});

	it('should not add private operations (non-ddl ops without schemas)', function () {

		const outputJsonString = buildConnectorsJson(null, [
			_.defaults(
				{
					messages: [
						{
							name: 'my_operation',
							model: {
								url: '..'
							}
						}
					]
				},
				exampleConfig
			)
		]);

		assert.equal(outputJsonString[0].messages.length, 0);

	});

	it('should not add operations which start with \'#\' in their name', function () {

		const outputJsonString = buildConnectorsJson(null, [
			_.defaults(
				{
					messages: [
						{
							name: '#my_operation',
							model: {
								url: '..'
							},
							schema: {
								input: {}
							}
						}
					]
				},
				exampleConfig
			)
		]);

		assert.equal(outputJsonString[0].messages.length, 0);

	});

	it('should add operations with schemas (as public, if type is not defined)', function () {

		const outputJsonString = buildConnectorsJson(null, [
			_.defaults(
				{
					messages: [
						{
							name: 'my_operation',
							model: {
								url: '..'
							},
							schema: {
								input: {
									name: {
										type: 'string'
									}
								}
							}
						}
					]
				},
				exampleConfig
			)
		]);

		assert.equal(outputJsonString[0].messages.length, 1);

	});

	it('should add operations with schemas with type \'public\'', function () {

		const outputJsonString = buildConnectorsJson(null, [
			_.defaults(
				{
					messages: [
						{
							name: 'my_operation',
							model: {
								url: '..'
							},
							schema: {
								type: 'public',
								input: {
									name: {
										type: 'string'
									}
								}
							}
						}
					]
				},
				exampleConfig
			)
		]);

		assert.equal(outputJsonString[0].messages.length, 1);
		assert.equal(outputJsonString[0].messages[0].type, 'public');

	});

	it('should add operations with schemas with type \'ddl\'', function () {

		const outputJsonString = buildConnectorsJson(null, [
			_.defaults(
				{
					messages: [
						{
							name: 'my_operation_ddl',
							model: {
								url: '..'
							},
							schema: {
								type: 'ddl',
								input: {
									name: {
										type: 'string'
									}
								}
							}
						}
					]
				},
				exampleConfig
			)
		]);

		assert.equal(outputJsonString[0].messages.length, 1);
		assert.equal(outputJsonString[0].messages[0].type, 'ddl');

	});

	it('should not add operations with schemas with type \'private\'', function () {

		const outputJsonString = buildConnectorsJson(null, [
			_.defaults(
				{
					messages: [
						{
							name: 'my_operation',
							model: {
								url: '..'
							},
							schema: {
								type: 'private',
								input: {
									name: {
										type: 'string'
									}
								}
							}
						}
					]
				},
				exampleConfig
			)
		]);

		assert.equal(outputJsonString[0].messages.length, 0);

	});

	it('should autogenerate operation titles nicely if not already declared', function () {

		const parsedJsonSchema = buildConnectorsJson(null, [
			_.defaults(
				{
					messages: [
						{
							schema: {
								name: 'my_operation',
								input: {
									name: {
										type: 'string'
									}
								},
								delivery: 'acknowledge'
							},
							model: {
								url: '..'
							}
						},
						{
							schema: {
								name: 'my_second_operation',
								title: 'My amazing second operation',
								delivery: 'request_response',
							},
							model: {}
						}
					]
				},
				exampleConfig
			)
		]);

		assert.equal(parsedJsonSchema[0].messages.length, 2);
		// remember - operations are sorted by title
		assert.equal(parsedJsonSchema[0].messages[1].title, 'My operation');
		assert.equal(parsedJsonSchema[0].messages[1].delivery, 'acknowledge');
		assert.equal(parsedJsonSchema[0].messages[0].title, 'My amazing second operation');
		assert.equal(parsedJsonSchema[0].messages[0].delivery, 'request_response');

	});

	it('should autogenerate operation titles which include id, ids or url nicely if not already declared', function () {

		const parsedJsonSchema = buildConnectorsJson(null, [
			_.defaults(
				{
					messages: [
						{
							schema: {
								name: 'my_operation_id',
								input: {
									name: {
										type: 'string'
									}
								},
								delivery: 'acknowledge'
							},
							model: {
								url: '..'
							}
						},
						{
							schema: {
								name: 'my_second_operation_ids',
								delivery: 'request_response',
							},
							model: {}
						},
						{
							schema: {
								name: 'my_third_operation_url',
								delivery: 'request_response',
							},
							model: {}
						},
						{
							schema: {
								name: 'my_fourth_operation_url',
								title: 'My Amazing 4th operation',
								delivery: 'request_response',
							},
							model: {}
						},
					]
				},
				exampleConfig
			)
		]);

		assert.equal(parsedJsonSchema[0].messages.length, 4);
		// remember - operations are sorted by title
		assert.equal(parsedJsonSchema[0].messages[0].title, 'My Amazing 4th operation');
		assert.equal(parsedJsonSchema[0].messages[0].delivery, 'request_response');
		assert.equal(parsedJsonSchema[0].messages[1].title, 'My operation ID');
		assert.equal(parsedJsonSchema[0].messages[1].delivery, 'acknowledge');
		assert.equal(parsedJsonSchema[0].messages[2].title, 'My second operation IDs');
		assert.equal(parsedJsonSchema[0].messages[2].delivery, 'request_response');
		assert.equal(parsedJsonSchema[0].messages[3].title, 'My third operation URL');
		assert.equal(parsedJsonSchema[0].messages[3].delivery, 'request_response');

	});

	it('should define `public` type for operations with schemas', function () {

		const parsedJsonSchema = buildConnectorsJson(null, [
			_.defaults(
				{
					messages: [
						{
							schema: {
								name: 'my_operation',
								input: {
									name: {
										type: 'string'
									}
								},
								delivery: 'acknowledge'
							},
							model: {
								url: '..'
							}
						},
						{
							schema: {
								name: 'my_second_operation',
								title: 'My amazing second operation',
								delivery: 'request_response',
							},
							model: {}
						}
					]
				},
				exampleConfig
			)
		]);

		assert.equal(parsedJsonSchema[0].messages.length, 2);
		assert.equal(parsedJsonSchema[0].messages[0].type, 'public');
		assert.equal(parsedJsonSchema[0].messages[1].type, 'public');

	});

	it('should define `ddl` type for operations whose name ends with `_ddl`', function () {
		const parsedJsonSchema = buildConnectorsJson(null, [
			_.defaults(
				{
					messages: [
						{
							schema: {
								name: 'my_operation',
								input: {
									name: {
										type: 'string'
									}
								},
							},
							model: {
								url: '..'
							}
						},
						{
							name: 'my_operation_ddl',
							model: {}
						}
					]
				},
				exampleConfig
			)
		]);

		assert.equal(parsedJsonSchema[0].messages.length, 2);
		assert.equal(parsedJsonSchema[0].messages[0].type, 'public');
		assert.equal(parsedJsonSchema[0].messages[1].type, 'ddl');
	});

	it('should create generic schema for `ddl` type if schema is not provided', function () {
		const parsedJsonSchema = buildConnectorsJson(null, [
			_.defaults(
				{
					messages: [
						{
							name: 'my_operation_ddl',
							model: {}
						}
					]
				},
				exampleConfig
			)
		]);

		assert.equal(parsedJsonSchema[0].messages.length, 1);
		assert.equal(parsedJsonSchema[0].messages[0].name, 'my_operation_ddl');
		assert.equal(parsedJsonSchema[0].messages[0].type, 'ddl');
		assert.deepEqual(
			parsedJsonSchema[0].messages[0].input_schema,
			{
				'$schema': 'http://json-schema.org/draft-04/schema#',
				'additionalProperties': false,
				'advanced': [],
				'properties': {},
				'required': [],
				'type': 'object',
			}
		);
	});

	it('should use schema for `ddl` type if schema is provided', function () {
		const parsedJsonSchema = buildConnectorsJson(null, [
			_.defaults(
				{
					messages: [
						{
							name: 'my_operation_ddl',
							model: {},
							schema: {
								input: {
									dependant_property: {
										type: 'string',
										required: true
									}
								},
							}
						}
					]
				},
				exampleConfig
			)
		]);

		assert.equal(parsedJsonSchema[0].messages.length, 1);
		assert.equal(parsedJsonSchema[0].messages[0].type, 'ddl');
		assert.deepEqual(
			parsedJsonSchema[0].messages[0].input_schema,
			{
				'$schema': 'http://json-schema.org/draft-04/schema#',
				'additionalProperties': false,
				'advanced': [],
				'properties': {
					dependant_property: {
						title: 'Dependant property',
						type: 'string'
					}
				},
				'required': ['dependant_property'],
				'type': 'object',
			}
		);
	});

	it('should not include certain properties for `ddl` type if schema is provided', function () {
		const parsedJsonSchema = buildConnectorsJson(null, [
			_.defaults(
				{
					messages: [
						{
							name: 'my_operation_ddl',
							model: {},
							schema: {
								helpLink: 'something',
								delivery: 'acknowledge',
								default: true,
								timeoutMillis: 500,
								input: {
									dependant_property: {
										type: 'string',
										required: true
									}
								},
								reply: {
									test: {
										type: 'string'
									}
								},
							}
						}
					]
				},
				exampleConfig
			)
		]);

		assert.strictEqual(parsedJsonSchema[0].messages.length, 1);
		assert.strictEqual(parsedJsonSchema[0].messages[0].type, 'ddl');
		const ddlOp = parsedJsonSchema[0].messages[0];
		assert.strictEqual(ddlOp.default, undefined);
		assert.strictEqual(ddlOp.delivery, undefined);
		assert.strictEqual(ddlOp.helpLink, undefined);
		assert.strictEqual(ddlOp.timeoutMillis, undefined);
		assert.strictEqual(ddlOp.reply_schema, undefined);
	});

	it('should error if title for `ddl` type does not end with ` DDL`', function () {
		try {
			const parsedJsonSchema = buildConnectorsJson(null, [
				_.defaults(
					{
						messages: [
							{
								name: 'my_operation_ddl',
								model: {},
								schema: {
									title: 'My operation',
									input: {
										dependant_property: {
											type: 'string',
											required: true
										}
									}
								}
							}
						]
					},
					exampleConfig
				)
			]);
			assert.fail(parsedJsonSchema);
		} catch (buildConnectorsJsonError) {
			assert.strictEqual(buildConnectorsJsonError.message, 'DDL operation titles must end with `DDL` suffix; my_operation_ddl');
			assert.strictEqual(buildConnectorsJsonError.code, '#connector_error');
		}
	});

	it('should create from specified output schema if specified', function () {
		const parsedJsonSchema = buildConnectorsJson(null, [
			_.defaults(
				{
					messages: [
						{
							schema: {
								name: 'my_operation',
								input: {
									name: {
										type: 'string'
									}
								},
								output: {
									result: {
										type: 'integer'
									}
								}
							},
							model: {
								url: '..'
							}
						}
					]
				},
				exampleConfig
			)
		]);

		assert(_.isPlainObject(parsedJsonSchema[0].messages[0].output_schema));
		assert.equal(parsedJsonSchema[0].messages[0].output_schema.properties.result.type, 'integer');
	});

	it('should generate from sample response if specified', function () {
		const parsedJsonSchema = buildConnectorsJson(null, [
			_.defaults(
				{
					messages: [
						{
							schema: {
								name: 'my_operation',
								input: {
									name: {
										type: 'string'
									}
								},
								responseSample: {
									result: true
								}
							},
							model: {
								url: '..'
							}
						}
					]
				},
				exampleConfig
			)
		]);

		assert(_.isObject(parsedJsonSchema[0].messages[0].output_schema));
		assert.equal(parsedJsonSchema[0].messages[0].output_schema.properties.result.type, 'boolean');
	});

	it('should add global schema input if declared', function () {
		const parsedJsonSchema = buildConnectorsJson(null, [
			_.defaults(
				{
					globalSchema: {
						input: {
							api_key: {
								type: 'string',
								required: true,
								advanced: true
							}
						}
					},
					messages: [
						{
							name: 'my_operation',
							schema: {
								input: {
									name: {
										type: 'string'
									}
								}
							},
							model: {
								url: '..'
							}
						}
					]
				},
				exampleConfig
			)
		]);

		assert.equal(_.keys(parsedJsonSchema[0].messages[0].input_schema.properties).length, 2);
		assert.equal(parsedJsonSchema[0].messages[0].input_schema.properties.api_key.type, 'string');
		assert.equal(parsedJsonSchema[0].messages[0].input_schema.properties.name.type, 'string');
		assert.equal(parsedJsonSchema[0].messages.length, 1);
	});

	it('should add global auth scopes if not declared on a local level', function () {
		const scopeArray = [ 'test_scope', 'another_scope' ];

		const parsedJsonSchema = buildConnectorsJson(null, [
			_.defaults(
				{
					globalSchema: {
						auth_scopes: scopeArray,
						input: {}
					},
					messages: [
						{
							name: 'my_operation',
							schema: {
								input: {
									name: {
										type: 'string'
									}
								}
							},
							model: {
								url: '..'
							}
						}
					]
				},
				exampleConfig
			)
		]);

		assert.deepEqual(parsedJsonSchema[0].messages[0].auth_scopes, scopeArray);
	});

	it('should not create file if `directory` is not a string', function () {

		const inputConfig = _.cloneDeep(exampleConfig);

		const outputJsonString = buildConnectorsJson(null, [
			_.defaults(
				{
					globalSchema: {
						input: {
							api_key: {
								type: 'string',
								required: true,
								advanced: true
							}
						}
					},
					messages: [
						{
							name: 'my_operation',
							schema: {
								title: 'My operation',
								input: {
									name: {
										type: 'string'
									}
								}
							},
							model: {
								url: '..'
							}
						}
					]
				},
				exampleConfig
			)
		]);

		assert(_.isUndefined(fileOutput));

	});

	it('should create file if `directory` is a string', function () {

		const inputConfig = _.cloneDeep(exampleConfig);

		const outputJsonString = buildConnectorsJson('meh', [
			_.defaults(
				{
					globalSchema: {
						input: {
							api_key: {
								type: 'string',
								required: true,
								advanced: true
							}
						}
					},
					messages: [
						{
							name: 'my_operation',
							schema: {
								title: 'My operation',
								input: {
									name: {
										type: 'string'
									}
								}
							},
							model: {
								url: '..'
							}
						}
					]
				},
				exampleConfig
			)
		]);

		const parsedJsonSchema = JSON.parse(fileOutput);

		assert.deepEqual(
			parsedJsonSchema,
			[
				_.defaults(
					{
						icon: _.pick(inputConfig.icon, [ 'value', 'type' ]),
						messages: [
							{
								name: 'my_operation',
								title: 'My operation',
								type: 'public',
								input_schema: {
									type: 'object',
									properties: {
										api_key: {
											type: 'string',
											title: 'Api key'
										},
										name: {
											type: 'string',
											title: 'Name'
										}
									},
									required: ['api_key'],
									advanced: ['api_key'],
									'$schema': 'http://json-schema.org/draft-04/schema#',
									additionalProperties: false
								},
								dynamic_output: false
							}
						]
					},
					_.pick(
						inputConfig,
						[ 'name', 'title', 'description', 'version', 'auth' ]
					)
				)
			]
		);

	});

});
