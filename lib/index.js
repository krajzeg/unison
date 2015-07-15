var BaseUnison = require('./base');
var functionize = require('./util').functionize;

module.exports = {
  local: function(initialState, options) {
    return functionize(
      new BaseUnison(initialState, options),
      'grab',
      ['grab']
    );
  }
};
