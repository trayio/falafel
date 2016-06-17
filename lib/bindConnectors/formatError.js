/*
* Given a `details` object containing details about the error,
* and the original message that came in, return an error in the
* format desired by the cluster service.
*/
var _ = require('lodash');

module.exports = function (details, event) {

  details = details || {};

  details = _.defaults(details, {
    code: 'api_error',
    message: 'API error'
  });


  return {
    id: event.id,
    header: {
      error: true
    },
    body: details
  };

};
