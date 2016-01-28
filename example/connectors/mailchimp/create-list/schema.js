
module.exports = {

  // `name` is not necessary - use folder name

  title: 'Create list',
  description: 'Create a list in the MailChimp API.',

  // Input schema
  input: {
    name: {
      type: 'string',
      title: 'Name', // defaults to propercase of `name` 
      description: 'The name of the list you\'d like to create',
      required: true,
      default: 'My first name'
    },
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
    from: 'response.sample.json' // defaults to this is `generate` is `true`
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