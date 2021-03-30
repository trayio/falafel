const MAX_SIZE = 1024 * 6080; //6080KB ~ 5.9MB

module.exports = (body, params, res) => {
	if (body instanceof Buffer) {
		//Ensures buffers are always stringified
		body = body.toString('utf8');
		try {
			body = JSON.parse(body);
		} catch (e) {
			//Continue as normal
		}
	}
	const result = {
		status_code: res.statusCode,
		headers: res.headers,
		body: body
	};
	if (params.include_raw_body) {
		result.raw_body = res.raw.toString();
	}

	if (Buffer.from(JSON.stringify(result)).byteLength > MAX_SIZE) {
		const payloadSizeError = new Error('The operation result is too large. Modify the request to return a smaller response. If `Include raw body` is enabled, consider disabling it.');
		payloadSizeError.code = '#user_input_error';
		throw payloadSizeError;
	}

	return { response: result };
};
