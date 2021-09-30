---
layout: default
title: Common properties
description: "Common properties for configuring inputs"
parent: Input Schema
permalink: /input-schema/common-properties
---

# Common input properties
{: .no_toc}

There are several common properties that can be used to influence a variety of input types.

1. TOC
{:toc}

## Title
By default, an input's visible title will be the title cased version of the underlying name. 
e.g. `name` becomes `Name`.  
If you want to specify a custom title, you can use the `title` property.  
With the following input schema, the property will still be sent as `name`, but in the properties panel the user will see `First name`.

```js
{
    name: {
        type: 'string',
        title: 'First name',
    }
}
```

The following values inside a property key will also automatically be formatted as shown here:

|Before     |After  |
|:----------|:------|
|id         |ID     |
|ids        |IDs    |
|url        |URL    |
|ddl        |DDL    |

For example, a property called `user_id` will have a default title of `User ID`.

## Description
The `description` property can be used to define the description of an input, like so:

```js
{
    name: {
        type: 'string',
        description: 'The name of the user.',
    }
}
```

## Required
If you set `required` to `true`, the connector will ensure the property is not `undefined` before running the operation.
This is useful for making sure something is provided without having to manually write out logic to check for it.

```js
{
    name: {
        type: 'string',
        required: true,
    }
}
```

This validation does not work for properties nested inside a `oneOf` input.

## Advanced
By marking an input as `advanced`, you will make the value hidden until the user clicks `Show advanced properties`.

```js
{
    debug: {
        type: 'boolean',
        advanced: true,
    }
}
```

## Default
The `default` property allows you to set a default value for the input.
This can be useful when you want a field to be required, but also have a sensible default for the user.

```js
{
    language: {
        type: 'string',
        default: 'en_gb',
        required: true,
    }
}
```

## Enum
An `enum` allows you to limit what values a property can have with a dropdown box.

```js
{
    language: {
        type: 'string',
        default: 'english',
        required: true,
        enum: [
            'english',
            'french',
        ],
    }
}
```

Enums can either be an array of values like in above, or have a separate value and title for each item, allowing for a nicer user experience.
The connector will receive the chosen `value` while the user will see the `text`.

```js
{
    language: {
        type: 'string',
        default: 'english',
        required: true,
        enum: [
            {
                text: 'English',
                value: 'english',
            },
            {
                text: 'French',
                value: 'french',
            }
        ],
    }
}
```

If English was chosen here, the connector would receive the following:

```json
{
    "language": "english"
}
```

## Default JSON Path
The `defaultJsonPath` property will make the default value of the input a JSON Path.
The type of the field will still stay as you defined it, but the default type will be set to `JSON Path` with the specified path being the default.

```js
{
    public_url: {
        type: 'string',
        required: true,
        defaultJsonPath: '$.env.public_url',
    },
}
```

