'use strict';Object.defineProperty(exports, '__esModule', { value: true });var _ACCEPTABLE_MESSAGE_LENGTHS;exports.serializeAll = serializeAll;exports.deserializeAll = deserializeAll;exports.serialize = serialize;exports.deserialize = deserialize;exports.parseMessage = parseMessage;function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;}var _util = require(
'../util');var _ = require('lodash');

var COMMAND = 'c', INTENT = 'i', RESPONSE = 'r';exports.COMMAND = COMMAND;exports.INTENT = INTENT;exports.RESPONSE = RESPONSE;
var RESPONSE_OK = 'ok', RESPONSE_ERROR = 'err';exports.RESPONSE_OK = RESPONSE_OK;exports.RESPONSE_ERROR = RESPONSE_ERROR;

var ACCEPTABLE_MESSAGE_TYPES = [COMMAND, INTENT, RESPONSE];
var ACCEPTABLE_MESSAGE_LENGTHS = (_ACCEPTABLE_MESSAGE_LENGTHS = {}, _defineProperty(_ACCEPTABLE_MESSAGE_LENGTHS, 
COMMAND, [4, 5]), _defineProperty(_ACCEPTABLE_MESSAGE_LENGTHS, 
INTENT, [5]), _defineProperty(_ACCEPTABLE_MESSAGE_LENGTHS, 
RESPONSE, [4]), _ACCEPTABLE_MESSAGE_LENGTHS);


var BUILTIN_COMMANDS = { 
  _seed: function _seed(state) {var _this = this;
    // we have to do this through .update() and .add() to trigger events properly
    var children = _.pick(state, _util.isObject);
    var props = _.pick(state, _.negate(_util.isObject));

    // set all properties
    this.update(props);

    // add all children
    _.each(children, function (child, id) {
      _this.add(id, child);});} };exports.BUILTIN_COMMANDS = BUILTIN_COMMANDS;




function serializeAll(args) {
  return args.map(function (arg) {return serialize(arg);});}


function deserializeAll(u, args) {
  return args.map(function (arg) {return deserialize(u, arg);});}


function serialize(obj) {
  if (obj && obj.u && obj._path) {
    return { _u: obj.path() };} else 
  {
    return obj;}}



function deserialize(u, obj) {
  if (obj && (0, _util.isObject)(obj) && obj._u !== undefined) {
    return u(obj._u);} else 
  {
    return obj;}}



function parseMessage(msgString, callback) {
  // parse the message
  var message = undefined;
  try {
    message = JSON.parse(msgString);
    var valid = messageValid(message);
    if (!valid) 
    throw new Error('Incorrect message format.');} 
  catch (e) {
    console.error('Received garbage message: \'' + msgString + '\'.');
    console.error(e);
    return;}


  // try to act upon it
  try {
    return callback(message);} 
  catch (e) {
    console.error('Problem encountered when handling message \'' + msgString + '\':');
    console.error(e.stack || e);}}



function messageValid(message) {
  if (!(message instanceof Array)) return false;

  var type = message[0];
  if (ACCEPTABLE_MESSAGE_TYPES.indexOf(type) < 0) return false;
  if (ACCEPTABLE_MESSAGE_LENGTHS[type].indexOf(message.length) < 0) return false;

  return true;}
//# sourceMappingURL=../plugins/client-server-base.js.map