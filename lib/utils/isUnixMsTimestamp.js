var _ = require('lodash');
var isNumeric = require('./isNumeric');

module.exports = function (value) {

  var stringValue = String(value);

  if (isNumeric(value) && stringValue.length === 13) {
    return true;
  }

  else {
    return false;
  }

};
