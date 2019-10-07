// MANUAL CONNECTORS ONLY
// Artisan helpers are NOT bound to the `falafel` global here.
var getDirectories = require('../utils/getDirectories');


module.exports = function (directory) {

	// Get directories to see if there's a helpers dir
	var directories = getDirectories(directory);

	// Add all of the helper modules files to the global helpers object
	if (directories.indexOf('helpers') !== -1) {
		falafel.helpers = require('../utils/requireAll')( directory + '/helpers' );
	} else {
		falafel.helpers = {};
	}

};
