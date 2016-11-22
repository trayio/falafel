
module.exports = function (params) {

  var data = params.data;

  // Add in the array data into the object 
  _.each(params.custom_data, function (field) {
    data[field.name] = field.value;
  });

  return data;

};
