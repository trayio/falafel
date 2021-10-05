---
layout: default
title: Dynamic Data Lists (DDL)
description: "How to create and use DDLs"
permalink: /ddl
---

# Dynamic Data Lists (DDLs)
{: .no_toc}

1. TOC
{:toc}

DDLs are used to provide a dynamic dropdown list for an input.
Unlike enums, DDLs are mainly there to help the user pick a value, not restrict which options are available.
Users can choose to ignore the dropdown list and provide a value themselves.  
Like enums, they can have separate text and value elements.
This is useful in cases where the underlying value is not very user friendly to look at.
For example, you could have user UUIDs as the values, and have their emails as the text.
This would let users choose the input by finding the right email address, instead of having to find the UUID manually.  
The other advantage of DDLs is the values can be fetched dynamically, using the user's authentication.
This means you can make an API call and use the result to generate the list.

## What are DDLs

A DDL in a connector is simply another operation, but with a specific output structure, and is not visible in the operations list.

The operation must respond with an output structure like the following:

```json
{
    "result": [
        {
            "text": "Bob",
            "value": 1234
        }
    ]
}
```

As you can see, the `result` property must be an array of objects with a `text` and `value`.
The `value` can be either a string or a number, and is the value that gets stored as the input.
The `text` must be a string and is what the user will see in the dropdown list.

For an operation to be recognised as a DDL, the name must either end in `_ddl` (like `list_users_ddl`), or have `type: 'ddl'` in the `schema.js` file.

```js
// schema.js
module.exports = {
    type: 'ddl',
}
```

## Making a DDL

### Operation from scratch

To create an operation as a DDL, you setup the operation as you would normally, but rearrange the output to the correct structure.

The simplest way to do this is to use an `afterSuccess` function to modify the response from the API.
In the following example, the operation will call the `/users` endpoint and extract the usernames and IDs from the result to create a DDL compatible response.


```js
// model.js
module.exports = {
  url: '/users',

  afterSuccess: function(body) {
    return {
      result: body.results.map(user =>
        ({
          text: user.username,
          value: user.id
        })
      )
    }
  }
}
```

### Reuse an existing operation

If you already have a list operation for the endpoint you are using, you can instead call that operation and reformat the result.
This is usually a better way to make a DDL as you avoid code repetition.

If you already have a `list_users` operation, you could make a `list_users_ddl` like so:

```js
// model.js
module.exports = async (params) => {
  const users = await falafel.myConnector.listUsers(params);
  return {
    result: users.map(user => ({
      text: user.username,
      value: user.id
    })),
  };
}
```

### Adding a DDL to an input field

To add a DDL to an input field, you need to use the `lookup` property.

```js
{% raw %}module.exports = {
  user_id: {
    type: 'string',
    description: 'The ID of the user',
    lookup: {
      url: '{{{step.ephemeral_url}}}',
      body: {
        message: 'list_users_ddl',
        auth_id: '{{{step.auth_id}}}',
        step_settings: {},
      },
    },
  },
}{% endraw %}
```

Most simple lookup configurations will look like this.
The `message` paramater is where you specify the name of the operation to call.


### Input dependent DDLs

Sometimes, you might need to pass some user input into a DDL.
For example, you might have chosen a `postcode` already,
and the DDL for choosing an address needs to know the postcode in order to lookup the available options.

To do this, you would need to pass the `postcode` input to the DDL.

```js
{% raw %}module.exports = {
  postcode: {
    type: 'string',
    required: true,
  },
  street_address: {
    type: 'string',
    title: 'Street Address',
    description: "Choose a street address",
    lookup: {
      url: '{{{step.ephemeral_url}}}',
      body: {
        message: 'list_street_addresses_ddl',
        auth_id: '{{{step.auth_id}}}',
        step_settings: {
          postcode: {
            type: 'string',
            value: '{{{properties.postcode}}}',
          }
        },
      },
    },
  },
}{% endraw %}
```

In this example, we are using `list_street_addresses_ddl` as the DDL operation. 
We are also passing in an input called `postcode`, and getting the value for this from the input panel property `postcode`.

When a user has entered a postcode input such as `SW1 1AA`, they can click on the `street_address` field,
and the DDL will call `list_street_addresses_ddl` operation with `{ postcode: 'SW1 1AA' }` as the input.
