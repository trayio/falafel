var when = require('when');

module.exports = function (message) {

	if (!_.isArray(message.model) && !_.isFunction(message.model) && _.isObject(message.model)) {

		var modelAfterSuccess = message.model.afterSuccess;

		message.model.afterSuccess = function (body, params, res) {

			return when.promise(function (resolve, reject) {

				when(
					( modelAfterSuccess ? modelAfterSuccess(body, params, res) : body )
				)

				.then(function (body) {
					return ( _.isArray(body) ? { results: body } : body );
				})

				.done(resolve, reject);

			});

		};

	}

	return message;

};
