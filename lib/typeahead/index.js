'use strict';

var _extends =
  Object.assign ||
  function(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];
      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }
    return target;
  };

var Accessor = require('../accessor');
var React = require('react');
var TypeaheadSelector = require('./selector');
var KeyEvent = require('../keyevent');
var fuzzy = require('fuzzy');
var classNames = require('classnames');

/**
 * A "typeahead", an auto-completing text input
 *
 * Renders an text input that shows options nearby that you can use the
 * keyboard or mouse to select.  Requires CSS for MASSIVE DAMAGE.
 */
var Typeahead = React.createClass({
  displayName: 'Typeahead',

  propTypes: {
    name: React.PropTypes.string,
    customClasses: React.PropTypes.object,
    maxVisible: React.PropTypes.number,
    resultsTruncatedMessage: React.PropTypes.string,
    delayMillis: React.PropTypes.number,
    options: React.PropTypes.array,
    allowCustomValues: React.PropTypes.number,
    initialValue: React.PropTypes.string,
    value: React.PropTypes.string,
    placeholder: React.PropTypes.string,
    disabled: React.PropTypes.bool,
    textarea: React.PropTypes.bool,
    inputProps: React.PropTypes.object,
    onOptionSelected: React.PropTypes.func,
    onChange: React.PropTypes.func,
    onKeyDown: React.PropTypes.func,
    onKeyPress: React.PropTypes.func,
    onKeyUp: React.PropTypes.func,
    onFocus: React.PropTypes.func,
    onBlur: React.PropTypes.func,
    filterOption: React.PropTypes.oneOfType([React.PropTypes.string, React.PropTypes.func]),
    searchOptions: React.PropTypes.func,
    displayOption: React.PropTypes.oneOfType([React.PropTypes.string, React.PropTypes.func]),
    inputDisplayOption: React.PropTypes.oneOfType([React.PropTypes.string, React.PropTypes.func]),
    formInputOption: React.PropTypes.oneOfType([React.PropTypes.string, React.PropTypes.func]),
    defaultClassNames: React.PropTypes.bool,
    customListComponent: React.PropTypes.oneOfType([React.PropTypes.element, React.PropTypes.func]),
    selectFirst: React.PropTypes.bool,
    showOptionsWhenEmpty: React.PropTypes.bool,
    closeDropdownOnBlur: React.PropTypes.bool
  },

  getDefaultProps: function getDefaultProps() {
    return {
      options: [],
      customClasses: {},
      allowCustomValues: 0,
      delayMillis: 0,
      initialValue: '',
      value: '',
      placeholder: '',
      disabled: false,
      textarea: false,
      inputProps: {},
      onOptionSelected: function onOptionSelected(option) {},
      onChange: function onChange(event) {},
      onKeyDown: function onKeyDown(event) {},
      onKeyPress: function onKeyPress(event) {},
      onKeyUp: function onKeyUp(event) {},
      onFocus: function onFocus(event) {},
      onBlur: function onBlur(event) {},
      filterOption: null,
      searchOptions: null,
      inputDisplayOption: null,
      defaultClassNames: true,
      customListComponent: TypeaheadSelector,
      selectFirst: false,
      showOptionsWhenEmpty: false,
      resultsTruncatedMessage: null,
      closeDropdownOnBlur: false
    };
  },

  getInitialState: function getInitialState() {
    return {
      // The options matching the entry value
      searchResults: this.getOptionsForValue(this.props.initialValue, this.props.options),

      // This should be called something else, "entryValue"
      entryValue: this.props.value || this.props.initialValue,

      // A valid typeahead value
      selection: this.props.value,

      // Index of the selection
      selectionIndex: null,

      // Keep track of the focus state of the input element, to determine
      // whether to show options when empty (if showOptionsWhenEmpty is true)
      isFocused: false,

      // true when focused, false onOptionSelected
      showResults: false
    };
  },

  componentWillUnmount: function componentWillUnmount() {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
  },

  _shouldSkipSearch: function _shouldSkipSearch(input) {
    var emptyValue = !input || input.trim().length == 0;

    // this.state must be checked because it may not be defined yet if this function
    // is called from within getInitialState
    var isFocused = this.state && this.state.isFocused;
    return !(this.props.showOptionsWhenEmpty && isFocused) && emptyValue;
  },

  getOptionsForValue: function getOptionsForValue(value, options) {
    if (this._shouldSkipSearch(value)) {
      return [];
    }

    var searchOptions = this._generateSearchFunction();
    return searchOptions(value, options);
  },

  setEntryText: function setEntryText(value) {
    this.refs.entry.value = value;
    this._onTextEntryUpdated();
  },

  focus: function focus() {
    this.refs.entry.focus();
  },

  _hasCustomValue: function _hasCustomValue() {
    if (
      this.props.allowCustomValues > 0 &&
      this.state.entryValue.length >= this.props.allowCustomValues &&
      this.state.searchResults.indexOf(this.state.entryValue) < 0
    ) {
      return true;
    }
    return false;
  },

  _getCustomValue: function _getCustomValue() {
    if (this._hasCustomValue()) {
      return this.state.entryValue;
    }
    return null;
  },

  _renderIncrementalSearchResults: function _renderIncrementalSearchResults() {
    // A default value was passed in
    if (this.props.initialValue && !this.state.hasRendered) {
      return '';
    }

    // Nothing has been entered into the textbox
    if (this._shouldSkipSearch(this.state.entryValue)) {
      return '';
    }

    // Something was just selected
    if (this.state.selection) {
      return '';
    }

    return React.createElement(this.props.customListComponent, {
      ref: 'sel',
      options: this.props.maxVisible
        ? this.state.searchResults.slice(0, this.props.maxVisible)
        : this.state.searchResults,
      areResultsTruncated:
        this.props.maxVisible && this.state.searchResults.length > this.props.maxVisible,
      resultsTruncatedMessage: this.props.resultsTruncatedMessage,
      onOptionSelected: this._onOptionSelected,
      allowCustomValues: this.props.allowCustomValues,
      customValue: this._getCustomValue(),
      customClasses: this.props.customClasses,
      selectionIndex: this.state.selectionIndex,
      defaultClassNames: this.props.defaultClassNames,
      displayOption: Accessor.generateOptionToStringFor(this.props.displayOption)
    });
  },

  getSelection: function getSelection() {
    var index = this.state.selectionIndex;
    if (this._hasCustomValue()) {
      if (index === 0) {
        return this.state.entryValue;
      } else {
        index--;
      }
    }
    return this.state.searchResults[index];
  },

  _onOptionSelected: function _onOptionSelected(option, event) {
    var nEntry = this.refs.entry;
    nEntry.focus();

    var displayOption = Accessor.generateOptionToStringFor(
      this.props.inputDisplayOption || this.props.displayOption
    );
    var optionString = displayOption(option, 0);

    var formInputOption = Accessor.generateOptionToStringFor(
      this.props.formInputOption || displayOption
    );
    var formInputOptionString = formInputOption(option);

    nEntry.value = optionString;
    this.setState({
      searchResults: [],
      selection: formInputOptionString,
      entryValue: optionString,
      showResults: false
    });
    return this.props.onOptionSelected(option, event);
  },

  _onTextEntryUpdated: function _onTextEntryUpdated() {
    var _this = this;

    var value = this.refs.entry.value;

    this.setState({
      selection: '',
      entryValue: value
    });

    if (this.timeout) {
      clearTimeout(this.timeout);
    }

    this.timeout = setTimeout(function() {
      _this.setState({
        searchResults: _this.getOptionsForValue(value, _this.props.options),
        hasRendered: true,
        showResults: true
      });
    }, this.props.delayMillis);
  },

  _onEnter: function _onEnter(event) {
    var selection = this.getSelection();
    if (!selection || !this.state.showResults) {
      return this.props.onKeyDown(event);
    }
    return this._onOptionSelected(selection, event);
  },

  _onEscape: function _onEscape() {
    this._closeDropdownWithoutSelectingOption();
  },

  clearSelectionIndex: function clearSelectionIndex() {
    this.setState({
      selectionIndex: null
    });
  },

  _closeDropdownWithoutSelectingOption: function _closeDropdownWithoutSelectingOption() {
    var value = this.refs.entry.value;

    this.setState({
      selection: value,
      entryValue: value
    });
  },

  eventMap: function eventMap(event) {
    var events = {};

    events[KeyEvent.DOM_VK_UP] = this.navUp;
    events[KeyEvent.DOM_VK_DOWN] = this.navDown;
    events[KeyEvent.DOM_VK_RETURN] = events[KeyEvent.DOM_VK_ENTER] = this._onEnter;
    events[KeyEvent.DOM_VK_ESCAPE] = this._onEscape;

    return events;
  },

  _nav: function _nav(delta) {
    if (!this._hasHint()) {
      return;
    }
    var newIndex =
      this.state.selectionIndex === null
        ? delta == 1 ? 0 : delta
        : this.state.selectionIndex + delta;
    var length = this.props.maxVisible
      ? this.state.searchResults.slice(0, this.props.maxVisible).length
      : this.state.searchResults.length;
    if (this._hasCustomValue()) {
      length += 1;
    }

    if (newIndex < 0) {
      newIndex += length;
    } else if (newIndex >= length) {
      newIndex -= length;
    }

    this.setState({ selectionIndex: newIndex });
  },

  navDown: function navDown() {
    this._nav(1);
  },

  navUp: function navUp() {
    this._nav(-1);
  },

  _onChange: function _onChange(event) {
    if (this.props.onChange) {
      this.props.onChange(event);
    }

    this._onTextEntryUpdated();
  },

  _onKeyDown: function _onKeyDown(event) {
    // If there are no visible elements, don't perform selector navigation.
    // Just pass this up to the upstream onKeydown handler.
    // Also skip if the user is pressing the shift key, since none of our handlers are looking for shift
    if (!this._hasHint() || event.shiftKey) {
      return this.props.onKeyDown(event);
    }

    var handler = this.eventMap()[event.keyCode];

    if (handler) {
      handler(event);
    } else {
      return this.props.onKeyDown(event);
    }
    // Don't propagate the keystroke back to the DOM/browser
    event.preventDefault();
  },

  componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
    var typeheadOptionsState = {
      searchResults: this.getOptionsForValue(this.state.entryValue, nextProps.options)
    };

    if (this.props.selectFirst && nextProps.options.length) {
      typeheadOptionsState.selectionIndex = 0;
    }

    this.setState(typeheadOptionsState);
  },

  render: function render() {
    var inputClasses = {};
    inputClasses[this.props.customClasses.input] = !!this.props.customClasses.input;
    var inputClassList = classNames(inputClasses);

    var classes = {
      typeahead: this.props.defaultClassNames
    };
    classes[this.props.className] = !!this.props.className;
    var classList = classNames(classes);

    var InputElement = this.props.textarea ? 'textarea' : 'input';
    return React.createElement(
      'div',
      { className: classList },
      this._renderHiddenInput(),
      React.createElement(
        InputElement,
        _extends(
          {
            ref: 'entry',
            type: 'text',
            disabled: this.props.disabled
          },
          this.props.inputProps,
          {
            placeholder: this.props.placeholder,
            className: inputClassList,
            value: this.state.entryValue,
            onChange: this._onChange,
            onKeyDown: this._onKeyDown,
            onKeyPress: this.props.onKeyPress,
            onKeyUp: this.props.onKeyUp,
            onFocus: this._onFocus,
            onBlur: this._onBlur
          }
        )
      ),
      this.state.showResults && this._renderIncrementalSearchResults()
    );
  },

  _onFocus: function _onFocus(event) {
    this.setState({
      isFocused: true,
      selection: '',
      entryValue: this.refs.entry.value
    });

    if (this.props.onFocus) {
      return this.props.onFocus(event);
    }
  },

  _onBlur: function _onBlur(event) {
    this.setState(
      { isFocused: false },
      function() {
        if (this.props.closeDropdownOnBlur) {
          this._closeDropdownWithoutSelectingOption();
        } else {
          this._onTextEntryUpdated();
        }
      }.bind(this)
    );
    if (this.props.onBlur) {
      return this.props.onBlur(event);
    }
  },

  _renderHiddenInput: function _renderHiddenInput() {
    if (!this.props.name) {
      return null;
    }

    return React.createElement('input', {
      type: 'hidden',
      name: this.props.name,
      value: this.state.selection
    });
  },

  _generateSearchFunction: function _generateSearchFunction() {
    var searchOptionsProp = this.props.searchOptions;
    var filterOptionProp = this.props.filterOption;
    if (typeof searchOptionsProp === 'function') {
      if (filterOptionProp !== null) {
        console.warn('searchOptions prop is being used, filterOption prop will be ignored');
      }
      return searchOptionsProp;
    } else if (typeof filterOptionProp === 'function') {
      return function(value, options) {
        return options.filter(function(o) {
          return filterOptionProp(value, o);
        });
      };
    } else {
      var mapper;
      if (typeof filterOptionProp === 'string') {
        mapper = Accessor.generateAccessor(filterOptionProp);
      } else {
        mapper = Accessor.IDENTITY_FN;
      }
      return function(value, options) {
        return fuzzy.filter(value, options, { extract: mapper }).map(function(res) {
          return options[res.index];
        });
      };
    }
  },

  _hasHint: function _hasHint() {
    return this.state.searchResults.length > 0 || this._hasCustomValue();
  }
});

module.exports = Typeahead;
