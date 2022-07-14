const _ = require('lodash');

const rawHttpRequestModel = require('./rawHttpRequestModel');
const rawHttpRequestSchema = require('./rawHttpRequestSchema');

const RAW_HTTP_REQUEST_OP_NAME = 'raw_http_request';

function setupRawHttpRequestOperationConfig (connectorsConfig) {
	return _.map(connectorsConfig, (connectorConfig) => {
		if (_.isPlainObject(connectorConfig.rawHttpRequest)) {

			const sanitisedModelConfig = _.pick(
				connectorConfig.rawHttpRequest,
				[
					'globals',
					'before',
					'method',
					'options',
					'url',
					'query',
					'data',
					'beforeRequest',
					'expects',
					'notExpects',
					'afterSuccess',
					'afterFailure',
					'afterHeaders'
				]
			);

			let schemaToUse = rawHttpRequestSchema;

			if (connectorConfig.rawHttpRequest.globalSchema === true) {
				schemaToUse = _.merge(
					{},
					schemaToUse,
					{
						globals: true
					}
				);
			}

			const { schemaOptions = {} } = connectorConfig.rawHttpRequest;
			if (_.isString(schemaOptions.url)) {
				const originalUrlOneOf = rawHttpRequestSchema.input.url.oneOf;
				switch (schemaOptions.url) {
					case 'endpointOnly':
						schemaToUse.input.url.oneOf = [originalUrlOneOf[0]];
						break;
					case 'fullOnly':
						schemaToUse.input.url.oneOf = [originalUrlOneOf[1]];
						break;
					case 'all':
					default:
						//No change; provide both endpoint and full
						break;
				}

				// Add the base URL to the help text for the endpoint input property
				// so that users know what the base URL actually is
				const baseUrl = _.get(connectorConfig, 'globalModel.baseUrl');
				if (baseUrl) {
					const endpointDescription = `The endpoint to call in relation to the base URL ${baseUrl}`;
					switch (schemaOptions.url) {
						case 'endpointOnly':
						case 'all':
						default:
							_.set(schemaToUse, 'input.url.oneOf[0].properties.endpoint.description', endpointDescription); 
							break;
					}
				}
			}

			const opConfig = {

				name: RAW_HTTP_REQUEST_OP_NAME,

				model: _.merge(
					{},
					rawHttpRequestModel,
					sanitisedModelConfig
				),

				schema: schemaToUse

			};

			opConfig.schema.name = RAW_HTTP_REQUEST_OP_NAME;

			connectorConfig.messages.push(opConfig);
		}
		return connectorConfig;
	});
}

module.exports = setupRawHttpRequestOperationConfig;
