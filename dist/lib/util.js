'use strict';Object.defineProperty(exports, '__esModule', { value: true });exports.

functionized = functionized;exports.



















isObject = isObject;exports.



parentPath = parentPath;exports.










childPath = childPath;exports.






idFromPath = idFromPath;var _ = require('lodash');function functionized(clazz, ctorArgs, defaultMethod) {// create a function that calls a chosen method by default
  var fn = function fn() {for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {args[_key] = arguments[_key];}return fn[defaultMethod].apply(fn, args);}; // simulate calling the class constructor on the fn object
  clazz.apply(fn, ctorArgs); // set up prototypes correctly
  var generatedPrototype = Object.create(function () {});_.extend(generatedPrototype, clazz.prototype);fn.__proto__ = generatedPrototype; // return!
  return fn;}function isObject(thing) {return thing && typeof thing == 'object' && !(thing instanceof Array);}function parentPath(path) {if (path === '') {throw new Error('The root object has no parent.');} else {var pathElements = path.split('.');return pathElements.slice(0, pathElements.length - 1).join('.');}}function childPath(path, id) {if (path == '') return id;else return [path, id].join('.');}function idFromPath(path) {if (path === '') {throw new Error('The root object has no id.');} else {return _.last(path.split('.'));}}
//# sourceMappingURL=util.js.map