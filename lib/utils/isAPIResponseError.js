/*
* Determines whether an error represents an API *response* that failed
* validation - that is, the API actually replied, and that reply failed the
* connector's `expects` or `notExpects` configuration.
*
* A response status code is the tell: threadneedle only populates
* `response.statusCode` on the error when a response came back. Everything else
* reaching the error path had no usable response, and so is not an API response
* error:
*  - errors thrown in threadneedle pre-request hooks or `afterSuccess`
*  - transport level failures, which threadneedle may report with an empty
*    `response`
*  - connector bugs
*/
var _ = require('lodash');

module.exports = function (error) {
	return !_.isUndefined(_.get(error, 'response.statusCode'));
};
