'use strict';Object.defineProperty(exports, '__esModule', { value: true });var _createClass = (function () {function defineProperties(target, props) {for (var i = 0; i < props.length; i++) {var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ('value' in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);}}return function (Constructor, protoProps, staticProps) {if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;};})();function _toConsumableArray(arr) {if (Array.isArray(arr)) {for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];return arr2;} else {return Array.from(arr);}}function _classCallCheck(instance, Constructor) {if (!(instance instanceof Constructor)) {throw new TypeError('Cannot call a class as a function');}}var _util = require(

'./util');var _ = require('lodash');var 

UnisonEvents = (function () {
  function UnisonEvents(unison) {_classCallCheck(this, UnisonEvents);
    this.u = unison;
    this._listeners = {};}










































































  // Represents all events triggered from Unison and their common properties.
  _createClass(UnisonEvents, [{ key: 'key', value: function key(path, event) {return path + ':' + event;} }, { key: 'listen', value: function listen(path, event, callback) {var options = arguments.length <= 3 || arguments[3] === undefined ? {} : arguments[3];var priority = options.priority || 0;var key = this.key(path, event);var existingListeners = this._listeners[key] || [];this._listeners[key] = existingListeners.concat([{ callback: callback, priority: priority, path: path }]);} }, { key: 'unlisten', value: function unlisten(path, event, callback) {var key = this.key(path, event);var listeners = (this._listeners[key] || []).filter(function (l) {return l.callback != callback;});if (listeners.length == 0) {delete this._listeners[key];} else {this._listeners[key] = listeners;}} }, { key: 'executeListener', value: function executeListener(listener, eventObj) {try {listener.callback(eventObj);} catch (e) {console.error('Error in listener in response to ' + listener.path + '|' + eventObj.name);console.error(e.stack || e);}} }, { key: 'trigger', value: function trigger(path, event) {var _this = this;var payload = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];var source = this.u(path);var eventObj = new UnisonEvent(event, source, this.u.currentTime(), payload); // gather all paths that should be considered in order
      var paths = undefined;if (path != '') {paths = [path, (0, _util.childPath)((0, _util.parentPath)(path), '*')]; // X.Y.Z, X.Y.*
        path = (0, _util.childPath)(path, '**'); // X.Y.Z -> X.Y.Z.**
        paths.push(path);while (path.indexOf('.') >= 0) {path = (0, _util.childPath)((0, _util.parentPath)((0, _util.parentPath)(path)), '**'); // X.Y.** -> X.**
          paths.push(path);}} else {paths = ['', '**'];} // grab listeners from all the paths
      var listeners = [];paths.forEach(function (path) {var _listeners;var listenersForPath = _this._listeners[_this.key(path, event)];if (listenersForPath) (_listeners = listeners).push.apply(_listeners, _toConsumableArray(listenersForPath));}); // sort them by priority
      listeners = _.sortBy(listeners, 'priority'); // execute them in turn
      listeners.forEach(function (l) {return _this.executeListener(l, eventObj);});} }, { key: 'triggerAll', value: function triggerAll(events) {var _this2 = this;_.each(events, function (event) {_this2.trigger.apply(_this2, event);});} }]);return UnisonEvents;})();exports['default'] = UnisonEvents;var UnisonEvent = function UnisonEvent(name, source, timestamp) {var additionalProps = arguments.length <= 3 || arguments[3] === undefined ? {} : arguments[3];_classCallCheck(this, UnisonEvent);this.name = name;this.source = source;this.snapshot = source.at(timestamp);this.timestamp = timestamp;_.extend(this, additionalProps);};module.exports = exports['default'];
//# sourceMappingURL=events.js.map