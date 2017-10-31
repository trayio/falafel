
console.log(require('threadneedle/tests/dummycredentials.json'));

module.exports = {

	soap: true,

	wsdl: 'https://www.regonline.com/api/default.asmx?WSDL',

	options: {
		headers: [{
			value: {
				TokenHeader: {
					APIToken: ''//.regonline
				}
			},
			xmlns: 'http://www.regonline.com/api',
		}]
	}

};
