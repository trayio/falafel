var _ 					= require('lodash');
var when 				= require('when');
var mout 				= require('mout');
var moment 			 	= require('moment');
var bindHelpers         = require('./bindHelpers');
var getConnectors       = require('./getConnectors');
var bindConnectors      = require('./bindConnectors');
var rawHttpRequest      = require('./rawHttpRequest');
var isLegacyConnector 	= require('./utils/isLegacy');
var parseConfig 		= require('./parseConfig');



var Falafel = function () {

	return {

		//This should be run independantly (i.e. no other falafel instance)
		generateJsonSchema: function (options) {

			var attemptGenerate = (
				options.bypassManualCheck ?
				true :
				options.isLegacy = isLegacyConnector(options.directory)
			);

			if (attemptGenerate) {

				// Set the globals
				global.falafel = {};
				global._ 	   = _;
				global.when    = when;
				global.moment  = moment;
				global.mout    = mout;

				rawHttpRequest.setupUtils();

				// If there's a `helpers` folder, make them global functions
				// for use in the connectors without having to deal with pesky
				// `require` statements
				bindHelpers(options.directory);

				// Bind the models and make the connector actually work
				var connectorsConfig = getConnectors(options.directory);

				connectorsConfig = rawHttpRequest.setupRawHttpRequestOperationConfig(connectorsConfig);

				// Build the connectors json
				var buildConnectorsJson = require('./buildConnectorsJson');
				var jsonSchema = buildConnectorsJson(null, connectorsConfig);

				delete global.falafel;
				delete global._;
				delete global.when;
				delete global.moment;
				delete global.mout;

				return jsonSchema;

			}

			return null;

		},

		wrap: function (options) {

			options.isLegacy = isLegacyConnector(options.directory);

			// Set the globals
			global.falafel = {};
			global._ 	   = _;
			global.when    = when;
			global.moment  = moment;
			global.mout    = mout;


			// Set the `dev` flag based on the environment variable
			if (_.isUndefined(options.dev)) {
				switch (process.env.NODE_ENV) {
					case 'development':
						options.dev = true;
						break;
					case 'test':
						options.test = true;
						break;
				}

			}


			var apptalk;


			// LEGACY: wrap the connector files
			if (options.isLegacy) {

				rawHttpRequest.setupUtils();

				// If there's a `helpers` folder, make them global functions
				// for use in the connectors without having to deal with pesky
				// `require` statements
				bindHelpers(options.directory);

				// 2. Bind the models and make the connector actually work
				var connectorsConfig = getConnectors(options.directory);

				connectorsConfig = rawHttpRequest.setupRawHttpRequestOperationConfig(connectorsConfig);

				// Add in the file upload & download stuff
				require('./fileHandler')(options);

				// Bind the connectors and return the handler
				apptalk = bindConnectors(connectorsConfig, options);

				// If the `dev` parameter is provided, then build the
				// connectors.json file from the configuration. Running
				// things with `node-dev app.js --dev` will mean that the server will
				// restart on any change - rebuilding immediately.
				if (options.dev === true) {

					// Build the connectors json
					var buildConnectorsJson = require('./buildConnectorsJson');
					buildConnectorsJson(options.directory, connectorsConfig);

					// Auto generate docs
					require('./docsGenerator')(options.directory);

				}

			}


			// NEW (ARTISAN)
			else {

				// Get the raw config json from the file
				var rawConfig = require(options.directory+'/config.json');

				// Parse it into a config that Falafel can understand
				var connectorsConfig = parseConfig(rawConfig);

				// Set the helpers to the `falafel` global
				falafel.helpers = connectorsConfig[0].helpers;

				// Add in the file upload & download stuff
				require('./fileHandler')(options);

				// Bind the connectors and return the handler
				apptalk = bindConnectors(connectorsConfig, options);

			}


			// Spin up a dev server for testing via Postman on dev
			if (options.dev === true) {
				require('./devServer')(apptalk);
			}



			return apptalk;

		}

	};

};


module.exports = Falafel;
