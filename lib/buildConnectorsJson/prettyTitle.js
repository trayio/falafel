/*
* Given a key name for a message or connector, create a user friendly "title"
* parameter for the connectors.json.
*
* FYI - only ever done when not already declared.
*/
const { sentenceCase, unCamelCase }  = require('../utils/mout');

// Looks for words between word boundaries. Using `gi` so looks for matches globally and case insensitively
let matchWord = (word) => { return new RegExp(`\\b${word}\\b`, 'gi'); };

const IdRegex = matchWord('id');
const IdsRegex = matchWord('ids');
const UrlRegex = matchWord('url');
const DdlRegex = matchWord('ddl');

function handleNameEdgeCases (sentenceCasedTitle) {
	return sentenceCasedTitle
	.replace(IdRegex, 'ID')
	.replace(IdsRegex, 'IDs')
	.replace(UrlRegex, 'URL')
	.replace(DdlRegex, 'DDL');
}

module.exports = function (name) {
	if (name) {
		const title = sentenceCase(unCamelCase(name).replace(/_|-/g, ' '));
		return handleNameEdgeCases(title);
	}
};
