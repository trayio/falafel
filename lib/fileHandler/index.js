const fs = require('fs');
const path = require('path');
const util = require('util');
const { PassThrough } = require('stream');
const { URL } = require('url');

const _ = require('lodash');
const when = require('when');
const guid = require('mout/random/guid');
const mime = require('mime');
const moment = require('moment');

const needle = require('needle');

const AWS = require('aws-sdk');

const {
	AWS_LAMBDA_FUNCTION_MEMORY_SIZE,
	CONNECTOR_MAX_ALLOCATED_RAM_MB,
	CONNECTOR_FILE_REGION,
	CONNECTOR_FILE_BUCKET,
	CONNECTOR_FILE_DEV_BUCKET,
} = process.env;

const REGION = CONNECTOR_FILE_REGION || 'us-west-2',
	BUCKET = CONNECTOR_FILE_BUCKET || 'workflow-file-uploads',
	DEV_BUCKET = CONNECTOR_FILE_DEV_BUCKET || 'workflow-file-uploads-dev';

const ALLOCATED_RAM = AWS_LAMBDA_FUNCTION_MEMORY_SIZE || CONNECTOR_MAX_ALLOCATED_RAM_MB;
const availableRAM = ( ALLOCATED_RAM ? _.parseInt(ALLOCATED_RAM) : 128 ); //128MB default

const UPLOAD_MIN_SIZE = 1024 * 1024 * 8, //8MB
	MAX_RAM = 1024 * 1024 * availableRAM;

/*
	128 / 16 = 8 (which is UPLOAD_MIN_SIZE)
	TARGET_SIZE should either be 8MB (since default assumed RAM is 128MB) or
	1/16 of of the availableRAM, which ever is greater. The TARGET_SIZE, set
	as `partSize`, will always be used in conjuction with `queueSize`.
*/
let TARGET_SIZE = _.floor(MAX_RAM / 16);
TARGET_SIZE = ( TARGET_SIZE < UPLOAD_MIN_SIZE ? UPLOAD_MIN_SIZE : TARGET_SIZE );

const DEFAULT_UPLOAD_OPTIONS = {
	// 8MB (minimum) * 4 parallel = upto 32MB/s RAM usage
	partSize: TARGET_SIZE,
	queueSize: 4 //Ensures at least up to 1/4 of the RAM is utilised
};

const REQUIRED_FILE_PROPS = ['name', 'url', 'mime_type', 'expires']

const isObjValid = fileObj => {
    const fileObjKeyArr = _.keys(fileObj)
    return REQUIRED_FILE_PROPS.every(reqField => fileObjKeyArr.includes(reqField))
}

const throwFileValidationErr = () => {
    return when.reject({
        code: '#connector_error',
        message: 'The file object passed in must contain valid properties \'name\', \'url\', \'mime_type\', \'expires\'.'
    });
}

function logError (errorName, error) {
	// eslint-disable-next-line no-console
	console.error(errorName, util.inspect(error, { depth: null }));
}

