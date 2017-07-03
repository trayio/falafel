/*
* Given an incoming event from the cluster service, validate it
* against the message's schema and against the global schema to
* ensure it has all the required parameters.
*
* If any parameters exist, return an array of them.
*/
var _ = require('lodash');


module.exports = function (params, messageSchema, globalSchema) {

    // Get the required keys from the message schema
    var requiredKeys = [],
        includeGlobals = true;
    if (messageSchema) {
        _.each(messageSchema.input || messageSchema.properties || {}, function (obj, key) {
            if (obj.required === true) {
                requiredKeys.push(key);
            }
        });
        //if globals is specified locally, set it
        includeGlobals = ( _.isUndefined(messageSchema.globals) ? true : messageSchema.globals );
    }

    // ... and from the global schema unless explicitly excluded
    if (includeGlobals && globalSchema) {
        _.each(globalSchema.input || globalSchema.properties || {}, function (obj, key) {
            if (obj.required === true) {
                requiredKeys.push(key);
            }
        });
    }


    return _.reduce(requiredKeys, function (missingParams, key) {
        if (_.isUndefined(params[key]) || params[key] === '') {
            missingParams.push(key);
        }
        return missingParams
    }, []);

};
