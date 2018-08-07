var fs     = require('fs');
var util   = require('util');

var when   = require('when');
var guid   = require('mout/random/guid');
var mime   = require('mime');

var needle = require('needle');
var knox   = require('knox');


module.exports = function (options) {


	//TODO: look for AWS config in env variables

	/*
		Upload a file to S3.
	*/
	var upload = function (params) {
		return when.promise(function (resolve, reject) {

			if (!_.isObject(options.aws)) {
				return reject(new Error('AWS config not specified. Add a aws.json file in the connector folder, and pass it to falafel.'));
			}

			var client = knox.createClient({
				key: options.aws.key,
				secret: options.aws.secret,
				bucket: 'workflow-file-uploads',
				region: 'us-west-2'
			});


			// Generate a random file name
			var fileName = guid();

			// TODO: should we pass the content-type to S3?
			var mimeType = params.contentType || mime.lookup(params.name);
			var headers = {
				'Content-Type': mimeType,
			};

			// NEW
			if (params.file) {

				var req = client.put(fileName, {
					'Content-Length': params.length
					, 'Content-Type': mimeType,
				});

				fs.createReadStream(params.file).pipe(req);

				req.on('response', function(res){
					if (res.statusCode !== 200) {
						reject(new Error(res.statusCode));
					} else {
						var twentyFourHours = new Date(Date.now() + 24 * 60 * 60000);
						var signedUrl = client.signedUrl(fileName, twentyFourHours);

						// Resolve with an object following the "file" schema
						resolve({
							name: params.name,
							url: signedUrl,
							mime_type: mimeType,
							expires: Math.round(twentyFourHours.getTime() / 1000)
						});
					}
				});

				req.on('error', reject);

			}

			// OLD
			else {

				var buffer;
				if (!util.isBuffer(params.contents)) {
					return when.reject(new Error('Please pass the `contents` as a Node.js Buffer.'));
				} else {
					buffer = params.contents;
				}

				// Stick the buffer in S3
				client.putBuffer(buffer, fileName, headers, function (err, res) {
					if (err) {
						reject(err);
					} else if (res.statusCode !== 200) {
						reject(new Error(res.statusCode));
					} else {
						var twentyFourHours = new Date(Date.now() + 24 * 60 * 60000);
						var signedUrl = client.signedUrl(fileName, twentyFourHours);

						// Resolve with an object following the "file" schema
						resolve({
							name: params.name,
							url: signedUrl,
							mime_type: mimeType,
							expires: Math.round(twentyFourHours.getTime() / 1000)
						});
					}
				});

			}

		});
	};


	/*
		A stream variant of upload, requiring a `readStream` property
		instead of a `file` property
	*/
	var streamUpload = function (params) {
		return when.promise(function (resolve, reject) {

			if (!_.isObject(options.aws)) {
				return reject(new Error('AWS config not specified. Add a aws.json file in the connector folder, and pass it to falafel.'));
			}

			if (_.isUndefined(params.readStream) || _.isUndefined(params.readStream.pipe)) {
				return reject(new Error('The object passed in must contain the property \'readStream\', referecing a read stream.'));
			}

			var client = knox.createClient({
				key: options.aws.key,
				secret: options.aws.secret,
				bucket: 'workflow-file-uploads',
				region: 'us-west-2'
			});


			// Generate a random file name
			var fileName = guid();

			var mimeType = params.contentType || mime.lookup(params.name);

			var req = client.put(fileName, {
				'Content-Length': params.length,
				'Content-Type': mimeType,
			});

			params.readStream.pipe(req);

			req.on('response', function(res){
				if (res.statusCode !== 200) {
					reject(new Error(res.statusCode));
				} else {
					var twentyFourHours = new Date(Date.now() + 24 * 60 * 60000);
					var signedUrl = client.signedUrl(fileName, twentyFourHours);

					// Resolve with an object following the "file" schema
					resolve({
						name: params.name,
						url: signedUrl,
						mime_type: mimeType,
						expires: Math.round(twentyFourHours.getTime() / 1000)
					});
				}
			});

			req.on('error', reject);

		});
	};

	/*
		A multi-part variant of streamUpload; should only be used if there is
		absolutely now way of uploading with the content-length header set.
	*/
	var streamMPUpload = function (params) {
		return when.promise(function (resolve, reject) {

			if (options.dev) {
				// eslint-disable-next-line no-console
				console.warn('Dev warning - avoid using streamMPUpload if possible.');
			}

			try { //Check if the lib has been included
				require.resolve('knox-mpu-alt');
			} catch (e) {
				throw new Error('Please install `knox-mpu-alt` library and save it as a dependency to use streamMPUpload.');
			}

			var knoxMPU = require('knox-mpu-alt');

			if (!_.isObject(options.aws)) {
				return reject(new Error('AWS config not specified. Add a aws.json file in the connector folder, and pass it to falafel.'));
			}

			if (_.isUndefined(params.readStream) || _.isUndefined(params.readStream.pipe)) {
				return reject(new Error('The object passed in must contain the property \'readStream\', referecing a read stream.'));
			}

			//Instantiate knox client
			var client = knox.createClient({
				key: options.aws.key,
				secret: options.aws.secret,
				bucket: 'workflow-file-uploads',
				region: 'us-west-2'
			});


			// Generate a random file name and get mimeType
			var fileName = guid(),
				mimeType = params.contentType || mime.lookup(params.name);

			//Instantiate knoxMPU instance with the knox client, stream, and metaData
			new knoxMPU(
				{
					client: client,
					objectName: fileName,
					stream: params.readStream,
					headers: {
						'Content-Type': mimeType,
					}
				},
				function(mpuUploadErr) {

					if (mpuUploadErr) {
						return reject(mpuUploadErr);
					}

					var twentyFourHours = new Date(Date.now() + 24 * 60 * 60000);
					var signedUrl = client.signedUrl(fileName, twentyFourHours);

					// Resolve with an object following the tray "file" schema
					resolve({
						name: params.name,
						url: signedUrl,
						mime_type: mimeType,
						expires: Math.round(twentyFourHours.getTime() / 1000)
					});

				}
			);

		});
	};



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
					reject(err);
				} else if (res.statusCode !== 200) {
					reject(new Error(res.statusCode));
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
					reject(new Error(statusCode));
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
			.on('err', function (err) {
				reject(err);
			});

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
