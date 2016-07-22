var assert           = require('assert');
var _ 	             = require('lodash');
var parseRequestBody = require('../../lib/bindConnectors/parseRequestBody');


describe('#parseRequestBody', function () {


  it('should decode json when content-type is application/json', function () {
    var http = {
			"headers": {
				"Content-Type": ["application/json"]
			},
			"body": 'eyJpZCI6MTIzLCJuYW1lIjoiQ2hyaXMgSG91Z2h0b24ifQ==',
			"form": []
		};

    var originalBody = _.clone(http.body);

    var newHttp = parseRequestBody(http, {});

    assert.notEqual(originalBody, newHttp.body);
    assert.deepEqual(newHttp.body, {
      id: 123,
      name: 'Chris Houghton'
    });
  });

  it('should decode json when content-type starts with application/json', function () {
    var http = {
			"headers": {
				"Content-Type": ["application/json; charset=utf-8"]
			},
			"body": 'eyJpZCI6MTIzLCJuYW1lIjoiQ2hyaXMgSG91Z2h0b24ifQ==',
			"form": []
		};

    var originalBody = _.clone(http.body);

    var newHttp = parseRequestBody(http, {});

    assert.notEqual(originalBody, newHttp.body);
    assert.deepEqual(newHttp.body, {
      id: 123,
      name: 'Chris Houghton'
    });
  });


  it('should add a rawBody to the http', function () {
    var http = {
			"headers": {
				"Content-Type": ["application/json"]
			},
			"body": 'eyJpZCI6MTIzLCJuYW1lIjoiQ2hyaXMgSG91Z2h0b24ifQ==',
			"form": []
		};

    assert(!http.rawBody);
    var newHttp = parseRequestBody(http, {});

    assert(_.isString(newHttp.rawBody));
    assert.strictEqual(newHttp.rawBody, '{"id":123,"name":"Chris Houghton"}')
  });


  it('should decode url form encoded when content-type is application/x-www-form-urlencoded', function () {
    var http = {
			"headers": {
				"Content-Type": ["application/x-www-form-urlencoded"]
			},
			"body": "Zm9vW2Jhcl09YmF6",
			"form": []
		};

    var originalBody = _.clone(http.body);

    var newHttp = parseRequestBody(http, {});
    assert.notEqual(originalBody, newHttp.body);

    assert.deepEqual(newHttp.body, {
      foo: {
        bar: 'baz'
      }
    });
  });


  it('should spit out the decoded body for everything else', function () {
    var http = {
			"headers": {
			},
			"body": "Q2hyaXMgSG91Z2h0b24gY29udGVudHMgaGVyZQ==",
			"form": []
		};

    var originalBody = _.clone(http.body);

    var newHttp = parseRequestBody(http, {});
    assert.notEqual(originalBody, newHttp.body);

    assert.strictEqual(newHttp.body, 'Chris Houghton contents here');
  });


});
