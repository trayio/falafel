

module.exports = function (dateStringOrNumber) {

  if (!_.isString(dateStringOrNumber) && !_.isNumber(dateStringOrNumber)) {
    return false;
  }

  var parsed = new Date(dateStringOrNumber);

  if (_.isNaN(parsed) || (_.isString(dateStringOrNumber) && parsed.toString() === 'Invalid Date')) {
    return false;
  } else {
    return true;
  }

};
