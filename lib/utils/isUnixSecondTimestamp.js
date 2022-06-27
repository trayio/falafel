var _ = require('lodash');

const { startsWith }  = require('./mout');
var isNumeric = require('./isNumeric');

module.exports = function (value) {

	var stringValue = String(value);

	if (isNumeric(value) &&
						stringValue.length === 10 &&
						(
							startsWith(stringValue, '1') ||
								startsWith(stringValue, '2') // in 2033!
						)
	) {
		return true;
	} else {
		return false;
	}

};
