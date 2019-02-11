/*
* Get a list of directories in a given directory
*/
var fs   = require('fs');
var path = require('path');

/* eslint-disable no-console */
module.exports = function (srcpath) {
	try {
		return fs.readdirSync(srcpath).filter(function (file) {
			try {
				return fs.statSync(path.join(srcpath, file)).isDirectory();
			} catch (statSyncError) {
				console.log('There was an error trying to statSync.');
				console.log('Source path: ' + srcpath);
				console.log('file path: ' + file);
				console.error(statSyncError);
				return false;
			}
		});
	} catch (readdirSyncError) {
		console.log('There was an error trying to readdirSync.');
		console.log('Source path: ' + srcpath);
		console.error(readdirSyncError);
		throw readdirSyncError;
	}
};
