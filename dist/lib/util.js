'use strict';Object.defineProperty(exports, '__esModule', { value: true });exports.functionized = functionized;exports.wrapFunction = wrapFunction;exports.isObject = isObject;exports.parentPath = parentPath;exports.childPath = childPath;exports.idFromPath = idFromPath;var _ = require('lodash');

function functionized(clazz, ctorArgs, defaultMethod) {

  // create a function that calls a chosen method by default
  var fn = function fn() {for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {args[_key] = arguments[_key];}
    return fn[defaultMethod].apply(fn, args);};


  // simulate calling the class constructor on the fn object
  clazz.apply(fn, ctorArgs);

  // set up prototypes correctly
  var generatedPrototype = Object.create(function () {});
  _.extend(generatedPrototype, clazz.prototype);
  generatedPrototype.__proto__ = clazz.prototype.__proto__;
  fn.__proto__ = generatedPrototype;

  // return!
  return fn;}


function wrapFunction(wrapper, wrappee) {
  return function () {for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {args[_key2] = arguments[_key2];}
    return wrapper.apply(this, [wrappee].concat(args));};}



function isObject(thing) {
  return thing && typeof thing == 'object' && !(thing instanceof Array);}


function parentPath(path) {
  if (path === '') {
    throw new Error('The root object has no parent.');} else 
  {
    var pathElements = path.split(".");
    return pathElements.
    slice(0, pathElements.length - 1).
    join(".");}}



function childPath(path, id) {
  if (path == '') 
  return id;else 

  return [path, id].join('.');}


function idFromPath(path) {
  if (path === '') {
    throw new Error('The root object has no id.');} else 
  {
    return _.last(path.split("."));}}
//# sourceMappingURL=util.js.map