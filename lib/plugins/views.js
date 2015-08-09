let _ = require('lodash');

import { functionized } from '../util';

export default function views(options) {
  return functionized(ViewsPlugin, [options], 'applyPlugin');
}

function ViewsPlugin() {

}
ViewsPlugin.prototype = {
  applyPlugin(u) {
    this.u = u;
    return {
      nodeMethods: {
        watch: watch
      }
    }
  }
};

const EVENTS = ['updated', 'destroyed', 'created'];

function watch(object) {
  // 'this' here will refer to the node .watch() was called on

  let boundListeners = [];
  let node = this;

  // scan all methods of the object looking for matches with event names
  // register all such methods as listeners
  EVENTS.forEach((eventName) => {
    let method = object[eventName];
    if (method && (typeof method == 'function')) {
      let listener = method.bind(object);
      node.on(eventName, listener);
      boundListeners.push({event: eventName, listener: listener});
    }
  });

  // when the node we are watching gets destroyed, we want to unbind all those listeners
  // (including the listener that keeps track of it)
  let unbindListener = () => {
    _.each(boundListeners, ({event, listener}) => {
      node.off(event, listener);
    });
  };
  node.on('destroyed', unbindListener);
  boundListeners.push({event: 'destroyed', listener: unbindListener});
}
