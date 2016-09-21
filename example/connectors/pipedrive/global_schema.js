/*
* Global connector schema config.
*
* Documentation: https://github.com/trayio/falafel#global-message-schemas
*/


module.exports = {

  input: {
    access_token: {
      type: 'string',
      required: true,
      advanced: true,
      defaultJsonPath: '$.auth.access_token'
    }
  }

};
