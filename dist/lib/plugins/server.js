'use strict';Object.defineProperty(exports, '__esModule', { value: true });var _slicedToArray = (function () {function sliceIterator(arr, i) {var _arr = [];var _n = true;var _d = false;var _e = undefined;try {for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {_arr.push(_s.value);if (i && _arr.length === i) break;}} catch (err) {_d = true;_e = err;} finally {try {if (!_n && _i['return']) _i['return']();} finally {if (_d) throw _e;}}return _arr;}return function (arr, i) {if (Array.isArray(arr)) {return arr;} else if (Symbol.iterator in Object(arr)) {return sliceIterator(arr, i);} else {throw new TypeError('Invalid attempt to destructure non-iterable instance');}};})();var _createClass = (function () {function defineProperties(target, props) {for (var i = 0; i < props.length; i++) {var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ('value' in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);}}return function (Constructor, protoProps, staticProps) {if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;};})();exports['default'] = 



server;function _classCallCheck(instance, Constructor) {if (!(instance instanceof Constructor)) {throw new TypeError('Cannot call a class as a function');}}var _clientServerBase = require('./client-server-base');var _ = require('lodash');function server(options) {
  var serverPlugin = new ServerPlugin(options);
  return function () {for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {args[_key] = arguments[_key];}
    return serverPlugin.applyPlugin.apply(serverPlugin, args);};}var 



ServerPlugin = (function () {
  function ServerPlugin(_ref) {var _this = this;var communication = _ref.communication;var _ref$intents = _ref.intents;var intents = _ref$intents === undefined ? {} : _ref$intents;var _ref$commands = _ref.commands;var commands = _ref$commands === undefined ? {} : _ref$commands;_classCallCheck(this, ServerPlugin);
    _.extend(this, { communication: communication, intents: intents, commands: commands });
    _.extend(this.commands, _clientServerBase.BUILTIN_COMMANDS);

    this.clients = [];

    this.communication.onAttach(function (client) {return _this.attach(client);});
    this.communication.onDetach(function (client) {return _this.detach(client);});
    this.communication.onReceive(function (client, msg) {return _this.receive(client, msg);});}_createClass(ServerPlugin, [{ key: 'applyPlugin', value: 


    function applyPlugin($$) {
      this.$$ = $$;
      return { 
        nodeMethods: this.generateCommandMethods() };} }, { key: 'attach', value: 



    function attach(client) {
      this.clients.push(client);

      var $$ = this.$$, rootState = $$('').state();
      this.sendTo(client, [_clientServerBase.COMMAND, '_seed', '', [rootState]]);} }, { key: 'detach', value: 


    function detach(client) {
      var position = this.clients.indexOf(client);
      if (position >= 0) 
      this.clients.splice(position, 1);} }, { key: 'receive', value: 


    function receive(client, msgString) {var _this2 = this;
      (0, _clientServerBase.parseMessage)(msgString, function (message) {var _message = _slicedToArray(
        message, 1);var messageType = _message[0];
        switch (messageType) {
          case _clientServerBase.INTENT:
            return _this2.applyIntent(client, message);
          case _clientServerBase.COMMAND:
            throw new Error('Servers do not obey commands.');}});} }, { key: 'sendToAll', value: 




    function sendToAll(message) {var _this3 = this;
      var msgString = JSON.stringify(message);
      _.each(this.clients, function (client) {
        _this3.communication.sendTo(client, msgString);});} }, { key: 'sendTo', value: 



    function sendTo(client, message) {
      var msgString = JSON.stringify(message);
      this.communication.sendTo(client, msgString);} }, { key: 'applyIntent', value: 


    function applyIntent(client, _ref2) {var _ref22 = _slicedToArray(_ref2, 4);var code = _ref22[0];var intentName = _ref22[1];var objectPath = _ref22[2];var parameters = _ref22[3];
      var intentFn = this.intents[intentName];
      var $$ = this.$$, target = $$(objectPath);

      var fullParameters = parameters.concat(client);
      return intentFn.apply(target, fullParameters);} }, { key: 'generateCommandMethods', value: 


    function generateCommandMethods() {var _this4 = this;
      return _.object(_.map(this.commands, 
      function (commandFn, commandName) {return [commandName, _this4.makeCommandMethod(commandName, commandFn)];}));} }, { key: 'makeCommandMethod', value: 



    function makeCommandMethod(commandName, commandFn) {
      var server = this;
      return function () {for (var _len2 = arguments.length, parameters = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {parameters[_key2] = arguments[_key2];}
        // 'this' refers to the Node on which the method was called here
        commandFn.apply(this, parameters); // apply the changes on the server
        server.sendToAll([_clientServerBase.COMMAND, commandName, this.path(), parameters]); // send the changes to all the clients
      };} }]);return ServerPlugin;})();module.exports = exports['default'];
//# sourceMappingURL=../plugins/server.js.map