
module.exports = {

  method: 'get',

  url: '/persons',

  query: {
    filter_id: '{{filter_id}}',
    start: '{{start}}',
    limit: '{{limit}}',
    sort: '{{sort}}'
  },

  afterSuccess: function (params) {
    params.data = params.data || [];
  }

}
