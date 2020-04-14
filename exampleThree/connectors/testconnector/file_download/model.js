

module.exports = function () {
	return new Promise(function (resolve, reject) {

		falafel.files.streamDownload({
			name: 'sample.csv',
			url: 'https://workflow-file-uploads-dev.s3.us-west-2.amazonaws.com/7474f0e7-e1f6-4b6c-bc04-69158cfa9e8b?AWSAccessKeyId=AKIAWLUGWV6AIDDMP4BN&Expires=1586851998&Signature=IqXkpeDZVRdUvf8numfu0cU9k5k%3D',
			mime_type: 'text/csv',
			expires: 1586851998
		})

		.then((downloadObject) => {

			let acc = '';
			downloadObject.readStream

			.on('data', (chunk) => {
				acc += chunk.toString();
			})

			.on('end', (chunk) => {
				if (chunk) {
					acc += chunk.toString();
				}
				resolve(acc);
			})

			.on('error', reject);

		})

		.catch(reject);

	});
};
