const assert = require('assert');
const _ = require('lodash');
const when = require('when');

const bindTriggerRequest = require('../../lib/bindConnectors/bindTriggerRequest');

function requestResolveFormatAssert (requestData) {
	assert(_.isPlainObject(requestData));

	assert.strictEqual(requestData.version, 2);
	assert(_.isPlainObject(requestData.headers));
	assert(_.isPlainObject(requestData.body));

	assert.deepEqual(requestData.headers, {});
	assert.deepEqual(
		requestData.body,
		{
			output: {
				entity: 'user',
				result: 'abc123'
			},
			http: {
				headers: {},
				body: Buffer.from('something').toString('base64')
			}
		}
	);
}

function requestRejectFormatAssert (errorData) {
	assert(_.isPlainObject(errorData));

	assert(_.isPlainObject(errorData.headers));
	assert(_.isPlainObject(errorData.body));

	assert.strictEqual(errorData.body.code, '#no_trigger');
	assert.strictEqual(errorData.body.message, 'Unverified body');

	assert.deepEqual(
		errorData.body.http,
		{
			status: 500,
			body: 'Invalid request'
		}
	);
}

describe('#bindTrigger', function () {

	const devOptions = {
		dev: true
	};

	it('should return a function', function () {
		const requestFunc = bindTriggerRequest(
			{},
			{}
		);
		assert(_.isFunction(requestFunc));
	});

	describe('should return a promise on invocation', function () {

		it('request function', () => {

			const requestFunc = bindTriggerRequest(
				{
					request: function () {
						return {
							output: {}
						};
					}
				},
				devOptions
			);

			const returnedPromise = requestFunc({
				body: {
					input: {},
					http: {
						headers: {},
						body: '{}'
					}
				}
			});

			assert(when.isPromiseLike(returnedPromise));

		});

		it('request object', () => {

			const requestFunc = bindTriggerRequest(
				{
					request: {}
				},
				devOptions
			);

			const returnedPromise = requestFunc({
				body: {
					input: {},
					http: {
						headers: {},
						body: '{}'
					}
				}
			});

			assert(when.isPromiseLike(returnedPromise));

		});

	});

	describe('should return (resolve and reject) in correct format', function (done) {

		it('function resolve', (done) => {

			const requestFunc = bindTriggerRequest(
				{
					request: function (params, http) {
						return {
							output: {
								entity: params.entity,
								result: JSON.parse(http.body).userId
							},
							http: {
								headers: {},
								body: Buffer.from(http.headers.challenge).toString('base64')
							}
						};
					}
				},
				devOptions
			);

			requestFunc({
				body: {
					input: {
						entity: 'user'
					},
					http: {
						headers: {
							challenge: 'something'
						},
						body: {
							userId: 'abc123'
						}
					}
				}
			})

			.then(requestResolveFormatAssert)

			.then(done, done);

		});

		it('function - error on invalid body object', (done) => {

			const requestFunc = bindTriggerRequest(
				{
					request: function (params, http) {
						return '';
					}
				},
				devOptions
			);

			requestFunc({
				body: {
					input: {
						entity: 'user'
					},
					http: {
						headers: {
							challenge: 'something'
						},
						body: {
							userId: 'abc123'
						}
					}
				}
			})

			.catch((err) => {
				assert(_.includes(err.body.message, '`body` must be an object'));
			})

			.then(done, done);

		});

		it('function - error on missing `output` in body object', (done) => {

			const requestFunc = bindTriggerRequest(
				{
					request: function (params, http) {
						return {
							http: {
								headers: {},
								body: Buffer.from(http.headers.challenge).toString('base64')
							}
						};
					}
				},
				devOptions
			);

			requestFunc({
				body: {
					input: {
						entity: 'user'
					},
					http: {
						headers: {
							challenge: 'something'
						},
						body: {
							userId: 'abc123'
						}
					}
				}
			})

			.catch((err) => {
				assert(_.includes(err.body.message, 'with at least `output`'));
			})

			.then(done, done);

		});

		it('function reject', (done) => {

			const requestFunc = bindTriggerRequest(
				{
					request: function (params, http) {
						return when.reject({
							code: '#no_trigger',
							message: 'Unverified body',
							http: {
								status: 500,
								body: 'Invalid request'
							}
						});
					}
				},
				devOptions
			);

			requestFunc({
				body: {
					input: {},
					http: {
						headers: {},
						body: {}
					}
				}
			})

			.then(assert.fail)

			.catch(requestRejectFormatAssert)

			.then(done, done);

		});

		it('object resolve', (done) => {

			const requestFunc = bindTriggerRequest(
				{
					request: {
						before: function (params, http) {
							return {
								entity: params.entity,
								result: JSON.parse(http.body).userId
							};
						},
						reply: function (params, http, output) {
							return {
								headers: {},
								body: http.headers.challenge
							};
						}
					}
				},
				devOptions
			);

			requestFunc({
				body: {
					input: {
						entity: 'user'
					},
					http: {
						headers: {
							challenge: 'something'
						},
						body: {
							userId: 'abc123'
						}
					}
				}
			})

			.then(requestResolveFormatAssert)

			.then(done, done);

		});

		it('object reject', (done) => {

			const requestFunc = bindTriggerRequest(
				{
					request: {
						before: function (params, http) {
							return when.reject({
								code: '#no_trigger',
								message: 'Unverified body',
								http: {
									status: 500,
									body: 'Invalid request'
								}
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
						body: {}
					}
				}
			})

			.then(assert.fail)

			.catch(requestRejectFormatAssert)

			.then(done, done);

		});

	});

	it('should return defaults of filter true, before body, and reply undefined', function (done) {

		const requestFunc = bindTriggerRequest(
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

		.then(function (response) {

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
		})

		.catch(assert.fail)

		.then(done, done);

	});

	it('should return code #trigger_ignore on filter false', function (done) {
		this.slow(1200);

		const requestFunc = bindTriggerRequest(
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

		.then(assert.fail)

		.catch(function (err) {
			assert.deepEqual(
				err.body,
				{
					code: '#trigger_ignore',
					message: 'Ignore this request.'
				}
			);
		})

		.then(done, done);

	});


	it('should allow filter to be a promise', function (done) {
		this.slow(1200);

		const requestFunc = bindTriggerRequest(
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

		.then(function (response) {
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
		})

		.then(done, done);

	});

	it('should allow before to be a promise', function (done) {
		this.slow(1200);

		const returnBody = { test: 123 };

		const requestFunc = bindTriggerRequest(
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

		.then(function (response) {
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
		})

		.then(done, done);

	});

	it('should allow reply to be a promise', function (done) {
		this.slow(1200);

		const returnBody = { test: 123 };

		const requestFunc = bindTriggerRequest(
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

		.then(function (response) {
			assert.deepEqual(
				response,
				{
					version: 2,
					headers: {},
					body: {
						output: '{}',
						http: {
							body: Buffer.from(JSON.stringify(returnBody)).toString('base64')
						}
					}
				}
			);
		})

		.then(done, done);

	});


	it('should set trigger_deduplication_id when getUniqueTriggerID returns a valid string', function (done) {
		this.slow(1200);

		const returnBody = { test: 123 };

		const requestFunc = bindTriggerRequest(
			{
				request: {
					reply: function () {
						return {
							body: returnBody
						};
					},
					getUniqueTriggerID: function () {
						return '123';
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

		.then(function (response) {
			assert.deepEqual(
				response,
				{
					version: 2,
					headers: {
						trigger_deduplication_id: '123'
					},
					body: {
						output: '{}',
						http: {
							body: Buffer.from(JSON.stringify(returnBody)).toString('base64')
						}
					}
				}
			);
		})

		.then(done, done);

	});

	it('should set trigger_deduplication_id when getUniqueTriggerID returns a valid number', function (done) {
		this.slow(1200);

		const returnBody = { test: 123 };

		const requestFunc = bindTriggerRequest(
			{
				request: {
					reply: function () {
						return {
							body: returnBody
						};
					},
					getUniqueTriggerID: function () {
						return 123;
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

		.then(function (response) {
			assert.deepEqual(
				response,
				{
					version: 2,
					headers: {
						trigger_deduplication_id: 123
					},
					body: {
						output: '{}',
						http: {
							body: Buffer.from(JSON.stringify(returnBody)).toString('base64')
						}
					}
				}
			);
		})

		.then(done, done);

	});

	it('should set trigger_deduplication_id when getUniqueTriggerID returns a valid value as a promise', function (done) {
		this.slow(1200);

		const returnBody = { test: 123 };

		const requestFunc = bindTriggerRequest(
			{
				request: {
					reply: function () {
						return {
							body: returnBody
						};
					},
					getUniqueTriggerID: function () {
						return when.resolve('123');
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

		.then(function (response) {
			assert.deepEqual(
				response,
				{
					version: 2,
					headers: {
						trigger_deduplication_id: '123'
					},
					body: {
						output: '{}',
						http: {
							body: Buffer.from(JSON.stringify(returnBody)).toString('base64')
						}
					}
				}
			);
		})

		.then(done, done);

	});

	it('should error when getUniqueTriggerID is an invalid value', function (done) {
		this.slow(1200);

		const returnBody = { test: 123 };

		const requestFunc = bindTriggerRequest(
			{
				request: {
					reply: function () {
						return {
							body: returnBody
						};
					},
					getUniqueTriggerID: function () {
						return null;
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

		.then(assert.fail)

		.catch(function (err) {
			assert.deepEqual(
				{
					headers: {},
					body: {
						code: '#connector_error',
						message: 'The result of getUniqueTriggerID is not a string or number.',
						payload: null
					}
				},
				err
			);
		})

		.then(done, done);

	});

	it('should error when getUniqueTriggerID rejects', function (done) {
		this.slow(1200);

		const returnBody = { test: 123 };

		const requestFunc = bindTriggerRequest(
			{
				request: {
					reply: function () {
						return {
							body: returnBody
						};
					},
					getUniqueTriggerID: function () {
						return when.reject('getUniqueTriggerID error');
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

		.then(assert.fail)

		.catch(function (err) {
			assert.deepEqual(err.body, 'getUniqueTriggerID error');
		})

		.then(done, done);

	});

});
