var _ 			= require('lodash');
var assert 		= require('assert');
var parseConfig = require('../../lib/parseConfig');
var sampleConfig = require('./sampleConfig.json');


describe('#parseConfig', function () {

	it('should parse config into a falafel format', function () {
		var parsed = parseConfig(sampleConfig);

		assert(_.isArray(parsed));
		assert(_.isObject(parsed[0]));
		assert(_.isString(parsed[0].name));
		assert(_.isString(parsed[0].name));
		assert(_.isObject(parsed[0].globalModel));
		assert(_.isObject(parsed[0].globalSchema));
		assert(_.isArray(parsed[0].messages));
		assert(_.isObject(parsed[0].messages[0]));
		assert(_.isObject(parsed[0].messages[0].model));
		assert(_.isObject(parsed[0].messages[0].schema));
		assert(_.isString(parsed[0].messages[0].name));
	});

	it('should parse config into a falafel format, when inputted as a string', function () {
		var parsed = parseConfig(JSON.stringify(sampleConfig));

		assert(_.isArray(parsed));
		assert(_.isObject(parsed[0]));
		assert(_.isString(parsed[0].name));
		assert(_.isString(parsed[0].name));
		assert(_.isObject(parsed[0].globalModel));
		assert(_.isObject(parsed[0].globalSchema));
		assert(_.isArray(parsed[0].messages));
		assert(_.isObject(parsed[0].messages[0]));
		assert(_.isObject(parsed[0].messages[0].model));
		assert(_.isObject(parsed[0].messages[0].schema));
		assert(_.isString(parsed[0].messages[0].name));
	});

	it('should merge the global schema properties into the operation schema, excluding the excluded properties', function () {

		var clonedConfig = _.cloneDeep(sampleConfig);

		const globalSchema = {
			type: 'object',
			$schema: 'http://json-schema.org/draft-04/schema#',
			advanced: [
				'api_key',
				'admin_email_address',
			],
			required: [
				'api_key',
				'admin_email_address',
			],
			properties: {
				api_key: {
					type: 'string,',
					title: 'API Key,',
					description: 'Your unique ProsperWorks API key.,',
					default_jsonpath: '$.auth.api_key',
				},
				admin_email_address: {
					type: 'string,',
					title: 'Admin Email Address,',
					description: 'The email address of the admin that this API key belongs to.',
					default_jsonpath: '$.auth.admin_email_address',
				}
			},
			additionalProperties: false
		};

		clonedConfig.operations[0].globalSchema = globalSchema;
		clonedConfig.operations[0].excludeGlobalProperties = [];
		clonedConfig.operations[1].globalSchema = globalSchema;
		clonedConfig.operations[1].excludeGlobalProperties = ['api_key'];

		var parsed = parseConfig(clonedConfig);

		assert(_.isObject(parsed[0].messages[0].schema.input.admin_email_address));
		assert(_.isObject(parsed[0].messages[0].schema.input.api_key));
		assert.deepEqual(parsed[0].messages[0].schema.required, ['name', 'api_key', 'admin_email_address']);

		assert(_.isObject(parsed[0].messages[1].schema.input.admin_email_address));
		assert.deepEqual(parsed[0].messages[1].schema.required, ['name', 'admin_email_address']);

	});

	it('should parse the sub operations, if declared', function () {
		var parsed = parseConfig(sampleConfig);

		assert(_.isUndefined(parsed[0].messages[0].destroy));
		assert(_.isObject(parsed[0].messages[1].destroy));
	});

});