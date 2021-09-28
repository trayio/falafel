---
layout: default
title: File handling
nav_order: 2
description: "File Handling"
permalink: /file-handling
---

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

Note: all signed URLs return an expiry time of 6 hours.

`CONNECTOR_FILE_REGION` and `CONNECTOR_FILE_BUCKET` environment variables can be set to override the default region and bucket.

Unless the `disableObjectAcl` flag is set, the upload functions will create the S3 object with the access control list (ACL) property of `bucket-owner-full-control`. This means the owning AWS account of the target bucket will have access to the object even if the upload is being run from a different account.

#### `falafel.files.streamUpload` (recommended)
The `falafel.files.streamUpload` accepts the following object:
```js
{
    readStream: [A node read stream], //required
    name: '[File name]', //required
    length: [File size in bytes], //required
    contentType: '[Mime type of file]', //optional (falafel will attempt to derive it from name if not provided)

    bucket: '[AWS bucket]', //optional target bucket
    region: '[AWS region]',  //optional target region
    disableObjectAcl: // optional flag to disable S3 object ACL for bucket-owner-full-control
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

    bucket: '[AWS bucket]', //optional target bucket
    region: '[AWS region]', //optional target region
    disableObjectAcl: // optional flag to disable S3 object ACL for bucket-owner-full-control
}
```
This function assumes the file is in local storage and will attempt to `createReadStream` from it; as such this is the least recommended upload option.

### API upload / Falafel download
Generally, when an API provides an upload endpoint, one of falafel's download functions will need to be used. Both of the following download promise functions expect a file pointer object to be passed in.

##### needleOptions
Both `falafel.files.streamDownload` and `falafel.files.download` accept a second argument, `needleOptions`, which is an object that can be used to override the default needle options defined by falafel when downloading the file (except the `output` property for `falafel.files.download` - falafel takes precedence for this property).

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

**Note**: when using `falafel.files.download`, `needle.get` is internally used along with the `output` option; needle however only creates a file if the `statusCode` is `200`. If a file needs to be created in the `/tmp` directory for non-200 statusCodes, use `falafel.files.streamDownload`.
