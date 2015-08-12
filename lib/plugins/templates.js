let _ = require('lodash');

import { functionized, isObject } from '../util';

export default function templates(options) {
  return functionized(TemplatesPlugin, [options], 'applyPlugin');
}

function TemplatesPlugin(templates) {
  this.templates = templates;
}
TemplatesPlugin.prototype = {
  applyPlugin(u) {
    this.u = u;
    return {
      nodeMethodWrappers: {
        add: this.makeAddWrapper()
      }/*,
      nodeMethods: {
        spawn: spawn
      }*/
    }
  },

  makeAddWrapper() {
    let templates = this.templates;
    return function(oAdd, ...args) {
      if (args.length == 1) {
        args[0] = applyTemplateIfNeeded(templates, args[0]);
      } else {
        args[1] = applyTemplateIfNeeded(templates, args[1]);
      }

      // invoke original add with the modified object
      return oAdd.apply(this, [...args]);
    }
  }
};

function applyTemplateIfNeeded(templates, obj) {
  // does this object want us to do something?
  if (!isObject(obj) || (!obj.template))
    return;

  // find the right template
  let templateName = obj.template;
  let template = _.get(templates, templateName);
  if (!template) {
    throw new Error(`The object you added uses template '${templateName}', but no such template was found.`);
  }

  // create a new object with the template as prototype, and otherwise the same properties
  return _.extend(Object.create(template), obj);
}