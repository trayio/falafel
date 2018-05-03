

var Falafel = require('./');

// Start the server
var apptalk = new Falafel().wrap({
	directory: __dirname+'/exampleTwo',
	//aws: require('./aws.json')
});

exports.apptalk = apptalk;
