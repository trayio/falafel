// Generic trigger that relays everything to trigger the workflow:
//
// module.exports = function (params, http) {
//   return when.promise(function (resolve, reject) {
//
//     resolve(http.body);
//
//   });
// };


//
//
// // Trigger that only relays POST data to the workflow
//
// module.exports = function (params, http) {
//   return when.promise(function (resolve, reject) {
//
//     if (http.method === 'post') {
//       resolve(http.body);
//     } else {
//       reject('#trigger_ignore');
//     }
//
//   });
// };
//
//
//
//
//
// Idea for declarative syntax to do the above

module.exports = {

  filter: function (params, http) {
    // return (http.method === 'POST')
    return true;
  },

  // Async formatting and ad-hoc additional API function. Return a promise
  // for async behaviour.
  before: function (params, http) {
    //
    // return {
    //   data: http.body
    // }

    // return when.promise(function (resolve, reject) {
    //   setTimeout(function () {
    //     resolve({
    //       chris: 'test'
    //     })
    //   }, 500);
    // });

    // // Sync usage:
    // var actualBody = http.body.subBody;
    // return actualBody;
    //
    // // Async usage: (used if trigger doesn't send all info)
    // return falafel.pipedrive.findDealById({
    //   deal_id: http.body.deal_id,
    //   api_key: params.api_key
    // });

  },

  reply: function (input, http, output) {
    return {
      status: 200,
      headers: {
        'Content-Type': 'application/xml'
      },
      body: '<myxml>test</myxml>'
    }
  }

};
//
//
// // Declarative syntax to relay all messages to the workflow:
//
// module.exports = {
//
//   filter: function () {
//     return true;
//   }
//
// }
