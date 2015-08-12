'use strict';Object.defineProperty(exports, '__esModule', { value: true });var _slicedToArray = (function () {function sliceIterator(arr, i) {var _arr = [];var _n = true;var _d = false;var _e = undefined;try {for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {_arr.push(_s.value);if (i && _arr.length === i) break;}} catch (err) {_d = true;_e = err;} finally {try {if (!_n && _i['return']) _i['return']();} finally {if (_d) throw _e;}}return _arr;}return function (arr, i) {if (Array.isArray(arr)) {return arr;} else if (Symbol.iterator in Object(arr)) {return sliceIterator(arr, i);} else {throw new TypeError('Invalid attempt to destructure non-iterable instance');}};})();var _createClass = (function () {function defineProperties(target, props) {for (var i = 0; i < props.length; i++) {var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ('value' in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);}}return function (Constructor, protoProps, staticProps) {if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;};})();exports['default'] = 




client;function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;}function _classCallCheck(instance, Constructor) {if (!(instance instanceof Constructor)) {throw new TypeError('Cannot call a class as a function');}}var _ = require('lodash');var Promise = require('bluebird');var cs = require('./client-server-base');function client(options) {
  var clientPlugin = new ClientPlugin(options);
  return function () {for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {args[_key] = arguments[_key];}
    return clientPlugin.applyPlugin.apply(clientPlugin, args);};}var 



ClientPlugin = (function () {
  function ClientPlugin(_ref) {var _this = this;var communication = _ref.communication;var _ref$intents = _ref.intents;var intents = _ref$intents === undefined ? {} : _ref$intents;var _ref$commands = _ref.commands;var commands = _ref$commands === undefined ? {} : _ref$commands;_classCallCheck(this, ClientPlugin);
    _.extend(this, { 
      communication: communication, intents: intents, commands: commands, 

      _nextIntentId: 1, 
      _pendingIntents: {} });

    _.extend(this.commands, cs.BUILTIN_COMMANDS);

    this.communication.onReceive(function (msg) {return _this.receive(msg);});}_createClass(ClientPlugin, [{ key: 'send', 


    // Send a message over the provided 'communication' object.
    value: function send(message) {
      var msgString = JSON.stringify(message);
      this.communication.send(msgString);} }, { key: 'receive', 


    // Called whenever a message is receive on the 'communication' object, will execute
    // commands receive from the server in response.
    value: function receive(msgString) {var _this2 = this;
      cs.parseMessage(msgString, function (message) {var _message = _slicedToArray(
        message, 1);var messageType = _message[0];
        switch (messageType) {
          case cs.COMMAND:
            return _this2.applyCommand(message);
          case cs.INTENT:
            throw new Error('Intents should not be sent to clients.');
          case cs.RESPONSE:
            return _this2.applyIntentResponse(message);}});} }, { key: 'applyPlugin', 




    // This method is called (indirectly) by u.plugin(client).
    value: function applyPlugin(u) {
      this.u = u;

      this.addNodeMethods();

      return { 
        methods: { 
          addIntent: this.addIntent.bind(this), 
          addCommand: this.addCommand.bind(this) } };} }, { key: 'addNodeMethods', 




    // Generates a map of methods that will send named intents when called.
    value: function addNodeMethods() {var _this3 = this;
      _.each(this.intents, function (i, name) {_this3.addIntent(name, i);});
      _.each(this.commands, function (c, name) {_this3.addCommand(name, c);});} }, { key: 'addIntent', 


    // Adds a new intent, including a method on nodes.
    value: function addIntent(intentName, _) {
      this.u.registerNodeProperties(_defineProperty({}, 
      intentName, this.makeIntentMethod(intentName)));} }, { key: 'addCommand', 



    // Adds a new command, including a method on nodes.
    value: function addCommand(commandName, commandCode) {
      this.u.registerNodeProperties(_defineProperty({}, 
      commandName, commandCode));} }, { key: 'makeIntentMethod', 



    // Generates a method that will send a named intent with the right parameters when called.
    value: function makeIntentMethod(intentName) {
      var client = this;
      return function () {var _this4 = this;
        // this here will be the node we're called upon
        var intentId = client._nextIntentId++;for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {args[_key2] = arguments[_key2];}
        var intent = [cs.INTENT, intentName, this.path(), cs.serializeAll(args), intentId];
        client.send(intent);

        return new Promise(function (resolve, reject) {
          client._pendingIntents[intentId] = { name: intentName, target: _this4, resolve: resolve, reject: reject };});};} }, { key: 'applyIntentResponse', 




    // Applies a response to an intent sent earlier.
    value: function applyIntentResponse(_ref2) {var _ref22 = _slicedToArray(_ref2, 4);var code = _ref22[0];var status = _ref22[1];var intentId = _ref22[2];var resultOrMessage = _ref22[3];
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


      delete this._pendingIntents[intentId];} }, { key: 'applyCommand', 


    // Applies a command received from the server to the local state.
    value: function applyCommand(_ref3) {var _ref32 = _slicedToArray(_ref3, 4);var code = _ref32[0];var commandName = _ref32[1];var objectPath = _ref32[2];var args = _ref32[3];
      // find the right one
      var command = this.commands[commandName];
      if (!command) 
      throw new Error('Received unknown command: \'' + commandName + '\'.');

      var u = this.u;
      var target = u(objectPath);
      args = cs.deserializeAll(u, args);

      return command.apply(target, args);} }]);return ClientPlugin;})();module.exports = exports['default'];
//# sourceMappingURL=../plugins/client.js.map