---
layout: default
title: Common properties
description: "Common properties for configuring inputs"
parent: Input Schema
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
```
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

## Required

## Advanced

## Enum
