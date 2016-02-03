var fs             			 = require('fs');
var _              			 = require('lodash');
var GenerateSchema 			 = require('generate-schema');
var generateSchemafromJs = require('./generateSchemafromJs');


module.exports = function (directory, config) {

	console.log(config);

	var connectorsJson = _.map(config || [], function (connectorConfig) {

		var connector = _.pick(connectorConfig, [
			'name', 
			'title', 
			'description', 
			'version', 
			'icon'
		]);

		connector.messages = _.map(connectorConfig.messages, function (messageConfig) {

			var message = _.pick(messageConfig.schema, [
				'name',
				'title',
				'description',
				'help_link'
			]);	

			// Generate the input schema
			message.input_schema = generateSchemafromJs(messageConfig.schema.input);

			// Set up the output schema - either manually specified, or generated
			if (messageConfig.schema.output && messageConfig.schema.output.generate === true) {
				message.output_schema = GenerateSchema.json(messageConfig.schema.responseSample);
			}
		
			return message;

		});

		return connector;

	});


	fs.writeFileSync(directory+'/connectors.json', JSON.stringify(connectorsJson, null, '  '));


};
