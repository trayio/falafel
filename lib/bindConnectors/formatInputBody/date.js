/*
* Auto format dates according to the format that the schema property wants.
*/
var moment = require('moment');
var isUnixTimestamp = require('../../utils/isUnixTimestamp');


module.exports = function (value, schemaProperty) {

  var allowedTypes = ['string', 'number'];
  var allowedDateFormats = ['date', 'time', 'datetime'];

  if (allowedTypes.indexOf(schemaProperty.type) !== -1 &&
      allowedDateFormats.indexOf(schemaProperty.format) !== -1 &&
      _.isString(schemaProperty.date_mask)) {

    // If a unix timestamp in seconds is inputted, x1000 before inputting here
    if (isUnixTimestamp(value)) {
      value = Number(value) * 1000;
    }

    var m = moment(value);

    // Don't allow for invalid dates to be formatted
    // TODO should we error here?
    if (!m.isValid()) {
      return  value;
    }

    var formatted = m.format(schemaProperty.date_mask);

    if ((schemaProperty.date_mask === 'X' || schemaProperty.date_mask === 'x') && schemaProperty.type === 'number') {
      formatted = Number(formatted);
    }

    return formatted;
  }

  else {
    return value;
  }

};
