const assert = require('assert');
const fs = require('fs');

const _ = require('lodash');

const processBody = require('../../lib/rawHttpRequest/processBody.js');

const processBodyServer = require('./processBodyServer');

describe('processBody', () => {

	before(() => {
		global.falafel = {};
		global._ = _;
		require('../../lib/fileHandler')({
			test: true
		});
		processBodyServer.start();
	});
	after(() => {
		delete global.falafel;
		processBodyServer.stop();
	});

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

		it('with files', async () => {

			const sampleBody = {
				form_data: {
					id: 'abc123',
					contents: {
						url: 'http://localhost:8787/file',
						name: 'test.txt',
						mime_type: 'plain/text',
						expires: 86400
					}
				}
			};

			const processedBody = await processBody(sampleBody);

			assert.deepEqual(processedBody.id, sampleBody.form_data.id);
			assert.deepEqual(processedBody.contents, { file: '/tmp/test.txt', content_type: 'plain/text' });
			assert.deepEqual(fs.readFileSync(processedBody.contents.file, 'utf8'), fs.readFileSync(`${__dirname}/processBodyServer/test.txt`, 'utf8'));

		});

	});

	describe('should process binary', () => {

		it('binary', async () => {

			const sampleBody = {
				binary: {
					url: 'http://localhost:8787/file',
					name: 'test.txt',
					mime_type: 'plain/text',
					expires: 86400
				}
			};

			const dataStream = await processBody(sampleBody);

			const processedBody = await new Promise((resolve, reject) => {

				let stringAcc = '';

				dataStream.on('data', (chunk) => {
					stringAcc += chunk.toString();
				});

				dataStream.on('end', () => {
					resolve(stringAcc);
				});

			});

			assert.deepEqual(processedBody, fs.readFileSync(`${__dirname}/processBodyServer/test.txt`, 'utf8'));

		});

	});

});
