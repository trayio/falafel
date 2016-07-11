module.exports = {

	description: 'Trigger a tray workflow when someone subscribes to a list in MailChimp.',

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
