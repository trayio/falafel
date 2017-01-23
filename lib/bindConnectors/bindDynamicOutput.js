var _                = require('lodash');
var when             = require('when');
var qs               = require('qs')
var parseRequestBody = require('./parseRequestBody');
var GenerateSchema = require('generate-schema');


module.exports = function (message, options) {
    // console.log('Adding connector response handler:', message.name+'_response');

    var accumulate = message.schema.dynamic_accumulation;

    return function (event) {

        return when.promise(function (resolve, reject) {

            var dynamicOutput = message.dynamicOutput(event.body.input),
                currentSchema = event.body.output || GenerateSchema.json(message.schema.output) || {};

            when(dynamicOutput)

            .then(function (rawResponse) {

                var generatedSchema = GenerateSchema.json(rawResponse);

                //TODO: this logic
                if (accumulate) {

                    function mergeSchema(schemaA, schemaB) {

                        var keysA = _.keys(schemaA),
                            keysB = _.keys(schemaB),
                            commonKeys = _.intersection(keysA, keysB),
                            uniqueAKeys = _.difference(keysA, commonKeys),
                            uniqueBKeys = _.difference(keysB, commonKeys);

                        var finalSchema = _.reduce(commonKeys, function (schemaObject, schemaKey) {

                            if (schemaA[schemaKey].type === schemaB[schemaKey].type) {
                                schemaObject[schema]
                            }

                            return schemaObject;

                        }, {});




                    }

                }

                return {
                    output_schema: generatedSchema
                };

            })

            .done(resolve, reject);

        });

    }

};
