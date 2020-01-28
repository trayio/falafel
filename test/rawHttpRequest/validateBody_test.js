const assert = require('assert');

const _ = require('lodash');

const validateBody = require('../../lib/rawHttpRequest/validateBody.js');

describe('validateBody', () => {

	it('should be a function', () => {
		assert(_.isFunction(validateBody));
	});

	it('should return false for GET, HEAD, and OPTIONS', () => {

		const sampleParams = {
			body: {
				raw: 'something'
			}
		};

		const validationResult = validateBody({
			method: 'get',
			...sampleParams
		});

		assert.deepEqual(validationResult, false);

		const validationResult2 = validateBody({
			method: 'head',
			...sampleParams
		});

		assert.deepEqual(validationResult2, false);

		const validationResult3 = validateBody({
			method: 'options',
			...sampleParams
		});

		assert.deepEqual(validationResult3, false);

	});

	it('should return true for POST, PUT, PATCH, and DELETE', () => {

		const sampleParams = {
			body: {
				raw: 'something'
			}
		};

		const validationResult = validateBody({
			method: 'post',
			...sampleParams
		});

		assert.deepEqual(validationResult, true);

		const validationResult2 = validateBody({
			method: 'put',
			...sampleParams
		});

		assert.deepEqual(validationResult2, true);

		const validationResult3 = validateBody({
			method: 'patch',
			...sampleParams
		});

		assert.deepEqual(validationResult3, true);

		const validationResult4 = validateBody({
			method: 'delete',
			...sampleParams
		});

		assert.deepEqual(validationResult4, true);

	});

	describe('should error when body is not provided', () => {

		const errMessage = '`body` must be supplied. Please select a valid "Body Type".';

		it('post', () => {
			let validationResult;
			try {
				validationResult = validateBody({
					method: 'post'
				});
			} catch (validationError) {
				assert(_.includes(validationError.message, errMessage));
				return;
			}
			assert.fail(validationResult);
		});

		it('put', () => {
			let validationResult;
			try {
				validationResult = validateBody({
					method: 'put'
				});
			} catch (validationError) {
				assert(_.includes(validationError.message, errMessage));
				return;
			}
			assert.fail(validationResult);
		});

		it('put', () => {
			let validationResult;
			try {
				validationResult = validateBody({
					method: 'put'
				});
			} catch (validationError) {
				assert(_.includes(validationError.message, errMessage));
				return;
			}
			assert.fail(validationResult);
		});

		it('delete', () => {
			let validationResult;
			try {
				validationResult = validateBody({
					method: 'delete'
				});
			} catch (validationError) {
				assert(_.includes(validationError.message, errMessage));
				return;
			}
			assert.fail(validationResult);
		});

	});

	describe('should return true for valid body key', () => {

		it('raw', () => {
			const validationResult = validateBody({
				method: 'post',
				body: {
					raw: 'something'
				}
			});

			assert.deepEqual(validationResult, true);
		});

		it('form_urlencoded', () => {
			const validationResult = validateBody({
				method: 'post',
				body: {
					form_urlencoded: {}
				}
			});

			assert.deepEqual(validationResult, true);
		});

		it('form_data', () => {
			const validationResult = validateBody({
				method: 'post',
				body: {
					form_data: {}
				}
			});

			assert.deepEqual(validationResult, true);
		});

		it('binary', () => {
			const validationResult = validateBody({
				method: 'post',
				body: {
					binary: {
						//file object
					}
				}
			});

			assert.deepEqual(validationResult, true);
		});

		it('none', () => {
			const validationResult = validateBody({
				method: 'post',
				body: {
					none: null
				}
			});

			assert.deepEqual(validationResult, true);
		});

	});

	describe('should error when body is not a valid object', () => {

		const errMessage = 'The `body` object must contain only one of the following valid properties: `raw`, `form_urlencoded`, `form_data`, `binary`, or `none`.';

		it('more than 1 key', () => {
			let validationResult;
			try {
				validationResult = validateBody({
					method: 'post',
					body: {
						raw: 'hello world',
						test: '123'
					}
				});
			} catch (validationError) {
				assert(_.includes(validationError.message, errMessage));
				return;
			}
			assert.fail(validationResult);
		});

		it('invalid body', () => {
			let validationResult;
			try {
				validationResult = validateBody({
					method: 'put',
					body: 'something'
				});
			} catch (validationError) {
				assert(_.includes(validationError.message, errMessage));
				return;
			}
			assert.fail(validationResult);
		});

	});

});
