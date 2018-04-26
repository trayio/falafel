module.exports = {

	method: 'get',

	url: '{{url}}',

	beforeRequest: function (request, params) {
		if (!params.flag) {
			throw new Error('Meh');
		}
	},

	afterHeader: function (headers, params, body, res) {
		return ( params.flag2 ? { test: null } : null );
	}

};
