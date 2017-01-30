/*
* Given an incoming event from the cluster service, validate it
* against the message's schema and against the global schema to
* ensure it has all the required parameters.
*
* If any parameters exist, return an array of them.
*/

module.exports = function (params, messageSchema, globalSchema) {

  // Get the required keys from the message schema
  var requiredKeys = [];
  if (messageSchema) {
    _.each(messageSchema.input || {}, function (obj, key) {
      if (obj.required === true) {
        requiredKeys.push(key);
      }
    });
  }

  // ... and from the global schema unless explicitly excluded
  var includeGlobals = ( _.isUndefined(messageSchema.globals) ? true : messageSchema.globals );
  if (includeGlobals && globalSchema) {
    _.each(globalSchema.input || {}, function (obj, key) {
      if (obj.required === true) {
        requiredKeys.push(key);
      }
    });
  }


  var missingParams = [];

  _.each(requiredKeys, function (key) {
    if (_.isUndefined(params[key]) || params[key] === '') {
      missingParams.push(key);
    }
  });

  return missingParams;

};
