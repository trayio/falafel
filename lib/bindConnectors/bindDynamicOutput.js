var _                = require('lodash');
var when             = require('when');
var GenerateSchema = require('generate-schema');

module.exports = function (message, options) {

    return function (event) {

        return when.promise(function (resolve, reject) {

            when(message.dynamicOutput(event.body.input))

            .then(function (rawResponse) {

                return {
                    output_schema: GenerateSchema.json(rawResponse)
                };

            })

            .done(resolve, reject);

        });

    }

};
