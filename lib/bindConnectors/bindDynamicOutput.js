var _                = require('lodash');
var when             = require('when');
var GenerateSchema = require('generate-schema');

module.exports = function (message, options) {
    // console.log('Adding connector response handler:', message.name+'_response');

    return function (event) {

        return when.promise(function (resolve, reject) {

            var dynamicOutput = message.dynamicOutput(event.body.input);

            when(dynamicOutput)

            .then(function (rawResponse) {

                return {
                    output_schema: GenerateSchema.json(rawResponse)
                };

            })

            .done(resolve, reject);

        });

    }

};
