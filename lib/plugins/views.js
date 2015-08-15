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

function watch(object, events) {
  // 'this' here will refer to the node .watch() was called on

  let boundListeners = [];
  let node = this;

  // apply all the requested listeners
  _.each(events, (method, event) => {
    let listener = method.bind(object);

    if (!listener._animation)
      listener = this.u.animation(listener);

    node.on(event, listener);
    boundListeners.push({event: event, listener: listener});
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
