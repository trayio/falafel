var _                = require('lodash');
var when             = require('when');
// var qs               = require('qs');
// var formatError      = require('./formatError');
var parseRequestBody = require('./parseRequestBody');


module.exports = function (message, options) {
	// console.log('Adding connector request handler:', message.name+'_request');

	return function (event) {

		// Decode and auto-parse the body
		event.body.http = parseRequestBody(event.body.http, options);

		// If the `request` handler is a function, run it, ensuring it's a promise
		if (_.isFunction(message.request)) {
			return when(message.request(event.body.input, event.body.http));
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

				var reply = message.request.reply || function () {
					return; // undefined is ok
				};


				// Determine if we should trigger the workflow
				when(filter(event.body.input, event.body.http))

				.then(function (shouldTrigger) {
					return (
						!shouldTrigger ?
						// If we shouldn't, pass back the ignore message
						when.reject({
							code: '#trigger_ignore',
							message: 'Ignore this request.'
						}) :
						// if we should, run the `before` method, wrapping in a promise to allow
						// async usage, and then resolve/reject with the result
						when(before(event.body.input, event.body.http))
					);
				})

				.done(
					function (tweaked) {
						// If something new has been returned, use that. Otherwise
						// use the original body (which may have been tweaked via reference)
						var output = (tweaked || event.body.http.body);

						// Get out the reply data
						when(reply(event.body.input, event.body.http, output))

						.done(
							function (replyHttp) {

								if (replyHttp && replyHttp.body) {
									replyHttp.body = _.isObject(replyHttp.body) ? JSON.stringify(replyHttp.body) : replyHttp.body;
									replyHttp.body = new Buffer(replyHttp.body).toString('base64');
								}

								resolve({
									version: 2,
									headers: {},
									body: {
										output: output,
										http: replyHttp
									}
								});

							},
							reject
						);

					},
					reject
				);

			})

			.catch(function (body) {
				//Catch will resolve the promise, ergo explicitly reject again
				return when.reject({
					headers: {},
					body: body
				});
			});
		}

		else {
			throw new Error('The `request` file for this connector should be a function or an object.');
		}

	};
};
