'use strict';Object.defineProperty(exports, '__esModule', { value: true });exports['default'] = 



templates;var _util = require('../util');var _ = require('lodash');function templates(options) {
  return (0, _util.functionized)(TemplatesPlugin, [options], 'applyPlugin');}


function TemplatesPlugin(templates) {
  this.templates = templates;}

TemplatesPlugin.prototype = { 
  applyPlugin: function applyPlugin(u) {
    this.u = u;

    // register a listener that should *always* run first when an object is created,
    // so that other listeners don't see an uninitialized state
    u.listen('**', 'created', this.applyTemplateIfNeeded.bind(this), { priority: -10000 });

    return { 
      methods: { 
        template: this.template.bind(this) }, 

      nodeMethods: { 
        spawn: spawn } };}, 




  template: function template(name) {
    return _.get(this.templates, name);}, 


  applyTemplateIfNeeded: function applyTemplateIfNeeded(evt) {
    var obj = evt.source;

    // maybe we don't need to do anything?
    if (!obj.get.template) return;

    // find the right template
    var templateName = obj.get.template;
    var template = _.get(this.templates, templateName);
    if (!template) {
      throw new Error('The object you added uses template \'' + templateName + '\', but no such template was found.');}


    // replace Unison's state object with a correctly prototyped one
    // this is heart surgery, but no cleaner way to do this
    var newObjectState = _.extend(Object.create(template), obj.get);
    var unisonState = this.u.currentState();
    _.set(unisonState, obj.path(), newObjectState);} };



function spawn(template, properties) {
  var lastSegment = template.lastIndexOf(".") >= 0 ? template.substring(template.lastIndexOf(".") + 1) : template;
  var id = lastSegment + "#" + this.u.nextId();
  return this.add(id, _.extend(properties, { template: template }));}module.exports = exports['default'];
//# sourceMappingURL=../plugins/templates.js.map