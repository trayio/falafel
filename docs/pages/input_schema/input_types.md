---
layout: default
title: Input Types
nav_order: 1
description: "Which input types are supported"
parent: Input Schema
---

# Input types
{: .no_toc}

The following input types are supported:

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
```
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

## Array

Array inputs are useful for when a user needs to enter multiple items for an input.  
Array items are defined just like any other input schema, and can be as complex as you like, such as having `object` type inputs.  
the following input schema will ask the user for a list of `ingredients`, each of which is a simple `string` field.

```
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

