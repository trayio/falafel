

module.exports = function () {
	return when.promise(function (resolve, reject) {

		falafel.files.streamMPUpload({
			readStream: falafel.helpers.getGalaxyReadStream(),
			name: 'galaxy.tif'
		})

		.done(resolve, reject);

	});
};
