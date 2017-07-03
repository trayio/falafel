var _ 			= require('lodash');
var assert 		= require('assert');
var getGlobalModel = require('../../lib/getConnectors/getGlobalModel');


describe('#getGlobalModel', function () {

	var sampleGlobalModel;

	beforeEach(function () {
		sampleGlobalModel = {
		    "type": "object",
		    "value": {
		      "after_failure": {
		        "type": "function",
		        "value": "function () { }"
		      },
		      "after_success": {
		        "type": "function",
		        "value": "function () { }"
		      },
		      "auth": {
		        "type": "object",
		        "value": {}
		      },
		      "base_url": {
		        "type": "string",
		        "value": "https://app.asana.com/api/1.0"
		      },
		      "before": {
		        "type": "function",
		        "value": "function () { }"
		      },
		      "data": {
		        "type": "object",
		        "value": {
		        	"name": {
		        		"type": "string",
		        		"value": "Chris"
		        	}
		        }
		      },
		      "expects": {
		        "type": "string",
		        "value": "2xx"
		      },
		      "headers": {
		        "type": "array",
		        "value": [{
		        	"type": "object",
		        	"value": {
		        		"name": {
		        			"type": "string",
		        			"value": "Content-Type"
		        		},
		        		"value": {
		        			"type": "string",
		        			"value": "application/json"
		        		}
		        	}
		        }, 
		        {
		        	"type": "object",
		        	"value": {
		        		"name": {
		        			"type": "string",
		        			"value": "Content-Length"
		        		},
		        		"value": {
		        			"type": "number",
		        			"value": 252
		        		}
		        	}
		        }]
		      },
		      "not_expects": {
		        "type": "function",
		        "value": "function (input) {}"
		      },
		      "query": {
		        "type": "array",
		        "value": [{
		        	"type": "object",
		        	"value": {
		        		"key": {
		        			"type": "string",
		        			"value": "per_page"
		        		},
		        		"value": {
		        			"type": "string",
		        			"value": "100"
		        		}
		        	}
		        }, 
		        {
		        	"type": "object",
		        	"value": {
		        		"key": {
		        			"type": "string",
		        			"value": "page"
		        		},
		        		"value": {
		        			"type": "string",
		        			"value": "1"
		        		}
		        	}
		        }]
		      }
		    }
		};

		// console.log(sampleGlobalModel)
	});


	it('should bind base URL', function () {
		var globalModel = getGlobalModel({ model: sampleGlobalModel });

		assert.strictEqual(globalModel.baseUrl, 'https://app.asana.com/api/1.0');

		sampleGlobalModel.value.base_url = {
			type: 'function',
			value: 'function (input) { return \'https://app.asana.com/api/1.0\'; }',
		}
		var globalModel = getGlobalModel({ model: sampleGlobalModel });
		assert(_.isFunction(globalModel.baseUrl));
	});


	it('should bind expects and not expects', function () {
		var globalModel = getGlobalModel({ model: sampleGlobalModel });
		assert.strictEqual(globalModel.expects, '2xx');
		assert(_.isFunction(globalModel.notExpects));
	});


	it('should bind the lifecycle methods', function () {
		var globalModel = getGlobalModel({ model: sampleGlobalModel });

		assert(_.isFunction(globalModel.before));
		assert(_.isFunction(globalModel.afterSuccess));
		assert(_.isFunction(globalModel.afterFailure));
	});


	it('should bind the query', function () {
		var globalModel = getGlobalModel({ model: sampleGlobalModel });
		assert.deepEqual(globalModel.query, { 
			per_page: '100', 
			page: '1' 
		});
	});


	it('should bind the headers', function () {
		var globalModel = getGlobalModel({ model: sampleGlobalModel });
		assert.deepEqual(globalModel.options.headers, { 
			'Content-Type': 'application/json', 
			'Content-Length': 252
		});
	});


	it('should bind the data', function () {
		var globalModel = getGlobalModel({ model: sampleGlobalModel });
		assert.deepEqual(globalModel.data, { 
			name: 'Chris'
		});
	});


	it('should bind oauth correctly', function () {
		sampleGlobalModel.value.auth.value = {
			type: {
				type: 'string',
				value: 'oauth2'
			},
			headers: {
				"type": "array",
		        "value": [{
		        	"type": "object",
		        	"value": {
		        		"name": {
		        			"type": "string",
		        			"value": "Authorization"
		        		},
		        		"value": {
		        			"type": "string",
		        			"value": "Bearer {{{access_token}}}"
		        		}
		        	}
		        }]
			}
		};

		var globalModel = getGlobalModel({ model: sampleGlobalModel });
		assert.deepEqual(globalModel.options.headers.Authorization, 'Bearer {{{access_token}}}');


		// TODO oauth refresh handling???
	});


	it('should bind basic auth correctly', function () {
		sampleGlobalModel.value.auth.value = {
			type: {
				type: 'string',
				value: 'basic'
			},
			username: {
				type: 'string',
				value: 'admin'
			},
			password: {
				type: 'string',
				value: 'supersecure'
			}
		};

		var globalModel = getGlobalModel({ model: sampleGlobalModel });

		assert.deepEqual(globalModel.options.username, 'admin');
		assert.deepEqual(globalModel.options.password, 'supersecure');
	});


	it('should bind auth query params correctly', function () {
		sampleGlobalModel.value.auth.value = {
			type: {
				type: 'string',
				value: 'query'
			},
			query: {
				type: 'array',
				value: [{
		        	"type": "object",
		        	"value": {
		        		"key": {
		        			"type": "string",
		        			"value": "api_key"
		        		},
		        		"value": {
		        			"type": "string",
		        			"value": "123abc"
		        		}
		        	}
		        }]
		    }
		};

		var globalModel = getGlobalModel({ model: sampleGlobalModel });

		assert.deepEqual(globalModel.query.api_key, '123abc');
	});


	it('should bind auth headers correctly', function () {
		sampleGlobalModel.value.auth.value = {
			type: {
				type: 'string',
				value: 'query'
			},
			headers: {
				type: 'array',
				value: [{
		        	"type": "object",
		        	"value": {
		        		"name": {
		        			"type": "string",
		        			"value": "X-PW-AccessKey"
		        		},
		        		"value": {
		        			"type": "string",
		        			"value": "123abc"
		        		}
		        	}
		        }]
		    }
		};

		var globalModel = getGlobalModel({ model: sampleGlobalModel });
		assert.deepEqual(globalModel.options.headers['X-PW-AccessKey'], '123abc');
	});


});
