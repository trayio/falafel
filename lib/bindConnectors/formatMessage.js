/*
* Given a `details` object containing details about the error,
* and the response that the method returned, return a message
* in the cluster service format.
*/
var _ = require('lodash');

module.exports = function (details, event, response) {

  details = details || {};

  return {
    id: event.id,
    header: {},
    body: response
  };

};
