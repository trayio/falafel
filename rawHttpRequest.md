# Raw HTTP Request
The Raw HTTP Request functionality provides (REST) connectors a way to expose a more generic/raw operation in order to perform direct API requests, generally with a basis on the connector's global configuration. This means that more raw API requests can be executed with some service/connector specific pre-processing and formatting, such as setting authentication, without having to resort to the HTTP client and manually configure the entire request.

## Enabling and Configuring
To enable Raw HTTP Request operation, simply include a `rawHttpRequest.js` file on the same level as the global model and schema for a connector. The file can simple export an empty object:
```js
module.exports = {};
```

Doing this will simply use the [default](#default-model) model configuration defined by falafel. Providing any Threadneedle REST configuration properties will be merged with the default configuration, giving `rawHttpRequest.js` precedence over the defaults.

**NOTE:** the connector documentation for connectors which enabled Raw HTTP Request must indicate what the base URL will be if `endpoint` is used in the URL input. Additionally, any further configuration, such as authentication settings, need to be mentioned too.


## Default Model
The model for the Raw HTTP Request can be found [here](lib/rawHttpRequest/rawHttpRequestModel.js).

## Schema
The schema for the Raw HTTP Request can be found [here](lib/rawHttpRequest/rawHttpRequestSchema.js).

By default, the global schema of the connector is not inherited, as it is assumed configuration such as authentication is handled in the background. In the event global schema needs to be inherited, this can be enabled by setting `globalSchema: true` in the `rawHttpRequest.js` configuration object.

## Utils
The Raw HTTP Request model utilises some functions which are also exposed via `falafel.utils.rawHttpRequest`, so that `rawHttpRequest.js` has access to these when custom configuration needs to be supported.

### validateBody
[*falafel.utils.rawHttpRequest.validateBody*](lib/rawHttpRequest/validateBody.js)

This function accepts the whole `params` and validates against `method` and `body` properties. If `method` is `GET`, `HEAD`, or `OPTIONS`, the function returns `false`, indicating no body should be processed. For any other HTTP verb, if `body` is `undefined`, an error will be thrown indicating that `body` is required; else, `true` will be returned to indicate processing of `body` is required.

### processBody
[*falafel.utils.rawHttpRequest.processBody*](lib/rawHttpRequest/processBody.js)

This ASYNC function requires the `body` property to be provided from `params`. The function will process the `body`'s specified oneOf configuration into the required format for Threadneedle. This includes downloading files for `form_data`.

### validateAndProcessBody
[*falafel.utils.rawHttpRequest.validateAndProcessBody*](lib/rawHttpRequest/validateAndProcessBody.js)

This ASYNC function performs `validateBody` and `processBody`. `params` is the only argument, and the function returns `params` if modified, else `undefined`.

### processOptions
[*falafel.utils.rawHttpRequest.processOptions*](lib/rawHttpRequest/processOptions.js)

This function requires the `params` object, after `processedBody` has been set (i.e. in the `before`), and returns an `options` object. The content type is evaluated based on the body and type, which is then set in the headers (unless specified), and also used to set both `json` and `multipart` flags for needle.

### validateUrlInput
[*falafel.utils.rawHttpRequest.validateUrlInput*](lib/rawHttpRequest/validateUrlInput.js)

This function accepts the `params` object, and validate the `url` property. If the `endpoint` is provided, the function will ensure it does not start with `http://` or `https://`. Conversely, if `full_url` is provided, the function will ensure the string starts with `http://` or `https://`. If validation is not satisfied, an error will be thrown.

### formatOutput
[*falafel.utils.rawHttpRequest.formatOutput*](lib/rawHttpRequest/formatOutput.js)

This function accepts the same arguments as `afterSuccess`, and formats the response into the following format.
```
{
	status_code,
	headers,
	body
}
```
Additionally, `raw_body` is provided as a string if `include_raw_body` is set to true in the `params`.
