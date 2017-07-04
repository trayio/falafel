var _ 			= require('lodash');
var assert 		= require('assert');
var handleOAuthRefresh = require('../../lib/parseConfig/handleOAuthRefresh');


describe('#handleOAuthRefresh', function () {

	var sampleAuth;
	beforeEach(function () {
		sampleAuth = {
			type: 'oauth2',
			oauthRefresh: {
				statusCodes: [401],
				bodyContains: [],
				headers: []
			}
		}
	})

	it('should not wrap the function for non oauth connectors', function () {
		var myFunction = function () {
			return true;
		};
		sampleAuth.type = 'basic';

		var wrappedFn = handleOAuthRefresh(sampleAuth, myFunction);
		assert(_.isEqual(myFunction, wrappedFn));
	});


	it('should wrap the function for oauth connectors', function () {
		var myFunction = function () {
			return true;
		};

		var wrappedFn = handleOAuthRefresh(sampleAuth, myFunction);
		assert(!_.isEqual(myFunction, wrappedFn));
	});


	it('should trigger refresh on matching status code', function () {
		var err = {
			code: 'bad-error',
			response: {
				statusCode: 401
			}
		};

		var afterFailure = handleOAuthRefresh(sampleAuth);
		afterFailure(err);

		assert.strictEqual(err.code, 'oauth_refresh');
	});


	it('should trigger refresh on matching body pattern', function () {
		var err = {
			code: 'bad-error',
			response: {
				body: 'Your access token has expired'
			}
		};
		sampleAuth.oauthRefresh.statusCodes = [];
		sampleAuth.oauthRefresh.bodyContains = ['access token has expired'];

		var afterFailure = handleOAuthRefresh(sampleAuth);
		afterFailure(err);

		assert.strictEqual(err.code, 'oauth_refresh');
	});


	it('should trigger refresh when all conditions match', function () {
		var err = {
			code: 'bad-error',
			response: {
				statusCode: 401,
				body: 'Your access token has expired'
			}
		};
		sampleAuth.oauthRefresh.statusCodes = [401];
		sampleAuth.oauthRefresh.bodyContains = ['access token has expired'];

		var afterFailure = handleOAuthRefresh(sampleAuth);
		afterFailure(err);

		assert.strictEqual(err.code, 'oauth_refresh');
	});


	it('should not trigger refresh when not all conditions match', function () {
		var err = {
			code: 'bad-error',
			response: {
				statusCode: 200,
				body: 'Your access token has expired'
			}
		};
		sampleAuth.oauthRefresh.statusCodes = [401];
		sampleAuth.oauthRefresh.bodyContains = ['access token has expired'];

		var afterFailure = handleOAuthRefresh(sampleAuth);
		afterFailure(err);

		assert.strictEqual(err.code, 'bad-error');


		err = {
			code: 'bad-error',
			response: {
				statusCode: 401,
				body: 'Your access token has not expired'
			}
		};
		sampleAuth.oauthRefresh.statusCodes = [401];
		sampleAuth.oauthRefresh.bodyContains = ['access token has expired'];

		afterFailure = handleOAuthRefresh(sampleAuth);
		afterFailure(err);

		assert.strictEqual(err.code, 'bad-error');
	});
	

});