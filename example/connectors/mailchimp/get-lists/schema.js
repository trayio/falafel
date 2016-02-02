
module.exports = {

  // `name` is not necessary - use folder name

  title: 'Get lists',
  description: 'Get a list of the lists in a user\'s MailChimp account.',

  // Input schema
  input: {
    access_token: {
      type: 'string',
      required: true,
      advanced: true,
      defaultJsonPath: '$.auth.access_token'
    }
  },

  // Output schema
  output: {
    generate: true,
    // from: 'response.sample.json' // defaults to this is `generate` is `true`
  }

  // Output schema, manually
  // output: {
  //   result: {
  //     type: 'boolean'
  //   },
  //   data: {
  //     type: 'object',
  //     properties: {
  //       id: {
  //         type: 'string'
  //       },
  //       name: {
  //         type: 'string'
  //       }
  //     }
  //   }
  // }

};