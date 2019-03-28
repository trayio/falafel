
var Falafel = require('./');

var jsonSchema = (new Falafel()).generateJsonSchema({
	directory: __dirname+'/example'
});

// console.log(require('util').inspect(jsonSchema, { depth: null }));

require('fs').writeFileSync(__dirname + '/runTest/connectors1.json', jsonSchema);
