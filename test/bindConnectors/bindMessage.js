var assert      = require('assert');
var _ 	        = require('lodash');
var bindMessage = require('../../lib/bindConnectors/bindMessage');


describe('#bindMessage', function () {


	// beforeEach(function () {

	// });

	it('should bind the method to threadneedle', function () {
		var called = false;
		var boundMethod;

		bindMessage({
			name: 'my-message',
			model: {
				url: 'http://mydomain.com/link',
				method: 'get'
			}
		}, {
			addMethod: function (method) {
				called = true;
				boundMethod = method;
			}
		}, {
			on: function () {},
			hasRequiredParams: function () {}
		});

		assert(called);
		assert.equal(boundMethod, 'myMessage');

	});

	it('should ensure required keys', function () {
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
			}
		});

		assert.deepEqual(requiredKeys, ['age']);

	});

	it('should bind the connector message', function () {

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
		});

		assert.equal(boundMessage, 'my-message');

	});

});