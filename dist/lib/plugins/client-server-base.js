'use strict';Object.defineProperty(exports, '__esModule', { value: true });var _slicedToArray = (function () {function sliceIterator(arr, i) {var _arr = [];var _n = true;var _d = false;var _e = undefined;try {for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {_arr.push(_s.value);if (i && _arr.length === i) break;}} catch (err) {_d = true;_e = err;} finally {try {if (!_n && _i['return']) _i['return']();} finally {if (_d) throw _e;}}return _arr;}return function (arr, i) {if (Array.isArray(arr)) {return arr;} else if (Symbol.iterator in Object(arr)) {return sliceIterator(arr, i);} else {throw new TypeError('Invalid attempt to destructure non-iterable instance');}};})();exports.



















serializeArguments = serializeArguments;exports.









deserializeArguments = deserializeArguments;exports.









parseMessage = parseMessage;var _util = require('../util');var _ = require('lodash');var COMMAND = 'c', INTENT = 'i';exports.COMMAND = COMMAND;exports.INTENT = INTENT;var BUILTIN_COMMANDS = { _seed: function _seed(state) {var _this = this; // we have to do this through .update() and .add() to trigger events properly
    var children = _.pick(state, _util.isObject);var props = _.pick(state, _.negate(_util.isObject)); // set all properties
    this.update(props); // add all children
    _.each(children, function (child, id) {_this.add(id, child);});} };exports.BUILTIN_COMMANDS = BUILTIN_COMMANDS;function serializeArguments(args) {return _.map(args, function (arg) {if (arg && arg.u && arg._path) {return { _u: arg.path() };} else {return arg;}});}function deserializeArguments(u, args) {return _.map(args, function (arg) {if ((0, _util.isObject)(arg) && arg._u !== undefined) {return u(arg._u);} else {return arg;}});}function parseMessage(msgString, callback) {// parse the message
  var message = undefined;try {message = JSON.parse(msgString);
    var valid = messageValid(message);
    if (!valid) 
    throw new Error('Incorrect message format.');} 
  catch (e) {
    console.error('Received garbage message: \'' + msgString + '\'.');
    console.error(e);
    return;}


  // try to act upon it
  try {
    callback(message);} 
  catch (e) {
    console.error('Problem encountered when handling message \'' + msgString + '\':');
    console.error(e.stack || e);}}



function messageValid(message) {
  if (!(message instanceof Array)) return false;
  if (message.length != 4) return false;var _message = _slicedToArray(

  message, 1);var code = _message[0];
  if (code != COMMAND && code != INTENT) 
  return false;

  return true;}
//# sourceMappingURL=../plugins/client-server-base.js.map