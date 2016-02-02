
module.exports = {

  method: 'post',

  url: 'https://{{dc}}.api.mailchimp.com/2.0/lists/list?apikey={{access_token}}',

  data: {
    name: '{{name}}'
  },

  before: helpers.getMetaData,

  expects: 200,

  afterFailure: function (err) {
    if (err.response.statusCode === 403) {
      err.code = 'oauth_refresh';
    }
    return err;
  }

};