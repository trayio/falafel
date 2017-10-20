var _ = require('lodash');
var lowerCase = require('mout/string/lowerCase');
var trim = require('mout/string/trim');
var typecast = require('mout/string/typecast');



module.exports = function (auth, methodFn) {

	// For non oauth connectors, just return the regular `afterFailure`
	if (auth.type !== 'oauth2') {
		return methodFn;	
	}


	// Intercept the `afterFailure` method, checking if the access token should be refreshed 
	// before running afterFailure on the global or the local level.
	else {
		return function (err, input, res) {

			// TODO refactor into a more generic method that `afterSuccess` can also use


			// Should refresh if EVERY condition matches
			var shouldRefresh = _.every(['statusCodes', 'bodyContains', 'headers'], function (key) {

				var options = auth.oauthRefresh[key] || [];

				// If there are no conditions for this condition type, then 
				// mark the condition type as passed.
				if (!options.length) {
					return true;
				}


				// Does the response have a refresh status code?
				if (key === 'statusCodes') {
					var statusCode = _.get(err, 'response.statusCode');
					return _.includes(options, statusCode);
				}


				// Does the response body contain text that indicates a refresh should happen? 
				else if (key === 'bodyContains') {

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

				// Check for headers. Can check for the existence of a header,
				// or specific value.
				else if (key === 'headers') {

					var resHeaders = res && res.headers ? res.headers : {};

					// Enforce lowercase keys in the headers
					var lowerCasedHeaders = {};
					_.each(resHeaders, function (value, key) {
						lowerCasedHeaders[trim(lowerCase(key))] = value;
					});

					return _.some(options, function (header) {

						// no details? it's not a condition, return true.
						if (!header.name && !header.value) {
							return true;
						}

						// If the condition is just for the header existing, 
						// then check for the existence.
						else if (header.name && _.isUndefined(header.value)) {
							var key = lowerCase(trim(header.name));
							return _.has(lowerCasedHeaders, key);
						}

						// If the condition is a header key having a certain value, perform
						// a case insensitive, ignoring whitespace match.
						else if (header.name && !_.isUndefined(header.value)) {
							var key = lowerCase(trim(header.name));

							var requiredValue = _.get(lowerCasedHeaders, key);

							// note that header keys in the response are always lower case
							var actualValue = lowerCasedHeaders[key];


							if (_.isUndefined(actualValue)) {
								return false;
							} else {
								if (_.isString(actualValue)) {
									actualValue = typecast(actualValue);
								}
								if (_.isString(requiredValue)) {
									requiredValue = typecast(lowerCase(trim(requiredValue)));
								}

								return actualValue === requiredValue;
							}	
						}

					});
				}

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

};