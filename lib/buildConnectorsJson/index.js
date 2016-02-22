var fs             			 = require('fs');
var _              			 = require('lodash');
var GenerateSchema 			 = require('generate-schema');
var prettyTitle 				 = require('./prettyTitle');
var generateSchemafromJs = require('./generateSchemafromJs');


module.exports = function (directory, config) {

	// console.log(config);

	var connectorsJson = _.map(config || [], function (connectorConfig) {

		var connector = _.pick(connectorConfig, [
			'name', 
			'title', 
			'description', 
			'version', 
			'tags',
			'icon',
			'help_link'
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
				message.title = prettyTitle(message.name);
			}


			// Generate the input schema
			message.input_schema = generateSchemafromJs(messageConfig.schema.input || {});

			// Set up the output schema - either manually specified, or generated
			if (messageConfig.schema.output) {
				message.output_schema = generateSchemafromJs(messageConfig.schema.output);
			} else if (messageConfig.schema.responseSample) {
				message.output_schema = GenerateSchema.json(messageConfig.schema.responseSample);
			}
		
			return message;

		}));

		return connector;

	});


	fs.writeFileSync(directory+'/connectors.json', JSON.stringify(connectorsJson, null, '  '));


};
