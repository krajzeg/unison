'use strict';Object.defineProperty(exports, '__esModule', { value: true });var _createClass = (function () {function defineProperties(target, props) {for (var i = 0; i < props.length; i++) {var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ('value' in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);}}return function (Constructor, protoProps, staticProps) {if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;};})();function _classCallCheck(instance, Constructor) {if (!(instance instanceof Constructor)) {throw new TypeError('Cannot call a class as a function');}}var _ = require('lodash');var 

ClientCommMock = (function () {
  function ClientCommMock() {_classCallCheck(this, ClientCommMock);
    _.extend(this, { 
      sentMessages: [], 
      sentMessageStrings: [] });}_createClass(ClientCommMock, [{ key: 'send', value: 



    function send(message) {
      this.sentMessageStrings.push(message);
      this.sentMessages.push(JSON.parse(message));} }, { key: 'onReceive', value: 


    function onReceive(callback) {
      this.receiveCallback = callback;} }, { key: 'pushServerCommand', value: 


    function pushServerCommand(commandName, objectPath) {for (var _len = arguments.length, parameters = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {parameters[_key - 2] = arguments[_key];}
      this.pushServerString(JSON.stringify(
      ['c', 
      commandName, 
      objectPath, 
      parameters]));} }, { key: 'pushServerString', value: 




    function pushServerString(msgString) {
      this.receiveCallback(msgString);} }]);return ClientCommMock;})();exports['default'] = ClientCommMock;module.exports = exports['default'];
//# sourceMappingURL=../mocks/client-comm.js.map