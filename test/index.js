var Bubblewrap = require("..");
var expect = require("chai").expect;
var assign = require("object-assign");

describe("Bubblewrap", function () {

  var goodData = {
    name: "John Doe",
    age: 30,
    isAlive: true,
    spouse: {name: "Jane Doe"},
    siblings: ["Jack", "Jake"],
    birthdate: new Date()
  };

  var badData = {
    name: 1234,
    age: "ten",
    isAlive: "true",
    spouse: [],
    siblings: {older: "Jack", younger: "Jake"},
    birthdate: "9/13"
  };

  var schema = {
    age: "number",
    name: "string",
    isAlive: "boolean",
    spouse: "object",
    siblings: "array",
    birthdate: "date"
  };

  function Person (settings) {
    settings = settings || {};
    this.name = settings.name;
    this.age = settings.age;
    this.spouse = settings.spouse;
    this.isAlive = settings.isAlive;
    this.siblings = settings.siblings;
    this.birthdate = settings.birthdate;
  }

  var SafePerson;

  beforeEach(function () {
    SafePerson = Bubblewrap(Person, schema);
  });

  it("works in the simple case", function () {
    var jd = new SafePerson(goodData);
  });

  it("prevents creating an object with bad data", function () {
    Object.keys(badData).forEach(function (key) {
      var obj = {};
      obj[key] = badData[key];
      var inputData = assign({}, goodData, obj);
      expect(function () {
        new SafePerson(inputData);
      }).to.throw(TypeError);
    });

  });

  it("prevents setting an object property with bad data", function () {
    Object.keys(badData).forEach(function (key) {
      var result = new SafePerson(goodData);
      expect(function () {
        result[key] = badData[key];
      }).to.throw(TypeError);
    });
  });

  it("prevents defining an object property with bad data", function () {
    Object.keys(badData).forEach(function (key) {
      var result = new SafePerson(goodData);
      expect(function () {
        Object.defineProperty(result, key, {value: badData[key]});
      }).to.throw(TypeError);
    });
  });

  it("prevents deleting required properties of an object", function () {
    Object.keys(badData).forEach(function (key) {
      var result = new SafePerson(goodData);
      expect(function () {
        delete result[key];
      }).to.throw(TypeError);
    });
  });


});

describe("#wrap()", function () {
  
});