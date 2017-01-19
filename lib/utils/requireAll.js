module.exports = function (dir) {

	var FS = require('fs'),
		Path = require('path');

	return require('lodash').reduce(FS.readdirSync(dir), function (accumulator, filename) {

		var filepath = Path.resolve(Path.join(dir, filename)),
			ext      = Path.extname(filename),
			stats    = FS.statSync(filepath);

		// don't require non-javascript files (.txt .md etc.)
		if (stats.isFile() && ext !== '.js' )
			return accumulator;

		accumulator[Path.basename(filename, ext)] = require(filepath);

		return accumulator;

	}, {});

};
