var _ = require('lodash');
var assert = require('assert');
var proxyquire = require('proxyquire');

var output,
	parsed;

var buildConnectorsJson = proxyquire(
	'../../lib/buildConnectorsJson',
	{
		fs: {
			writeFileSync: function (path, contents) {
				output = contents;
				parsed = JSON.parse(output);
			}
		}
	}
);

function stringifyOutput (expectedJSON) {
	return JSON.stringify(expectedJSON, null, '\t');
}

describe.only('#buildConnectorsJson', function () {


	it.only('should pick the top level connectors keys', function () {

		var inputConfig = {
			name: 'mailchimp',
			title: 'MailChimp',
			icon: {
				value: 'http://myicon.com/icon.png',
				type: 'url'
			},
			version: '2.0',
			description: 'This is a great connector',
			customkey: 'This won\'t get added',
			auth: false
		};

		var outputJsonSchema = buildConnectorsJson('mydir', [inputConfig], false);

		assert.deepEqual(
			_.merge(
				{
					icon: _.pick(inputConfig.icon, [ 'value', 'type' ]),
					messages: []
				},
				_.pick(
					inputConfig,
					[
						'name',
						'title',
						'description',
						'version',
						'auth'
					]
				)
			),
			(JSON.parse(outputJsonSchema))[0]
		);
		// assert.deepEqual(
		// 	stringifyOutput([
		// 		{
		// 			'name': inputConfig.name,
		// 			'title': inputConfig.title,
		// 			'description': inputConfig.description,
		// 			'version': inputConfig.version,
		// 			'icon': {
		// 				'value': inputConfig.icon.value,
		// 				'type': inputConfig.icon.type
		// 			},
		// 			'auth': inputConfig.auth,
		// 			'messages': []
		// 		}
		// 	]),
		// 	outputJsonSchema
		// );

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
		}], true);

		assert.equal(parsed[0].messages.length, 0);
	});

	it('should not add messages which start with \'#\' in their name', function () {
		buildConnectorsJson('meh', [{
			name: 'mailchimp',
			messages: [{
				name: '#my_message',
				model: {
					url: '..'
				},
				schema: {
					input: {
						name: {
							type: 'string'
						}
					}
				}
			}]
		}], true);

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
		}], true);

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
					},
					delivery: 'acknowledge'
				},
				model: {
					url: '..'
				}
			}, {
				schema: {
					name: 'my_second_message',
					title: 'My amazing second message',
					delivery: 'request_response',
				},
				model: {}
			}]
		}], true);

		assert.equal(parsed[0].messages.length, 2);
		// remember - operations are sorted by title
		assert.equal(parsed[0].messages[1].title, 'My message');
		assert.equal(parsed[0].messages[1].delivery, 'acknowledge');
		assert.equal(parsed[0].messages[0].title, 'My amazing second message');
		assert.equal(parsed[0].messages[0].delivery, 'request_response');
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
		}], true);

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
		}], true);

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
		}], true);

		assert.equal(_.keys(parsed[0].messages[0].input_schema.properties).length, 2);
		assert.equal(parsed[0].messages[0].input_schema.properties.api_key.type, 'string');
		assert.equal(parsed[0].messages[0].input_schema.properties.name.type, 'string');
		assert.equal(parsed[0].messages.length, 1);
	});

	it.skip('should add global auth scopes if not declared on a local level', function () {

	});

});

