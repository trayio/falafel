module.exports = function () {
	return require('fs').createReadStream(__dirname + '/sample.csv');
};
