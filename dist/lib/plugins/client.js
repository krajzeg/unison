"use strict";Object.defineProperty(exports, "__esModule", { value: true });var _slicedToArray = (function () {function sliceIterator(arr, i) {var _arr = [];var _n = true;var _d = false;var _e = undefined;try {for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {_arr.push(_s.value);if (i && _arr.length === i) break;}} catch (err) {_d = true;_e = err;} finally {try {if (!_n && _i["return"]) _i["return"]();} finally {if (_d) throw _e;}}return _arr;}return function (arr, i) {if (Array.isArray(arr)) {return arr;} else if (Symbol.iterator in Object(arr)) {return sliceIterator(arr, i);} else {throw new TypeError("Invalid attempt to destructure non-iterable instance");}};})();var _createClass = (function () {function defineProperties(target, props) {for (var i = 0; i < props.length; i++) {var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);}}return function (Constructor, protoProps, staticProps) {if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;};})();exports["default"] = 



client;function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;}function _classCallCheck(instance, Constructor) {if (!(instance instanceof Constructor)) {throw new TypeError("Cannot call a class as a function");}}var _clientServerBase = require("./client-server-base");var _ = require('lodash');function client(options) {
  var clientPlugin = new ClientPlugin(options);
  return function () {for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {args[_key] = arguments[_key];}
    return clientPlugin.applyPlugin.apply(clientPlugin, args);};}var 



ClientPlugin = (function () {
  function ClientPlugin(_ref) {var _this = this;var communication = _ref.communication;var _ref$intents = _ref.intents;var intents = _ref$intents === undefined ? {} : _ref$intents;var _ref$commands = _ref.commands;var commands = _ref$commands === undefined ? {} : _ref$commands;_classCallCheck(this, ClientPlugin);
    _.extend(this, { communication: communication, intents: intents, commands: commands });

    _.extend(this.commands, _clientServerBase.BUILTIN_COMMANDS);
    this.communication.onReceive(function (msg) {return _this.receive(msg);});}


  // Send a message over the provided 'communication' object.
  _createClass(ClientPlugin, [{ key: "send", value: function send(message) {
      var msgString = JSON.stringify(message);
      this.communication.send(msgString);}


    // Called whenever a message is receive on the 'communication' object, will execute
    // commands receive from the server in response.
  }, { key: "receive", value: function receive(msgString) {var _this2 = this;
      (0, _clientServerBase.parseMessage)(msgString, function (message) {var _message = _slicedToArray(
        message, 1);var messageType = _message[0];
        switch (messageType) {
          case _clientServerBase.COMMAND:
            return _this2.applyCommand(message);
          case _clientServerBase.INTENT:
            throw new Error("Intents should not be sent to clients.");}});}




    // This method is called (indirectly) by $$.plugin(client).
  }, { key: "applyPlugin", value: function applyPlugin($$) {
      this.$$ = $$;

      this.addNodeMethods();

      return { 
        methods: { 
          addIntent: this.addIntent.bind(this), 
          addCommand: this.addCommand.bind(this) } };}




    // Generates a map of methods that will send named intents when called.
  }, { key: "addNodeMethods", value: function addNodeMethods() {var _this3 = this;
      _.each(this.intents, function (i, name) {_this3.addIntent(name, i);});
      _.each(this.commands, function (c, name) {_this3.addCommand(name, c);});}


    // Adds a new intent, including a method on nodes.
  }, { key: "addIntent", value: function addIntent(intentName, _) {
      this.$$.registerNodeProperties(_defineProperty({}, 
      intentName, this.makeIntentMethod(intentName)));}



    // Adds a new command, including a method on nodes.
  }, { key: "addCommand", value: function addCommand(commandName, commandCode) {
      this.$$.registerNodeProperties(_defineProperty({}, 
      commandName, commandCode));}



    // Generates a method that will send a named intent with the right parameters when called.
  }, { key: "makeIntentMethod", value: function makeIntentMethod(intentName) {
      var client = this;
      return function () {for (var _len2 = arguments.length, parameters = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {parameters[_key2] = arguments[_key2];}
        // this here will be the node we're called upon
        var intent = [_clientServerBase.INTENT, intentName, this.path(), parameters];
        client.send(intent);};}



    // Applies a command received from the server to the local state.
  }, { key: "applyCommand", value: function applyCommand(_ref2) {var _ref22 = _slicedToArray(_ref2, 4);var code = _ref22[0];var commandName = _ref22[1];var objectPath = _ref22[2];var parameters = _ref22[3];
      // find the right one
      var command = this.commands[commandName];
      if (!command) 
      throw new Error("Received unknown command: '" + commandName + "'.");

      var $$ = this.$$;
      var target = $$(objectPath);

      return command.apply(target, parameters);} }]);return ClientPlugin;})()



/*
 intent:
 function moveMagnet(clientId, $$magnet, newPosition) {
 $$magnet.moveTo(newPosition);
 }

 command:
 function moveTo($$magnet, newPosition) {
 $$magnet.update({x: newPosition.x, y: newPosition.y});
 }

 tryMovingMagnet(clientId, newPosition) {
  this.command.moveTo(newPosition);
 }
 moveMagnetTo(newPosition) {
  this.update({x: newPosition.x, y: newPosition.y})
 }

magnet.intent.move({x: 12, y: 44});
 */


/*

 COMMUNICATION LOGIC:
 client - intent method:   send [object, intent, parameters] to the server
 client - command method:  < not present >
 client - apply intent:    < not present >
 client - apply command:   execute the code

 server - intent method:   virtual send [object, intent, parameters] to yourself
 server - apply intent:    execute the code, calling one or more command method or rejecting the intent
 server - command method:  execute the code, send [object, command, parameters] to all clients
 server - apply command:   < not present >

 intent code - runs on the server, translates intent into commands
 command code - runs on both, applies changes to state
 */;module.exports = exports["default"];
//# sourceMappingURL=../plugins/client.js.map