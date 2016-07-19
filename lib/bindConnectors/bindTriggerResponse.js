var _                = require('lodash');
var when             = require('when');
var qs               = require('qs')
var parseRequestBody = require('./parseRequestBody');


module.exports = function (message) {
  console.log('Adding connector response handler:', message.name+'_response');

  return function (event) {

    // Decode and auto-parse the body
    event.body.http = parseRequestBody(event.body.http);

    // Run and ensure it's a promise
    return when(message.response(event.input, event.body.http, event.body.reply || {}));

  };
};
