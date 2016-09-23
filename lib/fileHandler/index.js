var knox   = require('knox');
var when   = require('when');
var guid   = require('mout/random/guid');
var util   = require('util');
var needle = require('needle');
var fs     = require('fs');
var mime   = require('mime');


module.exports = function (options) {

  /*
  * Upload a file to S3.
  */
  var upload = function (params) {
    return when.promise(function (resolve, reject) {

      if (!_.isObject(options.aws)) {
        return reject(new Error('AWS config not specified. Add a aws.json file in the connector folder, and pass it to falafel.'));
      }

      var client = knox.createClient({
        key: options.aws.key,
        secret: options.aws.secret,
        bucket: 'workflow-file-uploads',
        region: 'us-west-2'
      });


      // Generate a random file name
      var fileName = guid();

      // TODO: should we pass the content-type to S3?
      var headers = {
        'Content-Type': mimeType
      };

      // Detect the file type
      var mimeType = mime.lookup(params.name);


      // NEW
      if (params.file) {

        var req = client.put(fileName, {
            'Content-Length': params.length
          , 'Content-Type': mimeType
        });

        fs.createReadStream(params.file).pipe(req);

        req.on('response', function(res){
          if (res.statusCode !== 200) {
            reject(new Error(res.statusCode));
          } else {
            var twentyFourHours = new Date(Date.now() + 24 * 60 * 60000);
            var signedUrl = client.signedUrl(fileName, twentyFourHours);

            // Resolve with an object following the "file" schema
            resolve({
              name: params.name,
              url: signedUrl,
              mime_type: mimeType,
              expires: Math.round(twentyFourHours.getTime() / 1000)
            });
          }
        });

        req.on('error', reject);

      }

      // OLD
      else {

        var buffer;
        if (!util.isBuffer(params.contents)) {
          return when.reject(new Error('Please pass the `contents` as a Node.js Buffer.'))
        } else {
          buffer = params.contents;
        }

        // Stick the buffer in S3
        client.putBuffer(buffer, fileName, headers, function (err, res) {
          if (err) {
            reject(err);
          } else if (res.statusCode !== 200) {
            reject(new Error(res.statusCode));
          } else {
            var twentyFourHours = new Date(Date.now() + 24 * 60 * 60000);
            var signedUrl = client.signedUrl(fileName, twentyFourHours);

            // Resolve with an object following the "file" schema
            resolve({
              name: params.name,
              url: signedUrl,
              mime_type: mimeType,
              expires: Math.round(twentyFourHours.getTime() / 1000)
            });
          }
        });

      }

    });
  };


  /*
  * Download a file from S3. The object passed here should have been one that
  * was returned via the `upload` function above in a previous workflow step.
  */
  var download = function (file) {
    return when.promise(function (resolve, reject) {

      needle.get(file.url, {
        parse: false,
        open_timeout: 0,
        read_timeout: 0
      }, function (err, res, body) {
        if (err) {
          reject(err);
        } else if (res.statusCode !== 200) {
          reject(new Error(res.statusCode));
        } else {

          // Ensure downloaded data is a buffer
          if (!util.isBuffer(body)) {
            body = new Buffer(body);
          }

          // Resolve with
          resolve({
            // The contents that was downloaded
            contents: body,

            // Pass back what was passed in to be helpful
            name: file.name,
            mime_type: file.mime_type,
            expires: file.expires
          });
        }
      });

    });
  };


  falafel.files = {
    upload: upload,
    download: download
  };

};
