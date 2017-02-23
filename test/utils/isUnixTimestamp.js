var assert = require('assert');
var isUnixTimestamp = require('../../lib/utils/isUnixTimestamp');


describe('#isUnixTimestamp', function () {

  it('should be true for unix timestamps', function () {
    assert.strictEqual(isUnixTimestamp('1487844111'), true);
    assert.strictEqual(isUnixTimestamp(1487844111), true);
    assert.strictEqual(isUnixTimestamp('2487844111'), true);
    assert.strictEqual(isUnixTimestamp(2487844111), true);
  });

  it('should be false for everything else', function () {
    assert.strictEqual(isUnixTimestamp('2017-02-23'), false);
    assert.strictEqual(isUnixTimestamp('chris'), false);
    assert.strictEqual(isUnixTimestamp('3487844111'), false);
    assert.strictEqual(isUnixTimestamp('1487844111000'), false);
    assert.strictEqual(isUnixTimestamp(null), false);
    assert.strictEqual(isUnixTimestamp(false), false);
    assert.strictEqual(isUnixTimestamp(undefined), false);
    assert.strictEqual(isUnixTimestamp(2), false);
  });

});
