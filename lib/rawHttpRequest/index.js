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
