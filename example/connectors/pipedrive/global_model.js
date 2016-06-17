/*
* Global connector model config.
*
* Documentation: https://github.com/trayio/falafel#global-models
*/


module.exports = {

  url: 'https://api.pipedrive.com/v1',

  query: {
    api_token: '{{access_token}}'
  },

  expects: [200, 201]

};
