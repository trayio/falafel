var bodyParser = require('body-parser');

module.exports = function (trigger, connector) {

	// Call the trigger function, and pass in middleware
	connector.trigger(trigger, function () {

		// Setup parsing for the different content types
		// See https://github.com/expressjs/body-parser for details.

		connector.use(bodyParser.urlencoded({ 
			extended: true,
			type: 'application/x-www-form-urlencoded'
		}));

		connector.use(bodyParser.json({ 
			type: 'application/*' 
		}));

		connector.use(bodyParser.text({ 
			type: 'text/html' 
		}));


	});

};

