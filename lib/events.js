let _ = require('lodash');

import {childPath, parentPath} from './util';

export default class UnisonEvents {
  constructor(unison) {
    this.u = unison
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

  handle(path, eventObj) {
    let key = this.key(path, eventObj.name);
    let listeners = this._listeners[key];
    if (listeners) {
      listeners.map((l) => {
        try {
          l(eventObj);
        } catch (e) {
          console.error(`Error in listener in response to ${path}|${eventObj.name}`);
          console.error(e.stack || e);
        }
      });
    }
  }

  trigger(path, event, payload = {}) {
    let source = (this.u)(path);
    let eventObj = new UnisonEvent(event, source, this.u.currentTime(), payload);

    let paths;
    if (path != '') {
      paths = [path, childPath(parentPath(path), '*')]; // X.Y.Z, X.Y.*

      path = childPath(path, '**'); // X.Y.Z -> X.Y.Z.**
      paths.push(path);
      while(path.indexOf('.') >= 0) {
        path = childPath(parentPath(parentPath(path)), '**'); // X.Y.** -> X.**
        paths.push(path);
      }
    } else {
      paths = ['', '**'];
    }

    paths.forEach((path) => {
      if (!eventObj._handled)
        this.handle(path, eventObj);
    });
  }

  triggerAll(events) {
    _.each(events, (event) => {
      this.trigger.apply(this, event);
    });
  }
}

// Represents all events triggered from Unison and their common properties.
class UnisonEvent {
  constructor(name, source, timestamp, additionalProps = {}) {
    this.name = name;
    this.source = source;
    this.snapshot = source.at(timestamp);
    this.timestamp = timestamp;
    this._handled = false;

    _.extend(this, additionalProps);
  }

  stopBubbling() {
    this._handled = true;
  }
}
