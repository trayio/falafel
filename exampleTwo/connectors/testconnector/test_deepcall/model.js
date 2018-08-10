/* eslint-disable */
module.exports = function (input) {
	console.log(input);
	return when.promise(function (resolve, reject) {

		falafel.testconnector.testDateFormatter(_.assign(
			input,
			{
				deep: true
			}
		))

		.done(
			function (res) {
                console.log(res);
				resolve(res);
			},
			function (res) {
                console.log(res);
				reject(res);
			}
		);

	});
};
