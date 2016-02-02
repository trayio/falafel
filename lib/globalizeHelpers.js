var fs 					   = require('fs');
var getDirectories = require('./utils/getDirectories');
var requireindex   = require('requireindex');

module.exports = function (directory) {

	// Get directories to see if there's a helpers dir
	var directories = getDirectories(directory);

	// Add all of the helper modules files to the global helpers object
	if (directories.indexOf('helpers') !== -1) {
		GLOBAL.helpers = requireindex(directory+'/helpers');
	} else {
		GLOBAL.helpers = {};
	}


};