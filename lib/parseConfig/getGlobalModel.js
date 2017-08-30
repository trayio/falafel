var _  			  			= require('lodash');
var normalizeModelParameter = require('./normalizeModelParameter');
var handleOAuthRefresh      = require('./handleOAuthRefresh');


module.exports = function (config) {

	var model = normalizeModelParameter(config.model);


	if (_.isFunction(model)) {
		return model;
	} 

	else {

		// Auth is a special parameter that gets merged into the query and 
		// headers parameters.
		var auth = model.auth;


		var globalModel = {
			
			baseUrl: model.baseUrl,

			query: (function () {
				var query = {};

				// Add query headers, if specified.
				_.each(auth.query, function (param) {
					if (_.isString(param.key) && _.trim(param.key)) {
						query[_.trim(param.key)] = param.value;	
					}
				});

				_.each(model.query, function (param) {
					if (_.isString(param.key) && _.trim(param.key)) {
						query[_.trim(param.key)] = param.value;	
					}
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
					if (_.isString(header.name) && _.trim(header.name)) {
						options.headers[_.trim(header.name)] = header.value;	
					}
				});

				_.each(model.headers, function (header) {
					if (_.trim(header.name)) {
						options.headers[_.trim(header.name)] = header.value;	
					}
					// override, not allowed multiple of same header currently
				});

				// Add basic auth, if specified
				if (_.isString(auth.username) && _.trim(auth.username)) {
					options.username = auth.username;
				}
				if (_.isString(auth.password) && _.trim(auth.password)) {
					options.password = auth.password;
				}

				return options;
			}()),

			expects: model.expects,

			notExpects: model.notExpects,

			// Add data, only if there's something explicitly declared 
			data: model.data,

			// Function only parameters
			before: model.before,
			afterSuccess: model.afterSuccess,
			afterFailure: handleOAuthRefresh(model.auth, model.afterFailure),

			// TODO handle oauth refresh on success too?

		};


		return globalModel;

	}
}