var _ 							    = require('lodash');
var when 							  = require('when');
var bindHelpers         = require('./bindHelpers');
var getConnectors       = require('./getConnectors');
var bindConnectors      = require('./bindConnectors');



var Falafel = function () {

	return {
		wrap: function (options) {

			console.log('Wrapping connector in a falafel...');

			// Set the globals
			GLOBAL.falafel = {};
			GLOBAL._ 			 = _;
			GLOBAL.when    = when;

			// Set the `dev` flag based on the environment variable
			if (_.isUndefined(options.dev) && (process.env.NODE_ENV === 'development')) {
				options.dev = true;
			}

			// 1. If there's a `helpers` folder, make them global functions
			// for use in the connectors without having to deal with pesky
			// `require` statements
			bindHelpers(options.directory);

			// 2. Bind the models and make the connector actually work
			var connectorsConfig = getConnectors(options.directory);

			// 3. If the `dev` parameter is provided, then build the
			// connectors.json file from the configuration. Running
			// things with `node-dev app.js --dev` will mean that the server will
			// restart on any change - rebuilding immediately.
			if (options.dev === true) {
				var buildConnectorsJson = require('./buildConnectorsJson');
				buildConnectorsJson(options.directory, connectorsConfig);
			}



			// Bind the connectors and return the handler
			return bindConnectors(connectorsConfig);


		}

	};

};


module.exports = Falafel;


/*

	function(events, context, callback) {
	    for (var i = 0; i < events.length; i++) {
	        var event = events[i];
	        try {
	            var result = connector._messageHandlers[event.header.message](event.body, function(success) {
	                var replyMsg = {
	                    id: event.id,
	                    body: success
	                };
	                callback(null, [replyMsg]);
	            }, function(err) {
	                var replyMsg = {
	                    id: event.id,
	                    header: {
	                        error: true
	                    },
	                    body: {
	                        error_code: "unknown",
	                        message: "" + err
	                    }
	                };
	                callback(null, [replyMsg]);
	            });
	        } catch (e) {
	            var replyMsg = {
	                id: event.id,
	                header: {
	                    error: true
	                },
	                body: {
	                    error_code: "unknown",
	                    message: "" + e
	                }
	            };
	            callback(null, [replyMsg]);
	        }

	        // TODO don't handle just the first message
	        break;
	    }
	};

*/
