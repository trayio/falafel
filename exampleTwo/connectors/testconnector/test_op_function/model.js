module.exports = function (params) {
	return (
		params.modelFlag ?
		when.resolve(params) :
		when.reject(new Error('Failed function'))
	);
};
