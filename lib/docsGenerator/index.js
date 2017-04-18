/*
* Generate docs table for the Helpscout docs page. All this does it take all 
* of the operations, and creates an HTML table in the `docs.html` file.
*/

module.exports = function (directory) {

	var fs = require('fs');

	// Show the trigger afterwards
	var connectorsJson = _.sortBy(require(directory+'/connectors.json'), function (connector) {
		if ((connector.tags || []).indexOf('trigger') !== -1) {
			return 0;
		} else {
			return -1;
		}
	});

	// Build the HTML, using the template.ejs
	var templateFile   = fs.readFileSync(__dirname+'/template.ejs').toString();
	var compiled = _.template(templateFile);
	var html = compiled({
		connectors: connectorsJson
	});

	// Write to the `docs.html` file in the connector root (next to connectors.json)
	fs.writeFileSync(directory+'/docs.html', html);

};

