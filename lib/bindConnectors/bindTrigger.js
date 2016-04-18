var bodyParser = require('body-parser');

module.exports = function (trigger, connector) {

	// Call the trigger function, and pass in middleware
	connector.trigger(trigger, function () {

		// Some connectors need the raw body for webhook verification
		connector.use(function(req, res, next) {
	    req.rawBody = '';
	    req.on('data', function(chunk) {
	    	req.rawBody += chunk;
	    });
	    next();
		});
		

		// Setup parsing for the different content types
		// See https://github.com/expressjs/body-parser for details.

		connector.use(bodyParser.urlencoded({
			extended: true,
			type: 'application/x-www-form-urlencoded'
		}));

		connector.use(bodyParser.json({
			type: 'application/json'
		}));

		connector.use(bodyParser.text({
			type: 'text/html'
		}));


	});

};
