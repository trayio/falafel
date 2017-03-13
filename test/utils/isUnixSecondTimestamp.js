var assert = require('assert');
var isUnixSecondTimestamp = require('../../lib/utils/isUnixSecondTimestamp');


describe('#isUnixSecondTimestamp', function () {

  it('should be true for unix timestamps', function () {
    assert.strictEqual(isUnixSecondTimestamp('1487844111'), true);
    assert.strictEqual(isUnixSecondTimestamp(1487844111), true);
    assert.strictEqual(isUnixSecondTimestamp('2487844111'), true);
    assert.strictEqual(isUnixSecondTimestamp(2487844111), true);
  });

  it('should be false for everything else', function () {
    assert.strictEqual(isUnixSecondTimestamp('2017-02-23'), false);
    assert.strictEqual(isUnixSecondTimestamp('chris'), false);
    assert.strictEqual(isUnixSecondTimestamp('3487844111'), false);
    assert.strictEqual(isUnixSecondTimestamp('1487844111000'), false);
    assert.strictEqual(isUnixSecondTimestamp(null), false);
    assert.strictEqual(isUnixSecondTimestamp(false), false);
    assert.strictEqual(isUnixSecondTimestamp(undefined), false);
    assert.strictEqual(isUnixSecondTimestamp(2), false);
  });

});
