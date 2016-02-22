
module.exports = {

	method: 'post',

	url: 'https://{{dc}}.api.mailchimp.com/2.0/lists/webhook-add',

	data: {
		id: '{{list_id}}',
		url: '{{webhook_url}}',
		apikey: '{{access_token}}',
		actions: {
			subscribe: false,
			unsubscribe: false,
			profile: false,
			cleaned: false,
			upemail: false,
			campaign: false
		},
		sources: {
			user: true,
			api: true,
			admin: true
		}
	}

};


// module.exports = function (params) {

// };


// module.exports = function (params) {

	

// };