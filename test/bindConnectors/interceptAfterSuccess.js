var assert      = require('assert');
var _ 	        = require('lodash');
var interceptAfterSuccess = require('../../lib/bindConnectors/interceptAfterSuccess');


describe('#interceptAfterSuccess', function () {

	it('should modify afterSuccess if message.model is an object, and wrap arrays', function () {

		var message = interceptAfterSuccess({
			name: 'my-message',
			model: {
				url: 'http://mydomain.com/link',
				method: 'get'
			}
		});

		var testArray = ['a', 'b', 'c'];

		assert.deepEqual(
			message.model.afterSuccess(testArray, {}, {}),
			{
				results: testArray
			}
		);

	});

	it('should not wrap if not an array', function () {

		var message = interceptAfterSuccess({
			name: 'my-message',
			model: {
				url: 'http://mydomain.com/link',
				method: 'get'
			}
		});

		var testObject = {
			a: 'a',
			b: 'b',
			c: 'c'
		};

		assert.deepEqual(
			message.model.afterSuccess(testObject, {}, {}),
			testObject
		);

	});

	it('original model\'s afterSuccess should work', function () {

		var message = interceptAfterSuccess({
			name: 'my-message',
			model: {
				url: 'http://mydomain.com/link',
				method: 'get',
				afterSuccess: function (body) {
					return {
						items: body
					}
				}
			}
		});

		var testArray = ['a', 'b', 'c'];

		assert.deepEqual(
			message.model.afterSuccess(testArray, {}, {}),
			{
				items: testArray
			}
		);

	});

	it('should skip if message.model is a function', function () {

		var message = interceptAfterSuccess({
			name: 'my-message',
			model: function () {
				return 'Hello World.';
			}
		});

		var testArray = ['a', 'b', 'c'];

		assert(_.isFunction(message.model));
		assert(_.isUndefined(message.model.afterSuccess))
		assert.equal(message.model(), 'Hello World.');

	});


});
