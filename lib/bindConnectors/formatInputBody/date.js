/*
* Auto format dates according to the format that the schema property wants.
*/
var moment = require('moment');


module.exports = function (value, schemaProperty) {

  if (schemaProperty.date_format) {

    // TODO if a unix timestamp is inputted, x1000 before inputting here

    var m = moment(value);

    // Don't allow for invalid dates to be formatted
    // TODO should we error here?
    if (!m.isValid()) {
      return  value;
    }

    var formatted = m.format(schemaProperty.date_format);

    if (schemaProperty.date_format === 'X') {
      formatted = Number(formatted);
    }

    return formatted;
  }

  else {
    return value;
  }

};
