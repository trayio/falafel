---
layout: default
title: Getting Started
nav_order: 2
description: Connector quick start guide
permalink: /getting-started
---

# Getting Started
{: .no_toc}

1. TOC
{:toc}

## Prerequisites

* Node.js 12.0 or newer. [Setup](https://nodejs.org/en/download/)

## Generate the connector folder structure

The quickest way to get started with building a connector is to use our Yeoman Generator.

### Install Yeoman and the Tray.io Connector Generator

```sh
npm install -g yo
npm install -g generator-trayio-nodejs-connector
```

### Create a folder for your connector and navigate to it

```sh
mkdir my-connector
cd my-connector
```

### Run the yeoman generator

Example inputs for a basic connector:
```sh
$ yo trayio-nodejs-connector
? Connector title (as it will appear in the tray UI) My connector
? Connector name (how it will be referenced in workflows) my-connector
? Service name (the app the connector will be tied to) my-connector
? Description My connector
? Author Tray.io
? Repository
? Is trigger connector? No
? Do you want to add rawHttpRequest? No
```


## Run the connector locally
To run the connector as a local server you can call, run the following command:
```sh
$ NODE_ENV=development node main.js
Connector dev server listening on port 8989
```

## Run the included operation

The folder structure will include an operation called `sample_operation` with no inputs.

Connector operations running on a local server in development mode can be called through Falafel's REST API.

Method and URL:
```
POST http://localhost:8989/send/123-def
```

JSON body:
```json
{
  "id": "123-def",
  "header": {
    "message": "sample_operation"
  },
  "body": {}
}
```
The `message` field is the name of the operation, and the `body` field contains the inputs for the operation.
For this sample operation, there are no inputs so the `body` is just an empty object.

You should receive the following response.
The `body` property is what the connector returns.

```json
{
    "id": "123-def",
    "header": {},
    "body": {
        "result": "This is a sample of the response you expect from this message API call. Used for the output schema. Replace this with your own sample JSON."
    }
}
```
