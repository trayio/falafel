/*
* Determines whether an error represents a failed API *response* - that is, the
* API actually replied, and that reply failed the connector's `expects` or
* `notExpects` configuration.
*
* A response status code is the tell: threadneedle only populates
* `response.statusCode` on the error when a response came back. Everything else
* reaching the error path had no usable response, and so is not an API response
* error:
*  - errors thrown in `before`, `beforeRequest` or `afterSuccess` hooks
*    (e.g. invalid user input, the payload size guard)
*  - transport level failures (ECONNREFUSED, ENOTFOUND, socket hang up - the
*    last of which threadneedle reports with an empty `response`)
*  - connector bugs (TypeError, ReferenceError, SyntaxError)
*/
var _ = require('lodash');

module.exports = function (error) {
	return !_.isUndefined(_.get(error, 'response.statusCode'));
};
