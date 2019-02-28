module.exports = function (error, params, body, res) {
	return (
		params.ahFlag ?
		when.resolve({ gotHeader: true, modelError: !!error }) :
		when.reject(new Error('Failed afterHeader'))
	);
};
