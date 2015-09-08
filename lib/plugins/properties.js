let _ = require('lodash');
import { functionized } from '../util';

export default function properties() {
  return functionized(PropertiesPlugin, [], 'applyPlugin');
}

function PropertiesPlugin() {
  // nothing to initialize
}
PropertiesPlugin.prototype = {
  applyPlugin(u) {
    this.u = u;

    // we're basically allowing to define properties and that's it,
    // a very simple plugin
    return {
      onDefine: this.processDefinitions.bind(this)
    };
  },

  processDefinitions(typeName, defs, prototype) {
    let props = defs.properties || {};

    // properties are just methods with no magic about them
    _.each(props, (impl, name) => {
      prototype[name] = impl;
    });
  }
};
