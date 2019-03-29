var fs             			 = require('fs');
var _              			 = require('lodash');
var GenerateSchema 			 = require('generate-schema');
var prettyTitle 				 = require('./prettyTitle');
var generateSchemafromJs = require('./generateSchemaFromJs');


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
			'auth',
			'branch_template',
			'help',
			'help_link'
		]);

		if (!_.isUndefined(connectorConfig.branches)) {

			var branchesErrorMessage = '`branches` must be an array of objects with `name` and `display_name`';

			if (!_.isArray(connectorConfig.branches)) {
				throw new Error(branchesErrorMessage);
			}

			connector.branches = [];

			var allValid = _.every(connectorConfig.branches, function (branch) {
				var hasProps = branch.name && branch.display_name;
				return (
					hasProps ?
					(
						connector.branches.push(_.pick(branch, [ 'name', 'display_name' ])),
						hasProps //Comma operator
					) :
					hasProps
				);
			});

			if (!allValid) {
				throw new Error(branchesErrorMessage);
			}

		}

		connector.messages = _.filter(_.map(connectorConfig.messages, function (messageConfig) {

			// Some methods don't have schemas and should be hidden
			if ( !messageConfig.schema || (messageConfig.name && messageConfig.name[0] === '#') ) {
				return;
			}

			var message = _.pick(messageConfig.schema, [
				'name',
				'title',
				'description',
				'delivery',
				'default'
			]);
			if (messageConfig.schema.helpLink) {
				message.help_link = messageConfig.schema.helpLink;
			}
			if (_.isNumber(messageConfig.schema.timeoutMillis)) {
				message.timeout_millis = messageConfig.schema.timeoutMillis;
			}

			if (messageConfig.schema.auth_scopes) {
				message.auth_scopes = messageConfig.schema.auth_scopes;
			}

			if (!message.title) {
				message.title = prettyTitle(message.name);
			}

			// Generate the input
			if (messageConfig.schema.globals === false) {
				message.input_schema = generateSchemafromJs(
					_.extend({}, messageConfig.schema.input || {})
				);
			} else {
				message.input_schema = generateSchemafromJs(
					_.extend({}, (connectorConfig.globalSchema || {}).input, messageConfig.schema.input || {})
				);
				message.auth_scopes = message.auth_scopes || (connectorConfig.globalSchema || {}).auth_scopes;
			}

			// Set up the output schema - either manually specified, or generated
			if (messageConfig.schema.output) {
				message.output_schema = generateSchemafromJs(messageConfig.schema.output);
			} else if (messageConfig.schema.responseSample) {
				message.output_schema = GenerateSchema.json(messageConfig.schema.responseSample);
			}

			// Generate the reply schema
			if (messageConfig.schema.reply) {
				message.reply_schema = generateSchemafromJs(
					_.extend({}, messageConfig.schema.reply)
				);
			}

			message['dynamic_output'] = ( messageConfig.dynamicOutput ? true : false );

			return message;

		}));

		// Sort connector messages by their title
		connector.messages = _.sortBy(connector.messages, function (message) {
			return message.title;
		});

		return connector;

	});

	if (_.isString(directory)) {
		fs.writeFileSync(directory+'/connectors.json', JSON.stringify(connectorsJson, null, '\t'));
	}

	return connectorsJson;


};
