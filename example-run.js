var Falafel = require('./');

// Start the server
new Falafel().wrap({
	directory: __dirname+'/../connectors/private/intercom'
});


// console.log(falafel);