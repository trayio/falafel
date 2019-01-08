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
					done();
				}
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
					done();
				}
			}
		);

	});


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
					done();
				}
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
					done();
				}
			}
		);

	});

	it('should return timeout error for operation not ending within time limit', function (done) {

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
