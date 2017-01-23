module.exports = function (dir) {

	var FS = require('fs'),
		Path = require('path');

	return require('lodash').reduce(FS.readdirSync(dir), function (accumulator, filename) {

		var filepath = Path.resolve(Path.join(dir, filename)),
			ext      = Path.extname(filename),
			stats    = FS.statSync(filepath);

		// Only require js files
		if (stats.isFile() && ext !== '.js' )
			return accumulator;

		try {
			accumulator[Path.basename(filename, ext)] = require(filepath);
		} catch (e) {
			throw new Error('Error with ' + filepath + ':\n' + err.message);
		}

		return accumulator;

	}, {});

};
