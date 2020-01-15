const _ = require('lodash');

const rawHttpRequestModel = require('./rawHttpRequestModel');
const rawHttpRequestSchema = require('./rawHttpRequestSchema');

const RAW_HTTP_REQUEST_OP_NAME = 'raw_http_request';

function setupRawHttpRequestOperationConfig (connectorsConfig) {
	return _.map(connectorsConfig, (connectorConfig) => {
		if (_.isPlainObject(connectorConfig.rawHttpRequest)) {
			const opConfig = {

				name: RAW_HTTP_REQUEST_OP_NAME,

				model: _.merge(
					{},
					rawHttpRequestModel,
					connectorConfig.rawHttpRequest
				),

				schema: rawHttpRequestSchema

			};

			opConfig.schema.name = RAW_HTTP_REQUEST_OP_NAME;

			connectorConfig.messages.push(opConfig);
		}
		return connectorConfig;
	});
}

module.exports = setupRawHttpRequestOperationConfig;
