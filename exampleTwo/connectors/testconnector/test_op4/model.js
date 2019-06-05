
module.exports = function (params) {
	var nonExistent = params.test.test.test;
	return when.promise(function (resolve, reject) {
		return resolve({
			a: 'Hello',
			b: 'World',
			c: 123
		});
	});
};
