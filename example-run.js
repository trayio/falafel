

var Falafel = require('./');

// Start the server
var apptalk = new Falafel().wrap({
	directory: __dirname+'/example'
});

exports.apptalk = apptalk;




// FOR TESTING:
// ------------

var util = require('util');

// Send some exac
apptalk([{
  "id": "123-def",
  "header": {
    "message": "list_persons"
  },
  "body": {
    "access_token": "50349efe7fc91a5566b3f4ccc5a4c815ac98e400"
  }
}], {}, function (err, result) {

	console.log(util.inspect(result, false, null));

});
