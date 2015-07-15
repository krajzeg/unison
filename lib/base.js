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

    // can't add if it already exists
    if (this.state()[id] !== undefined) {
      throw new Error(`Can't add child '${id}' at ${this._path} - it already exists.`);
    }

    // add it
    this.state()[id] = child;

    // trigger events
    let childPath = [this._path, id].join(".");
    this._unison.trigger(this._path, 'childAdded', id);
    this._unison.trigger(childPath, 'created');

    // return the path to the newly created child
    return childPath;
  }
}
