const assert = require('assert');

const _ = require('lodash');

const formatError = require('../../lib/bindConnectors/formatError.js');

const event = { id: 'event-1' };

//Builds a fake stack referencing a given threadneedle source file
function threadneedleStack (sourceFile) {
	return [
		'Error: something went wrong',
		'    at module.exports (/app/node_modules/@trayio/threadneedle/lib/addMethod/' + sourceFile + ':42:11)',
		'    at addMethodREST (/app/node_modules/@trayio/threadneedle/lib/addMethod/addMethodREST.js:99:3)'
	].join('\n');
}

function errorWithStack (message, stack, code) {
	const error = new Error(message);
	error.stack = stack;
	if (code) {
		error.code = code;
	}
	return error;
}


describe('formatError', () => {

	it('should be a function', () => {
		assert(_.isFunction(formatError));
	});

	describe('envelope', () => {

		it('should return the event id, an error header and a body', () => {

			const formatted = formatError({ headers: {}, body: { code: '#api_error', message: 'Boom' } }, event);

			assert.strictEqual(formatted.id, 'event-1');
			assert.strictEqual(formatted.header.error, true);
			assert.strictEqual(formatted.body.code, '#api_error');
			assert.strictEqual(formatted.body.message, 'Boom');

		});

		it('should merge the response headers into the header, keeping `error` true', () => {

			const formatted = formatError({
				headers: { error: false, trigger_deduplication_id: 'abc' },
				body: {}
			}, event);

			assert.strictEqual(formatted.header.error, true);
			assert.strictEqual(formatted.header.trigger_deduplication_id, 'abc');

		});

		it('should default the code and message when neither is supplied', () => {

			const formatted = formatError({ headers: {}, body: {} }, event);

			assert.strictEqual(formatted.body.code, '#api_error');
			assert.strictEqual(formatted.body.message, 'API error');

		});

		/*
			The cluster service calls this with the `{ headers, body }` shape,
			but a bare Error is normalised into it first.
		*/
		it('should accept a bare Error as the response', () => {

			const formatted = formatError(new Error('bare error'), event);

			assert.strictEqual(formatted.header.error, true);
			assert.strictEqual(formatted.body.message, 'bare error');
			assert.strictEqual(formatted.body.code, '#api_error');

		});

	});

	describe('Error instances', () => {

		it('should default to `#api_error` when the Error has a message', () => {

			const formatted = formatError({ headers: {}, body: new Error('the API said no') }, event);

			assert.strictEqual(formatted.body.code, '#api_error');
			assert.strictEqual(formatted.body.message, 'the API said no');

		});

		it('should default to `#connector_error` when the Error has no message', () => {

			const formatted = formatError({ headers: {}, body: new Error() }, event);

			assert.strictEqual(formatted.body.code, '#connector_error');
			assert.strictEqual(formatted.body.message, 'No error message defined.');

		});

		it('should preserve an explicitly set code', () => {

			const error = new Error('bad input');
			error.code = '#user_input_error';

			const formatted = formatError({ headers: {}, body: error }, event);

			assert.strictEqual(formatted.body.code, '#user_input_error');

		});

		it('should not carry arbitrary custom properties through', () => {

			const error = new Error('boom');
			error.somethingCustom = 'dropped';

			const formatted = formatError({ headers: {}, body: error }, event);

			assert.strictEqual(_.has(formatted.body, 'somethingCustom'), false);

		});

		describe('should treat native programming errors as connector errors', () => {

			[ TypeError, ReferenceError, SyntaxError ].forEach((ErrorConstructor) => {

				it(ErrorConstructor.name, () => {

					const formatted = formatError({
						headers: {},
						body: new ErrorConstructor('programming mistake')
					}, event);

					assert.strictEqual(formatted.body.code, '#connector_error');
					assert(_.isArray(formatted.body.stack));
					assert(_.includes(formatted.body.stack[0], 'programming mistake'));

				});

			});

			it('should keep an explicit code on a native error', () => {

				const error = new TypeError('programming mistake');
				error.code = '#user_input_error';

				const formatted = formatError({ headers: {}, body: error }, event);

				assert.strictEqual(formatted.body.code, '#user_input_error');
				assert(_.isArray(formatted.body.stack));

			});

		});

		it('should include a cleaned stack for an explicit `#connector_error`', () => {

			const error = errorWithStack('deliberate', 'Error: deliberate\n    at somewhere.js:1:1', '#connector_error');

			const formatted = formatError({ headers: {}, body: error }, event);

			assert.strictEqual(formatted.body.code, '#connector_error');
			assert.deepStrictEqual(formatted.body.stack, [
				'Error: deliberate',
				'at somewhere.js:1:1'
			]);

		});

	});

	/*
		Misconfigured models surface as errors thrown from inside threadneedle.
		These are the connector author's mistake, not the API's, so they are
		reclassified from the stack contents.
	*/
	describe('threadneedle errors', () => {

		const reclassified = [
			[ 'addMethodSOAP.js', 'The SOAP method does not exist.' ],
			[ 'globalize/baseUrl.js', 'Use `baseUrl` instead.' ],
			[ 'globalize/afterHeaders.js', '`afterHeaders` must return an object.' ],
			[ 'validateRESTInput.js', 'A valid URL has not been supplied.' ],
			[ 'validateSOAPInput.js', 'A `wsdl` must be supplied.' ],
			[ 'globalize/validateObjectArgumentByReference.js', '`before` must return an object.' ]
		];

		reclassified.forEach(([ sourceFile, message ]) => {

			it('should reclassify errors from ' + sourceFile, () => {

				const error = errorWithStack(message, threadneedleStack(sourceFile));

				const formatted = formatError({ headers: {}, body: error }, event);

				assert.strictEqual(formatted.body.code, '#connector_error');
				assert(_.isArray(formatted.body.stack));

			});

		});

		it('should not reclassify an error whose stack is unrelated to threadneedle', () => {

			const error = errorWithStack(
				'A valid URL has not been supplied.',
				'Error: A valid URL has not been supplied.\n    at /app/lib/somewhere.js:1:1'
			);

			const formatted = formatError({ headers: {}, body: error }, event);

			assert.strictEqual(formatted.body.code, '#api_error');
			assert.strictEqual(_.has(formatted.body, 'stack'), false);

		});

		/*
			The message is checked as well as the stack, so a threadneedle stack
			with an unrecognised message is left alone.
		*/
		it('should not reclassify a threadneedle stack with an unrecognised message', () => {

			const error = errorWithStack('something else entirely', threadneedleStack('addMethodSOAP.js'));

			const formatted = formatError({ headers: {}, body: error }, event);

			assert.strictEqual(formatted.body.code, '#api_error');

		});

		it('should not reclassify an error with no stack at all', () => {

			const error = new Error('no stack here');
			delete error.stack;

			const formatted = formatError({ headers: {}, body: error }, event);

			assert.strictEqual(formatted.body.code, '#api_error');

		});

	});

	describe('plain object errors', () => {

		it('should pass the details through untouched', () => {

			const formatted = formatError({
				headers: {},
				body: { code: 'not_found', message: 'Not found.', expects: { statusCode: [200] } }
			}, event);

			assert.strictEqual(formatted.body.code, 'not_found');
			assert.deepStrictEqual(formatted.body.expects, { statusCode: [200] });

		});

		it('should stringify a buffer response body', () => {

			const formatted = formatError({
				headers: {},
				body: { code: 'bad_request', response: { statusCode: 400, body: Buffer.from('the API said no') } }
			}, event);

			assert.strictEqual(formatted.body.response.body, 'the API said no');

		});

		it('should leave a non-buffer response body alone', () => {

			const formatted = formatError({
				headers: {},
				body: { code: 'bad_request', response: { statusCode: 400, body: { error: true } } }
			}, event);

			assert.deepStrictEqual(formatted.body.response.body, { error: true });

		});

		it('should survive a buffer that cannot be stringified', () => {

			const badBuffer = Buffer.from('unreadable');
			badBuffer.toString = () => {
				throw new Error('cannot stringify');
			};

			// eslint-disable-next-line no-console
			const originalLog = console.log;
			const logged = [];
			// eslint-disable-next-line no-console
			console.log = (...args) => { return logged.push(args[0]); };

			try {

				const formatted = formatError({
					headers: {},
					body: { code: 'bad_request', response: { statusCode: 400, body: badBuffer } }
				}, event);

				assert.strictEqual(formatted.body.code, 'bad_request');
				assert(_.includes(logged, 'formatError - Could not toString body'));

			} finally {
				// eslint-disable-next-line no-console
				console.log = originalLog;
			}

		});

	});

	/*
		Anything that is neither an Error nor a plain object is wrapped, so that
		the value still reaches the user rather than being dropped.
	*/
	describe('non-object errors', () => {

		it('should wrap a string', () => {

			const formatted = formatError({ headers: {}, body: 'something went wrong' }, event);

			assert.strictEqual(formatted.body.response, 'something went wrong');
			assert.strictEqual(formatted.body.code, '#api_error');
			assert.strictEqual(formatted.body.message, 'API error');

		});

		it('should wrap a number', () => {

			const formatted = formatError({ headers: {}, body: 500 }, event);

			assert.strictEqual(formatted.body.response, 500);

		});

		it('should wrap undefined', () => {

			const formatted = formatError({ headers: {}, body: undefined }, event);

			assert.strictEqual(formatted.body.response, undefined);
			assert.strictEqual(formatted.body.code, '#api_error');

		});

		it('should wrap an array', () => {

			const formatted = formatError({ headers: {}, body: [ 'a', 'b' ] }, event);

			assert.deepStrictEqual(formatted.body.response, [ 'a', 'b' ]);

		});

	});

	describe('isAPIResponseError flag', () => {

		it('should be true when the API responded and failed validation', () => {

			const formatted = formatError({
				headers: {},
				body: {
					response: { statusCode: 429, body: { error: 'slow down' } },
					expects: { statusCode: [200] },
					code: 'too_many_requests',
					message: 'Too many requests.'
				}
			}, event);

			assert.strictEqual(formatted.body.isAPIResponseError, true);
			assert.strictEqual(formatted.body.code, 'too_many_requests');

		});

		/*
			The Error branch rebuilds the details object, so this asserts the
			flag is still applied afterwards.
		*/
		it('should be false for an error thrown in a hook', () => {

			const error = new Error('Full URL must start with either `http://` or `https://`.');
			error.code = '#user_input_error';

			const formatted = formatError({ headers: {}, body: error }, event);

			assert.strictEqual(formatted.body.isAPIResponseError, false);
			assert.strictEqual(formatted.body.code, '#user_input_error');

		});

		it('should be false for a transport failure', () => {

			const error = new Error('connect ECONNREFUSED 127.0.0.1:80');
			error.code = 'ECONNREFUSED';

			const formatted = formatError({ headers: {}, body: error }, event);

			assert.strictEqual(formatted.body.isAPIResponseError, false);

		});

		it('should be false for a connector bug, and retain the existing classification', () => {

			const formatted = formatError({ headers: {}, body: new TypeError('boom') }, event);

			assert.strictEqual(formatted.body.isAPIResponseError, false);
			assert.strictEqual(formatted.body.code, '#connector_error');
			assert(_.isArray(formatted.body.stack));

		});

		it('should be false for a socket hang up, which carries an empty response', () => {

			const formatted = formatError({
				headers: {},
				body: { code: 'api_timeout', response: {}, message: 'API call timeout.' }
			}, event);

			assert.strictEqual(formatted.body.isAPIResponseError, false);

		});

		it('should be false for a non-object error', () => {

			const formatted = formatError({ headers: {}, body: 'something went wrong' }, event);

			assert.strictEqual(formatted.body.isAPIResponseError, false);

		});

		it('should default to false when given a bare Error', () => {

			const formatted = formatError(new Error('something went wrong'), event);

			assert.strictEqual(formatted.body.isAPIResponseError, false);

		});

	});

});
