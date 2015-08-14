'use strict';Object.defineProperty(exports, '__esModule', { value: true });var _createClass = (function () {function defineProperties(target, props) {for (var i = 0; i < props.length; i++) {var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ('value' in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);}}return function (Constructor, protoProps, staticProps) {if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;};})();function _classCallCheck(instance, Constructor) {if (!(instance instanceof Constructor)) {throw new TypeError('Cannot call a class as a function');}}var Promise = require('bluebird');var 

Queue = (function () {
  function Queue() {_classCallCheck(this, Queue);
    this.runningTask = null;
    this.queuedTasks = [];

    this.emptyPromise = null;
    this.triggerEmpty = null;}_createClass(Queue, [{ key: 'schedule', value: 


    function schedule(task) {var _this = this;
      this.queuedTasks.push(task);
      if (!this.emptyPromise) {
        this.emptyPromise = new Promise(function (resolve) {
          _this.triggerEmpty = resolve;});}


      this.runNextTask();} }, { key: 'runNextTask', value: 


    function runNextTask() {var _this2 = this;
      while (!this.runningTask && this.queuedTasks.length) {
        // pick next task
        var task = this.runningTask = this.queuedTasks.shift();
        // start it!
        var maybeAPromise = task();

        if (maybeAPromise && maybeAPromise.then) {
          // the task returned a promise, so we'll wait for it to resolve
          maybeAPromise.then(function () {
            _this2.runningTask = null;
            _this2.runNextTask();})['catch'](
          function (err) {
            // if it resolves with an error, we still have to manage the queue
            _this2.runningTask = null;
            setTimeout(_this2.runNextTask.bind(_this2), 0);
            // but we rethrow the error anyway
            throw err;});} else 

        {
          // the task didn't return a promise, meaning we can mark it as done synchronously
          this.runningTask = null;}}



      if (!this.runningTask && !this.queuedTasks.length) {
        // out of tasks?
        this.triggerEmpty();
        this.emptyPromise = this.triggerEmpty = null;}} }, { key: 'synchronize', 



    /**
      Takes a function and returns the same function synchronized with this queue. This means
      that this function's execution will always be delayed until nothing else is in this queue.
     **/value: 
    function synchronize(fn) {
      var queue = this;
      return function () {for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {args[_key] = arguments[_key];}
        queue.schedule(function () {
          return fn.apply(undefined, args);});};} }, { key: 'waitUntilEmpty', value: 




    function waitUntilEmpty() {
      return this.emptyPromise || Promise.resolve();} }]);return Queue;})();exports.Queue = Queue;
//# sourceMappingURL=task-queues.js.map