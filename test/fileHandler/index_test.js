const assert = require('assert');
const util = require('util');
const stream = require('stream');

const _  = require('lodash');
const guid = require('mout/random/guid');
const fs = require('fs-extra');
const proxyquire = require('proxyquire');
const nock = require('nock');
const needle = require('needle');
const moment = require('moment');

function getProxiedFileHandler (proxyModules = {}, options = {}) {
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
	fileHandler(options);
}

describe('#fileHandler', function () {
	function beforeEachFunc () {
		global.falafel = {};
	}
	function afterEachFunc () {
		delete global.falafel;
	}

	describe('upload', () => {

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
						async upload (uploadParams, uploadOptions, callback) {
							assert.deepEqual(uploadOptions, {});
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

			const uploadResult = await falafel.files.upload({
				contentType: 'text/plain',
				name: 'example.txt',
				length: contentLength,
				file: testFilePath
			});

			assert.strictEqual(uploadResult.name, 'example.txt');
			assert.strictEqual(uploadResult.url, 'https://test.aws.com/buckethash');
			assert.strictEqual(uploadResult.mime_type, 'text/plain');
			assert.strictEqual(uploadResult.expires, currentTime.add(6, 'hours').unix());
		});

		it(`should upload file to dev bucket in dev mode`, async () => {
			const testFilePath = '/tmp/falafel/tests/example.txt';
			fs.ensureFileSync(testFilePath);
			fs.writeFileSync(testFilePath, 'Example content');
			const contentLength = Buffer.byteLength('Example content', 'utf8');

			const randomGuid = guid();
			let currentTime;
			getProxiedFileHandler(
				{
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
							async upload (uploadParams, uploadOptions,  callback) {
								assert.strictEqual(uploadParams.Bucket, 'workflow-file-uploads-dev');
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
								assert.strictEqual(signedParams.Bucket, 'workflow-file-uploads-dev');
								assert.strictEqual(signedParams.Key, randomGuid);
								assert.strictEqual(signedParams.Expires, 21600);
								callback(null, 'https://test.aws.com/buckethash');
							}
						}
					}
				},
				{
					dev: true
				}
			);

			const uploadResult = await falafel.files.upload({
				contentType: 'text/plain',
				name: 'example.txt',
				length: contentLength,
				file: testFilePath
			});

			assert.strictEqual(uploadResult.name, 'example.txt');
			assert.strictEqual(uploadResult.url, 'https://test.aws.com/buckethash');
			assert.strictEqual(uploadResult.mime_type, 'text/plain');
			assert.strictEqual(uploadResult.expires, currentTime.add(6, 'hours').unix());
		});

		it(`should override default bucket and region if specified`, async () => {
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
								{ region: 'us-west-1' }
							);
						}
						async upload (uploadParams, uploadOptions, callback) {
							assert.deepEqual(uploadOptions, {});
							assert.strictEqual(uploadParams.Bucket, 'other-bucket');
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
							assert.strictEqual(signedParams.Bucket, 'other-bucket');
							assert.strictEqual(signedParams.Key, randomGuid);
							assert.strictEqual(signedParams.Expires, 21600);
							callback(null, 'https://test.aws.com/buckethash');
						}
					}
				}
			});

			const uploadResult = await falafel.files.upload({
				bucket: 'other-bucket',
				region: 'us-west-1',
				contentType: 'text/plain',
				name: 'example.txt',
				length: contentLength,
				file: testFilePath
			});

			assert.strictEqual(uploadResult.name, 'example.txt');
			assert.strictEqual(uploadResult.url, 'https://test.aws.com/buckethash');
			assert.strictEqual(uploadResult.mime_type, 'text/plain');
			assert.strictEqual(uploadResult.expires, currentTime.add(6, 'hours').unix());
		});

		it(`should override default bucket and region if specified in environment`, async () => {
			const testFilePath = '/tmp/falafel/tests/example.txt';
			fs.ensureFileSync(testFilePath);
			fs.writeFileSync(testFilePath, 'Example content');
			const contentLength = Buffer.byteLength('Example content', 'utf8');

			process.env.CONNECTOR_FILE_BUCKET = 'other-bucket';
			process.env.CONNECTOR_FILE_REGION = 'us-west-1';

			try {
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
									{ region: 'us-west-1' }
								);
							}
							async upload (uploadParams, uploadOptions, callback) {
								assert.deepEqual(uploadOptions, {});
								assert.strictEqual(uploadParams.Bucket, 'other-bucket');
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
								assert.strictEqual(signedParams.Bucket, 'other-bucket');
								assert.strictEqual(signedParams.Key, randomGuid);
								assert.strictEqual(signedParams.Expires, 21600);
								callback(null, 'https://test.aws.com/buckethash');
							}
						}
					}
				});

				const uploadResult = await falafel.files.upload({
					contentType: 'text/plain',
					name: 'example.txt',
					length: contentLength,
					file: testFilePath
				});

				assert.strictEqual(uploadResult.name, 'example.txt');
				assert.strictEqual(uploadResult.url, 'https://test.aws.com/buckethash');
				assert.strictEqual(uploadResult.mime_type, 'text/plain');
				assert.strictEqual(uploadResult.expires, currentTime.add(6, 'hours').unix());
			} finally {
				delete process.env.CONNECTOR_FILE_BUCKET;
				delete process.env.CONNECTOR_FILE_REGION;
			}
		});

		it(`should override default dev bucket in dev mode if specified in environment`, async () => {
			const testFilePath = '/tmp/falafel/tests/example.txt';
			fs.ensureFileSync(testFilePath);
			fs.writeFileSync(testFilePath, 'Example content');
			const contentLength = Buffer.byteLength('Example content', 'utf8');

			process.env.CONNECTOR_FILE_DEV_BUCKET = 'other-dev-bucket';
			try {
				const randomGuid = guid();
				let currentTime;
				getProxiedFileHandler(
					{
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
								async upload (uploadParams, uploadOptions, callback) {
									assert.deepEqual(uploadOptions, {});
									assert.strictEqual(uploadParams.Bucket, 'other-dev-bucket');
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
									assert.strictEqual(signedParams.Bucket, 'other-dev-bucket');
									assert.strictEqual(signedParams.Key, randomGuid);
									assert.strictEqual(signedParams.Expires, 21600);
									callback(null, 'https://test.aws.com/buckethash');
								}
							}
						}
					},
					{
						dev: true
					}
				);

				const uploadResult = await falafel.files.upload({
					contentType: 'text/plain',
					name: 'example.txt',
					length: contentLength,
					file: testFilePath
				});

				assert.strictEqual(uploadResult.name, 'example.txt');
				assert.strictEqual(uploadResult.url, 'https://test.aws.com/buckethash');
				assert.strictEqual(uploadResult.mime_type, 'text/plain');
				assert.strictEqual(uploadResult.expires, currentTime.add(6, 'hours').unix());
			} finally {
				delete process.env.CONNECTOR_FILE_DEV_BUCKET;
			}
		});

		it(`should error in correct format if length is not provided`, async () => {
			const testFilePath = '/tmp/falafel/tests/example.txt';
			fs.ensureFileSync(testFilePath);
			fs.writeFileSync(testFilePath, 'Example content');
			const contentLength = Buffer.byteLength('Example content', 'utf8');

			getProxiedFileHandler({});

			try {
				const uploadResult = await falafel.files.upload({
					contentType: 'text/plain',
					name: 'example.txt',
					file: testFilePath
				});
				assert.fail(uploadResult);
			} catch (uploadError) {
				try {
					assert.strictEqual(uploadError.code, '#connector_error');
					assert.strictEqual(uploadError.message, '`length` must be specified for file uploading.');
				} catch (otherError) {
					assert.fail(uploadError);
				}
			}
		});

		it(`should surface error in correct format if upload errors`, async () => {
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
						async upload (uploadParams, uploadOptions, callback) {
							assert.deepEqual(uploadOptions, {});
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
							callback(new Error('Some upload error'), null);
						}
						getSignedUrl (operation, signedParams, callback) {
							assert.fail();
						}
					}
				}
			});

			try {
				const uploadResult = await falafel.files.upload({
					contentType: 'text/plain',
					name: 'example.txt',
					length: contentLength,
					file: testFilePath
				});
				assert.fail(uploadResult);
			} catch (uploadError) {
				try {
					assert.strictEqual(uploadError.code, '#connector_error');
					assert.strictEqual(uploadError.message, 'An issue has occured when attempting to upload the file.');
					assert.strictEqual(uploadError.payload.error, 'Some upload error');
				} catch (otherError) {
					assert.fail(uploadError);
				}
			}
		});

		it(`should surface error in correct format if getSignedUrl errors`, async () => {
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
						async upload (uploadParams, uploadOptions, callback) {
							assert.deepEqual(uploadOptions, {});
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
							callback(new Error('Some getSignedUrl error'), null);
						}
					}
				}
			});

			try {
				const uploadResult = await falafel.files.upload({
					contentType: 'text/plain',
					name: 'example.txt',
					length: contentLength,
					file: testFilePath
				});
				assert.fail(uploadResult);
			} catch (uploadError) {
				try {
					assert.strictEqual(uploadError.code, '#connector_error');
					assert.strictEqual(uploadError.message, 'An issue has occured when attempting to upload the file.');
					assert.strictEqual(uploadError.payload.error, 'Some getSignedUrl error');
				} catch (otherError) {
					assert.fail(uploadError);
				}
			}
		});

		it(`should upload file with access control list`, async () => {
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
						async upload (uploadParams, uploadOptions, callback) {
							assert.strictEqual(uploadParams.ACL, 'bucket-owner-full-control');
							callback(null, {
								Bucket: uploadParams.Bucket,
								Key: uploadParams.Key,
							});
						}
						getSignedUrl (operation, signedParams, callback) {
							callback(null, 'https://test.aws.com/buckethash');
						}
					}
				}
			});

			const uploadResult = await falafel.files.upload({
				contentType: 'text/plain',
				name: 'example.txt',
				length: contentLength,
				file: testFilePath
			});
		});
	});

	describe('streamUpload', () => {

		beforeEach(beforeEachFunc);
		afterEach(afterEachFunc);

		it(`should upload file from readStream`, async () => {
			const passThroughStream = new stream.PassThrough();
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
						async upload (uploadParams, uploadOptions, callback) {
							assert.strictEqual(uploadParams.Bucket, 'workflow-file-uploads');
							assert.strictEqual(uploadParams.Key, randomGuid);
							assert.strictEqual(uploadParams.ContentType, 'text/plain');
							assert.strictEqual(uploadParams.ContentLength, contentLength);

							assert.deepEqual(
								uploadOptions,
								{
									partSize: 8388608,
									queueSize: 4,
								}
							);

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

			setTimeout(() => {
				passThroughStream.write('Example content');
				passThroughStream.end();
			}, 500);
			const uploadResult = await falafel.files.streamUpload({
				contentType: 'text/plain',
				name: 'example.txt',
				length: contentLength,
				readStream: passThroughStream
			});

			assert.strictEqual(uploadResult.name, 'example.txt');
			assert.strictEqual(uploadResult.url, 'https://test.aws.com/buckethash');
			assert.strictEqual(uploadResult.mime_type, 'text/plain');
			assert.strictEqual(uploadResult.expires, currentTime.add(6, 'hours').unix());
		});

		it('should error if readStream is not provided', async () => {
			getProxiedFileHandler();

			try {
				await falafel.files.streamUpload({
					contentType: 'text/plain',
					name: 'example.txt',
					length: 123,
				});
			} catch (uploadError) {
				try {
					assert.strictEqual(uploadError.code, '#connector_error');
					assert.strictEqual(uploadError.message, `The object passed in must contain the property 'readStream', referecing a read stream.`);
				} catch (otherError) {
					assert.fail(uploadError);
				}
			}
		});

		it('should error if readStream is not a stream', async () => {
			getProxiedFileHandler();

			try {
				await falafel.files.streamUpload({
					contentType: 'text/plain',
					name: 'example.txt',
					length: 123,
					readStream: {}
				});
			} catch (uploadError) {
				try {
					assert.strictEqual(uploadError.code, '#connector_error');
					assert.strictEqual(uploadError.message, `The object passed in must contain the property 'readStream', referecing a read stream.`);
				} catch (otherError) {
					assert.fail(uploadError);
				}
			}
		});

		it('should error if length is not provided', async () => {
			const passThroughStream = new stream.PassThrough();
			passThroughStream.write('test');
			passThroughStream.end();

			getProxiedFileHandler();
			try {
				await falafel.files.streamUpload({
					contentType: 'text/plain',
					name: 'example.txt',
					readStream: passThroughStream
				});
			} catch (uploadError) {
				try {
					assert.strictEqual(uploadError.code, '#connector_error');
					assert.strictEqual(uploadError.message, '`length` must be specified for file uploading.');
				} catch (otherError) {
					assert.fail(uploadError);
				}
			}
		});

	});

	describe('streamMPUpload (and streamUpload)', () => {

		beforeEach(() => {
			beforeEachFunc();
		});
		afterEach(() => {
			afterEachFunc();
		});

		it(`should upload file from readStream`, async () => {
			const passThroughStream = new stream.PassThrough();

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
						async upload (uploadParams, uploadOptions, callback) {
							assert.strictEqual(uploadParams.Bucket, 'workflow-file-uploads');
							assert.strictEqual(uploadParams.Key, randomGuid);
							assert.strictEqual(uploadParams.ContentType, 'text/plain');

							assert.deepEqual(
								uploadOptions,
								{
									partSize: 8388608,
									queueSize: 4,
								}
							);

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

			setTimeout(() => {
				passThroughStream.write('Example content');
				passThroughStream.end();
			}, 500);
			const uploadResult = await falafel.files.streamMPUpload({
				contentType: 'text/plain',
				name: 'example.txt',
				readStream: passThroughStream
			});

			assert.strictEqual(uploadResult.name, 'example.txt');
			assert.strictEqual(uploadResult.url, 'https://test.aws.com/buckethash');
			assert.strictEqual(uploadResult.mime_type, 'text/plain');
			assert.strictEqual(uploadResult.expires, currentTime.add(6, 'hours').unix());
		});

		it(`should upload file to dev bucket in dev mode`, async () => {
			const passThroughStream = new stream.PassThrough();

			const randomGuid = guid();
			let currentTime;
			getProxiedFileHandler(
				{
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
							async upload (uploadParams, uploadOptions, callback) {
								assert.strictEqual(uploadParams.Bucket, 'workflow-file-uploads-dev');
								assert.strictEqual(uploadParams.Key, randomGuid);
								assert.strictEqual(uploadParams.ContentType, 'text/plain');

								assert.deepEqual(
									uploadOptions,
									{
										partSize: 8388608,
										queueSize: 4,
									}
								);

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
								assert.strictEqual(signedParams.Bucket, 'workflow-file-uploads-dev');
								assert.strictEqual(signedParams.Key, randomGuid);
								assert.strictEqual(signedParams.Expires, 21600);
								callback(null, 'https://test.aws.com/buckethash');
							}
						}
					}
				},
				{
					dev: true
				}
			);

			setTimeout(() => {
				passThroughStream.write('Example content');
				passThroughStream.end();
			}, 500);
			const uploadResult = await falafel.files.streamMPUpload({
				contentType: 'text/plain',
				name: 'example.txt',
				readStream: passThroughStream
			});

			assert.strictEqual(uploadResult.name, 'example.txt');
			assert.strictEqual(uploadResult.url, 'https://test.aws.com/buckethash');
			assert.strictEqual(uploadResult.mime_type, 'text/plain');
			assert.strictEqual(uploadResult.expires, currentTime.add(6, 'hours').unix());
		});

		it(`should override default bucket and region if specified`, async () => {
			const passThroughStream = new stream.PassThrough();

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
								{ region: 'us-west-1' }
							);
						}
						async upload (uploadParams, uploadOptions, callback) {
							assert.strictEqual(uploadParams.Bucket, 'other-bucket');
							assert.strictEqual(uploadParams.Key, randomGuid);
							assert.strictEqual(uploadParams.ContentType, 'text/plain');

							assert.deepEqual(
								uploadOptions,
								{
									partSize: 8388608,
									queueSize: 4,
								}
							);

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
							assert.strictEqual(signedParams.Bucket, 'other-bucket');
							assert.strictEqual(signedParams.Key, randomGuid);
							assert.strictEqual(signedParams.Expires, 21600);
							callback(null, 'https://test.aws.com/buckethash');
						}
					}
				}
			});

			setTimeout(() => {
				passThroughStream.write('Example content');
				passThroughStream.end();
			}, 500);
			const uploadResult = await falafel.files.streamMPUpload({
				bucket: 'other-bucket',
				region: 'us-west-1',
				contentType: 'text/plain',
				name: 'example.txt',
				readStream: passThroughStream
			});

			assert.strictEqual(uploadResult.name, 'example.txt');
			assert.strictEqual(uploadResult.url, 'https://test.aws.com/buckethash');
			assert.strictEqual(uploadResult.mime_type, 'text/plain');
			assert.strictEqual(uploadResult.expires, currentTime.add(6, 'hours').unix());
		});

		it(`should override default bucket and region if specified in environment`, async () => {
			process.env.CONNECTOR_FILE_BUCKET = 'other-bucket';
			process.env.CONNECTOR_FILE_REGION = 'us-west-1';

			try {
				const passThroughStream = new stream.PassThrough();

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
									{ region: 'us-west-1' }
								);
							}
							async upload (uploadParams, uploadOptions, callback) {
								assert.strictEqual(uploadParams.Bucket, 'other-bucket');
								assert.strictEqual(uploadParams.Key, randomGuid);
								assert.strictEqual(uploadParams.ContentType, 'text/plain');

								assert.deepEqual(
									uploadOptions,
									{
										partSize: 8388608,
										queueSize: 4,
									}
								);

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
								assert.strictEqual(signedParams.Bucket, 'other-bucket');
								assert.strictEqual(signedParams.Key, randomGuid);
								assert.strictEqual(signedParams.Expires, 21600);
								callback(null, 'https://test.aws.com/buckethash');
							}
						}
					}
				});

				setTimeout(() => {
					passThroughStream.write('Example content');
					passThroughStream.end();
				}, 500);
				const uploadResult = await falafel.files.streamMPUpload({
					contentType: 'text/plain',
					name: 'example.txt',
					readStream: passThroughStream
				});

				assert.strictEqual(uploadResult.name, 'example.txt');
				assert.strictEqual(uploadResult.url, 'https://test.aws.com/buckethash');
				assert.strictEqual(uploadResult.mime_type, 'text/plain');
				assert.strictEqual(uploadResult.expires, currentTime.add(6, 'hours').unix());
			} finally {
				delete process.env.CONNECTOR_FILE_BUCKET;
				delete process.env.CONNECTOR_FILE_REGION;
			}
		});

		it(`should override default dev bucket in dev mode if specified in environment`, async () => {
			process.env.CONNECTOR_FILE_DEV_BUCKET = 'other-dev-bucket';

			try {
				const passThroughStream = new stream.PassThrough();

				const randomGuid = guid();
				let currentTime;
				getProxiedFileHandler(
					{
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
								async upload (uploadParams, uploadOptions, callback) {
									assert.strictEqual(uploadParams.Bucket, 'other-dev-bucket');
									assert.strictEqual(uploadParams.Key, randomGuid);
									assert.strictEqual(uploadParams.ContentType, 'text/plain');

									assert.deepEqual(
										uploadOptions,
										{
											partSize: 8388608,
											queueSize: 4,
										}
									);

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
									assert.strictEqual(signedParams.Bucket, 'other-dev-bucket');
									assert.strictEqual(signedParams.Key, randomGuid);
									assert.strictEqual(signedParams.Expires, 21600);
									callback(null, 'https://test.aws.com/buckethash');
								}
							}
						}
					},
					{
						dev: true
					}
				);

				setTimeout(() => {
					passThroughStream.write('Example content');
					passThroughStream.end();
				}, 500);
				const uploadResult = await falafel.files.streamMPUpload({
					contentType: 'text/plain',
					name: 'example.txt',
					readStream: passThroughStream
				});

				assert.strictEqual(uploadResult.name, 'example.txt');
				assert.strictEqual(uploadResult.url, 'https://test.aws.com/buckethash');
				assert.strictEqual(uploadResult.mime_type, 'text/plain');
				assert.strictEqual(uploadResult.expires, currentTime.add(6, 'hours').unix());
			} finally {
				delete process.env.CONNECTOR_FILE_DEV_BUCKET;
			}
		});

		it(`should increase queueSize if CONNECTOR_MAX_ALLOCATED_RAM_MB is defined`, async () => {
			process.env.CONNECTOR_MAX_ALLOCATED_RAM_MB = 512;

			try {
				const passThroughStream = new stream.PassThrough();

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
							async upload (uploadParams, uploadOptions, callback) {
								assert.strictEqual(uploadParams.Bucket, 'workflow-file-uploads');
								assert.strictEqual(uploadParams.Key, randomGuid);
								assert.strictEqual(uploadParams.ContentType, 'text/plain');

								assert.deepEqual(
									uploadOptions,
									{
										partSize: 33554432,
										queueSize: 12,
									}
								);

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

				setTimeout(() => {
					passThroughStream.write('Example content');
					passThroughStream.end();
				}, 500);
				const uploadResult = await falafel.files.streamMPUpload({
					contentType: 'text/plain',
					name: 'example.txt',
					readStream: passThroughStream
				});

				assert.strictEqual(uploadResult.name, 'example.txt');
				assert.strictEqual(uploadResult.url, 'https://test.aws.com/buckethash');
				assert.strictEqual(uploadResult.mime_type, 'text/plain');
				assert.strictEqual(uploadResult.expires, currentTime.add(6, 'hours').unix());
			} finally {
				delete process.env.CONNECTOR_MAX_ALLOCATED_RAM_MB;
			}
		});

		it(`should increase queueSize if fileSize is greater than half the available RAM`, async () => {
			const passThroughStream = new stream.PassThrough();

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
						async upload (uploadParams, uploadOptions, callback) {
							assert.strictEqual(uploadParams.Bucket, 'workflow-file-uploads');
							assert.strictEqual(uploadParams.Key, randomGuid);
							assert.strictEqual(uploadParams.ContentType, 'text/plain');

							assert.deepEqual(
								uploadOptions,
								{
									partSize: 8388608,
									queueSize: 12,
								}
							);

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

			setTimeout(() => {
				passThroughStream.write('Example content');
				passThroughStream.end();
			}, 500);
			const uploadResult = await falafel.files.streamMPUpload({
				contentType: 'text/plain',
				name: 'example.txt',
				readStream: passThroughStream,
				length: 68000000
			});

			assert.strictEqual(uploadResult.name, 'example.txt');
			assert.strictEqual(uploadResult.url, 'https://test.aws.com/buckethash');
			assert.strictEqual(uploadResult.mime_type, 'text/plain');
			assert.strictEqual(uploadResult.expires, currentTime.add(6, 'hours').unix());
		});

		it('should error if readStream is not provided', async () => {
			getProxiedFileHandler();

			try {
				await falafel.files.streamMPUpload({
					contentType: 'text/plain',
					name: 'example.txt',
				});
			} catch (uploadError) {
				try {
					assert.strictEqual(uploadError.code, '#connector_error');
					assert.strictEqual(uploadError.message, `The object passed in must contain the property 'readStream', referecing a read stream.`);
				} catch (otherError) {
					assert.fail(uploadError);
				}
			}
		});

		it('should error if readStream is not a stream', async () => {
			getProxiedFileHandler();

			try {
				await falafel.files.streamMPUpload({
					contentType: 'text/plain',
					name: 'example.txt',
					readStream: {}
				});
			} catch (uploadError) {
				try {
					assert.strictEqual(uploadError.code, '#connector_error');
					assert.strictEqual(uploadError.message, `The object passed in must contain the property 'readStream', referecing a read stream.`);
				} catch (otherError) {
					assert.fail(uploadError);
				}
			}
		});

		it(`should surface error in correct format if upload errors`, async () => {
			const passThroughStream = new stream.PassThrough();

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
						async upload (uploadParams, uploadOptions, callback) {
							assert.strictEqual(uploadParams.Bucket, 'workflow-file-uploads');
							assert.strictEqual(uploadParams.Key, randomGuid);
							assert.strictEqual(uploadParams.ContentType, 'text/plain');

							assert.deepEqual(
								uploadOptions,
								{
									partSize: 8388608,
									queueSize: 4,
								}
							);

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
							callback(new Error('Some upload error'), null);
						}
						getSignedUrl (operation, signedParams, callback) {
							assert.fail();
						}
					}
				}
			});

			try {
				setTimeout(() => {
					passThroughStream.write('Example content');
					passThroughStream.end();
				}, 500);
				const uploadResult = await falafel.files.streamMPUpload({
					contentType: 'text/plain',
					name: 'example.txt',
					readStream: passThroughStream
				});
				assert.fail(uploadResult);
			} catch (uploadError) {
				try {
					assert.strictEqual(uploadError.code, '#connector_error');
					assert.strictEqual(uploadError.message, 'An issue has occured when attempting to upload the file.');
					assert.strictEqual(uploadError.payload.error, 'Some upload error');
				} catch (otherError) {
					assert.fail(uploadError);
				}
			}
		});

		it(`should surface error in correct format if getSignedUrl errors`, async () => {
			const passThroughStream = new stream.PassThrough();

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
						async upload (uploadParams, uploadOptions, callback) {
							assert.strictEqual(uploadParams.Bucket, 'workflow-file-uploads');
							assert.strictEqual(uploadParams.Key, randomGuid);
							assert.strictEqual(uploadParams.ContentType, 'text/plain');

							assert.deepEqual(
								uploadOptions,
								{
									partSize: 8388608,
									queueSize: 4,
								}
							);

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
							callback(new Error('Some getSignedUrl error'), null);
						}
					}
				}
			});

			try {
				setTimeout(() => {
					passThroughStream.write('Example content');
					passThroughStream.end();
				}, 500);
				const uploadResult = await falafel.files.streamMPUpload({
					contentType: 'text/plain',
					name: 'example.txt',
					readStream: passThroughStream
				});
				assert.fail(uploadResult);
			} catch (uploadError) {
				try {
					assert.strictEqual(uploadError.code, '#connector_error');
					assert.strictEqual(uploadError.message, 'An issue has occured when attempting to upload the file.');
					assert.strictEqual(uploadError.payload.error, 'Some getSignedUrl error');
				} catch (otherError) {
					assert.fail(uploadError);
				}
			}
		});

		it(`should stream upload file with access control list`, async () => {
			const passThroughStream = new stream.PassThrough();
			const contentLength = Buffer.byteLength('Example content', 'utf8');

			const randomGuid = guid();
			let currentTime;
			getProxiedFileHandler({
				'mout/random/guid': () => {
					return randomGuid;
				},
				'aws-sdk': {
					'S3': class S3 {
						async upload (uploadParams, uploadOptions, callback) {
							console.log('UPLOAD PARAMS', uploadParams);
							assert.strictEqual(uploadParams.ACL, 'bucket-owner-full-control');
							callback(null, {
								Bucket: uploadParams.Bucket,
								Key: uploadParams.Key,
							});
						}
						getSignedUrl (operation, signedParams, callback) {
							callback(null, 'https://test.aws.com/buckethash');
						}
					}
				}
			});

			setTimeout(() => {
				passThroughStream.write('Example content');
				passThroughStream.end();
			}, 500);
			const uploadResult = await falafel.files.streamUpload({
				contentType: 'text/plain',
				name: 'example.txt',
				length: contentLength,
				readStream: passThroughStream
			});
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
						assert.strictEqual(options.output, '/tmp/somefile.txt');
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

		it(`should reject with expiry error for statusCode between 400 and 500 if from s3 for v2 signature - (${random4xx})`, async () => {
			const baseUrl = 'https://example.amazonaws.com',
				endpoint = '/somefile',
				queryParams = { 'Expires': '1593320298' };
			const queryString = (new URLSearchParams(queryParams)).toString();
			const fullUrl = `${baseUrl}${endpoint}?${queryString}`;

			nock(baseUrl)
			.get(endpoint)
			.query(queryParams)
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
						assert.strictEqual(url, fullUrl);
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
					url: fullUrl,
					name: 'somefile.txt',
					mime_type: 'text/plain',
					expires: 1593320298
				});
			} catch (downloadError) {
				assert.strictEqual(downloadError.message, 'The file provided has expired. Please note that links to files downloaded by connectors expire within 6 hours.');
				assert.strictEqual(downloadError.payload.datetime_expired, moment(queryParams['Expires'], 'X').format());
			}
		});

		it(`should reject with expiry error for statusCode between 400 and 500 if from s3 for v4 signature - (${random4xx})`, async () => {
			const baseUrl = 'https://example.amazonaws.com',
				endpoint = '/somefile',
				queryParams = {
					'X-Amz-Date': '20200628T160000Z',
					'X-Amz-Expires': 86400
				};
			const queryString = (new URLSearchParams(queryParams)).toString();
			const fullUrl = `${baseUrl}${endpoint}?${queryString}`;

			nock(baseUrl)
			.get(endpoint)
			.query(queryParams)
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
						assert.strictEqual(url, fullUrl);
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
					url: fullUrl,
					name: 'somefile.txt',
					mime_type: 'text/plain',
					expires: 1593442800
				});
			} catch (downloadError) {
				assert.strictEqual(downloadError.message, 'The file provided has expired. Please note that links to files downloaded by connectors expire within 6 hours.');
				assert.strictEqual(downloadError.payload.datetime_expired, moment(queryParams['X-Amz-Date'], 'YYYYMMDD[T]HHmmss[Z]').add(queryParams['X-Amz-Expires'], 's').format());
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
        
		it('should throw error if invalid file object passed through', async () => {
			const invalidFileObj = {
				name: 'some.pdf',
				mime_type: 'application/pdf',
				expires: 1594289612,
			};

			getProxiedFileHandler({
				needle: {
					get: (url, options, callback) => {
						assert.fail(url);
					}
				} 
			});

			try {
				await falafel.files.download(invalidFileObj);
			} catch (downloadError) {
				assert.strictEqual(downloadError.code, '#connector_error');
				assert.strictEqual(downloadError.message, `The 'url' property is missing. The file object passed through must contain all properties 'name', 'url', 'mime_type', 'expires'.`);
			}
		});

		it('should throw error if file object values are of an invalid type', async () => {
			const invalidFileObj = {
				name: 'some.pdf',
				url: 123,
				mime_type: 'application/pdf',
				expires: 1594289612,
			};

			getProxiedFileHandler({
				needle: {
					get: (url, options, callback) => {
						assert.fail(url);
					}
				} 
			});

			try {
				await falafel.files.download(invalidFileObj);
			} catch (downloadError) {
				assert.strictEqual(downloadError.code, '#connector_error');
				assert.strictEqual(downloadError.message, `The file object passed through contains invalid type for the 'url' key.`);
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

		it(`should reject with expiry error for statusCode between 400 and 500 if from s3 for v2 signature - (${random4xx})`, async () => {
			const baseUrl = 'https://example.amazonaws.com',
				endpoint = '/somefile',
				queryParams = { 'Expires': '1593320298' };
			const queryString = (new URLSearchParams(queryParams)).toString();
			const fullUrl = `${baseUrl}${endpoint}?${queryString}`;

			nock(baseUrl)
			.get(endpoint)
			.query(queryParams)
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
						assert.strictEqual(url, fullUrl);
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
					url: fullUrl,
					name: 'somefile.txt',
					mime_type: 'text/plain',
					expires: 1593320298
				});
			} catch (downloadError) {
				assert.strictEqual(downloadError.message, 'The file provided has expired. Please note that links to files downloaded by connectors expire within 6 hours.');
				assert.strictEqual(downloadError.payload.datetime_expired, moment(queryParams['Expires'], 'X').format());
			}

		});

		it(`should reject with expiry error for statusCode between 400 and 500 if from s3 for v4 signature - (${random4xx})`, async () => {
			const baseUrl = 'https://example.amazonaws.com',
				endpoint = '/somefile',
				queryParams = {
					'X-Amz-Date': '20200628T160000Z',
					'X-Amz-Expires': 86400
				};
			const queryString = (new URLSearchParams(queryParams)).toString();
			const fullUrl = `${baseUrl}${endpoint}?${queryString}`;

			nock(baseUrl)
			.get(endpoint)
			.query(queryParams)
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
						assert.strictEqual(url, fullUrl);
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
					url: fullUrl,
					name: 'somefile.txt',
					mime_type: 'text/plain',
					expires: 1593442800
				});
			} catch (downloadError) {
				assert.strictEqual(downloadError.message, 'The file provided has expired. Please note that links to files downloaded by connectors expire within 6 hours.');
				assert.strictEqual(downloadError.payload.datetime_expired, moment(queryParams['X-Amz-Date'], 'YYYYMMDD[T]HHmmss[Z]').add(queryParams['X-Amz-Expires'], 's').format());
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
        
		it('should throw error if invalid file object passed through', async () => {
			const invalidFileObj = {
				name: 'some.pdf',
				mime_type: 'application/pdf',
				expires: 1594289612,
			};

			getProxiedFileHandler({
				needle: {
					get: (url, options, callback) => {
						assert.fail(url);
					}
				} 
			});

			try {
				await falafel.files.download(invalidFileObj);
			} catch (downloadError) {
				assert.strictEqual(downloadError.code, '#connector_error');
				assert.strictEqual(downloadError.message, `The 'url' property is missing. The file object passed through must contain all properties 'name', 'url', 'mime_type', 'expires'.`);
			}
		});

		it('should throw error if file object values are of an invalid type', async () => {
			const invalidFileObj = {
				name: 'some.pdf',
				url: 123,
				mime_type: 'application/pdf',
				expires: 1594289612,
			};

			getProxiedFileHandler({
				needle: {
					get: (url, options, callback) => {
						assert.fail(url);
					}
				} 
			});

			try {
				await falafel.files.download(invalidFileObj);
			} catch (downloadError) {
				assert.strictEqual(downloadError.code, '#connector_error');
				assert.strictEqual(downloadError.message, `The file object passed through contains invalid type for the 'url' key.`);
			}
		});
	});
});
