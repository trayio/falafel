var _  			  			  = require('lodash');
var denormalizeModelParameter = require('./denormalizeModelParameter');


module.exports = function (config) {

	var model = denormalizeModelParameter(config.model);


	// Auth is a special parameter that gets merged into the query and 
	// headers parameters.
	var auth = model.auth;


	var globalModel = {
		
		baseUrl: model.base_url,

		query: (function () {
			var query = {};

			// console.log(auth);

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
			var headers = {};

			// Add auth headers, if specified.
			_.each(auth.headers, function (header) {
				headers[header.name] = header.value;
			});

			_.each(model.headers, function (header) {
				headers[header.name] = header.value;
				// override, not allowed multiple of same header currently
			});

			return {
				headers: headers
			};
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