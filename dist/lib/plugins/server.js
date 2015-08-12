'use strict';Object.defineProperty(exports, '__esModule', { value: true });var _slicedToArray = (function () {function sliceIterator(arr, i) {var _arr = [];var _n = true;var _d = false;var _e = undefined;try {for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {_arr.push(_s.value);if (i && _arr.length === i) break;}} catch (err) {_d = true;_e = err;} finally {try {if (!_n && _i['return']) _i['return']();} finally {if (_d) throw _e;}}return _arr;}return function (arr, i) {if (Array.isArray(arr)) {return arr;} else if (Symbol.iterator in Object(arr)) {return sliceIterator(arr, i);} else {throw new TypeError('Invalid attempt to destructure non-iterable instance');}};})();var _createClass = (function () {function defineProperties(target, props) {for (var i = 0; i < props.length; i++) {var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ('value' in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);}}return function (Constructor, protoProps, staticProps) {if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;};})();exports['default'] = 




server;function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;}function _classCallCheck(instance, Constructor) {if (!(instance instanceof Constructor)) {throw new TypeError('Cannot call a class as a function');}}var _ = require('lodash');var Promise = require('bluebird');var cs = require("./client-server-base");function server(options) {
  var serverPlugin = new ServerPlugin(options);
  var fn = function fn() {for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {args[_key] = arguments[_key];}
    return serverPlugin.applyPlugin.apply(serverPlugin, args);};

  fn.plugin = serverPlugin;

  return fn;}var 


ServerPlugin = (function () {
  function ServerPlugin(_ref) 




  {var _this = this;var communication = _ref.communication;var _ref$intents = _ref.intents;var intents = _ref$intents === undefined ? {} : _ref$intents;var _ref$commands = _ref.commands;var commands = _ref$commands === undefined ? {} : _ref$commands;var _ref$errorHandler = _ref.errorHandler;var errorHandler = _ref$errorHandler === undefined ? defaultErrorHandler : _ref$errorHandler;var _ref$unexpectedErrorMessage = _ref.unexpectedErrorMessage;var unexpectedErrorMessage = _ref$unexpectedErrorMessage === undefined ? 'Oops! Something went very wrong on the server.' : _ref$unexpectedErrorMessage;_classCallCheck(this, ServerPlugin);
    _.extend(this, { communication: communication, intents: intents, commands: commands });
    _.extend(this.commands, cs.BUILTIN_COMMANDS);
    this.config = { 
      errorHandler: errorHandler, 
      unexpectedErrorMessage: unexpectedErrorMessage };


    this.clients = [];

    this.communication.onAttach(function (client) {return _this.attach(client);});
    this.communication.onDetach(function (client) {return _this.detach(client);});
    this.communication.onReceive(function (client, msg) {return _this.receive(client, msg);});}_createClass(ServerPlugin, [{ key: 'applyPlugin', value: 


    function applyPlugin(u) {
      this.u = u;
      this.addNodeMethods();

      return { 
        methods: { 
          addIntent: this.addIntent.bind(this), 
          addCommand: this.addCommand.bind(this) } };} }, { key: 'attach', value: 




    function attach(client) {
      this.clients.push(client);

      var u = this.u, rootState = u('').state();
      this.sendTo(client, [cs.COMMAND, '_seed', '', [rootState]]);} }, { key: 'detach', value: 


    function detach(client) {
      var position = this.clients.indexOf(client);
      if (position >= 0) 
      this.clients.splice(position, 1);} }, { key: 'receive', value: 


    function receive(client, msgString) {var _this2 = this;
      cs.parseMessage(msgString, function (message) {var _message = _slicedToArray(
        message, 1);var messageType = _message[0];
        switch (messageType) {
          case cs.INTENT:
            return _this2.applyIntent(client, message);
          case cs.COMMAND:
            throw new Error("Servers do not obey commands from clients.");}});} }, { key: 'sendToAll', value: 




    function sendToAll(message) {var _this3 = this;
      var msgString = JSON.stringify(message);
      _.each(this.clients, function (client) {
        _this3.communication.sendTo(client, msgString);});} }, { key: 'sendTo', value: 



    function sendTo(client, message) {
      var msgString = JSON.stringify(message);
      this.communication.sendTo(client, msgString);} }, { key: 'sendErrorResponse', value: 


    function sendErrorResponse(client, intentId, message) {
      this.sendTo(client, [cs.RESPONSE, cs.RESPONSE_ERROR, intentId, message]);} }, { key: 'sendOkResponse', value: 


    function sendOkResponse(client, intentId, result) {
      this.sendTo(client, [cs.RESPONSE, cs.RESPONSE_OK, intentId, cs.serialize(result)]);} }, { key: 'applyIntent', value: 


    function applyIntent(client, _ref2) {var _this4 = this;var _ref22 = _slicedToArray(_ref2, 5);var code = _ref22[0];var intentName = _ref22[1];var objectPath = _ref22[2];var args = _ref22[3];var intentId = _ref22[4];
      var intentFn = this.intents[intentName];
      var u = this.u, target = u(objectPath);

      args = cs.deserializeAll(u, args);
      var fullArgs = args.concat(client);

      var runIntent = new Promise(function (resolve, reject) {
        try {
          var result = intentFn.apply(target, fullArgs);
          return resolve(result);} 
        catch (err) {
          return reject(err);}});



      return runIntent.then(function (result) {
        _this4.sendOkResponse(client, intentId, result);})['catch'](
      function (err) {
        if (err.reportToUser) {
          _this4.sendErrorResponse(client, intentId, err.message);} else 
        {
          _this4.sendErrorResponse(client, intentId, _this4.config.unexpectedErrorMessage);
          _this4.config.errorHandler(err);}});} }, { key: 'addNodeMethods', value: 




    function addNodeMethods() {var _this5 = this;
      _.each(this.commands, function (cmd, name) {_this5.addCommand(name, cmd);});
      _.each(this.intents, function (i, name) {_this5.addIntent(name, i);});} }, { key: 'addCommand', value: 


    function addCommand(commandName, commandCode) {
      this.u.registerNodeProperties(_defineProperty({}, 
      commandName, this.makeCommandMethod(commandName, commandCode)));} }, { key: 'addIntent', value: 



    function addIntent(intentName, intentCode) {
      this.u.registerNodeProperties(_defineProperty({}, 
      intentName, intentCode));} }, { key: 'makeCommandMethod', value: 



    function makeCommandMethod(commandName, commandFn) {
      var server = this;

      return function () {
        var nested = !!server._runningCommand;for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {args[_key2] = arguments[_key2];}
        if (!nested) 
        server._runningCommand = [this, commandName, args];
        // 'this' refers to the Node on which the method was called here
        try {
          commandFn.apply(this, args);} 
        catch (e) {
          if (!nested) 
          server._runningCommand = null;
          throw e;}


        if (!nested) {
          server.sendToAll([cs.COMMAND, commandName, this.path(), cs.serializeAll(args)]); // send the changes to all the clients
          server._runningCommand = null;}};} }]);return ServerPlugin;})();





function defaultErrorHandler(err) {
  console.error(err.stack || err);}module.exports = exports['default'];
//# sourceMappingURL=../plugins/server.js.map