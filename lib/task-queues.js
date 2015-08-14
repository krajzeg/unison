let Promise = require('bluebird');

export class Queue {
  constructor() {
    this.runningTask = null;
    this.queuedTasks = [];

    this.emptyPromise = null;
    this.triggerEmpty = null;
  }

  schedule(task) {
    this.queuedTasks.push(task);
    if (!this.emptyPromise) {
      this.emptyPromise = new Promise((resolve) => {
        this.triggerEmpty = resolve;
      });
    }
    this.runNextTask();
  }

  runNextTask() {
    while ((!this.runningTask) && (this.queuedTasks.length)) {
      // pick next task
      let task = this.runningTask = this.queuedTasks.shift();
      // start it!
      let maybeAPromise = task();

      if (maybeAPromise && maybeAPromise.then) {
        // the task returned a promise, so we'll wait for it to resolve
        maybeAPromise.then(() => {
          this.runningTask = null;
          this.runNextTask();
        }).catch((err) => {
          // if it resolves with an error, we still have to manage the queue
          this.runningTask = null;
          setTimeout(this.runNextTask.bind(this), 0);
          // but we rethrow the error anyway
          throw err;
        });
      } else {
        // the task didn't return a promise, meaning we can mark it as done synchronously
        this.runningTask = null;
      }
    }

    if ((!this.runningTask) && (!this.queuedTasks.length)) {
      // out of tasks?
      this.triggerEmpty();
      this.emptyPromise = this.triggerEmpty = null;
    }
  }

  /**
    Takes a function and returns the same function synchronized with this queue. This means
    that this function's execution will always be delayed until nothing else is in this queue.
   **/
  synchronize(fn) {
    let queue = this;
    return function(...args) {
      queue.schedule(() => {
        return fn(...args);
      });
    }
  }

  waitUntilEmpty() {
    return this.emptyPromise || Promise.resolve();
  }
}
