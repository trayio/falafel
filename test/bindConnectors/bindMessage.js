var assert      = require('assert');
var _ 	        = require('lodash');
var bindMessage = require('../../lib/bindConnectors/bindMessage');

var Threadneedle = require('@trayio/threadneedle');

var Falafel    = require('../../lib');

describe('#bindMessage', function () {

	before(function () {
		// Need this for subsequent tests from both this and other test files
		// Theses tests need to be fixed later
		new Falafel().wrap({
			directory: __dirname+'/../sample',
			dev: false
		});
	});

	it('should bind standard method to threadneedle', function () {
		var called = false;
		var boundMethod;

		bindMessage(
			{
				name: 'my-message',
				model: {
					url: 'http://mydomain.com/link',
					method: 'get'
				}
			},
			{
				addMethod: function (method) {
					called = true;
					boundMethod = method;
				}
			},
			{
				on: function () {},
				hasRequiredParams: function () {}
			}
		);

		assert(called);
		assert.equal(boundMethod, 'myMessage');

	});

	it('should bind function method to threadneedle', function () {
		var called = false;
		var boundMethod;

		bindMessage(
			{
				name: 'my-function-op',
				model: function () {

				}
			},
			{
				addMethod: function (method) {
					called = true;
					boundMethod = method;
				}
			},
			{
				on: function () {},
				hasRequiredParams: function () {}
			}
		);

		assert(called);
		assert.equal(boundMethod, 'myFunctionOp');

	});

	it('should execute function method when binded function is called', function (done) {
		var called = false;
		var boundMethod;

		var threadneedle = Threadneedle();

		var boundOp = bindMessage(
			{
				name: 'my-function-op',
				model: function () {
					called = true;
					return {
						result: true
					};
				},
				schema: {}
			},
			threadneedle,
			{
				on: function () {},
				hasRequiredParams: function () {}
			}
		);

		boundOp({
			body: {}
		})

		.done(
			function (result) {
				assert(called);
				assert.deepEqual(
					result.body,
					{
						result: true
					}
				);
				done();
			},
			function (err) {
				assert.fail(err);
				done();
			}
		);

	});

	it('should execute afterHeaders function for function method', function (done) {
		var afterHeadersCalled = false;
		var boundMethod;

		var threadneedle = Threadneedle();

		var boundOp = bindMessage(
			{
				name: 'my-function-op',
				model: function () {
					return {
						result: true
					};
				},
				schema: {},
				afterHeaders: function (error, params, body, res) {
					afterHeadersCalled = true;
					return params;
				}
			},
			threadneedle,
			{
				on: function () {},
				hasRequiredParams: function () {}
			}
		);

		boundOp({
			body: {
				gotHeaderViaParams: true
			}
		})

		.done(
			function (result) {
				assert(afterHeadersCalled);
				assert.deepEqual(
					result.headers,
					{
						gotHeaderViaParams: true
					}
				);
				assert.deepEqual(
					result.body,
					{
						result: true
					}
				);
				done();
			},
			function (err) {
				assert.fail(err);
				done();
			}
		);

	});

	it.skip('should ensure required keys, including with global', function () {
		var requiredKeys;

		bindMessage({
			name: 'my-message',
			model: {
				url: 'http://mydomain.com/link',
				method: 'get'
			},
			schema: {
				input: {
					name: {
						type: 'string'
					},
					age: {
						type: 'number',
						required: true
					}
				}
			}
		}, {
			addMethod: function (method) {}
		}, {
			on: function () {},
			hasRequiredParams: function (keys) {
				requiredKeys = keys;
			},
			globalSchema: {
				input: {
					access_token: {
						type: 'string',
						required: true
					}
				}
			}
		});

		assert.deepEqual(requiredKeys, [ 'age', 'access_token' ]);

	});

	it.skip('should bind the connector message', function () {

		var boundMessage;

		bindMessage({
			name: 'my-message',
			model: {
				url: 'http://mydomain.com/link',
				method: 'get'
			}
		}, {
			addMethod: function (method) {}
		}, {
			on: function (message) {
				boundMessage = message;
			},
			hasRequiredParams: function (keys) {}
		}, {});

		assert.equal(boundMessage, 'my-message');

	});

});
