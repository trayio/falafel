const assert = require('assert');
const { PassThrough } = require('stream');

const _ = require('lodash');

const formatOutput = require('../../lib/rawHttpRequest/formatOutput.js');

describe.only('formatOutput', () => {

	it('should be a function', () => {
		assert(_.isFunction(formatOutput));
	});

	it('should return in correct format', () => {

		const sampleParams = {
			body: {
				raw: 'Hello world',
			},
			processedBody: 'Hello world',
			headers: [
				{
					key: 'Authorization',
					value: 'Bearer test'
				}
			]
		};
		const sampleResponse = {
			statusCode: 200,
			headers: {
				'content-type': 'text/plain'
			},
			body: 'ok',
			raw: 'ok',
		};

		const formattedOutput = formatOutput(sampleResponse.body, sampleParams, sampleResponse);

		assert(_.isPlainObject(formattedOutput.response));
		const { response } = formattedOutput;
		assert.strictEqual(response.status_code, 200);
		assert.deepEqual(
			response.headers,
			{
				'content-type': 'text/plain'
			}
		);
		assert.strictEqual(response.body, 'ok');
	});

	it('should include raw_body if include_raw_body is true', () => {

		const sampleParams = {
			body: {
				raw: 'Hello world',
			},
			processedBody: 'Hello world',
			headers: [
				{
					key: 'Authorization',
					value: 'Bearer test'
				}
			],
			include_raw_body: true
		};
		const sampleResponse = {
			statusCode: 200,
			headers: {
				'content-type': 'text/plain'
			},
			body: 'ok',
			raw: 'ok',
		};

		const formattedOutput = formatOutput(sampleResponse.body, sampleParams, sampleResponse);

		assert(_.isPlainObject(formattedOutput.response));
		const { response } = formattedOutput;
		assert.strictEqual(response.status_code, 200);
		assert.deepEqual(
			response.headers,
			{
				'content-type': 'text/plain'
			}
		);
		assert.strictEqual(response.body, 'ok');
		assert.strictEqual(response.raw_body, 'ok');
	});

	it('should throw if body is too large', () => {

		const sampleParams = {
			body: {
				raw: 'Hello world',
			},
			processedBody: 'Hello world',
			headers: [
				{
					key: 'Authorization',
					value: 'Bearer test'
				}
			]
		};

		let largeBody;
		for (let count = 0; count < 1024; count++) {
			largeBody += 'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.';
		}

		const sampleResponse = {
			statusCode: 200,
			headers: {
				'content-type': 'text/plain'
			},
			body: largeBody,
			raw: largeBody,
		};

		try {
			const formattedOutput = formatOutput(sampleResponse.body, sampleParams, sampleResponse);
			assert.fail(formattedOutput);
		} catch (formatOutputError) {
			assert.strictEqual(formatOutputError.message, 'The operation result is too large. Modify the request to return a smaller response. If `Include raw body` is enabled, consider disabling it.');
			assert.strictEqual(formatOutputError.code, '#user_input_error');
		}
	});

});
