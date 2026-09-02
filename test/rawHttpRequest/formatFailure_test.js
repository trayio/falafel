const assert = require('assert');

const _ = require('lodash');

const formatFailure = require('../../lib/rawHttpRequest/formatFailure.js');
const isAPIResponseError = require('../../lib/utils/isAPIResponseError.js');

const sampleHeaders = {
	'content-type': 'application/json',
	'retry-after': '30',
	'x-request-id': 'abc123'
};

const sampleResponse = {
	statusCode: 429,
	headers: sampleHeaders
};

//An `expects` failure as produced by threadneedle
function expectsError () {
	return {
		response: {
			statusCode: 429,
			body: { error: 'slow down' }
		},
		expects: { statusCode: [200] },
		code: 'too_many_requests',
		message: 'Too many requests.'
	};
}


describe('isAPIResponseError', () => {

	it('should be a function', () => {
		assert(_.isFunction(isAPIResponseError));
	});

	describe('should return true for API response errors', () => {

		it('status code `expects` failure', () => {
			assert.strictEqual(isAPIResponseError(expectsError()), true);
		});

		it('`notExpects` failure', () => {
			assert.strictEqual(isAPIResponseError({
				response: { statusCode: 200, body: 'FAILED' },
				notExpects: { body: ['FAILED'] },
				code: 'invalid_response_body',
				message: 'Invalid response body'
			}), true);
		});

		/*
			A function form `expects` produces no `expects` key, so the status
			code is the only thing identifying this as a response error.
		*/
		it('function form `expects` failure (no `expects` key)', () => {
			const error = {
				code: 'invalid_response_function',
				response: { statusCode: 200, body: { status: 'FAILED' } },
				message: 'API reported FAILED'
			};
			assert.strictEqual(_.has(error, 'expects'), false);
			assert.strictEqual(isAPIResponseError(error), true);
		});

	});

	describe('should return false where no usable response was received', () => {

		it('error thrown in a hook', () => {
			const error = new Error('Full URL must start with either `http://` or `https://`.');
			error.code = '#user_input_error';
			assert.strictEqual(isAPIResponseError(error), false);
		});

		it('transport failure', () => {
			const error = new Error('connect ECONNREFUSED 127.0.0.1:80');
			error.code = 'ECONNREFUSED';
			assert.strictEqual(isAPIResponseError(error), false);
		});

		it('connector bug', () => {
			assert.strictEqual(isAPIResponseError(new TypeError('undefined is not a function')), false);
		});

		/*
			threadneedle reports a socket hang up as a plain object, but with no
			usable response.
		*/
		it('socket hang up (`api_timeout`)', () => {
			assert.strictEqual(isAPIResponseError({
				code: 'api_timeout',
				response: {},
				message: 'API call timeout.'
			}), false);
		});

		it('undefined and non-objects', () => {
			assert.strictEqual(isAPIResponseError(undefined), false);
			assert.strictEqual(isAPIResponseError('something'), false);
			assert.strictEqual(isAPIResponseError(null), false);
		});

		/*
			Known limitation, documented rather than worked around: a connector
			level global `afterFailure` runs before the operation's own, so one
			that discards `err.response` leaves nothing to identify the failure
			as an API response error. Recovering it would mean matching against
			threadneedle's internal error codes, which is not worth the coupling
			- and would fail anyway if the hook also rewrote the code.
		*/
		it('error reshaped by a global `afterFailure` that discarded `response`', () => {
			assert.strictEqual(isAPIResponseError({
				code: 'not_found',
				message: 'Not found.'
			}), false);
		});

	});

});


describe('formatFailure', () => {

	it('should be a function', () => {
		assert(_.isFunction(formatFailure));
	});

	it('should add the response headers to an API response error', () => {

		const result = formatFailure(expectsError(), {}, sampleResponse);

		assert.deepStrictEqual(result.response, {
			statusCode: 429,
			body: { error: 'slow down' },
			headers: sampleHeaders
		});

	});

	it('should preserve the existing error properties', () => {

		const result = formatFailure(expectsError(), {}, sampleResponse);

		assert.strictEqual(result.code, 'too_many_requests');
		assert.strictEqual(result.message, 'Too many requests.');
		assert.deepStrictEqual(result.expects, { statusCode: [200] });

	});

	it('should default the headers to an empty object when absent', () => {

		const result = formatFailure(expectsError(), {}, {});

		assert.deepStrictEqual(result.response.headers, {});

	});

	it('should not modify an error thrown in a hook', () => {

		const error = new Error('`body` must be supplied. Please select a valid "Body Type".');
		error.code = '#user_input_error';

		const result = formatFailure(error, {}, {});

		assert.strictEqual(result, error);
		assert.strictEqual(_.has(result, 'response'), false);

	});

	it('should not add a `response` object to a reshaped error that has none', () => {

		const result = formatFailure({ code: 'not_found', message: 'Not found.' }, {}, sampleResponse);

		assert.strictEqual(_.has(result, 'response'), false);

	});

});
