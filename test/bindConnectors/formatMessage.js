var assert = require('assert');
var formatMessage = require('../../lib/bindConnectors/formatMessage');



describe('#formatMessage', function () {

	it('should format a regular message correctly, not setting version', function () {
		var input = {
			event: {
				id: '123-456',
			},
			response: {
				header: {},
				body: {
					testing: true
				}
			},
			version: 1
		};

		var expected = {
			id: '123-456',
			header: {},
			body: {
				testing: true
			},
			version: undefined
		};

		assert.deepEqual(formatMessage(input.event, input.response, input.version), expected);
	});

	it('should format a regular message correctly with header, not setting version', function () {
		var input = {
			event: {
				id: '123-456',
			},
			response: {
				header: {
					metadata: true
				},
				body: {
					testing: true
				}
			},
			version: 1
		};

		var expected = {
			id: '123-456',
			header: {
				metadata: true
			},
			body: {
				testing: true
			},
			version: undefined
		};

		assert.deepEqual(formatMessage(input.event, input.response, input.version), expected);
	});

	it('should handle set version 2 when explicitly defined', function () {
		var input = {
			event: {
				id: '123-456',
			},
			response: {
				header: {},
				body: {
					testing: true
				}
			},
			version: 2
		};

		var expected = {
			id: '123-456',
			header: {},
			body: {
				testing: true
			},
			version: 2
		};

		assert.deepEqual(formatMessage(input.event, input.response, input.version), expected);
	});

});
