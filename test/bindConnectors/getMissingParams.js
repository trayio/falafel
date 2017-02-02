var assert      = require('assert');
var _ 	        = require('lodash');
var getMissingParams = require('../../lib/bindConnectors/getMissingParams');


describe('#getMissingParams', function () {

	it('should pass - empty array', function () {

		var missingParams = getMissingParams(
			{
				test1: 'test1',
				test2: 123,
				test3: [{}],
				test4: {
					test4Sub: 'test4Sub'
				}
			},
			{

				input: {
					test2: {
						type: 'number',
						required: true
					},
					test3: {
						type: 'array'
					},
					test4: {
						type: 'object',
						properties: {
							test4Sub: {
								type: 'string'
							}
						}
					}
				}

			},
			{

				input: {
					test1: {
						type: 'string',
						required: true
					}
				}

			}

		);

		assert(missingParams.length === 0);

	});

	it('should fail - array has "test1"', function () {

		var missingParams = getMissingParams(
			{
				test2: 123,
				test3: [{}],
				test4: {
					test4Sub: 'test4Sub'
				}
			},
			{

				input: {
					test2: {
						type: 'number',
						required: true
					},
					test3: {
						type: 'array'
					},
					test4: {
						type: 'object',
						properties: {
							test4Sub: {
								type: 'string'
							}
						}
					}
				}

			},
			{

				input: {
					test1: {
						type: 'string',
						required: true
					}
				}

			}

		);

		assert.equal(missingParams[0], 'test1');

	});

	it('should pass, ignoring globals', function () {

		var missingParams = getMissingParams(
			{
				test2: 123,
				test3: [{}],
				test4: {
					test4Sub: 'test4Sub'
				}
			},
			{
				globals: false,

				input: {
					test2: {
						type: 'number',
						required: true
					},
					test3: {
						type: 'array'
					},
					test4: {
						type: 'object',
						properties: {
							test4Sub: {
								type: 'string'
							}
						}
					}
				}

			},
			{

				input: {
					test1: {
						type: 'string',
						required: true
					}
				}

			}

		);

		assert.notEqual(missingParams[0], 'test1');

	});

	it('should pass even if messageSchema is undefined', function () {

		var missingParams = getMissingParams(
			{
				test1: '123'
			},
			undefined,
			{

				input: {
					test1: {
						type: 'string',
						required: true
					}
				}

			}

		);

		assert(missingParams.length === 0);

	});

	it('should pass even if globalSchema is undefined', function () {

		var missingParams = getMissingParams(
			{
				test1: '123'
			},
			{

				input: {
					test1: {
						type: 'string',
						required: true
					}
				}

			},
			undefined
		);

		assert(missingParams.length === 0);

	});

	it('should pass even if both schemas are undefined', function () {

		var missingParams = getMissingParams(
			{
				test1: '123'
			},
			undefined,
			undefined
		);

		assert(missingParams.length === 0);

	});



});
