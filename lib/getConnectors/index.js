/*
* LEGACY CONNECTORS ONLY
*
* Get a fully list of all the connectors and the configuration
* attached to all of them. No validation at this stage, just get
* the data out from the filesystem.
*/
var _ = require('lodash');
var fs = require('fs');
var getFiles = require('../utils/getFiles');
var getDirectories = require('../utils/getDirectories');


module.exports = function (directory) {

	var connectors;

	// Get all the directories within the `connectors` folder. Usually
	// one, except when there's also a trigger connector.
	var connectorDirectories = getDirectories(directory+'/connectors');


	connectors = _.map(connectorDirectories, function (connectorDirectory) {

		var connector,
			fullConnectorPath = directory + '/connectors/' + connectorDirectory;

		// Require the connector file
		try {

			var result = getFiles(fullConnectorPath);
			connector = (
				result.indexOf('connector.js') !== -1 ?
					require(fullConnectorPath + '/connector') :
					{}
			);

		} catch (err) {
			throw new Error('Error with ' + connectorDirectory + '/connector.js' + ':\n' + err.message);
		}

		// default to directory name
		connector.name = connector.name || connectorDirectory;


		function requireFile (path, errorMessageFile) {

			try {
				return require(path);

			} catch (err) {

				var pathArray = path.split('/'),
					errorMessage = '\x1b[4mError\x1b[0m with ' + connector.name + ' - ' + errorMessageFile.replace('/', '') + ':\n';

				errorMessage += '\n';
				errorMessage += '\x1b[4mPath:\x1b[0m ' + (pathArray[pathArray.length - 1] = errorMessageFile.replace('/', ''), pathArray.join('/')) + '\n';
				if (err.name === 'SyntaxError') {
					errorMessage += '\n';
					errorMessage += '\x1b[4mStack:\x1b[0m\n    ' + (err.stack || 'n/a');
				}
				errorMessage += '\n';
				errorMessage += '\x1b[4mOther info:\x1b[0m\n    ';
				errorMessage += err;

				throw errorMessage;

			}

		}

		// Add the global model file
		if (result.indexOf('global_model.js') !== -1) connector.globalModel = requireFile(fullConnectorPath + '/global_model', '/global_model.js');
		else if (result.indexOf('global.js') !== -1) connector.globalModel = requireFile(fullConnectorPath + '/global', '/global_model.js');			// deprecated file name
		else connector.globalModel = {};

		// Add the global schema file
		connector.globalSchema = (
			result.indexOf('global_schema.js') !== -1 ?
				requireFile(fullConnectorPath + '/global_schema', '/global_schema.js' ) :
				{}
		);

		// Add the help file (if declared)
		if (result.indexOf('help.md') !== -1)
			connector.help = fs.readFileSync(fullConnectorPath + '/help.md').toString();

		// Add the messages
		connector.messages = _.map(
			getDirectories(fullConnectorPath),
			function (message) {

				var messageDir = fullConnectorPath + '/' + message;

				var files = getFiles(messageDir);

				var output = {};

				_.forEach(
					[
						'model', 	// Add the model
						'destroy',	// Add the destroy model
						'request',	// Add the request (trigger) handler
						'response'	// Add the response (trigger response from workflow) handler. Nothing to do with the response.sample.json
					],
					function (key) {
						if (files.indexOf( key + '.js' ) !== -1)
							output[key] = requireFile(messageDir + '/' + key, key + '.js');
					}
				);

				// Add the schema
				if (files.indexOf('schema.js') !== -1) {
					output.schema = requireFile(messageDir + '/schema', '/schema.js');
					output.schema.name = output.schema.name || message;
					if (files.indexOf('response.sample.json') !== -1)
						output.schema.responseSample = requireFile(messageDir + '/response.sample.json', '/response.sample.json');
				}

				if (files.indexOf('output.js') !== -1) {
					output['dynamicOutput'] = requireFile(messageDir + '/output', 'output.js');
				}

				// Set the name on the top level
				output.name = _.get(output, 'schema.name', message);

				return output;

			}
		);

		return connector;

	});

	return connectors;

};
