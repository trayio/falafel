
module.exports = {

  input: {

    date: {
      type: 'string',
      format: 'date',
      date_mask: 'YYYY-MM-DD'
    },

    list_of_dates: {
      type: 'array',
      items: {
        type: 'string',
        format: 'date',
        date_mask: 'X'
      }
    },

    very_nested_list_of_dates: {
      type: 'array',
      items: {
        type: 'array',
        items: {
          type: 'string',
          format: 'date',
          date_mask: 'YY-MM-DD'
        }
      }
    },

    my_object: {
      type: 'object',
      properties: {
        date: {
          type: 'string',
          format: 'date',
          date_mask: 'x'
        },

        sub_object: {
          type: 'object',
          properties: {
            sub_date: {
              type: 'number',
              format: 'date',
              date_mask: 'X'
            },
            sub_sub_object: {
              type: 'object',
              properties: {
                sub_sub_date: {
                  type: 'string',
                  format: 'date',
                  date_mask: 'dddd, MMMM Do YYYY, h:mm:ss a'
                }
              }
            }
          }
        }
      }
    }

  }

}
