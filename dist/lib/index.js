'use strict';var BaseUnison = require('./base');
var functionize = require('./util').functionize;

module.exports = { 
  local: function local(initialState, options) {
    return functionize(
    new BaseUnison(initialState, options), 
    'grab', 
    ['grab']);} };
//# sourceMappingURL=index.js.map