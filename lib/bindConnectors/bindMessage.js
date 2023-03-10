const when = require('when');
const _ = require('lodash');
const { camelCase } = require('../utils/mout');
const getMissingParams = require('./getMissingParams');
const formatInputBody = require('./formatInputBody');
const interceptAfterSuccess = require('./interceptAfterSuccess');

module.exports = function (message, threadneedle, connectorConfig, dependenciesLoaded) {

	// Add the connector to the falafel global if not already there.
	var connectorName = camelCase(connectorConfig.name);
	falafel[connectorName] = falafel[connectorName] || {};

	// Nice method names only please
	var methodName = camelCase(message.name);

	//camelCasing loses the hash, so add it back if it was in the original name
	if (message.name[0] === '#') {
		methodName = '#' + methodName;
	}

	//Intercept afterSuccess
	message = interceptAfterSuccess(message);

	// Add the threadneedle method
	threadneedle.addMethod(methodName, message.model, message.afterHeaders);

	/*	Add the threadneedle method to the falafel global -
		The falafel version of the operation should expose only
		the body part of the response	*/
	falafel[connectorName][methodName] = function (params) {
		return when.promise(function (resolve, reject) {

			function getBody (resolver) {
				return function (response) {
					resolver(response.body);
				};
			}

			threadneedle[methodName](params)
			.done(getBody(resolve), getBody(reject));

		});
	};

	const onFinishHandler = (event) => {
		return when.promise(function (resolve, reject) {
			var missingParams = (
				methodName[0] === '#' ?
					[] :
					getMissingParams(event.body, message.schema, connectorConfig.globalSchema)
			);

			// If missing parameters, error before sending the API call
			if (missingParams.length) {

				return reject({
					headers: {},
					body: {
						code: '#user_input_error',
						message: 'The following required parameters are missing: ' + missingParams.join(', ')
					}
				});

			} else {   // Otherwise run the method

				var body = formatInputBody(event.body, message.schema);

				threadneedle[methodName](body)

				.done((data) => {
					falafel.metrics.end({
						connectorName,
						operationName: methodName,
						connectorVersion: connectorConfig.version,
						status: 'success'
					}).then(() => {
						resolve(data);
					});
				}, (error) => {
					falafel.logger.error(
						error,
						{
							connectorName,
							connectorVersion: connectorConfig.version,
							operation: event.header.message,
							workflowId: event.id,
						}
					);
					falafel.metrics.end({
						connectorName,
						operationName: methodName,
						connectorVersion: connectorConfig.version,
						status: 'failure'
					}).then(() => {
						reject(error);
					});
				});

			}

		});
	};

	// Bind the method to the internal handler object - this is how the connector
	// processes the inbound messages below.
	return function (event) {
		return when(dependenciesLoaded).then(() => {
			falafel.metrics.start();
			return onFinishHandler(event);
		});
	};

};

