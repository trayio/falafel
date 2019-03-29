var _ = require('lodash');
var assert = require('assert');
var proxyquire = require('proxyquire');

var fileOutput;

var buildConnectorsJson = proxyquire(
	'../../lib/buildConnectorsJson',
	{
		fs: {
			writeFileSync: function (path, contents) {
				fileOutput = contents;
			}
		}
	}
);

function stringifyOutput (expectedJSON) {
	return JSON.stringify(expectedJSON, null, '\t');
}

describe.only('#buildConnectorsJson', function () {

	var exampleConfig = {
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

		var inputConfig = _.cloneDeep(exampleConfig);

		var outputJsonString = buildConnectorsJson(null, [inputConfig]);

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

	it('should not add messages without schemas', function () {

		var outputJsonString = buildConnectorsJson(null, [
			_.defaults(
				{
					messages: [
						{
							name: 'my_message',
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

	it('should not add messages which start with \'#\' in their name', function () {

		var outputJsonString = buildConnectorsJson(null, [
			_.defaults(
				{
					messages: [
						{
							name: '#my_message',
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

	it('should add messages with schemas', function () {

		var outputJsonString = buildConnectorsJson(null, [
			_.defaults(
				{
					messages: [
						{
							name: 'my_message',
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

	it('should autogenerate message titles nicely if not already declared', function () {

		var outputJsonString = buildConnectorsJson(null, [
			_.defaults(
				{
					messages: [
						{
							schema: {
								name: 'my_message',
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
								name: 'my_second_message',
								title: 'My amazing second message',
								delivery: 'request_response',
							},
							model: {}
						}
					]
				},
				exampleConfig
			)
		]);

		var parsedJsonSchema = outputJsonString;

		assert.equal(parsedJsonSchema[0].messages.length, 2);
		// remember - operations are sorted by title
		assert.equal(parsedJsonSchema[0].messages[1].title, 'My message');
		assert.equal(parsedJsonSchema[0].messages[1].delivery, 'acknowledge');
		assert.equal(parsedJsonSchema[0].messages[0].title, 'My amazing second message');
		assert.equal(parsedJsonSchema[0].messages[0].delivery, 'request_response');

	});

	it('should create from specified output schema if specified', function () {

		var outputJsonString = buildConnectorsJson(null, [
			_.defaults(
				{
					messages: [
						{
							schema: {
								name: 'my_message',
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

		var parsedJsonSchema = outputJsonString;

		assert(_.isPlainObject(parsedJsonSchema[0].messages[0].output_schema));
		assert.equal(parsedJsonSchema[0].messages[0].output_schema.properties.result.type, 'integer');

	});

	it('should generate from sample response if specified', function () {

		var outputJsonString = buildConnectorsJson(null, [
			_.defaults(
				{
					messages: [
						{
							schema: {
								name: 'my_message',
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

		var parsedJsonSchema = outputJsonString;

		assert(_.isObject(parsedJsonSchema[0].messages[0].output_schema));
		assert.equal(parsedJsonSchema[0].messages[0].output_schema.properties.result.type, 'boolean');

	});

	it('should add global schema input if declared', function () {

		var outputJsonString = buildConnectorsJson(null, [
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
							name: 'my_message',
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

		var parsedJsonSchema = outputJsonString;

		assert.equal(_.keys(parsedJsonSchema[0].messages[0].input_schema.properties).length, 2);
		assert.equal(parsedJsonSchema[0].messages[0].input_schema.properties.api_key.type, 'string');
		assert.equal(parsedJsonSchema[0].messages[0].input_schema.properties.name.type, 'string');
		assert.equal(parsedJsonSchema[0].messages.length, 1);

	});

	it('should add global auth scopes if not declared on a local level', function () {

		var scopeArray = [ 'test_scope', 'another_scope' ];

		var outputJsonString = buildConnectorsJson(null, [
			_.defaults(
				{
					globalSchema: {
						auth_scopes: scopeArray,
						input: {}
					},
					messages: [
						{
							name: 'my_message',
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

		var parsedJsonSchema = outputJsonString;

		assert.deepEqual(parsedJsonSchema[0].messages[0].auth_scopes, scopeArray);

	});

	it('should not create file if `directory` is not a string', function () {

		var inputConfig = _.cloneDeep(exampleConfig);

		var outputJsonString = buildConnectorsJson(null, [
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
							name: 'my_message',
							schema: {
								title: 'My Message',
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

		var inputConfig = _.cloneDeep(exampleConfig);

		var outputJsonString = buildConnectorsJson('meh', [
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
							name: 'my_message',
							schema: {
								title: 'My Message',
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

		var parsedJsonSchema = JSON.parse(fileOutput);

		assert.deepEqual(
			parsedJsonSchema,
			[
				_.defaults(
					{
						icon: _.pick(inputConfig.icon, [ 'value', 'type' ]),
						messages: [
							{
								title: 'My Message',
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
