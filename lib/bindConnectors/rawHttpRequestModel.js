const _ = require('lodash');

//Since there may be multiple files, need to download data for all of them and then set the body
function getFile ({ file, mime_type }) {
	//This is a format needle accepts without having to read in the file in order to upload in the request
	return {
		file,
		content_type: mime_type,
	};
}
//This functionality is derived from the HTTP client connector

function processBody (params) {

	const bodyType = _.keysIn(params.body)[0];

	//Get the raw body content from input
	const rawContent = params.body[bodyType];

	return new Promise((resolve, reject) => {
		//Always re-set the params.body as the actual value that needs to be sent as the body of the request
		switch (bodyType) {
			case 'raw':
			case 'form_urlencoded':
				return resolve(rawContent);
			case 'form_data':
				{

					/*
						Filter and map. Only types "string" (for text) and
						"objects" (for files) are expected
					*/
					const promises = [],
						keys = [];

					_.forEach(rawContent, (val, key) => {

						if (_.isString(val)) {
							keys.push(key);
							promises.push(val);
						} else if (_.isObject(val)) {
							keys.push(key);
							const filePromise = falafel.files
							.download(val)
							.then(getFile);
							promises.push(filePromise);
						}
					});

					Promise.all(promises)
					.then((promisesResult) => {
						return _.zip(keys, promisesResult);
					})
					.then(resolve, reject);

				}
				break;
			case 'binary':
				falafel.files.download(rawContent).then((fileObject) => {
					//Needle can accept a createReadStream as the data
					params.body = require('fs').createReadStream(fileObject.file);
					resolve(params);
				}, reject);
				break;
			case 'none':
			default:
				params.body = undefined;
				return resolve(params);
		}
	});
}

//TODO
module.exports = {

	globals: true,

	before: (params) => {

		//TODO: protected service whitelisting check

		return processBody(params)
		.then((body) => {
			params.body = body;
			return params;
		});

	},

	method: '{{method}}',

	options: {
		headers: '{{headers}}'
	},

	url: (params) => {

		const { url: { full_url, endpoint } } = params;

		if (full_url) {
			return full_url;
		}

		/*
			This is to allow requests on solely the specified base URL itself.
			Also, some APIs are sensitive about there being a slash at the end
			or not,	so don't set it if there's no endpoint specified.
		*/
		return (
			endpoint ?
			( endpoint[0] === '/' ? endpoint : `/${endpoint}` ) :
			''
		);

	},

	query: '{{query}}',

	body: '{{body}}'

};
