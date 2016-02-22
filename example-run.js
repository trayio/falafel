var Falafel = require('./');

// Start the server
new Falafel().wrap({
	directory: __dirname+'/example'
});


// console.log(falafel);