/*
* Given an incoming event from the cluster service, validate it
* against the message's schema and against the global schema to
* ensure it has all the required parameters.
*
* If any parameters exist, return an array of them.
*
* NOTE: this only validates at the top level of the schema.
*/
var _ = require('lodash');


module.exports = function (params, messageSchema, globalSchema) {

    // Get the required keys from the message schema and the global schema
    var requiredKeys = [];

    var includeGlobals = true;

    // Add the required variables to the main array
    if (messageSchema) {

        // Set the message level required keys
        if (_.isArray(messageSchema.required)) {
            requiredKeys = _.map(
                messageSchema.required,
                function (reqKey) {
                    return {
                        key: reqKey,
                        type: messageSchema.input[reqKey].type
                    };
                }
            );
        }

        // LEGACY: use the older `required` parameter on the property level
        _.each(messageSchema.input || {}, function (schemaObj, key) {
            if (schemaObj.required === true) {
                requiredKeys.push({
                    key: key,
                    type: schemaObj.type
                });
            }
        });

        //if globals is specified locally, set it
        includeGlobals = ( _.isUndefined(messageSchema.globals) ? true : messageSchema.globals );
    }

    // ... and from the global schema unless explicitly excluded
    if (includeGlobals && globalSchema) {

        // Add in the global required keys
        if (_.isArray(globalSchema.required)) {
            requiredKeys = _.union(
                requiredKeys,
                _.map(
                    globalSchema.required,
                    function (reqKey) {
                        return {
                            key: reqKey,
                            type: globalSchema.input[reqKey].type
                        };
                    }
                )
            );
        }

        // LEGACY: add required field from the property level
        _.each(globalSchema.input || {}, function (schemaObj, key) {
            if (schemaObj.required === true) {
                requiredKeys.push({
                    key: key,
                    type: schemaObj.type
                });
            }
        });

    }


    return _.reduce(requiredKeys, function (missingParams, reqObj) {
        console.log(reqObj);
        var missingCheck = (
            _.isUndefined(params[reqObj.key]) ||
            params[reqObj.key] === '' ||
            ( _.isNull(params[reqObj.key]) && !_.includes(reqObj.type, 'null') )
        );
        if (missingCheck) {
            missingParams.push(reqObj.key);
        }
        return missingParams;
    }, []);

};
