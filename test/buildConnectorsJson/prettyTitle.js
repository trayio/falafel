var _ 					= require('lodash');
var assert 			= require('assert');
var prettyTitle = require('../../lib/buildConnectorsJson/prettyTitle');


describe('#prettyTitle', function () {

	it('should make things look nice', function () {
		assert.equal(prettyTitle('list_name'), 'List name');
		assert.equal(prettyTitle('list-name'), 'List name');
		assert.equal(prettyTitle('listName'), 'List name');
		assert.equal(prettyTitle('ListName'), 'List name');
		assert.equal(prettyTitle('listName'), 'List name');
	});

	it('should upper case id', function () {
		assert.equal(prettyTitle('id'), 'ID');
		assert.equal(prettyTitle('list_id'), 'List ID');
		assert.equal(prettyTitle('list_id_name'), 'List ID name');

		assert.equal(prettyTitle('lid'), 'Lid');
		assert.equal(prettyTitle('list baseid'), 'List baseid');
	});

	it('should upper case ids', function () {
		assert.equal(prettyTitle('ids'), 'IDs');
		assert.equal(prettyTitle('list_ids'), 'List IDs');
		assert.equal(prettyTitle('list_ids_name'), 'List IDs name');

		assert.equal(prettyTitle('lids'), 'Lids');
		assert.equal(prettyTitle('list baseids'), 'List baseids');
	});

	it('should upper case url', function () {
		assert.equal(prettyTitle('url'), 'URL');
		assert.equal(prettyTitle('list_url'), 'List URL');
		assert.equal(prettyTitle('list_url_name'), 'List URL name');

		assert.equal(prettyTitle('lurl'), 'Lurl');
		assert.equal(prettyTitle('list baseurl'), 'List baseurl');
	});

	it('should globally upper id, ids and urls', function () {
		assert.equal(prettyTitle('list_id_url_name'), 'List ID URL name');
		assert.equal(prettyTitle('list_url_id_name'), 'List URL ID name');
		assert.equal(prettyTitle('list_ids_url_name'), 'List IDs URL name');
		assert.equal(prettyTitle('list_url_ids_name'), 'List URL IDs name');
	});

});
