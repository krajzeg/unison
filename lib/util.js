let _ = require('lodash');

export function functionized(clazz, ctorArgs, defaultMethod) {

  // create a function that calls a chosen method by default
  var fn = function(...args) {
    return fn[defaultMethod].apply(fn, args);
  };

  // simulate calling the class constructor on the fn object
  clazz.apply(fn, ctorArgs);

  // set up prototypes correctly
  var generatedPrototype = Object.create(function(){});
  _.extend(generatedPrototype, clazz.prototype);
  fn.__proto__ = generatedPrototype;


  // return!
  return fn;
}

export function isObject(thing) {
  return (typeof thing == 'object') && (!(thing instanceof Array));
}