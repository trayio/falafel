
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
    },
    type: {
      type: 'string',
      enum: ['chris', 'test'],
      description: 'The types of list you\'d like to get.'
    },
    data: {
      type: 'object',
      properties: {
        age: {
          type: 'integer'
        },
        surname: {
          type: 'string',
          required: true,
          advanced: true
        }
      }
    },
    anotherVar: {
      type: 'object'
    },
    customField: {
      type: 'array',
      items: {
        name: {
          type: 'string'
        }
      }
    }
  },

  // Output schema
  output: {
    generate: true
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