const assert = require('assert');

const _ = require('lodash');

const setupRawHttpRequestOperationConfig = require('../../lib/rawHttpRequest/index.js');

describe('setupRawHttpRequestOperationConfig', () => {

	it('should be a function', () => {
		assert(_.isFunction(setupRawHttpRequestOperationConfig));
	});

    it('should add the base url of the connector to the endpoint input', () => {

        const baseUrl = 'dummy.restapiexample.com/api/v1/employees';

        const connectorsConfig = [
                {
                        "title": "Test Raw Op",
                        "description": "Test",
                        "version": "1.0",
                        "tags": [
                                "service"
                        ],
                        "icon": {
                                "type": "streamline",
                                "value": "globe-2"
                        },
                        "name": "testraw",
                        "globalModel": {
                                "baseUrl": baseUrl
                        },
                        "globalSchema": {},
                        "messages": [
                                {
                                        "model": {
                                                "method": "{{method}}",
                                                "url": "{{url}}"
                                        },
                                        "schema": {
                                                "title": "Test operation",
                                                "globals": false,
                                                "input": {
                                                        "method": {
                                                                "type": "string",
                                                                "required": true
                                                        },
                                                        "url": {
                                                                "type": "string",
                                                                "required": true
                                                        }
                                                },
                                                "name": "test_op"
                                        },
                                        "name": "test_op"
                                }
                        ],
                        "rawHttpRequest": {
                                "schemaOptions": {
                                        "url": "all"
                                }
                        }
                }
        ];

        const returnedConfig = setupRawHttpRequestOperationConfig(connectorsConfig);
        const rawOperation = _.find(returnedConfig[0].messages, m => 'raw_http_request' === m.name);

        assert(_.isObject(rawOperation));
        assert(_.get(rawOperation, 'schema.input.url.oneOf[0].properties.endpoint.description') === `The endpoint to call in relation to the base URL ${baseUrl}`)


    });


    it('should obfuscate #auth parameters in the base url', () => {

        const baseUrl = '{{#auth.region}}.restapiexample.com/api/v1/employees';

        const connectorsConfig = [
                {
                        "title": "Test Raw Op",
                        "description": "Test",
                        "version": "1.0",
                        "tags": [
                                "service"
                        ],
                        "icon": {
                                "type": "streamline",
                                "value": "globe-2"
                        },
                        "name": "testraw",
                        "globalModel": {
                                "baseUrl": baseUrl
                        },
                        "globalSchema": {},
                        "messages": [
                                {
                                        "model": {
                                                "method": "{{method}}",
                                                "url": "{{url}}"
                                        },
                                        "schema": {
                                                "title": "Test operation",
                                                "globals": false,
                                                "input": {
                                                        "method": {
                                                                "type": "string",
                                                                "required": true
                                                        },
                                                        "url": {
                                                                "type": "string",
                                                                "required": true
                                                        }
                                                },
                                                "name": "test_op"
                                        },
                                        "name": "test_op"
                                }
                        ],
                        "rawHttpRequest": {
                                "schemaOptions": {
                                        "url": "all"
                                }
                        }
                }
        ];

        const returnedConfig = setupRawHttpRequestOperationConfig(connectorsConfig);
        const rawOperation = _.find(returnedConfig[0].messages, m => 'raw_http_request' === m.name);

        assert(_.isObject(rawOperation));
        assert(_.get(rawOperation, 'schema.input.url.oneOf[0].properties.endpoint.description') === `The endpoint to call in relation to the base URL ${'{{region}}.restapiexample.com/api/v1/employees'}`)


    });    

});