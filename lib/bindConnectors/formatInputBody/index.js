/*
* This folder contains a series of "formatters" which can be used to format
* the data in any way they choose BEFORE it makes it to the connector method
* itself.
*
* A common use-case here is automatically formatting date inputs to the expected
* input via the API.
*
* Each formatter will have the message `body` passed to it, as well as the `schema.js`
* input for the corresponding message.
*/


var valueFormatters = [
  require('./date')
];


module.exports = function (body, schema) {

  schema = schema || {};

  // Don't edit the original body coming in, the formatted object should be entirely new.
  // TODO or should it??
  var newBody = _.cloneDeep(body);

  console.log(schema.input);

  _.each(newBody, function (value, key) {
    var schemaProperty = _.get(schema.input || {}, key)
    newBody[key] = formatInputValue(value, schemaProperty);
  });

  return newBody;

};



/*
* Recursive function to take a value inputted, along with it's schema property,
* and run it through each of the formatters. If a value is an object or array, go
* through each of it's items/properties and run them through the formatters too.
*
* Schema properties will be passed alongside the values to the formatters, if found.
* If not found, they will be passed as blank objects.
*/
function formatInputValue(value, schemaProperty) {

  schemaProperty = schemaProperty || {};

  // Ignore value for oneOfs
  if (_.isArray(schemaProperty.oneOf)) {
    return value;
  }

  // console.log(value, schemaProperty);

  _.each(valueFormatters, function (runThroughFormatter) {
    value = runThroughFormatter(value, schemaProperty)
  });

  // If it's an array, get the items schema property and map to the new value passing each
  // of the items through the formatting function.
  if (_.isArray(value)) {
    var arraySchemaProperty = _.get(schemaProperty, 'items') || {};
    value = value.map(function (newArrayValue, index) {
      if (_.isArray(arraySchemaProperty)) {
        var itemSchemaProperty = arraySchemaProperty[index] || {};
        return formatInputValue(newArrayValue, itemSchemaProperty);
      } else {
        return formatInputValue(newArrayValue, arraySchemaProperty);
      }
    });
  }

  // If it's an object, go through each of the properties and run each of them through
  // the formatting function.
  // TODO exculde all the non object types e.g. null
  else if (_.isObject(value)) {
    _.each(value, function (newObjectValue, objectKey) {
      var objectSchemaProperty = _.get(schemaProperty, 'properties.'+objectKey) || {};
      value[objectKey] = formatInputValue(newObjectValue, objectSchemaProperty);
    });
  }

  // Return back the edited value
  return value;

}
