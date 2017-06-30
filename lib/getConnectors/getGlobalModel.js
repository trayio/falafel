var _  			  	  = require('lodash');
var getModelParameter = require('./getModelParameter');


module.exports = function (config) {

	var model = config.model.value;


	// Auth is a special parameter that gets merged into the query and 
	// headers parameters.
	var auth = getModelParameter(model, 'auth');


	var globalModel = {
		
		baseUrl: getModelParameter(model, 'base_url'),

		query: (function () {
			var query = {};

			// Add query headers, if specified.
			_.each(auth.query, function (queryParam) {
				headers[queryParam.key] = queryParam.value;
			});

			_.each(getModelParameter(model, 'query'), function (param) {
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

			_.each(getModelParameter(model, 'headers'), function (header) {
				headers[header.name] = header.value;
				// override, not allowed multiple of same header currently
			});

			return {
				headers: headers
			};
		}()),

		expects: getModelParameter(model, 'expects'),

		notExpects: getModelParameter(model, 'not_expects'),

		// Add data, only if there's something explicitly declared 
		data: getModelParameter(model, 'data'),

		// Function only parameters
		before: getModelParameter(model, 'before'),
		afterSuccess: getModelParameter(model, 'after_success'),
		afterFailure: getModelParameter(model, 'after_failure'),

	};


	return globalModel;

}