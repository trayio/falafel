
module.exports = {

  title: 'List people',

  input: {

    filter_id: {
      type: 'string',
      lookup: falafel.helpers.lookup({
        message: 'private_list_person_filters'
      })
    },

    start: {
      type: 'number',
      description: 'Pagination start',
      minimum: 0
    },

    limit: {
      type: 'number',
      description: 'Items shown per page',
      maximum: 1000
    },

    sort: {
      type: 'string',
      description: 'Field names and sorting mode separated by comma (field_name_1 ASC, field_name_2 DESC). Only first-level field keys are supported (no nested keys).',
    }

  }

}
