/*
* Given an access token, query the MailChimp API to get the 
* data center code, e.g. "us5".
*/
var when   = require('when');
var _ 		 = require('lodash');
var archer = require('archer-node');


module.exports = function (params) {
	return when.promise(function (resolve, reject) {

		archer.get('https://login.mailchimp.com/oauth2/metadata', {
			headers: {
				Authorization: 'OAuth '+params.access_token
			}
		})

		.spread(function (res, body) {
			if (res.statusCode && _.isObject(body) && _.isUndefined(body.error)) {
				return body;
			} else {
				return when.reject(new Error('Failed to get meta data from access token'));
			}
		})

		.done(function (body) {
			params.dc = body.dc; // add the data center in
			resolve(params);
		}, reject);

	});
};