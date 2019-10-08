const FS = require('fs'),
	Path = require('path');

module.exports = function (dir) {

	return require('lodash').reduce(FS.readdirSync(dir), function (accumulator, filename) {

		const filepath = Path.resolve(Path.join(dir, filename)),
			ext      = Path.extname(filename),
			stats    = FS.statSync(filepath);

		// Only require js files
		if (stats.isFile() && ext !== '.js' ) {
			return accumulator;
		}

		const baseName = Path.basename(filename, ext);

		//If directory, attempt to load, else ignore
		if (stats.isDirectory()) {
			try {
				accumulator[baseName] = require(filepath);
				return accumulator;
			} catch (moduleLoadError) {
				return accumulator;
			}
		}

		try {
			accumulator[baseName] = require(filepath);
		} catch (err) {

			let errorMessage = `\x1b[4mError\x1b[0m with ${filename}:\n`;

			errorMessage += '\n';
			errorMessage += `\x1b[4mPath:\x1b[0m ${filepath}\n`;
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
