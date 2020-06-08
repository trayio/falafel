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
	const random2xx = _.random(200, 299),
		random4xx = _.random(400, 499),
		randomNon2xx = ( _.random(0, 1) ? _.random(0, 199) : _.random(300, 599));

	function beforeEachFunc () {
		global.falafel = {};
	}
	function afterEachFunc () {
		delete global.falafel;
	}

	describe('download', () => {

		beforeEach(beforeEachFunc);
		afterEach(afterEachFunc);

		it(`should download a file from a URL for statusCode between 200 and 300 - (${random2xx})`, async () => {
			const baseUrl = 'https://example.aws.com',
				endpoint = '/somefile';

			nock(baseUrl)
			.get(endpoint)
			.reply(
				random2xx,
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

		it(`should reject with expiry error for statusCode between 400 and 500 if from s3 - (${random4xx})`, async () => {
			const baseUrl = 'https://example.amazonaws.com',
				endpoint = '/somefile';

			nock(baseUrl)
			.get(endpoint)
			.reply(
				random4xx,
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

		it(`should reject with standard status code error message for any other unexpected response - (${randomNon2xx})`, async () => {
			const baseUrl = 'https://example.aws.com',
				endpoint = '/somefile';

			nock(baseUrl)
			.get(endpoint)
			.reply(
				randomNon2xx,
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
				assert.strictEqual(downloadError.payload.error, `Status code: ${randomNon2xx}`);
			}

		});

	});

	describe('streamDownload', () => {

		beforeEach(beforeEachFunc);
		afterEach(afterEachFunc);

		it(`should return a stream for URL for statusCode between 200 and 300 - (${random2xx})`, async () => {
			const baseUrl = 'https://example.aws.com',
				endpoint = '/somefile';

			nock(baseUrl)
			.get(endpoint)
			.reply(
				random2xx,
				(uri, reqBody) => {
					return 'Example content';
				},
				{
					'content-length': Buffer.byteLength('Example content', 'utf8')
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
						return needle.get(url, options, callback);
					}
				}
			});

			const downloadObject = await falafel.files.streamDownload({
				url: `${baseUrl}${endpoint}`,
				name: 'somefile.txt',
				mime_type: 'plain/text',
				expires: 1591484751
			});


			assert(_.isPlainObject(downloadObject));
			assert.strictEqual(downloadObject.name, 'somefile.txt');
			assert.strictEqual(downloadObject.mime_type, 'plain/text');
			assert.strictEqual(downloadObject.expires, 1591484751);
			assert.equal(downloadObject.size, 15);

			const downloadStream = downloadObject.readStream;
			assert(_.isFunction(downloadStream.pipe));
			assert(_.isFunction(downloadStream.on));

			await new Promise((resolve, reject) => {
				let acc = '';
				downloadStream.on('data', (chunk) => {
					acc += chunk.toString();
				});

				downloadStream.on('end', () => {
					try {
						assert.strictEqual(acc, 'Example content');
						resolve();
					} catch (asertError) {
						reject(asertError);
					}
				});

				downloadStream.on('error', reject);
			});
		});

		it(`should reject with expiry error for statusCode between 400 and 500 if from s3 - (${random4xx})`, async () => {
			const baseUrl = 'https://example.amazonaws.com',
				endpoint = '/somefile';

			nock(baseUrl)
			.get(endpoint)
			.reply(
				random4xx,
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
						return needle.get(url, options, callback);
					}
				}
			});

			try {
				await falafel.files.streamDownload({
					url: `${baseUrl}${endpoint}`,
					name: 'somefile.txt',
					mime_type: 'plain/text',
					expires: 1591484751
				});
			} catch (downloadError) {
				assert.strictEqual(downloadError.message, 'The file provided has expired.');
			}

		});

		it(`should reject with standard status code error message for any other unexpected response - (${randomNon2xx})`, async () => {
			const baseUrl = 'https://example.aws.com',
				endpoint = '/somefile';

			nock(baseUrl)
			.get(endpoint)
			.reply(
				randomNon2xx,
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
				assert.strictEqual(downloadError.payload.error, `Status code: ${randomNon2xx}`);
			}

		});

	});

});
