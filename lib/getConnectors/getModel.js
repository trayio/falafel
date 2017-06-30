var _  			  	  = require('lodash');
var getModelParameter = require('./getModelParameter');


module.exports = function (operation) {

	var model = operation.model.value;


	return {
		
		method: getModelParameter(model, 'method'),

		url: getModelParameter(model, 'url'),

		query: (function () {
			var query = {};
			_.each(getModelParameter(model, 'query'), function (param) {
				query[param.key] = param.value;
				// TODO handle arrays?
			});
			return query;
		}()),

		options: (function () {
			var headers = {};
			_.each(getModelParameter(model, 'headers'), function (header) {
				headers[header.name] = header.value;
				// override, not allowed multiple of same header currently
			});
			return headers;
		}()),

		expects: getModelParameter(model, 'expects'),

		notExpects: getModelParameter(model, 'not_expects'),

		// Add data, only if there's something explicitly declared 
		data: (function () {
			var data = getModelParameter(model, 'data');
			if (_.isObject(data) && _.keys(data).length === 0) {
				return;
			} else {
				// TODO need to handle the different data object type here
				return data;
			}
		}()),

		// Function only parameters
		before: getModelParameter(model, 'before'),
		afterSuccess: getModelParameter(model, 'after_success'),
		afterFailure: getModelParameter(model, 'after_failure'),

	};

}