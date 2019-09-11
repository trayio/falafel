module.exports = {

	before: function (params) {
		if (params.beforeMod) {
			params.something = 'abc';
		}
	},

	method: 'get',

	url: '{{url}}',

	beforeRequest: function (request, params) {
		if (!params.flag) {
			throw new Error('Meh');
		}
	},

	expects: 200,

	afterSuccess: function (body, params,  res) {
		if (params.flag3) {
			throw new Error('afterSuccess Error');
		}
	},

	afterHeaders: function (error, params, body, res) {
		return ( params.flag2 ? { test: null, error: 'blah' } : {} );
	}

};
