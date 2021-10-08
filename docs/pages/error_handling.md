---
layout: default
title: Error Handling
description: "Error handling"
permalink: /error-handling
---

# Error Handling
{: .no_toc}

Connectors can throw a variety of different error types.
The type of error thrown has an effect on workflow behaviour and how the error is handled.

The `@trayio/connector-utils` node package has some helper functions included. 
You can install the package by running `npm i --save @trayio/connector-utils`.

## Error Types
{: .no_toc}

- TOC
{:toc}

### User Input Error

A user input error should be thrown when you are sure the user input is wrong and the API call will never be valid.
When a user input is thrown, the step **will not retry**.

```js
throw new Error({
  code: '#user_input_error',
  message: 'Please supply at least one of Status Text, Status Emoji, or Status Expiration.',
});
```

_With connector-utils_

```js
const { UserInputError } = require('@trayio/connector-utils').error;

throw new UserInputError('This address entered is invalid');
```

### API Error

An API error should be thrown if the error is caused by the API.
Steps that fail with an API Error will retry automatically.

If the connector is configured with `expects` to check the response status code,
this is the type of error that is thrown when the status code is out of the accepted range.

```js
throw new Error({
  code: '#api_error',
  message: 'API returned a status code of 404',
});
```

_With connector-utils_

```js
const { ApiError } = require('@trayio/connector-utils').error;

throw new ApiError('Login to the API  failed.');
```

### Connector Error

This is the default error type for when there is a code problem.
If your code throws an exception that isn't caught, it will default to a Connector Error.

Connector Errors are not displayed to the user, as they will just see a message like `Unfortunately, the connector unexpectedly failed`.
When this error type is thrown, the step will retry by default.

_With connector-utils_

```js
const { ConnectorError } = require('@trayio/connector-utils').error;

throw new ConnectorError('Failed to parse downloaded JSON');
```

### OAuth Refresh Error

OAuth Refresh errors are used signal that the access token has expired and needs refreshing. 
If your connetors uses OAuth2, it is recommended that you add checks in `afterFailure` to check for the appropriate status code and throw this error when needed.
When thrown, the user's authentication will be refreshed and the step retried.

```js
throw new Error({
  code: '#oauth_refresh',
  message: 'Expired token',
});
```

_With connector-utils_

```js
const { OAuthRefresh } = require('@trayio/connector-utils').error;

throw new OAuthRefresh();
```

### No Trigger Error

No Trigger errors are used in trigger `request.js` files to tell the workflow that the trigger invocation should not trigger a workflow execution.
This is mainly used for filtering incoming events, allowing you to choose which ones trigger the workflow and which don't.

```js
throw {
    code: '#no_trigger',
    message: 'No trigger',
};
```


_With connector-utils_

```js
const {
  NoTriggerError
} = require('@trayio/connector-utils').error;

module.exports = async (params, http) => {
  if (http.method === 'POST') {
    return {
      output: http.body,
    };
  }

  throw new NoTriggerError('Invalid method.');
};
```

### Timeout Error

This error code is used to signal that the connector operation timed out.
In the case of an AWS Lambda reaching the end of it's duration, this error is thrown automatically.

```js
throw {
    code: '#timeout_error',
    message: 'Your connection has timed out.'
};
```

### Retry with delay

In the case of API rate limiting, you can return a special error code that tells Tray to only retry after a certain amount of time has passed.

```js
throw {
    code: '#retry_delay_seconds:120',
    message: 'API throttling, retrying after 2 minutes',
};
```
