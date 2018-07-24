var Falafel = require('./');

// Start the server
var apptalk = new Falafel().wrap({
	directory: __dirname+'/exampleArtisanTwo',
	//aws: require('./aws.json')
});

exports.apptalk = apptalk;
