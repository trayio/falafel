var _                = require('lodash');
var when             = require('when');
var GenerateSchema = require('generate-schema');

module.exports = function (message, options) {
    // console.log('Adding connector response handler:', message.name+'_response');

    var accumulate = message.schema.dynamic_accumulation;

    return function (event) {

        return when.promise(function (resolve, reject) {

            var dynamicOutput = message.dynamicOutput(event.body.input),
                currentSchema = event.output || GenerateSchema.json(message.schema.output) || {};

            when(dynamicOutput)

            .then(function (rawResponse) {

                var generatedSchema = GenerateSchema.json(rawResponse);

                if (accumulate)
                    generatedSchema = require('./mergeSchemas')(currentSchema, dynamicOutput);

                return {
                    output_schema: generatedSchema
                };

            })

            .done(resolve, reject);

        });

    }

};
