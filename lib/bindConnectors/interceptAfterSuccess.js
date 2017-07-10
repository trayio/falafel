
module.exports = function (message) {

	if (!_.isArray(message.model) && !_.isFunction(message.model) && _.isObject(message.model)) {

		var modelAfterSuccess = message.model.afterSuccess;

		message.model.afterSuccess = function (body, params, res) {

            body = ( _.isArray(body) ? { results: body } : body );

            return ( modelAfterSuccess ? modelAfterSuccess(body, params, res) : body );

        };
		
    }

	return message;

};
