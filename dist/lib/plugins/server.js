'use strict';Object.defineProperty(exports, '__esModule', { value: true });var _slicedToArray = (function () {function sliceIterator(arr, i) {var _arr = [];var _n = true;var _d = false;var _e = undefined;try {for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {_arr.push(_s.value);if (i && _arr.length === i) break;}} catch (err) {_d = true;_e = err;} finally {try {if (!_n && _i['return']) _i['return']();} finally {if (_d) throw _e;}}return _arr;}return function (arr, i) {if (Array.isArray(arr)) {return arr;} else if (Symbol.iterator in Object(arr)) {return sliceIterator(arr, i);} else {throw new TypeError('Invalid attempt to destructure non-iterable instance');}};})();exports['default'] = 





server;function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;}var _util = require('../util');var _ = require('lodash');var Promise = require('bluebird');var cs = require("./client-server-base");function server(options) {
  return (0, _util.functionized)(ServerPlugin, [options], 'applyPlugin');}


function ServerPlugin(_ref) 



{var _this = this;var communication = _ref.communication;var _ref$intents = _ref.intents;var intents = _ref$intents === undefined ? {} : _ref$intents;var _ref$commands = _ref.commands;var commands = _ref$commands === undefined ? {} : _ref$commands;var _ref$errorHandler = _ref.errorHandler;var errorHandler = _ref$errorHandler === undefined ? defaultErrorHandler : _ref$errorHandler;var _ref$unexpectedErrorMessage = _ref.unexpectedErrorMessage;var unexpectedErrorMessage = _ref$unexpectedErrorMessage === undefined ? 'Oops! Something went very wrong on the server.' : _ref$unexpectedErrorMessage;
  _.extend(this, { communication: communication, intents: intents, commands: commands });
  _.extend(this.commands, cs.BUILTIN_COMMANDS);
  this.config = { 
    errorHandler: errorHandler, 
    unexpectedErrorMessage: unexpectedErrorMessage };


  this.clientObjects = {};

  this.communication.onAttach(function (client) {return _this.attach(client);});
  this.communication.onDetach(function (client) {return _this.detach(client);});
  this.communication.onReceive(function (client, msg) {return _this.receive(client, msg);});}

