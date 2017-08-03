var normalizeModelParameter = require('./normalizeModelParameter');


module.exports = function (operation) {
    return normalizeModelParameter(operation.model);
};