var assert      = require('assert');
var _ 	        = require('lodash');

var bindTriggerRequest = require('../../lib/bindConnectors/bindTriggerRequest');

describe.only('#bindTrigger', function () {

	it('should return a function', function () {

		var requestFunc = bindTriggerRequest(
			{},
			{}
		);

		assert(_.isFunction(requestFunc));

	});

});
