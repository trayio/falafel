const assert = require('assert');

const _ = require('lodash');

const processBody = require('../../lib/rawHttpRequest/processBody.js');

describe.only('processBody', () => {

	it('should be a function', () => {
		assert(_.isFunction(processBody));
		assert(processBody.constructor.name === 'AsyncFunction');
	});

	it('should return raw as is', async () => {

		const sampleBody = {
			raw: 'something'
		};

		const processedBody = await processBody(sampleBody);

		assert.deepEqual(processedBody, sampleBody.raw);

		const sampleBody2 = {
			raw: {
				hello: 'world'
			}
		};

		const processedBody2 = await processBody(sampleBody2);

		assert.deepEqual(processedBody2, sampleBody2.raw);

	});

	it('should return form_urlencoded as is', async () => {

		const sampleBody = {
			form_urlencoded: {
				hello: 'world',
				user_id: 1234
			}
		};

		const processedBody = await processBody(sampleBody);

		assert.deepEqual(processedBody, sampleBody.form_urlencoded);

	});

	describe('should process form_data', () => {

		it('simple', async () => {

			const sampleBody = {
				form_data: {
					hello: 'world',
					user_id: 'abc123'
				}
			};

			const processedBody = await processBody(sampleBody);

			assert.deepEqual(processedBody, sampleBody.form_data);

		});

		//TODO mock file server to download file from

		// it('with files', async () => {
		//
		// 	const sampleBody = {
		// 		form_data: {
		// 			id: 'abc123',
		// 			contents: {
		// 				url: '',
		// 				name: '',
		// 				mime_type: '',
		// 				expires: ''
		// 			}
		// 		}
		// 	};
		//
		// 	const processedBody = await processBody(sampleBody);
		//
		// 	assert.deepEqual(processedBody.id, sampleBody.form_data.id);
		// 	assert.deepEqual(processedBody.contents, fileContents);
		//
		// });

	});

});
