var assert         = require('assert');
global._ 	           = require('lodash');
global.when 	           = require('when');
var bindConnectors = require('../../lib/bindConnectors');

/* eslint-disable no-console */
describe('#bindConnectors', function () {

	global.falafel = {};

	var options = {};

	describe('standard tests', function () {

		var config = [];

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

		it('should pass simple function operation run', function () {

			return boundConnectors(
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

				}
			)

			.then(function (resArr) {
				assert.deepEqual(resArr[0].body, { hello: 'world' });
			});

		});

		it('should pass simple promise function operation run', function () {

			return boundConnectors(
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

				}
			)

			.then(function (resArr) {
				assert.deepEqual(resArr[0].body, { hello: 'world' });
			});

		});

		it('should operation fail simple function operation run erring', function () {

			return boundConnectors(
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

				}
			)

			.then(function (resArr) {
				assert(resArr[0].header.error);
				assert.deepEqual(resArr[0].body.message, 'Throw error.');
			});

		});

		it('should operation fail simple promise function operation run rejecting', function () {

			return boundConnectors(
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

				}
			)

			.then(function (resArr) {
				assert(resArr[0].header.error);
				assert.deepEqual(
					resArr[0].body,
					{
						code: '#connector_error',
						message: 'Reject error',
						isAPIResponseError: false
					}
				);
			});

		});

		it('should error for an event without a header', function () {

			return boundConnectors(
				[
					{
						id: 'testID',
						body: {
							hello: 'world'
						}
					}
				],
				{

				}
			)

			.then(function (resArr) {
				assert.strictEqual(resArr[0].id, 'testID');
				assert.strictEqual(resArr[0].header.error, true);
				assert.strictEqual(resArr[0].body.code, '#connector_error');
				assert.strictEqual(resArr[0].body.message, 'Invalid operation received.');
			});

		});

		it('should error for an operation that does not exist', function () {

			return boundConnectors(
				[
					{
						id: 'testID',
						header: {
							message: 'unknown_op'
						},
						body: {
							hello: 'world'
						}
					}
				],
				{

				}
			)

			.then(function (resArr) {
				assert.strictEqual(resArr[0].header.error, true);
				assert.strictEqual(resArr[0].body.code, '#connector_error');
				assert.strictEqual(resArr[0].body.message, 'Could not find a valid operation handler for unknown_op');
			});

		});

	});

	describe('test mode tests', function () {

		var triggerConfig = [
			{
				name: 'test_trigger',
				globalModel: {},
				globalSchema: {},
				messages: [
					{
						name: 'webhook',
						schema: {
							name: 'test_op'
						},
						model: function (params) {
							return params;
						},
						destroy: function (params) {
							return params;
						},
						request: {
							filter: function () {
								return true;
							},
							before: function (params, http) {
								return http.body;
							}
						},
						response: function (params, http, reply) {
							return reply;
						}
					}
				]

			}
		];

		it('should not have sub-operations in non-test mode', function () {

			var boundTriggers = bindConnectors(triggerConfig, options);
			assert.deepEqual(falafel['testTrigger']['webhookRequest'], undefined);
			assert.ok(falafel['testTrigger']['webhookDestroy']);

		});

		it('should have sub-operations in test mode', function () {

			var boundTriggers = bindConnectors(triggerConfig, { test: true });
			assert.ok(falafel['testTrigger']['webhookRequest']);
			assert.ok(falafel['testTrigger']['webhookResponse']);

		});

		it('should run sub-operations in test mode as normal', function (done) {

			var boundTriggers = bindConnectors(triggerConfig, { test: true });

			falafel['testTrigger']['webhookRequest']({
				id: 'testID',
				header: {
					message: 'webhook_request'
				},
				body: {
					input: {
						hello: 'world'
					},
					http: {
						method: 'GET',
						statusCode: 200,
						body: { success: true }
					}
				}
			})

			.then(function (requestRes) {
				assert.deepEqual(JSON.parse(requestRes.body.output), { success: true });
			})

			.then(done, done);

		});

	});

	describe('timeout tests', function () {

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

		it('should pass simple function operation run within timeout limit', function () {

			return timeoutConnectors(
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

				}
			)

			.then(function (resArr) {
				assert.deepEqual(resArr[0].body, { hello: 'world' });
			});

		});

		it('should pass simple function promise operation run within timeout limit', function () {

			return timeoutConnectors(
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

				}
			)

			.then(function (resArr) {
				assert.deepEqual(resArr[0].body, { hello: 'world' });
			});

		});

		it('should error on lambda function level for operation not ending within time limit', function () {
			this.timeout(10000);

			return timeoutConnectors(
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
						return 6000; //20s
					}
				}
			)

			.then(function (resArr) {
				assert.strictEqual(resArr[0].header.error, true);
				assert.strictEqual(resArr[0].body.code, '#timeout_error');
				assert.strictEqual(resArr[0].body.message, 'The operation timed out.');
				assert(_.includes(resArr[0].body.payload.reason, 'The operation has timed out due to the promise not closing'));
				assert.strictEqual(resArr[0].body.payload.operation, 'long_timeout_op_promise');
			});
		});

	});

});
