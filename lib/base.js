let _ = require('lodash');


export default class Unison {
  constructor(initialState = {}) {
   this.state = initialState;
  }

  grab(path) {
    return new UnisonNode(this, path)
  }

  trigger(path, event) {
    // nothing for now
  }
}

class UnisonNode {
  constructor(unison, path) {
    this.unison = unison;
    this.path = path;
  }

  state() {
    if (this.path === '') {
      return this.unison.state;
    } else {
      return _.get(this.unison.state, this.path);
    }
  }

  update(props) {
    var state = this.state();
    if (state === undefined) return;

    _.extend(state, props);
    this.unison.trigger(this.path, 'updated');
  }
}
