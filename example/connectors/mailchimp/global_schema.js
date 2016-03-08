/*
* Schema to apply to every message (prepended)
*/

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