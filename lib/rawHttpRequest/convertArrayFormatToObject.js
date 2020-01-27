module.exports = function convertArrayFormatToObject (targetArray) {
	return _.reduce(targetArray, (acc, { key, value }) => {
		return ( acc[key] = value, acc );
	}, {});
};
