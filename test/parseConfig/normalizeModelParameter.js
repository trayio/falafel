var _ 			= require('lodash');
var assert 		= require('assert');
var normalize = require('../../lib/parseConfig/normalizeModelParameter');


describe('#normalizeModelParameter', function () {

	it('should normalize a flat parameter', function () {
		var data = {
			type: 'object',
			value: {
				age: {
					type: 'number',
					value: 27
				},
				name: {
					type: 'string',
					value: 'Chris'
				}
			}
		};

		assert.deepEqual(normalize(data), {
			name: 'Chris',
			age: 27
		});
	});


	it('should normalize a nested object parameter', function () {
		var data = {
			type: 'object',
			value: {
				employees: {
					type: 'object',
					value: {
						adrien: {
							type: 'boolean',
							value: false
						},
						chris: {
							type: 'boolean',
							value: true
						}
					}
				}
			}
		};

		assert.deepEqual(normalize(data), {
			employees: {
				adrien: false,
				chris: true,
			}
		});
	});


	it('should normalize a blank object parameter', function () {
		var data = {
			type: 'object',
			value: {
				employees: {
					type: 'object',
					value: {}
				}
			}
		};

		assert.deepEqual(normalize(data), {
			employees: {}
		});
	});


	it('should normalize array parameters', function () {
		var data = {
			type: 'object',
			value: {
				users: {
					type: 'array',
					value: [{
						type: 'object',
						value: {
							name: {
								type: 'string',
								value: 'Ali'
							},
							favorite_foods: {
								type: 'array',
								value: [{
									type: 'string',
									value: 'Katsu Wrap'
								}, {
									type: 'string',
									value: 'Byron Milkshake'
								}]
							}
						}
					}, {
						type: 'object',
						value: {
							name: {
								type: 'string',
								value: 'Chris'
							},
							favorite_foods: {
								type: 'array',
								value: [{
									type: 'string',
									value: 'Poppies'
								}, {
									type: 'string',
									value: 'Japanika'
								}]
							}
						}
					}]
				}
			}
		};

		assert.deepEqual(normalize(data), {
			users: [{
				name: 'Ali',
				favorite_foods: ['Katsu Wrap', 'Byron Milkshake']
			}, {
				name: 'Chris',
				favorite_foods: ['Poppies', 'Japanika']
			}]
		});
	});


	it('should normalize a top level function parameter', function () {
		var data = {
			type: 'function',
			value: 'function (input) { return { name: "Chris" }; }'
		};

		const fn = normalize(data);

		assert(_.isFunction(fn));
		assert.deepEqual(fn(), { name: 'Chris' });
	});


	it('should fallback to a function returning a blank object at the top level if the param has no value. Should only happen at top level', function () {
		var data = {
			type: 'function',
			value: undefined
		};

		const fn = normalize(data);

		assert(_.isFunction(fn));
		assert.deepEqual(fn({ test: true, age: 27 }), {});



		var data2 = {
			type: 'object',
			value: {
				age: {
					type: 'number',
					value: 27,
				},
				func: {
					type: 'function',
					value: undefined
				}
			}
		};

		const obj = normalize(data2);
		assert(_.isObject(obj));
		assert.deepEqual(obj, { age: 27 });
	});



});