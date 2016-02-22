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
* [Globals](#globals)
* [Private methods](#private-methods)
* [Trigger connectors](#trigger-connectors)
  * [Init and init destroy](#init-and-init-destroy)
  * [Handling triggers](#handling-triggers)
* [Generating connectors.json](#generating-connectorsjson)


## Getting started

Create a connector using the [Yeoman generator](https://github.com/trayio/generator-trayio-nodejs-connector), inputting the settings when prompted:

```
yo trayio-nodejs-connector
```

Next up, start the server in development mode (will auto-generate `connectors.json`):

```
NODE_ENV=development node main.js
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
    global.js (optional)
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



## Globals

Threadneedle has a "globals" approach which allows for shared logic across multiple 
messages. If you declare the `connectors/myconnector/global.js` file, the options in
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


## Private methods

Sometimes you'll want to create an internal method that should not be exposed to 
the UI. Typically the main use for this will be a generic method called in 
`before`, providing key data to enable the main method to run.

This is simple - just **don't add** a `schema.js` file in the message folder.

**Note:** the operation will be still be created, but it won't be added to the connectors.json config (so won't appear in the UI).


## Trigger connectors

Trigger connectors follow a normal file structure, but you'll also need to:

* Add a `trigger.js` file 
* Add `init_destroy` methods for each message


```
connectors/
  mailchimp_trigger/
    user_subscribe/
      model.js
      schema.js
      response.sample.json
    user_subscribe_destroy/
      model.js
    trigger.js
    connector.js
    global.js (optional)
```


### Init and init destroy 

Init messages are usually to set up things like webhooks. These normally correspond 
to a singular API call as a result - just like any normal operation. 

As such, `init` and `init_destroy` messages should be declared in separate folders, just 
like any other message. Just add `_destroy` on the end of whatever your init message is called.

__Tip:__ you don't need to declare a schema or provide a sample response for `init_destroy` 
messages as they're never exposed to the UI.



### Handling triggers

The `trigger.js` file within the connector folder will be passed straight to `connector.trigger(fn)` in the Node.js SDK.

Encodings are automatically handled behind the scenes based on the `Content-Type` header:

* `application/json` - parsed as JSON
* `application/x-www-form-urlencoded` - parsed as encoded URL
* `text/html` - parsed as text


```js
module.exports = function (req, res, metadata, requestMetadata, triggerWorkflow) {
  
  // Respond ok
  res.status(200).json({ success: true });

  // Trigger the workflow
  triggerWorkflow(req.body);

};
```

For reference:

* `req` - the express request object
* `res` - the express response object
* `metadata` - the data originally sent to the init operation
* `requestMetadata` - metadata that the cluster service adds 
* `triggerWorkflow` - a function to trigger the workflow


## Generating connectors.json

The `connectors.json` file will get auto generated when starting the server with `NODE_ENV` set to `development`.

Depends on the `generate-schema` module being installed as a `devDependency` of the parent module. (It is automatically from the Yeoman generator)
