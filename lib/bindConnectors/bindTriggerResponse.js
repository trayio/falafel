var _           = require('lodash');
var when        = require('when');
var qs          = require('qs')
var formatError = require('./formatError');


module.exports = function (message) {
  return function (event) {

    console.log('Adding connector response handler:', message.name+'_request');

    


    // If the `request` handler is a function, run it, ensuring it's a promise
    if (_.isFunction(message.request)) {
      return when(message.request(event.input, event.body.http));
    }

    else {
      throw new Error('The `response` file for this connector should be a function.');
    }

  };
};
