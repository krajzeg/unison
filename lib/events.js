let _ = require('lodash');

import {childPath, parentPath} from './util';

export default class UnisonEvents {
  constructor() {
    this._listeners = {};
  }

  key(path, event) {
    return `${path}:${event}`;
  }

  listen(path, event, callback) {
    let key = this.key(path, event);
    let existingListeners = this._listeners[key] || [];
    this._listeners[key] = existingListeners.concat([callback]);
  }

  unlisten(path, event, callback) {
    let key = this.key(path, event);
    let listeners  = (this._listeners[key] || []).filter((cb) => cb != callback);
    if (listeners.length == 0) {
      delete this._listeners[key];
    } else {
      this._listeners[key] = listeners;
    }
  }

  handle(path, event, payload) {
    let key = this.key(path, event);
    let listeners = this._listeners[key];
    if (listeners) {
      listeners.map((l) => {
        try {
          l(payload);
        } catch (e) {
          console.error(`Error in listener in response to ${path}|${event}`);
          console.error(e.stack || e);
        }
      });
    }
  }

  trigger(path, event, payload) {
    let paths;
    if (path != '') {
      paths = [path, childPath(parentPath(path), '*')]; // X.Y.Z, X.Y.*

      path = childPath(parentPath(path), '**'); // X.Y.Z -> X.Y.**
      paths.push(path);
      while(path.indexOf('.') >= 0) {
        path = childPath(parentPath(parentPath(path)), '**'); // X.Y.** -> X.**
        paths.push(path);
      }
    } else {
      paths = ['', '**'];
    }

    paths.forEach((path) => {
      this.handle(path, event, payload);
    });
  }

  triggerAll(events) {
    _.each(events, (event) => {
      this.trigger.apply(this, event);
    });
  }
}