let _ = require('lodash');


export default class Unison {
  constructor(initialState = {}) {
    this._state = initialState;
    this._nextId = 1;

    this._events = new UnisonEvents();

    // each Unison object has its own pseudo-class for nodes that can be extended by plugins
    this._nodeBase = Object.create(UnisonNode.prototype);
    this._makeNode = function(unison, path) {
      UnisonNode.apply(this, [unison, path]);
    };
    this._makeNode.prototype = this._nodeBase;
  }

  grab(path) {
    let Node = this._makeNode;
    return new Node(this, path);
  }

  listen(...args) { return this._events.listen.apply(this._events, args); }
  unlisten(...args) { return this._events.unlisten.apply(this._events, args); }

  collectEvents(path, directEvent, childEvent, acc = []) {
    let parent = parentPath(path), id = idFromPath(path);
    let object = _.get(this._state, path);

    acc.push([parent, childEvent, id]);
    acc.push([path, directEvent]);

    _.each(object, (subchild, id) => {
      if (typeof subchild === 'object' && !(subchild instanceof Array)) {
        // that's a child, trigger childAdded and recurse into it
        this.collectEvents(childPath(path, id), directEvent, childEvent, acc);
      }
    });

    return acc;
  }

  nextId() {
    return this._nextId++;
  }
}

class UnisonEvents {
  constructor() {
    this._listeners = {};
  }

  key(path, event) {
    return `${path}:${event}`;
  }

  listen(path, event, callback) {
    let key = this.key(path, event);
    let existingListeners = [];
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

  trigger(path, event, ...payload) {
    let key = this.key(path, event);
    let listeners = this._listeners[key] || [];
    listeners.map((listener) => {
      try {
        listener.apply(null, payload);
      } catch (e) {
        console.error(`Error in listener in response to ${path}|${event}`);
        console.error(e.stack || e);
      }
    });
  }

  triggerAll(events) {
    _.each(events, (event) => {
      this.trigger.apply(this, event);
    });
  }
}

class UnisonNode {
  constructor(unison, path) {
    this._unison = unison;
    this._path = path;
  }

  path() {
    return this._path;
  }

  id() {
    return idFromPath(this.path());
  }

  parent() {
    return this._unison.grab(parentPath(this.path()));
  }

  child(id) {
    return this._unison.grab([this._path, id].join('.'));
  }

  state() {
    if (this._path === '') {
      return this._unison._state;
    } else {
      return _.get(this._unison._state, this._path);
    }
  }

  update(props) {
    var state = this.state();
    if (state === undefined) return;

    _.extend(state, props);
    this._unison._events.trigger(this._path, 'updated');
  }

  add(...args) {
    let unison = this._unison;

    // extract arguments (either (child) or (id, child))
    let id, child;
    if (args.length == 2) {
      [id, child] = args;
    } else {
      child = args[0];
      id = unison.nextId();
    }

    // sanity checks
    let state = this.state();
    expectObject(state, `Can't add child at ${this._path}`);
    if (state[id] !== undefined) {
      throw new Error(`Can't add child '${id}' at ${this._path} - it already exists.`);
    }

    // add it
    state[id] = child;

    // trigger events
    let childPath = [this._path, id].join(".");
    unison._events.triggerAll(unison.collectEvents(childPath, 'created', 'childAdded'));

    // return the path to the newly created child
    return childPath;
  }

  remove(id) {
    let unison = this._unison;
    let state = this.state();

    // sanity checks
    expectObject(state, `Can't remove child at ${this._path}`);

    // does it even exist?
    if (state[id] === undefined) {
      return false;
    }

    // store events for later, as the object themselves will disappear
    let childPath = [this._path, id].join(".");
    var events = unison.collectEvents(childPath, "destroyed", "childRemoved");

    // remove the object
    delete state[id];

    // trigger the events
    unison._events.triggerAll(events);

    // done
    return true;
  }

  destroy() {
    // straightforward translation
    expectObject(this.state(), "Can't destroy ${this._path}");
    return this.parent().remove(this.id());
  }

  on(event, callback) {
    this._unison._events.listen(this._path, event, callback);
  }

  off(event, callback) {
    this._unison._events.unlisten(this._path, event, callback);
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

function idFromPath(path) {
  if (path === '') {
    throw new Error('The root object has no id.');
  } else {
    return _.last(path.split("."));
  }
}

function parentPath(path) {
  if (path === '') {
    throw new Error('The root object has no parent.');
  } else {
    let pathElements = path.split(".");
    return pathElements
      .slice(0, pathElements.length-1)
      .join(".");
  }
}

function childPath(path, id) {
  return [path, id].join('.');
}