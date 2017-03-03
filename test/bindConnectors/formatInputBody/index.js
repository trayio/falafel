var assert = require('assert');
var formatInputBody = require('../../../lib/bindConnectors/formatInputBody')

describe('#formatInputBody', function () {

  before(function () {
    global._ = require('lodash');
  });

  it('should run a top level parameter through the formatters', function () {
    var body = {
      my_date: '2017-10-02T00:00:00.000Z'
    };
    var schema = {
      input: {
        my_date: {
          type: 'string',
          format: 'date',
          date_mask: 'YYYY-MM-DD'
        }
      }
    }

    var result = formatInputBody(body, schema);

    assert.strictEqual(body.my_date, '2017-10-02T00:00:00.000Z');
    assert.strictEqual(result.my_date, '2017-10-02');
  });


  it('should not change non date parameters', function () {
    var body = {
      my_date: '2017-10-02T00:00:00.000Z'
    };
    var schema = {
      input: {
        my_date: {
          type: 'string',
          // format: 'date',
          // date_mask: 'YYYY-MM-DD'
        }
      }
    }

    var result = formatInputBody(body, schema);
    assert.strictEqual(result.my_date, '2017-10-02T00:00:00.000Z');
  });


  it('should change nested paramters', function () {
    var body = {
      my_date: '2017-10-02T00:00:00.000Z',
      query: {
        my_date: '2018-10-02T00:00:00.000Z',
        sub_query: {
          my_second_date: '2016-10-02T00:00:00.000Z',
          my_missing_property: '2017-10-01',
          many_sub_queries: [{
            my_third_date: '2015-10-02T00:00:00.000Z',
            my_unmapped_date: '2014-10-02T00:00:00.000Z',
          }, {
            my_third_date: '2013-10-02T00:00:00.000Z',
            my_unmapped_date: '2012-10-02T00:00:00.000Z',
          }]
        }
      }
    };
    var schema = {
      input: {
        my_date: {
          type: 'string',
          format: 'date',
          date_mask: 'YYYY-MM-DD'
        },
        query: {
          type: 'object',
          properties: {
            my_date: {
              type: 'string',
              format: 'date',
              date_mask: 'YY-MM-DD'
            },
            sub_query: {
              type: 'object',
              properties: {
                my_second_date: {
                  type: 'number',
                  format: 'date',
                  date_mask: 'x'
                },
                many_sub_queries: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      my_third_date: {
                        type: 'string',
                        format: 'date',
                        date_mask: 'X'
                      },
                      my_unmapped_date: {
                        type: 'string'
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    var result = formatInputBody(body, schema);

    assert.deepEqual(result, {
      my_date: '2017-10-02',
      query: {
        my_date: '18-10-02',
        sub_query: {
          my_second_date: 1475366400000,
          my_missing_property: '2017-10-01',
          many_sub_queries: [{
            my_third_date: '1443744000',
            my_unmapped_date: '2014-10-02T00:00:00.000Z',
          }, {
            my_third_date: '1380672000',
            my_unmapped_date: '2012-10-02T00:00:00.000Z',
          }]
        }
      }
    });
  });

});
