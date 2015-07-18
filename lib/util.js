export function functionize(object, defaultMethod, methods) {
  // turn the object into a function that calls a chosen method by default
  var fn = function(...args) {
    return object[defaultMethod].apply(object, args);
  };
  // expose other methods on the function object
  methods.map((methodName) => {
    fn[methodName] = (...args) => object[methodName].apply(object, args);
  });

  // remember what we're based on
  fn.base = object;

  // return!
  return fn;
}

export function isObject(thing) {
  return (typeof thing == 'object') && ((!thing instanceof Array));
}