var _ 			= require('lodash');
var assert 		= require('assert');
var denormalize = require('../../lib/getConnectors/denormalizeModelParameter');


describe('#denormalizeModelParameter', function () {

	it('should denormalize a flat parameter', function () {
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

		assert.deepEqual(denormalize(data), {
			name: 'Chris',
			age: 27
		});
	});


	it('should denormalize a nested object parameter', function () {
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

		assert.deepEqual(denormalize(data), {
			employees: {
				adrien: false,
				chris: true,
			}
		});
	});


	it('should denormalize a blank object parameter', function () {
		var data = {
			type: 'object',
			value: {
				employees: {
					type: 'object',
					value: {}
				}
			}
		};

		assert.deepEqual(denormalize(data), {
			employees: {}
		});
	});


	it('should denormalize array parameters', function () {
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

		assert.deepEqual(denormalize(data), {
			users: [{
				name: 'Ali',
				favorite_foods: ['Katsu Wrap', 'Byron Milkshake']
			}, {
				name: 'Chris',
				favorite_foods: ['Poppies', 'Japanika']
			}]
		});
	});


});