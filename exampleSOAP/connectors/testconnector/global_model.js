
module.exports = {

	soap: true,

	wsdl: 'https://www.regonline.com/api/default.asmx?WSDL',

	options: {
		headers: [{
			value: {
				TokenHeader: {
					APIToken: require('../../../dummycredentials.json').regonline
				}
			},
			xmlns: 'http://www.regonline.com/api',
		}]
	}

};
