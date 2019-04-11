'use strict';

var React = require('react');
var propTypes = require('prop-types');
var reactCreateClass = require('create-react-class');
var classNames = require('classnames');

/**
 * A single option within the TypeaheadSelector
 */
var TypeaheadOption = reactCreateClass({
  displayName: 'TypeaheadOption',

  propTypes: {
    customClasses: propTypes.object,
    customValue: propTypes.string,
    onMouseDown: propTypes.func,
    children: propTypes.string,
    hover: propTypes.bool
  },

  getDefaultProps: function getDefaultProps() {
    return {
      customClasses: {},
      onMouseDown: function onMouseDown(event) {
        event.preventDefault();
      }
    };
  },

  render: function render() {
    var classes = {};
    classes[this.props.customClasses.hover || "hover"] = !!this.props.hover;
    classes[this.props.customClasses.listItem] = !!this.props.customClasses.listItem;

    if (this.props.customValue) {
      classes[this.props.customClasses.customAdd] = !!this.props.customClasses.customAdd;
    }

    var classList = classNames(classes);

    return React.createElement(
      'li',
      { className: classList, onMouseDown: this._onMouseDown },
      React.createElement(
        'a',
        { href: 'javascript: void 0;', className: this._getClasses(), ref: 'anchor' },
        this.props.children
      )
    );
  },

  _getClasses: function _getClasses() {
    var classes = {
      "typeahead-option": true
    };
    classes[this.props.customClasses.listAnchor] = !!this.props.customClasses.listAnchor;

    return classNames(classes);
  },

  _onMouseDown: function _onMouseDown(event) {
    event.preventDefault();
    return this.props.onMouseDown(event);
  }
});

module.exports = TypeaheadOption;
