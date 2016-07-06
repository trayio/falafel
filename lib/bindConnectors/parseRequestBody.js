/*
* Middleware for request and response. Decodes the base64 encoded
* body, and parses according to the content type.
*
* The original body is set to `http.rawBody`.
*/
var _  = require('lodash');
var qs = require('qs');

module.exports = function (http) {

  // Decode and auto-parse the body
  if (http.body) {

    var contentType;
    var headers = http.headers;
    if (_.isArray(headers['Content-Type']) && headers['Content-Type']) {
      contentType = headers['Content-Type'][0];
    };

    var body = http.rawBody = new Buffer(http.body, 'base64').toString();

    http.body = parseBody(body, contentType);

  }

  return http;

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
