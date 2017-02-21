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
		} catch (err) {
			
			var errorMessage = '\x1b[4mError\x1b[0m with ' + filename + ':\n';

			errorMessage += '\n';
			errorMessage += '\x1b[4mPath:\x1b[0m ' + filepath + '\n';
			if (err.name === 'SyntaxError') {
				errorMessage += '\n';
				errorMessage += '\x1b[4mStack:\x1b[0m\n    ' + (err.stack || 'n/a');
			}
			errorMessage += '\n';
			errorMessage += '\x1b[4mOther info:\x1b[0m\n    ';
			errorMessage += err;

			throw errorMessage;

		}

		return accumulator;

	}, {});

};
