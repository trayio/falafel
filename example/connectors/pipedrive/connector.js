/*
* High level basic configuration for the connector.
*
* Documentation: https://github.com/trayio/falafel#connector-file
*/

module.exports = {

	// The name of the connector is the folder name

	// The title
  title: 'Pipedrive',

 	// The connector description
  description: 'Interact with the Pipedrive API.',

  // Version of the connector. Updating this will allow users to choose
  // which connector version they use in advanced settings of the tray UI.
  version: '2.0',

  // Tags attached to the connector
  tags: ['service', 'crm', 'trigger'],

  // Icon of the connector.
  icon: {
  	type: 'url',
  	value: '//s3.amazonaws.com/images.tray.io/static/icons/pipedrive.png'
  }

};
