module.exports = {

	title: 'Raw HTTP Request',

	input: {

		method: {
			type: 'string',
			enum: [
				'GET',
				'POST',
				'PATCH',
				'PUT',
				'DELETE',
				'HEAD',
				'OPTIONS'
			],
		},

		url: {
			oneOf: [

				{
					title: 'Endpoint',
					type: 'object',
					properties: {

						endpoint: {
							type: 'string',
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
							required: true
						}

					}
				}

			],
			required: true
		},

		headers: {
			type: 'object',
			additionalProperties: true
		},

		queries: {
			title: 'Query Parameters',
			type: 'object',
			additionalProperties: true
		},

		body: {
			title: 'Body Type',
			additionalProperties: false,
			oneOf: [

				{
					title: 'raw',
					type: 'object',
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
						},
					},
				},

			],
		}

	}

};
