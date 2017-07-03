var _ 			= require('lodash');
var assert 		= require('assert');
var getModel = require('../../lib/getConnectors/getModel');


describe('#getModel', function () {

	var sampleModel;

	beforeEach(function () {
		sampleModel = {
		    "type": "object",
		    "value": {
		      "afterFailure": {
		        "type": "function",
		        "value": "function () { }"
		      },
		      "afterSuccess": {
		        "type": "function",
		        "value": "function () { }"
		      },
		      "auth": {
		        "type": "object",
		        "value": {}
		      },
		      "url": {
		        "type": "string",
		        "value": "/tasks"
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
		      "notExpects": {
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

		// console.log(sampleModel)
	});


	it('should bind URL', function () {
		var model = getModel({ model: sampleModel });

		assert.strictEqual(model.url, '/tasks');

		sampleModel.value.url = {
			type: 'function',
			value: 'function (input) { return \'/tasks\'; }',
		}
		var model = getModel({ model: sampleModel });
		assert(_.isFunction(model.url));
	});


	it('should bind expects and not expects', function () {
		var model = getModel({ model: sampleModel });
		assert.strictEqual(model.expects, '2xx');
		assert(_.isFunction(model.notExpects));
	});


	it('should bind the lifecycle methods', function () {
		var model = getModel({ model: sampleModel });

		assert(_.isFunction(model.before));
		assert(_.isFunction(model.afterSuccess));
		assert(_.isFunction(model.afterFailure));
	});


	it('should bind the query', function () {
		var model = getModel({ model: sampleModel });
		assert.deepEqual(model.query, { 
			per_page: '100', 
			page: '1' 
		});
	});


	it('should bind the headers', function () {
		var model = getModel({ model: sampleModel });
		assert.deepEqual(model.options.headers, { 
			'Content-Type': 'application/json', 
			'Content-Length': 252
		});
	});


	it('should bind the data', function () {
		var model = getModel({ model: sampleModel });
		assert.deepEqual(model.data, { 
			name: 'Chris'
		});
	});



});
