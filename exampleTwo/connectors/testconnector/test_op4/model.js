
module.exports = function (params) {
	return when.promise(function (resolve, reject) {

		if (params.test.nonExistent) {
			var nonExistent = params.test.test.test;
		}

		if (params.test.errorWithCode) {
			var newErr = new Error('Test error');
			newErr.code = 'blah';
			throw newErr;
		}

		return resolve({
			a: 'Hello',
			b: 'World',
			c: 123
		});
	});
};
