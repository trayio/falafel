const assert = require('assert');

const _ = require('lodash');

const validateUrlInput = require('../../lib/rawHttpRequest/validateUrlInput.js');

describe.only('validateUrlInput', () => {

	it('should be a function', () => {
		assert(_.isFunction(validateUrlInput));
	});

	it('should ignore valid full URLs', () => {

		const sampleParams = {
			url: {
				full_url: 'http://google.com'
			}
		};

		try {
			validateUrlInput(sampleParams);
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
			validateUrlInput(sampleParams2);
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
			validateUrlInput(sampleParams);
			assert.fail();
		} catch (validationError) {
			assert.strictEqual(validationError.code, '#user_input_error');
			assert(_.includes(validationError.message, 'Full URL must start with either'));
		}

	});

	it('should ignore valid endpoints', () => {

		const sampleParams = {
			url: {
				endpoint: '/endpoint'
			}
		};

		try {
			validateUrlInput(sampleParams);
			assert(true);
		} catch (validationError) {
			assert.fail(validationError);
		}

		const sampleParams2 = {
			url: {
				endpoint: 'endpoint'
			}
		};

		try {
			validateUrlInput(sampleParams2);
			assert(true);
		} catch (validationError) {
			assert.fail(validationError);
		}

		const sampleParams3 = {
			url: {
				endpoint: ''
			}
		};

		try {
			validateUrlInput(sampleParams3);
			assert(true);
		} catch (validationError) {
			assert.fail(validationError);
		}

	});

	it('should error on invalid endoints', () => {

		const sampleParams = {
			url: {
				endpoint: 'http://google.com'
			}
		};

		try {
			validateUrlInput(sampleParams);
			assert.fail();
		} catch (validationError) {
			assert.strictEqual(validationError.code, '#user_input_error');
			assert(_.includes(validationError.message, 'Endpoint will be appended unto the base URL defined by the connector'));
			assert(_.includes(validationError.message, 'Please use `Full URL` to specify a URL starting with'));
		}

		const sampleParams2 = {
			url: {
				endpoint: 'https://google.com'
			}
		};

		try {
			validateUrlInput(sampleParams2);
			assert.fail();
		} catch (validationError) {
			assert.strictEqual(validationError.code, '#user_input_error');
			assert(_.includes(validationError.message, 'Endpoint will be appended unto the base URL defined by the connector'));
			assert(_.includes(validationError.message, 'Please use `Full URL` to specify a URL starting with'));
		}

	});

});
