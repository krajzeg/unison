"use strict";Object.defineProperty(exports, "__esModule", { value: true });var _createClass = (function () {function defineProperties(target, props) {for (var i = 0; i < props.length; i++) {var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);}}return function (Constructor, protoProps, staticProps) {if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;};})();function _classCallCheck(instance, Constructor) {if (!(instance instanceof Constructor)) {throw new TypeError("Cannot call a class as a function");}}var ServerCommMock = (function () {
  function ServerCommMock() {_classCallCheck(this, ServerCommMock);
    this.clients = [];
    this.sentPerClient = {};
    this.callbacks = {};}_createClass(ServerCommMock, [{ key: "attach", value: 


    function attach(clientId) {
      this.callbacks.onAttach(clientId);} }, { key: "detach", value: 


    function detach(clientId) {
      this.callbacks.onDetach(clientId);} }, { key: "sendTo", value: 


    function sendTo(clientId, msgString) {
      var message = JSON.parse(msgString);
      if (!this.sentPerClient[clientId]) 
      this.sentPerClient[clientId] = [];
      this.sentPerClient[clientId].push(message);} }, { key: "messagesSentTo", value: 


    function messagesSentTo(clientId) {
      return this.sentPerClient[clientId] || [];} }, { key: "pushClientMessage", value: 


    function pushClientMessage(clientId, message) {
      var msgString = JSON.stringify(message);
      this.callbacks.onReceive(clientId, msgString);} }, { key: "pushClientString", value: 


    function pushClientString(clientId, msgString) {
      this.callbacks.onReceive(clientId, msgString);} }, { key: "onAttach", value: 


    function onAttach(callback) {this.callbacks.onAttach = callback;} }, { key: "onDetach", value: 
    function onDetach(callback) {this.callbacks.onDetach = callback;} }, { key: "onReceive", value: 
    function onReceive(callback) {this.callbacks.onReceive = callback;} }]);return ServerCommMock;})();exports["default"] = ServerCommMock;module.exports = exports["default"];
//# sourceMappingURL=../mocks/server-comm.js.map