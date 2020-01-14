const _ = require('lodash');

const rawHttpRequestModel = require('./rawHttpRequestModel');
const rawHttpRequestSchema = require('./rawHttpRequestSchema');
const processBody = require('./processBody');

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

			opConfig.name = RAW_HTTP_REQUEST_OP_NAME;

			connectorConfig.messages.push(opConfig);
		}
		return connectorsConfig;
	});
}

function setupUtils (falafel) {
	falafel.rawHttpRequestUtils = {
		processBody
	};
}

module.exports = {
	setupUtils,
	setupRawHttpRequestOperationConfig
};

// {
// 	model: {
// 		url: '/list.json',
// 		method: 'get',
// 		afterSuccess: [Function]
// 	},
// 	schema: {
// 		input: {
// 			access_token: [Object],
// 			id: [Object]
// 		},
// 		name: 'get_list',
// 		responseSample: {
// 			id: 123,
// 			name: 'Chris'
// 		}
// 	},
// 	name: 'get_list'
// }
