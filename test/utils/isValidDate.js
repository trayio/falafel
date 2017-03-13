var assert = require('assert');
var isValidDate = require('../../lib/utils/isValidDate');


describe('#isValidDate', function () {

  before(function () {
    global._ = require('lodash');
  })

  it('should be true for valid dates', function () {
    assert.strictEqual(isValidDate(1487844111000), true)
    assert.strictEqual(isValidDate('2017-10-02'), true)
    assert.strictEqual(isValidDate('2017-10-02T00:00:00.000Z'), true)
  });

  it('should be false for everything else', function () {
    assert.strictEqual(isValidDate('17-10-02'), false);
    assert.strictEqual(isValidDate('1487844111000'), false);
    assert.strictEqual(isValidDate('1487844111'), false);
    assert.strictEqual(isValidDate('2017-23-23'), false);
    assert.strictEqual(isValidDate('chris'), false);
    assert.strictEqual(isValidDate(null), false);
    assert.strictEqual(isValidDate(false), false);
    assert.strictEqual(isValidDate(undefined), false);
  });

});
