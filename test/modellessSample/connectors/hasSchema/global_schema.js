
module.exports = {

	input: {

		access_token: {
			type: 'string',
			advanced: true,
			required: true,
			defaultJsonPath: '$.auth.access_token'
		}

	}
	
};
