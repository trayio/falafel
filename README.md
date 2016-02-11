# falafel

A Node.js framework for making it crazy easy to build connectors. Built on top of the 
[threadneedle](https://github.com/trayio/threadneedle) allowing for a declarative operation based approach.

Falafel uses JavaScript-based schemas as a superset of connectors.json, but unlike connectors.json, the schema has a direct impact on the running of operations.
For example, the use of `required` makes a field required in connectors.json as well 
as on the operational level.


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


### Model 

Any options in the `model.js` file will be automatically be passed 
to a Threadneedle method for the operation. For example:

```js
module.exports = {

  url: 'https://{{dc}}.api.mailchimp.com/2.0/lists/list?apikey={{apiKey}}',

  method: 'get',

  expects: 200

};
```

Variables passed in the input schema will be passed into the Mustache template system.


#### Globals

Threadneedle has a global method which allows for shared logic across multiple 
messages. If you declare the `connectors/myconnector/global.js` file, the options in
it will be globalized for the connector across all methods.

For example:

```js
module.exports = {
	
	before: function (params) {
		return when.promise(function (resolve, reject) {

			falafel.mailchimp.getMetaData(params).done(function (result) {
				params.dc = result.dc;
				resolve();
			}, reject);

		});
	}

};
```


## Schema

The schema file is basically just a slightly simpler version of the connectors.json 
JSON schema approach, with a few key differences:

* `advanced` and `required` are specified inline as booleans
* The `required` field will prevent the operation fully running if not all the parameters are declared
* You have the freedom to use JavaScript utility helpers to make life simpler
