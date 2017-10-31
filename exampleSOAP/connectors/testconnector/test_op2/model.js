
module.exports = {

	method: 'GetRegistrations',

	data: {
		orderBy: 'ID DESC',
	},

	afterSuccess: falafel.helpers.afterSuccess

};
