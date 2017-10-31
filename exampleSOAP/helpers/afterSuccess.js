
module.exports = function (results) {
	if (results === 'ok' || results[_.keys(results)[0]]['Success']) {
		return {
			hello: 'world'
		};
	}
};
