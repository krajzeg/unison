let _ = require('lodash');

import {childPath, parentPath, idFromPath, isObject, wrapFunction} from './util';
import {stateWithUpdate, stateWithDelete} from './immutable-states';
import UnisonEvents from './events';

// Main Unison object.
// Uses classical instead of ES6 classes to allow Unison.apply(...) down the road.
export default function Unison(initialState = {}, options = {}) {
  this._events = new UnisonEvents(this);

  this._states = {0: _.extend(initialState, {_t: 'Root', _nextId: 1})};
  this._current = 0;

  this.config = _.defaults(options, {
    backlogSize: 1000
  });

  // this is a space for additional private state kept by the server/client
  // intended for objects with methods and other non-JSON-serializable stuff
  this.privates = {};

  // nodes in the Unison state can have different class-like types
  // Node is the master-type that they all inherit from, and can be used
  // to add capabilities to all nodes
  this.types = {};
  this.types.Node = { name: 'Node', definitions: {}, proto: Object.create(UnisonNode.prototype) };
  this.types.Root = { name: 'Root', definitions: {extend: 'Node'}, extend: this.types.Node, proto: Object.create(this.types.Node.proto) };

  // machinery behind the 'define' call
  this.onDefineCallbacks = [];
}

Unison.prototype = {
  grab(path = '', time = undefined) {
    if ((time !== undefined) && (!this._states[time]))
      throw(`Can't create a snapshot at time ${time} - no state recorded for that timestamp.`);

    // determine what prototype to use for this node
    // node with a '_t' property will get the type named by it
    // nodes with no '_t' property and non-existent nodes will just get Node
    let nodeState = path ? _.get(this.stateAt(time), path) : this.stateAt(time);
    let nodeType = (nodeState && nodeState._t) || 'Node';
    if (!this.types[nodeType])
      throw new Error(`Node '${path}' proclaims it is of type '${nodeType}', but no such type is known.`);

    let node = Object.create(this.types[nodeType].proto);
    UnisonNode.apply(node, [this, path, time]);
    return node;
  },

  currentState() {
    return this._states[this._current];
  },

  currentTime() {
    return this._current;
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

  listen(...args) { return this._events.listen(...args); },
  unlisten(...args) { return this._events.unlisten(...args); },

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
    let id = this.currentState()._nextId++;
    return id.toString();
  },

  registerGlobalProperties(props) {
    _.extend(this, props);
  },

  registerNodeProperties(props) {
    _.extend(this.types.Node.proto, props);
  },

  applyNodeWrappers(wrappers) {
    _.each(wrappers, (outerFn, methodName) => {
      this.types.Node.proto[methodName] = wrapFunction(outerFn, this.types.Node.proto[methodName]);
    });
  },

  applyGlobalWrappers(wrappers) {
    _.each(wrappers, (outerFn, methodName) => {
      this[methodName] = wrapFunction(outerFn, this[methodName]);
    });
  },


  type(name) {
    if (!this.types[name]) {
      // create the type object
      this.types[name] = {
        name,
        extend: this.types.Node,
        definitions: {extend: 'Node'},
        proto: Object.create(this.types.Node.proto)
      };

      // create a spawner function for easy adding of typed objects
      this[name] = function(properties = {}) {
        return _.extend(properties, {_t: name});
      }
    }
    return this.types[name];
  },

  // Defines something about a chosen type (or all nodes). What exactly can be defined depends on the added plugins.
  // Server and client plugins allow you to define 'commmands' and 'intents'. The relations plugin adds 'relations'.
  define(typeOrDefinitions, definitions) {
    // determine arguments (either define({...}) or define('Type', {...}))
    let typeName;
    if (!definitions) {
      if (typeof typeOrDefinitions == 'string') {
        typeName = typeOrDefinitions; definitions = {};
      } else {
        typeName = 'Node'; definitions = typeOrDefinitions;
      }
    } else {
      typeName = typeOrDefinitions;
    }

    // grab the type object
    let typeObj = this.type(typeName);

    // go through the standard processing
    this.processDefinitions(typeName, definitions, typeObj.proto);

    // go through all plugins that process definitions
    _.each(this.onDefineCallbacks, (callback) => {
      callback(typeName, definitions, typeObj.proto);
    });

    // store the definitions in case a plugin appears later that would want them
    // we make sure that array/object-like properties get merged instead of overwritten
    _.each(definitions, (newlyDefined, name) => {
      let existing = typeObj.definitions[name];
      if (existing instanceof Array) {
        typeObj.definitions[name] = existing.concat(newlyDefined);
      } else if (isObject(existing)) {
        typeObj.definitions[name] = _.extend({}, existing, newlyDefined);
      } else {
        typeObj.definitions[name] = newlyDefined;
      }
    });
  },

  plugin(pluginFn) {
    var options = pluginFn(this) || {};
    this.registerGlobalProperties(options.methods || {});
    this.registerNodeProperties(options.nodeMethods || {});
    this.applyGlobalWrappers(options.methodWrappers || {});
    this.applyNodeWrappers(options.nodeMethodWrappers || {});

    if (options.name) {
      this.plugins = this.plugins || {};
      this.plugins[options.name] = pluginFn;
    }

    if (options.onDefine) {
      let {onDefine} = options;
      // apply existing definitions
      _.each(this.types, (type, typeName) => onDefine(typeName, type.definitions, type.proto));
      // make sure future definitions are picked up
      this.onDefineCallbacks.push(onDefine);
    }

    return this;
  },

  // Standard handling of type definitions, only 'extend' for now.
  processDefinitions(typeName, definitions, prototypes) {
    // set up extension relations
    let extend = definitions.extend;
    if (extend) {
      let child = this.type(typeName), parent = this.type(extend);
      child.extends = parent;
      prototype.__proto__ = parent.proto;
    }
  }
};

