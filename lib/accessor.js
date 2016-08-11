'use strict';

var Accessor = {
  IDENTITY_FN: function IDENTITY_FN(input) {
    return input;
  },

  generateAccessor: function generateAccessor(field) {
    return function (object) {
      return object[field];
    };
  },

  generateOptionToStringFor: function generateOptionToStringFor(prop) {
    if (typeof prop === 'string') {
      return this.generateAccessor(prop);
    } else if (typeof prop === 'function') {
      return prop;
    } else {
      return this.IDENTITY_FN;
    }
  },

  valueForOption: function valueForOption(option, object) {
    if (typeof option === 'string') {
      return object[option];
    } else if (typeof option === 'function') {
      return option(object);
    } else {
      return object;
    }
  }
};

module.exports = Accessor;