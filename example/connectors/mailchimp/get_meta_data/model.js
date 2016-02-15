module.exports = {

	url: 'https://login.mailchimp.com/oauth2/metadata',
	// url: 'http://localhost:8000/getMetaData.json',

	method: 'get',

	globals: false,

	options: {
		headers: {
			Authorization: 'OAuth {{access_token}}'
		}
	}

};