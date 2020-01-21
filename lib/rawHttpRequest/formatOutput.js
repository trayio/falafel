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
		status_code: res.status_code,
		headers: res.headers,
		body: body
	};
	if (params.include_raw_body) {
		result.raw_body = res.raw.toString();
	}
	return result;
};
