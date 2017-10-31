/*
* High level basic configuration for the connector.
*
* Documentation: https://github.com/trayio/falafel#connector-file
*/

module.exports = {

	// The name of the connector is the folder name

	// The title
  title: 'Test connector',

 	// The connector description
  description: 'Test connector to test things in.',

  // Version of the connector. Updating this will allow users to choose
  // which connector version they use in advanced settings of the tray UI.
  version: '1.0',

  // Tags attached to the connector
  tags: ['service'],

  // Icon of the connector.
  icon: {
  	type: 'streamline',
  	value: 'globe-2'
  }

};
