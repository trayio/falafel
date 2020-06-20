const assert = require('assert');
const util = require('util');

const _  = require('lodash');
const guid = require('mout/random/guid');
const fs = require('fs-extra');
const proxyquire = require('proxyquire');
const nock = require('nock');
const needle = require('needle');
const moment = require('moment');

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

describe.only('#fileHandler', function () {
	function beforeEachFunc () {
		global.falafel = {};
	}
	function afterEachFunc () {
		delete global.falafel;
	}

	describe.only('upload', () => {

		const testFilePath = '/tmp/falafel/tests/example.txt';
		const contentLength = Buffer.byteLength('Example content', 'utf8');
		before(() => {
			fs.ensureFileSync(testFilePath);
			fs.writeFileSync(testFilePath, 'Example content');
		});
		after(() => {
			fs.unlink(testFilePath);
		});

		beforeEach(beforeEachFunc);
		afterEach(afterEachFunc);

		it(`should upload file from source path`, async () => {
			const testFilePath = '/tmp/falafel/tests/example.txt';
			fs.ensureFileSync(testFilePath);
			fs.writeFileSync(testFilePath, 'Example content');
			const contentLength = Buffer.byteLength('Example content', 'utf8');

			const randomGuid = guid();
			let currentTime;
			getProxiedFileHandler({
				'mout/random/guid': () => {
					return randomGuid;
				},
				'aws-sdk': {
					'S3': class S3 {
						constructor (params) {
							assert.deepEqual(
								params,
								{ region: 'us-west-2' }
							);
						}
						async upload (uploadParams, callback) {
							assert.strictEqual(uploadParams.Bucket, 'workflow-file-uploads');
							assert.strictEqual(uploadParams.Key, randomGuid);
							assert.strictEqual(uploadParams.ContentType, 'text/plain');
							assert.strictEqual(uploadParams.ContentLength, contentLength);
							assert(_.isFunction(uploadParams.Body.pipe));
							const streamContent = await new Promise((resolve, reject) => {
								let acc = '';
								uploadParams.Body.on('data', (chunk) => {
									acc += chunk.toString();
								});
								uploadParams.Body.on('end', (chunk) => {
									if (chunk) {
										acc += chunk.toString();
									}
									resolve(acc);
								});
								uploadParams.Body.on('error', reject);
							});
							assert.strictEqual(streamContent, 'Example content');
							callback(null, {
								Bucket: uploadParams.Bucket,
								Key: uploadParams.Key,
							});
						}
						getSignedUrl (operation, signedParams, callback) {
							currentTime = moment();
							assert.strictEqual(operation, 'getObject');
							assert.strictEqual(signedParams.Bucket, 'workflow-file-uploads');
							assert.strictEqual(signedParams.Key, randomGuid);
							assert.strictEqual(signedParams.Expires, 21600);
							callback(null, 'https://test.aws.com/buckethash');
						}
					}
				}
			});

			const downloadResult = await falafel.files.upload({
				// bucket
				// region
				contentType: 'text/plain',
				name: 'example.txt',
				length: contentLength,
				file: testFilePath
			});


			assert.strictEqual(downloadResult.name, 'example.txt');
			assert.strictEqual(downloadResult.url, 'https://test.aws.com/buckethash');
			assert.strictEqual(downloadResult.mime_type, 'text/plain');
			assert.strictEqual(downloadResult.expires, currentTime.add(6, 'hours').unix());
		});

		it(`should error if length is not provided`, async () => {
			const testFilePath = '/tmp/falafel/tests/example.txt';
			fs.ensureFileSync(testFilePath);
			fs.writeFileSync(testFilePath, 'Example content');
			const contentLength = Buffer.byteLength('Example content', 'utf8');

			getProxiedFileHandler({});

			try {
				const downloadResult = await falafel.files.upload({
					// bucket
					// region
					contentType: 'text/plain',
					name: 'example.txt',
					file: testFilePath
				});
				assert.fail(downloadResult);
			} catch (uploadError) {
				try {
					assert.strictEqual(uploadError.code, '#connector_error');
					assert.strictEqual(uploadError.message, '`length` must be specified for file uploading.');
				} catch (otherError) {
					assert.fail(otherError);
				}
			}
		});

	});

	const random2xx = _.random(200, 299),
		random4xx = _.random(400, 499),
		randomNon2xx = ( _.random(0, 1) ? _.random(0, 199) : _.random(300, 599));

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
				mime_type: 'text/plain',
				expires: 1591484751
			});

			assert.strictEqual(downloadResult.file, '/tmp/somefile.txt');
			assert.strictEqual(downloadResult.name, 'somefile.txt');
			assert.strictEqual(downloadResult.mime_type, 'text/plain');
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
					mime_type: 'text/plain',
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
					mime_type: 'text/plain',
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
				mime_type: 'text/plain',
				expires: 1591484751
			});


			assert(_.isPlainObject(downloadObject));
			assert.strictEqual(downloadObject.name, 'somefile.txt');
			assert.strictEqual(downloadObject.mime_type, 'text/plain');
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
					mime_type: 'text/plain',
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
					mime_type: 'text/plain',
					expires: 1591484751
				});
			} catch (downloadError) {
				assert.strictEqual(downloadError.message, 'An issue has occured when attempting to download the file.');
				assert.strictEqual(downloadError.payload.error, `Status code: ${randomNon2xx}`);
			}

		});
	});
});
