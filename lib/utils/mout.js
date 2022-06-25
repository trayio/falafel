const _ = require('lodash');

/*	All of the functions were copied from the source code of mout (v0.11.0),
	including the tests. Should be swapped out for lodash or native code later */

const HEX_CHARS = '0123456789abcdef'.split('');
function randHex (size) {
	size = size && size > 0 ? size : 6;
	let str = '';
	while (size--) {
		str += _.sample(HEX_CHARS);
	}
	return str;
}

function guid () {
	return (
		randHex(8)+'-'+
        randHex(4)+'-'+
        // v4 UUID always contain "4" at this position to specify it was
        // randomly generated
        '4' + randHex(3) +'-'+
        // v4 UUID always contain chars [a,b,8,9] at this position
        _.sample([ 8, 9, 'a', 'b' ]) + randHex(3)+'-'+
        randHex(12)
	);
}

function startsWith (str, prefix) {
	str = _.toString(str);
	prefix = _.toString(prefix);

	return str.indexOf(prefix) === 0;
}

// function setParam (url, paramName, value) {
// 	url = url || '';
//
// 	let re = new RegExp('(\\?|&)'+ paramName +'=[^&]*' );
// 	let param = paramName +'='+ encodeURIComponent( value );
//
// 	if ( re.test(url) ) {
// 		return url.replace(re, '$1'+ param);
// 	} else {
// 		if (url.indexOf('?') === -1) {
// 			url += '?';
// 		}
// 		if (url.indexOf('=') !== -1) {
// 			url += '&';
// 		}
// 		return url + param;
// 	}
//
// }
//
// const DEFAULT_DICTIONARY = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
// function randString (length, dictionary) {
// 	if (!_.isNumber(length) || length <= 0) {
// 		length = 8;
// 	}
//
// 	if (!_.isString(dictionary) || dictionary.length < 1) {
// 		dictionary = DEFAULT_DICTIONARY;
// 	}
//
// 	let result = '';
// 	const domain = dictionary.length - 1;
//
// 	while (length--) {
// 		result += dictionary[_.random(0, domain, false)];
// 	}
//
// 	return result;
// }

function replaceAccents (str) {
	str = _.toString(str);

	// verifies if the String has accents and replace them
	if (str.search(/[\xC0-\xFF]/g) > -1) {
		str = str
		.replace(/[\xC0-\xC5]/g, 'A')
		.replace(/[\xC6]/g, 'AE')
		.replace(/[\xC7]/g, 'C')
		.replace(/[\xC8-\xCB]/g, 'E')
		.replace(/[\xCC-\xCF]/g, 'I')
		.replace(/[\xD0]/g, 'D')
		.replace(/[\xD1]/g, 'N')
		.replace(/[\xD2-\xD6\xD8]/g, 'O')
		.replace(/[\xD9-\xDC]/g, 'U')
		.replace(/[\xDD]/g, 'Y')
		.replace(/[\xDE]/g, 'P')
		.replace(/[\xE0-\xE5]/g, 'a')
		.replace(/[\xE6]/g, 'ae')
		.replace(/[\xE7]/g, 'c')
		.replace(/[\xE8-\xEB]/g, 'e')
		.replace(/[\xEC-\xEF]/g, 'i')
		.replace(/[\xF1]/g, 'n')
		.replace(/[\xF2-\xF6\xF8]/g, 'o')
		.replace(/[\xF9-\xFC]/g, 'u')
		.replace(/[\xFE]/g, 'p')
		.replace(/[\xFD\xFF]/g, 'y');
	}
	return str;
}

// Remove non-word chars.
const PATTERN = /[^\x20\x2D0-9A-Z\x5Fa-z\xC0-\xD6\xD8-\xF6\xF8-\xFF]/g;
function removeNonWord (str) {
	str = _.toString(str);
	return str.replace(PATTERN, '');
}

function camelCase (str) {
	str = _.toString(str);
	str = replaceAccents(str);
	str = removeNonWord(str)
	.replace(/[-_]/g, ' ') //convert all hyphens and underscores to spaces
	.replace(/\s[a-z]/g, (res) => { return res.toUpperCase(); }) //convert first char of each word to UPPERCASE
	.replace(/\s+/g, '') //remove spaces
	.replace(/^[A-Z]/g, (res) => { return res.toLowerCase(); }); //convert first char to lowercase
	return str;
}

const CAMEL_CASE_BORDER = /([a-z\xE0-\xFF])([A-Z\xC0\xDF])/g;
function unCamelCase (str, delimiter) {
	if (delimiter == null) {
		delimiter = ' ';
	}

	str = _.toString(str);
	str = str.replace(CAMEL_CASE_BORDER, (str, c1, c2) => {
		return c1 + delimiter + c2;
	});
	str = str.toLowerCase(); //add space between camelCase text
	return str;
}

function sentenceCase (str) {
	str = _.toString(str);

	// Replace first char of each sentence (new line or after '.\s+') to
	// UPPERCASE
	return str.toLowerCase().replace(/(^\w)|\.\s+(\w)/gm, (res) => { return res.toUpperCase(); });
}

const WHITE_SPACES = [
	' ',
	'\n',
	'\r',
	'\t',
	'\f',
	'\v',
	'\u00A0',
	'\u1680',
	'\u180E',
	'\u2000',
	'\u2001',
	'\u2002',
	'\u2003',
	'\u2004',
	'\u2005',
	'\u2006',
	'\u2007',
	'\u2008',
	'\u2009',
	'\u200A',
	'\u2028',
	'\u2029',
	'\u202F',
	'\u205F',
	'\u3000'
];
function trim (str, chars) {
	str = _.toString(str);
	chars = chars || WHITE_SPACES;
	return _.trimStart(_.trimEnd(str, chars), chars);
}

function typecast (val) {
	switch (val) {
		case null:
		case 'null':
			return null;
		case 'true':
			return true;
		case 'false':
			return false;
		case undefined:
		case 'undefined':
			return undefined;
		case '':
			return val;
		default:
			return isNaN(val) ? val : parseFloat(val);
	}
}

module.exports = {
	randHex,
	guid,
	startsWith,
	// setParam,
	// randString,
	camelCase,
	unCamelCase,
	sentenceCase,
	trim,
	typecast,
};
