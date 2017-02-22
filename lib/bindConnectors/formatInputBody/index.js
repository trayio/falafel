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

  // TODO make this work at any level of nesting
  _.each(newBody, function (value, key) {
    var newValue = value;

    var schemaProperty = _.get(schema, 'input.'+key);

    _.each(valueFormatters, function (formatValue) {
      newValue = formatValue(newValue, schemaProperty || {});
    });

    newBody[key] = newValue;
  });

  return newBody;

};
