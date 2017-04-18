var assert     = require('assert');
var formatDate = require('../../../lib/bindConnectors/formatInputBody/date')

describe('#date', function () {

  beforeEach(function () {
    global._ = require('lodash');
  });

  it('should do nothing without a schema property', function () {
    assert.strictEqual(
      formatDate('2017-01-20', {}),
      '2017-01-20'
    );
  });

  it('should do nothing if the format is not date', function () {
    assert.strictEqual(
      formatDate('2017-01-20', {
        type: 'string'
      }),
      '2017-01-20'
    );
  });

  it('should do nothing if the format is date but there\'s no date mask', function () {
    assert.strictEqual(
      formatDate('2017-01-20', {
        type: 'string',
        format: 'date'
      }),
      '2017-01-20'
    );
  });

  it('should do nothing if the value is not a date-like type', function () {
    assert.strictEqual(
      formatDate(null, {
        type: 'string',
        format: 'date',
        date_mask: 'X'
      }),
      null
    );
    assert.strictEqual(
      formatDate(true, {
        type: 'string',
        format: 'date',
        date_mask: 'X'
      }),
      true
    );
    assert.strictEqual(
      formatDate(undefined, {
        type: 'string',
        format: 'date',
        date_mask: 'X'
      }),
      undefined
    );
  });

  it('should format a date correctly', function () {
    assert.strictEqual(
      formatDate('2017-01-20', {
        type: 'string',
        format: 'date',
        date_mask: 'YY-MM-DD'
      }),
      '17-01-20'
    );
    assert.strictEqual(
      formatDate('2017-01-20', {
        type: 'string',
        format: 'date',
        date_mask: 'X'
      }),
      '1484870400'
    );
    assert.strictEqual(
      formatDate('2017-01-20', {
        type: 'number',
        format: 'date',
        date_mask: 'X'
      }),
      1484870400
    );
    assert.strictEqual(
      formatDate('2017-01-20', {
        type: ['number', 'string'],
        format: 'date',
        date_mask: 'X'
      }),
      1484870400
    );
    assert.strictEqual(
      formatDate('2017-01-20', {
        type: 'string',
        format: 'date',
        date_mask: 'dddd, MMMM Do YYYY, h:mm:ss a'
      }),
      'Friday, January 20th 2017, 12:00:00 am'
    );
  });

  it('should auto-convert unix timestamps correctly', function () {
    assert.strictEqual(
      formatDate(1484870400, {
        type: 'number',
        format: 'date',
        date_mask: 'YYYY-MM-DD'
      }),
      '2017-01-20'
    );
    assert.strictEqual(
      formatDate('1484870400', {
        type: 'number',
        format: 'date',
        date_mask: 'YYYY-MM-DD'
      }),
      '2017-01-20'
    );
    assert.strictEqual(
      formatDate(1484870400000, {
        type: 'number',
        format: 'date',
        date_mask: 'YYYY-MM-DD'
      }),
      '2017-01-20'
    );
    assert.strictEqual(
      formatDate('1484870400000', {
        type: 'number',
        format: 'date',
        date_mask: 'YYYY-MM-DD'
      }),
      '2017-01-20'
    );
  });

  it('should error on an invalid date input', function () {
    try {
      formatDate('2016-05-123214', {
        type: 'number',
        format: 'date',
        date_mask: 'YYYY-MM-DD'
      })
    } catch (e) {
      assert.strictEqual(e.message, 'Date "2016-05-123214" is an invalid date format.');
    }
  });

  it('should treat "now" as a special input value', function () {
    assert.strictEqual(
      formatDate('now', {
        type: 'string',
        format: 'date',
        date_mask: 'YYYY'
      }),
      String(new Date().getFullYear())
    );
  });

});
