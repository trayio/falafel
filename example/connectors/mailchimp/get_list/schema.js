module.exports = {

	input: _.extend(falafel.helpers.defaultInput, {

		id: {
			type: 'string',
			description: 'The MailChimp list ID.',
			required: true
		}

	})

};