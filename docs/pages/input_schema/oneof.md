---
layout: default
title: OneOf inputs
nav_order: 3
description: "How to utilise oneOf schemas for more input flexibility."
parent: Input Schema
permalink: /input-schema/oneof
---

# oneOf Schemas
{: .no_toc}

Firstly, it should be understood that the `oneOf` implementation/intended use in [tray.io](http://tray.io) is different from the JSON schema specification; 
i.e. whereas the JSON schema spec primarily uses `oneOf` for validation purposes,
the Tray properties panel uses `oneOf` to generate a form.

The general issue surrounding `oneOf`  is that for child schema options that are the same/similar,
there is no easy way to differentiate between those options using just the saved data.
This consequently can cause issues; on refresh for example,
FE will default to the first child schema that is a match to the saved input/data.

It is therefore necessary to make the `oneOf` child schemas unique in some manner,
so that differentiation and therefore identification is possible.
Additionally, note that required vs optional properties influence uniqueness.

1. TOC
{:toc}

## Cautions

The following features are not supported for `oneOf` input types:

- `required` - Falafel currently does not have the ability to process or validate oneOf schemas, and therefore will not guard against data not provided for required fields in oneOf schemas. The fields will need to be manually validated in the operation.
- `datetime` - similarly with `required`, the inability to process oneOf schemas means that datetime fields with `date_mask` will not be formatted. The fields will need to be manually formatted in the operation.

## Usage

```js
{
  oneof_selection: {
    title: 'oneOf Selection' //Top level title (above the drop down)
    description: '...'
    oneOf: [
      {
        title: 'option_1', //Appears in the drop down
        type: 'string'
      },
      {
        title: 'option_2', 
        type: 'number'
      },
      {
        title: 'option_3',
        type: 'object',
        properties: {
          field_1: {
            type: 'string',
            required: true
          },
          field_2: {
            type: 'string'
          },
        },
      },
      {
        title: 'option_3',
        type: 'object',
        properties: {
          field_a: {
            type: 'string',
            required: true
          }
        },
      },
      {
        title: 'option_none',
        type: 'object',
        properties: {
          //Empty `properties` can be used to mimic a "none" option
        },
      },
    ]
  }
}
```

Some points on developing usable oneOf schema:

- All child schemas need to be unique
  - If a `type` was used only once compared to all child schemas, this is unique.
  - If a `type` has to be specified more than once, wrap them in objects.
  - With child schemas of `type: 'object'` which contain similar properties but are differentiated by one or more unique properties, those unique properties need to be required.
- An object with empty properties can be used to mimic a "none" option; the model code would check for an empty object for this selection.
  - Note that if "none" option is provided, and another option of `type: 'object'` which has no required properties, initialisation from the data will view these as the same, as the 2nd option should have at least 1 required property to make it unique.


## Example 1: two properties of the same type

The following example **will not work**:

```js
{
  target_id: {
    title: 'Target ID',
    description: 'The target ID to use',
    oneOf: [
      {
        title: 'User ID',
        type: 'string',
        lookup: {...},
        required: true
      },
      {
        title: 'Account ID',
        type: 'string',
        lookup: {...},
        required: true
      }
    ]
  }
}
```

Both "User ID" and "Account ID" options are of type `string`, and so from a data PoV, there is no way FE can differentiate between either options without metadata. The resulting data would look like, for example:

```json
{
  "target_id": "u1234"
}
```

From this data, there's no way to tell which option was selected.

The way to make this unique is by doing the following:

```jsx
{
  target_id: {
    title: 'Target ID',
    description: 'The target ID to use',
    oneOf: [
      {
        title: 'User ID',
        type: 'object',
        properties: {
          user_id: {
            title: 'User ID',
            type: 'string',
            lookup: {...},
            required: true
          }
        }
      },
      {
        title: 'Account ID',
        type: 'object',
        properties: {
          account_id: {
            title: 'Account ID',
            type: 'string',
            lookup: {...},
            required: true
          }
        }
      }
    ]
  }
}
```

This will work because the child schemas can be differentiated by their properties, i.e. `user_id` vs `account_id`, and so the data would look like:

```js
{
  "target_id": {
    "user_id": "u1234"
  }
}

vs

{
  "target_id": {
    "account_id": "a5678"
  }
}
```


## Example 2: similar properties

```js
{
  location: {
    oneOf: [
      {
        title: 'UK',
        type: 'object',
        properties: {
          street: {
            type: 'string',
            required: true
          },
          postcode: {
            type: 'string'
          },
        },
      },
      {
        title: 'US',
        type: 'object',
        properties: {
          street: {
            type: 'string',
            required: true
          },
          zip_code: {
            type: 'string'
          },
        },
      },
    ]
  }
}
```

This example may look like two unique schemas have been defined, since one contains `postcode` and `zip_code`, but because both of these unique properties are optional/not required, this data `location: { street: 'Scrutton Street' }` matches both.

To make the child schemas of `type: 'object'` unique, all child schemas need to have a required property that does not exist in sibling schemas.

## Properties panel nuances

### Uniqueness by required properties

In the example 1 solution, it should be noted the only reason they work is because there are properties unique to both which are required. 

The following will not work:

```js
{
  configuration: {
    description: 'The account type or sub-type classification for this account.'
    oneOf: [
      {
        title: 'Account type',
        type: 'object',
        properties: {
          account_type: {
            type: 'string',
            enum: [...],
          }
        },
      },

      {
        title: 'Account sub-type',
        type: 'object',
        properties: {
          account_sub_type: {
            type: 'string',
            enum: [...],
          }
        },
      },
    ]
  }
}
```

With both options, because the child properties are optional/non-required, on initialisation, the input panel will not define the child properties in the data, and so that data is simply `configuration: {}`. To make this work, both `account_type` and `account_sub_type` need to be required, so that on initialisation, the data is either `configuration:{ account_type: '' }` or `configuration:{ account_sub_type: '' }`.
