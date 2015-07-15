let _ = require('lodash');


export default class Unison {
  constructor(initialState = {}) {
   this._state = initialState;
   this._nextId = 1;
  }

  grab(path) {
    return new UnisonNode(this, path)
  }

  trigger(path, event) {
    // nothing for now
  }

  nextId() {
    return this._nextId++;
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
    let path = this.path();
    if (path === '') {
      throw new Error('The root object has no id.');
    } else {
      return _.last(path.split("."));
    }
  }

  parent() {
    let path = this.path();
    if (path === '') {
      throw new Error('The root object has no parent.');
    } else {
      let pathElements = path.split(".");
      pathElements.pop();
      let parentPath = pathElements.join(".");

      return this._unison.grab(parentPath);
    }
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
    this._unison.trigger(this._path, 'updated');
  }

  add(...args) {
    // extract arguments (either (child) or (id, child))
    let id, child;
    if (args.length == 2) {
      [id, child] = args;
    } else {
      child = args[0];
      id = this._unison.nextId();
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
    this._unison.trigger(this._path, 'childAdded', id);
    this._unison.trigger(childPath, 'created');

    // return the path to the newly created child
    return childPath;
  }

  remove(id) {
    let state = this.state();

    // sanity checks
    expectObject(state, `Can't remove child at ${this._path}`);

    // does it even exist?
    if (state[id] === undefined) {
      return false;
    }

    // it does, let's remove it
    delete state[id];

    // trigger events
    let childPath = [this._path, id].join(".");
    this._unison.trigger(this._path, 'childRemoved', id);
    this._unison.trigger(childPath, 'destroyed');

    // done
    return true;
  }

  destroy() {
    // straightforward translation
    expectObject(this.state(), "Can't destroy ${this._path}");
    return this.parent().remove(this.id());
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
