var _                = require('lodash');
var when             = require('when');
var GenerateSchema = require('generate-schema');

module.exports = function (message, options) {

	return function (event) {

		return when.promise(function (resolve, reject) {

			when(message.dynamicOutput(event.body))

				.then(function (rawResponse) {

					if (!_.isObject(rawResponse)) return;

					/*  If $schema exists on top level, assume its a JSON schema and set it.
                    Else, GenerateSchema and then set.  */
					return {
						body: {
							output_schema: ( rawResponse['$schema'] ? rawResponse : GenerateSchema.json(rawResponse) )
						}
					};

				})

				.done(resolve, reject);

		});

	};

};
