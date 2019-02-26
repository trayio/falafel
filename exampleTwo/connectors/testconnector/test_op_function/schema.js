module.exports = {

	title: 'Test operation',

	globals: false,

	input: {

		basic_auth: {
			type: 'object',
			properties: {

				username: {
					type: 'string'
				},

				password: {
					type: 'string',
					format: 'password'
				}

			},
			advanced: true
		},

		headers: {
			type: 'object',
			properties: {
				content_type: {
					type: 'string',
					title: 'Content-Type',
					default: 'application/json'
				}
			},
			additionalProperties: true
		},

		queries: {
			type: 'object',
			additionalProperties: true
		},

		parse_response: {
			type: 'string',
			description: 'Automatically parse incoming data to Javascript objects if possible',
			enum: [
				{
					text: 'Any',
					value: true
				}, {
					text: 'JSON only',
					value: 'json'
				}, {
					text: 'XML only',
					value: 'xml'
				}, {
					text: 'None',
					value: false
				}
			],
			default: true,
			advanced: true
		},

		body_type: {
			title: 'Body Type',
			type: 'object',
			additionalProperties: false,
			oneOf: [

				{
					title: 'raw',
					type: 'object',
					additionalProperties: false,
					properties: {
						id: {
							type: 'string',
							default: 'raw',
							format: 'hidden'
						},
						content: {
							type: 'string',
							title: 'raw',
							format: 'code'
						}
					}
				},

				{
					title: 'form-data',
					type: 'object',
					additionalProperties: false,
					properties: {
						id: {
							type: 'string',
							default: 'form-data',
							format: 'hidden'
						},
						content: {
							type: 'array',
							title: 'form-data',
							items: {
								oneOf: [

									{
										title: 'text',
										type: 'object',
										properties: {
											key: {
												type: 'string'
											},
											value: {
												type: 'string'
											}
										}
									},

									{
										title: 'file',
										format: 'file',
										type: 'object',
										properties: {
											key: {
												type: 'string'
											},
											value: {
												type: 'object'
											}
										}
									}

								]
							}
						}
					}
				},

				{
					title: 'form-urlencoded',
					type: 'object',
					additionalProperties: false,
					properties: {
						id: {
							type: 'string',
							default: 'form-urlencoded',
							format: 'hidden'
						},
						content: {
							type: 'object',
							title: 'form-urlencoded',
							additionalProperties: true
						}
					}
				},

				{
					title: 'binary',
					type: 'object',
					additionalProperties: false,
					properties: {
						id: {
							type: 'string',
							default: 'binary',
							format: 'hidden'
						},
						content: {
							type: 'object',
							title: 'binary',
							format: 'file'
						}
					}
				}

			]
		}

	},


};
