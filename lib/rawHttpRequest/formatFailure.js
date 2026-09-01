/*
* `afterFailure` handler for the raw HTTP request operation.
*
* Where the API actually responded, but that response failed the connector's
* `expects`/`notExpects` configuration, threadneedle's validation error carries
* only the status code and body. This copies the response headers onto the
* error too, so that the caller can inspect them - rate limit headers,
* correlation ids and the like are most useful precisely when a call has
* failed.
*
* NOTE: the success path equivalent is `formatOutput.js`. That file is public
* API (exposed as `falafel.utils.rawHttpRequest.formatOutput` and documented
* for connector authors), so it is deliberately left untouched rather than
* refactored to serve both paths. Keep the two in step when changing the shape
* of the response envelope.
*/
const _ = require('lodash');

const isAPIResponseError = require('../utils/isAPIResponseError.js');

module.exports = function (error, params, res) {

	if (isAPIResponseError(error)) {
		error.response.headers = _.get(res, 'headers', {});
	}

	return error;

};
