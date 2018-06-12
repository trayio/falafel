var knox   = require('knox');
var when   = require('when');
var guid   = require('mout/random/guid');
var util   = require('util');
var needle = require('needle');
var fs     = require('fs');
var mime   = require('mime');


module.exports = function (options) {

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
				// console.log('streamDownload headers', headers);
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
		download: download,
		streamDownload: streamDownload
	};

};
