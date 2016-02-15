var assert  = require('assert');
var _ 	    = require('lodash');
var Falafel = require('../lib');

describe('falafel', function () {

	it('should return an object with a `wrap` function', function () {
		assert(_.isFunction(Falafel));
		var falafel = new Falafel();
		assert(_.isObject(falafel));
		assert(_.isFunction(falafel.wrap));
	});

	it('should set globals', function () {
		
	});

});