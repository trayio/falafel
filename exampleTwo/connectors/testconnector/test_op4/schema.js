
module.exports = {

	title: 'Test operation',

	input: {

		test: {
			type: 'object',
			required: true
		},

	},

	output: {
		response: {
			type: 'string',
			default: 'response Hello world'
		},
	}


}
