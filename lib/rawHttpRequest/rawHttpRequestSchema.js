module.exports = {

	title: 'Raw HTTP Request (Advanced)',

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
			additionalProperties: false,
			oneOf: [

				{
					title: 'raw',
					type: 'object',
					description: 'The raw body to perform the request with.',
					additionalProperties: false,
					properties: {
						raw: {
							type: [ 'string', 'object' ],
							title: 'raw',
							format: 'code',
						},
					},
				},

				{
					title: 'form-data',
					type: 'object',
					additionalProperties: false,
					properties: {
						form_data: {
							type: 'object',
							title: 'form-data',
							description: 'The form data to perform the request with.',
							additionalProperties: {
								oneOf: [
									{
										title: 'Text',
										type: 'string',
									},

									{
										title: 'File',
										type: 'object',
										format: 'file',
										additionalProperties: false,
									},
								],
							},
						},
					},
				},

				{
					title: 'form-urlencoded',
					type: 'object',
					additionalProperties: false,
					properties: {
						form_urlencoded: {
							type: 'object',
							title: 'form-urlencoded',
							description: 'The form url encoded data to perform the request with.',
							additionalProperties: {
								type: 'string',
							},
						},
					},
				},

				{
					title: 'binary',
					type: 'object',
					additionalProperties: false,
					properties: {
						binary: {
							type: 'object',
							title: 'binary',
							description: 'The binary from a file to perform the request with.',
							format: 'file',
						},
					},
				},

				{
					title: 'none',
					type: 'object',
					properties: {
						none: {
							type: 'null',
							description: 'Specify no body to send the request with.',
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
		}

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
