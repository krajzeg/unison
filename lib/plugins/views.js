let _ = require('lodash');

export default function views(options) {
  return ($$) => ({
    nodeMethods: {
      watch: watch
    }
  });
}

const EVENTS = ['updated', 'destroyed', 'childAdded', 'childRemoved'];

function watch(object) {
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
