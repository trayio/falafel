var assert      = require('assert');
var _ 	        = require('lodash');
var when		= require('when');
var interceptAfterSuccess = require('../../lib/bindConnectors/interceptAfterSuccess');


describe('#interceptAfterSuccess', function () {

	it('should modify afterSuccess if message.model is an object, and wrap arrays', function (done) {

		var message = interceptAfterSuccess({
			name: 'my-message',
			model: {
				url: 'http://mydomain.com/link',
				method: 'get'
			}
		});

		var testArray = ['a', 'b', 'c'];

		when(
			message.model.afterSuccess(testArray, {}, {})
		)
		.done(
			function (result) {
				assert.deepEqual(
					result,
					{
						results: testArray
					}
				);
				done();
			},
			done
		);

	});

	it('should not wrap if not an array', function (done) {

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

		when(
			message.model.afterSuccess(testObject, {}, {})
		)
		.done(
			function (result) {
				assert.deepEqual(
					result,
					testObject
				);
				done();
			},
			done
		);

	});

	it('original model\'s afterSuccess should work', function (done) {

		var message = interceptAfterSuccess({
			name: 'my-message',
			model: {
				url: 'http://mydomain.com/link',
				method: 'get',
				afterSuccess: function (body) {
					return {
						items: body
					};
				}
			}
		});

		var testArray = ['a', 'b', 'c'];

		when(
			message.model.afterSuccess(testArray, {}, {})
		)
		.done(
			function (result) {
				assert.deepEqual(
					result,
					{
						items: testArray
					}
				);
				done();
			},
			done
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
		assert(_.isUndefined(message.model.afterSuccess));
		assert.equal(message.model(), 'Hello World.');

	});


});