// describe('#buildConnectorsJson', function () {
//
// 	var filePath = '../../lib/buildConnectorsJson';
//
//
// 	var buildConnectorsJson, output, parsed;
// 	beforeEach(function () {
// 		buildConnectorsJson = proxyquire(filePath, {
// 			fs: {
// 				writeFileSync: function (path, contents) {
// 					output = contents;
// 					parsed = JSON.parse(output);
// 				}
// 			}
// 		});
// 	});
//
// 	it('should pick the top level connectors keys', function () {
// 		buildConnectorsJson('mydir', [
// 			{
// 				name: 'mailchimp',
// 				title: 'MailChimp',
// 				icon: {
// 					value: 'http://myicon.com/icon.png',
// 					type: 'url'
// 				},
// 				version: '2.0',
// 				description: 'This is a great connector',
// 				customkey: 'This won\'t get added',
// 				auth: false
// 			}
// 		], true);
//
// 		assert.strictEqual(JSON.stringify([
// 			{
// 				'name': 'mailchimp',
// 				'title': 'MailChimp',
// 				'description': 'This is a great connector',
// 				'version': '2.0',
// 				'icon': {
// 					'value': 'http://myicon.com/icon.png',
// 					'type': 'url'
// 				},
// 				'auth': false,
// 				'messages': []
// 			}
// 		], null, '  '), output);
// 	});
//
// 	it('should not add messages without schemas', function () {
// 		buildConnectorsJson('meh', [{
// 			name: 'mailchimp',
// 			messages: [{
// 				name: 'my_message',
// 				model: {
// 					url: '..'
// 				}
// 			}]
// 		}], true);
//
// 		assert.equal(parsed[0].messages.length, 0);
// 	});
//
// 	it('should not add messages which start with \'#\' in their name', function () {
// 		buildConnectorsJson('meh', [{
// 			name: 'mailchimp',
// 			messages: [{
// 				name: '#my_message',
// 				model: {
// 					url: '..'
// 				},
// 				schema: {
// 					input: {
// 						name: {
// 							type: 'string'
// 						}
// 					}
// 				}
// 			}]
// 		}], true);
//
// 		assert.equal(parsed[0].messages.length, 0);
// 	});
//
// 	it('should add messages with schemas', function () {
// 		buildConnectorsJson('meh', [{
// 			name: 'mailchimp',
// 			messages: [{
// 				name: 'my_message',
// 				schema: {
// 					input: {
// 						name: {
// 							type: 'string'
// 						}
// 					}
// 				},
// 				model: {
// 					url: '..'
// 				}
// 			}]
// 		}], true);
//
// 		assert.equal(parsed[0].messages.length, 1);
// 	});
//
// 	it('should autogenerate message titles nicely if not already declared', function () {
// 		buildConnectorsJson('meh', [{
// 			name: 'mailchimp',
// 			messages: [{
// 				schema: {
// 					name: 'my_message',
// 					input: {
// 						name: {
// 							type: 'string'
// 						}
// 					},
// 					delivery: 'acknowledge'
// 				},
// 				model: {
// 					url: '..'
// 				}
// 			}, {
// 				schema: {
// 					name: 'my_second_message',
// 					title: 'My amazing second message',
// 					delivery: 'request_response',
// 				},
// 				model: {}
// 			}]
// 		}], true);
//
// 		assert.equal(parsed[0].messages.length, 2);
// 		// remember - operations are sorted by title
// 		assert.equal(parsed[0].messages[1].title, 'My message');
// 		assert.equal(parsed[0].messages[1].delivery, 'acknowledge');
// 		assert.equal(parsed[0].messages[0].title, 'My amazing second message');
// 		assert.equal(parsed[0].messages[0].delivery, 'request_response');
// 	});
//
// 	it('should create from specified output schema if specified', function () {
// 		buildConnectorsJson('meh', [{
// 			name: 'mailchimp',
// 			messages: [{
// 				schema: {
// 					name: 'my_message',
// 					input: {
// 						name: {
// 							type: 'string'
// 						}
// 					},
// 					output: {
// 						result: {
// 							type: 'integer'
// 						}
// 					}
// 				},
// 				model: {
// 					url: '..'
// 				}
// 			}]
// 		}], true);
//
// 		assert(_.isObject(parsed[0].messages[0].output_schema));
// 		assert.equal(parsed[0].messages[0].output_schema.properties.result.type, 'integer');
// 	});
//
// 	it('should generate from sample response if specified', function () {
// 		buildConnectorsJson('meh', [{
// 			name: 'mailchimp',
// 			messages: [{
// 				schema: {
// 					name: 'my_message',
// 					input: {
// 						name: {
// 							type: 'string'
// 						}
// 					},
// 					responseSample: {
// 						result: true
// 					}
// 				},
// 				model: {
// 					url: '..'
// 				}
// 			}]
// 		}], true);
//
// 		assert(_.isObject(parsed[0].messages[0].output_schema));
// 		assert.equal(parsed[0].messages[0].output_schema.properties.result.type, 'boolean');
// 	});
//
// 	it('should add global schema input if declared', function () {
// 		buildConnectorsJson('meh', [{
// 			name: 'mailchimp',
// 			globalSchema: {
// 				input: {
// 					api_key: {
// 						type: 'string',
// 						required: true,
// 						advanced: true
// 					}
// 				}
// 			},
// 			messages: [{
// 				name: 'my_message',
// 				schema: {
// 					input: {
// 						name: {
// 							type: 'string'
// 						}
// 					}
// 				},
// 				model: {
// 					url: '..'
// 				}
// 			}]
// 		}], true);
//
// 		assert.equal(_.keys(parsed[0].messages[0].input_schema.properties).length, 2);
// 		assert.equal(parsed[0].messages[0].input_schema.properties.api_key.type, 'string');
// 		assert.equal(parsed[0].messages[0].input_schema.properties.name.type, 'string');
// 		assert.equal(parsed[0].messages.length, 1);
// 	});
//
// 	it.skip('should add global auth scopes if not declared on a local level', function () {
//
// 	});
//
// });
