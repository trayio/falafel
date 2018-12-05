var fs     = require('fs');
var util   = require('util');

var when   = require('when');
var guid   = require('mout/random/guid');
var mime   = require('mime');
var moment = require('moment');

var needle = require('needle');
// var knox   = require('knox');

var AWS = require('aws-sdk');

var REGION = 'us-west-2',
	BUCKET = 'workflow-file-uploads';


module.exports = function (options) {

	function checkDevConfig () {
		if (process.env.NODE_ENV === 'development' && _.isUndefined(options.aws) && _.isUndefined(process.env.AWS_ACCESS_KEY_ID)) {
			return new Error('For development and testing please require an aws.json file with `key` and `secret` or add `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` to the environment.');
		}
	}


	//Pull the AWS creds from environment if present
	if (_.isPlainObject(options.aws)) {
		var specifiedCreds = options.aws;
		if (specifiedCreds.key && specifiedCreds.secret) {
			AWS.config.update({
				accessKeyId: specifiedCreds.key,
				secretAccessKey: specifiedCreds.secret
			});
		}
	}

	//Standardising the error format for rejection during download attempt
	function formatUploadRejectObject (rejectError) {
		return {
			code: '#connector_error',
			payload: {
				reason: 'An issue has occured when attempting to upload the file.',
				error: rejectError.message || undefined
			}
		};
	}

	/*
		Upload a file to S3.
	*/
	var upload = function (params) {

		var errorCheck = checkDevConfig();
		if (_.isError(errorCheck)) {
			return when.reject(errorCheck);
		}

		return when.promise(function (resolve, reject) {

			if (_.isUndefined(params.length)) {
				return reject(new Error('`length` must be specified for file uploading.'));
			}

			//Generate a random file name
			var fileGuidName = guid();

			//Get mimeType
			var mimeType = params.contentType || mime.lookup(params.name);

			//Setup params for `s3.upload` method
			var uploadParams = {
				Bucket: BUCKET,
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

				var contentBuffer = params.contents;
				if (!util.isBuffer(contentBuffer)) {
					return reject(new Error('Please pass the `contents` as a Node.js Buffer.'));
				} else {
					uploadParams.Body = contentBuffer;
				}

			}

			var s3 = new AWS.S3({ region: REGION });

			s3.upload(uploadParams, function (fileUploadError, data) {

				if (fileUploadError) {
					// eslint-disable-next-line no-console
					console.log('fileUploadError', fileUploadError);
					return reject(formatUploadRejectObject(fileUploadError));
				}

				var twentyFourHourPeriod = moment().add(1, 'days');

				s3.getSignedUrl(
					'getObject',
					{
						Bucket: BUCKET,
						Key: fileGuidName,
						Expires: twentyFourHourPeriod.unix() - moment().unix()
					},
					function (fileUploadSigningError, signedUrl) {

						if (fileUploadSigningError) {
							// eslint-disable-next-line no-console
							console.log('fileUploadSigningError', fileUploadSigningError);
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
	var streamUpload = function (params) {

		var errorCheck = checkDevConfig();
		if (_.isError(errorCheck)) {
			return when.reject(errorCheck);
		}

		if (_.isUndefined(params.readStream) || _.isUndefined(params.readStream.pipe)) {
			return when.reject(new Error('The object passed in must contain the property \'readStream\', referecing a read stream.'));
		}

		if (_.isUndefined(params.length)) {
			return when.reject(new Error('`length` must be specified for file uploading.'));
		}

		return streamMPUpload(params);

	};

	/*
		A multi-part variant of streamUpload; should only be used if there is
		absolutely now way of uploading with the content-length header set.
	*/
	var streamMPUpload = function (params) {

		var errorCheck = checkDevConfig();
		if (_.isError(errorCheck)) {
			return when.reject(errorCheck);
		}

		if (_.isUndefined(params.readStream) || _.isUndefined(params.readStream.pipe)) {
			return when.reject(new Error('The object passed in must contain the property \'readStream\', referecing a read stream.'));
		}

		return when.promise(function (resolve, reject) {

			//Generate a random file name
			var fileGuidName = guid();

			//Get mimeType
			var mimeType = params.contentType || mime.lookup(params.name);

			var uploadParams = {
				Bucket: BUCKET,
				Key: fileGuidName,
				ContentType: mimeType,
				Body: params.readStream
			};

			if (!_.isUndefined(params.length)) {
				uploadParams.ContentLength = params.length;
			}

			var s3 = new AWS.S3({ region: REGION });

			s3.upload(
				uploadParams,
				function (fileUploadError, data) {

					if (fileUploadError) {
						// eslint-disable-next-line no-console
						console.log('fileUploadError', fileUploadError);
						return reject(formatUploadRejectObject(fileUploadError));
					}

					var twentyFourHourPeriod = moment().add(1, 'days');

					s3.getSignedUrl(
						'getObject',
						{
							Bucket: BUCKET,
							Key: fileGuidName,
							Expires: twentyFourHourPeriod.unix() - moment().unix()
						},
						function (fileUploadSigningError, signedUrl) {

							if (fileUploadSigningError) {
								// eslint-disable-next-line no-console
								console.log('fileUploadSigningError', fileUploadSigningError);
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

		});

	};



	//Standardising the error format for rejection during upload attempt
	function formatDownloadRejectObject (rejectError) {
		return {
			code: '#connector_error',
			payload: {
				reason: 'An issue has occured when attempting to download the file.',
				error: rejectError.message || undefined
			}
		};
	}

	/*
		Download a file from S3. The object passed here should have been one that
		was returned via the `upload` function above in a previous workflow step.
	*/
	var download = function (file) {
		return when.promise(function (resolve, reject) {

			var fileName = '/tmp/' + (file.name || guid());

			needle.get(file.url, {
				parse: false,
				open_timeout: 0,
				read_timeout: 0,
				output: fileName,
			}, function (err, res) {
				if (err) {
					reject(formatDownloadRejectObject(err));
				} else if (res.statusCode !== 200) {
					reject(formatDownloadRejectObject(new Error(res.statusCode)));
				} else {

					// Resolve with
					resolve({
						// The contents that was downloaded
						file: fileName,

						// Pass back what was passed in to be helpful
						name: file.name,
						mime_type: file.mime_type,
						expires: file.expires
					});
				}
			});

		});
	};


	/*
		A stream variant of download, which resolve with an object with a
		`readStream` property instead of a `file` property
	*/
	var streamDownload = function (file) {
		return when.promise(function (resolve, reject) {

			var getStream = needle.get(
				file.url,
				{
					parse: false,
					open_timeout: 0,
					read_timeout: 0
				}
			)
			.on('header', function (statusCode, headers) {

				if (statusCode !== 200) {
					reject(formatDownloadRejectObject(new Error(statusCode)));
				} else {
					resolve({
						// The contents as a stream
						readStream: getStream,
						// Pass back what was passed in to be helpful
						name: file.name,
						mime_type: file.mime_type,
						expires: file.expires,
						size: headers['content-length']
					});
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
