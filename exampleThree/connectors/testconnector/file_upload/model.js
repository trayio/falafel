const fs = require('fs');

module.exports = function (params) {
	return new Promise(function (resolve, reject) {
		switch (params.task) {
			case 'upload':
				const filePath = `${__dirname}/../../../helpers/galaxy.tif`;
				falafel.files.upload({
					file: filePath,
					name: 'galaxy.tif',
					length: fs.statSync(filePath).size
				})
				.done(resolve, reject);
				break;
			case 'streamUpload':
				falafel.files.streamUpload({
					readStream: falafel.helpers.getGalaxyReadStream(),
					name: 'galaxy.tif',
					length: fs.fstatSync(filePath).size
				})
				.done(resolve, reject);
				break;
			case 'csv':
				falafel.files.streamMPUpload({
					readStream: falafel.helpers.getSampleCSVReadStream(),
					name: 'sample.csv'
				})
				.done(resolve, reject);
				break;
			default:
				falafel.files.streamMPUpload({
					readStream: falafel.helpers.getGalaxyReadStream(),
					name: 'galaxy.tif'
				})
				.done(resolve, reject);
		}
	});
};
