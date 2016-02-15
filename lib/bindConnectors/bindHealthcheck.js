
module.exports = function (connector) {

	connector.onHealthCheck(function(reply) {
		reply('healthy');
	});

};