const assert = require('assert');
const util = require('util');
const fs = require('fs');

const _  = require('lodash');
const proxyquire = require('proxyquire');
const nock = require('nock');
const needle = require('needle');

function getProxiedFileHandler (proxyModules = {}) {
	const fileHandler = proxyquire(
		'../../lib/fileHandler/index.js',
		{
			'aws-sdk': {
				config: {
					update: (...args) => {
						assert.fail(args);
					}
				},
				'S3': class S3 {
					constructor (...args) {
						assert.fail(args);
					}
					upload (args) {
						assert.fail(...args);
					}
					getSignedUrl (...args) {
						assert.fail(args);
					}
				}
			},
			...proxyModules
		}
	);
	fileHandler({});
}


describe.only('#generateSchemaFromJs', function () {

	describe('download', () => {

		beforeEach(() => {
			global.falafel = {};
		});
		afterEach(() => {
			delete global.falafel;
		});

		it('should download a file from a URL (200)', async () => {
			const baseUrl = 'https://example.aws.com',
				endpoint = '/somefile';

			nock(baseUrl)
			.get(endpoint)
			.reply(
				200,
				(uri, reqBody) => {
					return 'Example content';
				}
			);


			getProxiedFileHandler({
				needle: {
					get: (url, options, callback) => {
						assert.strictEqual(url, `${baseUrl}${endpoint}`);
						assert.strictEqual(options.decode_response, false);
						assert.strictEqual(options.parse, false);
						assert.strictEqual(options.open_timeout, 0);
						assert.strictEqual(options.read_timeout, 0);
						assert(_.isString(options.output));
						return needle.get(url, options, callback);
					}
				}
			});

			const downloadResult = await falafel.files.download({
				url: `${baseUrl}${endpoint}`,
				name: 'somefile.txt',
				mime_type: 'plain/text',
				expires: 1591484751
			});

			assert.strictEqual(downloadResult.file, '/tmp/somefile.txt');
			assert.strictEqual(downloadResult.name, 'somefile.txt');
			assert.strictEqual(downloadResult.mime_type, 'plain/text');
			assert.strictEqual(downloadResult.expires, 1591484751);
			assert.strictEqual(fs.readFileSync(downloadResult.file, 'utf8'), 'Example content');
		});

		it('should download a file from a URL (299)', async () => {
			const baseUrl = 'https://example.aws.com',
				endpoint = '/somefile';

			nock(baseUrl)
			.get(endpoint)
			.reply(
				299,
				(uri, reqBody) => {
					return 'Example content';
				}
			);


			getProxiedFileHandler({
				needle: {
					get: (url, options, callback) => {
						assert.strictEqual(url, `${baseUrl}${endpoint}`);
						assert.strictEqual(options.decode_response, false);
						assert.strictEqual(options.parse, false);
						assert.strictEqual(options.open_timeout, 0);
						assert.strictEqual(options.read_timeout, 0);
						assert(_.isString(options.output));
						return needle.get(url, options, callback);
					}
				}
			});

			const downloadResult = await falafel.files.download({
				url: `${baseUrl}${endpoint}`,
				name: 'somefile.txt',
				mime_type: 'plain/text',
				expires: 1591484751
			});

			assert.strictEqual(downloadResult.file, '/tmp/somefile.txt');
			assert.strictEqual(downloadResult.name, 'somefile.txt');
			assert.strictEqual(downloadResult.mime_type, 'plain/text');
			assert.strictEqual(downloadResult.expires, 1591484751);
			assert.strictEqual(fs.readFileSync(downloadResult.file, 'utf8'), 'Example content');
		});

		it('should reject with expiry error for statusCode between 400 and 500 if from s3', async () => {
			const baseUrl = 'https://example.amazonaws.com',
				endpoint = '/somefile';

			nock(baseUrl)
			.get(endpoint)
			.reply(
				404,
				(uri, reqBody) => {
					return 'Request has expired';
				},
				{
					'content-type': 'application/xml',
					server: 'AmazonS3'
				}
			);


			getProxiedFileHandler({
				needle: {
					get: (url, options, callback) => {
						assert.strictEqual(url, `${baseUrl}${endpoint}`);
						assert.strictEqual(options.decode_response, false);
						assert.strictEqual(options.parse, false);
						assert.strictEqual(options.open_timeout, 0);
						assert.strictEqual(options.read_timeout, 0);
						assert(_.isString(options.output));
						return needle.get(url, options, callback);
					}
				}
			});

			try {
				await falafel.files.download({
					url: `${baseUrl}${endpoint}`,
					name: 'somefile.txt',
					mime_type: 'plain/text',
					expires: 1591484751
				});
			} catch (downloadError) {
				assert.strictEqual(downloadError.message, 'The file provided has expired.');
			}

		});

		it('should reject with standard status code error message for any other unexpected response', async () => {
			const baseUrl = 'https://example.aws.com',
				endpoint = '/somefile';

			nock(baseUrl)
			.get(endpoint)
			.reply(
				500,
				(uri, reqBody) => {
					return 'Some error';
				}
			);


			getProxiedFileHandler({
				needle: {
					get: (url, options, callback) => {
						assert.strictEqual(url, `${baseUrl}${endpoint}`);
						assert.strictEqual(options.decode_response, false);
						assert.strictEqual(options.parse, false);
						assert.strictEqual(options.open_timeout, 0);
						assert.strictEqual(options.read_timeout, 0);
						assert(_.isString(options.output));
						return needle.get(url, options, callback);
					}
				}
			});

			try {
				await falafel.files.download({
					url: `${baseUrl}${endpoint}`,
					name: 'somefile.txt',
					mime_type: 'plain/text',
					expires: 1591484751
				});
			} catch (downloadError) {
				assert.strictEqual(downloadError.message, 'An issue has occured when attempting to download the file.');
				assert.strictEqual(downloadError.payload.error, 'Status code: 500');
			}

		});

	});

});
