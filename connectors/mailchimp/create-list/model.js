
module.exports = {

  method: 'post',

  url: 'https://{{dc}}.api.mailchimp.com/2.0/lists',

  data: {
    name: '{{name}}'
  },

  afterFailure: function (err) {
    if (err.response.statusCode === 403) {
      err.code = 'oauth_refresh';
    }
    return err;
  }

};