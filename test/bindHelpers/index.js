var assert     = require('assert');
var _ 	       = require('lodash');
var fs 		     = require('fs');
var proxyquire = require('proxyquire');

describe('#bindHelpers', function () {

	beforeEach(function () {
		global.falafel = {};
	});

	afterEach(function () {
		delete global.falafel;
	});

	it('should bind helpers if the directory exists', function () {
		var requiredIn = false;

		var bindHelpers = proxyquire('../../lib/bindHelpers', {
			'../utils/getDirectories': function () {
				return ['helpers'];
			},
			'../utils/requireAll': function () {
				requiredIn = true;
				return {
					getMetadata: 'chris'
				};
			}
		});

		bindHelpers('/');

		assert(requiredIn);
		assert.deepEqual(falafel.helpers, {
			getMetadata: 'chris'
		});
	});

	it('should be a blank object if the directory doesn\'t', function () {
		var requiredIn = false;

		var bindHelpers = proxyquire('../../lib/bindHelpers', {
			'../utils/getDirectories': function () {
				return [];
			},
			'../utils/requireAll': function () {
				requiredIn = false;
			}
		});

		bindHelpers('/');

		assert(!requiredIn);
		assert.deepEqual(falafel.helpers, {});
	});

});
