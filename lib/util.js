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
  return (thing) && (typeof thing == 'object') && (!(thing instanceof Array));
}

export function parentPath(path) {
  if (path === '') {
    throw new Error('The root object has no parent.');
  } else {
    let pathElements = path.split(".");
    return pathElements
      .slice(0, pathElements.length-1)
      .join(".");
  }
}

export function childPath(path, id) {
  if (path == '')
    return id;
  else
    return [path, id].join('.');
}

export function idFromPath(path) {
  if (path === '') {
    throw new Error('The root object has no id.');
  } else {
    return _.last(path.split("."));
  }
}
