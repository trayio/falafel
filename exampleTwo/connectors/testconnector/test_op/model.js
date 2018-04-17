module.exports = {

	method: 'get',

	url: 'https://trayio-request-bin.herokuapp.com/z9m2iqz9',

	// beforeRequest: function () {
	// 	throw new Error('Meh');
	// },

	afterHeader: function (headers, params, body, res) {
		return { test: null };
		// return null;
	}

};
