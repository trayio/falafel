var _ 					= require('lodash');
var assert 			= require('assert');
var prettyTitle = require('../../lib/buildConnectorsJson/prettyTitle');


describe('#prettyTitle', function () {

	it('should make names look nice', function () {
		assert.strictEqual(prettyTitle('list_name'), 'List name');
		assert.strictEqual(prettyTitle('list-name'), 'List name');
		assert.strictEqual(prettyTitle('listName'), 'List name');
		assert.strictEqual(prettyTitle('ListName'), 'List name');
		assert.strictEqual(prettyTitle('listName'), 'List name');
	});

	it('should upper case id', function () {
		assert.strictEqual(prettyTitle('id'), 'ID');
		assert.strictEqual(prettyTitle('list_id'), 'List ID');
		assert.strictEqual(prettyTitle('list_id_name'), 'List ID name');

		assert.strictEqual(prettyTitle('lid'), 'Lid');
		assert.strictEqual(prettyTitle('list baseid'), 'List baseid');
	});

	it('should upper case ids', function () {
		assert.strictEqual(prettyTitle('ids'), 'IDs');
		assert.strictEqual(prettyTitle('list_ids'), 'List IDs');
		assert.strictEqual(prettyTitle('list_ids_name'), 'List IDs name');

		assert.strictEqual(prettyTitle('lids'), 'Lids');
		assert.strictEqual(prettyTitle('list baseids'), 'List baseids');
	});

	it('should upper case url', function () {
		assert.strictEqual(prettyTitle('url'), 'URL');
		assert.strictEqual(prettyTitle('list_url'), 'List URL');
		assert.strictEqual(prettyTitle('list_url_name'), 'List URL name');

		assert.strictEqual(prettyTitle('lurl'), 'Lurl');
		assert.strictEqual(prettyTitle('list baseurl'), 'List baseurl');
	});

	it('should upper case ddl', function () {
		assert.strictEqual(prettyTitle('ddl'), 'DDL');
		assert.strictEqual(prettyTitle('list_ddl'), 'List DDL');

		assert.strictEqual(prettyTitle('lurl'), 'Lurl');
		assert.strictEqual(prettyTitle('list baseurl'), 'List baseurl');
	});

	it('should globally upper case id, ids and url', function () {
		assert.strictEqual(prettyTitle('list_id_url_name'), 'List ID URL name');
		assert.strictEqual(prettyTitle('list_url_id_name'), 'List URL ID name');
		assert.strictEqual(prettyTitle('list_ids_url_name'), 'List IDs URL name');
		assert.strictEqual(prettyTitle('list_url_ids_name'), 'List URL IDs name');
		assert.strictEqual(prettyTitle('list_url_ids_name_ddl'), 'List URL IDs name DDL');
	});

});
