'use strict';Object.defineProperty(exports, '__esModule', { value: true });exports['default'] = 



templates;var _util = require('../util');var _ = require('lodash');function templates(options) {
  return (0, _util.functionized)(TemplatesPlugin, [options], 'applyPlugin');}


function TemplatesPlugin(templates) {
  this.templates = templates;}

TemplatesPlugin.prototype = { 
  applyPlugin: function applyPlugin(u) {
    this.u = u;
    return { 
      nodeMethodWrappers: { 
        add: this.makeAddWrapper() }, 

      methods: { 
        template: this.template.bind(this) }, 

      nodeMethods: { 
        spawn: spawn } };}, 




  template: function template(name) {
    return _.get(this.templates, name);}, 


  makeAddWrapper: function makeAddWrapper() {
    var templates = this.templates;
    return function (oAdd) {for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {args[_key - 1] = arguments[_key];}
      if (args.length == 1) {
        args[0] = applyTemplateIfNeeded(templates, args[0]);} else 
      {
        args[1] = applyTemplateIfNeeded(templates, args[1]);}


      // invoke original add with the modified object
      return oAdd.apply(this, [].concat(args));};} };




function applyTemplateIfNeeded(templates, obj) {
  // does this object want us to do something?
  if (!(0, _util.isObject)(obj) || !obj.template) 
  return obj;

  // find the right template
  var templateName = obj.template;
  var template = _.get(templates, templateName);
  if (!template) {
    throw new Error('The object you added uses template \'' + templateName + '\', but no such template was found.');}


  // create a new object with the template as prototype, and otherwise the same properties
  return _.extend(Object.create(template), obj);}


function spawn(template, properties) {
  var lastSegment = template.lastIndexOf(".") >= 0 ? template.substring(template.lastIndexOf(".") + 1) : template;
  var id = lastSegment + "#" + this.u.nextId();
  return this.add(id, _.extend(properties, { template: template }));}module.exports = exports['default'];
//# sourceMappingURL=../plugins/templates.js.map