var _  			  			= require('lodash');
var normalizeModelParameter = require('./normalizeModelParameter');


module.exports = function (operation) {

	var model = normalizeModelParameter(operation.model);


	if (_.isFunction(model)) {
		return model;
	} 

	else {
		return {

			method: model.method,
			
			url: model.url,

			query: (function () {
				var query = {};

				_.each(model.query, function (param) {
					if (_.isString(param.key) && _.trim(param.key)) {
						query[param.key] = param.value;	
					}
					// TODO handle arrays?
				});

				return query;
			}()),

			options: (function () {
				var headers = {};
				
				_.each(model.headers, function (header) {
					if (_.isString(header.name) && _.trim(header.name)) {
						headers[header.name] = header.value;	
					}
					
					// override, not allowed multiple of same header currently
				});

				return {
					headers: headers
				};
			}()),

			expects: model.expects,

			notExpects: model.notExpects,

			// Add data, only if there's something explicitly declared 
			data: model.data,

			// Function only parameters
			before: model.before,
			afterSuccess: model.afterSuccess,
			afterFailure: model.afterFailure,

		};
	}

};