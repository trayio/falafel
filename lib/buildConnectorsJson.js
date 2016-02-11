var fs             			 = require('fs');
var _              			 = require('lodash');
var GenerateSchema 			 = require('generate-schema');
var sentenceCase 				 = require('mout/string/sentenceCase');
var uncamelCase  				 = require('mout/string/uncamelCase');
var generateSchemafromJs = require('./generateSchemafromJs');


module.exports = function (directory, config) {

	// console.log(config);

	var connectorsJson = _.map(config || [], function (connectorConfig) {

		var connector = _.pick(connectorConfig, [
			'name', 
			'title', 
			'description', 
			'version', 
			'icon'
		]);

		connector.messages = _.filter(_.map(connectorConfig.messages, function (messageConfig) {

			// Some methods don't have schemas and should be hidden
			if (!messageConfig.schema) {
				return;
			}

			var message = _.pick(messageConfig.schema, [
				'name',
				'title',
				'description',
				'help_link'
			]);	

			if (!message.title) {
				message.title = sentenceCase(uncamelCase(message.name).replace(/_|-/g, ' '));
			}


			// Generate the input schema
			message.input_schema = generateSchemafromJs(messageConfig.schema.input || {});

			// Set up the output schema - either manually specified, or generated
			if (messageConfig.schema.output && messageConfig.schema.output.generate === true) {
				message.output_schema = GenerateSchema.json(messageConfig.schema.responseSample);
			}
		
			return message;

		}));

		return connector;

	});


	fs.writeFileSync(directory+'/connectors.json', JSON.stringify(connectorsJson, null, '  '));


};
