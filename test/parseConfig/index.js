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

	it('should parse the sub operations, if declared', function () {
		var parsed = parseConfig(sampleConfig);

		assert(_.isUndefined(parsed[0].messages[0].destroy));
		assert(_.isObject(parsed[0].messages[1].destroy));
	});

});