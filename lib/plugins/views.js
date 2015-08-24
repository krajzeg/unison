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
  if ((!object) || (!events))
    throw new Error("Please call as u(...).watch(yourObject, {event: method, event: method, ...}).");

  // 'this' here will refer to the node .watch() was called on

  let boundListeners = [];
  let node = this, u = this.u;

  // apply all the requested listeners
  _.each(events, (method, event) => {
    // wrap the listener with queue-synchronizing behavior
    let listener = method.bind(object);
    if (!listener._animation)
      listener = this.u.animation(listener);

    // handle wildcard listeners
    let path = node.path();
    if (event.match(/^\*\*:/)) {
      path += '.**';
      event = event.replace('**:', '');
    }
    if (event.match(/^\*:/)) {
      path += '.*';
      event = event.replace('*:', '');
    }

    u.listen(path, event, listener);
    boundListeners.push({path: path, event: event, listener: listener});
  });

  // when the node we are watching gets destroyed, we want to unbind all those listeners
  // (including the listener that keeps track of it)
  let unbindListener = () => {
    _.each(boundListeners, ({path, event, listener}) => {
      u.unlisten(path, event, listener);
    });
  };
  node.on('destroyed', unbindListener);
  boundListeners.push({path: node.path(), event: 'destroyed', listener: unbindListener});
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
