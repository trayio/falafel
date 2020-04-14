

module.exports = function () {
	return new Promise(function (resolve, reject) {

		// falafel.files.streamMPUpload({
		// 	readStream: falafel.helpers.getGalaxyReadStream(),
		// 	name: 'galaxy.tif'
		// })
		falafel.files.streamMPUpload({
			readStream: falafel.helpers.getSampleCSVReadStream(),
			name: 'sample.csv'
		})

		.done(resolve, reject);

	});
};
