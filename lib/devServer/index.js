

module.exports = function (apptalk) {

	var express = require('express');
	var bodyParser = require('body-parser');

	var app = express();

	// parse application/json
	app.use(bodyParser.json({
		limit: '1mb'
	}));

	// Listen for Postman messages (same port as legacy yart)
	app.post('/send/:workflowId', function (req, res) {
		apptalk([req.body], {}, function (err, result) {
			res.json(result[0]);
		});
	});

	app.listen(8989, function () {
		console.log('Connector dev server listening on port 8989');
	});

};
