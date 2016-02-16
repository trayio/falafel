var assert          = require('assert');
var _ 	            = require('lodash');
var bindHealthCheck = require('../../lib/bindConnectors/bindHealthCheck');


describe('#bindHealthCheck', function () {

	it('should bind the health check', function () {
		var called = false;

		bindHealthCheck({
			onHealthCheck: function (cb) {
				called = true;
			}
		});

		assert(called);
	});

	it('should reply with healthy', function (done) {

		var replyMessage;

		var reply = function (message) {
			replyMessage = message;
		};
	
		var connector = {
			onHealthCheck: function (cb) {
				assert(cb.toString().indexOf("reply('healthy')") !== -1);
				done();
			}
		};

		bindHealthCheck(connector);


	});

});