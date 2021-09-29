---
layout: default
title: Input Types
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

## Array

