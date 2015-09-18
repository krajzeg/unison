let _ = require('lodash');

import {childPath, parentPath} from './util';

export default class UnisonEvents {
  constructor(unison) {
    this.u = unison;
    this._listeners = {};
  }

  key(path, event) {
    return `${path}:${event}`;
  }

  listen(path, event, callback, options = {}) {
    let priority = options.priority || 0;

    let key = this.key(path, event);
    let existingListeners = this._listeners[key] || [];
    this._listeners[key] = existingListeners.concat([{callback, priority, path}]);
  }

  unlisten(path, event, callback) {
    let key = this.key(path, event);
    let listeners  = (this._listeners[key] || []).filter((l) => l.callback != callback);
    if (listeners.length == 0) {
      delete this._listeners[key];
    } else {
      this._listeners[key] = listeners;
    }
  }

  executeListener(listener, eventObj) {
    try {
      (listener.callback)(eventObj);
    } catch (e) {
      console.error(`Error in listener in response to ${listener.path}|${eventObj.name}`);
      console.error(e.stack || e);
    }
  }

  trigger(path, event, payload = {}) {
    let source = (this.u)(path);
    let eventObj = new UnisonEvent(event, source, this.u.currentTime(), payload);

    // gather all paths that should be considered in order
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

    // grab listeners from all the paths
    let listeners = [];
    paths.forEach((path) => {
      let listenersForPath = this._listeners[this.key(path, event)];
      if (listenersForPath)
        listeners.push(...listenersForPath);
    });

    // sort them by priority
    listeners = _.sortBy(listeners, 'priority');

    // execute them in turn
    listeners.forEach((l) => this.executeListener(l, eventObj));
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

    _.extend(this, additionalProps);
  }
}
