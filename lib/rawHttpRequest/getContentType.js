module.exports = function (bodyType, body) {
	switch (bodyType) {
		case 'raw':
			return ( _.isObject(body) ? 'application/json' : 'text/plain' );
		case 'form_data':
			return 'multipart/form-data';
		case 'form_urlencoded':
			return 'application/x-www-form-urlencoded';
		case 'binary':
			return 'text/plain';
		default:
			return undefined;
	}
};
