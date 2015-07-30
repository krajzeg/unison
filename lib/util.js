export function functionize(object, defaultMethod, methods) {
  // turn the object into a function that calls a chosen method by default
  var fn = function(...args) {
    return object[defaultMethod].apply(object, args);
  };
  // expose other methods on the function object
  methods.map((methodName) => {
    fn[methodName] = (...args) => object[methodName].apply(object, args);
  });

  // make sure we can reach both the base from the function and vice-versa
  fn.base = object;
  object.fn = fn;

  // return!
  return fn;
}

export function isObject(thing) {
  return (typeof thing == 'object') && (!(thing instanceof Array));
}