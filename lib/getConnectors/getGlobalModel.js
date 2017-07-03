var _  			  			  = require('lodash');
var normalizeModelParameter = require('./normalizeModelParameter');


module.exports = function (config) {

	var model = normalizeModelParameter(config.model);


	// Auth is a special parameter that gets merged into the query and 
	// headers parameters.
	var auth = model.auth;


	var globalModel = {
		
		baseUrl: model.base_url,

		query: (function () {
			var query = {};

			// Add query headers, if specified.
			_.each(auth.query, function (queryParam) {
				query[queryParam.key] = queryParam.value;
			});

			_.each(model.query, function (param) {
				query[param.key] = param.value;
				// TODO handle arrays?
			});

			return query;
		}()),

		options: (function () {
			var options = {
				headers: {}
			};

			// Add auth headers, if specified.
			_.each(auth.headers, function (header) {
				options.headers[header.name] = header.value;
			});

			_.each(model.headers, function (header) {
				options.headers[header.name] = header.value;
				// override, not allowed multiple of same header currently
			});

			// Add basic auth, if specified
			if (!_.isUndefined(auth.username)) {
				options.username = auth.username;
			}
			if (!_.isUndefined(auth.password)) {
				options.password = auth.password;
			}

			return options;
		}()),

		expects: model.expects,

		notExpects: model.not_expects,

		// Add data, only if there's something explicitly declared 
		data: model.data,

		// Function only parameters
		before: model.before,
		afterSuccess: model.after_success,
		afterFailure: model.after_failure,

	};


	return globalModel;

}