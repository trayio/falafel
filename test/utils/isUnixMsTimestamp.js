var assert = require('assert');
var isUnixMsTimestamp = require('../../lib/utils/isUnixMsTimestamp');


describe('#isUnixMsTimestamp', function () {

  it('should be true for unix ms timestamps', function () {
    assert.strictEqual(isUnixMsTimestamp('1487844111000'), true);
    assert.strictEqual(isUnixMsTimestamp(1487844111000), true);
  });

  it('should be false for everything else', function () {
    assert.strictEqual(isUnixMsTimestamp('2017-02-23'), false);
    assert.strictEqual(isUnixMsTimestamp('chris'), false);
    assert.strictEqual(isUnixMsTimestamp('3487844111'), false);
    assert.strictEqual(isUnixMsTimestamp('1487844111'), false);
    assert.strictEqual(isUnixMsTimestamp(1487844111), false);
    assert.strictEqual(isUnixMsTimestamp(null), false);
    assert.strictEqual(isUnixMsTimestamp(false), false);
    assert.strictEqual(isUnixMsTimestamp(undefined), false);
    assert.strictEqual(isUnixMsTimestamp(2), false);
  });

});
