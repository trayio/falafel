
module.exports = function () {
	return when.promise(function (resolve, reject) {
		return resolve({
			a: 'Hello',
			b: 'World',
			c: 123
		});
	});
};
