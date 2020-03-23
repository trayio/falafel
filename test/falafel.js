var assert     = require('assert');
var _ 	       = require('lodash');
var fs 		     = require('fs');
var proxyquire = require('proxyquire');
var Falafel    = require('../lib');


describe('falafel', function () {

	it('should return an object with a `wrap` function', function () {
		assert(_.isFunction(Falafel));
		var falafel = new Falafel();
		assert(_.isObject(falafel));
		assert(_.isFunction(falafel.wrap));
	});

	it('should set globals', function () {
		new Falafel().wrap({
			directory: __dirname+'/sample'
		});

		assert(_.isObject(global.falafel));
		assert(global._);
		assert(global.when);
	});

	it('should create the connectors.json in dev mode', function () {
		var called = false;

		var Falafel = proxyquire('../lib', {
			'./buildConnectorsJson': function () {
				called = true;
			},
			'./devServer': function () {}
		});

		new Falafel().wrap({
			directory: __dirname+'/sample',
			dev: true
		});

		assert(called);
	});

	it('should not create the connectors.json in prod mode', function () {
		var called = false;

		var Falafel = proxyquire('../lib', {
			'./buildConnectorsJson': function () {
				called = true;
			}
		});

		new Falafel().wrap({
			directory: __dirname+'/sample',
			dev: false
		});

		assert.strictEqual(called, false);
	});

	it('should not spin up express server in dev mode with flag set', function () {
		process.env.FALAFEL_DISABLE_DEV_SERVER = 'true';
		var called = false;

		var Falafel = proxyquire('../lib', {
			'./buildConnectorsJson': function () {},
			'./devServer': function () {
				called = true;
			}
		});

		new Falafel().wrap({
			directory: __dirname+'/sample',
			dev: true
		});
		delete process.env.FALAFEL_DISABLE_DEV_SERVER;
		assert.strictEqual(called, false);
	});

	it('should spin up express server in dev mode with no flag set', function () {
		var called = false;

		var Falafel = proxyquire('../lib', {
			'./buildConnectorsJson': function () {},
			'./devServer': function () {
				called = true;
			}
		});

		new Falafel().wrap({
			directory: __dirname+'/sample',
			dev: true
		});
		assert(called);
	});

	it('should return JSON schema for generateJsonSchema method', function () {

		var jsonSchema = new Falafel().generateJsonSchema({
			directory: __dirname+'/sample',
			dev: true
		});

		assert(_.isArray(jsonSchema));
		var mailchimpSchema = jsonSchema[0];
		assert.equal(mailchimpSchema.name, 'mailchimp');
		assert(_.isArray(mailchimpSchema.messages));
		assert.equal(mailchimpSchema.messages[0].name, 'get_list');
		assert(_.includes(mailchimpSchema.messages[0].input_schema.required, 'access_token'));

	});

	it('should return JSON schema via generateJsonSchema for schema only connector', function () {

		var jsonSchema = new Falafel().generateJsonSchema({
			directory: __dirname+'/modellessSample',
			dev: true
		});

		assert(_.isArray(jsonSchema));
		var hasSchemaJSON = _.find(jsonSchema, [ 'name', 'hasSchema' ]);
		assert(_.isPlainObject(hasSchemaJSON));
		var getListSchema = hasSchemaJSON.messages[0];
		assert.strictEqual(getListSchema.input_schema.properties.access_token.default_jsonpath, '$.auth.access_token');
		assert.strictEqual(getListSchema.input_schema.properties.another_field.title, 'Another field');
		assert.strictEqual(getListSchema.output_schema.properties.name.type, 'string');

	});

	it('should return JSON schema via generateJsonSchema for schema only connector', function () {

		var jsonSchema = new Falafel().generateJsonSchema({
			directory: __dirname+'/modellessSample',
			dev: true
		});

		assert(_.isArray(jsonSchema));
		var hasNoSchemaJSON = _.find(jsonSchema, [ 'name', 'hasNoSchema' ]);
		assert(_.isPlainObject(hasNoSchemaJSON));
		assert(_.isArray(hasNoSchemaJSON.messages));
		assert.equal(hasNoSchemaJSON.messages, 0);

	});

});
