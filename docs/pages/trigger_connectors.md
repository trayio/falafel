---
layout: default
title: Trigger connectors
description: "Trigger connectors"
permalink: /trigger-connectors
---

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

    if (http.method === 'POST') {
      resolve(http.body);
    } else {
      reject('#no_trigger');
    }

  });
};
```

### Adding a HTTP reply with `#no_trigger` error code
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
