/*
* Given a `details` object containing details about the error,
* and the response that the method returned, return a message
* in the cluster service format.
*/
var _ = require('lodash');
var endsWith = require('mout/string/endsWith');

module.exports = function (event, response, version) {

  // var isRequest = endsWith(event.header.message, '_request');

  return {
    id: event.id,
    version: (version === 2) ? 2 : undefined, // only declare on v2
    header: {},
    body: response
  };

};
