const path = require('path');

const express = require('express');

const RestServer = require('./restServer');
const restServer = new RestServer();

const appServer = restServer.getAppServer();

appServer.get('/file', (request, response) => {
	response.download(path.join(__dirname, 'test.txt'));
});

module.exports = {
	start: () => {
		restServer.startServer();
	},
	stop: () => {
		restServer.stopServer();
	}
};
