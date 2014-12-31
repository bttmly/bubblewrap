var wassat = require("wassat");
var assign = require("object-assign");
var Reflect = require("harmony-reflect");

function validateType (value) {
  return !!wassat.types[value];
}

function TypeDict (obj) {
  var instance = Reflect.ownKeys(obj).reduce(function (result, key) {
    var value = obj[key];
    if (!validateType(value)) {
      throw new Error([
        value,
        "isn't a valid type name. Allowed type names are:",
        Reflect.ownKeys(wassat.types).toString()
      ].join(" "));
    }
    result[key] = value;
    return result;
  }, Object.create(null));

  Reflect.defineProperty(instance, "validate", {
    value: function (obj) {
      Object.keys(instance).forEach(function (key) {
        if (instance[key] !== wassat(obj[key])) {
          throw new TypeError([
            "Property",
            key,
            "requires values of type",
            instance[key],
            "but value was",
            obj[key],
            "(type",
            wassat(obj[key]),
            ")."
          ].join(" "));
        }
      });
    }
  });
  return instance;
}

function instanceTraps (schema) {
  return {
    set: function (target, key, value) {
      if (schema[key] && wassat(value) !== schema[key]) {
        throw new TypeError([
            "Property",
            key,
            "requires values of type",
            schema[key],
            "but value was",
            value,
            "(" + wassat(value),
            "type)."
        ].join(" "));
        // throw new TypeError("Property " + key + " requires values of type " + schema[key]);
      }
      return Reflect.set(target, key, value);
    },
    defineProperty: function (target, key, descriptor) {
      if (schema[key] && wassat(descriptor.value) !== schema[key]) {
        throw new TypeError("Property " + key + " requires values of type " + schema[key]);
      }
      return Reflect.defineProperty(target, key, descriptor);
    },
    deleteProperty: function (target, key) {
      if (schema[key]) {
        throw new TypeError("Property " + key + " requires values of type " + schema[key]);
      }
      return Reflect.deleteProperty(target, key);
    }
  };
}

function functionTraps (schema) {
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
  return new Proxy(Ctor, functionTraps(schema));
}

Bubblewrap.wrap = wrap;
function wrap (obj) {
  var dict = TypeDict(
    Reflect.ownKeys(obj).reduce(function (result, key) {
      result[key] = wassat(obj[key]);
      return result;
    }, {})
  );
  dict.validate(obj);
  return new Proxy(obj, instanceTraps(dict));
}

module.exports = Bubblewrap;