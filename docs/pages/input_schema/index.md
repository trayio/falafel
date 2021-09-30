---
layout: default
title: Input Schema
description: "How to write input schema for connectors"
permalink: /input-schema
has_children: true
---

# Input schema

The input schema of a connector defines how the input will look within the Tray.io workflow builder.
The way inputs are defined across operations and connectors is heavily inspired by [JSONSchema](https://json-schema.org/), but is not compatible.

## Global inputs

The `global_schema.js` file is where you would define any global properties for the connector.  
For example, the following configuration would add a string input called `foo` to all operations in the connector.
This input will be required, and will have the description specified.

```js
module.exports = {
    input: {
        foo: {
            type: 'string',
            required: true,
            description: 'Some input description here.',
        }
    }
}
```

## Operation inputs

Most of the time you will want to define properties on the operation level.
To do this, you would put them in the `schema.js` file within the operation folder.

To add a `user_id` number input to an operation `get_user` you would add input to the following file:
`connectors/my-connector/get_user/schema.js`
```js
module.exports = {
    input: {
        user_id: {
            title: 'User ID',
            type: 'number',
            required: true,
            description: 'The ID of the user.',
        }
    }
}
```

## connectors.json

In the top level of the connector folder, you will see a file called `connectors.json`.
When you run the connector server using `node main.js`, the schema of all operations is combined into this file automatically.
As this file is auto generated you should not edit it directly, but it can be useful for debugging your schema code to see what is actually being generated.
