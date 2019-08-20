

var Falafel = require('./');

// Start the server
var apptalk = new Falafel().wrap({
	directory: __dirname+'/exampleTrigger'
});

exports.apptalk = apptalk;
