'use strict';Object.defineProperty(exports, '__esModule', { value: true });var _slicedToArray = (function () {function sliceIterator(arr, i) {var _arr = [];var _n = true;var _d = false;var _e = undefined;try {for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {_arr.push(_s.value);if (i && _arr.length === i) break;}} catch (err) {_d = true;_e = err;} finally {try {if (!_n && _i['return']) _i['return']();} finally {if (_d) throw _e;}}return _arr;}return function (arr, i) {if (Array.isArray(arr)) {return arr;} else if (Symbol.iterator in Object(arr)) {return sliceIterator(arr, i);} else {throw new TypeError('Invalid attempt to destructure non-iterable instance');}};})();exports['default'] = 





client;function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;}var _util = require('../util');var _ = require('lodash');var Promise = require('bluebird');var cs = require("./client-server-base");function client(options) {
  return (0, _util.functionized)(ClientPlugin, [options], 'applyPlugin');}


function ClientPlugin(_ref) {var _this = this;var communication = _ref.communication;var _ref$intents = _ref.intents;var intents = _ref$intents === undefined ? {} : _ref$intents;var _ref$commands = _ref.commands;var commands = _ref$commands === undefined ? {} : _ref$commands;
  _.extend(this, { 
    communication: communication, intents: intents, commands: commands, 

    _nextIntentId: 1, 
    _pendingIntents: {} });


  this.communication.onReceive(function (msg) {return _this.receive(msg);});}

ClientPlugin.prototype = { 
  // Send a message over the provided 'communication' object.
  send: function send(message) {
    var msgString = JSON.stringify(message);
    this.communication.send(msgString);}, 


  // Called whenever a message is receive on the 'communication' object, will execute
  // commands receive from the server in response.
  receive: function receive(msgString) {var _this2 = this;
    cs.parseMessage(msgString, function (message) {var _message = _slicedToArray(
      message, 1);var messageType = _message[0];
      switch (messageType) {
        case cs.COMMAND:
          return _this2.applyCommand(message);
        case cs.INTENT:
          throw new Error("Intents should not be sent to clients.");
        case cs.RESPONSE:
          return _this2.applyIntentResponse(message);}});}, 




  // This method is called (indirectly) by u.plugin(client).
  applyPlugin: function applyPlugin(u) {
    this.u = u;

    u.define({ commands: cs.BUILTIN_COMMANDS }); // add the _seed command by default
    u.define({ commands: this.commands, intents: this.intents });

    return { 
      name: 'client', 

      onDefine: this.processDefinitions.bind(this), 

      methods: { 
        addIntent: this.addIntent.bind(this), 
        addCommand: this.addCommand.bind(this), 
        clientSide: true } };}, 




  // Generates a map of methods that will send named intents when called.
  processDefinitions: function processDefinitions(typeName, definitions, prototype) {var _this3 = this;
    var intentMethods = _.mapValues(definitions.intents || {}, function (intentCode, name) {return (
        _this3.makeIntentMethod(name));});

    var commandMethods = _.mapValues(definitions.commands || {}, function (cmdCode, name) {return (
        _this3.makeCommandMethod(name, cmdCode));});

    _.extend(prototype, intentMethods, commandMethods);}, 


  // Adds a new intent, including a method on nodes.
  addIntent: function addIntent(intentName, _) {
    this.u.registerNodeProperties(_defineProperty({}, 
    intentName, this.makeIntentMethod(intentName)));}, 



  // Adds a new command, including a method on nodes.
  addCommand: function addCommand(commandName, commandCode) {
    this.u.registerNodeProperties(_defineProperty({}, 
    commandName, this.makeCommandMethod(commandName, commandCode)));}, 



  // Generates a method that executes a command and triggers events about it.
  makeCommandMethod: function makeCommandMethod(commandName, commandCode) {
    return function () {for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {args[_key] = arguments[_key];}
      this.trigger('before:' + commandName, { args: args });
      var result = commandCode.apply(this, args);
      this.trigger('after:' + commandName, { args: args });
      return result;};}, 



  // Generates a method that will send a named intent with the right parameters when called.
  makeIntentMethod: function makeIntentMethod(intentName) {
    var client = this;
    return function () {var _this4 = this;
      // this here will be the node we're called upon
      var intentId = client._nextIntentId++;for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {args[_key2] = arguments[_key2];}
      var intent = [cs.INTENT, intentName, this.path(), cs.serializeAll(args), intentId];
      client.send(intent);

      return new Promise(function (resolve, reject) {
        client._pendingIntents[intentId] = { name: intentName, target: _this4, resolve: resolve, reject: reject };});};}, 




  // Applies a response to an intent sent earlier.
  applyIntentResponse: function applyIntentResponse(_ref2) {var _ref22 = _slicedToArray(_ref2, 4);var code = _ref22[0];var status = _ref22[1];var intentId = _ref22[2];var resultOrMessage = _ref22[3];
    var intent = this._pendingIntents[intentId];
    if (!intent) 
    throw new Error('Received response to an unknown or expired intent: ' + intentId + '.');

    if (status == cs.RESPONSE_OK) {
      intent.resolve(cs.deserialize(this.u, resultOrMessage));} else 
    if (status == cs.RESPONSE_ERROR) {
      intent.reject({ intent: intent.name, target: intent.target, message: resultOrMessage });
      intent.target.trigger('error', { intent: intent.name, message: resultOrMessage });} else 
    {
      throw new Error('Unrecognized intent response status: ' + status + '.');}


    delete this._pendingIntents[intentId];}, 


  // Applies a command received from the server to the local state.
  applyCommand: function applyCommand(_ref3) {var _ref32 = _slicedToArray(_ref3, 5);var messageCode = _ref32[0];var commandName = _ref32[1];var objectPath = _ref32[2];var args = _ref32[3];var optionalExtras = _ref32[4];
    // extract the information from the command
    var u = this.u;
    var target = u(objectPath);
    args = cs.deserializeAll(u, args);

    // ensure the command's existence
    if (!target[commandName]) 
    throw new Error('Received unknown command: \'' + commandName + '\'.');

    // if extras were sent, make them available to client-side plugins for perusal
    // otherwise, set an empty object to make it easy to use
    this._commandExtras = optionalExtras || {};

    try {
      // run the command!
      var result = target[commandName].apply(target, args);
      // clean up and return result
      delete this._commandExtras;
      return result;} 
    catch (e) {
      // clean up on error and rethrow
      delete this._commandExtras;
      throw e;}}, 



  // Returns the extras sent by the server for the currently running command
  getCommandExtras: function getCommandExtras() {
    if (!this._commandExtras) 
    throw new Error("There is no command currently running, no extras are available.");
    return this._commandExtras;} };module.exports = exports['default'];
//# sourceMappingURL=../plugins/client.js.map