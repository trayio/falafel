const fs = require('fs');

const _ = require('lodash');
const express = require('express');

class RestServer {

	constructor (port = 8787) {

		this.port = port;
		this.server = null;

		this.appServer = express();

	}

	startServer (callback) {
		this.appServer.use((request, response) => {
			response.status(404);
			response.end('404: Not Found: ' + request.url);
		});
		this.server = this.appServer.listen(this.port, null, null, () => {
			//eslint-disable-next-line no-console
			console.log(`REST server at port ${this.port} initialized.`);
			if (_.isFunction(callback)) { callback(null); }
		});
	}

	getAppServer () {
		return this.appServer;
	}

	stopServer (callback) {
		this.server.close(() => {
			//eslint-disable-next-line no-console
			console.log(`\nREST server at port ${this.port} closed.`);
			if (_.isFunction(callback)) { callback(null); }
		});
	}

}

//Start/stop server if this file is directly invoked, i,e, `node index.js`
if (require.main === module) {
	const restServer = new RestServer(8787);
	restServer.startServer();
	process.on('SIGINT', () => {
		restServer.stopServer(() => {
			process.exit(2);
		});
	});
}

module.exports = RestServer;
