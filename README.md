# falafel

A Node.js framework for making it crazy easy to build connectors. Built on top of the 
[threadneedle](https://github.com/trayio/threadneedle) allowing for a declarative operation based approach.

Falafel uses JavaScript-based schemas as a superset of connectors.json, but unlike connectors.json, the schema has a direct impact on the running of operations.
For example, the use of `required` makes a field required in connectors.json as well 
as on the operational level.

Table of contents:

* [Getting started](#gettingstarted)
* [Project structuring](#projectstructuring)
* [Globals](#globals)
* [Private methods](#privatemethods)
* [Trigger connectors](#triggerconnectors)


## Getting started

TODO


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
```

On a high level, the following rules apply:

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
[JSON schema generator](#) will automatically generate an output schema 
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

If you'd like to disable global logic for an operation, just 
set `globals: false` in the `model.js` config file.

See the threadneedle docs for more information on globals.


## Private methods

Sometimes you'll want to create an internal method that should not be exposed to 
the product. Typically the main use for this will be a generic method called in 
`before`, providing key data to enable the main method to run.

This is simple - just **don't add** a `schema.js` file in the message folder.


## Trigger connectors

### Init and init destroy 

Init messages are usually to set up things like webhooks. These normally correspond 
to a singular API call as a result - just like any normal operation. 

As such, trigger connectors also have a basic `model.js` file, but they **also** have 
a `model_destroy.js` file - to handle `init_destroy` messages. (For destroying webhooks)

If no webhooks need to be created, just use a function returning a resolving 
promise instead:

```js
module.exports = function () {
  return when.resolve();
};
```


### Triggering workflows

The `trigger.js` file within the connector folder will be passed straight to `connector.trigger(fn)` in the Node.js SDK.

TODO - how do we handle parsing and encoding types?


```js
module.exports = function (req, res, metadata, requestMetadata, triggerWorkflow) {
  
  // Respond ok
  res.status(200).json({ success: true });

  // Trigger the workflow
  triggerWorkflow(req.body);

};
```

