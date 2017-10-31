
module.exports = function (n) {
	return !isNaN(parseFloat(n)) && isFinite(n);
};
