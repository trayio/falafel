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

		assert(_.isObject(GLOBAL.falafel));
		assert(GLOBAL._);
		assert(GLOBAL.when);
	});

	it('should create the connectors.json in dev mode', function () {
		var called = false;

		var Falafel = proxyquire('../lib', {
			'./buildConnectorsJson': function () {
				called = true;
			}
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

	it.skip('should work with a sample message', function () {

	});

	it.skip('should work with a sample destroy', function () {

	});

	it.skip('should work with a sample request', function () {

	});

	it.skip('should work with a sample response', function () {

	});

});
