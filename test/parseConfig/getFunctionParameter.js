var _ 			= require('lodash');
var assert 		= require('assert');
var getFunctionParameter = require('../../lib/parseConfig/getFunctionParameter');


describe.only('#getFunctionParameter', function () {

	it('should return a function for a valid function string input', function () {
		var fnString = 'function (input) { input.test = false; }';
		var fn = getFunctionParameter({ value: fnString }, 'before');
		assert(_.isFunction(fn));
	});


	it('should evaluate a function correctly, preserving context', function () {
		var fnString = 'function (input) { input.test = false; return \'steve\'; }';

		var fn = getFunctionParameter({ value: fnString }, 'before');

		var input = { starting: true };
		var result = fn(input);

		assert.strictEqual(result, 'steve');
		assert.deepEqual(input, { test: false, starting: true });
	});


	it('should return an error if an invalid function string is supplied when the function is evaluated', function () {
		var fn = getFunctionParameter({ value: 'function { cba' }, 'before', 'test_op');

		assert(_.isFunction(fn));

		var didCatch = false;

		try {
			fn({ sample: 'input' });
		} catch (err) {
			assert(_.isError(err));
			assert.strictEqual(err.message, `Error occured for module 'test_op'. Error evaluating function 'before': Unexpected token {`);
			didCatch = true;
		}

		assert(didCatch);

	});


	it('should return an error if a variable is specified, but it\'s not a function', function () {
		var fn = getFunctionParameter({ value: '5;' }, 'before', 'test_op');

		assert(_.isFunction(fn));

		var didCatch = false;

		try {
			fn({ sample: 'input' });
		} catch (err) {
			assert(_.isError(err));
			assert.strictEqual(err.message, `Error occured for module 'test_op'. Error evaluating function 'before': Should be a function`);
			didCatch = true;
		}

		assert(didCatch);

	});


});
