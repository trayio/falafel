var _ 					= require('lodash');
var assert 			= require('assert');
var prettyTitle = require('../../lib/buildConnectorsJson/prettyTitle');


describe('#prettyTitle', function () {

	it('should make things look nice', function () {
		assert.equal(prettyTitle('list_name'), 'List name');
		assert.equal(prettyTitle('list-name'), 'List name');
		assert.equal(prettyTitle('listName'), 'List name');
		assert.equal(prettyTitle('ListName'), 'List name');
	});

	it.skip('should handle some clever edge cases', function () {
		assert.equal(prettyTitle('list_id'), 'List ID');
		assert.equal(prettyTitle('webhook_url'), 'Webhook URL');
	});

});