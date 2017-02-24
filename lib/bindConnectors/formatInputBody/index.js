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

  var newBody = _.cloneDeep(body);

  _.each(newBody, function (value, key) {
    var schemaProperty = _.get(schema.input || {}, key)
    newBody[key] = formatInputValue(value, schemaProperty);
  });

  return newBody;

};



function formatInputValue(value, schemaProperty) {

  schemaProperty = schemaProperty || {};

  // The value after it's been passed through all of the fomratters
  var newValue = value;

  // console.log(value, schemaProperty);

  _.each(valueFormatters, function (formatValue) {
    newValue = formatValue(newValue, schemaProperty)
  });

  // If it's an array, get the items schema property and map to the new value passing each
  // of the items through the formatting function.
  if (_.isArray(newValue)) {
    var arraySchemaProperty = _.get(schemaProperty, 'items') || {};
    newValue = newValue.map(function (newArrayValue) {
      return formatInputValue(newArrayValue, arraySchemaProperty);
    });
  }

  // If it's an object, go through each of the properties and run each of them through
  // the formatting function.
  // TODO exculde all the non object types e.g. null
  else if (_.isObject(newValue)) {
    _.each(newValue, function (newObjectValue, objectKey) {
      var objectSchemaProperty = _.get(schemaProperty, 'properties.'+objectKey) || {};
      newValue[objectKey] = formatInputValue(newObjectValue, objectSchemaProperty);
    });
  }

  return newValue;

}
