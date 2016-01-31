var getConnectors  = require('./getConnectors');
var bindConnectors = require('./bindConnectors');


var Falafel = function () {

	return {
		wrap: function (options) {
			console.log('wrapping');

			console.log(options)

			// 1. Bind the models
			var connectorsConfig = getConnectors(options.directory);
			var connectors = bindConnectors(connectorsConfig);

			// 2. If the `dev` parameter is provided, then build the 
			// connectors.json file from the configuration. Running
			// things with `node-dev app.js --dev` will mean that the server will
			// restart on any change - rebuilding immediately.
			if (options.dev === true) {
				buildConnectorsJson(connectors);
			}


			console.log(connectors);



		}
	}
	
};


module.exports = Falafel;