var Reflect = require("harmony-reflect");
var assign = require("object-assign");
var wassat = require("wassat");

function validateType (value) {
  return !!wassat.types[value];
}

function applyConstructor (Ctor, args) {
  var instance = new Object.create(Ctor.prototype);
  var result = Ctor.apply(instance, args);
  // to honor explicit return in constructor
  if (result && typeof result === "object" || typeof result === "function") {
    return result;
  }
  // the more usual case
  return instance;
}

function typeErr (prop, type) {
  return 

function TypeDict (obj) {
  var instance = Reflect.ownKeys(obj).reduce(function (result, key) {
    var value = obj[key];
    if (!validateType(value)) {
      throw new Error(value + " isn't a valid type name");
    }
    result[key] = value;
    return result;
  }, Object.create(null));
  
  Reflect.defineProperty(instance, "validate", {
    value: function (obj) {
      Reflect.ownKeys(instance).forEach(function (key) {
        if (instance[key] !== wassat(obj[key])) {
          throw new TypeError("Property " + key + " requires values of type " + this[key] + " but was " + obj[key]);
        }
      });
    }
  });
  return instance;
}

function instanceTraps (dict) {
  return {
    set: function (target, key, value) {
      if (dict[key] && wassat(value) !== dict[key]) {
        throw new TypeError("Property " + key + " requires values of type " + dict[key]);
      }
      return Reflect.set(target, key, value);
    },
    defineProperty: function (target, key, descriptor) {
      if (dict[key] && wassat(descriptor.value) !== dict[key]) {
        throw new TypeError("Property " + key + " requires values of type " + dict[key]);
      }
      return Reflect.defineProperty(target, key, descriptor);
    },
    deleteProperty: function (target, key) {
      if (dict[key]) {
        throw new TypeError("Property " + key + " requires values of type " + dict[key]);
      }
      return Reflect.deleteProperty(target, key);
    }
  };
}

function ctorTraps (schema) {
  return {
    construct: function (Ctor, args) {
      var instance = Reflect.construct(Ctor, args);
      schema.validate(instance);
      return new Proxy(instance, instanceTraps(schema));
    },
    apply: function (func, context, args) {
      var result = func.apply(context, args);
      schema.validate(result);
      return new Proxy(result, instanceTraps(schema));
    }
  };
}

function Bubblewrap (Ctor, schema) {
  if (typeof Ctor !== "function") {
    throw new TypeError("Bubblewrap requires a function.");
  }
  if (typeof schema !== "object") {
    throw new TypeError("Bubblewrap requires a schema object");
  }
  schema = TypeDict(schema);
  return new Proxy(Ctor, ctorTraps(schema));
}

Bubblewrap.wrap = wrap;
function wrap (obj) {

  var dict = TypeDict(
    Reflect.ownKeys(obj).reduce(function (result, key) {
      schema[key] = wassat(obj);
      return result;
    }, {})
  );

  return new Proxy(obj, instanceTraps(dict));
}

module.exports = Bubblewrap;