class UnisonNode {
  constructor(unison, path, time = undefined) {
    this.u = unison;
    this._path = path;
    this._time = time; // undefined means 'always use current state'
  }

  // === Properties of this node

  path() {
    return this._path;
  }

  type() {
    let typeName = (this.get && this.get._t) || 'Node';
    return this.u.type(typeName);
  }

  types() {
    let types = [this.type()];
    let type = types[0];
    while (type.extend) {
      type = type.extend;
      types.push(type);
    }
    return types;
  }

  isA(typeName) {
    let types = this.types();
    return types.filter((t) => (t.name == typeName)).length > 0;
  }

  id() {
    return idFromPath(this.path());
  }

  // === Retrieving and interacting with other, related nodes

  root() {
    return this.u.grab('', this._time);
  }

  parent() {
    return this.u.grab(parentPath(this.path()), this._time);
  }

  child(id) {
    return this.u.grab(childPath(this.path(), id), this._time);
  }

  is(otherNode) {
    return otherNode && (this._path == otherNode._path);
  }

  children() {
    let children = [];
    _.each(this.get, (obj, id) => {
      if (isObject(obj))
        children.push(this.child(id));
    });
    return children;
  }

  find(subpath) {
    if (this._path)
      return (this.u)(`${this._path}.${subpath}`, this._time);
    else
      return (this.u)(subpath, this._time);
  }

  // === Timestamp-related operations

  at(time) {
    return this.u.grab(this._path, time);
  }

  timestamp() {
    return this._time;
  }

  // === Retrieving state

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

    // return the node for the new child
    return this.child(id);
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
    var preEvents = this.u.collectEvents(pathToChild, 'destroying');
    var postEvents = this.u.collectEvents(pathToChild, 'destroyed');

    // remove the object, triggering events along the way
    this.u._events.triggerAll(preEvents);
    this.u.applyChange(this._path, {}, [id]);
    this.u._events.triggerAll(postEvents);

    // done
    return true;
  }

  destroy() {
    // straightforward translation
    expectObject(this.state(), "Can't destroy ${this._path}");
    return this.parent().remove(this.id());
  }

  on(event, callback, options) {
    this.u._events.listen(this._path, event, callback, options);
  }

  off(event, callback) {
    this.u._events.unlisten(this._path, event, callback);
  }

  onAny(event, callback, options) {
    this.u._events.listen(childPath(this._path, '**'), event, callback, options);
  }

  offAny(event, callback) {
    this.u._events.unlisten(childPath(this._path, '**'), event, callback);
  }

  onChild(event, callback, options) {
    this.u._events.listen(childPath(this._path, '*'), event, callback);
  }

  offChild(event, callback) {
    this.u._events.unlisten(childPath(this._path, '*'), event, callback, options);
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
