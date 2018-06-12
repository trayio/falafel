var assert		= require('assert');
var _			= require('lodash');
var when		= require('when');

var bindTriggerRequest = require('../../lib/bindConnectors/bindTriggerRequest');

describe('#bindTrigger', function () {

	var devOptions = {
		dev: true
	};

	it('should return a function', function () {

		var requestFunc = bindTriggerRequest(
			{},
			{}
		);

		assert(_.isFunction(requestFunc));

	});

	it('should return a promise on invocation', function () {

		var requestFunc = bindTriggerRequest(
			{
				request: function () {}
			},
			devOptions
		);

		var returnedPromise = requestFunc({
			body: {
				input: {},
				http: {
					headers: {},
					body: '{}'
				}
			}
		});

		assert(when.isPromiseLike(returnedPromise));


		var requestFunc2 = bindTriggerRequest(
			{
				request: {}
			},
			devOptions
		);

		var returnedPromise2 = requestFunc2({
			body: {
				input: {},
				http: {
					headers: {},
					body: '{}'
				}
			}
		});

		assert(when.isPromiseLike(returnedPromise2));

	});


	it('should return defaults of filter true, before body, and reply undefined', function (done) {

		var requestFunc = bindTriggerRequest(
			{
				request: {}
			},
			devOptions
		);

		requestFunc({
			body: {
				input: {},
				http: {
					headers: {},
					body: '{}'
				}
			}
		})

		.done(
			function (response) {

				assert.deepEqual(
					response,
					{
						version: 2,
						headers: {},
						body: {
							output: '{}',
							http: undefined
						}
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

	it('should return code #trigger_ignore on filter false', function (done) {
		this.slow(1200);

		var requestFunc = bindTriggerRequest(
			{
				request: {
					filter: function () {
						return when.promise(function (resolve) {
							setTimeout(function () {
								resolve(false);
							}, 1000);
						});
					}
				}
			},
			devOptions
		);

		requestFunc({
			body: {
				input: {},
				http: {
					headers: {},
					body: '{}'
				}
			}
		})

		.done(
			function (response) {
				assert.fail(response);
				done();
			},
			function (err) {
				assert.deepEqual(
					err.body,
					{
						code: '#trigger_ignore',
						message: 'Ignore this request.'
					}
				);
				done();
			}
		);

	});


	it('should allow filter to be a promise', function (done) {
		this.slow(1200);

		var requestFunc = bindTriggerRequest(
			{
				request: {
					filter: function () {
						return when.promise(function (resolve) {
							setTimeout(function () {
								resolve(true);
							}, 1000);
						});
					}
				}
			},
			devOptions
		);

		requestFunc({
			body: {
				input: {},
				http: {
					headers: {},
					body: '{}'
				}
			}
		})

		.done(
			function (response) {
				assert.deepEqual(
					response,
					{
						version: 2,
						headers: {},
						body: {
							output: '{}',
							http: undefined
						}
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

	it('should allow before to be a promise', function (done) {
		this.slow(1200);

		var returnBody = { test: 123 };

		var requestFunc = bindTriggerRequest(
			{
				request: {
					before: function () {
						return when.promise(function (resolve) {
							setTimeout(function () {
								resolve(returnBody);
							}, 1000);
						});
					}
				}
			},
			devOptions
		);

		requestFunc({
			body: {
				input: {},
				http: {
					headers: {},
					body: '{}'
				}
			}
		})

		.done(
			function (response) {
				assert.deepEqual(
					response,
					{
						version: 2,
						headers: {},
						body: {
							output: returnBody,
							http: undefined
						}
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

	it('should allow reply to be a promise', function (done) {
		this.slow(1200);

		var returnBody = { test: 123 };

		var requestFunc = bindTriggerRequest(
			{
				request: {
					reply: function () {
						return when.promise(function (resolve) {
							setTimeout(function () {
								resolve({
									body: returnBody
								});
							}, 1000);
						});
					}
				}
			},
			devOptions
		);

		requestFunc({
			body: {
				input: {},
				http: {
					headers: {},
					body: '{}'
				}
			}
		})

		.done(
			function (response) {
				assert.deepEqual(
					response,
					{
						version: 2,
						headers: {},
						body: {
							output: '{}',
							http: {
								body: new Buffer(JSON.stringify(returnBody)).toString('base64')
							}
						}
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

});
