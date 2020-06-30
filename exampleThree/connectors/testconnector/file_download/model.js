

module.exports = function (params) {
	return new Promise(function (resolve, reject) {

		falafel.files.streamDownload(params.file)

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
