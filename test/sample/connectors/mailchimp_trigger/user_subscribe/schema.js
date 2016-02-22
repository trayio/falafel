module.exports = {

	input: {
		access_token: {
			type: 'string',
			required: true,
			advanced: true
		},
		list_id: {
			type: 'string',
			required: true
		},
		webhook_url: {
			type: 'string',
			required: true
		}
	}

};