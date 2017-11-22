# falafel

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
  * [Sample response](#sample-response)
* [Global models](#global-models)
* [Global message schemas](#global-message-schemas)
* [Private methods](#private-methods)
* [Trigger connectors](#trigger-connectors)
  * [Init](#init-message)
  * [Destroy](#destroy-message_destroy)
  * [Request](#request-message_request)
  * [Response](#response-message_response)
* [Generating connectors.json](#generating-connectorsjson)
* [Testing the connector](#testing-the-connector)


## Getting started

Create a connector using the [Yeoman generator](https://github.com/trayio/generator-trayio-nodejs-connector), inputting the settings when prompted:

```
yo trayio-nodejs-connector
```

Next up, start the server in development mode (will auto-generate `connectors.json`):

```
NODE_ENV=development node main.js
```

Later, when packaging for final deployment, run:

```
rm -rf node_modules && npm install  --production
```

## Project structuring

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

### Connector file

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

### Messages

On a high level, the following rules apply for each message.

* The `schema.js` handles the input schema
* The `model.js` handles the running of the operation
* The `response.sample.json` provides a sample output - for the output schema


### Schema

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


### Model

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


### Sample response

Output schemas are important in tray - they allow connectors to reference the  
data coming from a previous connector. However, you don't need fine grained control, handling variables like `required` and `advanced`.

Falafel means you don't have to explicitly declare an output schema
for each message. Just add a `response.sample.json` file for each and a
[JSON schema generator](https://www.npmjs.com/package/generate-schema) will automatically generate an output schema
when building the `connectors.json`.



## Global models

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


## Trigger connectors

Trigger connectors follow a similar file structure to regular connectors, but the message
folder also needs to contain:

* `destroy.js` - a file to remove the webhook created, if any (`message_destroy`)
* `request.js` - a file to handle incoming HTTP triggers (`message_request`)
* `response.js` - a file to format and handle the reply from a workflow to the connector (`message_response`). Only required if your connector is request/response.


```
connectors/
  mailchimp_trigger/
    user_subscribe/
      model.js
      schema.js
      response.sample.json
      destroy.js
      request.js
      response.js (optional)
    connector.js
    global_model.js (optional)
    global_schema.js (optional)
```


### Init (`message`)

This "trigger initialisation" happens when the workflow is enabled or changed, and is designed
to create webhooks in third party systems.

The message coming in triggers the `model.js` file - which is configured like any other message.


### Destroy (`message_destroy`)

This message should undo whatever the "initialisation" message did above. Usually this means deleting
a webhook in a third party system.

This message triggers the `destroy.js` file method, which is configured like any other message.


### Request (`message_request`)

This is a HTTP trigger message, forwarded by the tray platform to the connector. It comes in to the `request.js.` file.

This can be declared like so:

```js
module.exports = {

  // Filter function to determine whether the request should result
  // in a workflow being triggered. If you want to pass all http requests
  // to the connector then just return true here.
  // NOTE: this is a sync-only method and does not accept promises.
  filter: function (params, http) {
    return (http.method === 'POST');
  },

  // Async formatting and ad-hoc additional API function. Return a promise
  // for async behaviour.
  before: function (params, http) {
    return {
      data: http.body
    };
  },

  // If you'd like to respond to the HTTP message from the third party because
  // they're expecting a response (Salesforce notification), then also add a reply
  // method here, passing a `http` object.
  // NOTE: this is a sync-only method and does not accept promises.
  reply: function (params, http, output) {
    return {
      status: 200,
      headers: {
        'Content-Type': 'application/xml'
      },
      body: '<myxml>test</myxml>'
    }
  }



};
```

If you'd like more fine grained control, declare it as a function returning a promise:

```js
module.exports = function (params, http) {
  return when.promise(function (resolve, reject) {

    if (http.method === 'post') {
      resolve(http.body);
    } else {
      reject('#trigger_ignore');
    }

  });
};
```

### Response (`message_response`)

This file handles the formatting of the response to the connector for a request/response
trigger. The output from this message will be sent in the response back to the third party service.

The formatting is a simple & functional one:

```js
module.exports = function (params, http, reply) {
  return when.resolve(reply);
}
```



### Trigger decoding

By default Falafel automatically parses messages for the following `Content-Type`s:

* `application/json`
* `application/x-www-form-urlencoded`

There is also a `rawBody` object attached to the `http` object for the request and response messages,
which contains the raw HTTP body, rather than the parsed version.


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

Running the connector with `NODE_ENV` set to `development` also spins up a testing HTTP server, which
you can send sample connector messages too via a tool like Postman.

HTTP requests can be sent to `http://localhost:8989/send/123-def` with a body format like

```
{
  "id": "123-def",
  "header": {
    "message": "[OPERATION NAME]"
  },
  "body": {
    ...[INPUT PARAMETERS]
  }
}
```

The id `123-def` is used when testing.
