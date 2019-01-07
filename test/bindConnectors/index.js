var assert         = require('assert');
global._ 	           = require('lodash');
global.when 	           = require('when');
var bindConnectors = require('../../lib/bindConnectors');

/* eslint-disable no-console */
describe.only('#bindConnectors', function () {

	global.falafel = {};

	var config = [],
		options = {};

	config.push({
		name: 'test_connector',
		globalModel: {},
		globalSchema: {},
		messages: [
			{
				name: 'test_op',
				schema: {
					name: 'test_op'
				},
				model: function (params) {
					return params;
				},
			}
		]

	});

	var boundConnectors = bindConnectors(config, options);

	it('should pass simple function operation run', function (done) {

		boundConnectors(
			[
				{
					id: 'testID',
					header: {
						message: 'test_op'
					}
				}
			],
			{

			},
			function (err, resArr) {
				if (err) {
					assert.fail(err);
				} else {
					console.log('resArr');
					console.log(resArr);
					done();
				}
			}
		);

	});

});
