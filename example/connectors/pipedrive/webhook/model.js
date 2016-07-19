
module.exports = {

  method: 'post',

  url: '/subscriptions',

  data: {
    service_type: 'web',
    topics: function (params) {
      var arr = [];
      _.each(params.topics, function (checked, topic) {
        if (checked) {
          arr.push(topic);
        }
      });
      return arr;
    },
    url: '{{subscription_url}}'
  }

}
