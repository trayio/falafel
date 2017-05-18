/*
* Auto format dates according to the format that the schema property wants.
*/
var moment = require('moment');
var trim   = require('mout/string/trim');
var isUnixSecondTimestamp = require('../../utils/isUnixSecondTimestamp');
var isUnixMsTimestamp = require('../../utils/isUnixMsTimestamp');
var isValidDate = require('../../utils/isValidDate');


module.exports = function (value, schemaProperty) {

  var allowedTypes = ['string', 'number'];
  var allowedDateFormats = ['date', 'time', 'datetime'];

  var schemaType = _.isArray(schemaProperty.type) ? schemaProperty.type : [schemaProperty.type];

  if (_.intersection(schemaType, allowedTypes).length > 0 &&
      allowedDateFormats.indexOf(schemaProperty.format) !== -1 &&
      _.isString(schemaProperty.date_mask) &&
      (_.isString(value) || _.isNumber(value))
      && trim(value) !== ''
  ) {

    var dateValue = value;

    if (dateValue === 'now') {
      dateValue = new Date().toISOString();
    }

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

    if (schemaProperty.date_mask.toLowerCase() === 'x' && schemaType.indexOf('number') !== -1) {
      formatted = Number(formatted);
    }

    return formatted;
  }

  else {
    return value;
  }

};
