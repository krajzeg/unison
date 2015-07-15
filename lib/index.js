var BaseUnison = require('./base');

module.exports = {
  local: function(initialState, options) {
    return new BaseUnison(initialState, options);
  }
};