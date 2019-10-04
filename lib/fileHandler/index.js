const fs = require('fs');
const util = require('util');
const { PassThrough } = require('stream');

const when = require('when');
const guid = require('mout/random/guid');
const mime = require('mime');
const moment = require('moment');

const needle = require('needle');

const AWS = require('aws-sdk');

const REGION = 'us-west-2',
	BUCKET = 'workflow-file-uploads',
	DEV_BUCKET = 'workflow-file-uploads-dev';

const UPLOAD_MIN_SIZE = 1024 * 1024 * 8, //8MB
	MAX_RAM = 1024 * 1024 * ( process.env['AWS_LAMBDA_FUNCTION_MEMORY_SIZE'] || 128 ); //128MB default

let TARGET_SIZE = MAX_RAM / 16;
TARGET_SIZE = ( TARGET_SIZE < UPLOAD_MIN_SIZE ? UPLOAD_MIN_SIZE : TARGET_SIZE );

function logError (errorName, error) {
	// eslint-disable-next-line no-console
	console.error(errorName, util.inspect(error, { depth: null }));
}

module.exports = function (options) {

	const TARGET_BUCKET = ( options.dev || options.test ? DEV_BUCKET : BUCKET );

	//Pull the AWS creds from environment if present
	if (_.isPlainObject(options.aws)) {
		if (options.dev) {
			// eslint-disable-next-line no-console
			console.warn('Specifying `key` and `secret` is not recommended. Setting up AWS credentials on your machine via the AWS CLI is recommended.');
		}
		const { key, secret } = options.aws;
		if (key && secret) {
			AWS.config.update({
				accessKeyId: key,
				secretAccessKey: secret
			});
		}
	}


	//Standardising the error format for rejection during download attempt
	function formatUploadRejectObject (rejectError) {
		return {
			code: '#connector_error',
			message: 'An issue has occured when attempting to upload the file.',
			payload: {
				error: rejectError.message || undefined
			}
		};
	}

	/*
		Upload a file to S3.
	*/
	const upload = function (params) {

		return when.promise(function (resolve, reject) {

			if (_.isUndefined(params.length)) {
				return reject({
					code: '#connector_error',
					message: '`length` must be specified for file uploading.'
				});
			}

			//Generate a random file name
			const fileGuidName = guid();

			//Get mimeType
			const mimeType = params.contentType || mime.getType(params.name);

			//Setup params for `s3.upload` method
			const uploadParams = {
				Bucket: params.bucket || TARGET_BUCKET,
				Key: fileGuidName,
				ContentType: mimeType,
				ContentLength: params.length
			};

			//Set relavant Body
			if (params.file) {	// NEW

				uploadParams.Body = fs.createReadStream(params.file);

			} else {	// OLD

				// eslint-disable-next-line no-console
				console.warn('Dev warning - this is using the old upload mechanism; please use `file` (the path to the local file) instead of `contents`.');

				const { contents: contentBuffer } = params;
				if (!util.isBuffer(contentBuffer)) {
					return reject({
						code: '#connector_error',
						message: 'Please pass the `contents` as a Node.js Buffer.'
					});
				} else {
					uploadParams.Body = contentBuffer;
				}

			}

			const s3 = new AWS.S3({ region: params.region || REGION });

			s3.upload(uploadParams, function (fileUploadError, data) {

				if (fileUploadError) {
					logError('[ERROR] fileUploadError', fileUploadError);
					return reject(formatUploadRejectObject(fileUploadError));
				}

				const twentyFourHourPeriod = moment().add(1, 'days');

				s3.getSignedUrl(
					'getObject',
					{
						Bucket: params.bucket || TARGET_BUCKET,
						Key: fileGuidName,
						Expires: twentyFourHourPeriod.unix() - moment().unix()
					},
					function (fileUploadSigningError, signedUrl) {

						if (fileUploadSigningError) {
							logError('[ERROR] fileUploadSigningError', fileUploadSigningError);
							return reject(formatUploadRejectObject(fileUploadError));
						}

						resolve({
							name: params.name,
							url: signedUrl,
							mime_type: mimeType,
							expires: twentyFourHourPeriod.unix()
						});

					}
				);

			});

		});
	};

	/*
		A stream variant of upload, requiring a `readStream` property
		instead of a `file` property
	*/
	const streamUpload = function (params) {

		if (_.isUndefined(params.readStream) || _.isUndefined(params.readStream.pipe)) {
			return when.reject({
				code: '#connector_error',
				message: 'The object passed in must contain the property \'readStream\', referecing a read stream.'
			});
		}

		if (_.isUndefined(params.length)) {
			return when.reject({
				code: '#connector_error',
				message: '`length` must be specified for file uploading.'
			});
		}

		return streamMPUpload(params);

	};

	/*
		A multi-part variant of streamUpload; should only be used if there is
		absolutely now way of uploading with the content-length header set.
	*/
	const streamMPUpload = function (params) {

		if (_.isUndefined(params.readStream) || _.isUndefined(params.readStream.pipe)) {
			return when.reject({
				code: '#connector_error',
				message: 'The object passed in must contain the property \'readStream\', referecing a read stream.'
			});
		}

		return when.promise(function (resolve, reject) {

			//Generate a random file name
			const fileGuidName = guid();

			//Get mimeType
			const mimeType = params.contentType || mime.getType(params.name);

			const uploadParams = {
				Bucket: params.bucket || TARGET_BUCKET,
				Key: fileGuidName,
				ContentType: mimeType
			};

			const uploadOptions = {
				partSize: UPLOAD_MIN_SIZE, //default 8MB parts
				queueSize: 4 //default 4 parallel uploads
			};
			if (!_.isUndefined(params.length)) {
				const fileSize = uploadParams.ContentLength = params.length;

				if (fileSize > UPLOAD_MIN_SIZE) {
					uploadOptions.partSize = TARGET_SIZE;
					if (fileSize > (TARGET_SIZE * 8)) {
						//This should use up half the available RAM (queueSize * partSize)
						uploadOptions.queueSize = 8;
					}
				}

			}
			// eslint-disable-next-line no-console
			console.log('Falafel upload', JSON.stringify(uploadOptions));
			const passThroughStream = new PassThrough({ highWaterMark: uploadOptions.partSize });
			uploadParams.Body = passThroughStream;

			const s3 = new AWS.S3({ region: params.region || REGION });

			s3.upload(
				uploadParams,
				uploadOptions,
				function (fileUploadError, data) {

					if (fileUploadError) {
						logError('[ERROR] fileUploadError', fileUploadError);
						return reject(formatUploadRejectObject(fileUploadError));
					}

					const twentyFourHourPeriod = moment().add(1, 'days');

					s3.getSignedUrl(
						'getObject',
						{
							Bucket: params.bucket || TARGET_BUCKET,
							Key: fileGuidName,
							Expires: twentyFourHourPeriod.unix() - moment().unix()
						},
						function (fileUploadSigningError, signedUrl) {

							if (fileUploadSigningError) {
								logError('[ERROR] fileUploadSigningError', fileUploadSigningError);
								return reject(formatUploadRejectObject(fileUploadSigningError));
							}

							resolve({
								name: params.name,
								url: signedUrl,
								mime_type: mimeType,
								expires: twentyFourHourPeriod.unix()
							});

						}
					);

				}
			);

			params.readStream.pipe(passThroughStream);

		});

	};



	//Standardising the error format for rejection during upload attempt
	function formatDownloadRejectObject (rejectError) {
		return {
			code: '#connector_error',
			message: 'An issue has occured when attempting to download the file.',
			payload: {
				error: rejectError.message || undefined
			}
		};
	}

	/*
		Download a file from S3. The object passed here should have been one that
		was returned via the `upload` function above in a previous workflow step.
	*/
	const download = function (file) {
		return when.promise(function (resolve, reject) {

			const fileName = '/tmp/' + (file.name || guid());

			needle.get(file.url, {
				parse: false,
				open_timeout: 0,
				read_timeout: 0,
				output: fileName,
			}, function (err, res) {

				if (err) {
					return reject(formatDownloadRejectObject(err));
				}

				if (_.inRange(res.statusCode, 200, 300)) {
					// Resolve with
					resolve({
						// The contents that was downloaded
						file: fileName,

						// Pass back what was passed in to be helpful
						name: file.name,
						mime_type: file.mime_type,
						expires: file.expires
					});
				} else {
					reject(formatDownloadRejectObject(new Error('Status code: ' + res.statusCode)));
				}

			});

		});
	};


	/*
		A stream variant of download, which resolve with an object with a
		`readStream` property instead of a `file` property
	*/
	const streamDownload = function (file) {
		return when.promise(function (resolve, reject) {

			const getStream = needle.get(
				file.url,
				{
					parse: false,
					open_timeout: 0,
					read_timeout: 0
				}
			)
			.on('header', function (statusCode, headers) {

				if (_.inRange(statusCode, 200, 300)) {
					resolve({
						// The contents as a stream
						readStream: getStream,
						// Pass back what was passed in to be helpful
						name: file.name,
						mime_type: file.mime_type,
						expires: file.expires,
						size: headers['content-length']
					});
				} else {
					reject(formatDownloadRejectObject(new Error('Status code: ' + statusCode)));
				}

			})
			.on('err', formatDownloadRejectObject);

		});
	};



	falafel.files = {

		upload: upload,
		streamUpload: streamUpload,
		streamMPUpload: streamMPUpload,

		download: download,
		streamDownload: streamDownload

	};

};
