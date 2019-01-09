var assert         = require('assert');
global._ 	           = require('lodash');
global.when 	           = require('when');
var bindConnectors = require('../../lib/bindConnectors');

/* eslint-disable no-console */
describe.only('#bindConnectors', function () {

	global.falafel = {};

	var config = [],
		options = {};

	config.push({
		name: 'test_connector',
		globalModel: {},
		globalSchema: {},
		messages: [
			{
				name: 'test_op',
				schema: {
					name: 'test_op'
				},
				model: function (params) {
					return params;
				},
			},
			{
				name: 'test_op_promise',
				schema: {
					name: 'test_op_promise'
				},
				model: function (params) {
					return when.resolve(params);
				},
			},
			{
				name: 'test_fail_op',
				schema: {
					name: 'test_fail_op'
				},
				model: function (params) {
					throw new Error('Throw error.');
				},
			},
			{
				name: 'test_fail_op_promise',
				schema: {
					name: 'test_fail_op_promise'
				},
				model: function (params) {
					return when.reject({
						code: '#connector_error',
						message: 'Reject error'
					});
				},
			}
		]

	});

	var boundConnectors = bindConnectors(config, options);

	it('should pass simple function operation run', function (done) {

		boundConnectors(
			[
				{
					id: 'testID',
					header: {
						message: 'test_op'
					},
					body: {
						hello: 'world'
					}
				}
			],
			{

			},
			function (err, resArr) {
				if (err) {
					assert.fail(err);
				} else {
					assert.deepEqual(resArr[0].body, { hello: 'world' });
				}
				done();
			}
		);

	});

	it('should pass simple promise function operation run', function (done) {

		boundConnectors(
			[
				{
					id: 'testID',
					header: {
						message: 'test_op_promise'
					},
					body: {
						hello: 'world'
					}
				}
			],
			{

			},
			function (err, resArr) {
				if (err) {
					assert.fail(err);
				} else {
					assert.deepEqual(resArr[0].body, { hello: 'world' });
				}
				done();
			}
		);

	});

	it('should operation fail simple function operation run erring', function (done) {

		boundConnectors(
			[
				{
					id: 'testID',
					header: {
						message: 'test_fail_op'
					},
					body: {
						hello: 'world'
					}
				}
			],
			{

			},
			function (err, resArr) {
				if (err) {
					assert.fail(resArr);
				} else {
					assert(resArr[0].header.error);
					assert.deepEqual(resArr[0].body.message, 'Throw error.');
				}
				done();
			}
		);

	});

	it('should operation fail simple promise function operation run rejecting', function (done) {

		boundConnectors(
			[
				{
					id: 'testID',
					header: {
						message: 'test_fail_op_promise'
					},
					body: {
						hello: 'world'
					}
				}
			],
			{

			},
			function (err, resArr) {
				if (err) {
					assert.fail(resArr);
				} else {
					assert(resArr[0].header.error);
					assert.deepEqual(
						resArr[0].body,
						{
							code: '#connector_error',
							message: 'Reject error'
						}
					);
				}
				done();
			}
		);

	});


	//Timeout tests
	var timeoutConnectors = bindConnectors(
		[
			{
				name: 'timeout_connector',
				globalModel: {},
				globalSchema: {},
				messages: [
					{
						name: 'timeout_op',
						schema: {
							name: 'timeout_op'
						},
						model: function (params) {
							return params;
						},
					},
					{
						name: 'timeout_op_promise',
						schema: {
							name: 'timeout_op_promise'
						},
						model: function (params) {
							return when.resolve(params);
						},
					},
					{
						name: 'long_timeout_op_promise',
						schema: {
							name: 'timeout_op_promise'
						},
						model: function (params) {
							return when.promise(function (resolve, reject) {

								setTimeout(function () {
									resolve(params);
								}, 21000);

							});
						},
					}
				]

			}
		],
		options
	);

	it('should pass simple function operation run within timeout limit', function (done) {

		timeoutConnectors(
			[
				{
					id: 'testID',
					header: {
						message: 'timeout_op'
					},
					body: {
						hello: 'world'
					}
				}
			],
			{

			},
			function (err, resArr) {
				if (err) {
					assert.fail(err);
				} else {
					assert.deepEqual(resArr[0].body, { hello: 'world' });
				}
				done();
			}
		);

	});

	it('should pass simple function promise operation run within timeout limit', function (done) {

		timeoutConnectors(
			[
				{
					id: 'testID',
					header: {
						message: 'timeout_op_promise'
					},
					body: {
						hello: 'world'
					}
				}
			],
			{

			},
			function (err, resArr) {
				if (err) {
					assert.fail(err);
				} else {
					assert.deepEqual(resArr[0].body, { hello: 'world' });
				}
				done();
			}
		);

	});

	it('should error on lambda function level for operation not ending within time limit', function (done) {

		this.timeout(25000);

		timeoutConnectors(
			[
				{
					id: 'testID',
					header: {
						message: 'long_timeout_op_promise'
					},
					body: {
						hello: 'world'
					}
				}
			],
			{
				getRemainingTimeInMillis: function () {
					return 20000; //20s
				}
			},
			function (err, resArr) {
				if (err) {
					assert(err);
				} else {
					console.log(resArr);
					assert.fail(resArr);
				}
				done();
			}
		);

	});

});
