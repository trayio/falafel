/*
* Get a list of files in a given directory
*/
var fs   = require('fs');
var path = require('path');

module.exports = function (srcpath) {
	return fs.readdirSync(srcpath).filter(function(file) {
    return !fs.statSync(path.join(srcpath, file)).isDirectory();
  });
};