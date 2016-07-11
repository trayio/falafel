
module.exports = function (directory) {

  var fs             = require('fs');
  var Handlebars     = require('handlebars');
  var connectorsJson = require(directory+'/connectors.json');

  var template = Handlebars.compile(fs.readFileSync(__dirname+'/template.md').toString());


  // Template parameters
  var params = {

    // Connectors.json data
    connectors: {
      main: connectorsJson[0],
      trigger: connectorsJson[1]
    }

  }

  // Add in the docs files content
  var docsFiles = ['intro', 'issues', 'quickstart', 'auth'];
  params.docs = {};
  _.each(docsFiles, function (fileName) {
    try {
      var filePath = directory+'/docs/'+fileName+'.md';
      var content = fs.readFileSync(filePath).toString();
      params.docs[fileName] = content;
    } catch (e) {}
  });


  var content = template(params);

  fs.writeFileSync(directory+'/docs.md', content);

};