module.exports = function (options) {

	if (options.dev) {
		/*
			This usage of `require.main` assumes falafel is invoked in the
			application's entry script
		*/
		const mainContents = fs.readFileSync(require.main.filename, 'utf8');
		if (_.includes(mainContents, 'aws.json')) {
			// eslint-disable-next-line no-console
			console.warn('aws.json file is now deprecated. Please set up AWS credentials on your machine.');
		}
	}

	const TARGET_BUCKET = ( options.dev || options.test ? DEV_BUCKET : BUCKET );

	/*
		Pull the AWS creds from environment if present, else check if
		options.aws is provided
	*/
	if (_.isPlainObject(options.aws)) {
		if (options.dev) {
			// eslint-disable-next-line no-console
			console.warn('Specifying `key` and `secret` is not recommended. Please consider setting up AWS credentials or another method supported by AWS SDK instead.');
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

	function s3Upload ({ params, fileGuidName, mimeType, uploadParams, uploadOptions = {} }) {
		return new Promise((resolve, reject) => {
			const s3 = new AWS.S3({ region: params.region || REGION });

			s3.upload(
				uploadParams,
				uploadOptions,
				(fileUploadError, data) => {

					if (fileUploadError) {
						logError('[ERROR] fileUploadError', fileUploadError);
						return reject(formatUploadRejectObject(fileUploadError));
					}

					const sixHourPeriod = moment().add(6, 'hours');

					s3.getSignedUrl(
						'getObject',
						{
							Bucket: data.Bucket || params.bucket || TARGET_BUCKET,
							Key: data.Key || fileGuidName,
							Expires: sixHourPeriod.unix() - moment().unix()
						},
						(fileUploadSigningError, signedUrl) => {

							if (fileUploadSigningError) {
								logError('[ERROR] fileUploadSigningError', fileUploadSigningError);
								return reject(formatUploadRejectObject(fileUploadSigningError));
							}

							resolve({
								name: params.name,
								url: signedUrl,
								mime_type: mimeType,
								expires: sixHourPeriod.unix()
							});

						}
					);

				}
			);
		});
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

			s3Upload({
				params,
				fileGuidName,
				mimeType,
				uploadParams,
			})
			.then(resolve, reject);
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

			/*
				TODO: in the future, replace s3.upload with manual multipart
				uploading using the AWS SDK. This should be done with a custom
				Async Queue so that the partSize and queueSize can be modified
				to scale over time and when certain data size thresholds are
				met, all the way to a maximum partSize and queueSize. This means
				for large files for which length is unknown, partSize and
				queueSize can dynamically increase until maximum.
			*/
			const uploadOptions = DEFAULT_UPLOAD_OPTIONS;
			if (_.isUndefined(params.length)) { //i.e. if file length is not specified
				/*
					Since file size is not known, if `CONNECTOR_MAX_ALLOCATED_RAM_MB`
					is provided, increase queueSize so that up to 3/4 RAM is used.
					(1/4 should be left as head room, especially if `CONNECTOR_MAX_ALLOCATED_RAM_MB`
					is meant to include the connector app itself)
				*/
				if (CONNECTOR_MAX_ALLOCATED_RAM_MB) {
					uploadOptions.queueSize = 12;
				}
			} else { //i.e. if file length is specified
				const fileSize = uploadParams.ContentLength = params.length;
				/*
					If file size is over half the available RAM, update
					queueSize so that up to 3/4 RAM is used
					(queueSize * partSize)
				*/
				if (fileSize > TARGET_SIZE  && fileSize > (TARGET_SIZE * 8)) {
					uploadOptions.queueSize = 12;
				}
			}

			// eslint-disable-next-line no-console
			console.log('Falafel upload', JSON.stringify(uploadOptions));
			const passThroughStream = new PassThrough({ highWaterMark: uploadOptions.partSize });
			uploadParams.Body = passThroughStream;

			s3Upload({
				params,
				fileGuidName,
				mimeType,
				uploadParams,
				uploadOptions
			})
			.then(resolve, reject);

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

	//Check if the URL and response is a pre-signed URL from AWS
	function checkAndGetExpiry (url, headers, rawBody) {
		const isMetaValid = _.includes(headers['content-type'], 'application/xml') &&
		_.includes(headers.server, 'AmazonS3') &&
		_.includes(rawBody.toString(), 'Request has expired');

		if (!isMetaValid) {
			return false;
		}

		const currentDatetime = moment();
		const targetUrl = new URL(url);

		if (_.includes(url, 'Expires=')) {
			let expiryDatetime = targetUrl.searchParams.get('Expires');
			if (expiryDatetime) {
				expiryDatetime = moment(expiryDatetime, 'X');
				if (currentDatetime.isAfter(expiryDatetime)) {
					return expiryDatetime.format();
				}
			}
		}

		if (_.includes(url, 'X-Amz-Date=') && _.includes(url, 'X-Amz-Expires=')) {
			const creationDatetime = targetUrl.searchParams.get('X-Amz-Date');
			const duration = targetUrl.searchParams.get('X-Amz-Expires');
			if (creationDatetime && duration) {
				const expiryDatetime = moment(creationDatetime, 'YYYYMMDD[T]HHmmss[Z]').add(duration, 's');
				if (currentDatetime.isAfter(expiryDatetime)) {
					return expiryDatetime.format();
				}
			}
		}

		return false;
	}

	function expiryRejectObject (expiryDatetime) {
		const payload = {};
		if (expiryDatetime) {
			//snake_case as this is exposed to the user
			payload.datetime_expired = expiryDatetime;
		}
		return {
			code: '#user_input_error',
			message: 'The file provided has expired. Please note that links to files downloaded by connectors expire within 6 hours.',
			payload
		};
	}

	/*
		Download a file from S3. The object passed here should have been one that
		was returned via the `upload` function above in a previous workflow step.
	*/
	const download = function (file, needleOptions = {}) {

        if (!isObjValid(file)) {
            return throwFileValidationErr()
        }

		return when.promise(function (resolve, reject) {

			//In v2, change this, to avoid overwriting if same name was specified twice
			const fileName = '/tmp/' + (file.name || guid());

			needle.get(
				file.url,
				{
					follow_max: 3,
					decode_response: false,
					parse: false,
					open_timeout: 0,
					read_timeout: 0,
					...needleOptions,
					output: fileName,
				},
				function (err, res) {
					if (err) { return reject(formatDownloadRejectObject(err)); }

					//NOTE: needle only creates output file if statusCode is 200
					if (res.statusCode === 200) {
						// Resolve with:
						return resolve({
							// The contents that was downloaded
							file: fileName,

							// Pass back what was passed in to be helpful
							name: file.name,
							mime_type: file.mime_type,
							expires: file.expires
						});
					}
					if (_.inRange(res.statusCode, 400, 500)) {
						const expiryDatetime = checkAndGetExpiry(file.url, res.headers, res.raw);
						if (expiryDatetime) {
							return reject(expiryRejectObject(expiryDatetime));
						}
					}
					reject(formatDownloadRejectObject(new Error('Status code: ' + res.statusCode)));
				}
			);

		});
	};


	/*
		A stream variant of download, which resolve with an object with a
		`readStream` property instead of a `file` property
	*/
	const streamDownload = function (file, needleOptions = {}) {

        if (!isObjValid(file)) {
            return throwFileValidationErr()
        }
        
		return when.promise(function (resolve, reject) {

			const getStream = needle.get(
				file.url,
				{
					decode_response: false,
					parse: false,
					open_timeout: 0,
					read_timeout: 0,
					...needleOptions
				}
			)
			.on('header', async function (statusCode, headers) {

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
					let expiryCheckTimeout;
					try {
						const expiryDatetime = await new Promise((expiredResolve, expiredReject) => {
							if (!_.inRange(statusCode, 400, 500)) {
								return expiredReject();
							}

							//Reject if expiry cannot be determined within 10 seconds
							expiryCheckTimeout = setTimeout(function () {
								expiredReject();
							}, 10000);

							let acc;
							function dataConsumer (chunk) {
								acc += chunk.toString();
								const expiryDatetimeResult = checkAndGetExpiry(file.url, headers, acc);
								if (expiryDatetimeResult) {
									expiredResolve(expiryDatetimeResult);
									clearTimeout(expiryCheckTimeout);
									getStream.removeListener('data', dataConsumer);
								}
							}

							getStream.on('data', dataConsumer);
							getStream.on('error', expiredReject);
							getStream.on('end', expiredReject);
						});
						//If it gets to here, checkAndGetExpiry call resolved
						reject(expiryRejectObject(expiryDatetime));
					} catch (err) {
						reject(formatDownloadRejectObject(new Error('Status code: ' + statusCode)));
					} finally {
						if (expiryCheckTimeout) {
							clearTimeout(expiryCheckTimeout);
						}
					}
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
