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

  it('should decode url form encoded when content-type starts with application/x-www-form-urlencoded', function () {
    var http = {
			"headers": {
				"Content-Type": ["application/x-www-form-urlencoded; charset=utf-8"]
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

  it('should convert passed json object body to json in dev mode', function () {
    var http = {
			"headers": {
				"Content-Type": ["application/json"]
			},
			"body": {
        name: 'Chris',
        age: 26
      },
			"form": []
		};

    var originalBody = _.clone(http.body);
    var newHttp = parseRequestBody(http, {
      dev: true
    });

    assert.deepEqual(newHttp.body, {
      name: 'Chris',
      age: 26
    });
  });

  it('should not convert to base64 passed url encoded string in dev mode', function () {
    var http = {
			"headers": {
				"Content-Type": ["application/x-www-form-urlencoded"]
			},
			"body": 'page_id=01f0d764-6639-407b-a04c-1a020e27c27e&page_name=Test&variant=a&page_url=http%3A%2F%2Funbouncepages.com%2Ftest-12344747559&data.json=%7B%22email%22%3A%5B%22ali%40tray.io%22%5D%2C%22ip_address%22%3A%5B%2277.89.130.2%22%5D%2C%22time_submitted%22%3A%5B%2210%3A28%20AM%20UTC%22%5D%7D&data.xml=%3C%3Fxml%20version%3D%271.0%27%3F%3E%0A%3Cform_data%3E%0A%20%20%3Cemail%3Eali%40tray.io%3C%2Femail%3E%0A%20%20%3Cip_address%3E77.89.130.2%3C%2Fip_address%3E%0A%20%20%3Ctime_submitted%3E10%3A28%20AM%20UTC%3C%2Ftime_submitted%3E%0A%3C%2Fform_data%3E',
			"form": []
		};

    var originalBody = _.clone(http.body);
    var newHttp = parseRequestBody(http, {
      dev: true
    });

    assert.deepEqual(newHttp.body, {
      page_id: '01f0d764-6639-407b-a04c-1a020e27c27e',
      page_name: 'Test',
      variant: 'a',
      page_url: 'http://unbouncepages.com/test-12344747559',
      'data.json': '{"email":["ali@tray.io"],"ip_address":["77.89.130.2"],"time_submitted":["10:28 AM UTC"]}',
      'data.xml': '<?xml version=\'1.0\'?>\n<form_data>\n  <email>ali@tray.io</email>\n  <ip_address>77.89.130.2</ip_address>\n  <time_submitted>10:28 AM UTC</time_submitted>\n</form_data>'
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
