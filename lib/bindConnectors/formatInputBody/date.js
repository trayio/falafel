/*
* Auto format dates according to the format that the schema property wants.
*/
var moment = require('moment');
var isUnixSecondTimestamp = require('../../utils/isUnixSecondTimestamp');
var isUnixMsTimestamp = require('../../utils/isUnixMsTimestamp');
var isValidDate = require('../../utils/isValidDate');


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
    if (isUnixSecondTimestamp(dateValue)) {
      dateValue = Number(dateValue) * 1000;
    }

    else if (isUnixMsTimestamp(dateValue)) {
      dateValue = Number(dateValue);
    }

    // Throw an error if an invalid date has been inputted
    if (!isValidDate(dateValue)) {
      throw new Error('Date "'+value+'" is an invalid date format.');
      return;
    }

    var m = moment(dateValue);

    var formatted = m.format(schemaProperty.date_mask);

    if (schemaProperty.date_mask.toLowerCase() === 'x' && schemaProperty.type === 'number') {
      formatted = Number(formatted);
    }

    return formatted;
  }

  else {
    return value;
  }

};
