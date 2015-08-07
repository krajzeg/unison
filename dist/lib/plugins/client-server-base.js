'use strict';Object.defineProperty(exports, '__esModule', { value: true });var _ACCEPTABLE_MESSAGE_LENGTHS;exports.




























serializeArguments = serializeArguments;exports.









deserializeArguments = deserializeArguments;exports.









parseMessage = parseMessage;function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;}var _util = require('../util');var _ = require('lodash');var COMMAND = 'c', INTENT = 'i', RESPONSE = 'r';exports.COMMAND = COMMAND;exports.INTENT = INTENT;exports.RESPONSE = RESPONSE;var RESPONSE_OK = 'ok', RESPONSE_ERROR = 'err';exports.RESPONSE_OK = RESPONSE_OK;exports.RESPONSE_ERROR = RESPONSE_ERROR;var ACCEPTABLE_MESSAGE_TYPES = [COMMAND, INTENT, RESPONSE];var ACCEPTABLE_MESSAGE_LENGTHS = (_ACCEPTABLE_MESSAGE_LENGTHS = {}, _defineProperty(_ACCEPTABLE_MESSAGE_LENGTHS, COMMAND, 4), _defineProperty(_ACCEPTABLE_MESSAGE_LENGTHS, INTENT, 5), _defineProperty(_ACCEPTABLE_MESSAGE_LENGTHS, RESPONSE, 4), _ACCEPTABLE_MESSAGE_LENGTHS);var BUILTIN_COMMANDS = { _seed: function _seed(state) {var _this = this; // we have to do this through .update() and .add() to trigger events properly
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

  var type = message[0];
  if (ACCEPTABLE_MESSAGE_TYPES.indexOf(type) < 0) return false;
  if (message.length != ACCEPTABLE_MESSAGE_LENGTHS[type]) return false;

  return true;}
//# sourceMappingURL=../plugins/client-server-base.js.map