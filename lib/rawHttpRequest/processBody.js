const fs = require('fs');

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

module.exports = async function (body) {

	const bodyType = _.keysIn(body)[0];

	//Get the raw body content from input
	const rawContent = body[bodyType];

	//Always re-set the body as the actual value that needs to be sent as the body of the request
	switch (bodyType) {
		case 'raw':
		case 'form_urlencoded':
			return rawContent;
		case 'form_data': {
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

			return Promise.all(promises)
			.then((promisesResult) => {
				return _.zip(keys, promisesResult);
			});
		}
		case 'binary':
			return falafel.files.download(rawContent)
			.then((fileObject) => {
				//Needle can accept a createReadStream as the data
				return fs.createReadStream(fileObject.file);
			});
		case 'none':
		default:
			return undefined;
	}
};

// module.exports = function (body) {
//
// 	const bodyType = _.keysIn(body)[0];
//
// 	//Get the raw body content from input
// 	const rawContent = body[bodyType];
//
// 	return new Promise((resolve, reject) => {
// 		//Always re-set the body as the actual value that needs to be sent as the body of the request
// 		switch (bodyType) {
// 			case 'raw':
// 			case 'form_urlencoded':
// 				return resolve(rawContent);
// 			case 'form_data':
// 				{
//
// 					/*
// 						Filter and map. Only types "string" (for text) and
// 						"objects" (for files) are expected
// 					*/
// 					const promises = [],
// 						keys = [];
//
// 					_.forEach(rawContent, (val, key) => {
//
// 						if (_.isString(val)) {
// 							keys.push(key);
// 							promises.push(val);
// 						} else if (_.isObject(val)) {
// 							keys.push(key);
// 							const filePromise = falafel.files
// 							.download(val)
// 							.then(getFile);
// 							promises.push(filePromise);
// 						}
// 					});
//
// 					Promise.all(promises)
// 					.then((promisesResult) => {
// 						return _.zip(keys, promisesResult);
// 					})
// 					.then(resolve, reject);
//
// 				}
// 				break;
// 			case 'binary':
// 				falafel.files.download(rawContent).then((fileObject) => {
// 					//Needle can accept a createReadStream as the data
// 					const processedBody = require('fs').createReadStream(fileObject.file);
// 					resolve(processedBody);
// 				}, reject);
// 				break;
// 			case 'none':
// 			default:
// 				return resolve(undefined);
// 		}
// 	});
// };
