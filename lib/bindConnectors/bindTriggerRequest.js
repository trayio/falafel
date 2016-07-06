var _           = require('lodash');
var when        = require('when');
var qs          = require('qs')
var formatError = require('./formatError');


module.exports = function (message) {
  return function (event) {

    console.log('Adding connector request handler:', message.name+'_request');

    // Decode and auto-parse the body
    if (event.body && event.body.http && event.body.http.body) {

      var contentType;
      var headers = event.body.http.headers;
      if (_.isArray(headers['Content-Type']) && headers['Content-Type']) {
        contentType = headers['Content-Type'][0];
      };

      var body = event.body.http.rawBody = new Buffer(event.body.http.body, 'base64').toString();

      event.body.http.body = parseBody(body, contentType);

    }


    // If the `request` handler is a function, run it, ensuring it's a promise
    if (_.isFunction(message.request)) {
      return when(message.request(event.input, event.body.http));
    }

    // If it's an object (simpler) type
    else if (_.isObject(message.request)) {
      return when.promise(function (resolve, reject) {

        var filter = message.request.filter || function () {
          return true;
        };

        var before = message.request.before || function (params, http) {
          return http.body;
        };

        // Determine if we should trigger the workflow
        var shouldTrigger = filter(event.input, event.body.http);

        // If we shouldn't, pass back the ignore message
        if (!shouldTrigger) {
          return reject({
            code: '#trigger_ignore',
            message: 'Ignore this request.'
          });
        }

        // if we should, run the `before` method, wrapping in a promise to allow
        // async usage, and then resolve/reject with the result
        else {
          when(before(event.input, event.body.http)).done(resolve, reject);
        }

      });
    }

    else {
      throw new Error('The `request` file for this connector should be a function or an object.');
    }

  };
};



function parseBody (body, contentType) {

  if (contentType === 'application/json') {
    return JSON.parse(body);
  }

  else if (contentType === 'application/x-www-form-urlencoded') {
    return extendedUrlParser(body);
  }

  // Parse as text/html - needed for anything? Don't think so.

  else {
    return body;
  }

}


/*
* Parse a URL encoded body
*/
function extendedUrlParser (body) {
  var parameterLimit = 1000;

  var paramCount = parameterCount(body, parameterLimit)
  var arrayLimit = Math.max(100, paramCount);

  return qs.parse(body, {
    allowPrototypes: true,
    arrayLimit: arrayLimit,
    depth: Infinity,
    parameterLimit: parameterLimit
  });
}



/**
 * Count the number of parameters, stopping once limit reached
 *
 * @param {string} body
 * @param {number} limit
 * @api private
 */

function parameterCount (body, limit) {
  var count = 0
  var index = 0

  while ((index = body.indexOf('&', index)) !== -1) {
    count++
    index++

    if (count === limit) {
      return undefined
    }
  }

  return count
}
