let _ = require('lodash');

import {childPath, parentPath, idFromPath, shallowClone} from './util';
import {stateWithUpdate, stateWithDelete} from './immutable-states';
import UnisonEvents from './events';

// Main Unison object.
// Uses classical instead of ES6 classes to allow Unison.apply(...) down the road.
export default function Unison(initialState = {}, options = {}) {
  this._events = new UnisonEvents(this);

  this._states = {0: initialState};
  this._current = 0;
  this._nextId = 1;

  this.config = _.defaults(options, {
    backlogSize: 1000
  });

  // each Unison object has its own pseudo-class for nodes that can be extended by plugins
  this._nodeBase = Object.create(UnisonNode.prototype);
  this._makeNode = function(...args) {
    UnisonNode.apply(this, args);
  };
  this._makeNode.prototype = this._nodeBase;
}
Unison.prototype = {
  grab(path, time = undefined) {
    if ((time !== undefined) && (!this._states[time]))
      throw(`Can't create a snapshot at time ${time} - no state recorded for that timestamp.`);
    let Node = this._makeNode;
    return new Node(this, path, time);
  },

  currentState() {
    return this._states[this._current];
  },

  stateAt(time) {
    return (time !== undefined) ? this._states[time] : this._states[this._current];
  },

  applyChange(path, changedProperties, deletedProperties = undefined) {
    let changedState = stateWithUpdate(this.currentState(), path, changedProperties, deletedProperties);
    this._states[++this._current] = changedState;

    let backlogSize = this.config.backlogSize;
    if (backlogSize && (this._current >= backlogSize))
      delete this._states[this._current - backlogSize];
  },

  listen(...args) { return this._events.listen.apply(this._events, args); },
  unlisten(...args) { return this._events.unlisten.apply(this._events, args); },

  collectEvents(path, directEvent, acc = []) {
    let object = _.get(this.currentState(), path);

    acc.push([path, directEvent]);
    _.each(object, (child, id) => {
      if (typeof child === 'object' && !(child instanceof Array)) {
        // that's a child, trigger childAdded and recurse into it
        this.collectEvents(childPath(path, id), directEvent, acc);
      }
    });

    return acc;
  },

  nextId() {
    return (this._nextId++).toString();
  },

  registerGlobalProperties(props) {
    _.extend(this, props);
  },

  registerNodeProperties(props) {
    _.extend(this._nodeBase, props);
  },

  plugin(pluginFn) {
    var additions = pluginFn(this) || {};
    this.registerGlobalProperties(additions.methods || {});
    this.registerNodeProperties(additions.nodeMethods || {});

    return this;
  }
};

class UnisonNode {
  constructor(unison, path, time = undefined) {
    this.u = unison;
    this._path = path;
    this._time = time; // undefined means 'always use current state'
  }

  path() {
    return this._path;
  }

  timestamp() {
    return this._time;
  }

  id() {
    return idFromPath(this.path());
  }

  parent() {
    return this.u.grab(parentPath(this.path()), this._time);
  }

  child(id) {
    return this.u.grab(childPath(this.path(), id), this._time);
  }

  at(time) {
    return this.u.grab(this._path, time);
  }

  state() {
    if (this._path === '') {
      return this.u.stateAt(this._time);
    } else {
      return _.get(this.u.stateAt(this._time), this._path);
    }
  }

  get get() {
    return this.state();
  }

  update(props) {
    this.ensureCurrent();
    this.u.applyChange(this._path, props);
    this.trigger('updated');
  }

  add(...args) {
    let unison = this.u;

    // extract arguments (either (child) or (id, child))
    let id, child;
    if (args.length == 2) {
      [id, child] = args;
    } else {
      child = args[0];
      id = unison.nextId();
    }

    // sanity checks
    this.ensureCurrent();
    let state = this.state();
    expectObject(state, `Can't add child at ${this._path}`);
    if (state[id] !== undefined) {
      throw new Error(`Can't add child '${id}' at ${this._path} - it already exists.`);
    }
    validateId(id);

    // add it
    this.u.applyChange(this._path, {[id]: child});

    // trigger events
    let pathToChild = childPath(this.path(), id);
    unison._events.triggerAll(unison.collectEvents(pathToChild, 'created'));

    // return the path to the newly created child
    return pathToChild;
  }

  remove(id) {
    // sanity checks
    this.ensureCurrent();
    let state = this.state();
    expectObject(state, `Can't remove child at ${this._path}`);
    if (state[id] === undefined) {
      throw new Error(`Can't remove child '${id}' at ${this._path} - no such object exists.`);
    }

    // store events for later, as the object themselves will disappear
    let pathToChild = childPath(this._path, id);
    var events = this.u.collectEvents(pathToChild, 'destroyed');

    // remove the object
    this.u.applyChange(this._path, {}, [id]);

    // trigger the events
    this.u._events.triggerAll(events);

    // done
    return true;
  }

  destroy() {
    // straightforward translation
    expectObject(this.state(), "Can't destroy ${this._path}");
    return this.parent().remove(this.id());
  }

  on(event, callback) {
    this.u._events.listen(this._path, event, callback);
  }

  off(event, callback) {
    this.u._events.unlisten(this._path, event, callback);
  }

  onAny(event, callback) {
    this.u._events.listen(childPath(this._path, '**'), event, callback);
  }

  offAny(event, callback) {
    this.u._events.unlisten(childPath(this._path, '**'), event, callback);
  }

  onChild(event, callback) {
    this.u._events.listen(childPath(this._path, '*'), event, callback);
  }

  offChild(event, callback) {
    this.u._events.unlisten(childPath(this._path, '*'), event, callback);
  }

  trigger(event, payload) {
    this.u._events.trigger(this._path, event, payload);
  }

  ensureCurrent() {
    if (this._time !== undefined)
      throw new Error("Destructive operations are only allowed on nodes representing the current state, not a snapshot.");
  }
}

function expectObject(state, msg) {
  if (state === undefined) {
    throw new Error(`${msg} - node does not exist.`)
  }
  if (typeof state != 'object') {
    throw new Error(`${msg} - '${state}' is not an object.`);
  }
}

function validateId(id) {
  if (id == '') throw new Error('IDs have to be non-empty.');
  if (id.indexOf(".") >= 0) throw new Error('IDs cannot contain dots.');
}