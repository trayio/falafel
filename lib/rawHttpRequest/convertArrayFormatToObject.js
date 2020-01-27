module.exports = function (targetArray) {
	return _.reduce(targetArray, (acc, { key, value }) => {
		return ( acc[key] = value, acc );
	}, {});
};
