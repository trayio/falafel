
module.exports = {

	method: 'post',

	url: 'https://{{dc}}.api.mailchimp.com/2.0/lists/webhook-del',

	data: {
		apikey: '{{access_token}}',
		id: '{{list_id}}',
		url: '{{webhook_url}}'
	}

};