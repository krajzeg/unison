'use strict';Object.defineProperty(exports, '__esModule', { value: true });var _createClass = (function () {function defineProperties(target, props) {for (var i = 0; i < props.length; i++) {var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ('value' in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);}}return function (Constructor, protoProps, staticProps) {if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;};})();function _classCallCheck(instance, Constructor) {if (!(instance instanceof Constructor)) {throw new TypeError('Cannot call a class as a function');}}var _util = require(

'./util');var _ = require('lodash');var 

UnisonEvents = (function () {
  function UnisonEvents(unison) {_classCallCheck(this, UnisonEvents);
    this.u = unison;
    this._listeners = {};}_createClass(UnisonEvents, [{ key: 'key', value: 


    function key(path, event) {
      return path + ':' + event;} }, { key: 'listen', value: 


    function listen(path, event, callback) {
      var key = this.key(path, event);
      var existingListeners = this._listeners[key] || [];
      this._listeners[key] = existingListeners.concat([callback]);} }, { key: 'unlisten', value: 


    function unlisten(path, event, callback) {
      var key = this.key(path, event);
      var listeners = (this._listeners[key] || []).filter(function (cb) {return cb != callback;});
      if (listeners.length == 0) {
        delete this._listeners[key];} else 
      {
        this._listeners[key] = listeners;}} }, { key: 'handle', value: 



    function handle(path, eventObj) {
      var key = this.key(path, eventObj.name);
      var listeners = this._listeners[key];
      if (listeners) {
        listeners.map(function (l) {
          try {
            l(eventObj);} 
          catch (e) {
            console.error('Error in listener in response to ' + path + '|' + event);
            console.error(e.stack || e);}});}} }, { key: 'trigger', value: 





    function trigger(path, event) {var _this = this;var payload = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];
      var source = this.u(path);
      var eventObj = new UnisonEvent(event, source, payload);

      var paths = undefined;
      if (path != '') {
        paths = [path, (0, _util.childPath)((0, _util.parentPath)(path), '*')]; // X.Y.Z, X.Y.*

        path = (0, _util.childPath)(path, '**'); // X.Y.Z -> X.Y.Z.**
        paths.push(path);
        while (path.indexOf('.') >= 0) {
          path = (0, _util.childPath)((0, _util.parentPath)((0, _util.parentPath)(path)), '**'); // X.Y.** -> X.**
          paths.push(path);}} else 

      {
        paths = ['', '**'];}


      paths.forEach(function (path) {
        if (!eventObj._handled) 
        _this.handle(path, eventObj);});} }, { key: 'triggerAll', value: 



    function triggerAll(events) {var _this2 = this;
      _.each(events, function (event) {
        _this2.trigger.apply(_this2, event);});} }]);return UnisonEvents;})()




// Represents all events triggered from Unison and their common properties.
;exports['default'] = UnisonEvents;var UnisonEvent = (function () {
  function UnisonEvent(name, source) {var additionalProps = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];_classCallCheck(this, UnisonEvent);
    this.name = name;
    this.source = source;
    this._handled = false;

    _.extend(this, additionalProps);}_createClass(UnisonEvent, [{ key: 'stopBubbling', value: 


    function stopBubbling() {
      this._handled = true;} }]);return UnisonEvent;})();module.exports = exports['default'];
//# sourceMappingURL=events.js.map