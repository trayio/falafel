/*
* Get a fully list of all the connectors and the configuration
* attached to all of them. No validation at this stage, just get 
* the data out from the filesystem.
*/

var fs   = require('fs');
var path = require('path');
var _ 	 = require('lodash');


module.exports = function (directory) {

	var connectors;

	var connectorDirectories = getDirectories(directory+'/connectors');

	connectors = _.map(connectorDirectories, function (connectorDirectory) {

		var connector;

		// Require the connector file
		var result = getFiles(directory+'/connectors/'+connectorDirectory);
		if (result.indexOf('connector.js') !== -1) {
			connector = require(directory+'/connectors/'+connectorDirectory+'/connector');
		} else {
			connector = {};
		}

		// Add the messages
		var messages = getDirectories(directory+'/connectors/'+connectorDirectory);
		console.log(messages);

		connector.messages = _.map(messages, function (message) {

			var messageDir = directory+'/connectors/'+connectorDirectory+'/'+message

			var files = getFiles(messageDir);

			var output = {};

			if (files.indexOf('model.js') !== -1) {
				output.model = require(messageDir+'/model');
			}
			if (files.indexOf('response.sample.json') !== -1) {
				output.responseSample = require(messageDir+'/response.sample.json');
			}
			if (files.indexOf('schema.js') !== -1) {
				output.schema = require(messageDir+'/schema');
			}

			return output;

		});


		return connector;

	});

	return connectors;

};


function getDirectories(srcpath) {
  return fs.readdirSync(srcpath).filter(function(file) {
    return fs.statSync(path.join(srcpath, file)).isDirectory();
  });
}


function getFiles(srcpath) {
	return fs.readdirSync(srcpath).filter(function(file) {
    return !fs.statSync(path.join(srcpath, file)).isDirectory();
  });
}