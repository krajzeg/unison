'use strict';Object.defineProperty(exports, '__esModule', { value: true });exports.

functionized = functionized;exports.



















isObject = isObject;var _ = require('lodash');function functionized(clazz, ctorArgs, defaultMethod) {// create a function that calls a chosen method by default
  var fn = function fn() {for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {args[_key] = arguments[_key];}return fn[defaultMethod].apply(fn, args);}; // simulate calling the class constructor on the fn object
  clazz.apply(fn, ctorArgs); // set up prototypes correctly
  var generatedPrototype = Object.create(function () {});_.extend(generatedPrototype, clazz.prototype);fn.__proto__ = generatedPrototype; // return!
  return fn;}function isObject(thing) {return typeof thing == 'object' && !(thing instanceof Array);}
//# sourceMappingURL=util.js.map