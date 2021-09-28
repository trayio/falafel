---
layout: default
title: Home
nav_order: 1
description: "Some stuff"
permalink: /
---

# falafel

A Node.js framework for making it crazy easy to build connectors. Built on top of the
[threadneedle](https://github.com/trayio/threadneedle) allowing for a declarative operation based approach.

Falafel uses JavaScript-based schemas as a superset of connectors.json, but unlike connectors.json, the schema also has a direct impact on the running of operations.
For example, the use of `required` makes a field required in connectors.json as well
as on the operational level.

**Table of contents:**

* [Getting started](#getting-started)
* [Project structuring](#project-structuring)
    * [Schema](#schema)
    * [Model](#model)
        * [after_headers](#after_headers)
    * [Sample response](#sample-response)
* [Global models](#global-models)
* [Global message schemas](#global-message-schemas)
* [Private methods](#private-methods)
* [Dynamic output schemas](#dynamic-output-schemas)
* [Generating connectors.json](#generating-connectorsjson)
* [Utils](utils.md)
* [Raw HTTP Request](rawHttpRequest.md)
* [Testing the connector](#testing-the-connector)


## Getting started

Create a connector using the [Yeoman generator](https://github.com/trayio/generator-trayio-nodejs-connector), inputting the settings when prompted:

```
yo trayio-nodejs-connector
```

Next up, start the server in development mode (will auto-generate `connectors.json`):

```
NODE_ENV=development node main.js
```


## Project structuring

Falafel requires you to follow a strict folder structure for organising connectors:

```
connectors/
  connectorname/
  	my-message/
  		model.js
  		schema.js
  		response.sample.json
  	my-second-message/
  		model.js
  		schema.js
  		response.sample.json
    connector.js
    global_model.js (optional)
    global_schema.js (optional)
```

### Connector file

The `connector.js` file contains high level config about the connector, mostly related to how the connector appears in the builder UI.

```js
module.exports = {

 // Title as it will appear in the builder UI
 title: 'MailChimp',

 // Description as it will appear in the builder UI
 description: 'Interact with the MailChimp API.',

 // Version of the schema
 version: '1.0',

 // Tags
 tags: ['service'],

 // Icon
 icon: {
   type: 'url',
   value: 'http://images.tray.io.s3.amazonaws.com/static/icons/placeholder.png',
 },

 // Help link
 help_link: 'http://docs.tray.io/'

};
```

### Operations (previously Messages)

On a high level, the following rules apply for each message.

* The `schema.js` handles the input schema
* The `model.js` handles the running of the operation
* The `response.sample.json` provides a sample output - for the output schema


### Schema

The `schema.js` file is a higher level JavaScript version of the connectors.json file.
It takes a declarative approach, allowing for inline `advanced` and `required` variables, auto-generating message and property `title` attributes, and allowing for
JavaScript utility functions:

```js
module.exports = {

  input: {

    access_token: {
      type: 'string',
      advanced: true,
      required: true,
      defaultJsonPath: '$.auth.access_token'  
    },

    id: {
      type: 'string',
      description: 'The MailChimp list ID.',
      required: true
    }

  })

};
```

This schema will be used to generate the `input_schema` for each message. Also, the
`required` variable applies a validation before the operation executes at runtime.

`type` is a top level schema.js property for which the allowed values are `public`, `ddl`, and `private`. If `type` is not provided, the `public` is assumed by default, unless the operation name ends with `_ddl`. Only `public` and `ddl` operation types are added to the connectors.json.

### Model

Any options in the `model.js` file will be automatically be passed
to a [threadneedle](https://github.com/trayio/threadneedle) method for the
operation. For example:

```js
module.exports = {

  url: 'https://{{dc}}.api.mailchimp.com/2.0/lists/list?apikey={{apiKey}}',
  method: 'get',
  expects: 200

};
```

Variables passed in the input schema will be passed into a Mustache template system.

#### after_headers
For function models (only), the afterHeaders function can be specified in a `after_headers.js` file, exporting a function accepting the arguments `error`, `body`, and `params`.
```js
module.exports = function (error, params, body) {
	return {
	//Must return an object
	};
};
```

### Sample response

Output schemas are important in tray - they allow connectors to reference the  
data coming from a previous connector. However, you don't need fine grained control, handling variables like `required` and `advanced`.

Falafel means you don't have to explicitly declare an output schema
for each message. Just add a `response.sample.json` file for each and a
[JSON schema generator](https://www.npmjs.com/package/generate-schema) will automatically generate an output schema
when building the `connectors.json`.



## Global models

Threadneedle has a "global models" approach which allows for shared logic across multiple
messages. If you declare the `connectors/myconnector/global_model.js` (previously `global.js`) file, the options in
it will be globalized for the connector across all methods:

```js
module.exports = {

  before: function (params) {
    params.dc = 'us5';
    // you can also return a promise that should resolve after modifying `params`
  }

};
```

**Tip:** If you'd like to disable global logic for an operation, just
set `globals: false` in the `model.js` config file.

See the [threadneedle docs](https://github.com/trayio/threadneedle#global) for more information on globals.


## Global message schemas

Sometimes you'll want to use the same generic data as inputs in every single message. A good example is passing
API keys or other authentication data.

You don't have to add these to every single message - you can specify them in a `global_schema.js` file:

```js
// global_schema.js
module.exports = {

  input: {
    access_token: {
      type: 'string',
      advanced: true,
      required: true,
      defaultJsonPath: '$.auth.access_token'  
    }
  }

};
```

__Tip:__ if you'd like to disable global schemas a particular message, specify `globals: false` in the message `schema.js` file.


## Private methods

Sometimes you'll want to create an internal method that should not be exposed to
the UI. Typically the main use for this will be a generic method called in
`before`, providing key data to enable the main method to run.

This is simple - just **don't add** the `schema.js` and `response.sample.json` files in the message folder.

**Note:** the operation will be still be created, but it won't be added to the connectors.json config (so won't appear in the UI).



## Dynamic output schemas
If an operation is to support dynamic output schemas, an `output.js` file simply needs to be included in the operation's folder. The file should always export a promise function to be run, like so:
```JavaScript
module.exports = function (params) {
	return when.promise(function (resolve, reject) {
		//Return an object or JSON schema
	});
};
```
Falafel accepts two possibilities for the returned data; either an object or a JSON schema. A JSON schema is identified by having a `"$schema"` key/property on the top level; thus, if detected, the data will be passed on directly. Otherwise, Falafel will transform the object to JSON schema and then pass it.

**Note:** Depending on whether a `output.js` is included or not, Falafel will automatically set the `dynamic_output` key in `connectors.json` for each operation; thus `dynamic_output` attribute does not need to be added in `schema.js`.
Additionally, the dynamic output sub-operation can be referenced as `message_dynamic_output`.

## Generating connectors.json

The `connectors.json` file will get auto generated when starting the server with `NODE_ENV` set to `development`.

Depends on the `generate-schema` module being installed as a `devDependency` of the parent module. (It is automatically from the Yeoman generator)


## Testing the connector
### As a server/exposed function
Running the connector with `NODE_ENV` set to `development` as an environment variable will spin up a testing HTTP server, to which request to connector operations can be made via a tool like Postman.

HTTP requests are sent to `http://localhost:8989/send/123-def` with a body format like:
```json
{
  "id": "123-def",
  "header": {
    "message": "[OPERATION NAME]"
  },
  "body": {
    "...[INPUT PARAMETERS]"
  }
}
```

The id `123-def` is used when testing.

### Writing tests
Generally, sub-operations like `request.js` and `output.js` are not exposed in the `falafel['connector name']` object. However, if access is needed for when writing test scripts, setting `NODE_ENV` to `test` as an environment variable will add the sub-operations to the `falafel['connector name']` object.

