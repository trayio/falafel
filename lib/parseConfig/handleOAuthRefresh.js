var _ = require('lodash');

module.exports = function (auth, methodFn) {

	// For non oauth connectors, just return the regular `afterFailure`
	if (auth.type !== 'oauth2') {
		return methodFn;	
	}


	// Intercept the `afterFailure` method, checking if the access token should be refreshed 
	// before running afterFailure on the global or the local level.
	else {
		return function (err, input) {

			// TODO refactor into a more generic method that `afterSuccess` can also use


			// Should refresh if EVERY condition matches
			var shouldRefresh = _.every(['statusCodes', 'bodyContains'], function (key) {
				
				var options = auth.oauthRefresh[key] || [];


				// Does the response have a refresh status code?
				if (key === 'statusCodes') {
					if (!options.length) {
						return true;
					}
					var statusCode = _.get(err, 'response.statusCode');
					return _.includes(options, statusCode);
				}


				// Does the response body contain text that indicates a refresh should happen? 
				else if (key === 'bodyContains') {

					// No checks? Return true
					if (!options.length) {
						return true;
					}

					// Get a stringified body
					var body = _.get(err, 'response.body');
					var bodyString;
					if (_.isObject(body)) {
					    bodyString = JSON.stringify(body);
					} else {
					    bodyString = String(body || '');
					}

					// If any of the body patterns provided are found in the body, then
					// return true to indicate that this condition has passed.
					return _.some(options, function (option) {
						return (bodyString.indexOf(option) !== -1);
					});

				}

				// COMING SOON - check for headers. Needs Threadneedle updates
				// Does the response have any of the headers provided?
				// else if (key === 'headers') {
				// 	var resHeaders = _.get(err, 'response');
				// 	console.log(resHeaders);
				// 	return _.some(headers, function (header) {

				// 		console.log(_.get(res, 'headers'));

				// 		// no details? it's not a condition, return true.
				// 		if (!header.name && !header.value) {
				// 			return true;
				// 		}

				// 		else if (header.name && !_.isUnefined(header.value)) {

				// 		}
				// 	});
				// }

			});


			if (shouldRefresh) {
				err.code = 'oauth_refresh';
				return;
			}

			else if (_.isFunction(methodFn)) {
				return methodFn.call(null, err, input);
			}
			

		};
	}

}