var _       = require('lodash');
var assert    = require('assert');
var getHelper = require('../../lib/parseConfig/getHelper');


describe('#getHelper', function () {

	it('should get a helper, parsed and ready for use', function () {
		var data = {
			type: 'function',
			value: 'function (foo) { return \'test\' + foo; }',
		};

		var helper = getHelper(data, 'test_helper');

		assert(_.isFunction(helper));
		assert(helper('chris'), 'testchris');
	});

});
