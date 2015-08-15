let _ = require('lodash');

import { functionized } from '../util';
import { Queue } from '../task-queues';

export default function views(options) {
  return functionized(ViewsPlugin, [options], 'applyPlugin');
}

function ViewsPlugin() {
  this.animationQueue = new Queue();
  this.registeredViews = {};
}
ViewsPlugin.prototype = {
  applyPlugin(u) {
    this.u = u;
    return {
      name: 'views',
      methods: {
        animation: this.animation.bind(this)
      },
      nodeMethods: {
        watch: watch,

        registerView: registerView,
        view: view
      }
    }
  },

  animation(fn) {
    let synced = this.animationQueue.synchronize(fn);
    synced._animation = true;
    return synced;
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
      if (!listener._animation)
        listener = this.u.animation(listener);

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

function registerView(viewObject) {
  let views = this.u.plugins.views, path = this.path();
  views.registeredViews[path] = viewObject;
  this.on('destroyed', () => {
    delete views.registeredViews[path];
  });
}

function view() {
  return this.u.plugins.views.registeredViews[this.path()];
}
