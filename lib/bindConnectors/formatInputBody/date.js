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
      _.isString(schemaProperty.date_mask) &&
      (_.isString(value) || _.isNumber(value))
  ) {

    var dateValue = value;

    // If a unix timestamp in seconds is inputted, x1000 before inputting here
    if (isUnixTimestamp(dateValue)) {
      dateValue = Number(dateValue) * 1000;
    }

    var m = moment(dateValue);

    // Don't allow for invalid dates to be formatted
    if (!m.isValid()) {
      throw new Error('Date "'+value+'" is an invalid date format.');
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
