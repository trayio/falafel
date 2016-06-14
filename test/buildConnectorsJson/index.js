var _ 				 = require('lodash');
var assert 		 = require('assert');
var proxyquire = require('proxyquire');


describe('#buildConnectorsJson', function () {

	var filePath = '../../lib/buildConnectorsJson';


	var buildConnectorsJson, output, parsed;
	beforeEach(function () {
		buildConnectorsJson = proxyquire(filePath, {
			fs: {
				writeFileSync: function (path, contents) {
					output = contents;
					parsed = JSON.parse(output);
				}
			}
		});
	});

	it('should pick the top level connectors keys', function () {
		buildConnectorsJson('mydir', [{
			name: 'mailchimp',
			title: 'MailChimp',
			icon: {
				value: 'http://myicon.com/icon.png',
				type: 'url'
			},
			version: '2.0',
			description: 'This is a great connector',
			customkey: 'This won\'t get added'
		}]);

		assert.strictEqual(JSON.stringify([
		  {
		    "name": "mailchimp",
		    "title": "MailChimp",
		    "description": "This is a great connector",
		    "version": "2.0",
		    "icon": {
		      "value": "http://myicon.com/icon.png",
		      "type": "url"
		    },
		    "messages": []
		  }
		], null, '  '), output);
	});

	it('should not add messages without schemas', function () {
		buildConnectorsJson('meh', [{
			name: 'mailchimp',
			messages: [{
				name: 'my_message',
				model: {
					url: '..'
				}
			}]
		}]);

		assert.equal(parsed[0].messages.length, 0);
	});

	it('should add messages with schemas', function () {
		buildConnectorsJson('meh', [{
			name: 'mailchimp',
			messages: [{
				name: 'my_message',
				schema: {
					input: {
						name: {
							type: 'string'
						}
					}
				},
				model: {
					url: '..'
				}
			}]
		}]);

		assert.equal(parsed[0].messages.length, 1);
	});

	it('should autogenerate message titles nicely if not already declared', function () {
		buildConnectorsJson('meh', [{
			name: 'mailchimp',
			messages: [{
				schema: {
					name: 'my_message',
					input: {
						name: {
							type: 'string'
						}
					}
				},
				model: {
					url: '..'
				}
			}, {
				schema: {
					name: 'my_second_message',
					title: 'My amazing second message'
				},
				model: {}
			}]
		}]);

		assert.equal(parsed[0].messages.length, 2);
		assert.equal(parsed[0].messages[0].title, 'My message');
		assert.equal(parsed[0].messages[1].title, 'My amazing second message');
	});

	it('should create from specified output schema if specified', function () {
		buildConnectorsJson('meh', [{
			name: 'mailchimp',
			messages: [{
				schema: {
					name: 'my_message',
					input: {
						name: {
							type: 'string'
						}
					},
					output: {
						result: {
							type: 'integer'
						}
					}
				},
				model: {
					url: '..'
				}
			}]
		}]);

		assert(_.isObject(parsed[0].messages[0].output_schema));
		assert.equal(parsed[0].messages[0].output_schema.properties.result.type, 'integer');
	});

	it('should generate from sample response if specified', function () {
		buildConnectorsJson('meh', [{
			name: 'mailchimp',
			messages: [{
				schema: {
					name: 'my_message',
					input: {
						name: {
							type: 'string'
						}
					},
					responseSample: {
						result: true
					}
				},
				model: {
					url: '..'
				}
			}]
		}]);

		assert(_.isObject(parsed[0].messages[0].output_schema));
		assert.equal(parsed[0].messages[0].output_schema.properties.result.type, 'boolean');
	});

	it('should add global schema input if declared', function () {
		buildConnectorsJson('meh', [{
			name: 'mailchimp',
			globalSchema: {
				input: {
					api_key: {
						type: 'string',
						required: true,
						advanced: true
					}
				}
			},
			messages: [{
				name: 'my_message',
				schema: {
					input: {
						name: {
							type: 'string'
						}
					}
				},
				model: {
					url: '..'
				}
			}]
		}]);

		assert.equal(_.keys(parsed[0].messages[0].input_schema.properties).length, 2);
		assert.equal(parsed[0].messages[0].input_schema.properties.api_key.type, 'string');
		assert.equal(parsed[0].messages[0].input_schema.properties.name.type, 'string');
		assert.equal(parsed[0].messages.length, 1);
	});

	it.skip('should add global auth scopes if not declared on a local level', function () {

	});

});
