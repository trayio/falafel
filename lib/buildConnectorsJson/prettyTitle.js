/*
* Given a key name for a message or connector, create a user friendly "title"
* parameter for the connectors.json.
*
* FYI - only ever done when not already declared.
*/
var sentenceCase = require('mout/string/sentenceCase');
var uncamelCase  = require('mout/string/uncamelCase');

module.exports = function (name) {
	return sentenceCase(uncamelCase(name).replace(/_|-/g, ' '));
};