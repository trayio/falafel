/*
* Given a key name for a message or connector, create a user friendly "title"
* parameter for the connectors.json.
*
* FYI - only ever done when not already declared.
*/
var sentenceCase = require('mout/string/sentenceCase');
var unCamelCase  = require('mout/string/unCamelCase');

module.exports = function (name) {
	return sentenceCase(unCamelCase(name).replace(/_|-/g, ' '));
};