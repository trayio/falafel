var fs = require('fs');


module.exports = function (params) {
  return when.promise(function (resolve, reject) {

    falafel.files.download(params.file)

    .done(function (result) {
      console.log(result);
      fs.writeFileSync('/Users/chrishoughton/Desktop/'+result.name, result.contents);
      resolve(result);
    }, reject);
    //
    // .done(function () {
    //   resolve({
    //     success: true,
    //     message: 'You\'d normally show an API response here.'
    //   });
    // }, reject);

  });
}
