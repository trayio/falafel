const assert = require('assert');

const _ = require('lodash');

const validateRequestAgainstWhitelistedUrls = require('../../lib/protectedService/validateRequestAgainstWhitelistedUrls.js');

describe('validateRequestAgainstWhitelistedUrls', () => {

	it('should be a function', function () {
		assert(_.isFunction(validateRequestAgainstWhitelistedUrls));
	});

	it('should ignore if protected false/undefined', function () {
		try {
			validateRequestAgainstWhitelistedUrls(
				{
					method: 'get',
					url: 'http://dummy.restapiexample.com/api/v1/employees'
				},
				{}
			);
			assert(true);
		} catch (validationError) {
			assert.fail(validationError);
		}
		try {
			validateRequestAgainstWhitelistedUrls(
				{
					method: 'get',
					url: 'dummy.restapiexample.com/api/v1/employees'
				},
				{
					protected: false
				}
			);
			assert(true);
		} catch (validationError) {
			assert.fail(validationError);
		}
	});

	it('should ignore if whitelist_base_urls is not defined', () => {
		try {
			validateRequestAgainstWhitelistedUrls(
				{
					method: 'get',
					url: 'http://dummy.restapiexample.com/api/v1/employees'
				},
				{
					'#auth_app': {
						protected: true
					}
				}
			);
			assert(true);
		} catch (validationError) {
			assert.fail(validationError);
		}
	});

	it('should allow if base matches', () => {
		try {
			validateRequestAgainstWhitelistedUrls(
				{
					method: 'get',
					url: 'http://dummy.restapiexample.com/api/v1/employees'
				},
				{
					'#auth_app': {
						protected: true,
						whitelist_base_urls: [
							{
								type: 'base',
								value: 'https://google.com'
							},
							{
								type: 'base',
								value: 'http://dummy.restapiexample.com/api/v1'
							},
						]
					}
				}
			);
			assert(true);
		} catch (validationError) {
			assert.fail(validationError);
		}
	});

	it('should allow if regex matches', () => {
		try {
			validateRequestAgainstWhitelistedUrls(
				{
					method: 'get',
					url: 'http://dummy.restapiexample.com/api/v1/employees'
				},
				{
					'#auth_app': {
						protected: true,
						whitelist_base_urls: [
							{
								type: 'regex',
								value: '.*/v2'
							},
							{
								type: 'regex',
								value: '.*/v1'
							}
						]
					}
				}
			);
			assert(true);
		} catch (validationError) {
			assert.fail(validationError);
		}
	});

	describe('should error if no matches', () => {

		it('base only', () => {
			try {
				validateRequestAgainstWhitelistedUrls(
					{
						method: 'get',
						url: 'http://dummy.restapiexample.com/api/v1/employees'
					},
					{
						'#auth_app': {
							protected: true,
							whitelist_base_urls: [
								{
									type: 'base',
									value: 'https://google.com'
								},
								{
									type: 'base',
									value: 'http://dummy.restapiexample.net'
								},
							]
						}
					}
				);
				assert.fail();
			} catch (validationError) {
				assert.strictEqual(validationError.code, '#user_input_error');
				const message = validationError.message;
				assert(_.includes(message, 'The URL provided is not allowed'));
				assert(_.includes(message, 'The URL must start with'));
				assert(_.includes(message, 'google'));
				assert(_.includes(message, 'dummy.restapiexample.net'));
			}
		});

		it('regex only', () => {
			try {
				validateRequestAgainstWhitelistedUrls(
					{
						method: 'get',
						url: 'http://dummy.restapiexample.com/api/v1/employees'
					},
					{
						'#auth_app': {
							protected: true,
							whitelist_base_urls: [
								{
									type: 'regex',
									value: '.*/v2'
								},
								{
									type: 'regex',
									value: '.*/v3'
								},
							]
						}
					}
				);
				assert.fail();
			} catch (validationError) {
				assert.strictEqual(validationError.code, '#user_input_error');
				const message = validationError.message;
				assert(_.includes(message, 'The URL provided is not allowed'));
				assert(_.includes(message, 'The URL must match the following regex(es)'));
				assert(_.includes(message, 'v2'));
				assert(_.includes(message, 'v3'));
			}
		});

		it('both', () => {
			try {
				validateRequestAgainstWhitelistedUrls(
					{
						method: 'get',
						url: 'http://dummy.restapiexample.com/api/v1/employees'
					},
					{
						'#auth_app': {
							protected: true,
							whitelist_base_urls: [
								{
									type: 'base',
									value: 'https://google.com'
								},
								{
									type: 'base',
									value: 'http://dummy.restapiexample.net'
								},
								{
									type: 'regex',
									value: '.*/v2'
								},
								{
									type: 'regex',
									value: '.*/v3'
								},
							]
						}
					}
				);
				assert.fail();
			} catch (validationError) {
				assert.strictEqual(validationError.code, '#user_input_error');
				const message = validationError.message;
				assert(_.includes(message, 'The URL provided is not allowed'));
				assert(_.includes(message, 'The URL must either:'));
				assert(_.includes(message, '- start with'));
				assert(_.includes(message, '- match the following regex(es)'));
				assert(_.includes(message, 'google.com'));
				assert(_.includes(message, 'v3'));
			}
		});

	});

});
