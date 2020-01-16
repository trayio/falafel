const assert = require('assert');

const _ = require('lodash');

const validateFullUrl = require('../../lib/rawHttpRequest/validateFullUrl.js');

describe.only('validateFullUrl', () => {

	it('should be a function', () => {
		assert(_.isFunction(validateFullUrl));
	});

	it('should ignore valid full URLs', () => {

		const sampleParams = {
			url: {
				full_url: 'http://google.com'
			}
		};

		try {
			validateFullUrl(sampleParams);
			assert(true);
		} catch (validationError) {
			assert.fail(validationError);
		}

		const sampleParams2 = {
			url: {
				full_url: 'https://google.com'
			}
		};

		try {
			validateFullUrl(sampleParams2);
			assert(true);
		} catch (validationError) {
			assert.fail(validationError);
		}

	});

	it('should error on invalid URLs', () => {

		const sampleParams = {
			url: {
				full_url: 'google.com'
			}
		};

		try {
			validateFullUrl(sampleParams);
			assert.fail();
		} catch (validationError) {
			assert.strictEqual(validationError.code, '#user_input_error');
		}

	});

});
