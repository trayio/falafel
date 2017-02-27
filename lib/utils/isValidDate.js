

module.exports = function (dateStringOrNumber) {

  var parsed = new Date(dateStringOrNumber);

  if (_.isNaN(parsed) || (_.isString(dateStringOrNumber) && parsed.toString() === 'Invalid Date')) {
    return false;
  } else {
    return true;
  }

};