ServerPlugin.prototype = { 
  applyPlugin: function applyPlugin(u) {
    this.u = u;
    this.processDefinitions('Node', { commands: this.commands, intents: this.intents }, u.types.Node.proto);

    return { 
      name: 'server', 

      onDefine: this.processDefinitions.bind(this), 

      methods: { 
        addIntent: this.addIntent.bind(this), 
        addCommand: this.addCommand.bind(this), 

        serverSide: true } };}, 




  attach: function attach(clientId) {
    this.clientObjects[clientId] = { id: clientId };

    var u = this.u;

    var seedInformation = _.extend({}, u().state()); // independent copy to keep original state intact
    delete seedInformation['local']; // anything under 'local' is not propagated to the clients

    this.sendTo(clientId, [cs.COMMAND, '_seed', '', [seedInformation]]);}, 


  detach: function detach(clientId) {
    delete this.clientObjects[clientId];}, 


  receive: function receive(clientId, msgString) {var _this2 = this;
    cs.parseMessage(msgString, function (message) {var _message = _slicedToArray(
      message, 1);var messageType = _message[0];
      switch (messageType) {
        case cs.INTENT:
          return _this2.applyIntent(clientId, message);
        case cs.COMMAND:
          throw new Error("Servers do not obey commands from clients.");}});}, 




  sendToAll: function sendToAll(message) {var _this3 = this;
    var msgString = JSON.stringify(message);
    _.each(this.clientObjects, function (_ref2) {var id = _ref2.id;
      _this3.communication.sendTo(id, msgString);});}, 



  sendTo: function sendTo(clientId, message) {
    var msgString = JSON.stringify(message);
    this.communication.sendTo(clientId, msgString);}, 


  sendErrorResponse: function sendErrorResponse(clientId, intentId, message) {
    this.sendTo(clientId, [cs.RESPONSE, cs.RESPONSE_ERROR, intentId, message]);}, 


  sendOkResponse: function sendOkResponse(clientId, intentId, result) {
    this.sendTo(clientId, [cs.RESPONSE, cs.RESPONSE_OK, intentId, cs.serialize(result)]);}, 


  applyIntent: function applyIntent(clientId, _ref3) {var _this4 = this;var _ref32 = _slicedToArray(_ref3, 5);var code = _ref32[0];var intentName = _ref32[1];var objectPath = _ref32[2];var args = _ref32[3];var intentId = _ref32[4];
    var intentFn = this.intents[intentName];
    var u = this.u, target = u(objectPath);

    args = cs.deserializeAll(u, args);
    var fullArgs = args.concat(this.clientObjects[clientId]);

    var runIntent = new Promise(function (resolve, reject) {
      try {
        var result = intentFn.apply(target, fullArgs);
        return resolve(result);} 
      catch (err) {
        return reject(err);}});



    return runIntent.then(function (result) {
      _this4.sendOkResponse(clientId, intentId, result);})['catch'](
    function (err) {
      if (err.reportToUser) {
        _this4.sendErrorResponse(clientId, intentId, err.message);} else 
      {
        _this4.sendErrorResponse(clientId, intentId, _this4.config.unexpectedErrorMessage);
        _this4.config.errorHandler(err);}});}, 




  processDefinitions: function processDefinitions(typeName, definitions, prototype) {var _this5 = this;
    // generate methods
    var commandMethods = _.mapValues(definitions.commands || {}, function (code, name) {return (
        _this5.makeCommandMethod(name, code));});

    var intentMethods = definitions.intents || {};

    // add to the prototype of our type
    _.extend(prototype, commandMethods, intentMethods);}, 


  addCommand: function addCommand(commandName, commandCode) {
    this.u.registerNodeProperties(_defineProperty({}, 
    commandName, this.makeCommandMethod(commandName, commandCode)));}, 



  addIntent: function addIntent(intentName, intentCode) {
    this.u.registerNodeProperties(_defineProperty({}, 
    intentName, intentCode));}, 



  makeCommandMethod: function makeCommandMethod(commandName, commandFn) {
    var server = this;

    return function () {for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {args[_key] = arguments[_key];}
      // handle nested executions (command executed from another command)
      // commands nested in other commands are not sent to clients (since they will
      // execute them on their own when the top-level command runs)
      var nested = !!server._runningCommand;
      if (!nested) 
      server._runningCommand = { target: this, command: commandName, args: args, extras: {} };

      try {
        // execute the command, trigger events
        this.trigger('before:' + commandName, { args: args });
        commandFn.apply(this, args);
        this.trigger('after:' + commandName, { args: args });} 
      catch (e) {
        // on error, we have to reset the runningCommand
        if (!nested) 
        server._runningCommand = null;
        // but the error is still thrown
        throw e;}


      if (!nested) {
        // not a nested execution, so this command will be sent to the client
        var commandForClients = [cs.COMMAND, commandName, this.path(), cs.serializeAll(args)];

        // during the execution of some commands, extra information might be generated that needs to be sent to the client
        // currently, this is used by the deterministic RNG module to make sure clients generate the same random numbers
        // as the server
        var extras = server._runningCommand.extras;
        if (_.size(extras)) 
        commandForClients.push(extras);

        // send the command to all clients
        server.sendToAll(commandForClients);

        // we're done running
        server._runningCommand = null;}};}, 




  getRunningCommand: function getRunningCommand() {return this._runningCommand;}, 
  getCommandExtras: function getCommandExtras() {
    if (!this._runningCommand) 
    throw new Error("There is no command running for extras to be attached to.");
    return this._runningCommand.extras;} };



function defaultErrorHandler(err) {
  console.error(err.stack || err);}module.exports = exports['default'];
//# sourceMappingURL=../plugins/server.js.map