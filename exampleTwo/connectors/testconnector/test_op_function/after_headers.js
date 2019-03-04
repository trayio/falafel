module.exports = function (error, params, body) {
	return (
		params.ahFlag ?
		when.resolve({ gotHeader: true, modelError: !!error }) :
		when.reject(new Error('Failed afterHeader'))
	);
};
