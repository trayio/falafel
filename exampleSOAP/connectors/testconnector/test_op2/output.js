module.exports = function () {
	return when.promise(function (resolve, reject) {
		return resolve('Hello');
	});
};
