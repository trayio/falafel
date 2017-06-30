/*
* Given a directory, checks to see if a connector is a legacy 
* connector or not. This is done based on the presence of a 
* newer "config.json" file.
*/
var fs = require('fs');

module.exports = function (directory) {
	return fs.existsSync(directory+'/config.json') ? false : true;
};