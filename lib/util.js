module.exports = {
  functionize: function(object, defaultMethod, methods) {
    // turns an object into a function that calls a chosen method by default,
    // and exposes the other methods correctly
    var fn = function(...args) {
      return object[defaultMethod].apply(object, args);
    };
    methods.map((methodName) => {
      fn[methodName] = (...args) => object[methodName].apply(object, args);
    });

    return fn;
  }
};
