

var Falafel = require('./');

// Start the server
var apptalk = new Falafel().wrap({
	directory: __dirname+'/exampleThree',
	aws: require('./aws.json')
});

exports.apptalk = apptalk;
