---
layout: default
title: Input Types
nav_order: 1
description: "Which input types are supported"
parent: Input Schema
---

# Input types
{: .no_toc}

An input must have a specified type, or multiple types.
The following input types are supported in the Tray properties panel.

1. TOC
{:toc}

## String

String fields require the user the enter some value as text.
Example input:

```js
{
    name: {
        type: 'string',
        required: true,
    }
}
```

This would ask the user to enter a string into the text box.  
If the user entered `Bobby` into the box, the connector would receive the following input:

```json
{
    "name": "Bobby"
}
```

### Format

The `format` property can affect how a text field shows up in the interface to the user.

### Format: Text

Using `format: 'text'` will make the textbox multiline and expandable.
This can be useful when users would need to enter larger text entries like paragraphs.

```js
{
    content: {
        type: 'string',
        format: 'text',
    }
}
```

### Format: datetime

Using `format: 'datetime'` will present the user with a date/time picker.
The saved value will be stored in local time.  
This field is commonly used alongside the `datemask` property.
If a datemask is set, falafel will automatically convert the saved timestamp to the specified format.
Falafel uses Moment.js to format the timestamp, so datemasks should adhere to the [Moment.js format](https://momentjs.com/docs/#/displaying/).
Datemask formatting does not work for inputs nested inside a `oneOf` input. In this case you will need to write logic to format it yourself.


```js
{
    timestamp: {
        type: 'string',
        format: 'datetime',
        datemask: 'YYYY-MM-DDThh:mmTZD',
    }
}
```

### Format: Code

Using `format: 'code'` will present the user with a code editor text box.

```js
{
    script: {
        type: 'string',
        format: 'code',
    }
}
```

## Number

Number fields require the user the enter some value as a number.
Example input:

```js
{
    house_number: {
        type: 'number',
        required: true,
    }
}
```

This would ask the user to enter a number into the text box.  
If the user entered `51` into the box, the connector would receive the following input.

```json
{
    "house_number": 51
}
```

Notice how this time you get a number, not a string.  
If this was a `type: 'string'` field instead, the connector would have received a string instead.

```json
{
    "house_number": "51"
}
```

## Boolean

A boolean input presents the user with a tickbox.

```js
{
    is_hidden: {
        type: 'boolean',
    }
}
```

This will send either `true` or `false` to the connector.

```js
{
    "is_hidden": true
}
```

## Object

`object` inputs allow you to create nested input fields for more complex situations.  
The following example demonstrated defining an object property called `pagination` with two fields, `page` and `count`.  

```js
{
  pagination: {
    type: 'object',
    properties: {
      page: {
        type: 'number',
      },
      count: {
        type: 'number',
      }
    }
  }
}
```

If the user fills in both the `page` and `count` field, the connector will receive the following structure:

```json
{
    "pagination": {
        "page": 5,
        "count": 100
    }
}
```

The inputs defined inside `properties` are just like any other input schema definitions, so could be as complex as needed.

### Additional Properties

The `additionalProperties` setting can allow users to provide a custom object structure when needed.
If `additionalProperties` is set to `true`, users can create any structure they want for the child properties of the input.

```js
{
  custom_object: {
    type: 'object',
    additionalProperties: true,
  }
}
```

Alternatively, `additionalProperties` can be set to an input schema.
This lets you control the structure of the child properties.

```js
{
    headers: {
        type: 'object',
        description: 'HTTP headers to send',
        additionalProperties: {
            type: 'string',
        },
    },
}
```

With the above schema, users can create an object with custom property keys, but are restricted to only providing strings as the values.

## Array

Array inputs are useful for when a user needs to enter multiple items for an input.  
Array items are defined just like any other input schema, and can be as complex as you like, such as having `object` type inputs.  
the following input schema will ask the user for a list of `ingredients`, each of which is a simple `string` field.

```js
{
    ingredients: {
        type: 'array',
        items: {
            type: 'string',
        }
    }
}
```

If a user enters `sugar` and `flour` as the items in the list, the connector will receive the following:

```json
{
    "ingredients": [
        "sugar",
        "flour"
    ]
}
```

## Multiple types

An input can have multiple types.
If multiple types are defined, the user can choose which type to use.

```js
{
    id: {
        type: ['string', 'number'],
        required: true,
    }
}
```

This input supported either a number or a string as valid inputs.
