module.exports = {

	filter: function () {
		return true;
	},

	before: function (params, http) {
		return http.body;
	}

};
