"use strict";module.exports = { 
  functionize: function functionize(object, defaultMethod, methods) {
    // turn the object into a function that calls a chosen method by default
    var fn = function fn() {for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {args[_key] = arguments[_key];}
      return object[defaultMethod].apply(object, args);};

    // expose other methods on the function object
    methods.map(function (methodName) {
      fn[methodName] = function () {for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {args[_key2] = arguments[_key2];}return object[methodName].apply(object, args);};});


    // remember what we're based on
    fn.base = object;

    // return!
    return fn;} };
//# sourceMappingURL=util.js.map