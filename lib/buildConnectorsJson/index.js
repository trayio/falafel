const fs = require('fs');

const _ = require('lodash');
const GenerateSchema = require('generate-schema');
const generateSchemafromJs = require('./generateSchemaFromJs');

const prettyTitle = require('./prettyTitle');

module.exports = function (directory, config) {

	// console.log(config);

	const connectorsJson = _.map(config || [], function (connectorConfig) {

		const connector = _.pick(connectorConfig, [
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

		//If `branches` provided, validate and add
		if (!_.isUndefined(connectorConfig.branches)) {

			const branchesErrorMessage = '`branches` must be an array of objects with `name` and `display_name`';

			if (!_.isArray(connectorConfig.branches)) {
				throw new Error(branchesErrorMessage);
			}

			connector.branches = [];

			const allValid = _.every(connectorConfig.branches, function (branch) {
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

		connector.messages = _.filter(_.map(connectorConfig.messages, (operationConfig) => {

			let operationType = 'public';

			if (operationConfig.name && _.endsWith(operationConfig.name, '_ddl')) {
				operationType = 'ddl';
				if (!operationConfig.schema) {
					operationConfig.schema = {
						title: prettyTitle(operationConfig.name)
					};
				}
			}

			// Some methods don't have schemas and should be hidden
			if (!operationConfig.schema) {
				return;
			}

			//Hash operations should never be public
			if (operationConfig.name && operationConfig.name[0] === '#') {
				return;
			}

			const operationJson = _.pick(operationConfig.schema, [
				'name',
				'title',
				'description',
				'delivery',
				'default'
			]);

			operationJson.type = operationType;

			if (operationConfig.schema.helpLink) {
				operationJson.help_link = operationConfig.schema.helpLink;
			}
			if (_.isNumber(operationConfig.schema.timeoutMillis)) {
				operationJson.timeout_millis = operationConfig.schema.timeoutMillis;
			}

			if (operationConfig.schema.auth_scopes) {
				operationJson.auth_scopes = operationConfig.schema.auth_scopes;
			}

			if (!operationJson.title) {
				operationJson.title = prettyTitle(operationJson.name);
			}

			// Generate the input
			if (operationConfig.schema.globals === false) {
				operationJson.input_schema = generateSchemafromJs(_.extend({}, operationConfig.schema.input || {}));
			} else {
				operationJson.input_schema = generateSchemafromJs(_.extend({}, (connectorConfig.globalSchema || {}).input, operationConfig.schema.input || {}));
				operationJson.auth_scopes = operationJson.auth_scopes || (connectorConfig.globalSchema || {}).auth_scopes;
			}

			// Set up the output schema - either manually specified, or generated
			if (operationConfig.schema.output) {
				operationJson.output_schema = generateSchemafromJs(operationConfig.schema.output);
			} else if (operationConfig.schema.responseSample) {
				operationJson.output_schema = GenerateSchema.json(operationConfig.schema.responseSample);
			}

			// Generate the reply schema
			if (operationConfig.schema.reply) {
				operationJson.reply_schema = generateSchemafromJs(_.extend({}, operationConfig.schema.reply));
			}

			operationJson['dynamic_output'] = ( operationConfig.dynamicOutput ? true : false );

			return operationJson;

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

	//Stringify then parse, such that only a JSON compliant object is returned
	return JSON.parse(JSON.stringify(connectorsJson));


};
