module.exports = {

	title: 'Raw HTTP request (advanced)',

	description: 'Perform a raw HTTP request with some pre-configuration and processing by the connector, such as authentication.',

	globals: false,

	input: {

		method: {
			type: 'string',
			description: 'The HTTP verb to perform the request with',
			required: true,
			enum: [
				'GET',
				'POST',
				'PATCH',
				'PUT',
				'DELETE',
				'HEAD',
				'OPTIONS'
			],
			default: 'GET'
		},

		url: {
			description: 'The URL to make the request with.',
			oneOf: [

				{
					title: 'Endpoint',
					type: 'object',
					required: true,
					properties: {

						endpoint: {
							type: 'string',
							description: 'The endpoint to call in relation to the base URL used by the connector. E.g: `/department/marketing/employees`.',
							required: true
						}

					}
				},

				{
					title: 'Full URL',
					type: 'object',
					required: true,
					properties: {

						full_url: {
							type: 'string',
							description: 'The full URL to make the request against. Must begin with `http://` or `https://`.',
							required: true
						}

					}
				}

			],
			required: true
		},

		headers: {
			description: 'Headers to be included in the request.',
			type: 'array',
			items: {
				title: 'Header',
				description: 'An individual header.',
				type: 'object',
				properties: {
					key: {
						description: 'The header key.',
						type: 'string',
						required: true,
					},
					value: {
						description: 'The header value.',
						type: 'string',
						required: true,
					},
				},
			},
		},

		query_parameters: {
			title: 'Query Parameters',
			description: 'Query parameters to be supplied with the request.',
			type: 'array',
			items: {
				title: 'Query Parameter',
				description: 'An individual query parameter.',
				type: 'object',
				properties: {
					key: {
						description: 'The parameter key.',
						type: 'string',
						required: true,
					},
					value: {
						description: 'The parameter value.',
						type: 'string',
						required: true,
					},
				},
			},
		},

		body: {
			title: 'Body Type',
			description: 'The body type of the request. Select `none` to not send a body.',
			additionalProperties: false,
			required: true,
			oneOf: [

				{
					title: 'raw',
					type: 'object',
					description: 'The raw body to perform the request with.',
					additionalProperties: false,
					required: true,
					properties: {
						raw: {
							type: [ 'string', 'object' ],
							title: 'raw',
							description: 'Select either `string` to send the body as defined, or `object` to send the body as a JSON object.',
							format: 'code',
							additionalProperties: true,
							required: true
						},
					},
				},

				{
					title: 'form-data',
					description: 'The form data body to perform the request with.',
					type: 'object',
					additionalProperties: false,
					required: true,
					properties: {
						form_data: {
							type: 'object',
							title: 'form-data',
							description: 'The form data to perform the request with.',
							additionalProperties: {
								oneOf: [
									{
										title: 'Text',
										description: 'A text value for the property in the form data body.',
										type: 'string',
									},

									{
										title: 'File',
										description: 'The tray file object to retrieve the contents of and set it as the value for the property in the form data body.',
										type: 'object',
										format: 'file',
										additionalProperties: false,
									},
								],
							},
							required: true
						},
					},
				},

				{
					title: 'form-urlencoded',
					description: 'The form urlencoded body to perform the request with.',
					type: 'object',
					additionalProperties: false,
					required: true,
					properties: {
						form_urlencoded: {
							type: 'object',
							title: 'form-urlencoded',
							description: 'The form url encoded data to perform the request with.',
							additionalProperties: {
								type: 'string',
							},
							required: true
						},
					},
				},

				{
					title: 'binary',
					description: 'The file to set as the body to perform the request with.',
					type: 'object',
					additionalProperties: false,
					required: true,
					properties: {
						binary: {
							type: 'object',
							title: 'binary',
							description: 'The binary from a file to perform the request with.',
							format: 'file',
							required: true
						},
					},
				},

				{
					title: 'none',
					description: 'Select this option to not send a body in the request.',
					type: 'object',
					required: true,
					properties: {
						none: {
							type: 'null',
							description: 'Send no body in the request.',
							required: true
						},
					},
				},

			],
		},

		include_raw_body: {
			type: 'boolean',
			description: 'Include raw body in the operation\'s response',
			required: true,
			advanced: true,
			default: false
		},

		parse_response: {
			type: 'string',
			description: 'Automatically parse incoming data to Javascript objects if possible',
			enum: [
				{
					text: 'All',
					description: 'Automatically parse all content types if possible.',
					value: 'true',
				},
				{
					text: 'JSON only',
					description: 'Only parse JSON content, leave other types as text.',
					value: 'json',
				},
				{
					text: 'XML only',
					description: 'Only parse XML content, leave other types as text.',
					value: 'xml',
				},
				{
					text: 'None',
					description: 'Always return text.',
					value: 'false',
				},
			],
			default: 'true',
			required: true,
			advanced: true,
		},

	},

	output: {
		response: {
			type: 'object',
			properties: {

				status_code: {
					type: 'number',
				},

				headers: {
					type: 'object',
				},

				body: {
					type: [
						'string',
						'number',
						'object',
						'array',
						'boolean',
						'null',
					],
				},

			}
		}
	}

};
