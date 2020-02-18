/*
* Given a key name for a message or connector, create a user friendly "title"
* parameter for the connectors.json.
*
* FYI - only ever done when not already declared.
*/
var sentenceCase = require('mout/string/sentenceCase');
var unCamelCase  = require('mout/string/unCamelCase');

// Looks for words between word boundaries. Using `gi` so looks for matches globally and case insensitively
let matchWord = (word) => { return new RegExp(`\\b${word}\\b`, 'gi'); };

const IdRegex = matchWord('id');
const IdsRegex = matchWord('ids');
const UrlRegex = matchWord('url');

const handleNameEdgeCases = (sentenceCasedTitle) => {
	const nameUpperId = sentenceCasedTitle.replace(IdRegex, 'ID');
	const nameUpperIds = nameUpperId.replace(IdsRegex, 'IDs');
	return nameUpperIds.replace(UrlRegex, 'URL');
};

module.exports = function (name) {
	if (name) {
		const title = sentenceCase(unCamelCase(name).replace(/_|-/g, ' '));
		return handleNameEdgeCases(title);
	}
};