var Falafel = require('./');
var falafel = new Falafel();

// Start the server
falafel.wrap({
	directory: __dirname+'/example'
});