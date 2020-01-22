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
* [File handling](#file-handling)
    * [API download / Falafel upload](#api-download--falafel-upload)
    * [API upload / Falafel download](#api-upload--falafel-download)
* [Trigger connectors](#trigger-connectors)
    * [Init](#init-message)
    * [Destroy](#destroy-message_destroy)
    * [Request](#request-message_request)
    * [Response](#response-message_response)
* [Dynamic output schemas](#dynamic-output-schemas)
* [Generating connectors.json](#generating-connectorsjson)
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

### Messages

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


## File handling
In tray.io workflows, files are handled by uploading files to bucket in AWS S3, and the using a pointer object to reference the file in workflows. The default bucket is `workflow-file-uploads`, except in development mode, in which case it is `workflow-file-uploads-dev`; in both cases the region is `us-west-2`.

The file pointer object takes the following formatting:
```
{
    "name": "[File name]",
    "url": "[Signed S3 URL]",
    "mime_type": "[File's mime type]",
    "expires": [Expiration time in seconds]
}
```

Example:
```json
{
    "name": "galaxy.tif",
    "url": "https://workflow-file-uploads-dev.s3.us-west-2.amazonaws.com/13dd4143-02d4-4526-9a9c-65a20a2e97c5?AWSAccessKeyId=AKIAJHNCMU22PD3C6T6A&Expires=1570571246&Signature=O%2FotP%2B2UExhXA%2FihpNNQOo9E8tI%3D",
    "mime_type": "image/tiff",
    "expires": 1570571246
}
```

### API download / Falafel upload
Generally, when an API provides a download endpoint, one of falafel's upload functions will need to be used. All three of the following upload promise functions will return a file pointer object when they resolve.

#### `falafel.files.streamUpload` (recommended)
The `falafel.files.streamUpload` accepts the following object:
```js
{
    readStream: [A node read stream], //required
    name: '[File name]', //required
    length: [File size in bytes], //required
    contentType: '[Mime type of file]', //optional (falafel will attempt to derive it from name if not provided)
}
```

#### `falafel.files.streamMPUpload`
The `falafel.files.streamMPUpload` is the same as `streamUpload`, but does not require a `length` to be specified. However, this is less performant since the lack of content length information will default the AWS SDK to split the stream into 5MB chunks and upload them individually. Only use this if it is not possible to determine the content size beforehand without downloading the whole file to memory and/or local storage.

#### `falafel.files.upload`
The `falafel.files.upload` accepts the following object:
```js
{
    file: '[File path]', //required
    name: '[File name]', //required
    length: [File size in bytes], //required
    contentType: '[Mime type of file]', //optional (falafel will attempt to derive it from name if not provided)
}
```
This function assumes the file is in local storage and will attempt to `createReadStream` from it; as such this is the least recommended upload option.

### API upload / Falafel download
Generally, when an API provides an upload endpoint, one of falafel's download functions will need to be used. Both of the following download promise functions expect a file pointer object to be passed in.

#### `falafel.files.streamDownload` (recommended)
The `falafel.files.streamDownload` resolving with the following object:
```js
{
	readStream, //A read stream of the file contents from S3
	name, //Name of the file
	mime_type, //Mime type of the file
	expires, //The expiry time in seconds
	size //The content length of the file
}
```

#### `falafel.files.download`
The `falafel.files.download` resolving with the following object:
```js
{
	file, //The file path in local storage
	name, //Name of the file
	mime_type, //Mime type of the file
	expires, //The expiry time in seconds
	size //The content length of the file
}
```
Similarly to `falafel.file.upload`, since this function requires keeping the file in local storage, this is the least recommended download option.

## Trigger connectors

Trigger connectors follow a similar file structure to regular connectors, but the message
folder also needs to contain:

* `destroy.js` - a file to remove the webhook created, if any (`message_destroy`)
* `request.js` - a file to handle incoming HTTP triggers (`message_request`)
* `response.js` - a file to format and handle the reply from a workflow to the connector (`message_response`). Only required if your connector is *acknowledge* (see below for explaination).


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

### Delivery mode

Delivery mode controls how the tray platform processes responses to incoming webhooks.

In the schema, on top-level (so next to title, etcs), you can set the delivery field, e.g.:
```
delivery: 'acknowledge',
```

It's optional. If not set, the value will default to `fire_and_forget`.

In most cases, the behaviour will be as follows:
- `fire_and_forget` - the backend will immediately respond to the webhook with status: 200, even before going through the connector code;
- `acknowledge` - the backend will invoke the connector first, so the connector can control the response to the webhook;
- `request_response` - the backend will only allow the workflow itself to respond (using special Trigger-Reply step)

**You must use the `acknowledge` mode if you want to control the reply to the caller, via the `response.js` file or the `reply` function**

### Init (`message`)

This "trigger initialisation" happens when the workflow is enabled or changed, and is designed
to create webhooks in third party systems.

The message coming in triggers the `model.js` file - which is configured like any other message.


### Destroy (`message_destroy`)

This message should undo whatever the "initialisation" message did above. Usually this means deleting
a webhook in a third party system.

This message triggers the `destroy.js` file method, which is configured like any other message.


### Request (`message_request`)

This is a HTTP trigger message, forwarded by the tray platform to the connector. It comes in to the `request.js.` file.

This can be declared like so:

```js
module.exports = {

	// Filter function to determine whether the request should result
	// in a workflow being triggered. If you want to pass all http requests
	// to the connector then just return true here.
	// NOTE: this is a sync-only method and does not accept promises.
	filter: function(params, http) {
		return (http.method === 'POST');
	},

	// Async formatting and ad-hoc additional API function. Return a promise
	// for async behaviour.
	before: function(params, http) {
		return {
			data: http.body
		};
	},

	// If you'd like to respond to the HTTP message from the third party because
	// they're expecting a response (Salesforce notification), then also add a reply
	// method here, passing a `http` object.
	reply: function(params, http, output) {
		return {
			status: 200,
			headers: {
				'Content-Type': 'application/xml'
			},
			body: '<myxml>test</myxml>'
		}
	},

	// Use this function to set `trigger_deduplication_id` in the headers if
	// there is a need to know the unique ID of the webhook being processed
	getUniqueTriggerID: function (params, http, output) {
		return http['uniqueWebhookID'];
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

#### Adding a HTTP reply with `#no_trigger` error code
If a HTTP response needs to be specified along with the `#no_trigger` rejection code, the following format should be used:
```js
{
	code: '#no_trigger',
	message: 'Rendering form page, no trigger required.',
	http: {
		status_code,
		headers,
		body
	},
}
```

### Response (`message_response`)

This file handles the formatting of the response to the connector for an *acknowledge*
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
