var assert = require('assert');
var isLegacy = require('../../../lib/utils/isLegacy');


describe('#isLegacy', function () {


  it('should be false if there is a config.json file', function () {
  	assert.strictEqual(isLegacy(__dirname+'/sampleNotLegacy'), false);
  });


  it('should be true otherwise', function () {
  	assert.strictEqual(isLegacy(__dirname+'/sampleLegacy'), true);
  });	


});
