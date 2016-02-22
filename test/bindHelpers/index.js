var assert     = require('assert');
var _ 	       = require('lodash');
var fs 		     = require('fs');
var proxyquire = require('proxyquire');

describe('#bindHelpers', function () {

	beforeEach(function () {
		GLOBAL.falafel = {};
	});

	afterEach(function () {
		delete GLOBAL.falafel;
	});

	it('should bind helpers if the directory exists', function () {
		var requiredIn = false;

		var bindHelpers = proxyquire('../../lib/bindHelpers', {
			'../utils/getDirectories': function () {
				return ['helpers'];
			},
			requireindex: function () {
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
			'./utils/getDirectories': function () {
				return [];
			},
			requireindex: function () {
				requiredIn = false;
			}
		});

		bindHelpers('/');

		assert(!requiredIn);
		assert.deepEqual(falafel.helpers, {});
	});

});