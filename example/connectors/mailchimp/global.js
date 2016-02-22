/*
* Global config to apply to threadneedle. Called via `threadneedle.global`
*/
var when   = require('when');
var _ 		 = require('lodash');

module.exports = {

	// url: 'https://{{dc}}.api.mailchimp.com/2.0',
	url: 'http://localhost:8000',

	expects: 200,

	before: function (params) {
		return when.promise(function (resolve, reject) {

			falafel.mailchimp.getMetaData(params).done(function (result) {
				params.dc = result.dc;
				resolve();
			}, reject);

		});
	}

	// afterFailure: function (err) {
	// 	console.log(err);
 //    // if (err.response.statusCode === 403) {
 //    //   err.code = 'oauth_refresh';
 //    // }
 //  }

};