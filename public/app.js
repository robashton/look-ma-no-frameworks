;(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var domready = require('domready')
  , CustomerList = require('./customers/index')
  , CustomerView = require('./customers/view')
  , routing = require('./navigation')
  , container = null
  , currentPage = null

function run(){
  container = document.getElementById('container')

  routing.route(/^customer\/(.+)/, function(path) {
    switchTo(CustomerView, { name: path.split('/')[1] })
  })

  routing.route(/^$/, function() {
    switchTo(CustomerList)
  })

  routing.start({
    pushState: true
  })
}

function switchTo(Presenter, options) {
  if(currentPage) currentPage.detach()
  currentPage = new Presenter(container, options)
}

domready(run)


},{"./customers/index":3,"./customers/view":4,"./navigation":6,"domready":10}],2:[function(require,module,exports){
var mustache = require('mustache')
  , Delegate = require('dom-delegate')
  , navigation = require('../navigation')
  , dope = require('dope')
  , _ = require('underscore')
  , fs = require('fs')

function CustomerList(element, customers) {
  this.element = element
  this.template = "  <table>\n    {{#activecustomers}}\n      <tr class=\"customer\" data-customer=\"{{name}}\"><td>{{name}}</td><td>{{bank}}</td></tr>\n    {{/activecustomers}}\n  </table>\n\n"
  this.customers = customers
  this.activecustomers = customers
  this.render()
  this.delegate = new Delegate(this.element)
  this.delegate.on('click', '.customer', this.onCustomerClicked.bind(this))
}

CustomerList.prototype = {
  render: function() {
    this.element.innerHTML = mustache.render(this.template, this)
  },
  onCustomerClicked: function(e, row) {
    navigation.update("/customer/" + dope.dataset(row).customer,
      {trigger: true})
  },
  filterByBank: function(bank) {
    if(bank) {
      this.activecustomers = _(this.customers).filter(function(i) { return i.bank === bank})
    }
    else {
      this.activecustomers = this.customers
    }
    this.render()
  },
  detach: function() {
    this.delegate.destroy()
  }
}


module.exports = CustomerList

},{"../navigation":6,"dom-delegate":8,"dope":11,"fs":19,"mustache":14,"underscore":15}],3:[function(require,module,exports){
var testdata = require('../testdata')
  , Dropdown = require('../dropdown')
  , CustomerList = require('./customerlist')

var Index = function(element) {
  this.element = element
  this.element.innerHTML = document.getElementById('customer-list-template').innerHTML
  this.banks = new Dropdown('banks', this.element.getElementsByClassName('bank-container')[0], testdata.banks)
  this.customers = new CustomerList(this.element.getElementsByClassName('customer-container')[0], testdata.customers)
  this.banks.on('changed', this.onBankChanged.bind(this))
}

Index.prototype = {
  detach: function() {
    this.banks.detach()
  },
  onBankChanged: function(newBank) {
    this.customers.filterByBank(newBank)
  }
}

module.exports = Index

},{"../dropdown":5,"../testdata":16,"./customerlist":2}],4:[function(require,module,exports){
var testdata = require('../testdata')
  , fs = require('fs')
  , mustache = require('mustache')
  , _ = require('underscore')

var View = function(element, opts) {
  this.element = element
  this.template = "<h4>{{name}}</h4>\n<p><strong>Bank</strong> {{bank}}</p>\n<p>{{desc}}</p>\n"
  this.customer = _(testdata.customers)
            .find(function(i) { return i.name == opts.name})
  this.render()
}

View.prototype = {
  detach: function() {

  },
  render: function() {
    this.element.innerHTML = mustache.render(this.template, this.customer)
  }
}

module.exports = View

},{"../testdata":16,"fs":19,"mustache":14,"underscore":15}],5:[function(require,module,exports){
var ko = require('knockout')
  , domify = require('domify')
  , _ = require('underscore')
  , EventEmitter = require('events').EventEmitter

function Dropdown(name, element, data) {
  EventEmitter.call(this)

  this.data = data
  this.element = element
  this.name = name

  // GASP - we can use Knockout if we want to
  // Just keep it internal to the presenter
  this.values = ko.observableArray(this.data)
  this.selectedValue = ko.observable()
  this.render()
  ko.applyBindings(this, this.element)
  this.selectedValue.subscribe(this.onSelectedValueChanged.bind(this))
}

Dropdown.prototype = {
  render: function() {
    this.element.innerHTML = ""
    var html = '<select name="' + this.name + '" data-bind="options: values, value: selectedValue"></select>'
    this.element.appendChild(domify(html))
  },
  onSelectedValueChanged: function(newValue) {
    this.emit('changed', newValue)
  },
  detach: function() {
    ko.cleanNode(this.element)
  }
}
_.extend(Dropdown.prototype, EventEmitter.prototype)

module.exports = Dropdown

},{"domify":9,"events":18,"knockout":12,"underscore":15}],6:[function(require,module,exports){
var LocationBar = require('location-bar')
module.exports = new LocationBar()

},{"location-bar":13}],7:[function(require,module,exports){
/*jshint browser:true, node:true*/

'use strict';

module.exports = Delegate;

/**
 * DOM event delegator
 *
 * The delegator will listen
 * for events that bubble up
 * to the root node.
 *
 * @constructor
 * @param {Node|string} [root] The root node or a selector string matching the root node
 */
function Delegate(root) {
  if (root) {
    this.root(root);
  }

  /**
   * Maintain a map of listener
   * lists, keyed by event name.
   *
   * @type Object
   */
  this.listenerMap = {};

  /** @type function() */
  this.handle = Delegate.prototype.handle.bind(this);
}

/**
 * @protected
 * @type ?boolean
 */
Delegate.tagsCaseSensitive = null;

/**
 * Start listening for events
 * on the provided DOM element
 *
 * @param  {Node|string} [root] The root node or a selector string matching the root node
 * @returns {Delegate} This method is chainable
 */
Delegate.prototype.root = function(root) {
  var listenerMap = this.listenerMap;
  var eventType;

  if (typeof root === 'string') {
    root = document.querySelector(root);
  }

  // Remove master event listeners
  if (this.rootElement) {
    for (eventType in listenerMap) {
      if (listenerMap.hasOwnProperty(eventType)) {
        this.rootElement.removeEventListener(eventType, this.handle, this.captureForType(eventType));
      }
    }
  }

  // If no root or root is not
  // a dom node, then remove internal
  // root reference and exit here
  if (!root || !root.addEventListener) {
    if (this.rootElement) {
      delete this.rootElement;
    }
    return this;
  }

  /**
   * The root node at which
   * listeners are attached.
   *
   * @type Node
   */
  this.rootElement = root;

  // Set up master event listeners
  for (eventType in listenerMap) {
    if (listenerMap.hasOwnProperty(eventType)) {
      this.rootElement.addEventListener(eventType, this.handle, this.captureForType(eventType));
    }
  }

  return this;
};

/**
 * @param {string} eventType
 * @returns boolean
 */
Delegate.prototype.captureForType = function(eventType) {
  return eventType === 'error';
};

/**
 * Attach a handler to one
 * event for all elements
 * that match the selector,
 * now or in the future
 *
 * The handler function receives
 * three arguments: the DOM event
 * object, the node that matched
 * the selector while the event
 * was bubbling and a reference
 * to itself. Within the handler,
 * 'this' is equal to the second
 * argument.
 *
 * The node that actually received
 * the event can be accessed via
 * 'event.target'.
 *
 * @param {string} eventType Listen for these events (in a space-separated list)
 * @param {string|undefined} selector Only handle events on elements matching this selector, if undefined match root element
 * @param {function()} handler Handler function - event data passed here will be in event.data
 * @param {Object} [eventData] Data to pass in event.data
 * @returns {Delegate} This method is chainable
 */
Delegate.prototype.on = function(eventType, selector, handler, eventData) {
  var root, listenerMap, matcher, matcherParam, self = this;

  if (!eventType) {
    throw new TypeError('Invalid event type: ' + eventType);
  }

  // handler can be passed as
  // the second or third argument
  if (typeof selector === 'function') {
    handler = selector;
    selector = null;
    eventData = handler;
  }

  // Normalise undefined eventData to null
  if (eventData === undefined) {
    eventData = null;
  }

  if (typeof handler !== 'function') {
    throw new TypeError('Handler must be a type of Function');
  }

  root = this.rootElement;
  listenerMap = this.listenerMap;

  // Add master handler for type if not created yet
  if (!listenerMap[eventType]) {
    if (root) {
      root.addEventListener(eventType, this.handle, this.captureForType(eventType));
    }
    listenerMap[eventType] = [];
  }

  if (!selector) {
    matcherParam = null;

    // COMPLEX - matchesRoot needs to have access to
    // this.rootElement, so bind the function to this.
    matcher = this.matchesRoot.bind(this);

  // Compile a matcher for the given selector
  } else if (/^[a-z]+$/i.test(selector)) {

    // Lazily check whether tag names are case sensitive (as in XML or XHTML documents).
    if (Delegate.tagsCaseSensitive === null) {
      Delegate.tagsCaseSensitive = document.createElement('i').tagName === 'i';
    }

    if (!Delegate.tagsCaseSensitive) {
      matcherParam = selector.toUpperCase();
    } else {
      matcherParam = selector;
    }

    matcher = this.matchesTag;
  } else if (/^#[a-z0-9\-_]+$/i.test(selector)) {
    matcherParam = selector.slice(1);
    matcher = this.matchesId;
  } else {
    matcherParam = selector;
    matcher = this.matches;
  }

  // Add to the list of listeners
  listenerMap[eventType].push({
    selector: selector,
    eventData: eventData,
    handler: handler,
    matcher: matcher,
    matcherParam: matcherParam
  });

  return this;
};

/**
 * Remove an event handler
 * for elements that match
 * the selector, forever
 *
 * @param {string} [eventType] Remove handlers for events matching this type, considering the other parameters
 * @param {string} [selector] If this parameter is omitted, only handlers which match the other two will be removed
 * @param {function()} [handler] If this parameter is omitted, only handlers which match the previous two will be removed
 * @returns {Delegate} This method is chainable
 */
Delegate.prototype.off = function(eventType, selector, handler) {
  var i, listener, listenerMap, listenerList, singleEventType, self = this;

  // Handler can be passed as
  // the second or third argument
  if (typeof selector === 'function') {
    handler = selector;
    selector = null;
  }

  listenerMap = this.listenerMap;
  if (!eventType) {
    for (singleEventType in listenerMap) {
      if (listenerMap.hasOwnProperty(singleEventType)) {
        this.off(singleEventType, selector, handler);
      }
    }

    return this;
  }

  listenerList = listenerMap[eventType];
  if (!listenerList || !listenerList.length) {
    return this;
  }

  // Remove only parameter matches
  // if specified
  for (i = listenerList.length - 1; i >= 0; i--) {
    listener = listenerList[i];

    if ((!selector || selector === listener.selector) && (!handler || handler === listener.handler)) {
      listenerList.splice(i, 1);
    }
  }

  // All listeners removed
  if (!listenerList.length) {
    delete listenerMap[eventType];

    // Remove the main handler
    if (this.rootElement) {
      this.rootElement.removeEventListener(eventType, this.handle, this.captureForType(eventType));
    }
  }

  return this;
};


/**
 * Handle an arbitrary event.
 *
 * @param {Event} event
 */
Delegate.prototype.handle = function(event) {
  var i, l, root, listener, returned, listenerList, target, /** @const */ EVENTIGNORE = 'ftLabsDelegateIgnore';

  if (event[EVENTIGNORE] === true) {
    return;
  }

  target = event.target;
  if (target.nodeType === Node.TEXT_NODE) {
    target = target.parentNode;
  }

  root = this.rootElement;
  listenerList = this.listenerMap[event.type];

  // Need to continuously check
  // that the specific list is
  // still populated in case one
  // of the callbacks actually
  // causes the list to be destroyed.
  l = listenerList.length;
  while (target && l) {
    for (i = 0; i < l; i++) {
      listener = listenerList[i];

      // Bail from this loop if
      // the length changed and
      // no more listeners are
      // defined between i and l.
      if (!listener) {
        break;
      }

      // Check for match and fire
      // the event if there's one
      //
      // TODO:MCG:20120117: Need a way
      // to check if event#stopImmediateProgagation
      // was called. If so, break both loops.
      if (listener.matcher.call(target, listener.matcherParam, target)) {
        returned = this.fire(event, target, listener);
      }

      // Stop propagation to subsequent
      // callbacks if the callback returned
      // false
      if (returned === false) {
        event[EVENTIGNORE] = true;
        return;
      }
    }

    // TODO:MCG:20120117: Need a way to
    // check if event#stopProgagation
    // was called. If so, break looping
    // through the DOM. Stop if the
    // delegation root has been reached
    if (target === root) {
      break;
    }

    l = listenerList.length;
    target = target.parentElement;
  }
};

/**
 * Fire a listener on a target.
 *
 * @param {Event} event
 * @param {Node} target
 * @param {Object} listener
 * @returns {boolean}
 */
Delegate.prototype.fire = function(event, target, listener) {
  var returned, oldData;

  if (listener.eventData !== null) {
    oldData = event.data;
    event.data = listener.eventData;
    returned = listener.handler.call(target, event, target);
    event.data = oldData;
  } else {
    returned = listener.handler.call(target, event, target);
  }

  return returned;
};

/**
 * Check whether an element
 * matches a generic selector.
 *
 * @type function()
 * @param {string} selector A CSS selector
 */
Delegate.prototype.matches = (function(el) {
  if (!el) return;
  var p = el.prototype;
  return (p.matchesSelector || p.webkitMatchesSelector || p.mozMatchesSelector || p.msMatchesSelector || p.oMatchesSelector);
}(HTMLElement));

/**
 * Check whether an element
 * matches a tag selector.
 *
 * Tags are NOT case-sensitive,
 * except in XML (and XML-based
 * languages such as XHTML).
 *
 * @param {string} tagName The tag name to test against
 * @param {Element} element The element to test with
 * @returns boolean
 */
Delegate.prototype.matchesTag = function(tagName, element) {
  return tagName === element.tagName;
};

/**
 * Check whether an element
 * matches the root.
 *
 * @param {?String} selector In this case this is always passed through as null and not used
 * @param {Element} element The element to test with
 * @returns boolean
 */
Delegate.prototype.matchesRoot = function(selector, element) {
  return this.rootElement === element;
};

/**
 * Check whether the ID of
 * the element in 'this'
 * matches the given ID.
 *
 * IDs are case-sensitive.
 *
 * @param {string} id The ID to test against
 * @param {Element} element The element to test with
 * @returns boolean
 */
Delegate.prototype.matchesId = function(id, element) {
  return id === element.id;
};

/**
 * Short hand for off()
 * and root(), ie both
 * with no parameters
 *
 * @return void
 */
Delegate.prototype.destroy = function() {
  this.off();
  this.root();
};

},{}],8:[function(require,module,exports){
/*jshint browser:true, node:true*/

'use strict';

/**
 * @preserve Create and manage a DOM event delegator.
 *
 * @version 0.3.0
 * @codingstandard ftlabs-jsv2
 * @copyright The Financial Times Limited [All Rights Reserved]
 * @license MIT License (see LICENSE.txt)
 */
var Delegate = require('./delegate');

module.exports = function(root) {
  return new Delegate(root);
};

module.exports.Delegate = Delegate;

},{"./delegate":7}],9:[function(require,module,exports){

/**
 * Expose `parse`.
 */

module.exports = parse;

/**
 * Wrap map from jquery.
 */

var map = {
  option: [1, '<select multiple="multiple">', '</select>'],
  optgroup: [1, '<select multiple="multiple">', '</select>'],
  legend: [1, '<fieldset>', '</fieldset>'],
  thead: [1, '<table>', '</table>'],
  tbody: [1, '<table>', '</table>'],
  tfoot: [1, '<table>', '</table>'],
  colgroup: [1, '<table>', '</table>'],
  caption: [1, '<table>', '</table>'],
  tr: [2, '<table><tbody>', '</tbody></table>'],
  td: [3, '<table><tbody><tr>', '</tr></tbody></table>'],
  th: [3, '<table><tbody><tr>', '</tr></tbody></table>'],
  col: [2, '<table><tbody></tbody><colgroup>', '</colgroup></table>'],
  _default: [0, '', '']
};

/**
 * Parse `html` and return the children.
 *
 * @param {String} html
 * @return {Array}
 * @api private
 */

function parse(html) {
  if ('string' != typeof html) throw new TypeError('String expected');

  // tag name
  var m = /<([\w:]+)/.exec(html);
  if (!m) throw new Error('No elements were generated.');
  var tag = m[1];

  // body support
  if (tag == 'body') {
    var el = document.createElement('html');
    el.innerHTML = html;
    return el.removeChild(el.lastChild);
  }

  // wrap map
  var wrap = map[tag] || map._default;
  var depth = wrap[0];
  var prefix = wrap[1];
  var suffix = wrap[2];
  var el = document.createElement('div');
  el.innerHTML = prefix + html + suffix;
  while (depth--) el = el.lastChild;

  var els = el.children;
  if (1 == els.length) {
    return el.removeChild(els[0]);
  }

  var fragment = document.createDocumentFragment();
  while (els.length) {
    fragment.appendChild(el.removeChild(els[0]));
  }

  return fragment;
}

},{}],10:[function(require,module,exports){
/*!
  * domready (c) Dustin Diaz 2012 - License MIT
  */
!function (name, definition) {
  if (typeof module != 'undefined') module.exports = definition()
  else if (typeof define == 'function' && typeof define.amd == 'object') define(definition)
  else this[name] = definition()
}('domready', function (ready) {

  var fns = [], fn, f = false
    , doc = document
    , testEl = doc.documentElement
    , hack = testEl.doScroll
    , domContentLoaded = 'DOMContentLoaded'
    , addEventListener = 'addEventListener'
    , onreadystatechange = 'onreadystatechange'
    , readyState = 'readyState'
    , loadedRgx = hack ? /^loaded|^c/ : /^loaded|c/
    , loaded = loadedRgx.test(doc[readyState])

  function flush(f) {
    loaded = 1
    while (f = fns.shift()) f()
  }

  doc[addEventListener] && doc[addEventListener](domContentLoaded, fn = function () {
    doc.removeEventListener(domContentLoaded, fn, f)
    flush()
  }, f)


  hack && doc.attachEvent(onreadystatechange, fn = function () {
    if (/^c/.test(doc[readyState])) {
      doc.detachEvent(onreadystatechange, fn)
      flush()
    }
  })

  return (ready = hack ?
    function (fn) {
      self != top ?
        loaded ? fn() : fns.push(fn) :
        function () {
          try {
            testEl.doScroll('left')
          } catch (e) {
            return setTimeout(function() { ready(fn) }, 50)
          }
          fn()
        }()
    } :
    function (fn) {
      loaded ? fn() : fns.push(fn)
    })
})

},{}],11:[function(require,module,exports){
/*!
 * dope         HTML attributes/dataset module
 * @link        http://github.com/ryanve/dope
 * @license     MIT
 * @copyright   2012 Ryan Van Etten
 * @version     2.2.1
 */

/*jshint expr:true, sub:true, supernew:true, debug:true, node:true, boss:true, devel:true, evil:true, 
  laxcomma:true, eqnull:true, undef:true, unused:true, browser:true, jquery:true, maxerr:100 */

(function(root, name, make) {
    typeof module != 'undefined' && module['exports'] ? module['exports'] = make() : root[name] = make();
}(this, 'dope', function() {

    // developers.google.com/closure/compiler/docs/api-tutorial3
    // developers.google.com/closure/compiler/docs/js-for-compiler

    var doc = document
      , xports = {}
      , effins = xports['fn'] = {}
      , owns = xports.hasOwnProperty
      , DMS = typeof DOMStringMap != 'undefined'
      , parseJSON = typeof JSON != 'undefined' && JSON.parse
      , queryMethod = 'querySelectorAll' 
      , QSA = !!doc[queryMethod] || !(queryMethod = 'getElementsByTagName')
      , queryEngine = function(s, root) {
            return s ? (root || doc)[queryMethod](s) : []; 
        }
      , camels = /([a-z])([A-Z])/g            // lowercase next to uppercase
      , dashB4 = /-(.)/g                      // finds chars after hyphens
      , csvSsv = /\s*[\s\,]+\s*/              // splitter for comma *or* space-separated values
      , cleanAttr = /^[\[\s]+|\s+|[\]\s]+$/g  // replace whitespace, trim [] brackets
      , cleanPre = /^[\[\s]?(data-)?|\s+|[\]\s]?$/g // replace whitespace, trim [] brackets, trim prefix
      , escDots = /\\*\./g                    // find periods w/ and w/o preceding backslashes
      , ssv = /\s+/
      , trimmer = /^\s+|\s+$/
      , trim = ''.trim ? function(s) {
            return null == s ? '' : s.trim(); 
        } : function(s) {
            return null == s ? '' : s.replace(trimmer, ''); 
        };
    
    /**
     * @return  {string}
     */
    function camelHandler(all, letter) { 
        return letter.toUpperCase();
    }

    /**
     * Convert  'data-pulp-fiction' to 'pulpFiction'. Non-scalars return an
     * empty string. number|boolean coerces to string. (opposite: datatize())
     * @param   {string|number|boolean|*}  s
     * @return  {string}
     */
    function camelize(s) {
        if (typeof s != 'string')
            return typeof s == 'number' || typeof s == 'boolean' ? '' + s : ''; 
        // Remove data- prefix and convert remaining dashed string to camelCase:
        return s.replace(cleanPre, '').replace(dashB4, camelHandler); // -a to A
    }

    /**
     * Convert  'pulpFiction' to 'data-pulp-fiction' OR 47 to 'data-47'
     * Invalid types return an empty string. (opposite: camelize())
     * @param   {string|number|*}  s
     * @return  {string}
     */
    function datatize(s) {
        if (typeof s == 'string') s = s.replace(cleanPre, '$1').replace(camels, '$1-$2'); // aA to a-A
        else s = typeof s == 'number'  ? '' + s : '';
        return s ? ('data-' + s.toLowerCase()) : s;
    }

    /**
     * Convert a stringified primitive into its correct type.
     * @param {string|*}  s
     */
    function parse(s) {
        var n; // undefined, or becomes number
        return typeof s != 'string' || !s ? s
            : 'false' === s ? false
            : 'true' === s ? true
            : 'null' === s ? null
            : 'undefined' === s || (n = (+s)) || 0 === n || 'NaN' === s ? n
            : s;
    }

    /**
     * @param   {Object|Array|*}  list
     * @param   {Function}        fn     
     * @param   {(Object|*)=}     scope
     * @param   {boolean=}        compact 
     * @return  {Array}
     */
    function map(list, fn, scope, compact) {
        var l, i = 0, v, u = 0, ret = [];
        if (list == null) return ret;
        compact = true === compact;
        for (l = list.length; i < l;) {
            v = fn.call(scope, list[i], i++, list);
            if (v || !compact) ret[u++] = v;
        }
        return ret;
    }
    
    /** 
     * special-case DOM-node iterator optimized for internal use
     * @param {Object|Array}  ob
     * @param {Function}      fn
     * @param {*=}            param
     */
    function eachNode(ob, fn, param) {
        for (var l = ob.length, i = 0; i < l; i++)
            ob[i] && ob[i].nodeType && fn(ob[i], param);
        return ob;
    }

    /**
     * internal-use function to iterate a node's attributes
     * @param {Object}        el
     * @param {Function}      fn
     * @param {(boolean|*)=}  exp
     */
    function eachAttr(el, fn, exp) {
        var test, n, a, i, l;
        if (!el.attributes) return;
        test = typeof exp == 'boolean' ? /^data-/ : test;
        for (i = 0, l = el.attributes.length; i < l;) {
            if (a = el.attributes[i++]) {
                n = '' + a.name;
                test && test.test(n) !== exp || null == a.value || fn.call(el, a.value, n, a);
            }
        }
    }

    /**
     * Get object containing an element's data attrs.
     * @param  {Node}  el
     * @return {DOMStringMap|Object|undefined}
     */
    function getDataset(el) {
        var ob;
        if (!el || 1 !== el.nodeType) return;  // undefined
        if (ob = DMS && el.dataset) return ob; // native
        ob = {}; // Fallback plain object cannot mutate the dataset via reference.
        eachAttr(el, function(v, k) {
            ob[camelize(k)] = '' + v;
        }, true);
        return ob;
    }

    /**
     * @param  {Node}     el
     * @param  {Object=}  ob
     */
    function resetDataset(el, ob) {
        if (!el) return;
        var n, curr = el.dataset;
        if (curr && DMS) {
            if (curr === ob) return;
            for (n in curr) delete curr[n];
        }
        ob && dataset(el, ob);
    }
    
    /**
     * @param  {Node}      el
     * @param  {Object}    ob
     * @param  {Function}  fn
     */
    function setViaObject(el, ob, fn) {
        for (var n in ob)
            owns.call(ob, n) && fn(el, n, ob[n]);
    }
    
    /**
     * @param  {Object|Array|Function}  el
     * @param  {(string|Object|*)=}     k
     * @param  {*=}                     v
     */    
    function attr(el, k, v) {
        el = el.nodeType ? el : el[0];
        if (!el || !el.setAttribute) return;
        k = typeof k == 'function' ? k.call(el) : k;
        if (!k) return;
        if (typeof k == 'object') {
            // SET-multi
            setViaObject(el, k, attr);
        } else {
            if (void 0 === v) {
                // GET
                k = el.getAttribute(k); // repurpose
                return null == k ? v : '' + k; // normalize
            }
            // SET
            v = typeof v == 'function' ? v.call(el) : v;
            v = '' + v; // normalize inputs
            el.setAttribute(k, v);
            return v; // the curr value
        }
    }
    
    /**
     * @param  {Object|Array|Function}  el
     * @param  {(string|Object|*)=}     k
     * @param  {*=}                     v
     */    
    function dataset(el, k, v) {
        var exact, kFun = typeof k == 'function';
        el = el.nodeType ? el : el[0];
        if (!el || !el.setAttribute) return;
        if (void 0 === k && v === k) return getDataset(el);
        k = kFun ? k.call(el) : k;

        if (typeof k == 'object' && (kFun || !(exact = void 0 === v && datatize(k[0])))) {
            // SET-multi
            kFun && deletes(el);
            k && setViaObject(el, k, dataset);
        } else {
            k = exact || datatize(k);
            if (!k) return;
            if (void 0 === v) {
                // GET
                k = el.getAttribute(k); // repurpose
                return null == k ? v : exact ? parse(k) : '' + k; // normalize
            }
            // SET
            v = typeof v == 'function' ? v.call(el) : v;
            v = '' + v; // normalize inputs
            el.setAttribute(k, v);
            return v; // current value
        }
    }

    /**
     * @param  {Node}                   el
     * @param  {(Array|string|number)=} keys
     */
    function deletes(el, keys) {
        var k, i = 0;
        el = el.nodeType ? el : el[0];
        if (!el || !el.removeAttribute)
            return;
        if (void 0 === keys) {
            resetDataset(el); 
        } else {
            keys = typeof keys == 'string' ? keys.split(ssv) : [].concat(keys);
            while (i < keys.length) {
                k = datatize(keys[i++]);
                k && el.removeAttribute(k);
            }
        }
    }
    
    /**
     * @param  {Node}                el
     * @param  {Array|string|number} keys
     */
    function removeAttr(el, keys) {
        var i = 0;
        el = el.nodeType ? el : el[0];
        if (el && el.removeAttribute) {
            for (keys = typeof keys == 'string' ? keys.split(ssv) : [].concat(keys); i < keys.length; i++) {
                keys[i] && el.removeAttribute(keys[i]);
            }
        }
    }

    /**
     * Convert list of attr names or data- keys into a selector.
     * @param   {Array|string|number|*}  list
     * @param   {boolean=}               prefix
     * @param   {boolean=}               join
     * @return  {string|Array}
     */
    function toAttrSelector(list, prefix, join) {
        var l, s, i = 0, j = 0, emp = '', arr = [];
        prefix = true === prefix;
        list = typeof list == 'string' ? list.split(csvSsv) : typeof list == 'number' ? '' + list : list;
        for (l = list.length; i < l;) {
            s = list[i++];
            s = prefix ? datatize(s) : s.replace(cleanAttr, emp);
            s && (arr[j++] = s);
        }
        // Escape periods to allow atts like `[data-the.wh_o]`
        // @link api.jquery.com/category/selectors/
        // @link stackoverflow.com/q/13283699/770127
        return false === join ? arr : j ? '[' + arr.join('],[').replace(escDots, '\\\\.') + ']' : emp;
    }

    /**
     * Get elements matched by a data key.
     * @param   {Array|string}  list   array or CSV or SSV data keys
     * @return  {Array|*}
     */     
    xports['queryData'] = QSA ? function(list, root) {
        // Modern browsers, IE8+
        return false === root ? toAttrSelector(list, true, root) : queryEngine(toAttrSelector(list, true), root);
    } : function(list, root) {
        // == FALLBACK ==
        list = toAttrSelector(list, true, false);
        return false === root ? list : queryAttrFallback(list, root); 
    };
    
    /**
     * Get elements matched by an attribute name.
     * @param   {Array|string}  list   array or CSV or SSV data keys
     * @return  {Array|*}
     */     
    xports['queryAttr'] = QSA ? function(list, root) {
        // Modern browsers, IE8+
        return false === root ? toAttrSelector(list, root, root) : queryEngine(toAttrSelector(list), root);
    } : function(list, root) {
        // == FALLBACK ==
        list = toAttrSelector(list, false, false);
        return false === root ? list : queryAttrFallback(list, root); 
    };
    
    /**
     * @param {Array|string}  list   is an array of attribute names (w/o bracks)
     * @param {Object=}       root
     */
    function queryAttrFallback(list, root) {
        var j, i, e, els, l = list.length, ret = [], u = 0;
        if (!l) return ret;
        els = queryEngine('*', root);
        for (j = 0; (e = els[j]); j++) {
            i = l; // reset i for each outer iteration
            while (i--) {// each attr name
                if (attr(e, list[i]) != null) {
                    ret[u++] = e; // ghetto push
                    break; // prevent pushing same elem twice
                }
            }
        }
        return ret;
    }
    
    // Expose remaining top-level methods:
    xports['map'] = map;
    xports['parse'] = parse;

    /**
     * @param  {string|*}  s
     * @since  2.1.0
     */
    xports['parseJSON'] = function(s) {
        s = parse(s);
        if (typeof s == 'string') {
            try {
                s = parseJSON(trim(s));
            } catch (e) {}
        }
        return s;
    };

    xports['trim'] = trim;
    xports['qsa'] = queryEngine;
    xports['attr'] = attr;
    xports['removeAttr'] = removeAttr;
    xports['dataset'] = dataset;
    xports['deletes'] = deletes;
    xports['camelize'] = camelize;
    xports['datatize'] = datatize;

    /**
     * @this    {Object|Array}
     * @param   {*=}   k
     * @param   {*=}   v
     */
    effins['dataset'] = function(k, v) {
        var kMulti = typeof k == 'object' ? !(void 0 === v && datatize(k[0])) : typeof k == 'function';
        if (void 0 === v && !kMulti)
            return dataset(this[0], k); // GET
        return (k = kMulti ? k : datatize(k)) ? eachNode(this, function(e, x) {
            x = typeof v == 'function' ? v.call(e) : v;
            kMulti ? dataset(e, k, x) : e.setAttribute(k, '' + x); 
        }) : void 0 === v ? v : this;
    };

    /**
     * @this    {Object|Array}
     * @param   {*=}   k
     * @param   {*=}   v
     */    
    effins['attr'] = function(k, v) {
        var kMulti = typeof k == 'object' || typeof k == 'function';
        if (void 0 === v && !kMulti)
            return attr(this[0], k); // GET
        return k ? eachNode(this, function(e, x) {
            x = typeof v == 'function' ? v.call(e) : v;
            kMulti ? attr(e, k, x) : e.setAttribute(k, '' + x); 
        }) : (void 0 === v ? v : this);
    };

    /**
     * Remove data- attrs for each element in a collection.
     * @this  {Object|Array}
     * @param {Array|string}  keys  one or more SSV or CSV data attr keys or names
     */
    effins['deletes'] = function(keys) {
        if (void 0 === keys)
            return eachNode(this, resetDataset);
        keys = typeof keys == 'string' ? keys.split(ssv) : [].concat(keys);
        return eachNode(this, removeAttr, map(keys, datatize));
    };
    
    /**
     * Remove attrbutes for each element in a collection.
     * @this  {Object|Array}
     * @param {Array|string}  keys  one or more SSV or CSV attr names
     */
    effins['removeAttr'] = function(keys) {
        return eachNode(this, removeAttr, keys);
    };

    return xports;
}));
},{}],12:[function(require,module,exports){
// Knockout JavaScript library v2.3.0
// (c) Steven Sanderson - http://knockoutjs.com/
// License: MIT (http://www.opensource.org/licenses/mit-license.php)

(function(){
var DEBUG=true;
(function(undefined){
    // (0, eval)('this') is a robust way of getting a reference to the global object
    // For details, see http://stackoverflow.com/questions/14119988/return-this-0-evalthis/14120023#14120023
    var window = this || (0, eval)('this'),
        document = window['document'],
        navigator = window['navigator'],
        jQuery = window["jQuery"],
        JSON = window["JSON"];
(function(factory) {
    // Support three module loading scenarios
    if (typeof require === 'function' && typeof exports === 'object' && typeof module === 'object') {
        // [1] CommonJS/Node.js
        var target = module['exports'] || exports; // module.exports is for Node.js
        factory(target);
    } else if (typeof define === 'function' && define['amd']) {
        // [2] AMD anonymous module
        define(['exports'], factory);
    } else {
        // [3] No module loader (plain <script> tag) - put directly in global namespace
        factory(window['ko'] = {});
    }
}(function(koExports){
// Internally, all KO objects are attached to koExports (even the non-exported ones whose names will be minified by the closure compiler).
// In the future, the following "ko" variable may be made distinct from "koExports" so that private objects are not externally reachable.
var ko = typeof koExports !== 'undefined' ? koExports : {};
// Google Closure Compiler helpers (used only to make the minified file smaller)
ko.exportSymbol = function(koPath, object) {
	var tokens = koPath.split(".");

	// In the future, "ko" may become distinct from "koExports" (so that non-exported objects are not reachable)
	// At that point, "target" would be set to: (typeof koExports !== "undefined" ? koExports : ko)
	var target = ko;

	for (var i = 0; i < tokens.length - 1; i++)
		target = target[tokens[i]];
	target[tokens[tokens.length - 1]] = object;
};
ko.exportProperty = function(owner, publicName, object) {
  owner[publicName] = object;
};
ko.version = "2.3.0";

ko.exportSymbol('version', ko.version);
ko.utils = (function () {
    var objectForEach = function(obj, action) {
        for (var prop in obj) {
            if (obj.hasOwnProperty(prop)) {
                action(prop, obj[prop]);
            }
        }
    };

    // Represent the known event types in a compact way, then at runtime transform it into a hash with event name as key (for fast lookup)
    var knownEvents = {}, knownEventTypesByEventName = {};
    var keyEventTypeName = (navigator && /Firefox\/2/i.test(navigator.userAgent)) ? 'KeyboardEvent' : 'UIEvents';
    knownEvents[keyEventTypeName] = ['keyup', 'keydown', 'keypress'];
    knownEvents['MouseEvents'] = ['click', 'dblclick', 'mousedown', 'mouseup', 'mousemove', 'mouseover', 'mouseout', 'mouseenter', 'mouseleave'];
    objectForEach(knownEvents, function(eventType, knownEventsForType) {
        if (knownEventsForType.length) {
            for (var i = 0, j = knownEventsForType.length; i < j; i++)
                knownEventTypesByEventName[knownEventsForType[i]] = eventType;
        }
    });
    var eventsThatMustBeRegisteredUsingAttachEvent = { 'propertychange': true }; // Workaround for an IE9 issue - https://github.com/SteveSanderson/knockout/issues/406

    // Detect IE versions for bug workarounds (uses IE conditionals, not UA string, for robustness)
    // Note that, since IE 10 does not support conditional comments, the following logic only detects IE < 10.
    // Currently this is by design, since IE 10+ behaves correctly when treated as a standard browser.
    // If there is a future need to detect specific versions of IE10+, we will amend this.
    var ieVersion = document && (function() {
        var version = 3, div = document.createElement('div'), iElems = div.getElementsByTagName('i');

        // Keep constructing conditional HTML blocks until we hit one that resolves to an empty fragment
        while (
            div.innerHTML = '<!--[if gt IE ' + (++version) + ']><i></i><![endif]-->',
            iElems[0]
        ) {}
        return version > 4 ? version : undefined;
    }());
    var isIe6 = ieVersion === 6,
        isIe7 = ieVersion === 7;

    function isClickOnCheckableElement(element, eventType) {
        if ((ko.utils.tagNameLower(element) !== "input") || !element.type) return false;
        if (eventType.toLowerCase() != "click") return false;
        var inputType = element.type;
        return (inputType == "checkbox") || (inputType == "radio");
    }

    return {
        fieldsIncludedWithJsonPost: ['authenticity_token', /^__RequestVerificationToken(_.*)?$/],

        arrayForEach: function (array, action) {
            for (var i = 0, j = array.length; i < j; i++)
                action(array[i]);
        },

        arrayIndexOf: function (array, item) {
            if (typeof Array.prototype.indexOf == "function")
                return Array.prototype.indexOf.call(array, item);
            for (var i = 0, j = array.length; i < j; i++)
                if (array[i] === item)
                    return i;
            return -1;
        },

        arrayFirst: function (array, predicate, predicateOwner) {
            for (var i = 0, j = array.length; i < j; i++)
                if (predicate.call(predicateOwner, array[i]))
                    return array[i];
            return null;
        },

        arrayRemoveItem: function (array, itemToRemove) {
            var index = ko.utils.arrayIndexOf(array, itemToRemove);
            if (index >= 0)
                array.splice(index, 1);
        },

        arrayGetDistinctValues: function (array) {
            array = array || [];
            var result = [];
            for (var i = 0, j = array.length; i < j; i++) {
                if (ko.utils.arrayIndexOf(result, array[i]) < 0)
                    result.push(array[i]);
            }
            return result;
        },

        arrayMap: function (array, mapping) {
            array = array || [];
            var result = [];
            for (var i = 0, j = array.length; i < j; i++)
                result.push(mapping(array[i]));
            return result;
        },

        arrayFilter: function (array, predicate) {
            array = array || [];
            var result = [];
            for (var i = 0, j = array.length; i < j; i++)
                if (predicate(array[i]))
                    result.push(array[i]);
            return result;
        },

        arrayPushAll: function (array, valuesToPush) {
            if (valuesToPush instanceof Array)
                array.push.apply(array, valuesToPush);
            else
                for (var i = 0, j = valuesToPush.length; i < j; i++)
                    array.push(valuesToPush[i]);
            return array;
        },

        addOrRemoveItem: function(array, value, included) {
            var existingEntryIndex = array.indexOf ? array.indexOf(value) : ko.utils.arrayIndexOf(array, value);
            if (existingEntryIndex < 0) {
                if (included)
                    array.push(value);
            } else {
                if (!included)
                    array.splice(existingEntryIndex, 1);
            }
        },

        extend: function (target, source) {
            if (source) {
                for(var prop in source) {
                    if(source.hasOwnProperty(prop)) {
                        target[prop] = source[prop];
                    }
                }
            }
            return target;
        },

        objectForEach: objectForEach,

        emptyDomNode: function (domNode) {
            while (domNode.firstChild) {
                ko.removeNode(domNode.firstChild);
            }
        },

        moveCleanedNodesToContainerElement: function(nodes) {
            // Ensure it's a real array, as we're about to reparent the nodes and
            // we don't want the underlying collection to change while we're doing that.
            var nodesArray = ko.utils.makeArray(nodes);

            var container = document.createElement('div');
            for (var i = 0, j = nodesArray.length; i < j; i++) {
                container.appendChild(ko.cleanNode(nodesArray[i]));
            }
            return container;
        },

        cloneNodes: function (nodesArray, shouldCleanNodes) {
            for (var i = 0, j = nodesArray.length, newNodesArray = []; i < j; i++) {
                var clonedNode = nodesArray[i].cloneNode(true);
                newNodesArray.push(shouldCleanNodes ? ko.cleanNode(clonedNode) : clonedNode);
            }
            return newNodesArray;
        },

        setDomNodeChildren: function (domNode, childNodes) {
            ko.utils.emptyDomNode(domNode);
            if (childNodes) {
                for (var i = 0, j = childNodes.length; i < j; i++)
                    domNode.appendChild(childNodes[i]);
            }
        },

        replaceDomNodes: function (nodeToReplaceOrNodeArray, newNodesArray) {
            var nodesToReplaceArray = nodeToReplaceOrNodeArray.nodeType ? [nodeToReplaceOrNodeArray] : nodeToReplaceOrNodeArray;
            if (nodesToReplaceArray.length > 0) {
                var insertionPoint = nodesToReplaceArray[0];
                var parent = insertionPoint.parentNode;
                for (var i = 0, j = newNodesArray.length; i < j; i++)
                    parent.insertBefore(newNodesArray[i], insertionPoint);
                for (var i = 0, j = nodesToReplaceArray.length; i < j; i++) {
                    ko.removeNode(nodesToReplaceArray[i]);
                }
            }
        },

        setOptionNodeSelectionState: function (optionNode, isSelected) {
            // IE6 sometimes throws "unknown error" if you try to write to .selected directly, whereas Firefox struggles with setAttribute. Pick one based on browser.
            if (ieVersion < 7)
                optionNode.setAttribute("selected", isSelected);
            else
                optionNode.selected = isSelected;
        },

        stringTrim: function (string) {
            return string === null || string === undefined ? '' :
                string.trim ?
                    string.trim() :
                    string.toString().replace(/^[\s\xa0]+|[\s\xa0]+$/g, '');
        },

        stringTokenize: function (string, delimiter) {
            var result = [];
            var tokens = (string || "").split(delimiter);
            for (var i = 0, j = tokens.length; i < j; i++) {
                var trimmed = ko.utils.stringTrim(tokens[i]);
                if (trimmed !== "")
                    result.push(trimmed);
            }
            return result;
        },

        stringStartsWith: function (string, startsWith) {
            string = string || "";
            if (startsWith.length > string.length)
                return false;
            return string.substring(0, startsWith.length) === startsWith;
        },

        domNodeIsContainedBy: function (node, containedByNode) {
            if (containedByNode.compareDocumentPosition)
                return (containedByNode.compareDocumentPosition(node) & 16) == 16;
            while (node != null) {
                if (node == containedByNode)
                    return true;
                node = node.parentNode;
            }
            return false;
        },

        domNodeIsAttachedToDocument: function (node) {
            return ko.utils.domNodeIsContainedBy(node, node.ownerDocument);
        },

        anyDomNodeIsAttachedToDocument: function(nodes) {
            return !!ko.utils.arrayFirst(nodes, ko.utils.domNodeIsAttachedToDocument);
        },

        tagNameLower: function(element) {
            // For HTML elements, tagName will always be upper case; for XHTML elements, it'll be lower case.
            // Possible future optimization: If we know it's an element from an XHTML document (not HTML),
            // we don't need to do the .toLowerCase() as it will always be lower case anyway.
            return element && element.tagName && element.tagName.toLowerCase();
        },

        registerEventHandler: function (element, eventType, handler) {
            var mustUseAttachEvent = ieVersion && eventsThatMustBeRegisteredUsingAttachEvent[eventType];
            if (!mustUseAttachEvent && typeof jQuery != "undefined") {
                if (isClickOnCheckableElement(element, eventType)) {
                    // For click events on checkboxes, jQuery interferes with the event handling in an awkward way:
                    // it toggles the element checked state *after* the click event handlers run, whereas native
                    // click events toggle the checked state *before* the event handler.
                    // Fix this by intecepting the handler and applying the correct checkedness before it runs.
                    var originalHandler = handler;
                    handler = function(event, eventData) {
                        var jQuerySuppliedCheckedState = this.checked;
                        if (eventData)
                            this.checked = eventData.checkedStateBeforeEvent !== true;
                        originalHandler.call(this, event);
                        this.checked = jQuerySuppliedCheckedState; // Restore the state jQuery applied
                    };
                }
                jQuery(element)['bind'](eventType, handler);
            } else if (!mustUseAttachEvent && typeof element.addEventListener == "function")
                element.addEventListener(eventType, handler, false);
            else if (typeof element.attachEvent != "undefined") {
                var attachEventHandler = function (event) { handler.call(element, event); },
                    attachEventName = "on" + eventType;
                element.attachEvent(attachEventName, attachEventHandler);

                // IE does not dispose attachEvent handlers automatically (unlike with addEventListener)
                // so to avoid leaks, we have to remove them manually. See bug #856
                ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
                    element.detachEvent(attachEventName, attachEventHandler);
                });
            } else
                throw new Error("Browser doesn't support addEventListener or attachEvent");
        },

        triggerEvent: function (element, eventType) {
            if (!(element && element.nodeType))
                throw new Error("element must be a DOM node when calling triggerEvent");

            if (typeof jQuery != "undefined") {
                var eventData = [];
                if (isClickOnCheckableElement(element, eventType)) {
                    // Work around the jQuery "click events on checkboxes" issue described above by storing the original checked state before triggering the handler
                    eventData.push({ checkedStateBeforeEvent: element.checked });
                }
                jQuery(element)['trigger'](eventType, eventData);
            } else if (typeof document.createEvent == "function") {
                if (typeof element.dispatchEvent == "function") {
                    var eventCategory = knownEventTypesByEventName[eventType] || "HTMLEvents";
                    var event = document.createEvent(eventCategory);
                    event.initEvent(eventType, true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, element);
                    element.dispatchEvent(event);
                }
                else
                    throw new Error("The supplied element doesn't support dispatchEvent");
            } else if (typeof element.fireEvent != "undefined") {
                // Unlike other browsers, IE doesn't change the checked state of checkboxes/radiobuttons when you trigger their "click" event
                // so to make it consistent, we'll do it manually here
                if (isClickOnCheckableElement(element, eventType))
                    element.checked = element.checked !== true;
                element.fireEvent("on" + eventType);
            }
            else
                throw new Error("Browser doesn't support triggering events");
        },

        unwrapObservable: function (value) {
            return ko.isObservable(value) ? value() : value;
        },

        peekObservable: function (value) {
            return ko.isObservable(value) ? value.peek() : value;
        },

        toggleDomNodeCssClass: function (node, classNames, shouldHaveClass) {
            if (classNames) {
                var cssClassNameRegex = /\S+/g,
                    currentClassNames = node.className.match(cssClassNameRegex) || [];
                ko.utils.arrayForEach(classNames.match(cssClassNameRegex), function(className) {
                    ko.utils.addOrRemoveItem(currentClassNames, className, shouldHaveClass);
                });
                node.className = currentClassNames.join(" ");
            }
        },

        setTextContent: function(element, textContent) {
            var value = ko.utils.unwrapObservable(textContent);
            if ((value === null) || (value === undefined))
                value = "";

            // We need there to be exactly one child: a text node.
            // If there are no children, more than one, or if it's not a text node,
            // we'll clear everything and create a single text node.
            var innerTextNode = ko.virtualElements.firstChild(element);
            if (!innerTextNode || innerTextNode.nodeType != 3 || ko.virtualElements.nextSibling(innerTextNode)) {
                ko.virtualElements.setDomNodeChildren(element, [document.createTextNode(value)]);
            } else {
                innerTextNode.data = value;
            }

            ko.utils.forceRefresh(element);
        },

        setElementName: function(element, name) {
            element.name = name;

            // Workaround IE 6/7 issue
            // - https://github.com/SteveSanderson/knockout/issues/197
            // - http://www.matts411.com/post/setting_the_name_attribute_in_ie_dom/
            if (ieVersion <= 7) {
                try {
                    element.mergeAttributes(document.createElement("<input name='" + element.name + "'/>"), false);
                }
                catch(e) {} // For IE9 with doc mode "IE9 Standards" and browser mode "IE9 Compatibility View"
            }
        },

        forceRefresh: function(node) {
            // Workaround for an IE9 rendering bug - https://github.com/SteveSanderson/knockout/issues/209
            if (ieVersion >= 9) {
                // For text nodes and comment nodes (most likely virtual elements), we will have to refresh the container
                var elem = node.nodeType == 1 ? node : node.parentNode;
                if (elem.style)
                    elem.style.zoom = elem.style.zoom;
            }
        },

        ensureSelectElementIsRenderedCorrectly: function(selectElement) {
            // Workaround for IE9 rendering bug - it doesn't reliably display all the text in dynamically-added select boxes unless you force it to re-render by updating the width.
            // (See https://github.com/SteveSanderson/knockout/issues/312, http://stackoverflow.com/questions/5908494/select-only-shows-first-char-of-selected-option)
            // Also fixes IE7 and IE8 bug that causes selects to be zero width if enclosed by 'if' or 'with'. (See issue #839)
            if (ieVersion) {
                var originalWidth = selectElement.style.width;
                selectElement.style.width = 0;
                selectElement.style.width = originalWidth;
            }
        },

        range: function (min, max) {
            min = ko.utils.unwrapObservable(min);
            max = ko.utils.unwrapObservable(max);
            var result = [];
            for (var i = min; i <= max; i++)
                result.push(i);
            return result;
        },

        makeArray: function(arrayLikeObject) {
            var result = [];
            for (var i = 0, j = arrayLikeObject.length; i < j; i++) {
                result.push(arrayLikeObject[i]);
            };
            return result;
        },

        isIe6 : isIe6,
        isIe7 : isIe7,
        ieVersion : ieVersion,

        getFormFields: function(form, fieldName) {
            var fields = ko.utils.makeArray(form.getElementsByTagName("input")).concat(ko.utils.makeArray(form.getElementsByTagName("textarea")));
            var isMatchingField = (typeof fieldName == 'string')
                ? function(field) { return field.name === fieldName }
                : function(field) { return fieldName.test(field.name) }; // Treat fieldName as regex or object containing predicate
            var matches = [];
            for (var i = fields.length - 1; i >= 0; i--) {
                if (isMatchingField(fields[i]))
                    matches.push(fields[i]);
            };
            return matches;
        },

        parseJson: function (jsonString) {
            if (typeof jsonString == "string") {
                jsonString = ko.utils.stringTrim(jsonString);
                if (jsonString) {
                    if (JSON && JSON.parse) // Use native parsing where available
                        return JSON.parse(jsonString);
                    return (new Function("return " + jsonString))(); // Fallback on less safe parsing for older browsers
                }
            }
            return null;
        },

        stringifyJson: function (data, replacer, space) {   // replacer and space are optional
            if (!JSON || !JSON.stringify)
                throw new Error("Cannot find JSON.stringify(). Some browsers (e.g., IE < 8) don't support it natively, but you can overcome this by adding a script reference to json2.js, downloadable from http://www.json.org/json2.js");
            return JSON.stringify(ko.utils.unwrapObservable(data), replacer, space);
        },

        postJson: function (urlOrForm, data, options) {
            options = options || {};
            var params = options['params'] || {};
            var includeFields = options['includeFields'] || this.fieldsIncludedWithJsonPost;
            var url = urlOrForm;

            // If we were given a form, use its 'action' URL and pick out any requested field values
            if((typeof urlOrForm == 'object') && (ko.utils.tagNameLower(urlOrForm) === "form")) {
                var originalForm = urlOrForm;
                url = originalForm.action;
                for (var i = includeFields.length - 1; i >= 0; i--) {
                    var fields = ko.utils.getFormFields(originalForm, includeFields[i]);
                    for (var j = fields.length - 1; j >= 0; j--)
                        params[fields[j].name] = fields[j].value;
                }
            }

            data = ko.utils.unwrapObservable(data);
            var form = document.createElement("form");
            form.style.display = "none";
            form.action = url;
            form.method = "post";
            for (var key in data) {
                // Since 'data' this is a model object, we include all properties including those inherited from its prototype
                var input = document.createElement("input");
                input.name = key;
                input.value = ko.utils.stringifyJson(ko.utils.unwrapObservable(data[key]));
                form.appendChild(input);
            }
            objectForEach(params, function(key, value) {
                var input = document.createElement("input");
                input.name = key;
                input.value = value;
                form.appendChild(input);
            });
            document.body.appendChild(form);
            options['submitter'] ? options['submitter'](form) : form.submit();
            setTimeout(function () { form.parentNode.removeChild(form); }, 0);
        }
    }
}());

ko.exportSymbol('utils', ko.utils);
ko.exportSymbol('utils.arrayForEach', ko.utils.arrayForEach);
ko.exportSymbol('utils.arrayFirst', ko.utils.arrayFirst);
ko.exportSymbol('utils.arrayFilter', ko.utils.arrayFilter);
ko.exportSymbol('utils.arrayGetDistinctValues', ko.utils.arrayGetDistinctValues);
ko.exportSymbol('utils.arrayIndexOf', ko.utils.arrayIndexOf);
ko.exportSymbol('utils.arrayMap', ko.utils.arrayMap);
ko.exportSymbol('utils.arrayPushAll', ko.utils.arrayPushAll);
ko.exportSymbol('utils.arrayRemoveItem', ko.utils.arrayRemoveItem);
ko.exportSymbol('utils.extend', ko.utils.extend);
ko.exportSymbol('utils.fieldsIncludedWithJsonPost', ko.utils.fieldsIncludedWithJsonPost);
ko.exportSymbol('utils.getFormFields', ko.utils.getFormFields);
ko.exportSymbol('utils.peekObservable', ko.utils.peekObservable);
ko.exportSymbol('utils.postJson', ko.utils.postJson);
ko.exportSymbol('utils.parseJson', ko.utils.parseJson);
ko.exportSymbol('utils.registerEventHandler', ko.utils.registerEventHandler);
ko.exportSymbol('utils.stringifyJson', ko.utils.stringifyJson);
ko.exportSymbol('utils.range', ko.utils.range);
ko.exportSymbol('utils.toggleDomNodeCssClass', ko.utils.toggleDomNodeCssClass);
ko.exportSymbol('utils.triggerEvent', ko.utils.triggerEvent);
ko.exportSymbol('utils.unwrapObservable', ko.utils.unwrapObservable);
ko.exportSymbol('utils.objectForEach', ko.utils.objectForEach);
ko.exportSymbol('utils.addOrRemoveItem', ko.utils.addOrRemoveItem);
ko.exportSymbol('unwrap', ko.utils.unwrapObservable); // Convenient shorthand, because this is used so commonly

if (!Function.prototype['bind']) {
    // Function.prototype.bind is a standard part of ECMAScript 5th Edition (December 2009, http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-262.pdf)
    // In case the browser doesn't implement it natively, provide a JavaScript implementation. This implementation is based on the one in prototype.js
    Function.prototype['bind'] = function (object) {
        var originalFunction = this, args = Array.prototype.slice.call(arguments), object = args.shift();
        return function () {
            return originalFunction.apply(object, args.concat(Array.prototype.slice.call(arguments)));
        };
    };
}

ko.utils.domData = new (function () {
    var uniqueId = 0;
    var dataStoreKeyExpandoPropertyName = "__ko__" + (new Date).getTime();
    var dataStore = {};
    return {
        get: function (node, key) {
            var allDataForNode = ko.utils.domData.getAll(node, false);
            return allDataForNode === undefined ? undefined : allDataForNode[key];
        },
        set: function (node, key, value) {
            if (value === undefined) {
                // Make sure we don't actually create a new domData key if we are actually deleting a value
                if (ko.utils.domData.getAll(node, false) === undefined)
                    return;
            }
            var allDataForNode = ko.utils.domData.getAll(node, true);
            allDataForNode[key] = value;
        },
        getAll: function (node, createIfNotFound) {
            var dataStoreKey = node[dataStoreKeyExpandoPropertyName];
            var hasExistingDataStore = dataStoreKey && (dataStoreKey !== "null") && dataStore[dataStoreKey];
            if (!hasExistingDataStore) {
                if (!createIfNotFound)
                    return undefined;
                dataStoreKey = node[dataStoreKeyExpandoPropertyName] = "ko" + uniqueId++;
                dataStore[dataStoreKey] = {};
            }
            return dataStore[dataStoreKey];
        },
        clear: function (node) {
            var dataStoreKey = node[dataStoreKeyExpandoPropertyName];
            if (dataStoreKey) {
                delete dataStore[dataStoreKey];
                node[dataStoreKeyExpandoPropertyName] = null;
                return true; // Exposing "did clean" flag purely so specs can infer whether things have been cleaned up as intended
            }
            return false;
        }
    }
})();

ko.exportSymbol('utils.domData', ko.utils.domData);
ko.exportSymbol('utils.domData.clear', ko.utils.domData.clear); // Exporting only so specs can clear up after themselves fully

ko.utils.domNodeDisposal = new (function () {
    var domDataKey = "__ko_domNodeDisposal__" + (new Date).getTime();
    var cleanableNodeTypes = { 1: true, 8: true, 9: true };       // Element, Comment, Document
    var cleanableNodeTypesWithDescendants = { 1: true, 9: true }; // Element, Document

    function getDisposeCallbacksCollection(node, createIfNotFound) {
        var allDisposeCallbacks = ko.utils.domData.get(node, domDataKey);
        if ((allDisposeCallbacks === undefined) && createIfNotFound) {
            allDisposeCallbacks = [];
            ko.utils.domData.set(node, domDataKey, allDisposeCallbacks);
        }
        return allDisposeCallbacks;
    }
    function destroyCallbacksCollection(node) {
        ko.utils.domData.set(node, domDataKey, undefined);
    }

    function cleanSingleNode(node) {
        // Run all the dispose callbacks
        var callbacks = getDisposeCallbacksCollection(node, false);
        if (callbacks) {
            callbacks = callbacks.slice(0); // Clone, as the array may be modified during iteration (typically, callbacks will remove themselves)
            for (var i = 0; i < callbacks.length; i++)
                callbacks[i](node);
        }

        // Also erase the DOM data
        ko.utils.domData.clear(node);

        // Special support for jQuery here because it's so commonly used.
        // Many jQuery plugins (including jquery.tmpl) store data using jQuery's equivalent of domData
        // so notify it to tear down any resources associated with the node & descendants here.
        if ((typeof jQuery == "function") && (typeof jQuery['cleanData'] == "function"))
            jQuery['cleanData']([node]);

        // Also clear any immediate-child comment nodes, as these wouldn't have been found by
        // node.getElementsByTagName("*") in cleanNode() (comment nodes aren't elements)
        if (cleanableNodeTypesWithDescendants[node.nodeType])
            cleanImmediateCommentTypeChildren(node);
    }

    function cleanImmediateCommentTypeChildren(nodeWithChildren) {
        var child, nextChild = nodeWithChildren.firstChild;
        while (child = nextChild) {
            nextChild = child.nextSibling;
            if (child.nodeType === 8)
                cleanSingleNode(child);
        }
    }

    return {
        addDisposeCallback : function(node, callback) {
            if (typeof callback != "function")
                throw new Error("Callback must be a function");
            getDisposeCallbacksCollection(node, true).push(callback);
        },

        removeDisposeCallback : function(node, callback) {
            var callbacksCollection = getDisposeCallbacksCollection(node, false);
            if (callbacksCollection) {
                ko.utils.arrayRemoveItem(callbacksCollection, callback);
                if (callbacksCollection.length == 0)
                    destroyCallbacksCollection(node);
            }
        },

        cleanNode : function(node) {
            // First clean this node, where applicable
            if (cleanableNodeTypes[node.nodeType]) {
                cleanSingleNode(node);

                // ... then its descendants, where applicable
                if (cleanableNodeTypesWithDescendants[node.nodeType]) {
                    // Clone the descendants list in case it changes during iteration
                    var descendants = [];
                    ko.utils.arrayPushAll(descendants, node.getElementsByTagName("*"));
                    for (var i = 0, j = descendants.length; i < j; i++)
                        cleanSingleNode(descendants[i]);
                }
            }
            return node;
        },

        removeNode : function(node) {
            ko.cleanNode(node);
            if (node.parentNode)
                node.parentNode.removeChild(node);
        }
    }
})();
ko.cleanNode = ko.utils.domNodeDisposal.cleanNode; // Shorthand name for convenience
ko.removeNode = ko.utils.domNodeDisposal.removeNode; // Shorthand name for convenience
ko.exportSymbol('cleanNode', ko.cleanNode);
ko.exportSymbol('removeNode', ko.removeNode);
ko.exportSymbol('utils.domNodeDisposal', ko.utils.domNodeDisposal);
ko.exportSymbol('utils.domNodeDisposal.addDisposeCallback', ko.utils.domNodeDisposal.addDisposeCallback);
ko.exportSymbol('utils.domNodeDisposal.removeDisposeCallback', ko.utils.domNodeDisposal.removeDisposeCallback);
(function () {
    var leadingCommentRegex = /^(\s*)<!--(.*?)-->/;

    function simpleHtmlParse(html) {
        // Based on jQuery's "clean" function, but only accounting for table-related elements.
        // If you have referenced jQuery, this won't be used anyway - KO will use jQuery's "clean" function directly

        // Note that there's still an issue in IE < 9 whereby it will discard comment nodes that are the first child of
        // a descendant node. For example: "<div><!-- mycomment -->abc</div>" will get parsed as "<div>abc</div>"
        // This won't affect anyone who has referenced jQuery, and there's always the workaround of inserting a dummy node
        // (possibly a text node) in front of the comment. So, KO does not attempt to workaround this IE issue automatically at present.

        // Trim whitespace, otherwise indexOf won't work as expected
        var tags = ko.utils.stringTrim(html).toLowerCase(), div = document.createElement("div");

        // Finds the first match from the left column, and returns the corresponding "wrap" data from the right column
        var wrap = tags.match(/^<(thead|tbody|tfoot)/)              && [1, "<table>", "</table>"] ||
                   !tags.indexOf("<tr")                             && [2, "<table><tbody>", "</tbody></table>"] ||
                   (!tags.indexOf("<td") || !tags.indexOf("<th"))   && [3, "<table><tbody><tr>", "</tr></tbody></table>"] ||
                   /* anything else */                                 [0, "", ""];

        // Go to html and back, then peel off extra wrappers
        // Note that we always prefix with some dummy text, because otherwise, IE<9 will strip out leading comment nodes in descendants. Total madness.
        var markup = "ignored<div>" + wrap[1] + html + wrap[2] + "</div>";
        if (typeof window['innerShiv'] == "function") {
            div.appendChild(window['innerShiv'](markup));
        } else {
            div.innerHTML = markup;
        }

        // Move to the right depth
        while (wrap[0]--)
            div = div.lastChild;

        return ko.utils.makeArray(div.lastChild.childNodes);
    }

    function jQueryHtmlParse(html) {
        // jQuery's "parseHTML" function was introduced in jQuery 1.8.0 and is a documented public API.
        if (jQuery['parseHTML']) {
            return jQuery['parseHTML'](html) || []; // Ensure we always return an array and never null
        } else {
            // For jQuery < 1.8.0, we fall back on the undocumented internal "clean" function.
            var elems = jQuery['clean']([html]);

            // As of jQuery 1.7.1, jQuery parses the HTML by appending it to some dummy parent nodes held in an in-memory document fragment.
            // Unfortunately, it never clears the dummy parent nodes from the document fragment, so it leaks memory over time.
            // Fix this by finding the top-most dummy parent element, and detaching it from its owner fragment.
            if (elems && elems[0]) {
                // Find the top-most parent element that's a direct child of a document fragment
                var elem = elems[0];
                while (elem.parentNode && elem.parentNode.nodeType !== 11 /* i.e., DocumentFragment */)
                    elem = elem.parentNode;
                // ... then detach it
                if (elem.parentNode)
                    elem.parentNode.removeChild(elem);
            }

            return elems;
        }
    }

    ko.utils.parseHtmlFragment = function(html) {
        return typeof jQuery != 'undefined' ? jQueryHtmlParse(html)   // As below, benefit from jQuery's optimisations where possible
                                            : simpleHtmlParse(html);  // ... otherwise, this simple logic will do in most common cases.
    };

    ko.utils.setHtml = function(node, html) {
        ko.utils.emptyDomNode(node);

        // There's no legitimate reason to display a stringified observable without unwrapping it, so we'll unwrap it
        html = ko.utils.unwrapObservable(html);

        if ((html !== null) && (html !== undefined)) {
            if (typeof html != 'string')
                html = html.toString();

            // jQuery contains a lot of sophisticated code to parse arbitrary HTML fragments,
            // for example <tr> elements which are not normally allowed to exist on their own.
            // If you've referenced jQuery we'll use that rather than duplicating its code.
            if (typeof jQuery != 'undefined') {
                jQuery(node)['html'](html);
            } else {
                // ... otherwise, use KO's own parsing logic.
                var parsedNodes = ko.utils.parseHtmlFragment(html);
                for (var i = 0; i < parsedNodes.length; i++)
                    node.appendChild(parsedNodes[i]);
            }
        }
    };
})();

ko.exportSymbol('utils.parseHtmlFragment', ko.utils.parseHtmlFragment);
ko.exportSymbol('utils.setHtml', ko.utils.setHtml);

ko.memoization = (function () {
    var memos = {};

    function randomMax8HexChars() {
        return (((1 + Math.random()) * 0x100000000) | 0).toString(16).substring(1);
    }
    function generateRandomId() {
        return randomMax8HexChars() + randomMax8HexChars();
    }
    function findMemoNodes(rootNode, appendToArray) {
        if (!rootNode)
            return;
        if (rootNode.nodeType == 8) {
            var memoId = ko.memoization.parseMemoText(rootNode.nodeValue);
            if (memoId != null)
                appendToArray.push({ domNode: rootNode, memoId: memoId });
        } else if (rootNode.nodeType == 1) {
            for (var i = 0, childNodes = rootNode.childNodes, j = childNodes.length; i < j; i++)
                findMemoNodes(childNodes[i], appendToArray);
        }
    }

    return {
        memoize: function (callback) {
            if (typeof callback != "function")
                throw new Error("You can only pass a function to ko.memoization.memoize()");
            var memoId = generateRandomId();
            memos[memoId] = callback;
            return "<!--[ko_memo:" + memoId + "]-->";
        },

        unmemoize: function (memoId, callbackParams) {
            var callback = memos[memoId];
            if (callback === undefined)
                throw new Error("Couldn't find any memo with ID " + memoId + ". Perhaps it's already been unmemoized.");
            try {
                callback.apply(null, callbackParams || []);
                return true;
            }
            finally { delete memos[memoId]; }
        },

        unmemoizeDomNodeAndDescendants: function (domNode, extraCallbackParamsArray) {
            var memos = [];
            findMemoNodes(domNode, memos);
            for (var i = 0, j = memos.length; i < j; i++) {
                var node = memos[i].domNode;
                var combinedParams = [node];
                if (extraCallbackParamsArray)
                    ko.utils.arrayPushAll(combinedParams, extraCallbackParamsArray);
                ko.memoization.unmemoize(memos[i].memoId, combinedParams);
                node.nodeValue = ""; // Neuter this node so we don't try to unmemoize it again
                if (node.parentNode)
                    node.parentNode.removeChild(node); // If possible, erase it totally (not always possible - someone else might just hold a reference to it then call unmemoizeDomNodeAndDescendants again)
            }
        },

        parseMemoText: function (memoText) {
            var match = memoText.match(/^\[ko_memo\:(.*?)\]$/);
            return match ? match[1] : null;
        }
    };
})();

ko.exportSymbol('memoization', ko.memoization);
ko.exportSymbol('memoization.memoize', ko.memoization.memoize);
ko.exportSymbol('memoization.unmemoize', ko.memoization.unmemoize);
ko.exportSymbol('memoization.parseMemoText', ko.memoization.parseMemoText);
ko.exportSymbol('memoization.unmemoizeDomNodeAndDescendants', ko.memoization.unmemoizeDomNodeAndDescendants);
ko.extenders = {
    'throttle': function(target, timeout) {
        // Throttling means two things:

        // (1) For dependent observables, we throttle *evaluations* so that, no matter how fast its dependencies
        //     notify updates, the target doesn't re-evaluate (and hence doesn't notify) faster than a certain rate
        target['throttleEvaluation'] = timeout;

        // (2) For writable targets (observables, or writable dependent observables), we throttle *writes*
        //     so the target cannot change value synchronously or faster than a certain rate
        var writeTimeoutInstance = null;
        return ko.dependentObservable({
            'read': target,
            'write': function(value) {
                clearTimeout(writeTimeoutInstance);
                writeTimeoutInstance = setTimeout(function() {
                    target(value);
                }, timeout);
            }
        });
    },

    'notify': function(target, notifyWhen) {
        target["equalityComparer"] = notifyWhen == "always"
            ? function() { return false } // Treat all values as not equal
            : ko.observable["fn"]["equalityComparer"];
        return target;
    }
};

function applyExtenders(requestedExtenders) {
    var target = this;
    if (requestedExtenders) {
        ko.utils.objectForEach(requestedExtenders, function(key, value) {
            var extenderHandler = ko.extenders[key];
            if (typeof extenderHandler == 'function') {
                target = extenderHandler(target, value);
            }
        });
    }
    return target;
}

ko.exportSymbol('extenders', ko.extenders);

ko.subscription = function (target, callback, disposeCallback) {
    this.target = target;
    this.callback = callback;
    this.disposeCallback = disposeCallback;
    ko.exportProperty(this, 'dispose', this.dispose);
};
ko.subscription.prototype.dispose = function () {
    this.isDisposed = true;
    this.disposeCallback();
};

ko.subscribable = function () {
    this._subscriptions = {};

    ko.utils.extend(this, ko.subscribable['fn']);
    ko.exportProperty(this, 'subscribe', this.subscribe);
    ko.exportProperty(this, 'extend', this.extend);
    ko.exportProperty(this, 'getSubscriptionsCount', this.getSubscriptionsCount);
}

var defaultEvent = "change";

ko.subscribable['fn'] = {
    subscribe: function (callback, callbackTarget, event) {
        event = event || defaultEvent;
        var boundCallback = callbackTarget ? callback.bind(callbackTarget) : callback;

        var subscription = new ko.subscription(this, boundCallback, function () {
            ko.utils.arrayRemoveItem(this._subscriptions[event], subscription);
        }.bind(this));

        if (!this._subscriptions[event])
            this._subscriptions[event] = [];
        this._subscriptions[event].push(subscription);
        return subscription;
    },

    "notifySubscribers": function (valueToNotify, event) {
        event = event || defaultEvent;
        if (this._subscriptions[event]) {
            ko.dependencyDetection.ignore(function() {
                ko.utils.arrayForEach(this._subscriptions[event].slice(0), function (subscription) {
                    // In case a subscription was disposed during the arrayForEach cycle, check
                    // for isDisposed on each subscription before invoking its callback
                    if (subscription && (subscription.isDisposed !== true))
                        subscription.callback(valueToNotify);
                });
            }, this);
        }
    },

    getSubscriptionsCount: function () {
        var total = 0;
        ko.utils.objectForEach(this._subscriptions, function(eventName, subscriptions) {
            total += subscriptions.length;
        });
        return total;
    },

    extend: applyExtenders
};


ko.isSubscribable = function (instance) {
    return instance != null && typeof instance.subscribe == "function" && typeof instance["notifySubscribers"] == "function";
};

ko.exportSymbol('subscribable', ko.subscribable);
ko.exportSymbol('isSubscribable', ko.isSubscribable);

ko.dependencyDetection = (function () {
    var _frames = [];

    return {
        begin: function (callback) {
            _frames.push({ callback: callback, distinctDependencies:[] });
        },

        end: function () {
            _frames.pop();
        },

        registerDependency: function (subscribable) {
            if (!ko.isSubscribable(subscribable))
                throw new Error("Only subscribable things can act as dependencies");
            if (_frames.length > 0) {
                var topFrame = _frames[_frames.length - 1];
                if (!topFrame || ko.utils.arrayIndexOf(topFrame.distinctDependencies, subscribable) >= 0)
                    return;
                topFrame.distinctDependencies.push(subscribable);
                topFrame.callback(subscribable);
            }
        },

        ignore: function(callback, callbackTarget, callbackArgs) {
            try {
                _frames.push(null);
                return callback.apply(callbackTarget, callbackArgs || []);
            } finally {
                _frames.pop();
            }
        }
    };
})();
var primitiveTypes = { 'undefined':true, 'boolean':true, 'number':true, 'string':true };

ko.observable = function (initialValue) {
    var _latestValue = initialValue;

    function observable() {
        if (arguments.length > 0) {
            // Write

            // Ignore writes if the value hasn't changed
            if ((!observable['equalityComparer']) || !observable['equalityComparer'](_latestValue, arguments[0])) {
                observable.valueWillMutate();
                _latestValue = arguments[0];
                if (DEBUG) observable._latestValue = _latestValue;
                observable.valueHasMutated();
            }
            return this; // Permits chained assignments
        }
        else {
            // Read
            ko.dependencyDetection.registerDependency(observable); // The caller only needs to be notified of changes if they did a "read" operation
            return _latestValue;
        }
    }
    if (DEBUG) observable._latestValue = _latestValue;
    ko.subscribable.call(observable);
    observable.peek = function() { return _latestValue };
    observable.valueHasMutated = function () { observable["notifySubscribers"](_latestValue); }
    observable.valueWillMutate = function () { observable["notifySubscribers"](_latestValue, "beforeChange"); }
    ko.utils.extend(observable, ko.observable['fn']);

    ko.exportProperty(observable, 'peek', observable.peek);
    ko.exportProperty(observable, "valueHasMutated", observable.valueHasMutated);
    ko.exportProperty(observable, "valueWillMutate", observable.valueWillMutate);

    return observable;
}

ko.observable['fn'] = {
    "equalityComparer": function valuesArePrimitiveAndEqual(a, b) {
        var oldValueIsPrimitive = (a === null) || (typeof(a) in primitiveTypes);
        return oldValueIsPrimitive ? (a === b) : false;
    }
};

var protoProperty = ko.observable.protoProperty = "__ko_proto__";
ko.observable['fn'][protoProperty] = ko.observable;

ko.hasPrototype = function(instance, prototype) {
    if ((instance === null) || (instance === undefined) || (instance[protoProperty] === undefined)) return false;
    if (instance[protoProperty] === prototype) return true;
    return ko.hasPrototype(instance[protoProperty], prototype); // Walk the prototype chain
};

ko.isObservable = function (instance) {
    return ko.hasPrototype(instance, ko.observable);
}
ko.isWriteableObservable = function (instance) {
    // Observable
    if ((typeof instance == "function") && instance[protoProperty] === ko.observable)
        return true;
    // Writeable dependent observable
    if ((typeof instance == "function") && (instance[protoProperty] === ko.dependentObservable) && (instance.hasWriteFunction))
        return true;
    // Anything else
    return false;
}


ko.exportSymbol('observable', ko.observable);
ko.exportSymbol('isObservable', ko.isObservable);
ko.exportSymbol('isWriteableObservable', ko.isWriteableObservable);
ko.observableArray = function (initialValues) {
    initialValues = initialValues || [];

    if (typeof initialValues != 'object' || !('length' in initialValues))
        throw new Error("The argument passed when initializing an observable array must be an array, or null, or undefined.");

    var result = ko.observable(initialValues);
    ko.utils.extend(result, ko.observableArray['fn']);
    return result;
};

ko.observableArray['fn'] = {
    'remove': function (valueOrPredicate) {
        var underlyingArray = this.peek();
        var removedValues = [];
        var predicate = typeof valueOrPredicate == "function" ? valueOrPredicate : function (value) { return value === valueOrPredicate; };
        for (var i = 0; i < underlyingArray.length; i++) {
            var value = underlyingArray[i];
            if (predicate(value)) {
                if (removedValues.length === 0) {
                    this.valueWillMutate();
                }
                removedValues.push(value);
                underlyingArray.splice(i, 1);
                i--;
            }
        }
        if (removedValues.length) {
            this.valueHasMutated();
        }
        return removedValues;
    },

    'removeAll': function (arrayOfValues) {
        // If you passed zero args, we remove everything
        if (arrayOfValues === undefined) {
            var underlyingArray = this.peek();
            var allValues = underlyingArray.slice(0);
            this.valueWillMutate();
            underlyingArray.splice(0, underlyingArray.length);
            this.valueHasMutated();
            return allValues;
        }
        // If you passed an arg, we interpret it as an array of entries to remove
        if (!arrayOfValues)
            return [];
        return this['remove'](function (value) {
            return ko.utils.arrayIndexOf(arrayOfValues, value) >= 0;
        });
    },

    'destroy': function (valueOrPredicate) {
        var underlyingArray = this.peek();
        var predicate = typeof valueOrPredicate == "function" ? valueOrPredicate : function (value) { return value === valueOrPredicate; };
        this.valueWillMutate();
        for (var i = underlyingArray.length - 1; i >= 0; i--) {
            var value = underlyingArray[i];
            if (predicate(value))
                underlyingArray[i]["_destroy"] = true;
        }
        this.valueHasMutated();
    },

    'destroyAll': function (arrayOfValues) {
        // If you passed zero args, we destroy everything
        if (arrayOfValues === undefined)
            return this['destroy'](function() { return true });

        // If you passed an arg, we interpret it as an array of entries to destroy
        if (!arrayOfValues)
            return [];
        return this['destroy'](function (value) {
            return ko.utils.arrayIndexOf(arrayOfValues, value) >= 0;
        });
    },

    'indexOf': function (item) {
        var underlyingArray = this();
        return ko.utils.arrayIndexOf(underlyingArray, item);
    },

    'replace': function(oldItem, newItem) {
        var index = this['indexOf'](oldItem);
        if (index >= 0) {
            this.valueWillMutate();
            this.peek()[index] = newItem;
            this.valueHasMutated();
        }
    }
};

// Populate ko.observableArray.fn with read/write functions from native arrays
// Important: Do not add any additional functions here that may reasonably be used to *read* data from the array
// because we'll eval them without causing subscriptions, so ko.computed output could end up getting stale
ko.utils.arrayForEach(["pop", "push", "reverse", "shift", "sort", "splice", "unshift"], function (methodName) {
    ko.observableArray['fn'][methodName] = function () {
        // Use "peek" to avoid creating a subscription in any computed that we're executing in the context of
        // (for consistency with mutating regular observables)
        var underlyingArray = this.peek();
        this.valueWillMutate();
        var methodCallResult = underlyingArray[methodName].apply(underlyingArray, arguments);
        this.valueHasMutated();
        return methodCallResult;
    };
});

// Populate ko.observableArray.fn with read-only functions from native arrays
ko.utils.arrayForEach(["slice"], function (methodName) {
    ko.observableArray['fn'][methodName] = function () {
        var underlyingArray = this();
        return underlyingArray[methodName].apply(underlyingArray, arguments);
    };
});

ko.exportSymbol('observableArray', ko.observableArray);
ko.dependentObservable = function (evaluatorFunctionOrOptions, evaluatorFunctionTarget, options) {
    var _latestValue,
        _hasBeenEvaluated = false,
        _isBeingEvaluated = false,
        readFunction = evaluatorFunctionOrOptions;

    if (readFunction && typeof readFunction == "object") {
        // Single-parameter syntax - everything is on this "options" param
        options = readFunction;
        readFunction = options["read"];
    } else {
        // Multi-parameter syntax - construct the options according to the params passed
        options = options || {};
        if (!readFunction)
            readFunction = options["read"];
    }
    if (typeof readFunction != "function")
        throw new Error("Pass a function that returns the value of the ko.computed");

    function addSubscriptionToDependency(subscribable) {
        _subscriptionsToDependencies.push(subscribable.subscribe(evaluatePossiblyAsync));
    }

    function disposeAllSubscriptionsToDependencies() {
        ko.utils.arrayForEach(_subscriptionsToDependencies, function (subscription) {
            subscription.dispose();
        });
        _subscriptionsToDependencies = [];
    }

    function evaluatePossiblyAsync() {
        var throttleEvaluationTimeout = dependentObservable['throttleEvaluation'];
        if (throttleEvaluationTimeout && throttleEvaluationTimeout >= 0) {
            clearTimeout(evaluationTimeoutInstance);
            evaluationTimeoutInstance = setTimeout(evaluateImmediate, throttleEvaluationTimeout);
        } else
            evaluateImmediate();
    }

    function evaluateImmediate() {
        if (_isBeingEvaluated) {
            // If the evaluation of a ko.computed causes side effects, it's possible that it will trigger its own re-evaluation.
            // This is not desirable (it's hard for a developer to realise a chain of dependencies might cause this, and they almost
            // certainly didn't intend infinite re-evaluations). So, for predictability, we simply prevent ko.computeds from causing
            // their own re-evaluation. Further discussion at https://github.com/SteveSanderson/knockout/pull/387
            return;
        }

        // Don't dispose on first evaluation, because the "disposeWhen" callback might
        // e.g., dispose when the associated DOM element isn't in the doc, and it's not
        // going to be in the doc until *after* the first evaluation
        if (_hasBeenEvaluated && disposeWhen()) {
            dispose();
            return;
        }

        _isBeingEvaluated = true;
        try {
            // Initially, we assume that none of the subscriptions are still being used (i.e., all are candidates for disposal).
            // Then, during evaluation, we cross off any that are in fact still being used.
            var disposalCandidates = ko.utils.arrayMap(_subscriptionsToDependencies, function(item) {return item.target;});

            ko.dependencyDetection.begin(function(subscribable) {
                var inOld;
                if ((inOld = ko.utils.arrayIndexOf(disposalCandidates, subscribable)) >= 0)
                    disposalCandidates[inOld] = undefined; // Don't want to dispose this subscription, as it's still being used
                else
                    addSubscriptionToDependency(subscribable); // Brand new subscription - add it
            });

            var newValue = readFunction.call(evaluatorFunctionTarget);

            // For each subscription no longer being used, remove it from the active subscriptions list and dispose it
            for (var i = disposalCandidates.length - 1; i >= 0; i--) {
                if (disposalCandidates[i])
                    _subscriptionsToDependencies.splice(i, 1)[0].dispose();
            }
            _hasBeenEvaluated = true;

            dependentObservable["notifySubscribers"](_latestValue, "beforeChange");

            _latestValue = newValue;
            if (DEBUG) dependentObservable._latestValue = _latestValue;
            dependentObservable["notifySubscribers"](_latestValue);

        } finally {
            ko.dependencyDetection.end();
            _isBeingEvaluated = false;
        }

        if (!_subscriptionsToDependencies.length)
            dispose();
    }

    function dependentObservable() {
        if (arguments.length > 0) {
            if (typeof writeFunction === "function") {
                // Writing a value
                writeFunction.apply(evaluatorFunctionTarget, arguments);
            } else {
                throw new Error("Cannot write a value to a ko.computed unless you specify a 'write' option. If you wish to read the current value, don't pass any parameters.");
            }
            return this; // Permits chained assignments
        } else {
            // Reading the value
            if (!_hasBeenEvaluated)
                evaluateImmediate();
            ko.dependencyDetection.registerDependency(dependentObservable);
            return _latestValue;
        }
    }

    function peek() {
        if (!_hasBeenEvaluated)
            evaluateImmediate();
        return _latestValue;
    }

    function isActive() {
        return !_hasBeenEvaluated || _subscriptionsToDependencies.length > 0;
    }

    // By here, "options" is always non-null
    var writeFunction = options["write"],
        disposeWhenNodeIsRemoved = options["disposeWhenNodeIsRemoved"] || options.disposeWhenNodeIsRemoved || null,
        disposeWhen = options["disposeWhen"] || options.disposeWhen || function() { return false; },
        dispose = disposeAllSubscriptionsToDependencies,
        _subscriptionsToDependencies = [],
        evaluationTimeoutInstance = null;

    if (!evaluatorFunctionTarget)
        evaluatorFunctionTarget = options["owner"];

    dependentObservable.peek = peek;
    dependentObservable.getDependenciesCount = function () { return _subscriptionsToDependencies.length; };
    dependentObservable.hasWriteFunction = typeof options["write"] === "function";
    dependentObservable.dispose = function () { dispose(); };
    dependentObservable.isActive = isActive;

    ko.subscribable.call(dependentObservable);
    ko.utils.extend(dependentObservable, ko.dependentObservable['fn']);

    ko.exportProperty(dependentObservable, 'peek', dependentObservable.peek);
    ko.exportProperty(dependentObservable, 'dispose', dependentObservable.dispose);
    ko.exportProperty(dependentObservable, 'isActive', dependentObservable.isActive);
    ko.exportProperty(dependentObservable, 'getDependenciesCount', dependentObservable.getDependenciesCount);

    // Evaluate, unless deferEvaluation is true
    if (options['deferEvaluation'] !== true)
        evaluateImmediate();

    // Build "disposeWhenNodeIsRemoved" and "disposeWhenNodeIsRemovedCallback" option values.
    // But skip if isActive is false (there will never be any dependencies to dispose).
    // (Note: "disposeWhenNodeIsRemoved" option both proactively disposes as soon as the node is removed using ko.removeNode(),
    // plus adds a "disposeWhen" callback that, on each evaluation, disposes if the node was removed by some other means.)
    if (disposeWhenNodeIsRemoved && isActive()) {
        dispose = function() {
            ko.utils.domNodeDisposal.removeDisposeCallback(disposeWhenNodeIsRemoved, dispose);
            disposeAllSubscriptionsToDependencies();
        };
        ko.utils.domNodeDisposal.addDisposeCallback(disposeWhenNodeIsRemoved, dispose);
        var existingDisposeWhenFunction = disposeWhen;
        disposeWhen = function () {
            return !ko.utils.domNodeIsAttachedToDocument(disposeWhenNodeIsRemoved) || existingDisposeWhenFunction();
        }
    }

    return dependentObservable;
};

ko.isComputed = function(instance) {
    return ko.hasPrototype(instance, ko.dependentObservable);
};

var protoProp = ko.observable.protoProperty; // == "__ko_proto__"
ko.dependentObservable[protoProp] = ko.observable;

ko.dependentObservable['fn'] = {};
ko.dependentObservable['fn'][protoProp] = ko.dependentObservable;

ko.exportSymbol('dependentObservable', ko.dependentObservable);
ko.exportSymbol('computed', ko.dependentObservable); // Make "ko.computed" an alias for "ko.dependentObservable"
ko.exportSymbol('isComputed', ko.isComputed);

(function() {
    var maxNestedObservableDepth = 10; // Escape the (unlikely) pathalogical case where an observable's current value is itself (or similar reference cycle)

    ko.toJS = function(rootObject) {
        if (arguments.length == 0)
            throw new Error("When calling ko.toJS, pass the object you want to convert.");

        // We just unwrap everything at every level in the object graph
        return mapJsObjectGraph(rootObject, function(valueToMap) {
            // Loop because an observable's value might in turn be another observable wrapper
            for (var i = 0; ko.isObservable(valueToMap) && (i < maxNestedObservableDepth); i++)
                valueToMap = valueToMap();
            return valueToMap;
        });
    };

    ko.toJSON = function(rootObject, replacer, space) {     // replacer and space are optional
        var plainJavaScriptObject = ko.toJS(rootObject);
        return ko.utils.stringifyJson(plainJavaScriptObject, replacer, space);
    };

    function mapJsObjectGraph(rootObject, mapInputCallback, visitedObjects) {
        visitedObjects = visitedObjects || new objectLookup();

        rootObject = mapInputCallback(rootObject);
        var canHaveProperties = (typeof rootObject == "object") && (rootObject !== null) && (rootObject !== undefined) && (!(rootObject instanceof Date)) && (!(rootObject instanceof String)) && (!(rootObject instanceof Number)) && (!(rootObject instanceof Boolean));
        if (!canHaveProperties)
            return rootObject;

        var outputProperties = rootObject instanceof Array ? [] : {};
        visitedObjects.save(rootObject, outputProperties);

        visitPropertiesOrArrayEntries(rootObject, function(indexer) {
            var propertyValue = mapInputCallback(rootObject[indexer]);

            switch (typeof propertyValue) {
                case "boolean":
                case "number":
                case "string":
                case "function":
                    outputProperties[indexer] = propertyValue;
                    break;
                case "object":
                case "undefined":
                    var previouslyMappedValue = visitedObjects.get(propertyValue);
                    outputProperties[indexer] = (previouslyMappedValue !== undefined)
                        ? previouslyMappedValue
                        : mapJsObjectGraph(propertyValue, mapInputCallback, visitedObjects);
                    break;
            }
        });

        return outputProperties;
    }

    function visitPropertiesOrArrayEntries(rootObject, visitorCallback) {
        if (rootObject instanceof Array) {
            for (var i = 0; i < rootObject.length; i++)
                visitorCallback(i);

            // For arrays, also respect toJSON property for custom mappings (fixes #278)
            if (typeof rootObject['toJSON'] == 'function')
                visitorCallback('toJSON');
        } else {
            for (var propertyName in rootObject) {
                visitorCallback(propertyName);
            }
        }
    };

    function objectLookup() {
        this.keys = [];
        this.values = [];
    };

    objectLookup.prototype = {
        constructor: objectLookup,
        save: function(key, value) {
            var existingIndex = ko.utils.arrayIndexOf(this.keys, key);
            if (existingIndex >= 0)
                this.values[existingIndex] = value;
            else {
                this.keys.push(key);
                this.values.push(value);
            }
        },
        get: function(key) {
            var existingIndex = ko.utils.arrayIndexOf(this.keys, key);
            return (existingIndex >= 0) ? this.values[existingIndex] : undefined;
        }
    };
})();

ko.exportSymbol('toJS', ko.toJS);
ko.exportSymbol('toJSON', ko.toJSON);
(function () {
    var hasDomDataExpandoProperty = '__ko__hasDomDataOptionValue__';

    // Normally, SELECT elements and their OPTIONs can only take value of type 'string' (because the values
    // are stored on DOM attributes). ko.selectExtensions provides a way for SELECTs/OPTIONs to have values
    // that are arbitrary objects. This is very convenient when implementing things like cascading dropdowns.
    ko.selectExtensions = {
        readValue : function(element) {
            switch (ko.utils.tagNameLower(element)) {
                case 'option':
                    if (element[hasDomDataExpandoProperty] === true)
                        return ko.utils.domData.get(element, ko.bindingHandlers.options.optionValueDomDataKey);
                    return ko.utils.ieVersion <= 7
                        ? (element.getAttributeNode('value') && element.getAttributeNode('value').specified ? element.value : element.text)
                        : element.value;
                case 'select':
                    return element.selectedIndex >= 0 ? ko.selectExtensions.readValue(element.options[element.selectedIndex]) : undefined;
                default:
                    return element.value;
            }
        },

        writeValue: function(element, value) {
            switch (ko.utils.tagNameLower(element)) {
                case 'option':
                    switch(typeof value) {
                        case "string":
                            ko.utils.domData.set(element, ko.bindingHandlers.options.optionValueDomDataKey, undefined);
                            if (hasDomDataExpandoProperty in element) { // IE <= 8 throws errors if you delete non-existent properties from a DOM node
                                delete element[hasDomDataExpandoProperty];
                            }
                            element.value = value;
                            break;
                        default:
                            // Store arbitrary object using DomData
                            ko.utils.domData.set(element, ko.bindingHandlers.options.optionValueDomDataKey, value);
                            element[hasDomDataExpandoProperty] = true;

                            // Special treatment of numbers is just for backward compatibility. KO 1.2.1 wrote numerical values to element.value.
                            element.value = typeof value === "number" ? value : "";
                            break;
                    }
                    break;
                case 'select':
                    if (value === "")
                        value = undefined;
                    if (value === null || value === undefined)
                        element.selectedIndex = -1;
                    for (var i = element.options.length - 1; i >= 0; i--) {
                        if (ko.selectExtensions.readValue(element.options[i]) == value) {
                            element.selectedIndex = i;
                            break;
                        }
                    }
                    // for drop-down select, ensure first is selected
                    if (!(element.size > 1) && element.selectedIndex === -1) {
                        element.selectedIndex = 0;
                    }
                    break;
                default:
                    if ((value === null) || (value === undefined))
                        value = "";
                    element.value = value;
                    break;
            }
        }
    };
})();

ko.exportSymbol('selectExtensions', ko.selectExtensions);
ko.exportSymbol('selectExtensions.readValue', ko.selectExtensions.readValue);
ko.exportSymbol('selectExtensions.writeValue', ko.selectExtensions.writeValue);
ko.expressionRewriting = (function () {
    var restoreCapturedTokensRegex = /\@ko_token_(\d+)\@/g;
    var javaScriptReservedWords = ["true", "false", "null", "undefined"];

    // Matches something that can be assigned to--either an isolated identifier or something ending with a property accessor
    // This is designed to be simple and avoid false negatives, but could produce false positives (e.g., a+b.c).
    var javaScriptAssignmentTarget = /^(?:[$_a-z][$\w]*|(.+)(\.\s*[$_a-z][$\w]*|\[.+\]))$/i;

    function restoreTokens(string, tokens) {
        var prevValue = null;
        while (string != prevValue) { // Keep restoring tokens until it no longer makes a difference (they may be nested)
            prevValue = string;
            string = string.replace(restoreCapturedTokensRegex, function (match, tokenIndex) {
                return tokens[tokenIndex];
            });
        }
        return string;
    }

    function getWriteableValue(expression) {
        if (ko.utils.arrayIndexOf(javaScriptReservedWords, ko.utils.stringTrim(expression).toLowerCase()) >= 0)
            return false;
        var match = expression.match(javaScriptAssignmentTarget);
        return match === null ? false : match[1] ? ('Object(' + match[1] + ')' + match[2]) : expression;
    }

    function ensureQuoted(key) {
        var trimmedKey = ko.utils.stringTrim(key);
        switch (trimmedKey.length && trimmedKey.charAt(0)) {
            case "'":
            case '"':
                return key;
            default:
                return "'" + trimmedKey + "'";
        }
    }

    return {
        bindingRewriteValidators: [],

        parseObjectLiteral: function(objectLiteralString) {
            // A full tokeniser+lexer would add too much weight to this library, so here's a simple parser
            // that is sufficient just to split an object literal string into a set of top-level key-value pairs

            var str = ko.utils.stringTrim(objectLiteralString);
            if (str.length < 3)
                return [];
            if (str.charAt(0) === "{")// Ignore any braces surrounding the whole object literal
                str = str.substring(1, str.length - 1);

            // Pull out any string literals and regex literals
            var tokens = [];
            var tokenStart = null, tokenEndChar;
            for (var position = 0; position < str.length; position++) {
                var c = str.charAt(position);
                if (tokenStart === null) {
                    switch (c) {
                        case '"':
                        case "'":
                        case "/":
                            tokenStart = position;
                            tokenEndChar = c;
                            break;
                    }
                } else if ((c == tokenEndChar) && (str.charAt(position - 1) !== "\\")) {
                    var token = str.substring(tokenStart, position + 1);
                    tokens.push(token);
                    var replacement = "@ko_token_" + (tokens.length - 1) + "@";
                    str = str.substring(0, tokenStart) + replacement + str.substring(position + 1);
                    position -= (token.length - replacement.length);
                    tokenStart = null;
                }
            }

            // Next pull out balanced paren, brace, and bracket blocks
            tokenStart = null;
            tokenEndChar = null;
            var tokenDepth = 0, tokenStartChar = null;
            for (var position = 0; position < str.length; position++) {
                var c = str.charAt(position);
                if (tokenStart === null) {
                    switch (c) {
                        case "{": tokenStart = position; tokenStartChar = c;
                                  tokenEndChar = "}";
                                  break;
                        case "(": tokenStart = position; tokenStartChar = c;
                                  tokenEndChar = ")";
                                  break;
                        case "[": tokenStart = position; tokenStartChar = c;
                                  tokenEndChar = "]";
                                  break;
                    }
                }

                if (c === tokenStartChar)
                    tokenDepth++;
                else if (c === tokenEndChar) {
                    tokenDepth--;
                    if (tokenDepth === 0) {
                        var token = str.substring(tokenStart, position + 1);
                        tokens.push(token);
                        var replacement = "@ko_token_" + (tokens.length - 1) + "@";
                        str = str.substring(0, tokenStart) + replacement + str.substring(position + 1);
                        position -= (token.length - replacement.length);
                        tokenStart = null;
                    }
                }
            }

            // Now we can safely split on commas to get the key/value pairs
            var result = [];
            var keyValuePairs = str.split(",");
            for (var i = 0, j = keyValuePairs.length; i < j; i++) {
                var pair = keyValuePairs[i];
                var colonPos = pair.indexOf(":");
                if ((colonPos > 0) && (colonPos < pair.length - 1)) {
                    var key = pair.substring(0, colonPos);
                    var value = pair.substring(colonPos + 1);
                    result.push({ 'key': restoreTokens(key, tokens), 'value': restoreTokens(value, tokens) });
                } else {
                    result.push({ 'unknown': restoreTokens(pair, tokens) });
                }
            }
            return result;
        },

        preProcessBindings: function (objectLiteralStringOrKeyValueArray) {
            var keyValueArray = typeof objectLiteralStringOrKeyValueArray === "string"
                ? ko.expressionRewriting.parseObjectLiteral(objectLiteralStringOrKeyValueArray)
                : objectLiteralStringOrKeyValueArray;
            var resultStrings = [], propertyAccessorResultStrings = [];

            var keyValueEntry;
            for (var i = 0; keyValueEntry = keyValueArray[i]; i++) {
                if (resultStrings.length > 0)
                    resultStrings.push(",");

                if (keyValueEntry['key']) {
                    var quotedKey = ensureQuoted(keyValueEntry['key']), val = keyValueEntry['value'];
                    resultStrings.push(quotedKey);
                    resultStrings.push(":");
                    resultStrings.push(val);

                    if (val = getWriteableValue(ko.utils.stringTrim(val))) {
                        if (propertyAccessorResultStrings.length > 0)
                            propertyAccessorResultStrings.push(", ");
                        propertyAccessorResultStrings.push(quotedKey + " : function(__ko_value) { " + val + " = __ko_value; }");
                    }
                } else if (keyValueEntry['unknown']) {
                    resultStrings.push(keyValueEntry['unknown']);
                }
            }

            var combinedResult = resultStrings.join("");
            if (propertyAccessorResultStrings.length > 0) {
                var allPropertyAccessors = propertyAccessorResultStrings.join("");
                combinedResult = combinedResult + ", '_ko_property_writers' : { " + allPropertyAccessors + " } ";
            }

            return combinedResult;
        },

        keyValueArrayContainsKey: function(keyValueArray, key) {
            for (var i = 0; i < keyValueArray.length; i++)
                if (ko.utils.stringTrim(keyValueArray[i]['key']) == key)
                    return true;
            return false;
        },

        // Internal, private KO utility for updating model properties from within bindings
        // property:            If the property being updated is (or might be) an observable, pass it here
        //                      If it turns out to be a writable observable, it will be written to directly
        // allBindingsAccessor: All bindings in the current execution context.
        //                      This will be searched for a '_ko_property_writers' property in case you're writing to a non-observable
        // key:                 The key identifying the property to be written. Example: for { hasFocus: myValue }, write to 'myValue' by specifying the key 'hasFocus'
        // value:               The value to be written
        // checkIfDifferent:    If true, and if the property being written is a writable observable, the value will only be written if
        //                      it is !== existing value on that writable observable
        writeValueToProperty: function(property, allBindingsAccessor, key, value, checkIfDifferent) {
            if (!property || !ko.isObservable(property)) {
                var propWriters = allBindingsAccessor()['_ko_property_writers'];
                if (propWriters && propWriters[key])
                    propWriters[key](value);
            } else if (ko.isWriteableObservable(property) && (!checkIfDifferent || property.peek() !== value)) {
                property(value);
            }
        }
    };
})();

ko.exportSymbol('expressionRewriting', ko.expressionRewriting);
ko.exportSymbol('expressionRewriting.bindingRewriteValidators', ko.expressionRewriting.bindingRewriteValidators);
ko.exportSymbol('expressionRewriting.parseObjectLiteral', ko.expressionRewriting.parseObjectLiteral);
ko.exportSymbol('expressionRewriting.preProcessBindings', ko.expressionRewriting.preProcessBindings);

// For backward compatibility, define the following aliases. (Previously, these function names were misleading because
// they referred to JSON specifically, even though they actually work with arbitrary JavaScript object literal expressions.)
ko.exportSymbol('jsonExpressionRewriting', ko.expressionRewriting);
ko.exportSymbol('jsonExpressionRewriting.insertPropertyAccessorsIntoJson', ko.expressionRewriting.preProcessBindings);(function() {
    // "Virtual elements" is an abstraction on top of the usual DOM API which understands the notion that comment nodes
    // may be used to represent hierarchy (in addition to the DOM's natural hierarchy).
    // If you call the DOM-manipulating functions on ko.virtualElements, you will be able to read and write the state
    // of that virtual hierarchy
    //
    // The point of all this is to support containerless templates (e.g., <!-- ko foreach:someCollection -->blah<!-- /ko -->)
    // without having to scatter special cases all over the binding and templating code.

    // IE 9 cannot reliably read the "nodeValue" property of a comment node (see https://github.com/SteveSanderson/knockout/issues/186)
    // but it does give them a nonstandard alternative property called "text" that it can read reliably. Other browsers don't have that property.
    // So, use node.text where available, and node.nodeValue elsewhere
    var commentNodesHaveTextProperty = document && document.createComment("test").text === "<!--test-->";

    var startCommentRegex = commentNodesHaveTextProperty ? /^<!--\s*ko(?:\s+(.+\s*\:[\s\S]*))?\s*-->$/ : /^\s*ko(?:\s+(.+\s*\:[\s\S]*))?\s*$/;
    var endCommentRegex =   commentNodesHaveTextProperty ? /^<!--\s*\/ko\s*-->$/ : /^\s*\/ko\s*$/;
    var htmlTagsWithOptionallyClosingChildren = { 'ul': true, 'ol': true };

    function isStartComment(node) {
        return (node.nodeType == 8) && (commentNodesHaveTextProperty ? node.text : node.nodeValue).match(startCommentRegex);
    }

    function isEndComment(node) {
        return (node.nodeType == 8) && (commentNodesHaveTextProperty ? node.text : node.nodeValue).match(endCommentRegex);
    }

    function getVirtualChildren(startComment, allowUnbalanced) {
        var currentNode = startComment;
        var depth = 1;
        var children = [];
        while (currentNode = currentNode.nextSibling) {
            if (isEndComment(currentNode)) {
                depth--;
                if (depth === 0)
                    return children;
            }

            children.push(currentNode);

            if (isStartComment(currentNode))
                depth++;
        }
        if (!allowUnbalanced)
            throw new Error("Cannot find closing comment tag to match: " + startComment.nodeValue);
        return null;
    }

    function getMatchingEndComment(startComment, allowUnbalanced) {
        var allVirtualChildren = getVirtualChildren(startComment, allowUnbalanced);
        if (allVirtualChildren) {
            if (allVirtualChildren.length > 0)
                return allVirtualChildren[allVirtualChildren.length - 1].nextSibling;
            return startComment.nextSibling;
        } else
            return null; // Must have no matching end comment, and allowUnbalanced is true
    }

    function getUnbalancedChildTags(node) {
        // e.g., from <div>OK</div><!-- ko blah --><span>Another</span>, returns: <!-- ko blah --><span>Another</span>
        //       from <div>OK</div><!-- /ko --><!-- /ko -->,             returns: <!-- /ko --><!-- /ko -->
        var childNode = node.firstChild, captureRemaining = null;
        if (childNode) {
            do {
                if (captureRemaining)                   // We already hit an unbalanced node and are now just scooping up all subsequent nodes
                    captureRemaining.push(childNode);
                else if (isStartComment(childNode)) {
                    var matchingEndComment = getMatchingEndComment(childNode, /* allowUnbalanced: */ true);
                    if (matchingEndComment)             // It's a balanced tag, so skip immediately to the end of this virtual set
                        childNode = matchingEndComment;
                    else
                        captureRemaining = [childNode]; // It's unbalanced, so start capturing from this point
                } else if (isEndComment(childNode)) {
                    captureRemaining = [childNode];     // It's unbalanced (if it wasn't, we'd have skipped over it already), so start capturing
                }
            } while (childNode = childNode.nextSibling);
        }
        return captureRemaining;
    }

    ko.virtualElements = {
        allowedBindings: {},

        childNodes: function(node) {
            return isStartComment(node) ? getVirtualChildren(node) : node.childNodes;
        },

        emptyNode: function(node) {
            if (!isStartComment(node))
                ko.utils.emptyDomNode(node);
            else {
                var virtualChildren = ko.virtualElements.childNodes(node);
                for (var i = 0, j = virtualChildren.length; i < j; i++)
                    ko.removeNode(virtualChildren[i]);
            }
        },

        setDomNodeChildren: function(node, childNodes) {
            if (!isStartComment(node))
                ko.utils.setDomNodeChildren(node, childNodes);
            else {
                ko.virtualElements.emptyNode(node);
                var endCommentNode = node.nextSibling; // Must be the next sibling, as we just emptied the children
                for (var i = 0, j = childNodes.length; i < j; i++)
                    endCommentNode.parentNode.insertBefore(childNodes[i], endCommentNode);
            }
        },

        prepend: function(containerNode, nodeToPrepend) {
            if (!isStartComment(containerNode)) {
                if (containerNode.firstChild)
                    containerNode.insertBefore(nodeToPrepend, containerNode.firstChild);
                else
                    containerNode.appendChild(nodeToPrepend);
            } else {
                // Start comments must always have a parent and at least one following sibling (the end comment)
                containerNode.parentNode.insertBefore(nodeToPrepend, containerNode.nextSibling);
            }
        },

        insertAfter: function(containerNode, nodeToInsert, insertAfterNode) {
            if (!insertAfterNode) {
                ko.virtualElements.prepend(containerNode, nodeToInsert);
            } else if (!isStartComment(containerNode)) {
                // Insert after insertion point
                if (insertAfterNode.nextSibling)
                    containerNode.insertBefore(nodeToInsert, insertAfterNode.nextSibling);
                else
                    containerNode.appendChild(nodeToInsert);
            } else {
                // Children of start comments must always have a parent and at least one following sibling (the end comment)
                containerNode.parentNode.insertBefore(nodeToInsert, insertAfterNode.nextSibling);
            }
        },

        firstChild: function(node) {
            if (!isStartComment(node))
                return node.firstChild;
            if (!node.nextSibling || isEndComment(node.nextSibling))
                return null;
            return node.nextSibling;
        },

        nextSibling: function(node) {
            if (isStartComment(node))
                node = getMatchingEndComment(node);
            if (node.nextSibling && isEndComment(node.nextSibling))
                return null;
            return node.nextSibling;
        },

        virtualNodeBindingValue: function(node) {
            var regexMatch = isStartComment(node);
            return regexMatch ? regexMatch[1] : null;
        },

        normaliseVirtualElementDomStructure: function(elementVerified) {
            // Workaround for https://github.com/SteveSanderson/knockout/issues/155
            // (IE <= 8 or IE 9 quirks mode parses your HTML weirdly, treating closing </li> tags as if they don't exist, thereby moving comment nodes
            // that are direct descendants of <ul> into the preceding <li>)
            if (!htmlTagsWithOptionallyClosingChildren[ko.utils.tagNameLower(elementVerified)])
                return;

            // Scan immediate children to see if they contain unbalanced comment tags. If they do, those comment tags
            // must be intended to appear *after* that child, so move them there.
            var childNode = elementVerified.firstChild;
            if (childNode) {
                do {
                    if (childNode.nodeType === 1) {
                        var unbalancedTags = getUnbalancedChildTags(childNode);
                        if (unbalancedTags) {
                            // Fix up the DOM by moving the unbalanced tags to where they most likely were intended to be placed - *after* the child
                            var nodeToInsertBefore = childNode.nextSibling;
                            for (var i = 0; i < unbalancedTags.length; i++) {
                                if (nodeToInsertBefore)
                                    elementVerified.insertBefore(unbalancedTags[i], nodeToInsertBefore);
                                else
                                    elementVerified.appendChild(unbalancedTags[i]);
                            }
                        }
                    }
                } while (childNode = childNode.nextSibling);
            }
        }
    };
})();
ko.exportSymbol('virtualElements', ko.virtualElements);
ko.exportSymbol('virtualElements.allowedBindings', ko.virtualElements.allowedBindings);
ko.exportSymbol('virtualElements.emptyNode', ko.virtualElements.emptyNode);
//ko.exportSymbol('virtualElements.firstChild', ko.virtualElements.firstChild);     // firstChild is not minified
ko.exportSymbol('virtualElements.insertAfter', ko.virtualElements.insertAfter);
//ko.exportSymbol('virtualElements.nextSibling', ko.virtualElements.nextSibling);   // nextSibling is not minified
ko.exportSymbol('virtualElements.prepend', ko.virtualElements.prepend);
ko.exportSymbol('virtualElements.setDomNodeChildren', ko.virtualElements.setDomNodeChildren);
(function() {
    var defaultBindingAttributeName = "data-bind";

    ko.bindingProvider = function() {
        this.bindingCache = {};
    };

    ko.utils.extend(ko.bindingProvider.prototype, {
        'nodeHasBindings': function(node) {
            switch (node.nodeType) {
                case 1: return node.getAttribute(defaultBindingAttributeName) != null;   // Element
                case 8: return ko.virtualElements.virtualNodeBindingValue(node) != null; // Comment node
                default: return false;
            }
        },

        'getBindings': function(node, bindingContext) {
            var bindingsString = this['getBindingsString'](node, bindingContext);
            return bindingsString ? this['parseBindingsString'](bindingsString, bindingContext, node) : null;
        },

        // The following function is only used internally by this default provider.
        // It's not part of the interface definition for a general binding provider.
        'getBindingsString': function(node, bindingContext) {
            switch (node.nodeType) {
                case 1: return node.getAttribute(defaultBindingAttributeName);   // Element
                case 8: return ko.virtualElements.virtualNodeBindingValue(node); // Comment node
                default: return null;
            }
        },

        // The following function is only used internally by this default provider.
        // It's not part of the interface definition for a general binding provider.
        'parseBindingsString': function(bindingsString, bindingContext, node) {
            try {
                var bindingFunction = createBindingsStringEvaluatorViaCache(bindingsString, this.bindingCache);
                return bindingFunction(bindingContext, node);
            } catch (ex) {
                ex.message = "Unable to parse bindings.\nBindings value: " + bindingsString + "\nMessage: " + ex.message;
                throw ex;
            }
        }
    });

    ko.bindingProvider['instance'] = new ko.bindingProvider();

    function createBindingsStringEvaluatorViaCache(bindingsString, cache) {
        var cacheKey = bindingsString;
        return cache[cacheKey]
            || (cache[cacheKey] = createBindingsStringEvaluator(bindingsString));
    }

    function createBindingsStringEvaluator(bindingsString) {
        // Build the source for a function that evaluates "expression"
        // For each scope variable, add an extra level of "with" nesting
        // Example result: with(sc1) { with(sc0) { return (expression) } }
        var rewrittenBindings = ko.expressionRewriting.preProcessBindings(bindingsString),
            functionBody = "with($context){with($data||{}){return{" + rewrittenBindings + "}}}";
        return new Function("$context", "$element", functionBody);
    }
})();

ko.exportSymbol('bindingProvider', ko.bindingProvider);
(function () {
    ko.bindingHandlers = {};

    ko.bindingContext = function(dataItem, parentBindingContext, dataItemAlias) {
        if (parentBindingContext) {
            ko.utils.extend(this, parentBindingContext); // Inherit $root and any custom properties
            this['$parentContext'] = parentBindingContext;
            this['$parent'] = parentBindingContext['$data'];
            this['$parents'] = (parentBindingContext['$parents'] || []).slice(0);
            this['$parents'].unshift(this['$parent']);
        } else {
            this['$parents'] = [];
            this['$root'] = dataItem;
            // Export 'ko' in the binding context so it will be available in bindings and templates
            // even if 'ko' isn't exported as a global, such as when using an AMD loader.
            // See https://github.com/SteveSanderson/knockout/issues/490
            this['ko'] = ko;
        }
        this['$data'] = dataItem;
        if (dataItemAlias)
            this[dataItemAlias] = dataItem;
    }
    ko.bindingContext.prototype['createChildContext'] = function (dataItem, dataItemAlias) {
        return new ko.bindingContext(dataItem, this, dataItemAlias);
    };
    ko.bindingContext.prototype['extend'] = function(properties) {
        var clone = ko.utils.extend(new ko.bindingContext(), this);
        return ko.utils.extend(clone, properties);
    };

    function validateThatBindingIsAllowedForVirtualElements(bindingName) {
        var validator = ko.virtualElements.allowedBindings[bindingName];
        if (!validator)
            throw new Error("The binding '" + bindingName + "' cannot be used with virtual elements")
    }

    function applyBindingsToDescendantsInternal (viewModel, elementOrVirtualElement, bindingContextsMayDifferFromDomParentElement) {
        var currentChild, nextInQueue = ko.virtualElements.firstChild(elementOrVirtualElement);
        while (currentChild = nextInQueue) {
            // Keep a record of the next child *before* applying bindings, in case the binding removes the current child from its position
            nextInQueue = ko.virtualElements.nextSibling(currentChild);
            applyBindingsToNodeAndDescendantsInternal(viewModel, currentChild, bindingContextsMayDifferFromDomParentElement);
        }
    }

    function applyBindingsToNodeAndDescendantsInternal (viewModel, nodeVerified, bindingContextMayDifferFromDomParentElement) {
        var shouldBindDescendants = true;

        // Perf optimisation: Apply bindings only if...
        // (1) We need to store the binding context on this node (because it may differ from the DOM parent node's binding context)
        //     Note that we can't store binding contexts on non-elements (e.g., text nodes), as IE doesn't allow expando properties for those
        // (2) It might have bindings (e.g., it has a data-bind attribute, or it's a marker for a containerless template)
        var isElement = (nodeVerified.nodeType === 1);
        if (isElement) // Workaround IE <= 8 HTML parsing weirdness
            ko.virtualElements.normaliseVirtualElementDomStructure(nodeVerified);

        var shouldApplyBindings = (isElement && bindingContextMayDifferFromDomParentElement)             // Case (1)
                               || ko.bindingProvider['instance']['nodeHasBindings'](nodeVerified);       // Case (2)
        if (shouldApplyBindings)
            shouldBindDescendants = applyBindingsToNodeInternal(nodeVerified, null, viewModel, bindingContextMayDifferFromDomParentElement).shouldBindDescendants;

        if (shouldBindDescendants) {
            // We're recursing automatically into (real or virtual) child nodes without changing binding contexts. So,
            //  * For children of a *real* element, the binding context is certainly the same as on their DOM .parentNode,
            //    hence bindingContextsMayDifferFromDomParentElement is false
            //  * For children of a *virtual* element, we can't be sure. Evaluating .parentNode on those children may
            //    skip over any number of intermediate virtual elements, any of which might define a custom binding context,
            //    hence bindingContextsMayDifferFromDomParentElement is true
            applyBindingsToDescendantsInternal(viewModel, nodeVerified, /* bindingContextsMayDifferFromDomParentElement: */ !isElement);
        }
    }

    var boundElementDomDataKey = '__ko_boundElement';
    function applyBindingsToNodeInternal (node, bindings, viewModelOrBindingContext, bindingContextMayDifferFromDomParentElement) {
        // Need to be sure that inits are only run once, and updates never run until all the inits have been run
        var initPhase = 0; // 0 = before all inits, 1 = during inits, 2 = after all inits

        // Each time the dependentObservable is evaluated (after data changes),
        // the binding attribute is reparsed so that it can pick out the correct
        // model properties in the context of the changed data.
        // DOM event callbacks need to be able to access this changed data,
        // so we need a single parsedBindings variable (shared by all callbacks
        // associated with this node's bindings) that all the closures can access.
        var parsedBindings;
        function makeValueAccessor(bindingKey) {
            return function () { return parsedBindings[bindingKey] }
        }
        function parsedBindingsAccessor() {
            return parsedBindings;
        }

        var bindingHandlerThatControlsDescendantBindings;

        // Prevent multiple applyBindings calls for the same node, except when a binding value is specified
        var alreadyBound = ko.utils.domData.get(node, boundElementDomDataKey);
        if (!bindings) {
            if (alreadyBound) {
                throw Error("You cannot apply bindings multiple times to the same element.");
            }
            ko.utils.domData.set(node, boundElementDomDataKey, true);
        }

        ko.dependentObservable(
            function () {
                // Ensure we have a nonnull binding context to work with
                var bindingContextInstance = viewModelOrBindingContext && (viewModelOrBindingContext instanceof ko.bindingContext)
                    ? viewModelOrBindingContext
                    : new ko.bindingContext(ko.utils.unwrapObservable(viewModelOrBindingContext));
                var viewModel = bindingContextInstance['$data'];

                // Optimization: Don't store the binding context on this node if it's definitely the same as on node.parentNode, because
                // we can easily recover it just by scanning up the node's ancestors in the DOM
                // (note: here, parent node means "real DOM parent" not "virtual parent", as there's no O(1) way to find the virtual parent)
                if (!alreadyBound && bindingContextMayDifferFromDomParentElement)
                    ko.storedBindingContextForNode(node, bindingContextInstance);

                // Use evaluatedBindings if given, otherwise fall back on asking the bindings provider to give us some bindings
                var evaluatedBindings = (typeof bindings == "function") ? bindings(bindingContextInstance, node) : bindings;
                parsedBindings = evaluatedBindings || ko.bindingProvider['instance']['getBindings'](node, bindingContextInstance);

                if (parsedBindings) {
                    // First run all the inits, so bindings can register for notification on changes
                    if (initPhase === 0) {
                        initPhase = 1;
                        ko.utils.objectForEach(parsedBindings, function(bindingKey) {
                            var binding = ko.bindingHandlers[bindingKey];
                            if (binding && node.nodeType === 8)
                                validateThatBindingIsAllowedForVirtualElements(bindingKey);

                            if (binding && typeof binding["init"] == "function") {
                                var handlerInitFn = binding["init"];
                                var initResult = handlerInitFn(node, makeValueAccessor(bindingKey), parsedBindingsAccessor, viewModel, bindingContextInstance);

                                // If this binding handler claims to control descendant bindings, make a note of this
                                if (initResult && initResult['controlsDescendantBindings']) {
                                    if (bindingHandlerThatControlsDescendantBindings !== undefined)
                                        throw new Error("Multiple bindings (" + bindingHandlerThatControlsDescendantBindings + " and " + bindingKey + ") are trying to control descendant bindings of the same element. You cannot use these bindings together on the same element.");
                                    bindingHandlerThatControlsDescendantBindings = bindingKey;
                                }
                            }
                        });
                        initPhase = 2;
                    }

                    // ... then run all the updates, which might trigger changes even on the first evaluation
                    if (initPhase === 2) {
                        ko.utils.objectForEach(parsedBindings, function(bindingKey) {
                            var binding = ko.bindingHandlers[bindingKey];
                            if (binding && typeof binding["update"] == "function") {
                                var handlerUpdateFn = binding["update"];
                                handlerUpdateFn(node, makeValueAccessor(bindingKey), parsedBindingsAccessor, viewModel, bindingContextInstance);
                            }
                        });
                    }
                }
            },
            null,
            { disposeWhenNodeIsRemoved : node }
        );

        return {
            shouldBindDescendants: bindingHandlerThatControlsDescendantBindings === undefined
        };
    };

    var storedBindingContextDomDataKey = "__ko_bindingContext__";
    ko.storedBindingContextForNode = function (node, bindingContext) {
        if (arguments.length == 2)
            ko.utils.domData.set(node, storedBindingContextDomDataKey, bindingContext);
        else
            return ko.utils.domData.get(node, storedBindingContextDomDataKey);
    }

    ko.applyBindingsToNode = function (node, bindings, viewModel) {
        if (node.nodeType === 1) // If it's an element, workaround IE <= 8 HTML parsing weirdness
            ko.virtualElements.normaliseVirtualElementDomStructure(node);
        return applyBindingsToNodeInternal(node, bindings, viewModel, true);
    };

    ko.applyBindingsToDescendants = function(viewModel, rootNode) {
        if (rootNode.nodeType === 1 || rootNode.nodeType === 8)
            applyBindingsToDescendantsInternal(viewModel, rootNode, true);
    };

    ko.applyBindings = function (viewModel, rootNode) {
        if (rootNode && (rootNode.nodeType !== 1) && (rootNode.nodeType !== 8))
            throw new Error("ko.applyBindings: first parameter should be your view model; second parameter should be a DOM node");
        rootNode = rootNode || window.document.body; // Make "rootNode" parameter optional

        applyBindingsToNodeAndDescendantsInternal(viewModel, rootNode, true);
    };

    // Retrieving binding context from arbitrary nodes
    ko.contextFor = function(node) {
        // We can only do something meaningful for elements and comment nodes (in particular, not text nodes, as IE can't store domdata for them)
        switch (node.nodeType) {
            case 1:
            case 8:
                var context = ko.storedBindingContextForNode(node);
                if (context) return context;
                if (node.parentNode) return ko.contextFor(node.parentNode);
                break;
        }
        return undefined;
    };
    ko.dataFor = function(node) {
        var context = ko.contextFor(node);
        return context ? context['$data'] : undefined;
    };

    ko.exportSymbol('bindingHandlers', ko.bindingHandlers);
    ko.exportSymbol('applyBindings', ko.applyBindings);
    ko.exportSymbol('applyBindingsToDescendants', ko.applyBindingsToDescendants);
    ko.exportSymbol('applyBindingsToNode', ko.applyBindingsToNode);
    ko.exportSymbol('contextFor', ko.contextFor);
    ko.exportSymbol('dataFor', ko.dataFor);
})();
var attrHtmlToJavascriptMap = { 'class': 'className', 'for': 'htmlFor' };
ko.bindingHandlers['attr'] = {
    'update': function(element, valueAccessor, allBindingsAccessor) {
        var value = ko.utils.unwrapObservable(valueAccessor()) || {};
        ko.utils.objectForEach(value, function(attrName, attrValue) {
            attrValue = ko.utils.unwrapObservable(attrValue);

            // To cover cases like "attr: { checked:someProp }", we want to remove the attribute entirely
            // when someProp is a "no value"-like value (strictly null, false, or undefined)
            // (because the absence of the "checked" attr is how to mark an element as not checked, etc.)
            var toRemove = (attrValue === false) || (attrValue === null) || (attrValue === undefined);
            if (toRemove)
                element.removeAttribute(attrName);

            // In IE <= 7 and IE8 Quirks Mode, you have to use the Javascript property name instead of the
            // HTML attribute name for certain attributes. IE8 Standards Mode supports the correct behavior,
            // but instead of figuring out the mode, we'll just set the attribute through the Javascript
            // property for IE <= 8.
            if (ko.utils.ieVersion <= 8 && attrName in attrHtmlToJavascriptMap) {
                attrName = attrHtmlToJavascriptMap[attrName];
                if (toRemove)
                    element.removeAttribute(attrName);
                else
                    element[attrName] = attrValue;
            } else if (!toRemove) {
                element.setAttribute(attrName, attrValue.toString());
            }

            // Treat "name" specially - although you can think of it as an attribute, it also needs
            // special handling on older versions of IE (https://github.com/SteveSanderson/knockout/pull/333)
            // Deliberately being case-sensitive here because XHTML would regard "Name" as a different thing
            // entirely, and there's no strong reason to allow for such casing in HTML.
            if (attrName === "name") {
                ko.utils.setElementName(element, toRemove ? "" : attrValue.toString());
            }
        });
    }
};
ko.bindingHandlers['checked'] = {
    'init': function (element, valueAccessor, allBindingsAccessor) {
        var updateHandler = function() {
            var valueToWrite;
            if (element.type == "checkbox") {
                valueToWrite = element.checked;
            } else if ((element.type == "radio") && (element.checked)) {
                valueToWrite = element.value;
            } else {
                return; // "checked" binding only responds to checkboxes and selected radio buttons
            }

            var modelValue = valueAccessor(), unwrappedValue = ko.utils.unwrapObservable(modelValue);
            if ((element.type == "checkbox") && (unwrappedValue instanceof Array)) {
                // For checkboxes bound to an array, we add/remove the checkbox value to that array
                // This works for both observable and non-observable arrays
                ko.utils.addOrRemoveItem(modelValue, element.value, element.checked);
            } else {
                ko.expressionRewriting.writeValueToProperty(modelValue, allBindingsAccessor, 'checked', valueToWrite, true);
            }
        };
        ko.utils.registerEventHandler(element, "click", updateHandler);

        // IE 6 won't allow radio buttons to be selected unless they have a name
        if ((element.type == "radio") && !element.name)
            ko.bindingHandlers['uniqueName']['init'](element, function() { return true });
    },
    'update': function (element, valueAccessor) {
        var value = ko.utils.unwrapObservable(valueAccessor());

        if (element.type == "checkbox") {
            if (value instanceof Array) {
                // When bound to an array, the checkbox being checked represents its value being present in that array
                element.checked = ko.utils.arrayIndexOf(value, element.value) >= 0;
            } else {
                // When bound to any other value (not an array), the checkbox being checked represents the value being trueish
                element.checked = value;
            }
        } else if (element.type == "radio") {
            element.checked = (element.value == value);
        }
    }
};
var classesWrittenByBindingKey = '__ko__cssValue';
ko.bindingHandlers['css'] = {
    'update': function (element, valueAccessor) {
        var value = ko.utils.unwrapObservable(valueAccessor());
        if (typeof value == "object") {
            ko.utils.objectForEach(value, function(className, shouldHaveClass) {
                shouldHaveClass = ko.utils.unwrapObservable(shouldHaveClass);
                ko.utils.toggleDomNodeCssClass(element, className, shouldHaveClass);
            });
        } else {
            value = String(value || ''); // Make sure we don't try to store or set a non-string value
            ko.utils.toggleDomNodeCssClass(element, element[classesWrittenByBindingKey], false);
            element[classesWrittenByBindingKey] = value;
            ko.utils.toggleDomNodeCssClass(element, value, true);
        }
    }
};
ko.bindingHandlers['enable'] = {
    'update': function (element, valueAccessor) {
        var value = ko.utils.unwrapObservable(valueAccessor());
        if (value && element.disabled)
            element.removeAttribute("disabled");
        else if ((!value) && (!element.disabled))
            element.disabled = true;
    }
};

ko.bindingHandlers['disable'] = {
    'update': function (element, valueAccessor) {
        ko.bindingHandlers['enable']['update'](element, function() { return !ko.utils.unwrapObservable(valueAccessor()) });
    }
};
// For certain common events (currently just 'click'), allow a simplified data-binding syntax
// e.g. click:handler instead of the usual full-length event:{click:handler}
function makeEventHandlerShortcut(eventName) {
    ko.bindingHandlers[eventName] = {
        'init': function(element, valueAccessor, allBindingsAccessor, viewModel) {
            var newValueAccessor = function () {
                var result = {};
                result[eventName] = valueAccessor();
                return result;
            };
            return ko.bindingHandlers['event']['init'].call(this, element, newValueAccessor, allBindingsAccessor, viewModel);
        }
    }
}

ko.bindingHandlers['event'] = {
    'init' : function (element, valueAccessor, allBindingsAccessor, viewModel) {
        var eventsToHandle = valueAccessor() || {};
        ko.utils.objectForEach(eventsToHandle, function(eventName) {
            if (typeof eventName == "string") {
                ko.utils.registerEventHandler(element, eventName, function (event) {
                    var handlerReturnValue;
                    var handlerFunction = valueAccessor()[eventName];
                    if (!handlerFunction)
                        return;
                    var allBindings = allBindingsAccessor();

                    try {
                        // Take all the event args, and prefix with the viewmodel
                        var argsForHandler = ko.utils.makeArray(arguments);
                        argsForHandler.unshift(viewModel);
                        handlerReturnValue = handlerFunction.apply(viewModel, argsForHandler);
                    } finally {
                        if (handlerReturnValue !== true) { // Normally we want to prevent default action. Developer can override this be explicitly returning true.
                            if (event.preventDefault)
                                event.preventDefault();
                            else
                                event.returnValue = false;
                        }
                    }

                    var bubble = allBindings[eventName + 'Bubble'] !== false;
                    if (!bubble) {
                        event.cancelBubble = true;
                        if (event.stopPropagation)
                            event.stopPropagation();
                    }
                });
            }
        });
    }
};
// "foreach: someExpression" is equivalent to "template: { foreach: someExpression }"
// "foreach: { data: someExpression, afterAdd: myfn }" is equivalent to "template: { foreach: someExpression, afterAdd: myfn }"
ko.bindingHandlers['foreach'] = {
    makeTemplateValueAccessor: function(valueAccessor) {
        return function() {
            var modelValue = valueAccessor(),
                unwrappedValue = ko.utils.peekObservable(modelValue);    // Unwrap without setting a dependency here

            // If unwrappedValue is the array, pass in the wrapped value on its own
            // The value will be unwrapped and tracked within the template binding
            // (See https://github.com/SteveSanderson/knockout/issues/523)
            if ((!unwrappedValue) || typeof unwrappedValue.length == "number")
                return { 'foreach': modelValue, 'templateEngine': ko.nativeTemplateEngine.instance };

            // If unwrappedValue.data is the array, preserve all relevant options and unwrap again value so we get updates
            ko.utils.unwrapObservable(modelValue);
            return {
                'foreach': unwrappedValue['data'],
                'as': unwrappedValue['as'],
                'includeDestroyed': unwrappedValue['includeDestroyed'],
                'afterAdd': unwrappedValue['afterAdd'],
                'beforeRemove': unwrappedValue['beforeRemove'],
                'afterRender': unwrappedValue['afterRender'],
                'beforeMove': unwrappedValue['beforeMove'],
                'afterMove': unwrappedValue['afterMove'],
                'templateEngine': ko.nativeTemplateEngine.instance
            };
        };
    },
    'init': function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        return ko.bindingHandlers['template']['init'](element, ko.bindingHandlers['foreach'].makeTemplateValueAccessor(valueAccessor));
    },
    'update': function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        return ko.bindingHandlers['template']['update'](element, ko.bindingHandlers['foreach'].makeTemplateValueAccessor(valueAccessor), allBindingsAccessor, viewModel, bindingContext);
    }
};
ko.expressionRewriting.bindingRewriteValidators['foreach'] = false; // Can't rewrite control flow bindings
ko.virtualElements.allowedBindings['foreach'] = true;
var hasfocusUpdatingProperty = '__ko_hasfocusUpdating';
var hasfocusLastValue = '__ko_hasfocusLastValue';
ko.bindingHandlers['hasfocus'] = {
    'init': function(element, valueAccessor, allBindingsAccessor) {
        var handleElementFocusChange = function(isFocused) {
            // Where possible, ignore which event was raised and determine focus state using activeElement,
            // as this avoids phantom focus/blur events raised when changing tabs in modern browsers.
            // However, not all KO-targeted browsers (Firefox 2) support activeElement. For those browsers,
            // prevent a loss of focus when changing tabs/windows by setting a flag that prevents hasfocus
            // from calling 'blur()' on the element when it loses focus.
            // Discussion at https://github.com/SteveSanderson/knockout/pull/352
            element[hasfocusUpdatingProperty] = true;
            var ownerDoc = element.ownerDocument;
            if ("activeElement" in ownerDoc) {
                var active;
                try {
                    active = ownerDoc.activeElement;
                } catch(e) {
                    // IE9 throws if you access activeElement during page load (see issue #703)
                    active = ownerDoc.body;
                }
                isFocused = (active === element);
            }
            var modelValue = valueAccessor();
            ko.expressionRewriting.writeValueToProperty(modelValue, allBindingsAccessor, 'hasfocus', isFocused, true);

            //cache the latest value, so we can avoid unnecessarily calling focus/blur in the update function
            element[hasfocusLastValue] = isFocused;
            element[hasfocusUpdatingProperty] = false;
        };
        var handleElementFocusIn = handleElementFocusChange.bind(null, true);
        var handleElementFocusOut = handleElementFocusChange.bind(null, false);

        ko.utils.registerEventHandler(element, "focus", handleElementFocusIn);
        ko.utils.registerEventHandler(element, "focusin", handleElementFocusIn); // For IE
        ko.utils.registerEventHandler(element, "blur",  handleElementFocusOut);
        ko.utils.registerEventHandler(element, "focusout",  handleElementFocusOut); // For IE
    },
    'update': function(element, valueAccessor) {
        var value = !!ko.utils.unwrapObservable(valueAccessor()); //force boolean to compare with last value
        if (!element[hasfocusUpdatingProperty] && element[hasfocusLastValue] !== value) {
            value ? element.focus() : element.blur();
            ko.dependencyDetection.ignore(ko.utils.triggerEvent, null, [element, value ? "focusin" : "focusout"]); // For IE, which doesn't reliably fire "focus" or "blur" events synchronously
        }
    }
};

ko.bindingHandlers['hasFocus'] = ko.bindingHandlers['hasfocus']; // Make "hasFocus" an alias
ko.bindingHandlers['html'] = {
    'init': function() {
        // Prevent binding on the dynamically-injected HTML (as developers are unlikely to expect that, and it has security implications)
        return { 'controlsDescendantBindings': true };
    },
    'update': function (element, valueAccessor) {
        // setHtml will unwrap the value if needed
        ko.utils.setHtml(element, valueAccessor());
    }
};
var withIfDomDataKey = '__ko_withIfBindingData';
// Makes a binding like with or if
function makeWithIfBinding(bindingKey, isWith, isNot, makeContextCallback) {
    ko.bindingHandlers[bindingKey] = {
        'init': function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            ko.utils.domData.set(element, withIfDomDataKey, {});
            return { 'controlsDescendantBindings': true };
        },
        'update': function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var withIfData = ko.utils.domData.get(element, withIfDomDataKey),
                dataValue = ko.utils.unwrapObservable(valueAccessor()),
                shouldDisplay = !isNot !== !dataValue, // equivalent to isNot ? !dataValue : !!dataValue
                isFirstRender = !withIfData.savedNodes,
                needsRefresh = isFirstRender || isWith || (shouldDisplay !== withIfData.didDisplayOnLastUpdate);

            if (needsRefresh) {
                if (isFirstRender) {
                    withIfData.savedNodes = ko.utils.cloneNodes(ko.virtualElements.childNodes(element), true /* shouldCleanNodes */);
                }

                if (shouldDisplay) {
                    if (!isFirstRender) {
                        ko.virtualElements.setDomNodeChildren(element, ko.utils.cloneNodes(withIfData.savedNodes));
                    }
                    ko.applyBindingsToDescendants(makeContextCallback ? makeContextCallback(bindingContext, dataValue) : bindingContext, element);
                } else {
                    ko.virtualElements.emptyNode(element);
                }

                withIfData.didDisplayOnLastUpdate = shouldDisplay;
            }
        }
    };
    ko.expressionRewriting.bindingRewriteValidators[bindingKey] = false; // Can't rewrite control flow bindings
    ko.virtualElements.allowedBindings[bindingKey] = true;
}

// Construct the actual binding handlers
makeWithIfBinding('if');
makeWithIfBinding('ifnot', false /* isWith */, true /* isNot */);
makeWithIfBinding('with', true /* isWith */, false /* isNot */,
    function(bindingContext, dataValue) {
        return bindingContext['createChildContext'](dataValue);
    }
);
function ensureDropdownSelectionIsConsistentWithModelValue(element, modelValue, preferModelValue) {
    if (preferModelValue) {
        if (modelValue !== ko.selectExtensions.readValue(element))
            ko.selectExtensions.writeValue(element, modelValue);
    }

    // No matter which direction we're syncing in, we want the end result to be equality between dropdown value and model value.
    // If they aren't equal, either we prefer the dropdown value, or the model value couldn't be represented, so either way,
    // change the model value to match the dropdown.
    if (modelValue !== ko.selectExtensions.readValue(element))
        ko.dependencyDetection.ignore(ko.utils.triggerEvent, null, [element, "change"]);
};

ko.bindingHandlers['options'] = {
    'init': function(element) {
        if (ko.utils.tagNameLower(element) !== "select")
            throw new Error("options binding applies only to SELECT elements");

        // Remove all existing <option>s.
        while (element.length > 0) {
            element.remove(0);
        }

        // Ensures that the binding processor doesn't try to bind the options
        return { 'controlsDescendantBindings': true };
    },
    'update': function (element, valueAccessor, allBindingsAccessor) {
        var selectWasPreviouslyEmpty = element.length == 0;
        var previousScrollTop = (!selectWasPreviouslyEmpty && element.multiple) ? element.scrollTop : null;

        var unwrappedArray = ko.utils.unwrapObservable(valueAccessor());
        var allBindings = allBindingsAccessor();
        var includeDestroyed = allBindings['optionsIncludeDestroyed'];
        var captionPlaceholder = {};
        var captionValue;
        var previousSelectedValues;
        if (element.multiple) {
            previousSelectedValues = ko.utils.arrayMap(element.selectedOptions || ko.utils.arrayFilter(element.childNodes, function (node) {
                    return node.tagName && (ko.utils.tagNameLower(node) === "option") && node.selected;
                }), function (node) {
                    return ko.selectExtensions.readValue(node);
                });
        } else if (element.selectedIndex >= 0) {
            previousSelectedValues = [ ko.selectExtensions.readValue(element.options[element.selectedIndex]) ];
        }

        if (unwrappedArray) {
            if (typeof unwrappedArray.length == "undefined") // Coerce single value into array
                unwrappedArray = [unwrappedArray];

            // Filter out any entries marked as destroyed
            var filteredArray = ko.utils.arrayFilter(unwrappedArray, function(item) {
                return includeDestroyed || item === undefined || item === null || !ko.utils.unwrapObservable(item['_destroy']);
            });

            // If caption is included, add it to the array
            if ('optionsCaption' in allBindings) {
                captionValue = ko.utils.unwrapObservable(allBindings['optionsCaption']);
                // If caption value is null or undefined, don't show a caption
                if (captionValue !== null && captionValue !== undefined) {
                    filteredArray.unshift(captionPlaceholder);
                }
            }
        } else {
            // If a falsy value is provided (e.g. null), we'll simply empty the select element
            unwrappedArray = [];
        }

        function applyToObject(object, predicate, defaultValue) {
            var predicateType = typeof predicate;
            if (predicateType == "function")    // Given a function; run it against the data value
                return predicate(object);
            else if (predicateType == "string") // Given a string; treat it as a property name on the data value
                return object[predicate];
            else                                // Given no optionsText arg; use the data value itself
                return defaultValue;
        }

        // The following functions can run at two different times:
        // The first is when the whole array is being updated directly from this binding handler.
        // The second is when an observable value for a specific array entry is updated.
        // oldOptions will be empty in the first case, but will be filled with the previously generated option in the second.
        function optionForArrayItem(arrayEntry, index, oldOptions) {
            if (oldOptions.length) {
                previousSelectedValues = oldOptions[0].selected && [ ko.selectExtensions.readValue(oldOptions[0]) ];
            }
            var option = document.createElement("option");
            if (arrayEntry === captionPlaceholder) {
                ko.utils.setHtml(option, captionValue);
                ko.selectExtensions.writeValue(option, undefined);
            } else {
                // Apply a value to the option element
                var optionValue = applyToObject(arrayEntry, allBindings['optionsValue'], arrayEntry);
                ko.selectExtensions.writeValue(option, ko.utils.unwrapObservable(optionValue));

                // Apply some text to the option element
                var optionText = applyToObject(arrayEntry, allBindings['optionsText'], optionValue);
                ko.utils.setTextContent(option, optionText);
            }
            return [option];
        }

        function setSelectionCallback(arrayEntry, newOptions) {
            // IE6 doesn't like us to assign selection to OPTION nodes before they're added to the document.
            // That's why we first added them without selection. Now it's time to set the selection.
            if (previousSelectedValues) {
                var isSelected = ko.utils.arrayIndexOf(previousSelectedValues, ko.selectExtensions.readValue(newOptions[0])) >= 0;
                ko.utils.setOptionNodeSelectionState(newOptions[0], isSelected);
            }
        }

        var callback = setSelectionCallback;
        if (allBindings['optionsAfterRender']) {
            callback = function(arrayEntry, newOptions) {
                setSelectionCallback(arrayEntry, newOptions);
                ko.dependencyDetection.ignore(allBindings['optionsAfterRender'], null, [newOptions[0], arrayEntry !== captionPlaceholder ? arrayEntry : undefined]);
            }
        }

        ko.utils.setDomNodeChildrenFromArrayMapping(element, filteredArray, optionForArrayItem, null, callback);

        // Clear previousSelectedValues so that future updates to individual objects don't get stale data
        previousSelectedValues = null;

        if (selectWasPreviouslyEmpty && ('value' in allBindings)) {
            // Ensure consistency between model value and selected option.
            // If the dropdown is being populated for the first time here (or was otherwise previously empty),
            // the dropdown selection state is meaningless, so we preserve the model value.
            ensureDropdownSelectionIsConsistentWithModelValue(element, ko.utils.peekObservable(allBindings['value']), /* preferModelValue */ true);
        }

        // Workaround for IE bug
        ko.utils.ensureSelectElementIsRenderedCorrectly(element);

        if (previousScrollTop && Math.abs(previousScrollTop - element.scrollTop) > 20)
            element.scrollTop = previousScrollTop;
    }
};
ko.bindingHandlers['options'].optionValueDomDataKey = '__ko.optionValueDomData__';
ko.bindingHandlers['selectedOptions'] = {
    'init': function (element, valueAccessor, allBindingsAccessor) {
        ko.utils.registerEventHandler(element, "change", function () {
            var value = valueAccessor(), valueToWrite = [];
            ko.utils.arrayForEach(element.getElementsByTagName("option"), function(node) {
                if (node.selected)
                    valueToWrite.push(ko.selectExtensions.readValue(node));
            });
            ko.expressionRewriting.writeValueToProperty(value, allBindingsAccessor, 'selectedOptions', valueToWrite);
        });
    },
    'update': function (element, valueAccessor) {
        if (ko.utils.tagNameLower(element) != "select")
            throw new Error("values binding applies only to SELECT elements");

        var newValue = ko.utils.unwrapObservable(valueAccessor());
        if (newValue && typeof newValue.length == "number") {
            ko.utils.arrayForEach(element.getElementsByTagName("option"), function(node) {
                var isSelected = ko.utils.arrayIndexOf(newValue, ko.selectExtensions.readValue(node)) >= 0;
                ko.utils.setOptionNodeSelectionState(node, isSelected);
            });
        }
    }
};
ko.bindingHandlers['style'] = {
    'update': function (element, valueAccessor) {
        var value = ko.utils.unwrapObservable(valueAccessor() || {});
        ko.utils.objectForEach(value, function(styleName, styleValue) {
            styleValue = ko.utils.unwrapObservable(styleValue);
            element.style[styleName] = styleValue || ""; // Empty string removes the value, whereas null/undefined have no effect
        });
    }
};
ko.bindingHandlers['submit'] = {
    'init': function (element, valueAccessor, allBindingsAccessor, viewModel) {
        if (typeof valueAccessor() != "function")
            throw new Error("The value for a submit binding must be a function");
        ko.utils.registerEventHandler(element, "submit", function (event) {
            var handlerReturnValue;
            var value = valueAccessor();
            try { handlerReturnValue = value.call(viewModel, element); }
            finally {
                if (handlerReturnValue !== true) { // Normally we want to prevent default action. Developer can override this be explicitly returning true.
                    if (event.preventDefault)
                        event.preventDefault();
                    else
                        event.returnValue = false;
                }
            }
        });
    }
};
ko.bindingHandlers['text'] = {
    'update': function (element, valueAccessor) {
        ko.utils.setTextContent(element, valueAccessor());
    }
};
ko.virtualElements.allowedBindings['text'] = true;
ko.bindingHandlers['uniqueName'] = {
    'init': function (element, valueAccessor) {
        if (valueAccessor()) {
            var name = "ko_unique_" + (++ko.bindingHandlers['uniqueName'].currentIndex);
            ko.utils.setElementName(element, name);
        }
    }
};
ko.bindingHandlers['uniqueName'].currentIndex = 0;
ko.bindingHandlers['value'] = {
    'init': function (element, valueAccessor, allBindingsAccessor) {
        // Always catch "change" event; possibly other events too if asked
        var eventsToCatch = ["change"];
        var requestedEventsToCatch = allBindingsAccessor()["valueUpdate"];
        var propertyChangedFired = false;
        if (requestedEventsToCatch) {
            if (typeof requestedEventsToCatch == "string") // Allow both individual event names, and arrays of event names
                requestedEventsToCatch = [requestedEventsToCatch];
            ko.utils.arrayPushAll(eventsToCatch, requestedEventsToCatch);
            eventsToCatch = ko.utils.arrayGetDistinctValues(eventsToCatch);
        }

        var valueUpdateHandler = function() {
            propertyChangedFired = false;
            var modelValue = valueAccessor();
            var elementValue = ko.selectExtensions.readValue(element);
            ko.expressionRewriting.writeValueToProperty(modelValue, allBindingsAccessor, 'value', elementValue);
        }

        // Workaround for https://github.com/SteveSanderson/knockout/issues/122
        // IE doesn't fire "change" events on textboxes if the user selects a value from its autocomplete list
        var ieAutoCompleteHackNeeded = ko.utils.ieVersion && element.tagName.toLowerCase() == "input" && element.type == "text"
                                       && element.autocomplete != "off" && (!element.form || element.form.autocomplete != "off");
        if (ieAutoCompleteHackNeeded && ko.utils.arrayIndexOf(eventsToCatch, "propertychange") == -1) {
            ko.utils.registerEventHandler(element, "propertychange", function () { propertyChangedFired = true });
            ko.utils.registerEventHandler(element, "blur", function() {
                if (propertyChangedFired) {
                    valueUpdateHandler();
                }
            });
        }

        ko.utils.arrayForEach(eventsToCatch, function(eventName) {
            // The syntax "after<eventname>" means "run the handler asynchronously after the event"
            // This is useful, for example, to catch "keydown" events after the browser has updated the control
            // (otherwise, ko.selectExtensions.readValue(this) will receive the control's value *before* the key event)
            var handler = valueUpdateHandler;
            if (ko.utils.stringStartsWith(eventName, "after")) {
                handler = function() { setTimeout(valueUpdateHandler, 0) };
                eventName = eventName.substring("after".length);
            }
            ko.utils.registerEventHandler(element, eventName, handler);
        });
    },
    'update': function (element, valueAccessor) {
        var valueIsSelectOption = ko.utils.tagNameLower(element) === "select";
        var newValue = ko.utils.unwrapObservable(valueAccessor());
        var elementValue = ko.selectExtensions.readValue(element);
        var valueHasChanged = (newValue !== elementValue);

        if (valueHasChanged) {
            var applyValueAction = function () { ko.selectExtensions.writeValue(element, newValue); };
            applyValueAction();

            // Workaround for IE6 bug: It won't reliably apply values to SELECT nodes during the same execution thread
            // right after you've changed the set of OPTION nodes on it. So for that node type, we'll schedule a second thread
            // to apply the value as well.
            var alsoApplyAsynchronously = valueIsSelectOption;
            if (alsoApplyAsynchronously)
                setTimeout(applyValueAction, 0);
        }

        // If you try to set a model value that can't be represented in an already-populated dropdown, reject that change,
        // because you're not allowed to have a model value that disagrees with a visible UI selection.
        if (valueIsSelectOption && (element.length > 0))
            ensureDropdownSelectionIsConsistentWithModelValue(element, newValue, /* preferModelValue */ false);
    }
};
ko.bindingHandlers['visible'] = {
    'update': function (element, valueAccessor) {
        var value = ko.utils.unwrapObservable(valueAccessor());
        var isCurrentlyVisible = !(element.style.display == "none");
        if (value && !isCurrentlyVisible)
            element.style.display = "";
        else if ((!value) && isCurrentlyVisible)
            element.style.display = "none";
    }
};
// 'click' is just a shorthand for the usual full-length event:{click:handler}
makeEventHandlerShortcut('click');
// If you want to make a custom template engine,
//
// [1] Inherit from this class (like ko.nativeTemplateEngine does)
// [2] Override 'renderTemplateSource', supplying a function with this signature:
//
//        function (templateSource, bindingContext, options) {
//            // - templateSource.text() is the text of the template you should render
//            // - bindingContext.$data is the data you should pass into the template
//            //   - you might also want to make bindingContext.$parent, bindingContext.$parents,
//            //     and bindingContext.$root available in the template too
//            // - options gives you access to any other properties set on "data-bind: { template: options }"
//            //
//            // Return value: an array of DOM nodes
//        }
//
// [3] Override 'createJavaScriptEvaluatorBlock', supplying a function with this signature:
//
//        function (script) {
//            // Return value: Whatever syntax means "Evaluate the JavaScript statement 'script' and output the result"
//            //               For example, the jquery.tmpl template engine converts 'someScript' to '${ someScript }'
//        }
//
//     This is only necessary if you want to allow data-bind attributes to reference arbitrary template variables.
//     If you don't want to allow that, you can set the property 'allowTemplateRewriting' to false (like ko.nativeTemplateEngine does)
//     and then you don't need to override 'createJavaScriptEvaluatorBlock'.

ko.templateEngine = function () { };

ko.templateEngine.prototype['renderTemplateSource'] = function (templateSource, bindingContext, options) {
    throw new Error("Override renderTemplateSource");
};

ko.templateEngine.prototype['createJavaScriptEvaluatorBlock'] = function (script) {
    throw new Error("Override createJavaScriptEvaluatorBlock");
};

ko.templateEngine.prototype['makeTemplateSource'] = function(template, templateDocument) {
    // Named template
    if (typeof template == "string") {
        templateDocument = templateDocument || document;
        var elem = templateDocument.getElementById(template);
        if (!elem)
            throw new Error("Cannot find template with ID " + template);
        return new ko.templateSources.domElement(elem);
    } else if ((template.nodeType == 1) || (template.nodeType == 8)) {
        // Anonymous template
        return new ko.templateSources.anonymousTemplate(template);
    } else
        throw new Error("Unknown template type: " + template);
};

ko.templateEngine.prototype['renderTemplate'] = function (template, bindingContext, options, templateDocument) {
    var templateSource = this['makeTemplateSource'](template, templateDocument);
    return this['renderTemplateSource'](templateSource, bindingContext, options);
};

ko.templateEngine.prototype['isTemplateRewritten'] = function (template, templateDocument) {
    // Skip rewriting if requested
    if (this['allowTemplateRewriting'] === false)
        return true;
    return this['makeTemplateSource'](template, templateDocument)['data']("isRewritten");
};

ko.templateEngine.prototype['rewriteTemplate'] = function (template, rewriterCallback, templateDocument) {
    var templateSource = this['makeTemplateSource'](template, templateDocument);
    var rewritten = rewriterCallback(templateSource['text']());
    templateSource['text'](rewritten);
    templateSource['data']("isRewritten", true);
};

ko.exportSymbol('templateEngine', ko.templateEngine);

ko.templateRewriting = (function () {
    var memoizeDataBindingAttributeSyntaxRegex = /(<([a-z]+\d*)(?:\s+(?!data-bind\s*=\s*)[a-z0-9\-]+(?:=(?:\"[^\"]*\"|\'[^\']*\'))?)*\s+)data-bind\s*=\s*(["'])([\s\S]*?)\3/gi;
    var memoizeVirtualContainerBindingSyntaxRegex = /<!--\s*ko\b\s*([\s\S]*?)\s*-->/g;

    function validateDataBindValuesForRewriting(keyValueArray) {
        var allValidators = ko.expressionRewriting.bindingRewriteValidators;
        for (var i = 0; i < keyValueArray.length; i++) {
            var key = keyValueArray[i]['key'];
            if (allValidators.hasOwnProperty(key)) {
                var validator = allValidators[key];

                if (typeof validator === "function") {
                    var possibleErrorMessage = validator(keyValueArray[i]['value']);
                    if (possibleErrorMessage)
                        throw new Error(possibleErrorMessage);
                } else if (!validator) {
                    throw new Error("This template engine does not support the '" + key + "' binding within its templates");
                }
            }
        }
    }

    function constructMemoizedTagReplacement(dataBindAttributeValue, tagToRetain, nodeName, templateEngine) {
        var dataBindKeyValueArray = ko.expressionRewriting.parseObjectLiteral(dataBindAttributeValue);
        validateDataBindValuesForRewriting(dataBindKeyValueArray);
        var rewrittenDataBindAttributeValue = ko.expressionRewriting.preProcessBindings(dataBindKeyValueArray);

        // For no obvious reason, Opera fails to evaluate rewrittenDataBindAttributeValue unless it's wrapped in an additional
        // anonymous function, even though Opera's built-in debugger can evaluate it anyway. No other browser requires this
        // extra indirection.
        var applyBindingsToNextSiblingScript =
            "ko.__tr_ambtns(function($context,$element){return(function(){return{ " + rewrittenDataBindAttributeValue + " } })()},'" + nodeName.toLowerCase() + "')";
        return templateEngine['createJavaScriptEvaluatorBlock'](applyBindingsToNextSiblingScript) + tagToRetain;
    }

    return {
        ensureTemplateIsRewritten: function (template, templateEngine, templateDocument) {
            if (!templateEngine['isTemplateRewritten'](template, templateDocument))
                templateEngine['rewriteTemplate'](template, function (htmlString) {
                    return ko.templateRewriting.memoizeBindingAttributeSyntax(htmlString, templateEngine);
                }, templateDocument);
        },

        memoizeBindingAttributeSyntax: function (htmlString, templateEngine) {
            return htmlString.replace(memoizeDataBindingAttributeSyntaxRegex, function () {
                return constructMemoizedTagReplacement(/* dataBindAttributeValue: */ arguments[4], /* tagToRetain: */ arguments[1], /* nodeName: */ arguments[2], templateEngine);
            }).replace(memoizeVirtualContainerBindingSyntaxRegex, function() {
                return constructMemoizedTagReplacement(/* dataBindAttributeValue: */ arguments[1], /* tagToRetain: */ "<!-- ko -->", /* nodeName: */ "#comment", templateEngine);
            });
        },

        applyMemoizedBindingsToNextSibling: function (bindings, nodeName) {
            return ko.memoization.memoize(function (domNode, bindingContext) {
                var nodeToBind = domNode.nextSibling;
                if (nodeToBind && nodeToBind.nodeName.toLowerCase() === nodeName) {
                    ko.applyBindingsToNode(nodeToBind, bindings, bindingContext);
                }
            });
        }
    }
})();


// Exported only because it has to be referenced by string lookup from within rewritten template
ko.exportSymbol('__tr_ambtns', ko.templateRewriting.applyMemoizedBindingsToNextSibling);
(function() {
    // A template source represents a read/write way of accessing a template. This is to eliminate the need for template loading/saving
    // logic to be duplicated in every template engine (and means they can all work with anonymous templates, etc.)
    //
    // Two are provided by default:
    //  1. ko.templateSources.domElement       - reads/writes the text content of an arbitrary DOM element
    //  2. ko.templateSources.anonymousElement - uses ko.utils.domData to read/write text *associated* with the DOM element, but
    //                                           without reading/writing the actual element text content, since it will be overwritten
    //                                           with the rendered template output.
    // You can implement your own template source if you want to fetch/store templates somewhere other than in DOM elements.
    // Template sources need to have the following functions:
    //   text() 			- returns the template text from your storage location
    //   text(value)		- writes the supplied template text to your storage location
    //   data(key)			- reads values stored using data(key, value) - see below
    //   data(key, value)	- associates "value" with this template and the key "key". Is used to store information like "isRewritten".
    //
    // Optionally, template sources can also have the following functions:
    //   nodes()            - returns a DOM element containing the nodes of this template, where available
    //   nodes(value)       - writes the given DOM element to your storage location
    // If a DOM element is available for a given template source, template engines are encouraged to use it in preference over text()
    // for improved speed. However, all templateSources must supply text() even if they don't supply nodes().
    //
    // Once you've implemented a templateSource, make your template engine use it by subclassing whatever template engine you were
    // using and overriding "makeTemplateSource" to return an instance of your custom template source.

    ko.templateSources = {};

    // ---- ko.templateSources.domElement -----

    ko.templateSources.domElement = function(element) {
        this.domElement = element;
    }

    ko.templateSources.domElement.prototype['text'] = function(/* valueToWrite */) {
        var tagNameLower = ko.utils.tagNameLower(this.domElement),
            elemContentsProperty = tagNameLower === "script" ? "text"
                                 : tagNameLower === "textarea" ? "value"
                                 : "innerHTML";

        if (arguments.length == 0) {
            return this.domElement[elemContentsProperty];
        } else {
            var valueToWrite = arguments[0];
            if (elemContentsProperty === "innerHTML")
                ko.utils.setHtml(this.domElement, valueToWrite);
            else
                this.domElement[elemContentsProperty] = valueToWrite;
        }
    };

    ko.templateSources.domElement.prototype['data'] = function(key /*, valueToWrite */) {
        if (arguments.length === 1) {
            return ko.utils.domData.get(this.domElement, "templateSourceData_" + key);
        } else {
            ko.utils.domData.set(this.domElement, "templateSourceData_" + key, arguments[1]);
        }
    };

    // ---- ko.templateSources.anonymousTemplate -----
    // Anonymous templates are normally saved/retrieved as DOM nodes through "nodes".
    // For compatibility, you can also read "text"; it will be serialized from the nodes on demand.
    // Writing to "text" is still supported, but then the template data will not be available as DOM nodes.

    var anonymousTemplatesDomDataKey = "__ko_anon_template__";
    ko.templateSources.anonymousTemplate = function(element) {
        this.domElement = element;
    }
    ko.templateSources.anonymousTemplate.prototype = new ko.templateSources.domElement();
    ko.templateSources.anonymousTemplate.prototype.constructor = ko.templateSources.anonymousTemplate;
    ko.templateSources.anonymousTemplate.prototype['text'] = function(/* valueToWrite */) {
        if (arguments.length == 0) {
            var templateData = ko.utils.domData.get(this.domElement, anonymousTemplatesDomDataKey) || {};
            if (templateData.textData === undefined && templateData.containerData)
                templateData.textData = templateData.containerData.innerHTML;
            return templateData.textData;
        } else {
            var valueToWrite = arguments[0];
            ko.utils.domData.set(this.domElement, anonymousTemplatesDomDataKey, {textData: valueToWrite});
        }
    };
    ko.templateSources.domElement.prototype['nodes'] = function(/* valueToWrite */) {
        if (arguments.length == 0) {
            var templateData = ko.utils.domData.get(this.domElement, anonymousTemplatesDomDataKey) || {};
            return templateData.containerData;
        } else {
            var valueToWrite = arguments[0];
            ko.utils.domData.set(this.domElement, anonymousTemplatesDomDataKey, {containerData: valueToWrite});
        }
    };

    ko.exportSymbol('templateSources', ko.templateSources);
    ko.exportSymbol('templateSources.domElement', ko.templateSources.domElement);
    ko.exportSymbol('templateSources.anonymousTemplate', ko.templateSources.anonymousTemplate);
})();
(function () {
    var _templateEngine;
    ko.setTemplateEngine = function (templateEngine) {
        if ((templateEngine != undefined) && !(templateEngine instanceof ko.templateEngine))
            throw new Error("templateEngine must inherit from ko.templateEngine");
        _templateEngine = templateEngine;
    }

    function invokeForEachNodeOrCommentInContinuousRange(firstNode, lastNode, action) {
        var node, nextInQueue = firstNode, firstOutOfRangeNode = ko.virtualElements.nextSibling(lastNode);
        while (nextInQueue && ((node = nextInQueue) !== firstOutOfRangeNode)) {
            nextInQueue = ko.virtualElements.nextSibling(node);
            if (node.nodeType === 1 || node.nodeType === 8)
                action(node);
        }
    }

    function activateBindingsOnContinuousNodeArray(continuousNodeArray, bindingContext) {
        // To be used on any nodes that have been rendered by a template and have been inserted into some parent element
        // Walks through continuousNodeArray (which *must* be continuous, i.e., an uninterrupted sequence of sibling nodes, because
        // the algorithm for walking them relies on this), and for each top-level item in the virtual-element sense,
        // (1) Does a regular "applyBindings" to associate bindingContext with this node and to activate any non-memoized bindings
        // (2) Unmemoizes any memos in the DOM subtree (e.g., to activate bindings that had been memoized during template rewriting)

        if (continuousNodeArray.length) {
            var firstNode = continuousNodeArray[0], lastNode = continuousNodeArray[continuousNodeArray.length - 1];

            // Need to applyBindings *before* unmemoziation, because unmemoization might introduce extra nodes (that we don't want to re-bind)
            // whereas a regular applyBindings won't introduce new memoized nodes
            invokeForEachNodeOrCommentInContinuousRange(firstNode, lastNode, function(node) {
                ko.applyBindings(bindingContext, node);
            });
            invokeForEachNodeOrCommentInContinuousRange(firstNode, lastNode, function(node) {
                ko.memoization.unmemoizeDomNodeAndDescendants(node, [bindingContext]);
            });
        }
    }

    function getFirstNodeFromPossibleArray(nodeOrNodeArray) {
        return nodeOrNodeArray.nodeType ? nodeOrNodeArray
                                        : nodeOrNodeArray.length > 0 ? nodeOrNodeArray[0]
                                        : null;
    }

    function executeTemplate(targetNodeOrNodeArray, renderMode, template, bindingContext, options) {
        options = options || {};
        var firstTargetNode = targetNodeOrNodeArray && getFirstNodeFromPossibleArray(targetNodeOrNodeArray);
        var templateDocument = firstTargetNode && firstTargetNode.ownerDocument;
        var templateEngineToUse = (options['templateEngine'] || _templateEngine);
        ko.templateRewriting.ensureTemplateIsRewritten(template, templateEngineToUse, templateDocument);
        var renderedNodesArray = templateEngineToUse['renderTemplate'](template, bindingContext, options, templateDocument);

        // Loosely check result is an array of DOM nodes
        if ((typeof renderedNodesArray.length != "number") || (renderedNodesArray.length > 0 && typeof renderedNodesArray[0].nodeType != "number"))
            throw new Error("Template engine must return an array of DOM nodes");

        var haveAddedNodesToParent = false;
        switch (renderMode) {
            case "replaceChildren":
                ko.virtualElements.setDomNodeChildren(targetNodeOrNodeArray, renderedNodesArray);
                haveAddedNodesToParent = true;
                break;
            case "replaceNode":
                ko.utils.replaceDomNodes(targetNodeOrNodeArray, renderedNodesArray);
                haveAddedNodesToParent = true;
                break;
            case "ignoreTargetNode": break;
            default:
                throw new Error("Unknown renderMode: " + renderMode);
        }

        if (haveAddedNodesToParent) {
            activateBindingsOnContinuousNodeArray(renderedNodesArray, bindingContext);
            if (options['afterRender'])
                ko.dependencyDetection.ignore(options['afterRender'], null, [renderedNodesArray, bindingContext['$data']]);
        }

        return renderedNodesArray;
    }

    ko.renderTemplate = function (template, dataOrBindingContext, options, targetNodeOrNodeArray, renderMode) {
        options = options || {};
        if ((options['templateEngine'] || _templateEngine) == undefined)
            throw new Error("Set a template engine before calling renderTemplate");
        renderMode = renderMode || "replaceChildren";

        if (targetNodeOrNodeArray) {
            var firstTargetNode = getFirstNodeFromPossibleArray(targetNodeOrNodeArray);

            var whenToDispose = function () { return (!firstTargetNode) || !ko.utils.domNodeIsAttachedToDocument(firstTargetNode); }; // Passive disposal (on next evaluation)
            var activelyDisposeWhenNodeIsRemoved = (firstTargetNode && renderMode == "replaceNode") ? firstTargetNode.parentNode : firstTargetNode;

            return ko.dependentObservable( // So the DOM is automatically updated when any dependency changes
                function () {
                    // Ensure we've got a proper binding context to work with
                    var bindingContext = (dataOrBindingContext && (dataOrBindingContext instanceof ko.bindingContext))
                        ? dataOrBindingContext
                        : new ko.bindingContext(ko.utils.unwrapObservable(dataOrBindingContext));

                    // Support selecting template as a function of the data being rendered
                    var templateName = typeof(template) == 'function' ? template(bindingContext['$data'], bindingContext) : template;

                    var renderedNodesArray = executeTemplate(targetNodeOrNodeArray, renderMode, templateName, bindingContext, options);
                    if (renderMode == "replaceNode") {
                        targetNodeOrNodeArray = renderedNodesArray;
                        firstTargetNode = getFirstNodeFromPossibleArray(targetNodeOrNodeArray);
                    }
                },
                null,
                { disposeWhen: whenToDispose, disposeWhenNodeIsRemoved: activelyDisposeWhenNodeIsRemoved }
            );
        } else {
            // We don't yet have a DOM node to evaluate, so use a memo and render the template later when there is a DOM node
            return ko.memoization.memoize(function (domNode) {
                ko.renderTemplate(template, dataOrBindingContext, options, domNode, "replaceNode");
            });
        }
    };

    ko.renderTemplateForEach = function (template, arrayOrObservableArray, options, targetNode, parentBindingContext) {
        // Since setDomNodeChildrenFromArrayMapping always calls executeTemplateForArrayItem and then
        // activateBindingsCallback for added items, we can store the binding context in the former to use in the latter.
        var arrayItemContext;

        // This will be called by setDomNodeChildrenFromArrayMapping to get the nodes to add to targetNode
        var executeTemplateForArrayItem = function (arrayValue, index) {
            // Support selecting template as a function of the data being rendered
            arrayItemContext = parentBindingContext['createChildContext'](ko.utils.unwrapObservable(arrayValue), options['as']);
            arrayItemContext['$index'] = index;
            var templateName = typeof(template) == 'function' ? template(arrayValue, arrayItemContext) : template;
            return executeTemplate(null, "ignoreTargetNode", templateName, arrayItemContext, options);
        }

        // This will be called whenever setDomNodeChildrenFromArrayMapping has added nodes to targetNode
        var activateBindingsCallback = function(arrayValue, addedNodesArray, index) {
            activateBindingsOnContinuousNodeArray(addedNodesArray, arrayItemContext);
            if (options['afterRender'])
                options['afterRender'](addedNodesArray, arrayValue);
        };

        return ko.dependentObservable(function () {
            var unwrappedArray = ko.utils.unwrapObservable(arrayOrObservableArray) || [];
            if (typeof unwrappedArray.length == "undefined") // Coerce single value into array
                unwrappedArray = [unwrappedArray];

            // Filter out any entries marked as destroyed
            var filteredArray = ko.utils.arrayFilter(unwrappedArray, function(item) {
                return options['includeDestroyed'] || item === undefined || item === null || !ko.utils.unwrapObservable(item['_destroy']);
            });

            // Call setDomNodeChildrenFromArrayMapping, ignoring any observables unwrapped within (most likely from a callback function).
            // If the array items are observables, though, they will be unwrapped in executeTemplateForArrayItem and managed within setDomNodeChildrenFromArrayMapping.
            ko.dependencyDetection.ignore(ko.utils.setDomNodeChildrenFromArrayMapping, null, [targetNode, filteredArray, executeTemplateForArrayItem, options, activateBindingsCallback]);

        }, null, { disposeWhenNodeIsRemoved: targetNode });
    };

    var templateComputedDomDataKey = '__ko__templateComputedDomDataKey__';
    function disposeOldComputedAndStoreNewOne(element, newComputed) {
        var oldComputed = ko.utils.domData.get(element, templateComputedDomDataKey);
        if (oldComputed && (typeof(oldComputed.dispose) == 'function'))
            oldComputed.dispose();
        ko.utils.domData.set(element, templateComputedDomDataKey, (newComputed && newComputed.isActive()) ? newComputed : undefined);
    }

    ko.bindingHandlers['template'] = {
        'init': function(element, valueAccessor) {
            // Support anonymous templates
            var bindingValue = ko.utils.unwrapObservable(valueAccessor());
            if ((typeof bindingValue != "string") && (!bindingValue['name']) && (element.nodeType == 1 || element.nodeType == 8)) {
                // It's an anonymous template - store the element contents, then clear the element
                var templateNodes = element.nodeType == 1 ? element.childNodes : ko.virtualElements.childNodes(element),
                    container = ko.utils.moveCleanedNodesToContainerElement(templateNodes); // This also removes the nodes from their current parent
                new ko.templateSources.anonymousTemplate(element)['nodes'](container);
            }
            return { 'controlsDescendantBindings': true };
        },
        'update': function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var templateName = ko.utils.unwrapObservable(valueAccessor()),
                options = {},
                shouldDisplay = true,
                dataValue,
                templateComputed = null;

            if (typeof templateName != "string") {
                options = templateName;
                templateName = ko.utils.unwrapObservable(options['name']);

                // Support "if"/"ifnot" conditions
                if ('if' in options)
                    shouldDisplay = ko.utils.unwrapObservable(options['if']);
                if (shouldDisplay && 'ifnot' in options)
                    shouldDisplay = !ko.utils.unwrapObservable(options['ifnot']);

                dataValue = ko.utils.unwrapObservable(options['data']);
            }

            if ('foreach' in options) {
                // Render once for each data point (treating data set as empty if shouldDisplay==false)
                var dataArray = (shouldDisplay && options['foreach']) || [];
                templateComputed = ko.renderTemplateForEach(templateName || element, dataArray, options, element, bindingContext);
            } else if (!shouldDisplay) {
                ko.virtualElements.emptyNode(element);
            } else {
                // Render once for this single data point (or use the viewModel if no data was provided)
                var innerBindingContext = ('data' in options) ?
                    bindingContext['createChildContext'](dataValue, options['as']) :  // Given an explitit 'data' value, we create a child binding context for it
                    bindingContext;                                                        // Given no explicit 'data' value, we retain the same binding context
                templateComputed = ko.renderTemplate(templateName || element, innerBindingContext, options, element);
            }

            // It only makes sense to have a single template computed per element (otherwise which one should have its output displayed?)
            disposeOldComputedAndStoreNewOne(element, templateComputed);
        }
    };

    // Anonymous templates can't be rewritten. Give a nice error message if you try to do it.
    ko.expressionRewriting.bindingRewriteValidators['template'] = function(bindingValue) {
        var parsedBindingValue = ko.expressionRewriting.parseObjectLiteral(bindingValue);

        if ((parsedBindingValue.length == 1) && parsedBindingValue[0]['unknown'])
            return null; // It looks like a string literal, not an object literal, so treat it as a named template (which is allowed for rewriting)

        if (ko.expressionRewriting.keyValueArrayContainsKey(parsedBindingValue, "name"))
            return null; // Named templates can be rewritten, so return "no error"
        return "This template engine does not support anonymous templates nested within its templates";
    };

    ko.virtualElements.allowedBindings['template'] = true;
})();

ko.exportSymbol('setTemplateEngine', ko.setTemplateEngine);
ko.exportSymbol('renderTemplate', ko.renderTemplate);

ko.utils.compareArrays = (function () {
    var statusNotInOld = 'added', statusNotInNew = 'deleted';

    // Simple calculation based on Levenshtein distance.
    function compareArrays(oldArray, newArray, dontLimitMoves) {
        oldArray = oldArray || [];
        newArray = newArray || [];

        if (oldArray.length <= newArray.length)
            return compareSmallArrayToBigArray(oldArray, newArray, statusNotInOld, statusNotInNew, dontLimitMoves);
        else
            return compareSmallArrayToBigArray(newArray, oldArray, statusNotInNew, statusNotInOld, dontLimitMoves);
    }

    function compareSmallArrayToBigArray(smlArray, bigArray, statusNotInSml, statusNotInBig, dontLimitMoves) {
        var myMin = Math.min,
            myMax = Math.max,
            editDistanceMatrix = [],
            smlIndex, smlIndexMax = smlArray.length,
            bigIndex, bigIndexMax = bigArray.length,
            compareRange = (bigIndexMax - smlIndexMax) || 1,
            maxDistance = smlIndexMax + bigIndexMax + 1,
            thisRow, lastRow,
            bigIndexMaxForRow, bigIndexMinForRow;

        for (smlIndex = 0; smlIndex <= smlIndexMax; smlIndex++) {
            lastRow = thisRow;
            editDistanceMatrix.push(thisRow = []);
            bigIndexMaxForRow = myMin(bigIndexMax, smlIndex + compareRange);
            bigIndexMinForRow = myMax(0, smlIndex - 1);
            for (bigIndex = bigIndexMinForRow; bigIndex <= bigIndexMaxForRow; bigIndex++) {
                if (!bigIndex)
                    thisRow[bigIndex] = smlIndex + 1;
                else if (!smlIndex)  // Top row - transform empty array into new array via additions
                    thisRow[bigIndex] = bigIndex + 1;
                else if (smlArray[smlIndex - 1] === bigArray[bigIndex - 1])
                    thisRow[bigIndex] = lastRow[bigIndex - 1];                  // copy value (no edit)
                else {
                    var northDistance = lastRow[bigIndex] || maxDistance;       // not in big (deletion)
                    var westDistance = thisRow[bigIndex - 1] || maxDistance;    // not in small (addition)
                    thisRow[bigIndex] = myMin(northDistance, westDistance) + 1;
                }
            }
        }

        var editScript = [], meMinusOne, notInSml = [], notInBig = [];
        for (smlIndex = smlIndexMax, bigIndex = bigIndexMax; smlIndex || bigIndex;) {
            meMinusOne = editDistanceMatrix[smlIndex][bigIndex] - 1;
            if (bigIndex && meMinusOne === editDistanceMatrix[smlIndex][bigIndex-1]) {
                notInSml.push(editScript[editScript.length] = {     // added
                    'status': statusNotInSml,
                    'value': bigArray[--bigIndex],
                    'index': bigIndex });
            } else if (smlIndex && meMinusOne === editDistanceMatrix[smlIndex - 1][bigIndex]) {
                notInBig.push(editScript[editScript.length] = {     // deleted
                    'status': statusNotInBig,
                    'value': smlArray[--smlIndex],
                    'index': smlIndex });
            } else {
                editScript.push({
                    'status': "retained",
                    'value': bigArray[--bigIndex] });
                --smlIndex;
            }
        }

        if (notInSml.length && notInBig.length) {
            // Set a limit on the number of consecutive non-matching comparisons; having it a multiple of
            // smlIndexMax keeps the time complexity of this algorithm linear.
            var limitFailedCompares = smlIndexMax * 10, failedCompares,
                a, d, notInSmlItem, notInBigItem;
            // Go through the items that have been added and deleted and try to find matches between them.
            for (failedCompares = a = 0; (dontLimitMoves || failedCompares < limitFailedCompares) && (notInSmlItem = notInSml[a]); a++) {
                for (d = 0; notInBigItem = notInBig[d]; d++) {
                    if (notInSmlItem['value'] === notInBigItem['value']) {
                        notInSmlItem['moved'] = notInBigItem['index'];
                        notInBigItem['moved'] = notInSmlItem['index'];
                        notInBig.splice(d,1);       // This item is marked as moved; so remove it from notInBig list
                        failedCompares = d = 0;     // Reset failed compares count because we're checking for consecutive failures
                        break;
                    }
                }
                failedCompares += d;
            }
        }
        return editScript.reverse();
    }

    return compareArrays;
})();

ko.exportSymbol('utils.compareArrays', ko.utils.compareArrays);

(function () {
    // Objective:
    // * Given an input array, a container DOM node, and a function from array elements to arrays of DOM nodes,
    //   map the array elements to arrays of DOM nodes, concatenate together all these arrays, and use them to populate the container DOM node
    // * Next time we're given the same combination of things (with the array possibly having mutated), update the container DOM node
    //   so that its children is again the concatenation of the mappings of the array elements, but don't re-map any array elements that we
    //   previously mapped - retain those nodes, and just insert/delete other ones

    // "callbackAfterAddingNodes" will be invoked after any "mapping"-generated nodes are inserted into the container node
    // You can use this, for example, to activate bindings on those nodes.

    function fixUpNodesToBeMovedOrRemoved(contiguousNodeArray) {
        // Before moving, deleting, or replacing a set of nodes that were previously outputted by the "map" function, we have to reconcile
        // them against what is in the DOM right now. It may be that some of the nodes have already been removed from the document,
        // or that new nodes might have been inserted in the middle, for example by a binding. Also, there may previously have been
        // leading comment nodes (created by rewritten string-based templates) that have since been removed during binding.
        // So, this function translates the old "map" output array into its best guess of what set of current DOM nodes should be removed.
        //
        // Rules:
        //   [A] Any leading nodes that aren't in the document any more should be ignored
        //       These most likely correspond to memoization nodes that were already removed during binding
        //       See https://github.com/SteveSanderson/knockout/pull/440
        //   [B] We want to output a contiguous series of nodes that are still in the document. So, ignore any nodes that
        //       have already been removed, and include any nodes that have been inserted among the previous collection

        // Rule [A]
        while (contiguousNodeArray.length && !ko.utils.domNodeIsAttachedToDocument(contiguousNodeArray[0]))
            contiguousNodeArray.splice(0, 1);

        // Rule [B]
        if (contiguousNodeArray.length > 1) {
            // Build up the actual new contiguous node set
            var current = contiguousNodeArray[0], last = contiguousNodeArray[contiguousNodeArray.length - 1], newContiguousSet = [current];
            while (current !== last) {
                current = current.nextSibling;
                if (!current) // Won't happen, except if the developer has manually removed some DOM elements (then we're in an undefined scenario)
                    return;
                newContiguousSet.push(current);
            }

            // ... then mutate the input array to match this.
            // (The following line replaces the contents of contiguousNodeArray with newContiguousSet)
            Array.prototype.splice.apply(contiguousNodeArray, [0, contiguousNodeArray.length].concat(newContiguousSet));
        }
        return contiguousNodeArray;
    }

    function mapNodeAndRefreshWhenChanged(containerNode, mapping, valueToMap, callbackAfterAddingNodes, index) {
        // Map this array value inside a dependentObservable so we re-map when any dependency changes
        var mappedNodes = [];
        var dependentObservable = ko.dependentObservable(function() {
            var newMappedNodes = mapping(valueToMap, index, fixUpNodesToBeMovedOrRemoved(mappedNodes)) || [];

            // On subsequent evaluations, just replace the previously-inserted DOM nodes
            if (mappedNodes.length > 0) {
                ko.utils.replaceDomNodes(mappedNodes, newMappedNodes);
                if (callbackAfterAddingNodes)
                    ko.dependencyDetection.ignore(callbackAfterAddingNodes, null, [valueToMap, newMappedNodes, index]);
            }

            // Replace the contents of the mappedNodes array, thereby updating the record
            // of which nodes would be deleted if valueToMap was itself later removed
            mappedNodes.splice(0, mappedNodes.length);
            ko.utils.arrayPushAll(mappedNodes, newMappedNodes);
        }, null, { disposeWhenNodeIsRemoved: containerNode, disposeWhen: function() { return !ko.utils.anyDomNodeIsAttachedToDocument(mappedNodes); } });
        return { mappedNodes : mappedNodes, dependentObservable : (dependentObservable.isActive() ? dependentObservable : undefined) };
    }

    var lastMappingResultDomDataKey = "setDomNodeChildrenFromArrayMapping_lastMappingResult";

    ko.utils.setDomNodeChildrenFromArrayMapping = function (domNode, array, mapping, options, callbackAfterAddingNodes) {
        // Compare the provided array against the previous one
        array = array || [];
        options = options || {};
        var isFirstExecution = ko.utils.domData.get(domNode, lastMappingResultDomDataKey) === undefined;
        var lastMappingResult = ko.utils.domData.get(domNode, lastMappingResultDomDataKey) || [];
        var lastArray = ko.utils.arrayMap(lastMappingResult, function (x) { return x.arrayEntry; });
        var editScript = ko.utils.compareArrays(lastArray, array, options['dontLimitMoves']);

        // Build the new mapping result
        var newMappingResult = [];
        var lastMappingResultIndex = 0;
        var newMappingResultIndex = 0;

        var nodesToDelete = [];
        var itemsToProcess = [];
        var itemsForBeforeRemoveCallbacks = [];
        var itemsForMoveCallbacks = [];
        var itemsForAfterAddCallbacks = [];
        var mapData;

        function itemMovedOrRetained(editScriptIndex, oldPosition) {
            mapData = lastMappingResult[oldPosition];
            if (newMappingResultIndex !== oldPosition)
                itemsForMoveCallbacks[editScriptIndex] = mapData;
            // Since updating the index might change the nodes, do so before calling fixUpNodesToBeMovedOrRemoved
            mapData.indexObservable(newMappingResultIndex++);
            fixUpNodesToBeMovedOrRemoved(mapData.mappedNodes);
            newMappingResult.push(mapData);
            itemsToProcess.push(mapData);
        }

        function callCallback(callback, items) {
            if (callback) {
                for (var i = 0, n = items.length; i < n; i++) {
                    if (items[i]) {
                        ko.utils.arrayForEach(items[i].mappedNodes, function(node) {
                            callback(node, i, items[i].arrayEntry);
                        });
                    }
                }
            }
        }

        for (var i = 0, editScriptItem, movedIndex; editScriptItem = editScript[i]; i++) {
            movedIndex = editScriptItem['moved'];
            switch (editScriptItem['status']) {
                case "deleted":
                    if (movedIndex === undefined) {
                        mapData = lastMappingResult[lastMappingResultIndex];

                        // Stop tracking changes to the mapping for these nodes
                        if (mapData.dependentObservable)
                            mapData.dependentObservable.dispose();

                        // Queue these nodes for later removal
                        nodesToDelete.push.apply(nodesToDelete, fixUpNodesToBeMovedOrRemoved(mapData.mappedNodes));
                        if (options['beforeRemove']) {
                            itemsForBeforeRemoveCallbacks[i] = mapData;
                            itemsToProcess.push(mapData);
                        }
                    }
                    lastMappingResultIndex++;
                    break;

                case "retained":
                    itemMovedOrRetained(i, lastMappingResultIndex++);
                    break;

                case "added":
                    if (movedIndex !== undefined) {
                        itemMovedOrRetained(i, movedIndex);
                    } else {
                        mapData = { arrayEntry: editScriptItem['value'], indexObservable: ko.observable(newMappingResultIndex++) };
                        newMappingResult.push(mapData);
                        itemsToProcess.push(mapData);
                        if (!isFirstExecution)
                            itemsForAfterAddCallbacks[i] = mapData;
                    }
                    break;
            }
        }

        // Call beforeMove first before any changes have been made to the DOM
        callCallback(options['beforeMove'], itemsForMoveCallbacks);

        // Next remove nodes for deleted items (or just clean if there's a beforeRemove callback)
        ko.utils.arrayForEach(nodesToDelete, options['beforeRemove'] ? ko.cleanNode : ko.removeNode);

        // Next add/reorder the remaining items (will include deleted items if there's a beforeRemove callback)
        for (var i = 0, nextNode = ko.virtualElements.firstChild(domNode), lastNode, node; mapData = itemsToProcess[i]; i++) {
            // Get nodes for newly added items
            if (!mapData.mappedNodes)
                ko.utils.extend(mapData, mapNodeAndRefreshWhenChanged(domNode, mapping, mapData.arrayEntry, callbackAfterAddingNodes, mapData.indexObservable));

            // Put nodes in the right place if they aren't there already
            for (var j = 0; node = mapData.mappedNodes[j]; nextNode = node.nextSibling, lastNode = node, j++) {
                if (node !== nextNode)
                    ko.virtualElements.insertAfter(domNode, node, lastNode);
            }

            // Run the callbacks for newly added nodes (for example, to apply bindings, etc.)
            if (!mapData.initialized && callbackAfterAddingNodes) {
                callbackAfterAddingNodes(mapData.arrayEntry, mapData.mappedNodes, mapData.indexObservable);
                mapData.initialized = true;
            }
        }

        // If there's a beforeRemove callback, call it after reordering.
        // Note that we assume that the beforeRemove callback will usually be used to remove the nodes using
        // some sort of animation, which is why we first reorder the nodes that will be removed. If the
        // callback instead removes the nodes right away, it would be more efficient to skip reordering them.
        // Perhaps we'll make that change in the future if this scenario becomes more common.
        callCallback(options['beforeRemove'], itemsForBeforeRemoveCallbacks);

        // Finally call afterMove and afterAdd callbacks
        callCallback(options['afterMove'], itemsForMoveCallbacks);
        callCallback(options['afterAdd'], itemsForAfterAddCallbacks);

        // Store a copy of the array items we just considered so we can difference it next time
        ko.utils.domData.set(domNode, lastMappingResultDomDataKey, newMappingResult);
    }
})();

ko.exportSymbol('utils.setDomNodeChildrenFromArrayMapping', ko.utils.setDomNodeChildrenFromArrayMapping);
ko.nativeTemplateEngine = function () {
    this['allowTemplateRewriting'] = false;
}

ko.nativeTemplateEngine.prototype = new ko.templateEngine();
ko.nativeTemplateEngine.prototype.constructor = ko.nativeTemplateEngine;
ko.nativeTemplateEngine.prototype['renderTemplateSource'] = function (templateSource, bindingContext, options) {
    var useNodesIfAvailable = !(ko.utils.ieVersion < 9), // IE<9 cloneNode doesn't work properly
        templateNodesFunc = useNodesIfAvailable ? templateSource['nodes'] : null,
        templateNodes = templateNodesFunc ? templateSource['nodes']() : null;

    if (templateNodes) {
        return ko.utils.makeArray(templateNodes.cloneNode(true).childNodes);
    } else {
        var templateText = templateSource['text']();
        return ko.utils.parseHtmlFragment(templateText);
    }
};

ko.nativeTemplateEngine.instance = new ko.nativeTemplateEngine();
ko.setTemplateEngine(ko.nativeTemplateEngine.instance);

ko.exportSymbol('nativeTemplateEngine', ko.nativeTemplateEngine);
(function() {
    ko.jqueryTmplTemplateEngine = function () {
        // Detect which version of jquery-tmpl you're using. Unfortunately jquery-tmpl
        // doesn't expose a version number, so we have to infer it.
        // Note that as of Knockout 1.3, we only support jQuery.tmpl 1.0.0pre and later,
        // which KO internally refers to as version "2", so older versions are no longer detected.
        var jQueryTmplVersion = this.jQueryTmplVersion = (function() {
            if ((typeof(jQuery) == "undefined") || !(jQuery['tmpl']))
                return 0;
            // Since it exposes no official version number, we use our own numbering system. To be updated as jquery-tmpl evolves.
            try {
                if (jQuery['tmpl']['tag']['tmpl']['open'].toString().indexOf('__') >= 0) {
                    // Since 1.0.0pre, custom tags should append markup to an array called "__"
                    return 2; // Final version of jquery.tmpl
                }
            } catch(ex) { /* Apparently not the version we were looking for */ }

            return 1; // Any older version that we don't support
        })();

        function ensureHasReferencedJQueryTemplates() {
            if (jQueryTmplVersion < 2)
                throw new Error("Your version of jQuery.tmpl is too old. Please upgrade to jQuery.tmpl 1.0.0pre or later.");
        }

        function executeTemplate(compiledTemplate, data, jQueryTemplateOptions) {
            return jQuery['tmpl'](compiledTemplate, data, jQueryTemplateOptions);
        }

        this['renderTemplateSource'] = function(templateSource, bindingContext, options) {
            options = options || {};
            ensureHasReferencedJQueryTemplates();

            // Ensure we have stored a precompiled version of this template (don't want to reparse on every render)
            var precompiled = templateSource['data']('precompiled');
            if (!precompiled) {
                var templateText = templateSource['text']() || "";
                // Wrap in "with($whatever.koBindingContext) { ... }"
                templateText = "{{ko_with $item.koBindingContext}}" + templateText + "{{/ko_with}}";

                precompiled = jQuery['template'](null, templateText);
                templateSource['data']('precompiled', precompiled);
            }

            var data = [bindingContext['$data']]; // Prewrap the data in an array to stop jquery.tmpl from trying to unwrap any arrays
            var jQueryTemplateOptions = jQuery['extend']({ 'koBindingContext': bindingContext }, options['templateOptions']);

            var resultNodes = executeTemplate(precompiled, data, jQueryTemplateOptions);
            resultNodes['appendTo'](document.createElement("div")); // Using "appendTo" forces jQuery/jQuery.tmpl to perform necessary cleanup work

            jQuery['fragments'] = {}; // Clear jQuery's fragment cache to avoid a memory leak after a large number of template renders
            return resultNodes;
        };

        this['createJavaScriptEvaluatorBlock'] = function(script) {
            return "{{ko_code ((function() { return " + script + " })()) }}";
        };

        this['addTemplate'] = function(templateName, templateMarkup) {
            document.write("<script type='text/html' id='" + templateName + "'>" + templateMarkup + "<" + "/script>");
        };

        if (jQueryTmplVersion > 0) {
            jQuery['tmpl']['tag']['ko_code'] = {
                open: "__.push($1 || '');"
            };
            jQuery['tmpl']['tag']['ko_with'] = {
                open: "with($1) {",
                close: "} "
            };
        }
    };

    ko.jqueryTmplTemplateEngine.prototype = new ko.templateEngine();
    ko.jqueryTmplTemplateEngine.prototype.constructor = ko.jqueryTmplTemplateEngine;

    // Use this one by default *only if jquery.tmpl is referenced*
    var jqueryTmplTemplateEngineInstance = new ko.jqueryTmplTemplateEngine();
    if (jqueryTmplTemplateEngineInstance.jQueryTmplVersion > 0)
        ko.setTemplateEngine(jqueryTmplTemplateEngineInstance);

    ko.exportSymbol('jqueryTmplTemplateEngine', ko.jqueryTmplTemplateEngine);
})();
}));
}());
})();

},{}],13:[function(require,module,exports){
// LocationBar module extracted from Backbone.js 1.0.0
// (actually it's commit f6fa0cb87e26bb3d1b7f47144fd720d1ab48e88f)
//
// the dependency on backbone, underscore and jquery have been removed to turn
// this into a small standalone library for handling browser's history API
// cross browser and with a fallback to hashchange events or polling.

(function(define) {
define(function() {

  // 3 helper functions we use to avoid pulling in entire _ and $
  function extend(obj, source) {
    for (var prop in source) {
      obj[prop] = source[prop];
    }
    return obj;
  }
  function on(obj, type, fn) {
    if (obj.attachEvent) {
      obj['e'+type+fn] = fn;
      obj[type+fn] = function(){ obj['e'+type+fn]( window.event ); };
      obj.attachEvent( 'on'+type, obj[type+fn] );
    } else {
      obj.addEventListener( type, fn, false );
    }
  }
  function off(obj, type, fn) {
    if (obj.detachEvent) {
      obj.detachEvent('on'+type, obj[type+fn]);
      obj[type+fn] = null;
    } else {
      obj.removeEventListener(type, fn, false);
    }
  }





  // this is mostly original code with minor modifications, mostyle to avoid
  // dependency on 3rd party libraries + renaming Backbone.History -> LocationBar
  //
  // Backbone.History
  // ----------------

  // Handles cross-browser history management, based on either
  // [pushState](http://diveintohtml5.info/history.html) and real URLs, or
  // [onhashchange](https://developer.mozilla.org/en-US/docs/DOM/window.onhashchange)
  // and URL fragments. If the browser supports neither (old IE, natch),
  // falls back to polling.
  var LocationBar = function() {
    this.handlers = [];

    // MODIFICATION OF ORIGINAL BACKBONE.HISTORY
    //
    // _.bindAll(this, 'checkUrl');
    //
    var self = this;
    var checkUrl = this.checkUrl;
    this.checkUrl = function () {
      checkUrl.apply(self, arguments);
    };

    // Ensure that `LocationBar` can be used outside of the browser.
    if (typeof window !== 'undefined') {
      this.location = window.location;
      this.history = window.history;
    }
  };

  // Cached regex for stripping a leading hash/slash and trailing space.
  var routeStripper = /^[#\/]|\s+$/g;

  // Cached regex for stripping leading and trailing slashes.
  var rootStripper = /^\/+|\/+$/g;

  // Cached regex for detecting MSIE.
  var isExplorer = /msie [\w.]+/;

  // Cached regex for removing a trailing slash.
  var trailingSlash = /\/$/;

  // Cached regex for stripping urls of hash and query.
  var pathStripper = /[?#].*$/;

  // Has the history handling already been started?
  LocationBar.started = false;

  // Set up all inheritable **LocationBar** properties and methods.
  extend(LocationBar.prototype, {

    // The default interval to poll for hash changes, if necessary, is
    // twenty times a second.
    interval: 50,

    // Gets the true hash value. Cannot use location.hash directly due to bug
    // in Firefox where location.hash will always be decoded.
    getHash: function(window) {
      var match = (window || this).location.href.match(/#(.*)$/);
      return match ? match[1] : '';
    },

    // Get the cross-browser normalized URL fragment, either from the URL,
    // the hash, or the override.
    getFragment: function(fragment, forcePushState) {
      if (fragment == null) {
        if (this._hasPushState || !this._wantsHashChange || forcePushState) {
          fragment = this.location.pathname;
          var root = this.root.replace(trailingSlash, '');
          if (!fragment.indexOf(root)) fragment = fragment.slice(root.length);
        } else {
          fragment = this.getHash();
        }
      }
      return fragment.replace(routeStripper, '');
    },

    // Start the hash change handling, returning `true` if the current URL matches
    // an existing route, and `false` otherwise.
    start: function(options) {
      if (LocationBar.started) throw new Error("LocationBar has already been started");
      LocationBar.started = true;

      // Figure out the initial configuration. Do we need an iframe?
      // Is pushState desired ... is it available?
      this.options          = extend({root: '/'}, options);
      this.root             = this.options.root;
      this._wantsHashChange = this.options.hashChange !== false;
      this._wantsPushState  = !!this.options.pushState;
      this._hasPushState    = !!(this.options.pushState && this.history && this.history.pushState);
      var fragment          = this.getFragment();
      var docMode           = document.documentMode;
      var oldIE             = (isExplorer.exec(navigator.userAgent.toLowerCase()) && (!docMode || docMode <= 7));

      // Normalize root to always include a leading and trailing slash.
      this.root = ('/' + this.root + '/').replace(rootStripper, '/');

      if (oldIE && this._wantsHashChange) {
        // MODIFICATION OF ORIGINAL BACKBONE.HISTORY
        //
        // this.iframe = $('<iframe src="javascript:0" tabindex="-1" />').hide().appendTo('body')[0].contentWindow;
        //
        this.iframe = document.createElement("iframe");
        this.iframe.setAttribute("src", "javascript:0");
        this.iframe.setAttribute("tabindex", -1);
        this.iframe.style.display = "none";
        document.body.appendChild(this.iframe);
        this.iframe = this.iframe.contentWindow;
        this.navigate(fragment);
      }

      // Depending on whether we're using pushState or hashes, and whether
      // 'onhashchange' is supported, determine how we check the URL state.
      if (this._hasPushState) {
        on(window, 'popstate', this.checkUrl);
      } else if (this._wantsHashChange && ('onhashchange' in window) && !oldIE) {
        on(window, 'hashchange', this.checkUrl);
      } else if (this._wantsHashChange) {
        this._checkUrlInterval = setInterval(this.checkUrl, this.interval);
      }

      // Determine if we need to change the base url, for a pushState link
      // opened by a non-pushState browser.
      this.fragment = fragment;
      var loc = this.location;
      var atRoot = loc.pathname.replace(/[^\/]$/, '$&/') === this.root;

      // Transition from hashChange to pushState or vice versa if both are
      // requested.
      if (this._wantsHashChange && this._wantsPushState) {

        // If we've started off with a route from a `pushState`-enabled
        // browser, but we're currently in a browser that doesn't support it...
        if (!this._hasPushState && !atRoot) {
          this.fragment = this.getFragment(null, true);
          this.location.replace(this.root + this.location.search + '#' + this.fragment);
          // Return immediately as browser will do redirect to new url
          return true;

        // Or if we've started out with a hash-based route, but we're currently
        // in a browser where it could be `pushState`-based instead...
        } else if (this._hasPushState && atRoot && loc.hash) {
          this.fragment = this.getHash().replace(routeStripper, '');
          this.history.replaceState({}, document.title, this.root + this.fragment + loc.search);
        }

      }

      if (!this.options.silent) return this.loadUrl();
    },

    // Disable Backbone.history, perhaps temporarily. Not useful in a real app,
    // but possibly useful for unit testing Routers.
    stop: function() {
      off(window, 'popstate', this.checkUrl);
      off(window, 'hashchange', this.checkUrl);
      clearInterval(this._checkUrlInterval);
      LocationBar.started = false;
    },

    // Add a route to be tested when the fragment changes. Routes added later
    // may override previous routes.
    route: function(route, callback) {
      this.handlers.unshift({route: route, callback: callback});
    },

    // Checks the current URL to see if it has changed, and if it has,
    // calls `loadUrl`, normalizing across the hidden iframe.
    checkUrl: function() {
      var current = this.getFragment();
      if (current === this.fragment && this.iframe) {
        current = this.getFragment(this.getHash(this.iframe));
      }
      if (current === this.fragment) return false;
      if (this.iframe) this.navigate(current);
      this.loadUrl();
    },

    // Attempt to load the current URL fragment. If a route succeeds with a
    // match, returns `true`. If no defined routes matches the fragment,
    // returns `false`.
    loadUrl: function(fragment) {
      // MODIFICATION OF ORIGINAL BACKBONE.HISTORY
      //
      // return _.any(this.handlers, function(handler) {
      //   if (handler.route.test(fragment)) {
      //     handler.callback(fragment);
      //     return true;
      //   }
      // });
      //
      fragment = this.fragment = this.getFragment(fragment);
      for (var i = 0, l = this.handlers.length; i < l; i++) {
        var handler = this.handlers[i];
        if (handler.route.test(fragment)) {
          handler.callback(fragment);
          return true;
        }
      }
      return false;
    },

    // Save a fragment into the hash history, or replace the URL state if the
    // 'replace' option is passed. You are responsible for properly URL-encoding
    // the fragment in advance.
    //
    // The options object can contain `trigger: true` if you wish to have the
    // route callback be fired (not usually desirable), or `replace: true`, if
    // you wish to modify the current URL without adding an entry to the history.
    navigate: function(fragment, options) {
      if (!LocationBar.started) return false;
      if (!options || options === true) options = {trigger: !!options};

      var url = this.root + (fragment = this.getFragment(fragment || ''));

      // Strip the fragment of the query and hash for matching.
      fragment = fragment.replace(pathStripper, '');

      if (this.fragment === fragment) return;
      this.fragment = fragment;

      // Don't include a trailing slash on the root.
      if (fragment === '' && url !== '/') url = url.slice(0, -1);

      // If pushState is available, we use it to set the fragment as a real URL.
      if (this._hasPushState) {
        this.history[options.replace ? 'replaceState' : 'pushState']({}, document.title, url);

      // If hash changes haven't been explicitly disabled, update the hash
      // fragment to store history.
      } else if (this._wantsHashChange) {
        this._updateHash(this.location, fragment, options.replace);
        if (this.iframe && (fragment !== this.getFragment(this.getHash(this.iframe)))) {
          // Opening and closing the iframe tricks IE7 and earlier to push a
          // history entry on hash-tag change.  When replace is true, we don't
          // want this.
          if(!options.replace) this.iframe.document.open().close();
          this._updateHash(this.iframe.location, fragment, options.replace);
        }

      // If you've told us that you explicitly don't want fallback hashchange-
      // based history, then `navigate` becomes a page refresh.
      } else {
        return this.location.assign(url);
      }
      if (options.trigger) return this.loadUrl(fragment);
    },

    // Update the hash location, either replacing the current entry, or adding
    // a new one to the browser history.
    _updateHash: function(location, fragment, replace) {
      if (replace) {
        var href = location.href.replace(/(javascript:|#).*$/, '');
        location.replace(href + '#' + fragment);
      } else {
        // Some browsers require that `hash` contains a leading #.
        location.hash = '#' + fragment;
      }
    }

  });



  // add some features to LocationBar

  // a more intuitive alias for navigate
  LocationBar.prototype.update = function () {
    this.navigate.apply(this, arguments);
  };

  // a generic callback for any changes
  LocationBar.prototype.onChange = function (callback) {
    this.route(/^(.*?)$/, callback);
  };

  // checks if the browser has pushstate support
  LocationBar.prototype.hasPushState = function () {
    if (!LocationBar.started) {
      throw new Error("only available after locationBar.start()");
    }
    return this._hasPushState;
  };






  // export
  return LocationBar;
});
})(typeof define === 'function' && define.amd ? define : function (factory) { module.exports = factory(require); });
},{}],14:[function(require,module,exports){
/*!
 * mustache.js - Logic-less {{mustache}} templates with JavaScript
 * http://github.com/janl/mustache.js
 */

/*global define: false*/

(function (root, factory) {
  if (typeof exports === "object" && exports) {
    module.exports = factory; // CommonJS
  } else if (typeof define === "function" && define.amd) {
    define(factory); // AMD
  } else {
    root.Mustache = factory; // <script>
  }
}(this, (function () {

  var exports = {};

  exports.name = "mustache.js";
  exports.version = "0.7.2";
  exports.tags = ["{{", "}}"];

  exports.Scanner = Scanner;
  exports.Context = Context;
  exports.Writer = Writer;

  var whiteRe = /\s*/;
  var spaceRe = /\s+/;
  var nonSpaceRe = /\S/;
  var eqRe = /\s*=/;
  var curlyRe = /\s*\}/;
  var tagRe = /#|\^|\/|>|\{|&|=|!/;

  // Workaround for https://issues.apache.org/jira/browse/COUCHDB-577
  // See https://github.com/janl/mustache.js/issues/189
  function testRe(re, string) {
    return RegExp.prototype.test.call(re, string);
  }

  function isWhitespace(string) {
    return !testRe(nonSpaceRe, string);
  }

  var isArray = Array.isArray || function (obj) {
    return Object.prototype.toString.call(obj) === "[object Array]";
  };

  function escapeRe(string) {
    return string.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&");
  }

  var entityMap = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': '&quot;',
    "'": '&#39;',
    "/": '&#x2F;'
  };

  function escapeHtml(string) {
    return String(string).replace(/[&<>"'\/]/g, function (s) {
      return entityMap[s];
    });
  }

  // Export the escaping function so that the user may override it.
  // See https://github.com/janl/mustache.js/issues/244
  exports.escape = escapeHtml;

  function Scanner(string) {
    this.string = string;
    this.tail = string;
    this.pos = 0;
  }

  /**
   * Returns `true` if the tail is empty (end of string).
   */
  Scanner.prototype.eos = function () {
    return this.tail === "";
  };

  /**
   * Tries to match the given regular expression at the current position.
   * Returns the matched text if it can match, the empty string otherwise.
   */
  Scanner.prototype.scan = function (re) {
    var match = this.tail.match(re);

    if (match && match.index === 0) {
      this.tail = this.tail.substring(match[0].length);
      this.pos += match[0].length;
      return match[0];
    }

    return "";
  };

  /**
   * Skips all text until the given regular expression can be matched. Returns
   * the skipped string, which is the entire tail if no match can be made.
   */
  Scanner.prototype.scanUntil = function (re) {
    var match, pos = this.tail.search(re);

    switch (pos) {
    case -1:
      match = this.tail;
      this.pos += this.tail.length;
      this.tail = "";
      break;
    case 0:
      match = "";
      break;
    default:
      match = this.tail.substring(0, pos);
      this.tail = this.tail.substring(pos);
      this.pos += pos;
    }

    return match;
  };

  function Context(view, parent) {
    this.view = view;
    this.parent = parent;
    this.clearCache();
  }

  Context.make = function (view) {
    return (view instanceof Context) ? view : new Context(view);
  };

  Context.prototype.clearCache = function () {
    this._cache = {};
  };

  Context.prototype.push = function (view) {
    return new Context(view, this);
  };

  Context.prototype.lookup = function (name) {
    var value = this._cache[name];

    if (!value) {
      if (name === ".") {
        value = this.view;
      } else {
        var context = this;

        while (context) {
          if (name.indexOf(".") > 0) {
            var names = name.split("."), i = 0;

            value = context.view;

            while (value && i < names.length) {
              value = value[names[i++]];
            }
          } else {
            value = context.view[name];
          }

          if (value != null) {
            break;
          }

          context = context.parent;
        }
      }

      this._cache[name] = value;
    }

    if (typeof value === "function") {
      value = value.call(this.view);
    }

    return value;
  };

  function Writer() {
    this.clearCache();
  }

  Writer.prototype.clearCache = function () {
    this._cache = {};
    this._partialCache = {};
  };

  Writer.prototype.compile = function (template, tags) {
    var fn = this._cache[template];

    if (!fn) {
      var tokens = exports.parse(template, tags);
      fn = this._cache[template] = this.compileTokens(tokens, template);
    }

    return fn;
  };

  Writer.prototype.compilePartial = function (name, template, tags) {
    var fn = this.compile(template, tags);
    this._partialCache[name] = fn;
    return fn;
  };

  Writer.prototype.compileTokens = function (tokens, template) {
    var fn = compileTokens(tokens);
    var self = this;

    return function (view, partials) {
      if (partials) {
        if (typeof partials === "function") {
          self._loadPartial = partials;
        } else {
          for (var name in partials) {
            self.compilePartial(name, partials[name]);
          }
        }
      }

      return fn(self, Context.make(view), template);
    };
  };

  Writer.prototype.render = function (template, view, partials) {
    return this.compile(template)(view, partials);
  };

  Writer.prototype._section = function (name, context, text, callback) {
    var value = context.lookup(name);

    switch (typeof value) {
    case "object":
      if (isArray(value)) {
        var buffer = "";

        for (var i = 0, len = value.length; i < len; ++i) {
          buffer += callback(this, context.push(value[i]));
        }

        return buffer;
      }

      return value ? callback(this, context.push(value)) : "";
    case "function":
      var self = this;
      var scopedRender = function (template) {
        return self.render(template, context);
      };

      var result = value.call(context.view, text, scopedRender);
      return result != null ? result : "";
    default:
      if (value) {
        return callback(this, context);
      }
    }

    return "";
  };

  Writer.prototype._inverted = function (name, context, callback) {
    var value = context.lookup(name);

    // Use JavaScript's definition of falsy. Include empty arrays.
    // See https://github.com/janl/mustache.js/issues/186
    if (!value || (isArray(value) && value.length === 0)) {
      return callback(this, context);
    }

    return "";
  };

  Writer.prototype._partial = function (name, context) {
    if (!(name in this._partialCache) && this._loadPartial) {
      this.compilePartial(name, this._loadPartial(name));
    }

    var fn = this._partialCache[name];

    return fn ? fn(context) : "";
  };

  Writer.prototype._name = function (name, context) {
    var value = context.lookup(name);

    if (typeof value === "function") {
      value = value.call(context.view);
    }

    return (value == null) ? "" : String(value);
  };

  Writer.prototype._escaped = function (name, context) {
    return exports.escape(this._name(name, context));
  };

  /**
   * Low-level function that compiles the given `tokens` into a function
   * that accepts three arguments: a Writer, a Context, and the template.
   */
  function compileTokens(tokens) {
    var subRenders = {};

    function subRender(i, tokens, template) {
      if (!subRenders[i]) {
        var fn = compileTokens(tokens);
        subRenders[i] = function (writer, context) {
          return fn(writer, context, template);
        };
      }

      return subRenders[i];
    }

    return function (writer, context, template) {
      var buffer = "";
      var token, sectionText;

      for (var i = 0, len = tokens.length; i < len; ++i) {
        token = tokens[i];

        switch (token[0]) {
        case "#":
          sectionText = template.slice(token[3], token[5]);
          buffer += writer._section(token[1], context, sectionText, subRender(i, token[4], template));
          break;
        case "^":
          buffer += writer._inverted(token[1], context, subRender(i, token[4], template));
          break;
        case ">":
          buffer += writer._partial(token[1], context);
          break;
        case "&":
          buffer += writer._name(token[1], context);
          break;
        case "name":
          buffer += writer._escaped(token[1], context);
          break;
        case "text":
          buffer += token[1];
          break;
        }
      }

      return buffer;
    };
  }

  /**
   * Forms the given array of `tokens` into a nested tree structure where
   * tokens that represent a section have two additional items: 1) an array of
   * all tokens that appear in that section and 2) the index in the original
   * template that represents the end of that section.
   */
  function nestTokens(tokens) {
    var tree = [];
    var collector = tree;
    var sections = [];

    var token;
    for (var i = 0, len = tokens.length; i < len; ++i) {
      token = tokens[i];
      switch (token[0]) {
      case '#':
      case '^':
        sections.push(token);
        collector.push(token);
        collector = token[4] = [];
        break;
      case '/':
        var section = sections.pop();
        section[5] = token[2];
        collector = sections.length > 0 ? sections[sections.length - 1][4] : tree;
        break;
      default:
        collector.push(token);
      }
    }

    return tree;
  }

  /**
   * Combines the values of consecutive text tokens in the given `tokens` array
   * to a single token.
   */
  function squashTokens(tokens) {
    var squashedTokens = [];

    var token, lastToken;
    for (var i = 0, len = tokens.length; i < len; ++i) {
      token = tokens[i];
      if (token[0] === 'text' && lastToken && lastToken[0] === 'text') {
        lastToken[1] += token[1];
        lastToken[3] = token[3];
      } else {
        lastToken = token;
        squashedTokens.push(token);
      }
    }

    return squashedTokens;
  }

  function escapeTags(tags) {
    return [
      new RegExp(escapeRe(tags[0]) + "\\s*"),
      new RegExp("\\s*" + escapeRe(tags[1]))
    ];
  }

  /**
   * Breaks up the given `template` string into a tree of token objects. If
   * `tags` is given here it must be an array with two string values: the
   * opening and closing tags used in the template (e.g. ["<%", "%>"]). Of
   * course, the default is to use mustaches (i.e. Mustache.tags).
   */
  exports.parse = function (template, tags) {
    template = template || '';
    tags = tags || exports.tags;

    if (typeof tags === 'string') tags = tags.split(spaceRe);
    if (tags.length !== 2) {
      throw new Error('Invalid tags: ' + tags.join(', '));
    }

    var tagRes = escapeTags(tags);
    var scanner = new Scanner(template);

    var sections = [];     // Stack to hold section tokens
    var tokens = [];       // Buffer to hold the tokens
    var spaces = [];       // Indices of whitespace tokens on the current line
    var hasTag = false;    // Is there a {{tag}} on the current line?
    var nonSpace = false;  // Is there a non-space char on the current line?

    // Strips all whitespace tokens array for the current line
    // if there was a {{#tag}} on it and otherwise only space.
    function stripSpace() {
      if (hasTag && !nonSpace) {
        while (spaces.length) {
          tokens.splice(spaces.pop(), 1);
        }
      } else {
        spaces = [];
      }

      hasTag = false;
      nonSpace = false;
    }

    var start, type, value, chr;
    while (!scanner.eos()) {
      start = scanner.pos;
      value = scanner.scanUntil(tagRes[0]);

      if (value) {
        for (var i = 0, len = value.length; i < len; ++i) {
          chr = value.charAt(i);

          if (isWhitespace(chr)) {
            spaces.push(tokens.length);
          } else {
            nonSpace = true;
          }

          tokens.push(["text", chr, start, start + 1]);
          start += 1;

          if (chr === "\n") {
            stripSpace(); // Check for whitespace on the current line.
          }
        }
      }

      start = scanner.pos;

      // Match the opening tag.
      if (!scanner.scan(tagRes[0])) {
        break;
      }

      hasTag = true;
      type = scanner.scan(tagRe) || "name";

      // Skip any whitespace between tag and value.
      scanner.scan(whiteRe);

      // Extract the tag value.
      if (type === "=") {
        value = scanner.scanUntil(eqRe);
        scanner.scan(eqRe);
        scanner.scanUntil(tagRes[1]);
      } else if (type === "{") {
        var closeRe = new RegExp("\\s*" + escapeRe("}" + tags[1]));
        value = scanner.scanUntil(closeRe);
        scanner.scan(curlyRe);
        scanner.scanUntil(tagRes[1]);
        type = "&";
      } else {
        value = scanner.scanUntil(tagRes[1]);
      }

      // Match the closing tag.
      if (!scanner.scan(tagRes[1])) {
        throw new Error('Unclosed tag at ' + scanner.pos);
      }

      // Check section nesting.
      if (type === '/') {
        if (sections.length === 0) {
          throw new Error('Unopened section "' + value + '" at ' + start);
        }

        var section = sections.pop();

        if (section[1] !== value) {
          throw new Error('Unclosed section "' + section[1] + '" at ' + start);
        }
      }

      var token = [type, value, start, scanner.pos];
      tokens.push(token);

      if (type === '#' || type === '^') {
        sections.push(token);
      } else if (type === "name" || type === "{" || type === "&") {
        nonSpace = true;
      } else if (type === "=") {
        // Set the tags for the next time around.
        tags = value.split(spaceRe);

        if (tags.length !== 2) {
          throw new Error('Invalid tags at ' + start + ': ' + tags.join(', '));
        }

        tagRes = escapeTags(tags);
      }
    }

    // Make sure there are no open sections when we're done.
    var section = sections.pop();
    if (section) {
      throw new Error('Unclosed section "' + section[1] + '" at ' + scanner.pos);
    }

    return nestTokens(squashTokens(tokens));
  };

  // The high-level clearCache, compile, compilePartial, and render functions
  // use this default writer.
  var _writer = new Writer();

  /**
   * Clears all cached templates and partials in the default writer.
   */
  exports.clearCache = function () {
    return _writer.clearCache();
  };

  /**
   * Compiles the given `template` to a reusable function using the default
   * writer.
   */
  exports.compile = function (template, tags) {
    return _writer.compile(template, tags);
  };

  /**
   * Compiles the partial with the given `name` and `template` to a reusable
   * function using the default writer.
   */
  exports.compilePartial = function (name, template, tags) {
    return _writer.compilePartial(name, template, tags);
  };

  /**
   * Compiles the given array of tokens (the output of a parse) to a reusable
   * function using the default writer.
   */
  exports.compileTokens = function (tokens, template) {
    return _writer.compileTokens(tokens, template);
  };

  /**
   * Renders the `template` with the given `view` and `partials` using the
   * default writer.
   */
  exports.render = function (template, view, partials) {
    return _writer.render(template, view, partials);
  };

  // This is here for backwards compatibility with 0.4.x.
  exports.to_html = function (template, view, partials, send) {
    var result = exports.render(template, view, partials);

    if (typeof send === "function") {
      send(result);
    } else {
      return result;
    }
  };

  return exports;

}())));

},{}],15:[function(require,module,exports){
//     Underscore.js 1.5.2
//     http://underscorejs.org
//     (c) 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `exports` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Establish the object that gets returned to break out of a loop iteration.
  var breaker = {};

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var
    push             = ArrayProto.push,
    slice            = ArrayProto.slice,
    concat           = ArrayProto.concat,
    toString         = ObjProto.toString,
    hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeForEach      = ArrayProto.forEach,
    nativeMap          = ArrayProto.map,
    nativeReduce       = ArrayProto.reduce,
    nativeReduceRight  = ArrayProto.reduceRight,
    nativeFilter       = ArrayProto.filter,
    nativeEvery        = ArrayProto.every,
    nativeSome         = ArrayProto.some,
    nativeIndexOf      = ArrayProto.indexOf,
    nativeLastIndexOf  = ArrayProto.lastIndexOf,
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind;

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object via a string identifier,
  // for Closure Compiler "advanced" mode.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.5.2';

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles objects with the built-in `forEach`, arrays, and raw objects.
  // Delegates to **ECMAScript 5**'s native `forEach` if available.
  var each = _.each = _.forEach = function(obj, iterator, context) {
    if (obj == null) return;
    if (nativeForEach && obj.forEach === nativeForEach) {
      obj.forEach(iterator, context);
    } else if (obj.length === +obj.length) {
      for (var i = 0, length = obj.length; i < length; i++) {
        if (iterator.call(context, obj[i], i, obj) === breaker) return;
      }
    } else {
      var keys = _.keys(obj);
      for (var i = 0, length = keys.length; i < length; i++) {
        if (iterator.call(context, obj[keys[i]], keys[i], obj) === breaker) return;
      }
    }
  };

  // Return the results of applying the iterator to each element.
  // Delegates to **ECMAScript 5**'s native `map` if available.
  _.map = _.collect = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
    each(obj, function(value, index, list) {
      results.push(iterator.call(context, value, index, list));
    });
    return results;
  };

  var reduceError = 'Reduce of empty array with no initial value';

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
  _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduce && obj.reduce === nativeReduce) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
    }
    each(obj, function(value, index, list) {
      if (!initial) {
        memo = value;
        initial = true;
      } else {
        memo = iterator.call(context, memo, value, index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // The right-associative version of reduce, also known as `foldr`.
  // Delegates to **ECMAScript 5**'s native `reduceRight` if available.
  _.reduceRight = _.foldr = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
    }
    var length = obj.length;
    if (length !== +length) {
      var keys = _.keys(obj);
      length = keys.length;
    }
    each(obj, function(value, index, list) {
      index = keys ? keys[--length] : --length;
      if (!initial) {
        memo = obj[index];
        initial = true;
      } else {
        memo = iterator.call(context, memo, obj[index], index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, iterator, context) {
    var result;
    any(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) {
        result = value;
        return true;
      }
    });
    return result;
  };

  // Return all the elements that pass a truth test.
  // Delegates to **ECMAScript 5**'s native `filter` if available.
  // Aliased as `select`.
  _.filter = _.select = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeFilter && obj.filter === nativeFilter) return obj.filter(iterator, context);
    each(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) results.push(value);
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, iterator, context) {
    return _.filter(obj, function(value, index, list) {
      return !iterator.call(context, value, index, list);
    }, context);
  };

  // Determine whether all of the elements match a truth test.
  // Delegates to **ECMAScript 5**'s native `every` if available.
  // Aliased as `all`.
  _.every = _.all = function(obj, iterator, context) {
    iterator || (iterator = _.identity);
    var result = true;
    if (obj == null) return result;
    if (nativeEvery && obj.every === nativeEvery) return obj.every(iterator, context);
    each(obj, function(value, index, list) {
      if (!(result = result && iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if at least one element in the object matches a truth test.
  // Delegates to **ECMAScript 5**'s native `some` if available.
  // Aliased as `any`.
  var any = _.some = _.any = function(obj, iterator, context) {
    iterator || (iterator = _.identity);
    var result = false;
    if (obj == null) return result;
    if (nativeSome && obj.some === nativeSome) return obj.some(iterator, context);
    each(obj, function(value, index, list) {
      if (result || (result = iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if the array or object contains a given value (using `===`).
  // Aliased as `include`.
  _.contains = _.include = function(obj, target) {
    if (obj == null) return false;
    if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
    return any(obj, function(value) {
      return value === target;
    });
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      return (isFunc ? method : value[method]).apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, function(value){ return value[key]; });
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs, first) {
    if (_.isEmpty(attrs)) return first ? void 0 : [];
    return _[first ? 'find' : 'filter'](obj, function(value) {
      for (var key in attrs) {
        if (attrs[key] !== value[key]) return false;
      }
      return true;
    });
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.where(obj, attrs, true);
  };

  // Return the maximum element or (element-based computation).
  // Can't optimize arrays of integers longer than 65,535 elements.
  // See [WebKit Bug 80797](https://bugs.webkit.org/show_bug.cgi?id=80797)
  _.max = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.max.apply(Math, obj);
    }
    if (!iterator && _.isEmpty(obj)) return -Infinity;
    var result = {computed : -Infinity, value: -Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed > result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.min.apply(Math, obj);
    }
    if (!iterator && _.isEmpty(obj)) return Infinity;
    var result = {computed : Infinity, value: Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed < result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Shuffle an array, using the modern version of the 
  // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
  _.shuffle = function(obj) {
    var rand;
    var index = 0;
    var shuffled = [];
    each(obj, function(value) {
      rand = _.random(index++);
      shuffled[index - 1] = shuffled[rand];
      shuffled[rand] = value;
    });
    return shuffled;
  };

  // Sample **n** random values from an array.
  // If **n** is not specified, returns a single random element from the array.
  // The internal `guard` argument allows it to work with `map`.
  _.sample = function(obj, n, guard) {
    if (arguments.length < 2 || guard) {
      return obj[_.random(obj.length - 1)];
    }
    return _.shuffle(obj).slice(0, Math.max(0, n));
  };

  // An internal function to generate lookup iterators.
  var lookupIterator = function(value) {
    return _.isFunction(value) ? value : function(obj){ return obj[value]; };
  };

  // Sort the object's values by a criterion produced by an iterator.
  _.sortBy = function(obj, value, context) {
    var iterator = lookupIterator(value);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value: value,
        index: index,
        criteria: iterator.call(context, value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index - right.index;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(behavior) {
    return function(obj, value, context) {
      var result = {};
      var iterator = value == null ? _.identity : lookupIterator(value);
      each(obj, function(value, index) {
        var key = iterator.call(context, value, index, obj);
        behavior(result, key, value);
      });
      return result;
    };
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = group(function(result, key, value) {
    (_.has(result, key) ? result[key] : (result[key] = [])).push(value);
  });

  // Indexes the object's values by a criterion, similar to `groupBy`, but for
  // when you know that your index values will be unique.
  _.indexBy = group(function(result, key, value) {
    result[key] = value;
  });

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = group(function(result, key) {
    _.has(result, key) ? result[key]++ : result[key] = 1;
  });

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iterator, context) {
    iterator = iterator == null ? _.identity : lookupIterator(iterator);
    var value = iterator.call(context, obj);
    var low = 0, high = array.length;
    while (low < high) {
      var mid = (low + high) >>> 1;
      iterator.call(context, array[mid]) < value ? low = mid + 1 : high = mid;
    }
    return low;
  };

  // Safely create a real, live array from anything iterable.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (obj.length === +obj.length) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return (obj.length === +obj.length) ? obj.length : _.keys(obj).length;
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    return (n == null) || guard ? array[0] : slice.call(array, 0, n);
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N. The **guard** check allows it to work with
  // `_.map`.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, array.length - ((n == null) || guard ? 1 : n));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array. The **guard** check allows it to work with `_.map`.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if ((n == null) || guard) {
      return array[array.length - 1];
    } else {
      return slice.call(array, Math.max(array.length - n, 0));
    }
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array. The **guard**
  // check allows it to work with `_.map`.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, (n == null) || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, output) {
    if (shallow && _.every(input, _.isArray)) {
      return concat.apply(output, input);
    }
    each(input, function(value) {
      if (_.isArray(value) || _.isArguments(value)) {
        shallow ? push.apply(output, value) : flatten(value, shallow, output);
      } else {
        output.push(value);
      }
    });
    return output;
  };

  // Flatten out an array, either recursively (by default), or just one level.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, []);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iterator, context) {
    if (_.isFunction(isSorted)) {
      context = iterator;
      iterator = isSorted;
      isSorted = false;
    }
    var initial = iterator ? _.map(array, iterator, context) : array;
    var results = [];
    var seen = [];
    each(initial, function(value, index) {
      if (isSorted ? (!index || seen[seen.length - 1] !== value) : !_.contains(seen, value)) {
        seen.push(value);
        results.push(array[index]);
      }
    });
    return results;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(_.flatten(arguments, true));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    var rest = slice.call(arguments, 1);
    return _.filter(_.uniq(array), function(item) {
      return _.every(rest, function(other) {
        return _.indexOf(other, item) >= 0;
      });
    });
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = concat.apply(ArrayProto, slice.call(arguments, 1));
    return _.filter(array, function(value){ return !_.contains(rest, value); });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    var length = _.max(_.pluck(arguments, "length").concat(0));
    var results = new Array(length);
    for (var i = 0; i < length; i++) {
      results[i] = _.pluck(arguments, '' + i);
    }
    return results;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    if (list == null) return {};
    var result = {};
    for (var i = 0, length = list.length; i < length; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
  // we need this function. Return the position of the first occurrence of an
  // item in an array, or -1 if the item is not included in the array.
  // Delegates to **ECMAScript 5**'s native `indexOf` if available.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = function(array, item, isSorted) {
    if (array == null) return -1;
    var i = 0, length = array.length;
    if (isSorted) {
      if (typeof isSorted == 'number') {
        i = (isSorted < 0 ? Math.max(0, length + isSorted) : isSorted);
      } else {
        i = _.sortedIndex(array, item);
        return array[i] === item ? i : -1;
      }
    }
    if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item, isSorted);
    for (; i < length; i++) if (array[i] === item) return i;
    return -1;
  };

  // Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.
  _.lastIndexOf = function(array, item, from) {
    if (array == null) return -1;
    var hasIndex = from != null;
    if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) {
      return hasIndex ? array.lastIndexOf(item, from) : array.lastIndexOf(item);
    }
    var i = (hasIndex ? from : array.length);
    while (i--) if (array[i] === item) return i;
    return -1;
  };

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (arguments.length <= 1) {
      stop = start || 0;
      start = 0;
    }
    step = arguments[2] || 1;

    var length = Math.max(Math.ceil((stop - start) / step), 0);
    var idx = 0;
    var range = new Array(length);

    while(idx < length) {
      range[idx++] = start;
      start += step;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Reusable constructor function for prototype setting.
  var ctor = function(){};

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    var args, bound;
    if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError;
    args = slice.call(arguments, 2);
    return bound = function() {
      if (!(this instanceof bound)) return func.apply(context, args.concat(slice.call(arguments)));
      ctor.prototype = func.prototype;
      var self = new ctor;
      ctor.prototype = null;
      var result = func.apply(self, args.concat(slice.call(arguments)));
      if (Object(result) === result) return result;
      return self;
    };
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context.
  _.partial = function(func) {
    var args = slice.call(arguments, 1);
    return function() {
      return func.apply(this, args.concat(slice.call(arguments)));
    };
  };

  // Bind all of an object's methods to that object. Useful for ensuring that
  // all callbacks defined on an object belong to it.
  _.bindAll = function(obj) {
    var funcs = slice.call(arguments, 1);
    if (funcs.length === 0) throw new Error("bindAll must be passed function names");
    each(funcs, function(f) { obj[f] = _.bind(obj[f], obj); });
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memo = {};
    hasher || (hasher = _.identity);
    return function() {
      var key = hasher.apply(this, arguments);
      return _.has(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
    };
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){ return func.apply(null, args); }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = function(func) {
    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
  };

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time. Normally, the throttled function will run
  // as much as it can, without ever going more than once per `wait` duration;
  // but if you'd like to disable the execution on the leading edge, pass
  // `{leading: false}`. To disable execution on the trailing edge, ditto.
  _.throttle = function(func, wait, options) {
    var context, args, result;
    var timeout = null;
    var previous = 0;
    options || (options = {});
    var later = function() {
      previous = options.leading === false ? 0 : new Date;
      timeout = null;
      result = func.apply(context, args);
    };
    return function() {
      var now = new Date;
      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0) {
        clearTimeout(timeout);
        timeout = null;
        previous = now;
        result = func.apply(context, args);
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, args, context, timestamp, result;
    return function() {
      context = this;
      args = arguments;
      timestamp = new Date();
      var later = function() {
        var last = (new Date()) - timestamp;
        if (last < wait) {
          timeout = setTimeout(later, wait - last);
        } else {
          timeout = null;
          if (!immediate) result = func.apply(context, args);
        }
      };
      var callNow = immediate && !timeout;
      if (!timeout) {
        timeout = setTimeout(later, wait);
      }
      if (callNow) result = func.apply(context, args);
      return result;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = function(func) {
    var ran = false, memo;
    return function() {
      if (ran) return memo;
      ran = true;
      memo = func.apply(this, arguments);
      func = null;
      return memo;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return function() {
      var args = [func];
      push.apply(args, arguments);
      return wrapper.apply(this, args);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var funcs = arguments;
    return function() {
      var args = arguments;
      for (var i = funcs.length - 1; i >= 0; i--) {
        args = [funcs[i].apply(this, args)];
      }
      return args[0];
    };
  };

  // Returns a function that will only be executed after being called N times.
  _.after = function(times, func) {
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Object Functions
  // ----------------

  // Retrieve the names of an object's properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = nativeKeys || function(obj) {
    if (obj !== Object(obj)) throw new TypeError('Invalid object');
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys.push(key);
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var values = new Array(length);
    for (var i = 0; i < length; i++) {
      values[i] = obj[keys[i]];
    }
    return values;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var pairs = new Array(length);
    for (var i = 0; i < length; i++) {
      pairs[i] = [keys[i], obj[keys[i]]];
    }
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    var keys = _.keys(obj);
    for (var i = 0, length = keys.length; i < length; i++) {
      result[obj[keys[i]]] = keys[i];
    }
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    each(keys, function(key) {
      if (key in obj) copy[key] = obj[key];
    });
    return copy;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    for (var key in obj) {
      if (!_.contains(keys, key)) copy[key] = obj[key];
    }
    return copy;
  };

  // Fill in a given object with default properties.
  _.defaults = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          if (obj[prop] === void 0) obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
    if (a === b) return a !== 0 || 1 / a == 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className != toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, dates, and booleans are compared by value.
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return a == String(b);
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
        // other numeric values.
        return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b);
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a == +b;
      // RegExps are compared by their source patterns and flags.
      case '[object RegExp]':
        return a.source == b.source &&
               a.global == b.global &&
               a.multiline == b.multiline &&
               a.ignoreCase == b.ignoreCase;
    }
    if (typeof a != 'object' || typeof b != 'object') return false;
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] == a) return bStack[length] == b;
    }
    // Objects with different constructors are not equivalent, but `Object`s
    // from different frames are.
    var aCtor = a.constructor, bCtor = b.constructor;
    if (aCtor !== bCtor && !(_.isFunction(aCtor) && (aCtor instanceof aCtor) &&
                             _.isFunction(bCtor) && (bCtor instanceof bCtor))) {
      return false;
    }
    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);
    var size = 0, result = true;
    // Recursively compare objects and arrays.
    if (className == '[object Array]') {
      // Compare array lengths to determine if a deep comparison is necessary.
      size = a.length;
      result = size == b.length;
      if (result) {
        // Deep compare the contents, ignoring non-numeric properties.
        while (size--) {
          if (!(result = eq(a[size], b[size], aStack, bStack))) break;
        }
      }
    } else {
      // Deep compare objects.
      for (var key in a) {
        if (_.has(a, key)) {
          // Count the expected number of properties.
          size++;
          // Deep compare each member.
          if (!(result = _.has(b, key) && eq(a[key], b[key], aStack, bStack))) break;
        }
      }
      // Ensure that both objects contain the same number of properties.
      if (result) {
        for (key in b) {
          if (_.has(b, key) && !(size--)) break;
        }
        result = !size;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return result;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b, [], []);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
    for (var key in obj) if (_.has(obj, key)) return false;
    return true;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) == '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    return obj === Object(obj);
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp.
  each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) == '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return !!(obj && _.has(obj, 'callee'));
    };
  }

  // Optimize `isFunction` if appropriate.
  if (typeof (/./) !== 'function') {
    _.isFunction = function(obj) {
      return typeof obj === 'function';
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj != +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iterators.
  _.identity = function(value) {
    return value;
  };

  // Run a function **n** times.
  _.times = function(n, iterator, context) {
    var accum = Array(Math.max(0, n));
    for (var i = 0; i < n; i++) accum[i] = iterator.call(context, i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // List of HTML entities for escaping.
  var entityMap = {
    escape: {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;'
    }
  };
  entityMap.unescape = _.invert(entityMap.escape);

  // Regexes containing the keys and values listed immediately above.
  var entityRegexes = {
    escape:   new RegExp('[' + _.keys(entityMap.escape).join('') + ']', 'g'),
    unescape: new RegExp('(' + _.keys(entityMap.unescape).join('|') + ')', 'g')
  };

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  _.each(['escape', 'unescape'], function(method) {
    _[method] = function(string) {
      if (string == null) return '';
      return ('' + string).replace(entityRegexes[method], function(match) {
        return entityMap[method][match];
      });
    };
  });

  // If the value of the named `property` is a function then invoke it with the
  // `object` as context; otherwise, return it.
  _.result = function(object, property) {
    if (object == null) return void 0;
    var value = object[property];
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    each(_.functions(obj), function(name) {
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result.call(this, func.apply(_, args));
      };
    });
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\t':     't',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  _.template = function(text, data, settings) {
    var render;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = new RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset)
        .replace(escaper, function(match) { return '\\' + escapes[match]; });

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      }
      if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      }
      if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }
      index = offset + match.length;
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + "return __p;\n";

    try {
      render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    if (data) return render(data, _);
    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled function source as a convenience for precompilation.
    template.source = 'function(' + (settings.variable || 'obj') + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function, which will delegate to the wrapper.
  _.chain = function(obj) {
    return _(obj).chain();
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(obj) {
    return this._chain ? _(obj).chain() : obj;
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name == 'shift' || name == 'splice') && obj.length === 0) delete obj[0];
      return result.call(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result.call(this, method.apply(this._wrapped, arguments));
    };
  });

  _.extend(_.prototype, {

    // Start chaining a wrapped Underscore object.
    chain: function() {
      this._chain = true;
      return this;
    },

    // Extracts the result from a wrapped and chained object.
    value: function() {
      return this._wrapped;
    }

  });

}).call(this);

},{}],16:[function(require,module,exports){
module.exports = {
  banks: [ "spv", "fana", "lloyds" ],
  customers: [
    { bank: "spv", name: "bob" , desc: "bob is a late payer"},
    { bank: "fana", name: "alice", desc: "alice always pays on time"},
    { bank: "lloyds", name: "craig", desc: "craig is chillin on sunday"  },
    { bank: "fana", name: "david" },
    { bank: "spv", name: "ella" },
    { bank: "fana", name: "frank" },
    { bank: "spv", name: "george" },
    { bank: "fana", name: "hannah" },
    { bank: "fana", name: "jane" },
    { bank: "lloyds", name: "kris" },
    { bank: "spv", name: "james" }
  ]
}

},{}],17:[function(require,module,exports){


//
// The shims in this file are not fully implemented shims for the ES5
// features, but do work for the particular usecases there is in
// the other modules.
//

var toString = Object.prototype.toString;
var hasOwnProperty = Object.prototype.hasOwnProperty;

// Array.isArray is supported in IE9
function isArray(xs) {
  return toString.call(xs) === '[object Array]';
}
exports.isArray = typeof Array.isArray === 'function' ? Array.isArray : isArray;

// Array.prototype.indexOf is supported in IE9
exports.indexOf = function indexOf(xs, x) {
  if (xs.indexOf) return xs.indexOf(x);
  for (var i = 0; i < xs.length; i++) {
    if (x === xs[i]) return i;
  }
  return -1;
};

// Array.prototype.filter is supported in IE9
exports.filter = function filter(xs, fn) {
  if (xs.filter) return xs.filter(fn);
  var res = [];
  for (var i = 0; i < xs.length; i++) {
    if (fn(xs[i], i, xs)) res.push(xs[i]);
  }
  return res;
};

// Array.prototype.forEach is supported in IE9
exports.forEach = function forEach(xs, fn, self) {
  if (xs.forEach) return xs.forEach(fn, self);
  for (var i = 0; i < xs.length; i++) {
    fn.call(self, xs[i], i, xs);
  }
};

// Array.prototype.map is supported in IE9
exports.map = function map(xs, fn) {
  if (xs.map) return xs.map(fn);
  var out = new Array(xs.length);
  for (var i = 0; i < xs.length; i++) {
    out[i] = fn(xs[i], i, xs);
  }
  return out;
};

// Array.prototype.reduce is supported in IE9
exports.reduce = function reduce(array, callback, opt_initialValue) {
  if (array.reduce) return array.reduce(callback, opt_initialValue);
  var value, isValueSet = false;

  if (2 < arguments.length) {
    value = opt_initialValue;
    isValueSet = true;
  }
  for (var i = 0, l = array.length; l > i; ++i) {
    if (array.hasOwnProperty(i)) {
      if (isValueSet) {
        value = callback(value, array[i], i, array);
      }
      else {
        value = array[i];
        isValueSet = true;
      }
    }
  }

  return value;
};

// String.prototype.substr - negative index don't work in IE8
if ('ab'.substr(-1) !== 'b') {
  exports.substr = function (str, start, length) {
    // did we get a negative start, calculate how much it is from the beginning of the string
    if (start < 0) start = str.length + start;

    // call the original function
    return str.substr(start, length);
  };
} else {
  exports.substr = function (str, start, length) {
    return str.substr(start, length);
  };
}

// String.prototype.trim is supported in IE9
exports.trim = function (str) {
  if (str.trim) return str.trim();
  return str.replace(/^\s+|\s+$/g, '');
};

// Function.prototype.bind is supported in IE9
exports.bind = function () {
  var args = Array.prototype.slice.call(arguments);
  var fn = args.shift();
  if (fn.bind) return fn.bind.apply(fn, args);
  var self = args.shift();
  return function () {
    fn.apply(self, args.concat([Array.prototype.slice.call(arguments)]));
  };
};

// Object.create is supported in IE9
function create(prototype, properties) {
  var object;
  if (prototype === null) {
    object = { '__proto__' : null };
  }
  else {
    if (typeof prototype !== 'object') {
      throw new TypeError(
        'typeof prototype[' + (typeof prototype) + '] != \'object\''
      );
    }
    var Type = function () {};
    Type.prototype = prototype;
    object = new Type();
    object.__proto__ = prototype;
  }
  if (typeof properties !== 'undefined' && Object.defineProperties) {
    Object.defineProperties(object, properties);
  }
  return object;
}
exports.create = typeof Object.create === 'function' ? Object.create : create;

// Object.keys and Object.getOwnPropertyNames is supported in IE9 however
// they do show a description and number property on Error objects
function notObject(object) {
  return ((typeof object != "object" && typeof object != "function") || object === null);
}

function keysShim(object) {
  if (notObject(object)) {
    throw new TypeError("Object.keys called on a non-object");
  }

  var result = [];
  for (var name in object) {
    if (hasOwnProperty.call(object, name)) {
      result.push(name);
    }
  }
  return result;
}

// getOwnPropertyNames is almost the same as Object.keys one key feature
//  is that it returns hidden properties, since that can't be implemented,
//  this feature gets reduced so it just shows the length property on arrays
function propertyShim(object) {
  if (notObject(object)) {
    throw new TypeError("Object.getOwnPropertyNames called on a non-object");
  }

  var result = keysShim(object);
  if (exports.isArray(object) && exports.indexOf(object, 'length') === -1) {
    result.push('length');
  }
  return result;
}

var keys = typeof Object.keys === 'function' ? Object.keys : keysShim;
var getOwnPropertyNames = typeof Object.getOwnPropertyNames === 'function' ?
  Object.getOwnPropertyNames : propertyShim;

if (new Error().hasOwnProperty('description')) {
  var ERROR_PROPERTY_FILTER = function (obj, array) {
    if (toString.call(obj) === '[object Error]') {
      array = exports.filter(array, function (name) {
        return name !== 'description' && name !== 'number' && name !== 'message';
      });
    }
    return array;
  };

  exports.keys = function (object) {
    return ERROR_PROPERTY_FILTER(object, keys(object));
  };
  exports.getOwnPropertyNames = function (object) {
    return ERROR_PROPERTY_FILTER(object, getOwnPropertyNames(object));
  };
} else {
  exports.keys = keys;
  exports.getOwnPropertyNames = getOwnPropertyNames;
}

// Object.getOwnPropertyDescriptor - supported in IE8 but only on dom elements
function valueObject(value, key) {
  return { value: value[key] };
}

if (typeof Object.getOwnPropertyDescriptor === 'function') {
  try {
    Object.getOwnPropertyDescriptor({'a': 1}, 'a');
    exports.getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
  } catch (e) {
    // IE8 dom element issue - use a try catch and default to valueObject
    exports.getOwnPropertyDescriptor = function (value, key) {
      try {
        return Object.getOwnPropertyDescriptor(value, key);
      } catch (e) {
        return valueObject(value, key);
      }
    };
  }
} else {
  exports.getOwnPropertyDescriptor = valueObject;
}

},{}],18:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var util = require('util');

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!util.isNumber(n) || n < 0)
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (util.isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      } else {
        throw TypeError('Uncaught, unspecified "error" event.');
      }
      return false;
    }
  }

  handler = this._events[type];

  if (util.isUndefined(handler))
    return false;

  if (util.isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (util.isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!util.isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              util.isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (util.isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (util.isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!util.isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      console.trace();
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!util.isFunction(listener))
    throw TypeError('listener must be a function');

  function g() {
    this.removeListener(type, g);
    listener.apply(this, arguments);
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!util.isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (util.isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (util.isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (util.isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (util.isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (util.isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};
},{"util":20}],19:[function(require,module,exports){

// not implemented
// The reason for having an empty file and not throwing is to allow
// untraditional implementation of this module.

},{}],20:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var shims = require('_shims');

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};

/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  shims.forEach(array, function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = shims.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = shims.getOwnPropertyNames(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }

  shims.forEach(keys, function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = shims.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }

  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (shims.indexOf(ctx.seen, desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = shims.reduce(output, function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return shims.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) && objectToString(e) === '[object Error]';
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.binarySlice === 'function'
  ;
}
exports.isBuffer = isBuffer;

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = function(ctor, superCtor) {
  ctor.super_ = superCtor;
  ctor.prototype = shims.create(superCtor.prototype, {
    constructor: {
      value: ctor,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
};

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = shims.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

},{"_shims":17}]},{},[1])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvaG9tZS9yb2Jhc2h0b24vc3JjL2ZyZW5kZS9hcHAuanMiLCIvaG9tZS9yb2Jhc2h0b24vc3JjL2ZyZW5kZS9jdXN0b21lcnMvY3VzdG9tZXJsaXN0LmpzIiwiL2hvbWUvcm9iYXNodG9uL3NyYy9mcmVuZGUvY3VzdG9tZXJzL2luZGV4LmpzIiwiL2hvbWUvcm9iYXNodG9uL3NyYy9mcmVuZGUvY3VzdG9tZXJzL3ZpZXcuanMiLCIvaG9tZS9yb2Jhc2h0b24vc3JjL2ZyZW5kZS9kcm9wZG93bi9pbmRleC5qcyIsIi9ob21lL3JvYmFzaHRvbi9zcmMvZnJlbmRlL25hdmlnYXRpb24uanMiLCIvaG9tZS9yb2Jhc2h0b24vc3JjL2ZyZW5kZS9ub2RlX21vZHVsZXMvZG9tLWRlbGVnYXRlL2xpYi9kZWxlZ2F0ZS5qcyIsIi9ob21lL3JvYmFzaHRvbi9zcmMvZnJlbmRlL25vZGVfbW9kdWxlcy9kb20tZGVsZWdhdGUvbGliL2luZGV4LmpzIiwiL2hvbWUvcm9iYXNodG9uL3NyYy9mcmVuZGUvbm9kZV9tb2R1bGVzL2RvbWlmeS9pbmRleC5qcyIsIi9ob21lL3JvYmFzaHRvbi9zcmMvZnJlbmRlL25vZGVfbW9kdWxlcy9kb21yZWFkeS9yZWFkeS5qcyIsIi9ob21lL3JvYmFzaHRvbi9zcmMvZnJlbmRlL25vZGVfbW9kdWxlcy9kb3BlL2RvcGUuanMiLCIvaG9tZS9yb2Jhc2h0b24vc3JjL2ZyZW5kZS9ub2RlX21vZHVsZXMva25vY2tvdXQvYnVpbGQvb3V0cHV0L2tub2Nrb3V0LWxhdGVzdC5kZWJ1Zy5qcyIsIi9ob21lL3JvYmFzaHRvbi9zcmMvZnJlbmRlL25vZGVfbW9kdWxlcy9sb2NhdGlvbi1iYXIvbG9jYXRpb24tYmFyLmpzIiwiL2hvbWUvcm9iYXNodG9uL3NyYy9mcmVuZGUvbm9kZV9tb2R1bGVzL211c3RhY2hlL211c3RhY2hlLmpzIiwiL2hvbWUvcm9iYXNodG9uL3NyYy9mcmVuZGUvbm9kZV9tb2R1bGVzL3VuZGVyc2NvcmUvdW5kZXJzY29yZS5qcyIsIi9ob21lL3JvYmFzaHRvbi9zcmMvZnJlbmRlL3Rlc3RkYXRhLmpzIiwiL3Vzci9sb2NhbC9saWIvbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLWJ1aWx0aW5zL2J1aWx0aW4vX3NoaW1zLmpzIiwiL3Vzci9sb2NhbC9saWIvbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLWJ1aWx0aW5zL2J1aWx0aW4vZXZlbnRzLmpzIiwiL3Vzci9sb2NhbC9saWIvbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLWJ1aWx0aW5zL2J1aWx0aW4vZnMuanMiLCIvdXNyL2xvY2FsL2xpYi9ub2RlX21vZHVsZXMvd2F0Y2hpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItYnVpbHRpbnMvYnVpbHRpbi91dGlsLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckNBO0FBQ0E7QUFDQTs7QUNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdGFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25hQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVsSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVVQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xtQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1dkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2UkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXNDb250ZW50IjpbInZhciBkb21yZWFkeSA9IHJlcXVpcmUoJ2RvbXJlYWR5JylcbiAgLCBDdXN0b21lckxpc3QgPSByZXF1aXJlKCcuL2N1c3RvbWVycy9pbmRleCcpXG4gICwgQ3VzdG9tZXJWaWV3ID0gcmVxdWlyZSgnLi9jdXN0b21lcnMvdmlldycpXG4gICwgcm91dGluZyA9IHJlcXVpcmUoJy4vbmF2aWdhdGlvbicpXG4gICwgY29udGFpbmVyID0gbnVsbFxuICAsIGN1cnJlbnRQYWdlID0gbnVsbFxuXG5mdW5jdGlvbiBydW4oKXtcbiAgY29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NvbnRhaW5lcicpXG5cbiAgcm91dGluZy5yb3V0ZSgvXmN1c3RvbWVyXFwvKC4rKS8sIGZ1bmN0aW9uKHBhdGgpIHtcbiAgICBzd2l0Y2hUbyhDdXN0b21lclZpZXcsIHsgbmFtZTogcGF0aC5zcGxpdCgnLycpWzFdIH0pXG4gIH0pXG5cbiAgcm91dGluZy5yb3V0ZSgvXiQvLCBmdW5jdGlvbigpIHtcbiAgICBzd2l0Y2hUbyhDdXN0b21lckxpc3QpXG4gIH0pXG5cbiAgcm91dGluZy5zdGFydCh7XG4gICAgcHVzaFN0YXRlOiB0cnVlXG4gIH0pXG59XG5cbmZ1bmN0aW9uIHN3aXRjaFRvKFByZXNlbnRlciwgb3B0aW9ucykge1xuICBpZihjdXJyZW50UGFnZSkgY3VycmVudFBhZ2UuZGV0YWNoKClcbiAgY3VycmVudFBhZ2UgPSBuZXcgUHJlc2VudGVyKGNvbnRhaW5lciwgb3B0aW9ucylcbn1cblxuZG9tcmVhZHkocnVuKVxuXG4iLCJ2YXIgbXVzdGFjaGUgPSByZXF1aXJlKCdtdXN0YWNoZScpXG4gICwgRGVsZWdhdGUgPSByZXF1aXJlKCdkb20tZGVsZWdhdGUnKVxuICAsIG5hdmlnYXRpb24gPSByZXF1aXJlKCcuLi9uYXZpZ2F0aW9uJylcbiAgLCBkb3BlID0gcmVxdWlyZSgnZG9wZScpXG4gICwgXyA9IHJlcXVpcmUoJ3VuZGVyc2NvcmUnKVxuICAsIGZzID0gcmVxdWlyZSgnZnMnKVxuXG5mdW5jdGlvbiBDdXN0b21lckxpc3QoZWxlbWVudCwgY3VzdG9tZXJzKSB7XG4gIHRoaXMuZWxlbWVudCA9IGVsZW1lbnRcbiAgdGhpcy50ZW1wbGF0ZSA9IFwiICA8dGFibGU+XFxuICAgIHt7I2FjdGl2ZWN1c3RvbWVyc319XFxuICAgICAgPHRyIGNsYXNzPVxcXCJjdXN0b21lclxcXCIgZGF0YS1jdXN0b21lcj1cXFwie3tuYW1lfX1cXFwiPjx0ZD57e25hbWV9fTwvdGQ+PHRkPnt7YmFua319PC90ZD48L3RyPlxcbiAgICB7ey9hY3RpdmVjdXN0b21lcnN9fVxcbiAgPC90YWJsZT5cXG5cXG5cIlxuICB0aGlzLmN1c3RvbWVycyA9IGN1c3RvbWVyc1xuICB0aGlzLmFjdGl2ZWN1c3RvbWVycyA9IGN1c3RvbWVyc1xuICB0aGlzLnJlbmRlcigpXG4gIHRoaXMuZGVsZWdhdGUgPSBuZXcgRGVsZWdhdGUodGhpcy5lbGVtZW50KVxuICB0aGlzLmRlbGVnYXRlLm9uKCdjbGljaycsICcuY3VzdG9tZXInLCB0aGlzLm9uQ3VzdG9tZXJDbGlja2VkLmJpbmQodGhpcykpXG59XG5cbkN1c3RvbWVyTGlzdC5wcm90b3R5cGUgPSB7XG4gIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5lbGVtZW50LmlubmVySFRNTCA9IG11c3RhY2hlLnJlbmRlcih0aGlzLnRlbXBsYXRlLCB0aGlzKVxuICB9LFxuICBvbkN1c3RvbWVyQ2xpY2tlZDogZnVuY3Rpb24oZSwgcm93KSB7XG4gICAgbmF2aWdhdGlvbi51cGRhdGUoXCIvY3VzdG9tZXIvXCIgKyBkb3BlLmRhdGFzZXQocm93KS5jdXN0b21lcixcbiAgICAgIHt0cmlnZ2VyOiB0cnVlfSlcbiAgfSxcbiAgZmlsdGVyQnlCYW5rOiBmdW5jdGlvbihiYW5rKSB7XG4gICAgaWYoYmFuaykge1xuICAgICAgdGhpcy5hY3RpdmVjdXN0b21lcnMgPSBfKHRoaXMuY3VzdG9tZXJzKS5maWx0ZXIoZnVuY3Rpb24oaSkgeyByZXR1cm4gaS5iYW5rID09PSBiYW5rfSlcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICB0aGlzLmFjdGl2ZWN1c3RvbWVycyA9IHRoaXMuY3VzdG9tZXJzXG4gICAgfVxuICAgIHRoaXMucmVuZGVyKClcbiAgfSxcbiAgZGV0YWNoOiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmRlbGVnYXRlLmRlc3Ryb3koKVxuICB9XG59XG5cblxubW9kdWxlLmV4cG9ydHMgPSBDdXN0b21lckxpc3RcbiIsInZhciB0ZXN0ZGF0YSA9IHJlcXVpcmUoJy4uL3Rlc3RkYXRhJylcbiAgLCBEcm9wZG93biA9IHJlcXVpcmUoJy4uL2Ryb3Bkb3duJylcbiAgLCBDdXN0b21lckxpc3QgPSByZXF1aXJlKCcuL2N1c3RvbWVybGlzdCcpXG5cbnZhciBJbmRleCA9IGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgdGhpcy5lbGVtZW50ID0gZWxlbWVudFxuICB0aGlzLmVsZW1lbnQuaW5uZXJIVE1MID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2N1c3RvbWVyLWxpc3QtdGVtcGxhdGUnKS5pbm5lckhUTUxcbiAgdGhpcy5iYW5rcyA9IG5ldyBEcm9wZG93bignYmFua3MnLCB0aGlzLmVsZW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgnYmFuay1jb250YWluZXInKVswXSwgdGVzdGRhdGEuYmFua3MpXG4gIHRoaXMuY3VzdG9tZXJzID0gbmV3IEN1c3RvbWVyTGlzdCh0aGlzLmVsZW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgnY3VzdG9tZXItY29udGFpbmVyJylbMF0sIHRlc3RkYXRhLmN1c3RvbWVycylcbiAgdGhpcy5iYW5rcy5vbignY2hhbmdlZCcsIHRoaXMub25CYW5rQ2hhbmdlZC5iaW5kKHRoaXMpKVxufVxuXG5JbmRleC5wcm90b3R5cGUgPSB7XG4gIGRldGFjaDogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5iYW5rcy5kZXRhY2goKVxuICB9LFxuICBvbkJhbmtDaGFuZ2VkOiBmdW5jdGlvbihuZXdCYW5rKSB7XG4gICAgdGhpcy5jdXN0b21lcnMuZmlsdGVyQnlCYW5rKG5ld0JhbmspXG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBJbmRleFxuIiwidmFyIHRlc3RkYXRhID0gcmVxdWlyZSgnLi4vdGVzdGRhdGEnKVxuICAsIGZzID0gcmVxdWlyZSgnZnMnKVxuICAsIG11c3RhY2hlID0gcmVxdWlyZSgnbXVzdGFjaGUnKVxuICAsIF8gPSByZXF1aXJlKCd1bmRlcnNjb3JlJylcblxudmFyIFZpZXcgPSBmdW5jdGlvbihlbGVtZW50LCBvcHRzKSB7XG4gIHRoaXMuZWxlbWVudCA9IGVsZW1lbnRcbiAgdGhpcy50ZW1wbGF0ZSA9IFwiPGg0Pnt7bmFtZX19PC9oND5cXG48cD48c3Ryb25nPkJhbms8L3N0cm9uZz4ge3tiYW5rfX08L3A+XFxuPHA+e3tkZXNjfX08L3A+XFxuXCJcbiAgdGhpcy5jdXN0b21lciA9IF8odGVzdGRhdGEuY3VzdG9tZXJzKVxuICAgICAgICAgICAgLmZpbmQoZnVuY3Rpb24oaSkgeyByZXR1cm4gaS5uYW1lID09IG9wdHMubmFtZX0pXG4gIHRoaXMucmVuZGVyKClcbn1cblxuVmlldy5wcm90b3R5cGUgPSB7XG4gIGRldGFjaDogZnVuY3Rpb24oKSB7XG5cbiAgfSxcbiAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmVsZW1lbnQuaW5uZXJIVE1MID0gbXVzdGFjaGUucmVuZGVyKHRoaXMudGVtcGxhdGUsIHRoaXMuY3VzdG9tZXIpXG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBWaWV3XG4iLCJ2YXIga28gPSByZXF1aXJlKCdrbm9ja291dCcpXG4gICwgZG9taWZ5ID0gcmVxdWlyZSgnZG9taWZ5JylcbiAgLCBfID0gcmVxdWlyZSgndW5kZXJzY29yZScpXG4gICwgRXZlbnRFbWl0dGVyID0gcmVxdWlyZSgnZXZlbnRzJykuRXZlbnRFbWl0dGVyXG5cbmZ1bmN0aW9uIERyb3Bkb3duKG5hbWUsIGVsZW1lbnQsIGRhdGEpIHtcbiAgRXZlbnRFbWl0dGVyLmNhbGwodGhpcylcblxuICB0aGlzLmRhdGEgPSBkYXRhXG4gIHRoaXMuZWxlbWVudCA9IGVsZW1lbnRcbiAgdGhpcy5uYW1lID0gbmFtZVxuXG4gIC8vIEdBU1AgLSB3ZSBjYW4gdXNlIEtub2Nrb3V0IGlmIHdlIHdhbnQgdG9cbiAgLy8gSnVzdCBrZWVwIGl0IGludGVybmFsIHRvIHRoZSBwcmVzZW50ZXJcbiAgdGhpcy52YWx1ZXMgPSBrby5vYnNlcnZhYmxlQXJyYXkodGhpcy5kYXRhKVxuICB0aGlzLnNlbGVjdGVkVmFsdWUgPSBrby5vYnNlcnZhYmxlKClcbiAgdGhpcy5yZW5kZXIoKVxuICBrby5hcHBseUJpbmRpbmdzKHRoaXMsIHRoaXMuZWxlbWVudClcbiAgdGhpcy5zZWxlY3RlZFZhbHVlLnN1YnNjcmliZSh0aGlzLm9uU2VsZWN0ZWRWYWx1ZUNoYW5nZWQuYmluZCh0aGlzKSlcbn1cblxuRHJvcGRvd24ucHJvdG90eXBlID0ge1xuICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuZWxlbWVudC5pbm5lckhUTUwgPSBcIlwiXG4gICAgdmFyIGh0bWwgPSAnPHNlbGVjdCBuYW1lPVwiJyArIHRoaXMubmFtZSArICdcIiBkYXRhLWJpbmQ9XCJvcHRpb25zOiB2YWx1ZXMsIHZhbHVlOiBzZWxlY3RlZFZhbHVlXCI+PC9zZWxlY3Q+J1xuICAgIHRoaXMuZWxlbWVudC5hcHBlbmRDaGlsZChkb21pZnkoaHRtbCkpXG4gIH0sXG4gIG9uU2VsZWN0ZWRWYWx1ZUNoYW5nZWQ6IGZ1bmN0aW9uKG5ld1ZhbHVlKSB7XG4gICAgdGhpcy5lbWl0KCdjaGFuZ2VkJywgbmV3VmFsdWUpXG4gIH0sXG4gIGRldGFjaDogZnVuY3Rpb24oKSB7XG4gICAga28uY2xlYW5Ob2RlKHRoaXMuZWxlbWVudClcbiAgfVxufVxuXy5leHRlbmQoRHJvcGRvd24ucHJvdG90eXBlLCBFdmVudEVtaXR0ZXIucHJvdG90eXBlKVxuXG5tb2R1bGUuZXhwb3J0cyA9IERyb3Bkb3duXG4iLCJ2YXIgTG9jYXRpb25CYXIgPSByZXF1aXJlKCdsb2NhdGlvbi1iYXInKVxubW9kdWxlLmV4cG9ydHMgPSBuZXcgTG9jYXRpb25CYXIoKVxuIiwiLypqc2hpbnQgYnJvd3Nlcjp0cnVlLCBub2RlOnRydWUqL1xuXG4ndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gRGVsZWdhdGU7XG5cbi8qKlxuICogRE9NIGV2ZW50IGRlbGVnYXRvclxuICpcbiAqIFRoZSBkZWxlZ2F0b3Igd2lsbCBsaXN0ZW5cbiAqIGZvciBldmVudHMgdGhhdCBidWJibGUgdXBcbiAqIHRvIHRoZSByb290IG5vZGUuXG4gKlxuICogQGNvbnN0cnVjdG9yXG4gKiBAcGFyYW0ge05vZGV8c3RyaW5nfSBbcm9vdF0gVGhlIHJvb3Qgbm9kZSBvciBhIHNlbGVjdG9yIHN0cmluZyBtYXRjaGluZyB0aGUgcm9vdCBub2RlXG4gKi9cbmZ1bmN0aW9uIERlbGVnYXRlKHJvb3QpIHtcbiAgaWYgKHJvb3QpIHtcbiAgICB0aGlzLnJvb3Qocm9vdCk7XG4gIH1cblxuICAvKipcbiAgICogTWFpbnRhaW4gYSBtYXAgb2YgbGlzdGVuZXJcbiAgICogbGlzdHMsIGtleWVkIGJ5IGV2ZW50IG5hbWUuXG4gICAqXG4gICAqIEB0eXBlIE9iamVjdFxuICAgKi9cbiAgdGhpcy5saXN0ZW5lck1hcCA9IHt9O1xuXG4gIC8qKiBAdHlwZSBmdW5jdGlvbigpICovXG4gIHRoaXMuaGFuZGxlID0gRGVsZWdhdGUucHJvdG90eXBlLmhhbmRsZS5iaW5kKHRoaXMpO1xufVxuXG4vKipcbiAqIEBwcm90ZWN0ZWRcbiAqIEB0eXBlID9ib29sZWFuXG4gKi9cbkRlbGVnYXRlLnRhZ3NDYXNlU2Vuc2l0aXZlID0gbnVsbDtcblxuLyoqXG4gKiBTdGFydCBsaXN0ZW5pbmcgZm9yIGV2ZW50c1xuICogb24gdGhlIHByb3ZpZGVkIERPTSBlbGVtZW50XG4gKlxuICogQHBhcmFtICB7Tm9kZXxzdHJpbmd9IFtyb290XSBUaGUgcm9vdCBub2RlIG9yIGEgc2VsZWN0b3Igc3RyaW5nIG1hdGNoaW5nIHRoZSByb290IG5vZGVcbiAqIEByZXR1cm5zIHtEZWxlZ2F0ZX0gVGhpcyBtZXRob2QgaXMgY2hhaW5hYmxlXG4gKi9cbkRlbGVnYXRlLnByb3RvdHlwZS5yb290ID0gZnVuY3Rpb24ocm9vdCkge1xuICB2YXIgbGlzdGVuZXJNYXAgPSB0aGlzLmxpc3RlbmVyTWFwO1xuICB2YXIgZXZlbnRUeXBlO1xuXG4gIGlmICh0eXBlb2Ygcm9vdCA9PT0gJ3N0cmluZycpIHtcbiAgICByb290ID0gZG9jdW1lbnQucXVlcnlTZWxlY3Rvcihyb290KTtcbiAgfVxuXG4gIC8vIFJlbW92ZSBtYXN0ZXIgZXZlbnQgbGlzdGVuZXJzXG4gIGlmICh0aGlzLnJvb3RFbGVtZW50KSB7XG4gICAgZm9yIChldmVudFR5cGUgaW4gbGlzdGVuZXJNYXApIHtcbiAgICAgIGlmIChsaXN0ZW5lck1hcC5oYXNPd25Qcm9wZXJ0eShldmVudFR5cGUpKSB7XG4gICAgICAgIHRoaXMucm9vdEVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudFR5cGUsIHRoaXMuaGFuZGxlLCB0aGlzLmNhcHR1cmVGb3JUeXBlKGV2ZW50VHlwZSkpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIElmIG5vIHJvb3Qgb3Igcm9vdCBpcyBub3RcbiAgLy8gYSBkb20gbm9kZSwgdGhlbiByZW1vdmUgaW50ZXJuYWxcbiAgLy8gcm9vdCByZWZlcmVuY2UgYW5kIGV4aXQgaGVyZVxuICBpZiAoIXJvb3QgfHwgIXJvb3QuYWRkRXZlbnRMaXN0ZW5lcikge1xuICAgIGlmICh0aGlzLnJvb3RFbGVtZW50KSB7XG4gICAgICBkZWxldGUgdGhpcy5yb290RWxlbWVudDtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogVGhlIHJvb3Qgbm9kZSBhdCB3aGljaFxuICAgKiBsaXN0ZW5lcnMgYXJlIGF0dGFjaGVkLlxuICAgKlxuICAgKiBAdHlwZSBOb2RlXG4gICAqL1xuICB0aGlzLnJvb3RFbGVtZW50ID0gcm9vdDtcblxuICAvLyBTZXQgdXAgbWFzdGVyIGV2ZW50IGxpc3RlbmVyc1xuICBmb3IgKGV2ZW50VHlwZSBpbiBsaXN0ZW5lck1hcCkge1xuICAgIGlmIChsaXN0ZW5lck1hcC5oYXNPd25Qcm9wZXJ0eShldmVudFR5cGUpKSB7XG4gICAgICB0aGlzLnJvb3RFbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoZXZlbnRUeXBlLCB0aGlzLmhhbmRsZSwgdGhpcy5jYXB0dXJlRm9yVHlwZShldmVudFR5cGUpKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50VHlwZVxuICogQHJldHVybnMgYm9vbGVhblxuICovXG5EZWxlZ2F0ZS5wcm90b3R5cGUuY2FwdHVyZUZvclR5cGUgPSBmdW5jdGlvbihldmVudFR5cGUpIHtcbiAgcmV0dXJuIGV2ZW50VHlwZSA9PT0gJ2Vycm9yJztcbn07XG5cbi8qKlxuICogQXR0YWNoIGEgaGFuZGxlciB0byBvbmVcbiAqIGV2ZW50IGZvciBhbGwgZWxlbWVudHNcbiAqIHRoYXQgbWF0Y2ggdGhlIHNlbGVjdG9yLFxuICogbm93IG9yIGluIHRoZSBmdXR1cmVcbiAqXG4gKiBUaGUgaGFuZGxlciBmdW5jdGlvbiByZWNlaXZlc1xuICogdGhyZWUgYXJndW1lbnRzOiB0aGUgRE9NIGV2ZW50XG4gKiBvYmplY3QsIHRoZSBub2RlIHRoYXQgbWF0Y2hlZFxuICogdGhlIHNlbGVjdG9yIHdoaWxlIHRoZSBldmVudFxuICogd2FzIGJ1YmJsaW5nIGFuZCBhIHJlZmVyZW5jZVxuICogdG8gaXRzZWxmLiBXaXRoaW4gdGhlIGhhbmRsZXIsXG4gKiAndGhpcycgaXMgZXF1YWwgdG8gdGhlIHNlY29uZFxuICogYXJndW1lbnQuXG4gKlxuICogVGhlIG5vZGUgdGhhdCBhY3R1YWxseSByZWNlaXZlZFxuICogdGhlIGV2ZW50IGNhbiBiZSBhY2Nlc3NlZCB2aWFcbiAqICdldmVudC50YXJnZXQnLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBldmVudFR5cGUgTGlzdGVuIGZvciB0aGVzZSBldmVudHMgKGluIGEgc3BhY2Utc2VwYXJhdGVkIGxpc3QpXG4gKiBAcGFyYW0ge3N0cmluZ3x1bmRlZmluZWR9IHNlbGVjdG9yIE9ubHkgaGFuZGxlIGV2ZW50cyBvbiBlbGVtZW50cyBtYXRjaGluZyB0aGlzIHNlbGVjdG9yLCBpZiB1bmRlZmluZWQgbWF0Y2ggcm9vdCBlbGVtZW50XG4gKiBAcGFyYW0ge2Z1bmN0aW9uKCl9IGhhbmRsZXIgSGFuZGxlciBmdW5jdGlvbiAtIGV2ZW50IGRhdGEgcGFzc2VkIGhlcmUgd2lsbCBiZSBpbiBldmVudC5kYXRhXG4gKiBAcGFyYW0ge09iamVjdH0gW2V2ZW50RGF0YV0gRGF0YSB0byBwYXNzIGluIGV2ZW50LmRhdGFcbiAqIEByZXR1cm5zIHtEZWxlZ2F0ZX0gVGhpcyBtZXRob2QgaXMgY2hhaW5hYmxlXG4gKi9cbkRlbGVnYXRlLnByb3RvdHlwZS5vbiA9IGZ1bmN0aW9uKGV2ZW50VHlwZSwgc2VsZWN0b3IsIGhhbmRsZXIsIGV2ZW50RGF0YSkge1xuICB2YXIgcm9vdCwgbGlzdGVuZXJNYXAsIG1hdGNoZXIsIG1hdGNoZXJQYXJhbSwgc2VsZiA9IHRoaXM7XG5cbiAgaWYgKCFldmVudFR5cGUpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdJbnZhbGlkIGV2ZW50IHR5cGU6ICcgKyBldmVudFR5cGUpO1xuICB9XG5cbiAgLy8gaGFuZGxlciBjYW4gYmUgcGFzc2VkIGFzXG4gIC8vIHRoZSBzZWNvbmQgb3IgdGhpcmQgYXJndW1lbnRcbiAgaWYgKHR5cGVvZiBzZWxlY3RvciA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIGhhbmRsZXIgPSBzZWxlY3RvcjtcbiAgICBzZWxlY3RvciA9IG51bGw7XG4gICAgZXZlbnREYXRhID0gaGFuZGxlcjtcbiAgfVxuXG4gIC8vIE5vcm1hbGlzZSB1bmRlZmluZWQgZXZlbnREYXRhIHRvIG51bGxcbiAgaWYgKGV2ZW50RGF0YSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgZXZlbnREYXRhID0gbnVsbDtcbiAgfVxuXG4gIGlmICh0eXBlb2YgaGFuZGxlciAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0hhbmRsZXIgbXVzdCBiZSBhIHR5cGUgb2YgRnVuY3Rpb24nKTtcbiAgfVxuXG4gIHJvb3QgPSB0aGlzLnJvb3RFbGVtZW50O1xuICBsaXN0ZW5lck1hcCA9IHRoaXMubGlzdGVuZXJNYXA7XG5cbiAgLy8gQWRkIG1hc3RlciBoYW5kbGVyIGZvciB0eXBlIGlmIG5vdCBjcmVhdGVkIHlldFxuICBpZiAoIWxpc3RlbmVyTWFwW2V2ZW50VHlwZV0pIHtcbiAgICBpZiAocm9vdCkge1xuICAgICAgcm9vdC5hZGRFdmVudExpc3RlbmVyKGV2ZW50VHlwZSwgdGhpcy5oYW5kbGUsIHRoaXMuY2FwdHVyZUZvclR5cGUoZXZlbnRUeXBlKSk7XG4gICAgfVxuICAgIGxpc3RlbmVyTWFwW2V2ZW50VHlwZV0gPSBbXTtcbiAgfVxuXG4gIGlmICghc2VsZWN0b3IpIHtcbiAgICBtYXRjaGVyUGFyYW0gPSBudWxsO1xuXG4gICAgLy8gQ09NUExFWCAtIG1hdGNoZXNSb290IG5lZWRzIHRvIGhhdmUgYWNjZXNzIHRvXG4gICAgLy8gdGhpcy5yb290RWxlbWVudCwgc28gYmluZCB0aGUgZnVuY3Rpb24gdG8gdGhpcy5cbiAgICBtYXRjaGVyID0gdGhpcy5tYXRjaGVzUm9vdC5iaW5kKHRoaXMpO1xuXG4gIC8vIENvbXBpbGUgYSBtYXRjaGVyIGZvciB0aGUgZ2l2ZW4gc2VsZWN0b3JcbiAgfSBlbHNlIGlmICgvXlthLXpdKyQvaS50ZXN0KHNlbGVjdG9yKSkge1xuXG4gICAgLy8gTGF6aWx5IGNoZWNrIHdoZXRoZXIgdGFnIG5hbWVzIGFyZSBjYXNlIHNlbnNpdGl2ZSAoYXMgaW4gWE1MIG9yIFhIVE1MIGRvY3VtZW50cykuXG4gICAgaWYgKERlbGVnYXRlLnRhZ3NDYXNlU2Vuc2l0aXZlID09PSBudWxsKSB7XG4gICAgICBEZWxlZ2F0ZS50YWdzQ2FzZVNlbnNpdGl2ZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2knKS50YWdOYW1lID09PSAnaSc7XG4gICAgfVxuXG4gICAgaWYgKCFEZWxlZ2F0ZS50YWdzQ2FzZVNlbnNpdGl2ZSkge1xuICAgICAgbWF0Y2hlclBhcmFtID0gc2VsZWN0b3IudG9VcHBlckNhc2UoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbWF0Y2hlclBhcmFtID0gc2VsZWN0b3I7XG4gICAgfVxuXG4gICAgbWF0Y2hlciA9IHRoaXMubWF0Y2hlc1RhZztcbiAgfSBlbHNlIGlmICgvXiNbYS16MC05XFwtX10rJC9pLnRlc3Qoc2VsZWN0b3IpKSB7XG4gICAgbWF0Y2hlclBhcmFtID0gc2VsZWN0b3Iuc2xpY2UoMSk7XG4gICAgbWF0Y2hlciA9IHRoaXMubWF0Y2hlc0lkO1xuICB9IGVsc2Uge1xuICAgIG1hdGNoZXJQYXJhbSA9IHNlbGVjdG9yO1xuICAgIG1hdGNoZXIgPSB0aGlzLm1hdGNoZXM7XG4gIH1cblxuICAvLyBBZGQgdG8gdGhlIGxpc3Qgb2YgbGlzdGVuZXJzXG4gIGxpc3RlbmVyTWFwW2V2ZW50VHlwZV0ucHVzaCh7XG4gICAgc2VsZWN0b3I6IHNlbGVjdG9yLFxuICAgIGV2ZW50RGF0YTogZXZlbnREYXRhLFxuICAgIGhhbmRsZXI6IGhhbmRsZXIsXG4gICAgbWF0Y2hlcjogbWF0Y2hlcixcbiAgICBtYXRjaGVyUGFyYW06IG1hdGNoZXJQYXJhbVxuICB9KTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogUmVtb3ZlIGFuIGV2ZW50IGhhbmRsZXJcbiAqIGZvciBlbGVtZW50cyB0aGF0IG1hdGNoXG4gKiB0aGUgc2VsZWN0b3IsIGZvcmV2ZXJcbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gW2V2ZW50VHlwZV0gUmVtb3ZlIGhhbmRsZXJzIGZvciBldmVudHMgbWF0Y2hpbmcgdGhpcyB0eXBlLCBjb25zaWRlcmluZyB0aGUgb3RoZXIgcGFyYW1ldGVyc1xuICogQHBhcmFtIHtzdHJpbmd9IFtzZWxlY3Rvcl0gSWYgdGhpcyBwYXJhbWV0ZXIgaXMgb21pdHRlZCwgb25seSBoYW5kbGVycyB3aGljaCBtYXRjaCB0aGUgb3RoZXIgdHdvIHdpbGwgYmUgcmVtb3ZlZFxuICogQHBhcmFtIHtmdW5jdGlvbigpfSBbaGFuZGxlcl0gSWYgdGhpcyBwYXJhbWV0ZXIgaXMgb21pdHRlZCwgb25seSBoYW5kbGVycyB3aGljaCBtYXRjaCB0aGUgcHJldmlvdXMgdHdvIHdpbGwgYmUgcmVtb3ZlZFxuICogQHJldHVybnMge0RlbGVnYXRlfSBUaGlzIG1ldGhvZCBpcyBjaGFpbmFibGVcbiAqL1xuRGVsZWdhdGUucHJvdG90eXBlLm9mZiA9IGZ1bmN0aW9uKGV2ZW50VHlwZSwgc2VsZWN0b3IsIGhhbmRsZXIpIHtcbiAgdmFyIGksIGxpc3RlbmVyLCBsaXN0ZW5lck1hcCwgbGlzdGVuZXJMaXN0LCBzaW5nbGVFdmVudFR5cGUsIHNlbGYgPSB0aGlzO1xuXG4gIC8vIEhhbmRsZXIgY2FuIGJlIHBhc3NlZCBhc1xuICAvLyB0aGUgc2Vjb25kIG9yIHRoaXJkIGFyZ3VtZW50XG4gIGlmICh0eXBlb2Ygc2VsZWN0b3IgPT09ICdmdW5jdGlvbicpIHtcbiAgICBoYW5kbGVyID0gc2VsZWN0b3I7XG4gICAgc2VsZWN0b3IgPSBudWxsO1xuICB9XG5cbiAgbGlzdGVuZXJNYXAgPSB0aGlzLmxpc3RlbmVyTWFwO1xuICBpZiAoIWV2ZW50VHlwZSkge1xuICAgIGZvciAoc2luZ2xlRXZlbnRUeXBlIGluIGxpc3RlbmVyTWFwKSB7XG4gICAgICBpZiAobGlzdGVuZXJNYXAuaGFzT3duUHJvcGVydHkoc2luZ2xlRXZlbnRUeXBlKSkge1xuICAgICAgICB0aGlzLm9mZihzaW5nbGVFdmVudFR5cGUsIHNlbGVjdG9yLCBoYW5kbGVyKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGxpc3RlbmVyTGlzdCA9IGxpc3RlbmVyTWFwW2V2ZW50VHlwZV07XG4gIGlmICghbGlzdGVuZXJMaXN0IHx8ICFsaXN0ZW5lckxpc3QubGVuZ3RoKSB7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvLyBSZW1vdmUgb25seSBwYXJhbWV0ZXIgbWF0Y2hlc1xuICAvLyBpZiBzcGVjaWZpZWRcbiAgZm9yIChpID0gbGlzdGVuZXJMaXN0Lmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgbGlzdGVuZXIgPSBsaXN0ZW5lckxpc3RbaV07XG5cbiAgICBpZiAoKCFzZWxlY3RvciB8fCBzZWxlY3RvciA9PT0gbGlzdGVuZXIuc2VsZWN0b3IpICYmICghaGFuZGxlciB8fCBoYW5kbGVyID09PSBsaXN0ZW5lci5oYW5kbGVyKSkge1xuICAgICAgbGlzdGVuZXJMaXN0LnNwbGljZShpLCAxKTtcbiAgICB9XG4gIH1cblxuICAvLyBBbGwgbGlzdGVuZXJzIHJlbW92ZWRcbiAgaWYgKCFsaXN0ZW5lckxpc3QubGVuZ3RoKSB7XG4gICAgZGVsZXRlIGxpc3RlbmVyTWFwW2V2ZW50VHlwZV07XG5cbiAgICAvLyBSZW1vdmUgdGhlIG1haW4gaGFuZGxlclxuICAgIGlmICh0aGlzLnJvb3RFbGVtZW50KSB7XG4gICAgICB0aGlzLnJvb3RFbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnRUeXBlLCB0aGlzLmhhbmRsZSwgdGhpcy5jYXB0dXJlRm9yVHlwZShldmVudFR5cGUpKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cblxuLyoqXG4gKiBIYW5kbGUgYW4gYXJiaXRyYXJ5IGV2ZW50LlxuICpcbiAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50XG4gKi9cbkRlbGVnYXRlLnByb3RvdHlwZS5oYW5kbGUgPSBmdW5jdGlvbihldmVudCkge1xuICB2YXIgaSwgbCwgcm9vdCwgbGlzdGVuZXIsIHJldHVybmVkLCBsaXN0ZW5lckxpc3QsIHRhcmdldCwgLyoqIEBjb25zdCAqLyBFVkVOVElHTk9SRSA9ICdmdExhYnNEZWxlZ2F0ZUlnbm9yZSc7XG5cbiAgaWYgKGV2ZW50W0VWRU5USUdOT1JFXSA9PT0gdHJ1ZSkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHRhcmdldCA9IGV2ZW50LnRhcmdldDtcbiAgaWYgKHRhcmdldC5ub2RlVHlwZSA9PT0gTm9kZS5URVhUX05PREUpIHtcbiAgICB0YXJnZXQgPSB0YXJnZXQucGFyZW50Tm9kZTtcbiAgfVxuXG4gIHJvb3QgPSB0aGlzLnJvb3RFbGVtZW50O1xuICBsaXN0ZW5lckxpc3QgPSB0aGlzLmxpc3RlbmVyTWFwW2V2ZW50LnR5cGVdO1xuXG4gIC8vIE5lZWQgdG8gY29udGludW91c2x5IGNoZWNrXG4gIC8vIHRoYXQgdGhlIHNwZWNpZmljIGxpc3QgaXNcbiAgLy8gc3RpbGwgcG9wdWxhdGVkIGluIGNhc2Ugb25lXG4gIC8vIG9mIHRoZSBjYWxsYmFja3MgYWN0dWFsbHlcbiAgLy8gY2F1c2VzIHRoZSBsaXN0IHRvIGJlIGRlc3Ryb3llZC5cbiAgbCA9IGxpc3RlbmVyTGlzdC5sZW5ndGg7XG4gIHdoaWxlICh0YXJnZXQgJiYgbCkge1xuICAgIGZvciAoaSA9IDA7IGkgPCBsOyBpKyspIHtcbiAgICAgIGxpc3RlbmVyID0gbGlzdGVuZXJMaXN0W2ldO1xuXG4gICAgICAvLyBCYWlsIGZyb20gdGhpcyBsb29wIGlmXG4gICAgICAvLyB0aGUgbGVuZ3RoIGNoYW5nZWQgYW5kXG4gICAgICAvLyBubyBtb3JlIGxpc3RlbmVycyBhcmVcbiAgICAgIC8vIGRlZmluZWQgYmV0d2VlbiBpIGFuZCBsLlxuICAgICAgaWYgKCFsaXN0ZW5lcikge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgLy8gQ2hlY2sgZm9yIG1hdGNoIGFuZCBmaXJlXG4gICAgICAvLyB0aGUgZXZlbnQgaWYgdGhlcmUncyBvbmVcbiAgICAgIC8vXG4gICAgICAvLyBUT0RPOk1DRzoyMDEyMDExNzogTmVlZCBhIHdheVxuICAgICAgLy8gdG8gY2hlY2sgaWYgZXZlbnQjc3RvcEltbWVkaWF0ZVByb2dhZ2F0aW9uXG4gICAgICAvLyB3YXMgY2FsbGVkLiBJZiBzbywgYnJlYWsgYm90aCBsb29wcy5cbiAgICAgIGlmIChsaXN0ZW5lci5tYXRjaGVyLmNhbGwodGFyZ2V0LCBsaXN0ZW5lci5tYXRjaGVyUGFyYW0sIHRhcmdldCkpIHtcbiAgICAgICAgcmV0dXJuZWQgPSB0aGlzLmZpcmUoZXZlbnQsIHRhcmdldCwgbGlzdGVuZXIpO1xuICAgICAgfVxuXG4gICAgICAvLyBTdG9wIHByb3BhZ2F0aW9uIHRvIHN1YnNlcXVlbnRcbiAgICAgIC8vIGNhbGxiYWNrcyBpZiB0aGUgY2FsbGJhY2sgcmV0dXJuZWRcbiAgICAgIC8vIGZhbHNlXG4gICAgICBpZiAocmV0dXJuZWQgPT09IGZhbHNlKSB7XG4gICAgICAgIGV2ZW50W0VWRU5USUdOT1JFXSA9IHRydWU7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBUT0RPOk1DRzoyMDEyMDExNzogTmVlZCBhIHdheSB0b1xuICAgIC8vIGNoZWNrIGlmIGV2ZW50I3N0b3BQcm9nYWdhdGlvblxuICAgIC8vIHdhcyBjYWxsZWQuIElmIHNvLCBicmVhayBsb29waW5nXG4gICAgLy8gdGhyb3VnaCB0aGUgRE9NLiBTdG9wIGlmIHRoZVxuICAgIC8vIGRlbGVnYXRpb24gcm9vdCBoYXMgYmVlbiByZWFjaGVkXG4gICAgaWYgKHRhcmdldCA9PT0gcm9vdCkge1xuICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgbCA9IGxpc3RlbmVyTGlzdC5sZW5ndGg7XG4gICAgdGFyZ2V0ID0gdGFyZ2V0LnBhcmVudEVsZW1lbnQ7XG4gIH1cbn07XG5cbi8qKlxuICogRmlyZSBhIGxpc3RlbmVyIG9uIGEgdGFyZ2V0LlxuICpcbiAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50XG4gKiBAcGFyYW0ge05vZGV9IHRhcmdldFxuICogQHBhcmFtIHtPYmplY3R9IGxpc3RlbmVyXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAqL1xuRGVsZWdhdGUucHJvdG90eXBlLmZpcmUgPSBmdW5jdGlvbihldmVudCwgdGFyZ2V0LCBsaXN0ZW5lcikge1xuICB2YXIgcmV0dXJuZWQsIG9sZERhdGE7XG5cbiAgaWYgKGxpc3RlbmVyLmV2ZW50RGF0YSAhPT0gbnVsbCkge1xuICAgIG9sZERhdGEgPSBldmVudC5kYXRhO1xuICAgIGV2ZW50LmRhdGEgPSBsaXN0ZW5lci5ldmVudERhdGE7XG4gICAgcmV0dXJuZWQgPSBsaXN0ZW5lci5oYW5kbGVyLmNhbGwodGFyZ2V0LCBldmVudCwgdGFyZ2V0KTtcbiAgICBldmVudC5kYXRhID0gb2xkRGF0YTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm5lZCA9IGxpc3RlbmVyLmhhbmRsZXIuY2FsbCh0YXJnZXQsIGV2ZW50LCB0YXJnZXQpO1xuICB9XG5cbiAgcmV0dXJuIHJldHVybmVkO1xufTtcblxuLyoqXG4gKiBDaGVjayB3aGV0aGVyIGFuIGVsZW1lbnRcbiAqIG1hdGNoZXMgYSBnZW5lcmljIHNlbGVjdG9yLlxuICpcbiAqIEB0eXBlIGZ1bmN0aW9uKClcbiAqIEBwYXJhbSB7c3RyaW5nfSBzZWxlY3RvciBBIENTUyBzZWxlY3RvclxuICovXG5EZWxlZ2F0ZS5wcm90b3R5cGUubWF0Y2hlcyA9IChmdW5jdGlvbihlbCkge1xuICBpZiAoIWVsKSByZXR1cm47XG4gIHZhciBwID0gZWwucHJvdG90eXBlO1xuICByZXR1cm4gKHAubWF0Y2hlc1NlbGVjdG9yIHx8IHAud2Via2l0TWF0Y2hlc1NlbGVjdG9yIHx8IHAubW96TWF0Y2hlc1NlbGVjdG9yIHx8IHAubXNNYXRjaGVzU2VsZWN0b3IgfHwgcC5vTWF0Y2hlc1NlbGVjdG9yKTtcbn0oSFRNTEVsZW1lbnQpKTtcblxuLyoqXG4gKiBDaGVjayB3aGV0aGVyIGFuIGVsZW1lbnRcbiAqIG1hdGNoZXMgYSB0YWcgc2VsZWN0b3IuXG4gKlxuICogVGFncyBhcmUgTk9UIGNhc2Utc2Vuc2l0aXZlLFxuICogZXhjZXB0IGluIFhNTCAoYW5kIFhNTC1iYXNlZFxuICogbGFuZ3VhZ2VzIHN1Y2ggYXMgWEhUTUwpLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSB0YWdOYW1lIFRoZSB0YWcgbmFtZSB0byB0ZXN0IGFnYWluc3RcbiAqIEBwYXJhbSB7RWxlbWVudH0gZWxlbWVudCBUaGUgZWxlbWVudCB0byB0ZXN0IHdpdGhcbiAqIEByZXR1cm5zIGJvb2xlYW5cbiAqL1xuRGVsZWdhdGUucHJvdG90eXBlLm1hdGNoZXNUYWcgPSBmdW5jdGlvbih0YWdOYW1lLCBlbGVtZW50KSB7XG4gIHJldHVybiB0YWdOYW1lID09PSBlbGVtZW50LnRhZ05hbWU7XG59O1xuXG4vKipcbiAqIENoZWNrIHdoZXRoZXIgYW4gZWxlbWVudFxuICogbWF0Y2hlcyB0aGUgcm9vdC5cbiAqXG4gKiBAcGFyYW0gez9TdHJpbmd9IHNlbGVjdG9yIEluIHRoaXMgY2FzZSB0aGlzIGlzIGFsd2F5cyBwYXNzZWQgdGhyb3VnaCBhcyBudWxsIGFuZCBub3QgdXNlZFxuICogQHBhcmFtIHtFbGVtZW50fSBlbGVtZW50IFRoZSBlbGVtZW50IHRvIHRlc3Qgd2l0aFxuICogQHJldHVybnMgYm9vbGVhblxuICovXG5EZWxlZ2F0ZS5wcm90b3R5cGUubWF0Y2hlc1Jvb3QgPSBmdW5jdGlvbihzZWxlY3RvciwgZWxlbWVudCkge1xuICByZXR1cm4gdGhpcy5yb290RWxlbWVudCA9PT0gZWxlbWVudDtcbn07XG5cbi8qKlxuICogQ2hlY2sgd2hldGhlciB0aGUgSUQgb2ZcbiAqIHRoZSBlbGVtZW50IGluICd0aGlzJ1xuICogbWF0Y2hlcyB0aGUgZ2l2ZW4gSUQuXG4gKlxuICogSURzIGFyZSBjYXNlLXNlbnNpdGl2ZS5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gaWQgVGhlIElEIHRvIHRlc3QgYWdhaW5zdFxuICogQHBhcmFtIHtFbGVtZW50fSBlbGVtZW50IFRoZSBlbGVtZW50IHRvIHRlc3Qgd2l0aFxuICogQHJldHVybnMgYm9vbGVhblxuICovXG5EZWxlZ2F0ZS5wcm90b3R5cGUubWF0Y2hlc0lkID0gZnVuY3Rpb24oaWQsIGVsZW1lbnQpIHtcbiAgcmV0dXJuIGlkID09PSBlbGVtZW50LmlkO1xufTtcblxuLyoqXG4gKiBTaG9ydCBoYW5kIGZvciBvZmYoKVxuICogYW5kIHJvb3QoKSwgaWUgYm90aFxuICogd2l0aCBubyBwYXJhbWV0ZXJzXG4gKlxuICogQHJldHVybiB2b2lkXG4gKi9cbkRlbGVnYXRlLnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMub2ZmKCk7XG4gIHRoaXMucm9vdCgpO1xufTtcbiIsIi8qanNoaW50IGJyb3dzZXI6dHJ1ZSwgbm9kZTp0cnVlKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIEBwcmVzZXJ2ZSBDcmVhdGUgYW5kIG1hbmFnZSBhIERPTSBldmVudCBkZWxlZ2F0b3IuXG4gKlxuICogQHZlcnNpb24gMC4zLjBcbiAqIEBjb2RpbmdzdGFuZGFyZCBmdGxhYnMtanN2MlxuICogQGNvcHlyaWdodCBUaGUgRmluYW5jaWFsIFRpbWVzIExpbWl0ZWQgW0FsbCBSaWdodHMgUmVzZXJ2ZWRdXG4gKiBAbGljZW5zZSBNSVQgTGljZW5zZSAoc2VlIExJQ0VOU0UudHh0KVxuICovXG52YXIgRGVsZWdhdGUgPSByZXF1aXJlKCcuL2RlbGVnYXRlJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24ocm9vdCkge1xuICByZXR1cm4gbmV3IERlbGVnYXRlKHJvb3QpO1xufTtcblxubW9kdWxlLmV4cG9ydHMuRGVsZWdhdGUgPSBEZWxlZ2F0ZTtcbiIsIlxuLyoqXG4gKiBFeHBvc2UgYHBhcnNlYC5cbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IHBhcnNlO1xuXG4vKipcbiAqIFdyYXAgbWFwIGZyb20ganF1ZXJ5LlxuICovXG5cbnZhciBtYXAgPSB7XG4gIG9wdGlvbjogWzEsICc8c2VsZWN0IG11bHRpcGxlPVwibXVsdGlwbGVcIj4nLCAnPC9zZWxlY3Q+J10sXG4gIG9wdGdyb3VwOiBbMSwgJzxzZWxlY3QgbXVsdGlwbGU9XCJtdWx0aXBsZVwiPicsICc8L3NlbGVjdD4nXSxcbiAgbGVnZW5kOiBbMSwgJzxmaWVsZHNldD4nLCAnPC9maWVsZHNldD4nXSxcbiAgdGhlYWQ6IFsxLCAnPHRhYmxlPicsICc8L3RhYmxlPiddLFxuICB0Ym9keTogWzEsICc8dGFibGU+JywgJzwvdGFibGU+J10sXG4gIHRmb290OiBbMSwgJzx0YWJsZT4nLCAnPC90YWJsZT4nXSxcbiAgY29sZ3JvdXA6IFsxLCAnPHRhYmxlPicsICc8L3RhYmxlPiddLFxuICBjYXB0aW9uOiBbMSwgJzx0YWJsZT4nLCAnPC90YWJsZT4nXSxcbiAgdHI6IFsyLCAnPHRhYmxlPjx0Ym9keT4nLCAnPC90Ym9keT48L3RhYmxlPiddLFxuICB0ZDogWzMsICc8dGFibGU+PHRib2R5Pjx0cj4nLCAnPC90cj48L3Rib2R5PjwvdGFibGU+J10sXG4gIHRoOiBbMywgJzx0YWJsZT48dGJvZHk+PHRyPicsICc8L3RyPjwvdGJvZHk+PC90YWJsZT4nXSxcbiAgY29sOiBbMiwgJzx0YWJsZT48dGJvZHk+PC90Ym9keT48Y29sZ3JvdXA+JywgJzwvY29sZ3JvdXA+PC90YWJsZT4nXSxcbiAgX2RlZmF1bHQ6IFswLCAnJywgJyddXG59O1xuXG4vKipcbiAqIFBhcnNlIGBodG1sYCBhbmQgcmV0dXJuIHRoZSBjaGlsZHJlbi5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gaHRtbFxuICogQHJldHVybiB7QXJyYXl9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBwYXJzZShodG1sKSB7XG4gIGlmICgnc3RyaW5nJyAhPSB0eXBlb2YgaHRtbCkgdGhyb3cgbmV3IFR5cGVFcnJvcignU3RyaW5nIGV4cGVjdGVkJyk7XG5cbiAgLy8gdGFnIG5hbWVcbiAgdmFyIG0gPSAvPChbXFx3Ol0rKS8uZXhlYyhodG1sKTtcbiAgaWYgKCFtKSB0aHJvdyBuZXcgRXJyb3IoJ05vIGVsZW1lbnRzIHdlcmUgZ2VuZXJhdGVkLicpO1xuICB2YXIgdGFnID0gbVsxXTtcblxuICAvLyBib2R5IHN1cHBvcnRcbiAgaWYgKHRhZyA9PSAnYm9keScpIHtcbiAgICB2YXIgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdodG1sJyk7XG4gICAgZWwuaW5uZXJIVE1MID0gaHRtbDtcbiAgICByZXR1cm4gZWwucmVtb3ZlQ2hpbGQoZWwubGFzdENoaWxkKTtcbiAgfVxuXG4gIC8vIHdyYXAgbWFwXG4gIHZhciB3cmFwID0gbWFwW3RhZ10gfHwgbWFwLl9kZWZhdWx0O1xuICB2YXIgZGVwdGggPSB3cmFwWzBdO1xuICB2YXIgcHJlZml4ID0gd3JhcFsxXTtcbiAgdmFyIHN1ZmZpeCA9IHdyYXBbMl07XG4gIHZhciBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICBlbC5pbm5lckhUTUwgPSBwcmVmaXggKyBodG1sICsgc3VmZml4O1xuICB3aGlsZSAoZGVwdGgtLSkgZWwgPSBlbC5sYXN0Q2hpbGQ7XG5cbiAgdmFyIGVscyA9IGVsLmNoaWxkcmVuO1xuICBpZiAoMSA9PSBlbHMubGVuZ3RoKSB7XG4gICAgcmV0dXJuIGVsLnJlbW92ZUNoaWxkKGVsc1swXSk7XG4gIH1cblxuICB2YXIgZnJhZ21lbnQgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XG4gIHdoaWxlIChlbHMubGVuZ3RoKSB7XG4gICAgZnJhZ21lbnQuYXBwZW5kQ2hpbGQoZWwucmVtb3ZlQ2hpbGQoZWxzWzBdKSk7XG4gIH1cblxuICByZXR1cm4gZnJhZ21lbnQ7XG59XG4iLCIvKiFcbiAgKiBkb21yZWFkeSAoYykgRHVzdGluIERpYXogMjAxMiAtIExpY2Vuc2UgTUlUXG4gICovXG4hZnVuY3Rpb24gKG5hbWUsIGRlZmluaXRpb24pIHtcbiAgaWYgKHR5cGVvZiBtb2R1bGUgIT0gJ3VuZGVmaW5lZCcpIG1vZHVsZS5leHBvcnRzID0gZGVmaW5pdGlvbigpXG4gIGVsc2UgaWYgKHR5cGVvZiBkZWZpbmUgPT0gJ2Z1bmN0aW9uJyAmJiB0eXBlb2YgZGVmaW5lLmFtZCA9PSAnb2JqZWN0JykgZGVmaW5lKGRlZmluaXRpb24pXG4gIGVsc2UgdGhpc1tuYW1lXSA9IGRlZmluaXRpb24oKVxufSgnZG9tcmVhZHknLCBmdW5jdGlvbiAocmVhZHkpIHtcblxuICB2YXIgZm5zID0gW10sIGZuLCBmID0gZmFsc2VcbiAgICAsIGRvYyA9IGRvY3VtZW50XG4gICAgLCB0ZXN0RWwgPSBkb2MuZG9jdW1lbnRFbGVtZW50XG4gICAgLCBoYWNrID0gdGVzdEVsLmRvU2Nyb2xsXG4gICAgLCBkb21Db250ZW50TG9hZGVkID0gJ0RPTUNvbnRlbnRMb2FkZWQnXG4gICAgLCBhZGRFdmVudExpc3RlbmVyID0gJ2FkZEV2ZW50TGlzdGVuZXInXG4gICAgLCBvbnJlYWR5c3RhdGVjaGFuZ2UgPSAnb25yZWFkeXN0YXRlY2hhbmdlJ1xuICAgICwgcmVhZHlTdGF0ZSA9ICdyZWFkeVN0YXRlJ1xuICAgICwgbG9hZGVkUmd4ID0gaGFjayA/IC9ebG9hZGVkfF5jLyA6IC9ebG9hZGVkfGMvXG4gICAgLCBsb2FkZWQgPSBsb2FkZWRSZ3gudGVzdChkb2NbcmVhZHlTdGF0ZV0pXG5cbiAgZnVuY3Rpb24gZmx1c2goZikge1xuICAgIGxvYWRlZCA9IDFcbiAgICB3aGlsZSAoZiA9IGZucy5zaGlmdCgpKSBmKClcbiAgfVxuXG4gIGRvY1thZGRFdmVudExpc3RlbmVyXSAmJiBkb2NbYWRkRXZlbnRMaXN0ZW5lcl0oZG9tQ29udGVudExvYWRlZCwgZm4gPSBmdW5jdGlvbiAoKSB7XG4gICAgZG9jLnJlbW92ZUV2ZW50TGlzdGVuZXIoZG9tQ29udGVudExvYWRlZCwgZm4sIGYpXG4gICAgZmx1c2goKVxuICB9LCBmKVxuXG5cbiAgaGFjayAmJiBkb2MuYXR0YWNoRXZlbnQob25yZWFkeXN0YXRlY2hhbmdlLCBmbiA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoL15jLy50ZXN0KGRvY1tyZWFkeVN0YXRlXSkpIHtcbiAgICAgIGRvYy5kZXRhY2hFdmVudChvbnJlYWR5c3RhdGVjaGFuZ2UsIGZuKVxuICAgICAgZmx1c2goKVxuICAgIH1cbiAgfSlcblxuICByZXR1cm4gKHJlYWR5ID0gaGFjayA/XG4gICAgZnVuY3Rpb24gKGZuKSB7XG4gICAgICBzZWxmICE9IHRvcCA/XG4gICAgICAgIGxvYWRlZCA/IGZuKCkgOiBmbnMucHVzaChmbikgOlxuICAgICAgICBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHRlc3RFbC5kb1Njcm9sbCgnbGVmdCcpXG4gICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IHJlYWR5KGZuKSB9LCA1MClcbiAgICAgICAgICB9XG4gICAgICAgICAgZm4oKVxuICAgICAgICB9KClcbiAgICB9IDpcbiAgICBmdW5jdGlvbiAoZm4pIHtcbiAgICAgIGxvYWRlZCA/IGZuKCkgOiBmbnMucHVzaChmbilcbiAgICB9KVxufSlcbiIsIi8qIVxyXG4gKiBkb3BlICAgICAgICAgSFRNTCBhdHRyaWJ1dGVzL2RhdGFzZXQgbW9kdWxlXHJcbiAqIEBsaW5rICAgICAgICBodHRwOi8vZ2l0aHViLmNvbS9yeWFudmUvZG9wZVxyXG4gKiBAbGljZW5zZSAgICAgTUlUXHJcbiAqIEBjb3B5cmlnaHQgICAyMDEyIFJ5YW4gVmFuIEV0dGVuXHJcbiAqIEB2ZXJzaW9uICAgICAyLjIuMVxyXG4gKi9cclxuXHJcbi8qanNoaW50IGV4cHI6dHJ1ZSwgc3ViOnRydWUsIHN1cGVybmV3OnRydWUsIGRlYnVnOnRydWUsIG5vZGU6dHJ1ZSwgYm9zczp0cnVlLCBkZXZlbDp0cnVlLCBldmlsOnRydWUsIFxyXG4gIGxheGNvbW1hOnRydWUsIGVxbnVsbDp0cnVlLCB1bmRlZjp0cnVlLCB1bnVzZWQ6dHJ1ZSwgYnJvd3Nlcjp0cnVlLCBqcXVlcnk6dHJ1ZSwgbWF4ZXJyOjEwMCAqL1xyXG5cclxuKGZ1bmN0aW9uKHJvb3QsIG5hbWUsIG1ha2UpIHtcclxuICAgIHR5cGVvZiBtb2R1bGUgIT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlWydleHBvcnRzJ10gPyBtb2R1bGVbJ2V4cG9ydHMnXSA9IG1ha2UoKSA6IHJvb3RbbmFtZV0gPSBtYWtlKCk7XHJcbn0odGhpcywgJ2RvcGUnLCBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAvLyBkZXZlbG9wZXJzLmdvb2dsZS5jb20vY2xvc3VyZS9jb21waWxlci9kb2NzL2FwaS10dXRvcmlhbDNcclxuICAgIC8vIGRldmVsb3BlcnMuZ29vZ2xlLmNvbS9jbG9zdXJlL2NvbXBpbGVyL2RvY3MvanMtZm9yLWNvbXBpbGVyXHJcblxyXG4gICAgdmFyIGRvYyA9IGRvY3VtZW50XHJcbiAgICAgICwgeHBvcnRzID0ge31cclxuICAgICAgLCBlZmZpbnMgPSB4cG9ydHNbJ2ZuJ10gPSB7fVxyXG4gICAgICAsIG93bnMgPSB4cG9ydHMuaGFzT3duUHJvcGVydHlcclxuICAgICAgLCBETVMgPSB0eXBlb2YgRE9NU3RyaW5nTWFwICE9ICd1bmRlZmluZWQnXHJcbiAgICAgICwgcGFyc2VKU09OID0gdHlwZW9mIEpTT04gIT0gJ3VuZGVmaW5lZCcgJiYgSlNPTi5wYXJzZVxyXG4gICAgICAsIHF1ZXJ5TWV0aG9kID0gJ3F1ZXJ5U2VsZWN0b3JBbGwnIFxyXG4gICAgICAsIFFTQSA9ICEhZG9jW3F1ZXJ5TWV0aG9kXSB8fCAhKHF1ZXJ5TWV0aG9kID0gJ2dldEVsZW1lbnRzQnlUYWdOYW1lJylcclxuICAgICAgLCBxdWVyeUVuZ2luZSA9IGZ1bmN0aW9uKHMsIHJvb3QpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHMgPyAocm9vdCB8fCBkb2MpW3F1ZXJ5TWV0aG9kXShzKSA6IFtdOyBcclxuICAgICAgICB9XHJcbiAgICAgICwgY2FtZWxzID0gLyhbYS16XSkoW0EtWl0pL2cgICAgICAgICAgICAvLyBsb3dlcmNhc2UgbmV4dCB0byB1cHBlcmNhc2VcclxuICAgICAgLCBkYXNoQjQgPSAvLSguKS9nICAgICAgICAgICAgICAgICAgICAgIC8vIGZpbmRzIGNoYXJzIGFmdGVyIGh5cGhlbnNcclxuICAgICAgLCBjc3ZTc3YgPSAvXFxzKltcXHNcXCxdK1xccyovICAgICAgICAgICAgICAvLyBzcGxpdHRlciBmb3IgY29tbWEgKm9yKiBzcGFjZS1zZXBhcmF0ZWQgdmFsdWVzXHJcbiAgICAgICwgY2xlYW5BdHRyID0gL15bXFxbXFxzXSt8XFxzK3xbXFxdXFxzXSskL2cgIC8vIHJlcGxhY2Ugd2hpdGVzcGFjZSwgdHJpbSBbXSBicmFja2V0c1xyXG4gICAgICAsIGNsZWFuUHJlID0gL15bXFxbXFxzXT8oZGF0YS0pP3xcXHMrfFtcXF1cXHNdPyQvZyAvLyByZXBsYWNlIHdoaXRlc3BhY2UsIHRyaW0gW10gYnJhY2tldHMsIHRyaW0gcHJlZml4XHJcbiAgICAgICwgZXNjRG90cyA9IC9cXFxcKlxcLi9nICAgICAgICAgICAgICAgICAgICAvLyBmaW5kIHBlcmlvZHMgdy8gYW5kIHcvbyBwcmVjZWRpbmcgYmFja3NsYXNoZXNcclxuICAgICAgLCBzc3YgPSAvXFxzKy9cclxuICAgICAgLCB0cmltbWVyID0gL15cXHMrfFxccyskL1xyXG4gICAgICAsIHRyaW0gPSAnJy50cmltID8gZnVuY3Rpb24ocykge1xyXG4gICAgICAgICAgICByZXR1cm4gbnVsbCA9PSBzID8gJycgOiBzLnRyaW0oKTsgXHJcbiAgICAgICAgfSA6IGZ1bmN0aW9uKHMpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG51bGwgPT0gcyA/ICcnIDogcy5yZXBsYWNlKHRyaW1tZXIsICcnKTsgXHJcbiAgICAgICAgfTtcclxuICAgIFxyXG4gICAgLyoqXHJcbiAgICAgKiBAcmV0dXJuICB7c3RyaW5nfVxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBjYW1lbEhhbmRsZXIoYWxsLCBsZXR0ZXIpIHsgXHJcbiAgICAgICAgcmV0dXJuIGxldHRlci50b1VwcGVyQ2FzZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ29udmVydCAgJ2RhdGEtcHVscC1maWN0aW9uJyB0byAncHVscEZpY3Rpb24nLiBOb24tc2NhbGFycyByZXR1cm4gYW5cclxuICAgICAqIGVtcHR5IHN0cmluZy4gbnVtYmVyfGJvb2xlYW4gY29lcmNlcyB0byBzdHJpbmcuIChvcHBvc2l0ZTogZGF0YXRpemUoKSlcclxuICAgICAqIEBwYXJhbSAgIHtzdHJpbmd8bnVtYmVyfGJvb2xlYW58Kn0gIHNcclxuICAgICAqIEByZXR1cm4gIHtzdHJpbmd9XHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIGNhbWVsaXplKHMpIHtcclxuICAgICAgICBpZiAodHlwZW9mIHMgIT0gJ3N0cmluZycpXHJcbiAgICAgICAgICAgIHJldHVybiB0eXBlb2YgcyA9PSAnbnVtYmVyJyB8fCB0eXBlb2YgcyA9PSAnYm9vbGVhbicgPyAnJyArIHMgOiAnJzsgXHJcbiAgICAgICAgLy8gUmVtb3ZlIGRhdGEtIHByZWZpeCBhbmQgY29udmVydCByZW1haW5pbmcgZGFzaGVkIHN0cmluZyB0byBjYW1lbENhc2U6XHJcbiAgICAgICAgcmV0dXJuIHMucmVwbGFjZShjbGVhblByZSwgJycpLnJlcGxhY2UoZGFzaEI0LCBjYW1lbEhhbmRsZXIpOyAvLyAtYSB0byBBXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDb252ZXJ0ICAncHVscEZpY3Rpb24nIHRvICdkYXRhLXB1bHAtZmljdGlvbicgT1IgNDcgdG8gJ2RhdGEtNDcnXHJcbiAgICAgKiBJbnZhbGlkIHR5cGVzIHJldHVybiBhbiBlbXB0eSBzdHJpbmcuIChvcHBvc2l0ZTogY2FtZWxpemUoKSlcclxuICAgICAqIEBwYXJhbSAgIHtzdHJpbmd8bnVtYmVyfCp9ICBzXHJcbiAgICAgKiBAcmV0dXJuICB7c3RyaW5nfVxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBkYXRhdGl6ZShzKSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBzID09ICdzdHJpbmcnKSBzID0gcy5yZXBsYWNlKGNsZWFuUHJlLCAnJDEnKS5yZXBsYWNlKGNhbWVscywgJyQxLSQyJyk7IC8vIGFBIHRvIGEtQVxyXG4gICAgICAgIGVsc2UgcyA9IHR5cGVvZiBzID09ICdudW1iZXInICA/ICcnICsgcyA6ICcnO1xyXG4gICAgICAgIHJldHVybiBzID8gKCdkYXRhLScgKyBzLnRvTG93ZXJDYXNlKCkpIDogcztcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIENvbnZlcnQgYSBzdHJpbmdpZmllZCBwcmltaXRpdmUgaW50byBpdHMgY29ycmVjdCB0eXBlLlxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd8Kn0gIHNcclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gcGFyc2Uocykge1xyXG4gICAgICAgIHZhciBuOyAvLyB1bmRlZmluZWQsIG9yIGJlY29tZXMgbnVtYmVyXHJcbiAgICAgICAgcmV0dXJuIHR5cGVvZiBzICE9ICdzdHJpbmcnIHx8ICFzID8gc1xyXG4gICAgICAgICAgICA6ICdmYWxzZScgPT09IHMgPyBmYWxzZVxyXG4gICAgICAgICAgICA6ICd0cnVlJyA9PT0gcyA/IHRydWVcclxuICAgICAgICAgICAgOiAnbnVsbCcgPT09IHMgPyBudWxsXHJcbiAgICAgICAgICAgIDogJ3VuZGVmaW5lZCcgPT09IHMgfHwgKG4gPSAoK3MpKSB8fCAwID09PSBuIHx8ICdOYU4nID09PSBzID8gblxyXG4gICAgICAgICAgICA6IHM7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAcGFyYW0gICB7T2JqZWN0fEFycmF5fCp9ICBsaXN0XHJcbiAgICAgKiBAcGFyYW0gICB7RnVuY3Rpb259ICAgICAgICBmbiAgICAgXHJcbiAgICAgKiBAcGFyYW0gICB7KE9iamVjdHwqKT19ICAgICBzY29wZVxyXG4gICAgICogQHBhcmFtICAge2Jvb2xlYW49fSAgICAgICAgY29tcGFjdCBcclxuICAgICAqIEByZXR1cm4gIHtBcnJheX1cclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gbWFwKGxpc3QsIGZuLCBzY29wZSwgY29tcGFjdCkge1xyXG4gICAgICAgIHZhciBsLCBpID0gMCwgdiwgdSA9IDAsIHJldCA9IFtdO1xyXG4gICAgICAgIGlmIChsaXN0ID09IG51bGwpIHJldHVybiByZXQ7XHJcbiAgICAgICAgY29tcGFjdCA9IHRydWUgPT09IGNvbXBhY3Q7XHJcbiAgICAgICAgZm9yIChsID0gbGlzdC5sZW5ndGg7IGkgPCBsOykge1xyXG4gICAgICAgICAgICB2ID0gZm4uY2FsbChzY29wZSwgbGlzdFtpXSwgaSsrLCBsaXN0KTtcclxuICAgICAgICAgICAgaWYgKHYgfHwgIWNvbXBhY3QpIHJldFt1KytdID0gdjtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHJldDtcclxuICAgIH1cclxuICAgIFxyXG4gICAgLyoqIFxyXG4gICAgICogc3BlY2lhbC1jYXNlIERPTS1ub2RlIGl0ZXJhdG9yIG9wdGltaXplZCBmb3IgaW50ZXJuYWwgdXNlXHJcbiAgICAgKiBAcGFyYW0ge09iamVjdHxBcnJheX0gIG9iXHJcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSAgICAgIGZuXHJcbiAgICAgKiBAcGFyYW0geyo9fSAgICAgICAgICAgIHBhcmFtXHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIGVhY2hOb2RlKG9iLCBmbiwgcGFyYW0pIHtcclxuICAgICAgICBmb3IgKHZhciBsID0gb2IubGVuZ3RoLCBpID0gMDsgaSA8IGw7IGkrKylcclxuICAgICAgICAgICAgb2JbaV0gJiYgb2JbaV0ubm9kZVR5cGUgJiYgZm4ob2JbaV0sIHBhcmFtKTtcclxuICAgICAgICByZXR1cm4gb2I7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBpbnRlcm5hbC11c2UgZnVuY3Rpb24gdG8gaXRlcmF0ZSBhIG5vZGUncyBhdHRyaWJ1dGVzXHJcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gICAgICAgIGVsXHJcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSAgICAgIGZuXHJcbiAgICAgKiBAcGFyYW0geyhib29sZWFufCopPX0gIGV4cFxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBlYWNoQXR0cihlbCwgZm4sIGV4cCkge1xyXG4gICAgICAgIHZhciB0ZXN0LCBuLCBhLCBpLCBsO1xyXG4gICAgICAgIGlmICghZWwuYXR0cmlidXRlcykgcmV0dXJuO1xyXG4gICAgICAgIHRlc3QgPSB0eXBlb2YgZXhwID09ICdib29sZWFuJyA/IC9eZGF0YS0vIDogdGVzdDtcclxuICAgICAgICBmb3IgKGkgPSAwLCBsID0gZWwuYXR0cmlidXRlcy5sZW5ndGg7IGkgPCBsOykge1xyXG4gICAgICAgICAgICBpZiAoYSA9IGVsLmF0dHJpYnV0ZXNbaSsrXSkge1xyXG4gICAgICAgICAgICAgICAgbiA9ICcnICsgYS5uYW1lO1xyXG4gICAgICAgICAgICAgICAgdGVzdCAmJiB0ZXN0LnRlc3QobikgIT09IGV4cCB8fCBudWxsID09IGEudmFsdWUgfHwgZm4uY2FsbChlbCwgYS52YWx1ZSwgbiwgYSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBHZXQgb2JqZWN0IGNvbnRhaW5pbmcgYW4gZWxlbWVudCdzIGRhdGEgYXR0cnMuXHJcbiAgICAgKiBAcGFyYW0gIHtOb2RlfSAgZWxcclxuICAgICAqIEByZXR1cm4ge0RPTVN0cmluZ01hcHxPYmplY3R8dW5kZWZpbmVkfVxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBnZXREYXRhc2V0KGVsKSB7XHJcbiAgICAgICAgdmFyIG9iO1xyXG4gICAgICAgIGlmICghZWwgfHwgMSAhPT0gZWwubm9kZVR5cGUpIHJldHVybjsgIC8vIHVuZGVmaW5lZFxyXG4gICAgICAgIGlmIChvYiA9IERNUyAmJiBlbC5kYXRhc2V0KSByZXR1cm4gb2I7IC8vIG5hdGl2ZVxyXG4gICAgICAgIG9iID0ge307IC8vIEZhbGxiYWNrIHBsYWluIG9iamVjdCBjYW5ub3QgbXV0YXRlIHRoZSBkYXRhc2V0IHZpYSByZWZlcmVuY2UuXHJcbiAgICAgICAgZWFjaEF0dHIoZWwsIGZ1bmN0aW9uKHYsIGspIHtcclxuICAgICAgICAgICAgb2JbY2FtZWxpemUoayldID0gJycgKyB2O1xyXG4gICAgICAgIH0sIHRydWUpO1xyXG4gICAgICAgIHJldHVybiBvYjtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEBwYXJhbSAge05vZGV9ICAgICBlbFxyXG4gICAgICogQHBhcmFtICB7T2JqZWN0PX0gIG9iXHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIHJlc2V0RGF0YXNldChlbCwgb2IpIHtcclxuICAgICAgICBpZiAoIWVsKSByZXR1cm47XHJcbiAgICAgICAgdmFyIG4sIGN1cnIgPSBlbC5kYXRhc2V0O1xyXG4gICAgICAgIGlmIChjdXJyICYmIERNUykge1xyXG4gICAgICAgICAgICBpZiAoY3VyciA9PT0gb2IpIHJldHVybjtcclxuICAgICAgICAgICAgZm9yIChuIGluIGN1cnIpIGRlbGV0ZSBjdXJyW25dO1xyXG4gICAgICAgIH1cclxuICAgICAgICBvYiAmJiBkYXRhc2V0KGVsLCBvYik7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8qKlxyXG4gICAgICogQHBhcmFtICB7Tm9kZX0gICAgICBlbFxyXG4gICAgICogQHBhcmFtICB7T2JqZWN0fSAgICBvYlxyXG4gICAgICogQHBhcmFtICB7RnVuY3Rpb259ICBmblxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBzZXRWaWFPYmplY3QoZWwsIG9iLCBmbikge1xyXG4gICAgICAgIGZvciAodmFyIG4gaW4gb2IpXHJcbiAgICAgICAgICAgIG93bnMuY2FsbChvYiwgbikgJiYgZm4oZWwsIG4sIG9iW25dKTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgLyoqXHJcbiAgICAgKiBAcGFyYW0gIHtPYmplY3R8QXJyYXl8RnVuY3Rpb259ICBlbFxyXG4gICAgICogQHBhcmFtICB7KHN0cmluZ3xPYmplY3R8Kik9fSAgICAga1xyXG4gICAgICogQHBhcmFtICB7Kj19ICAgICAgICAgICAgICAgICAgICAgdlxyXG4gICAgICovICAgIFxyXG4gICAgZnVuY3Rpb24gYXR0cihlbCwgaywgdikge1xyXG4gICAgICAgIGVsID0gZWwubm9kZVR5cGUgPyBlbCA6IGVsWzBdO1xyXG4gICAgICAgIGlmICghZWwgfHwgIWVsLnNldEF0dHJpYnV0ZSkgcmV0dXJuO1xyXG4gICAgICAgIGsgPSB0eXBlb2YgayA9PSAnZnVuY3Rpb24nID8gay5jYWxsKGVsKSA6IGs7XHJcbiAgICAgICAgaWYgKCFrKSByZXR1cm47XHJcbiAgICAgICAgaWYgKHR5cGVvZiBrID09ICdvYmplY3QnKSB7XHJcbiAgICAgICAgICAgIC8vIFNFVC1tdWx0aVxyXG4gICAgICAgICAgICBzZXRWaWFPYmplY3QoZWwsIGssIGF0dHIpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGlmICh2b2lkIDAgPT09IHYpIHtcclxuICAgICAgICAgICAgICAgIC8vIEdFVFxyXG4gICAgICAgICAgICAgICAgayA9IGVsLmdldEF0dHJpYnV0ZShrKTsgLy8gcmVwdXJwb3NlXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbCA9PSBrID8gdiA6ICcnICsgazsgLy8gbm9ybWFsaXplXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gU0VUXHJcbiAgICAgICAgICAgIHYgPSB0eXBlb2YgdiA9PSAnZnVuY3Rpb24nID8gdi5jYWxsKGVsKSA6IHY7XHJcbiAgICAgICAgICAgIHYgPSAnJyArIHY7IC8vIG5vcm1hbGl6ZSBpbnB1dHNcclxuICAgICAgICAgICAgZWwuc2V0QXR0cmlidXRlKGssIHYpO1xyXG4gICAgICAgICAgICByZXR1cm4gdjsgLy8gdGhlIGN1cnIgdmFsdWVcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8qKlxyXG4gICAgICogQHBhcmFtICB7T2JqZWN0fEFycmF5fEZ1bmN0aW9ufSAgZWxcclxuICAgICAqIEBwYXJhbSAgeyhzdHJpbmd8T2JqZWN0fCopPX0gICAgIGtcclxuICAgICAqIEBwYXJhbSAgeyo9fSAgICAgICAgICAgICAgICAgICAgIHZcclxuICAgICAqLyAgICBcclxuICAgIGZ1bmN0aW9uIGRhdGFzZXQoZWwsIGssIHYpIHtcclxuICAgICAgICB2YXIgZXhhY3QsIGtGdW4gPSB0eXBlb2YgayA9PSAnZnVuY3Rpb24nO1xyXG4gICAgICAgIGVsID0gZWwubm9kZVR5cGUgPyBlbCA6IGVsWzBdO1xyXG4gICAgICAgIGlmICghZWwgfHwgIWVsLnNldEF0dHJpYnV0ZSkgcmV0dXJuO1xyXG4gICAgICAgIGlmICh2b2lkIDAgPT09IGsgJiYgdiA9PT0gaykgcmV0dXJuIGdldERhdGFzZXQoZWwpO1xyXG4gICAgICAgIGsgPSBrRnVuID8gay5jYWxsKGVsKSA6IGs7XHJcblxyXG4gICAgICAgIGlmICh0eXBlb2YgayA9PSAnb2JqZWN0JyAmJiAoa0Z1biB8fCAhKGV4YWN0ID0gdm9pZCAwID09PSB2ICYmIGRhdGF0aXplKGtbMF0pKSkpIHtcclxuICAgICAgICAgICAgLy8gU0VULW11bHRpXHJcbiAgICAgICAgICAgIGtGdW4gJiYgZGVsZXRlcyhlbCk7XHJcbiAgICAgICAgICAgIGsgJiYgc2V0VmlhT2JqZWN0KGVsLCBrLCBkYXRhc2V0KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBrID0gZXhhY3QgfHwgZGF0YXRpemUoayk7XHJcbiAgICAgICAgICAgIGlmICghaykgcmV0dXJuO1xyXG4gICAgICAgICAgICBpZiAodm9pZCAwID09PSB2KSB7XHJcbiAgICAgICAgICAgICAgICAvLyBHRVRcclxuICAgICAgICAgICAgICAgIGsgPSBlbC5nZXRBdHRyaWJ1dGUoayk7IC8vIHJlcHVycG9zZVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGwgPT0gayA/IHYgOiBleGFjdCA/IHBhcnNlKGspIDogJycgKyBrOyAvLyBub3JtYWxpemVcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBTRVRcclxuICAgICAgICAgICAgdiA9IHR5cGVvZiB2ID09ICdmdW5jdGlvbicgPyB2LmNhbGwoZWwpIDogdjtcclxuICAgICAgICAgICAgdiA9ICcnICsgdjsgLy8gbm9ybWFsaXplIGlucHV0c1xyXG4gICAgICAgICAgICBlbC5zZXRBdHRyaWJ1dGUoaywgdik7XHJcbiAgICAgICAgICAgIHJldHVybiB2OyAvLyBjdXJyZW50IHZhbHVlXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQHBhcmFtICB7Tm9kZX0gICAgICAgICAgICAgICAgICAgZWxcclxuICAgICAqIEBwYXJhbSAgeyhBcnJheXxzdHJpbmd8bnVtYmVyKT19IGtleXNcclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gZGVsZXRlcyhlbCwga2V5cykge1xyXG4gICAgICAgIHZhciBrLCBpID0gMDtcclxuICAgICAgICBlbCA9IGVsLm5vZGVUeXBlID8gZWwgOiBlbFswXTtcclxuICAgICAgICBpZiAoIWVsIHx8ICFlbC5yZW1vdmVBdHRyaWJ1dGUpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICBpZiAodm9pZCAwID09PSBrZXlzKSB7XHJcbiAgICAgICAgICAgIHJlc2V0RGF0YXNldChlbCk7IFxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGtleXMgPSB0eXBlb2Yga2V5cyA9PSAnc3RyaW5nJyA/IGtleXMuc3BsaXQoc3N2KSA6IFtdLmNvbmNhdChrZXlzKTtcclxuICAgICAgICAgICAgd2hpbGUgKGkgPCBrZXlzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgayA9IGRhdGF0aXplKGtleXNbaSsrXSk7XHJcbiAgICAgICAgICAgICAgICBrICYmIGVsLnJlbW92ZUF0dHJpYnV0ZShrKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIFxyXG4gICAgLyoqXHJcbiAgICAgKiBAcGFyYW0gIHtOb2RlfSAgICAgICAgICAgICAgICBlbFxyXG4gICAgICogQHBhcmFtICB7QXJyYXl8c3RyaW5nfG51bWJlcn0ga2V5c1xyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiByZW1vdmVBdHRyKGVsLCBrZXlzKSB7XHJcbiAgICAgICAgdmFyIGkgPSAwO1xyXG4gICAgICAgIGVsID0gZWwubm9kZVR5cGUgPyBlbCA6IGVsWzBdO1xyXG4gICAgICAgIGlmIChlbCAmJiBlbC5yZW1vdmVBdHRyaWJ1dGUpIHtcclxuICAgICAgICAgICAgZm9yIChrZXlzID0gdHlwZW9mIGtleXMgPT0gJ3N0cmluZycgPyBrZXlzLnNwbGl0KHNzdikgOiBbXS5jb25jYXQoa2V5cyk7IGkgPCBrZXlzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBrZXlzW2ldICYmIGVsLnJlbW92ZUF0dHJpYnV0ZShrZXlzW2ldKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIENvbnZlcnQgbGlzdCBvZiBhdHRyIG5hbWVzIG9yIGRhdGEtIGtleXMgaW50byBhIHNlbGVjdG9yLlxyXG4gICAgICogQHBhcmFtICAge0FycmF5fHN0cmluZ3xudW1iZXJ8Kn0gIGxpc3RcclxuICAgICAqIEBwYXJhbSAgIHtib29sZWFuPX0gICAgICAgICAgICAgICBwcmVmaXhcclxuICAgICAqIEBwYXJhbSAgIHtib29sZWFuPX0gICAgICAgICAgICAgICBqb2luXHJcbiAgICAgKiBAcmV0dXJuICB7c3RyaW5nfEFycmF5fVxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiB0b0F0dHJTZWxlY3RvcihsaXN0LCBwcmVmaXgsIGpvaW4pIHtcclxuICAgICAgICB2YXIgbCwgcywgaSA9IDAsIGogPSAwLCBlbXAgPSAnJywgYXJyID0gW107XHJcbiAgICAgICAgcHJlZml4ID0gdHJ1ZSA9PT0gcHJlZml4O1xyXG4gICAgICAgIGxpc3QgPSB0eXBlb2YgbGlzdCA9PSAnc3RyaW5nJyA/IGxpc3Quc3BsaXQoY3N2U3N2KSA6IHR5cGVvZiBsaXN0ID09ICdudW1iZXInID8gJycgKyBsaXN0IDogbGlzdDtcclxuICAgICAgICBmb3IgKGwgPSBsaXN0Lmxlbmd0aDsgaSA8IGw7KSB7XHJcbiAgICAgICAgICAgIHMgPSBsaXN0W2krK107XHJcbiAgICAgICAgICAgIHMgPSBwcmVmaXggPyBkYXRhdGl6ZShzKSA6IHMucmVwbGFjZShjbGVhbkF0dHIsIGVtcCk7XHJcbiAgICAgICAgICAgIHMgJiYgKGFycltqKytdID0gcyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIEVzY2FwZSBwZXJpb2RzIHRvIGFsbG93IGF0dHMgbGlrZSBgW2RhdGEtdGhlLndoX29dYFxyXG4gICAgICAgIC8vIEBsaW5rIGFwaS5qcXVlcnkuY29tL2NhdGVnb3J5L3NlbGVjdG9ycy9cclxuICAgICAgICAvLyBAbGluayBzdGFja292ZXJmbG93LmNvbS9xLzEzMjgzNjk5Lzc3MDEyN1xyXG4gICAgICAgIHJldHVybiBmYWxzZSA9PT0gam9pbiA/IGFyciA6IGogPyAnWycgKyBhcnIuam9pbignXSxbJykucmVwbGFjZShlc2NEb3RzLCAnXFxcXFxcXFwuJykgKyAnXScgOiBlbXA7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBHZXQgZWxlbWVudHMgbWF0Y2hlZCBieSBhIGRhdGEga2V5LlxyXG4gICAgICogQHBhcmFtICAge0FycmF5fHN0cmluZ30gIGxpc3QgICBhcnJheSBvciBDU1Ygb3IgU1NWIGRhdGEga2V5c1xyXG4gICAgICogQHJldHVybiAge0FycmF5fCp9XHJcbiAgICAgKi8gICAgIFxyXG4gICAgeHBvcnRzWydxdWVyeURhdGEnXSA9IFFTQSA/IGZ1bmN0aW9uKGxpc3QsIHJvb3QpIHtcclxuICAgICAgICAvLyBNb2Rlcm4gYnJvd3NlcnMsIElFOCtcclxuICAgICAgICByZXR1cm4gZmFsc2UgPT09IHJvb3QgPyB0b0F0dHJTZWxlY3RvcihsaXN0LCB0cnVlLCByb290KSA6IHF1ZXJ5RW5naW5lKHRvQXR0clNlbGVjdG9yKGxpc3QsIHRydWUpLCByb290KTtcclxuICAgIH0gOiBmdW5jdGlvbihsaXN0LCByb290KSB7XHJcbiAgICAgICAgLy8gPT0gRkFMTEJBQ0sgPT1cclxuICAgICAgICBsaXN0ID0gdG9BdHRyU2VsZWN0b3IobGlzdCwgdHJ1ZSwgZmFsc2UpO1xyXG4gICAgICAgIHJldHVybiBmYWxzZSA9PT0gcm9vdCA/IGxpc3QgOiBxdWVyeUF0dHJGYWxsYmFjayhsaXN0LCByb290KTsgXHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICAvKipcclxuICAgICAqIEdldCBlbGVtZW50cyBtYXRjaGVkIGJ5IGFuIGF0dHJpYnV0ZSBuYW1lLlxyXG4gICAgICogQHBhcmFtICAge0FycmF5fHN0cmluZ30gIGxpc3QgICBhcnJheSBvciBDU1Ygb3IgU1NWIGRhdGEga2V5c1xyXG4gICAgICogQHJldHVybiAge0FycmF5fCp9XHJcbiAgICAgKi8gICAgIFxyXG4gICAgeHBvcnRzWydxdWVyeUF0dHInXSA9IFFTQSA/IGZ1bmN0aW9uKGxpc3QsIHJvb3QpIHtcclxuICAgICAgICAvLyBNb2Rlcm4gYnJvd3NlcnMsIElFOCtcclxuICAgICAgICByZXR1cm4gZmFsc2UgPT09IHJvb3QgPyB0b0F0dHJTZWxlY3RvcihsaXN0LCByb290LCByb290KSA6IHF1ZXJ5RW5naW5lKHRvQXR0clNlbGVjdG9yKGxpc3QpLCByb290KTtcclxuICAgIH0gOiBmdW5jdGlvbihsaXN0LCByb290KSB7XHJcbiAgICAgICAgLy8gPT0gRkFMTEJBQ0sgPT1cclxuICAgICAgICBsaXN0ID0gdG9BdHRyU2VsZWN0b3IobGlzdCwgZmFsc2UsIGZhbHNlKTtcclxuICAgICAgICByZXR1cm4gZmFsc2UgPT09IHJvb3QgPyBsaXN0IDogcXVlcnlBdHRyRmFsbGJhY2sobGlzdCwgcm9vdCk7IFxyXG4gICAgfTtcclxuICAgIFxyXG4gICAgLyoqXHJcbiAgICAgKiBAcGFyYW0ge0FycmF5fHN0cmluZ30gIGxpc3QgICBpcyBhbiBhcnJheSBvZiBhdHRyaWJ1dGUgbmFtZXMgKHcvbyBicmFja3MpXHJcbiAgICAgKiBAcGFyYW0ge09iamVjdD19ICAgICAgIHJvb3RcclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gcXVlcnlBdHRyRmFsbGJhY2sobGlzdCwgcm9vdCkge1xyXG4gICAgICAgIHZhciBqLCBpLCBlLCBlbHMsIGwgPSBsaXN0Lmxlbmd0aCwgcmV0ID0gW10sIHUgPSAwO1xyXG4gICAgICAgIGlmICghbCkgcmV0dXJuIHJldDtcclxuICAgICAgICBlbHMgPSBxdWVyeUVuZ2luZSgnKicsIHJvb3QpO1xyXG4gICAgICAgIGZvciAoaiA9IDA7IChlID0gZWxzW2pdKTsgaisrKSB7XHJcbiAgICAgICAgICAgIGkgPSBsOyAvLyByZXNldCBpIGZvciBlYWNoIG91dGVyIGl0ZXJhdGlvblxyXG4gICAgICAgICAgICB3aGlsZSAoaS0tKSB7Ly8gZWFjaCBhdHRyIG5hbWVcclxuICAgICAgICAgICAgICAgIGlmIChhdHRyKGUsIGxpc3RbaV0pICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXRbdSsrXSA9IGU7IC8vIGdoZXR0byBwdXNoXHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7IC8vIHByZXZlbnQgcHVzaGluZyBzYW1lIGVsZW0gdHdpY2VcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gcmV0O1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyBFeHBvc2UgcmVtYWluaW5nIHRvcC1sZXZlbCBtZXRob2RzOlxyXG4gICAgeHBvcnRzWydtYXAnXSA9IG1hcDtcclxuICAgIHhwb3J0c1sncGFyc2UnXSA9IHBhcnNlO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogQHBhcmFtICB7c3RyaW5nfCp9ICBzXHJcbiAgICAgKiBAc2luY2UgIDIuMS4wXHJcbiAgICAgKi9cclxuICAgIHhwb3J0c1sncGFyc2VKU09OJ10gPSBmdW5jdGlvbihzKSB7XHJcbiAgICAgICAgcyA9IHBhcnNlKHMpO1xyXG4gICAgICAgIGlmICh0eXBlb2YgcyA9PSAnc3RyaW5nJykge1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgcyA9IHBhcnNlSlNPTih0cmltKHMpKTtcclxuICAgICAgICAgICAgfSBjYXRjaCAoZSkge31cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHM7XHJcbiAgICB9O1xyXG5cclxuICAgIHhwb3J0c1sndHJpbSddID0gdHJpbTtcclxuICAgIHhwb3J0c1sncXNhJ10gPSBxdWVyeUVuZ2luZTtcclxuICAgIHhwb3J0c1snYXR0ciddID0gYXR0cjtcclxuICAgIHhwb3J0c1sncmVtb3ZlQXR0ciddID0gcmVtb3ZlQXR0cjtcclxuICAgIHhwb3J0c1snZGF0YXNldCddID0gZGF0YXNldDtcclxuICAgIHhwb3J0c1snZGVsZXRlcyddID0gZGVsZXRlcztcclxuICAgIHhwb3J0c1snY2FtZWxpemUnXSA9IGNhbWVsaXplO1xyXG4gICAgeHBvcnRzWydkYXRhdGl6ZSddID0gZGF0YXRpemU7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAdGhpcyAgICB7T2JqZWN0fEFycmF5fVxyXG4gICAgICogQHBhcmFtICAgeyo9fSAgIGtcclxuICAgICAqIEBwYXJhbSAgIHsqPX0gICB2XHJcbiAgICAgKi9cclxuICAgIGVmZmluc1snZGF0YXNldCddID0gZnVuY3Rpb24oaywgdikge1xyXG4gICAgICAgIHZhciBrTXVsdGkgPSB0eXBlb2YgayA9PSAnb2JqZWN0JyA/ICEodm9pZCAwID09PSB2ICYmIGRhdGF0aXplKGtbMF0pKSA6IHR5cGVvZiBrID09ICdmdW5jdGlvbic7XHJcbiAgICAgICAgaWYgKHZvaWQgMCA9PT0gdiAmJiAha011bHRpKVxyXG4gICAgICAgICAgICByZXR1cm4gZGF0YXNldCh0aGlzWzBdLCBrKTsgLy8gR0VUXHJcbiAgICAgICAgcmV0dXJuIChrID0ga011bHRpID8gayA6IGRhdGF0aXplKGspKSA/IGVhY2hOb2RlKHRoaXMsIGZ1bmN0aW9uKGUsIHgpIHtcclxuICAgICAgICAgICAgeCA9IHR5cGVvZiB2ID09ICdmdW5jdGlvbicgPyB2LmNhbGwoZSkgOiB2O1xyXG4gICAgICAgICAgICBrTXVsdGkgPyBkYXRhc2V0KGUsIGssIHgpIDogZS5zZXRBdHRyaWJ1dGUoaywgJycgKyB4KTsgXHJcbiAgICAgICAgfSkgOiB2b2lkIDAgPT09IHYgPyB2IDogdGhpcztcclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAdGhpcyAgICB7T2JqZWN0fEFycmF5fVxyXG4gICAgICogQHBhcmFtICAgeyo9fSAgIGtcclxuICAgICAqIEBwYXJhbSAgIHsqPX0gICB2XHJcbiAgICAgKi8gICAgXHJcbiAgICBlZmZpbnNbJ2F0dHInXSA9IGZ1bmN0aW9uKGssIHYpIHtcclxuICAgICAgICB2YXIga011bHRpID0gdHlwZW9mIGsgPT0gJ29iamVjdCcgfHwgdHlwZW9mIGsgPT0gJ2Z1bmN0aW9uJztcclxuICAgICAgICBpZiAodm9pZCAwID09PSB2ICYmICFrTXVsdGkpXHJcbiAgICAgICAgICAgIHJldHVybiBhdHRyKHRoaXNbMF0sIGspOyAvLyBHRVRcclxuICAgICAgICByZXR1cm4gayA/IGVhY2hOb2RlKHRoaXMsIGZ1bmN0aW9uKGUsIHgpIHtcclxuICAgICAgICAgICAgeCA9IHR5cGVvZiB2ID09ICdmdW5jdGlvbicgPyB2LmNhbGwoZSkgOiB2O1xyXG4gICAgICAgICAgICBrTXVsdGkgPyBhdHRyKGUsIGssIHgpIDogZS5zZXRBdHRyaWJ1dGUoaywgJycgKyB4KTsgXHJcbiAgICAgICAgfSkgOiAodm9pZCAwID09PSB2ID8gdiA6IHRoaXMpO1xyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFJlbW92ZSBkYXRhLSBhdHRycyBmb3IgZWFjaCBlbGVtZW50IGluIGEgY29sbGVjdGlvbi5cclxuICAgICAqIEB0aGlzICB7T2JqZWN0fEFycmF5fVxyXG4gICAgICogQHBhcmFtIHtBcnJheXxzdHJpbmd9ICBrZXlzICBvbmUgb3IgbW9yZSBTU1Ygb3IgQ1NWIGRhdGEgYXR0ciBrZXlzIG9yIG5hbWVzXHJcbiAgICAgKi9cclxuICAgIGVmZmluc1snZGVsZXRlcyddID0gZnVuY3Rpb24oa2V5cykge1xyXG4gICAgICAgIGlmICh2b2lkIDAgPT09IGtleXMpXHJcbiAgICAgICAgICAgIHJldHVybiBlYWNoTm9kZSh0aGlzLCByZXNldERhdGFzZXQpO1xyXG4gICAgICAgIGtleXMgPSB0eXBlb2Yga2V5cyA9PSAnc3RyaW5nJyA/IGtleXMuc3BsaXQoc3N2KSA6IFtdLmNvbmNhdChrZXlzKTtcclxuICAgICAgICByZXR1cm4gZWFjaE5vZGUodGhpcywgcmVtb3ZlQXR0ciwgbWFwKGtleXMsIGRhdGF0aXplKSk7XHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICAvKipcclxuICAgICAqIFJlbW92ZSBhdHRyYnV0ZXMgZm9yIGVhY2ggZWxlbWVudCBpbiBhIGNvbGxlY3Rpb24uXHJcbiAgICAgKiBAdGhpcyAge09iamVjdHxBcnJheX1cclxuICAgICAqIEBwYXJhbSB7QXJyYXl8c3RyaW5nfSAga2V5cyAgb25lIG9yIG1vcmUgU1NWIG9yIENTViBhdHRyIG5hbWVzXHJcbiAgICAgKi9cclxuICAgIGVmZmluc1sncmVtb3ZlQXR0ciddID0gZnVuY3Rpb24oa2V5cykge1xyXG4gICAgICAgIHJldHVybiBlYWNoTm9kZSh0aGlzLCByZW1vdmVBdHRyLCBrZXlzKTtcclxuICAgIH07XHJcblxyXG4gICAgcmV0dXJuIHhwb3J0cztcclxufSkpOyIsIi8vIEtub2Nrb3V0IEphdmFTY3JpcHQgbGlicmFyeSB2Mi4zLjBcbi8vIChjKSBTdGV2ZW4gU2FuZGVyc29uIC0gaHR0cDovL2tub2Nrb3V0anMuY29tL1xuLy8gTGljZW5zZTogTUlUIChodHRwOi8vd3d3Lm9wZW5zb3VyY2Uub3JnL2xpY2Vuc2VzL21pdC1saWNlbnNlLnBocClcblxuKGZ1bmN0aW9uKCl7XG52YXIgREVCVUc9dHJ1ZTtcbihmdW5jdGlvbih1bmRlZmluZWQpe1xuICAgIC8vICgwLCBldmFsKSgndGhpcycpIGlzIGEgcm9idXN0IHdheSBvZiBnZXR0aW5nIGEgcmVmZXJlbmNlIHRvIHRoZSBnbG9iYWwgb2JqZWN0XG4gICAgLy8gRm9yIGRldGFpbHMsIHNlZSBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzE0MTE5OTg4L3JldHVybi10aGlzLTAtZXZhbHRoaXMvMTQxMjAwMjMjMTQxMjAwMjNcbiAgICB2YXIgd2luZG93ID0gdGhpcyB8fCAoMCwgZXZhbCkoJ3RoaXMnKSxcbiAgICAgICAgZG9jdW1lbnQgPSB3aW5kb3dbJ2RvY3VtZW50J10sXG4gICAgICAgIG5hdmlnYXRvciA9IHdpbmRvd1snbmF2aWdhdG9yJ10sXG4gICAgICAgIGpRdWVyeSA9IHdpbmRvd1tcImpRdWVyeVwiXSxcbiAgICAgICAgSlNPTiA9IHdpbmRvd1tcIkpTT05cIl07XG4oZnVuY3Rpb24oZmFjdG9yeSkge1xuICAgIC8vIFN1cHBvcnQgdGhyZWUgbW9kdWxlIGxvYWRpbmcgc2NlbmFyaW9zXG4gICAgaWYgKHR5cGVvZiByZXF1aXJlID09PSAnZnVuY3Rpb24nICYmIHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0Jykge1xuICAgICAgICAvLyBbMV0gQ29tbW9uSlMvTm9kZS5qc1xuICAgICAgICB2YXIgdGFyZ2V0ID0gbW9kdWxlWydleHBvcnRzJ10gfHwgZXhwb3J0czsgLy8gbW9kdWxlLmV4cG9ydHMgaXMgZm9yIE5vZGUuanNcbiAgICAgICAgZmFjdG9yeSh0YXJnZXQpO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmVbJ2FtZCddKSB7XG4gICAgICAgIC8vIFsyXSBBTUQgYW5vbnltb3VzIG1vZHVsZVxuICAgICAgICBkZWZpbmUoWydleHBvcnRzJ10sIGZhY3RvcnkpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFszXSBObyBtb2R1bGUgbG9hZGVyIChwbGFpbiA8c2NyaXB0PiB0YWcpIC0gcHV0IGRpcmVjdGx5IGluIGdsb2JhbCBuYW1lc3BhY2VcbiAgICAgICAgZmFjdG9yeSh3aW5kb3dbJ2tvJ10gPSB7fSk7XG4gICAgfVxufShmdW5jdGlvbihrb0V4cG9ydHMpe1xuLy8gSW50ZXJuYWxseSwgYWxsIEtPIG9iamVjdHMgYXJlIGF0dGFjaGVkIHRvIGtvRXhwb3J0cyAoZXZlbiB0aGUgbm9uLWV4cG9ydGVkIG9uZXMgd2hvc2UgbmFtZXMgd2lsbCBiZSBtaW5pZmllZCBieSB0aGUgY2xvc3VyZSBjb21waWxlcikuXG4vLyBJbiB0aGUgZnV0dXJlLCB0aGUgZm9sbG93aW5nIFwia29cIiB2YXJpYWJsZSBtYXkgYmUgbWFkZSBkaXN0aW5jdCBmcm9tIFwia29FeHBvcnRzXCIgc28gdGhhdCBwcml2YXRlIG9iamVjdHMgYXJlIG5vdCBleHRlcm5hbGx5IHJlYWNoYWJsZS5cbnZhciBrbyA9IHR5cGVvZiBrb0V4cG9ydHMgIT09ICd1bmRlZmluZWQnID8ga29FeHBvcnRzIDoge307XG4vLyBHb29nbGUgQ2xvc3VyZSBDb21waWxlciBoZWxwZXJzICh1c2VkIG9ubHkgdG8gbWFrZSB0aGUgbWluaWZpZWQgZmlsZSBzbWFsbGVyKVxua28uZXhwb3J0U3ltYm9sID0gZnVuY3Rpb24oa29QYXRoLCBvYmplY3QpIHtcblx0dmFyIHRva2VucyA9IGtvUGF0aC5zcGxpdChcIi5cIik7XG5cblx0Ly8gSW4gdGhlIGZ1dHVyZSwgXCJrb1wiIG1heSBiZWNvbWUgZGlzdGluY3QgZnJvbSBcImtvRXhwb3J0c1wiIChzbyB0aGF0IG5vbi1leHBvcnRlZCBvYmplY3RzIGFyZSBub3QgcmVhY2hhYmxlKVxuXHQvLyBBdCB0aGF0IHBvaW50LCBcInRhcmdldFwiIHdvdWxkIGJlIHNldCB0bzogKHR5cGVvZiBrb0V4cG9ydHMgIT09IFwidW5kZWZpbmVkXCIgPyBrb0V4cG9ydHMgOiBrbylcblx0dmFyIHRhcmdldCA9IGtvO1xuXG5cdGZvciAodmFyIGkgPSAwOyBpIDwgdG9rZW5zLmxlbmd0aCAtIDE7IGkrKylcblx0XHR0YXJnZXQgPSB0YXJnZXRbdG9rZW5zW2ldXTtcblx0dGFyZ2V0W3Rva2Vuc1t0b2tlbnMubGVuZ3RoIC0gMV1dID0gb2JqZWN0O1xufTtcbmtvLmV4cG9ydFByb3BlcnR5ID0gZnVuY3Rpb24ob3duZXIsIHB1YmxpY05hbWUsIG9iamVjdCkge1xuICBvd25lcltwdWJsaWNOYW1lXSA9IG9iamVjdDtcbn07XG5rby52ZXJzaW9uID0gXCIyLjMuMFwiO1xuXG5rby5leHBvcnRTeW1ib2woJ3ZlcnNpb24nLCBrby52ZXJzaW9uKTtcbmtvLnV0aWxzID0gKGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgb2JqZWN0Rm9yRWFjaCA9IGZ1bmN0aW9uKG9iaiwgYWN0aW9uKSB7XG4gICAgICAgIGZvciAodmFyIHByb3AgaW4gb2JqKSB7XG4gICAgICAgICAgICBpZiAob2JqLmhhc093blByb3BlcnR5KHByb3ApKSB7XG4gICAgICAgICAgICAgICAgYWN0aW9uKHByb3AsIG9ialtwcm9wXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLy8gUmVwcmVzZW50IHRoZSBrbm93biBldmVudCB0eXBlcyBpbiBhIGNvbXBhY3Qgd2F5LCB0aGVuIGF0IHJ1bnRpbWUgdHJhbnNmb3JtIGl0IGludG8gYSBoYXNoIHdpdGggZXZlbnQgbmFtZSBhcyBrZXkgKGZvciBmYXN0IGxvb2t1cClcbiAgICB2YXIga25vd25FdmVudHMgPSB7fSwga25vd25FdmVudFR5cGVzQnlFdmVudE5hbWUgPSB7fTtcbiAgICB2YXIga2V5RXZlbnRUeXBlTmFtZSA9IChuYXZpZ2F0b3IgJiYgL0ZpcmVmb3hcXC8yL2kudGVzdChuYXZpZ2F0b3IudXNlckFnZW50KSkgPyAnS2V5Ym9hcmRFdmVudCcgOiAnVUlFdmVudHMnO1xuICAgIGtub3duRXZlbnRzW2tleUV2ZW50VHlwZU5hbWVdID0gWydrZXl1cCcsICdrZXlkb3duJywgJ2tleXByZXNzJ107XG4gICAga25vd25FdmVudHNbJ01vdXNlRXZlbnRzJ10gPSBbJ2NsaWNrJywgJ2RibGNsaWNrJywgJ21vdXNlZG93bicsICdtb3VzZXVwJywgJ21vdXNlbW92ZScsICdtb3VzZW92ZXInLCAnbW91c2VvdXQnLCAnbW91c2VlbnRlcicsICdtb3VzZWxlYXZlJ107XG4gICAgb2JqZWN0Rm9yRWFjaChrbm93bkV2ZW50cywgZnVuY3Rpb24oZXZlbnRUeXBlLCBrbm93bkV2ZW50c0ZvclR5cGUpIHtcbiAgICAgICAgaWYgKGtub3duRXZlbnRzRm9yVHlwZS5sZW5ndGgpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBqID0ga25vd25FdmVudHNGb3JUeXBlLmxlbmd0aDsgaSA8IGo7IGkrKylcbiAgICAgICAgICAgICAgICBrbm93bkV2ZW50VHlwZXNCeUV2ZW50TmFtZVtrbm93bkV2ZW50c0ZvclR5cGVbaV1dID0gZXZlbnRUeXBlO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgdmFyIGV2ZW50c1RoYXRNdXN0QmVSZWdpc3RlcmVkVXNpbmdBdHRhY2hFdmVudCA9IHsgJ3Byb3BlcnR5Y2hhbmdlJzogdHJ1ZSB9OyAvLyBXb3JrYXJvdW5kIGZvciBhbiBJRTkgaXNzdWUgLSBodHRwczovL2dpdGh1Yi5jb20vU3RldmVTYW5kZXJzb24va25vY2tvdXQvaXNzdWVzLzQwNlxuXG4gICAgLy8gRGV0ZWN0IElFIHZlcnNpb25zIGZvciBidWcgd29ya2Fyb3VuZHMgKHVzZXMgSUUgY29uZGl0aW9uYWxzLCBub3QgVUEgc3RyaW5nLCBmb3Igcm9idXN0bmVzcylcbiAgICAvLyBOb3RlIHRoYXQsIHNpbmNlIElFIDEwIGRvZXMgbm90IHN1cHBvcnQgY29uZGl0aW9uYWwgY29tbWVudHMsIHRoZSBmb2xsb3dpbmcgbG9naWMgb25seSBkZXRlY3RzIElFIDwgMTAuXG4gICAgLy8gQ3VycmVudGx5IHRoaXMgaXMgYnkgZGVzaWduLCBzaW5jZSBJRSAxMCsgYmVoYXZlcyBjb3JyZWN0bHkgd2hlbiB0cmVhdGVkIGFzIGEgc3RhbmRhcmQgYnJvd3Nlci5cbiAgICAvLyBJZiB0aGVyZSBpcyBhIGZ1dHVyZSBuZWVkIHRvIGRldGVjdCBzcGVjaWZpYyB2ZXJzaW9ucyBvZiBJRTEwKywgd2Ugd2lsbCBhbWVuZCB0aGlzLlxuICAgIHZhciBpZVZlcnNpb24gPSBkb2N1bWVudCAmJiAoZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciB2ZXJzaW9uID0gMywgZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyksIGlFbGVtcyA9IGRpdi5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaScpO1xuXG4gICAgICAgIC8vIEtlZXAgY29uc3RydWN0aW5nIGNvbmRpdGlvbmFsIEhUTUwgYmxvY2tzIHVudGlsIHdlIGhpdCBvbmUgdGhhdCByZXNvbHZlcyB0byBhbiBlbXB0eSBmcmFnbWVudFxuICAgICAgICB3aGlsZSAoXG4gICAgICAgICAgICBkaXYuaW5uZXJIVE1MID0gJzwhLS1baWYgZ3QgSUUgJyArICgrK3ZlcnNpb24pICsgJ10+PGk+PC9pPjwhW2VuZGlmXS0tPicsXG4gICAgICAgICAgICBpRWxlbXNbMF1cbiAgICAgICAgKSB7fVxuICAgICAgICByZXR1cm4gdmVyc2lvbiA+IDQgPyB2ZXJzaW9uIDogdW5kZWZpbmVkO1xuICAgIH0oKSk7XG4gICAgdmFyIGlzSWU2ID0gaWVWZXJzaW9uID09PSA2LFxuICAgICAgICBpc0llNyA9IGllVmVyc2lvbiA9PT0gNztcblxuICAgIGZ1bmN0aW9uIGlzQ2xpY2tPbkNoZWNrYWJsZUVsZW1lbnQoZWxlbWVudCwgZXZlbnRUeXBlKSB7XG4gICAgICAgIGlmICgoa28udXRpbHMudGFnTmFtZUxvd2VyKGVsZW1lbnQpICE9PSBcImlucHV0XCIpIHx8ICFlbGVtZW50LnR5cGUpIHJldHVybiBmYWxzZTtcbiAgICAgICAgaWYgKGV2ZW50VHlwZS50b0xvd2VyQ2FzZSgpICE9IFwiY2xpY2tcIikgcmV0dXJuIGZhbHNlO1xuICAgICAgICB2YXIgaW5wdXRUeXBlID0gZWxlbWVudC50eXBlO1xuICAgICAgICByZXR1cm4gKGlucHV0VHlwZSA9PSBcImNoZWNrYm94XCIpIHx8IChpbnB1dFR5cGUgPT0gXCJyYWRpb1wiKTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBmaWVsZHNJbmNsdWRlZFdpdGhKc29uUG9zdDogWydhdXRoZW50aWNpdHlfdG9rZW4nLCAvXl9fUmVxdWVzdFZlcmlmaWNhdGlvblRva2VuKF8uKik/JC9dLFxuXG4gICAgICAgIGFycmF5Rm9yRWFjaDogZnVuY3Rpb24gKGFycmF5LCBhY3Rpb24pIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBqID0gYXJyYXkubGVuZ3RoOyBpIDwgajsgaSsrKVxuICAgICAgICAgICAgICAgIGFjdGlvbihhcnJheVtpXSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgYXJyYXlJbmRleE9mOiBmdW5jdGlvbiAoYXJyYXksIGl0ZW0pIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgQXJyYXkucHJvdG90eXBlLmluZGV4T2YgPT0gXCJmdW5jdGlvblwiKVxuICAgICAgICAgICAgICAgIHJldHVybiBBcnJheS5wcm90b3R5cGUuaW5kZXhPZi5jYWxsKGFycmF5LCBpdGVtKTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBqID0gYXJyYXkubGVuZ3RoOyBpIDwgajsgaSsrKVxuICAgICAgICAgICAgICAgIGlmIChhcnJheVtpXSA9PT0gaXRlbSlcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGk7XG4gICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgIH0sXG5cbiAgICAgICAgYXJyYXlGaXJzdDogZnVuY3Rpb24gKGFycmF5LCBwcmVkaWNhdGUsIHByZWRpY2F0ZU93bmVyKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgaiA9IGFycmF5Lmxlbmd0aDsgaSA8IGo7IGkrKylcbiAgICAgICAgICAgICAgICBpZiAocHJlZGljYXRlLmNhbGwocHJlZGljYXRlT3duZXIsIGFycmF5W2ldKSlcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGFycmF5W2ldO1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH0sXG5cbiAgICAgICAgYXJyYXlSZW1vdmVJdGVtOiBmdW5jdGlvbiAoYXJyYXksIGl0ZW1Ub1JlbW92ZSkge1xuICAgICAgICAgICAgdmFyIGluZGV4ID0ga28udXRpbHMuYXJyYXlJbmRleE9mKGFycmF5LCBpdGVtVG9SZW1vdmUpO1xuICAgICAgICAgICAgaWYgKGluZGV4ID49IDApXG4gICAgICAgICAgICAgICAgYXJyYXkuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgfSxcblxuICAgICAgICBhcnJheUdldERpc3RpbmN0VmFsdWVzOiBmdW5jdGlvbiAoYXJyYXkpIHtcbiAgICAgICAgICAgIGFycmF5ID0gYXJyYXkgfHwgW107XG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gW107XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgaiA9IGFycmF5Lmxlbmd0aDsgaSA8IGo7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmIChrby51dGlscy5hcnJheUluZGV4T2YocmVzdWx0LCBhcnJheVtpXSkgPCAwKVxuICAgICAgICAgICAgICAgICAgICByZXN1bHQucHVzaChhcnJheVtpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9LFxuXG4gICAgICAgIGFycmF5TWFwOiBmdW5jdGlvbiAoYXJyYXksIG1hcHBpbmcpIHtcbiAgICAgICAgICAgIGFycmF5ID0gYXJyYXkgfHwgW107XG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gW107XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgaiA9IGFycmF5Lmxlbmd0aDsgaSA8IGo7IGkrKylcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaChtYXBwaW5nKGFycmF5W2ldKSk7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9LFxuXG4gICAgICAgIGFycmF5RmlsdGVyOiBmdW5jdGlvbiAoYXJyYXksIHByZWRpY2F0ZSkge1xuICAgICAgICAgICAgYXJyYXkgPSBhcnJheSB8fCBbXTtcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSBbXTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBqID0gYXJyYXkubGVuZ3RoOyBpIDwgajsgaSsrKVxuICAgICAgICAgICAgICAgIGlmIChwcmVkaWNhdGUoYXJyYXlbaV0pKVxuICAgICAgICAgICAgICAgICAgICByZXN1bHQucHVzaChhcnJheVtpXSk7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9LFxuXG4gICAgICAgIGFycmF5UHVzaEFsbDogZnVuY3Rpb24gKGFycmF5LCB2YWx1ZXNUb1B1c2gpIHtcbiAgICAgICAgICAgIGlmICh2YWx1ZXNUb1B1c2ggaW5zdGFuY2VvZiBBcnJheSlcbiAgICAgICAgICAgICAgICBhcnJheS5wdXNoLmFwcGx5KGFycmF5LCB2YWx1ZXNUb1B1c2gpO1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBqID0gdmFsdWVzVG9QdXNoLmxlbmd0aDsgaSA8IGo7IGkrKylcbiAgICAgICAgICAgICAgICAgICAgYXJyYXkucHVzaCh2YWx1ZXNUb1B1c2hbaV0pO1xuICAgICAgICAgICAgcmV0dXJuIGFycmF5O1xuICAgICAgICB9LFxuXG4gICAgICAgIGFkZE9yUmVtb3ZlSXRlbTogZnVuY3Rpb24oYXJyYXksIHZhbHVlLCBpbmNsdWRlZCkge1xuICAgICAgICAgICAgdmFyIGV4aXN0aW5nRW50cnlJbmRleCA9IGFycmF5LmluZGV4T2YgPyBhcnJheS5pbmRleE9mKHZhbHVlKSA6IGtvLnV0aWxzLmFycmF5SW5kZXhPZihhcnJheSwgdmFsdWUpO1xuICAgICAgICAgICAgaWYgKGV4aXN0aW5nRW50cnlJbmRleCA8IDApIHtcbiAgICAgICAgICAgICAgICBpZiAoaW5jbHVkZWQpXG4gICAgICAgICAgICAgICAgICAgIGFycmF5LnB1c2godmFsdWUpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAoIWluY2x1ZGVkKVxuICAgICAgICAgICAgICAgICAgICBhcnJheS5zcGxpY2UoZXhpc3RpbmdFbnRyeUluZGV4LCAxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBleHRlbmQ6IGZ1bmN0aW9uICh0YXJnZXQsIHNvdXJjZSkge1xuICAgICAgICAgICAgaWYgKHNvdXJjZSkge1xuICAgICAgICAgICAgICAgIGZvcih2YXIgcHJvcCBpbiBzb3VyY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYoc291cmNlLmhhc093blByb3BlcnR5KHByb3ApKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXRbcHJvcF0gPSBzb3VyY2VbcHJvcF07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdGFyZ2V0O1xuICAgICAgICB9LFxuXG4gICAgICAgIG9iamVjdEZvckVhY2g6IG9iamVjdEZvckVhY2gsXG5cbiAgICAgICAgZW1wdHlEb21Ob2RlOiBmdW5jdGlvbiAoZG9tTm9kZSkge1xuICAgICAgICAgICAgd2hpbGUgKGRvbU5vZGUuZmlyc3RDaGlsZCkge1xuICAgICAgICAgICAgICAgIGtvLnJlbW92ZU5vZGUoZG9tTm9kZS5maXJzdENoaWxkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBtb3ZlQ2xlYW5lZE5vZGVzVG9Db250YWluZXJFbGVtZW50OiBmdW5jdGlvbihub2Rlcykge1xuICAgICAgICAgICAgLy8gRW5zdXJlIGl0J3MgYSByZWFsIGFycmF5LCBhcyB3ZSdyZSBhYm91dCB0byByZXBhcmVudCB0aGUgbm9kZXMgYW5kXG4gICAgICAgICAgICAvLyB3ZSBkb24ndCB3YW50IHRoZSB1bmRlcmx5aW5nIGNvbGxlY3Rpb24gdG8gY2hhbmdlIHdoaWxlIHdlJ3JlIGRvaW5nIHRoYXQuXG4gICAgICAgICAgICB2YXIgbm9kZXNBcnJheSA9IGtvLnV0aWxzLm1ha2VBcnJheShub2Rlcyk7XG5cbiAgICAgICAgICAgIHZhciBjb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBqID0gbm9kZXNBcnJheS5sZW5ndGg7IGkgPCBqOyBpKyspIHtcbiAgICAgICAgICAgICAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQoa28uY2xlYW5Ob2RlKG5vZGVzQXJyYXlbaV0pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBjb250YWluZXI7XG4gICAgICAgIH0sXG5cbiAgICAgICAgY2xvbmVOb2RlczogZnVuY3Rpb24gKG5vZGVzQXJyYXksIHNob3VsZENsZWFuTm9kZXMpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBqID0gbm9kZXNBcnJheS5sZW5ndGgsIG5ld05vZGVzQXJyYXkgPSBbXTsgaSA8IGo7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciBjbG9uZWROb2RlID0gbm9kZXNBcnJheVtpXS5jbG9uZU5vZGUodHJ1ZSk7XG4gICAgICAgICAgICAgICAgbmV3Tm9kZXNBcnJheS5wdXNoKHNob3VsZENsZWFuTm9kZXMgPyBrby5jbGVhbk5vZGUoY2xvbmVkTm9kZSkgOiBjbG9uZWROb2RlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBuZXdOb2Rlc0FycmF5O1xuICAgICAgICB9LFxuXG4gICAgICAgIHNldERvbU5vZGVDaGlsZHJlbjogZnVuY3Rpb24gKGRvbU5vZGUsIGNoaWxkTm9kZXMpIHtcbiAgICAgICAgICAgIGtvLnV0aWxzLmVtcHR5RG9tTm9kZShkb21Ob2RlKTtcbiAgICAgICAgICAgIGlmIChjaGlsZE5vZGVzKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGogPSBjaGlsZE5vZGVzLmxlbmd0aDsgaSA8IGo7IGkrKylcbiAgICAgICAgICAgICAgICAgICAgZG9tTm9kZS5hcHBlbmRDaGlsZChjaGlsZE5vZGVzW2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICByZXBsYWNlRG9tTm9kZXM6IGZ1bmN0aW9uIChub2RlVG9SZXBsYWNlT3JOb2RlQXJyYXksIG5ld05vZGVzQXJyYXkpIHtcbiAgICAgICAgICAgIHZhciBub2Rlc1RvUmVwbGFjZUFycmF5ID0gbm9kZVRvUmVwbGFjZU9yTm9kZUFycmF5Lm5vZGVUeXBlID8gW25vZGVUb1JlcGxhY2VPck5vZGVBcnJheV0gOiBub2RlVG9SZXBsYWNlT3JOb2RlQXJyYXk7XG4gICAgICAgICAgICBpZiAobm9kZXNUb1JlcGxhY2VBcnJheS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgdmFyIGluc2VydGlvblBvaW50ID0gbm9kZXNUb1JlcGxhY2VBcnJheVswXTtcbiAgICAgICAgICAgICAgICB2YXIgcGFyZW50ID0gaW5zZXJ0aW9uUG9pbnQucGFyZW50Tm9kZTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgaiA9IG5ld05vZGVzQXJyYXkubGVuZ3RoOyBpIDwgajsgaSsrKVxuICAgICAgICAgICAgICAgICAgICBwYXJlbnQuaW5zZXJ0QmVmb3JlKG5ld05vZGVzQXJyYXlbaV0sIGluc2VydGlvblBvaW50KTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgaiA9IG5vZGVzVG9SZXBsYWNlQXJyYXkubGVuZ3RoOyBpIDwgajsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGtvLnJlbW92ZU5vZGUobm9kZXNUb1JlcGxhY2VBcnJheVtpXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIHNldE9wdGlvbk5vZGVTZWxlY3Rpb25TdGF0ZTogZnVuY3Rpb24gKG9wdGlvbk5vZGUsIGlzU2VsZWN0ZWQpIHtcbiAgICAgICAgICAgIC8vIElFNiBzb21ldGltZXMgdGhyb3dzIFwidW5rbm93biBlcnJvclwiIGlmIHlvdSB0cnkgdG8gd3JpdGUgdG8gLnNlbGVjdGVkIGRpcmVjdGx5LCB3aGVyZWFzIEZpcmVmb3ggc3RydWdnbGVzIHdpdGggc2V0QXR0cmlidXRlLiBQaWNrIG9uZSBiYXNlZCBvbiBicm93c2VyLlxuICAgICAgICAgICAgaWYgKGllVmVyc2lvbiA8IDcpXG4gICAgICAgICAgICAgICAgb3B0aW9uTm9kZS5zZXRBdHRyaWJ1dGUoXCJzZWxlY3RlZFwiLCBpc1NlbGVjdGVkKTtcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBvcHRpb25Ob2RlLnNlbGVjdGVkID0gaXNTZWxlY3RlZDtcbiAgICAgICAgfSxcblxuICAgICAgICBzdHJpbmdUcmltOiBmdW5jdGlvbiAoc3RyaW5nKSB7XG4gICAgICAgICAgICByZXR1cm4gc3RyaW5nID09PSBudWxsIHx8IHN0cmluZyA9PT0gdW5kZWZpbmVkID8gJycgOlxuICAgICAgICAgICAgICAgIHN0cmluZy50cmltID9cbiAgICAgICAgICAgICAgICAgICAgc3RyaW5nLnRyaW0oKSA6XG4gICAgICAgICAgICAgICAgICAgIHN0cmluZy50b1N0cmluZygpLnJlcGxhY2UoL15bXFxzXFx4YTBdK3xbXFxzXFx4YTBdKyQvZywgJycpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHN0cmluZ1Rva2VuaXplOiBmdW5jdGlvbiAoc3RyaW5nLCBkZWxpbWl0ZXIpIHtcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSBbXTtcbiAgICAgICAgICAgIHZhciB0b2tlbnMgPSAoc3RyaW5nIHx8IFwiXCIpLnNwbGl0KGRlbGltaXRlcik7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgaiA9IHRva2Vucy5sZW5ndGg7IGkgPCBqOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgdHJpbW1lZCA9IGtvLnV0aWxzLnN0cmluZ1RyaW0odG9rZW5zW2ldKTtcbiAgICAgICAgICAgICAgICBpZiAodHJpbW1lZCAhPT0gXCJcIilcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnB1c2godHJpbW1lZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9LFxuXG4gICAgICAgIHN0cmluZ1N0YXJ0c1dpdGg6IGZ1bmN0aW9uIChzdHJpbmcsIHN0YXJ0c1dpdGgpIHtcbiAgICAgICAgICAgIHN0cmluZyA9IHN0cmluZyB8fCBcIlwiO1xuICAgICAgICAgICAgaWYgKHN0YXJ0c1dpdGgubGVuZ3RoID4gc3RyaW5nLmxlbmd0aClcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICByZXR1cm4gc3RyaW5nLnN1YnN0cmluZygwLCBzdGFydHNXaXRoLmxlbmd0aCkgPT09IHN0YXJ0c1dpdGg7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZG9tTm9kZUlzQ29udGFpbmVkQnk6IGZ1bmN0aW9uIChub2RlLCBjb250YWluZWRCeU5vZGUpIHtcbiAgICAgICAgICAgIGlmIChjb250YWluZWRCeU5vZGUuY29tcGFyZURvY3VtZW50UG9zaXRpb24pXG4gICAgICAgICAgICAgICAgcmV0dXJuIChjb250YWluZWRCeU5vZGUuY29tcGFyZURvY3VtZW50UG9zaXRpb24obm9kZSkgJiAxNikgPT0gMTY7XG4gICAgICAgICAgICB3aGlsZSAobm9kZSAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgaWYgKG5vZGUgPT0gY29udGFpbmVkQnlOb2RlKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICBub2RlID0gbm9kZS5wYXJlbnROb2RlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9LFxuXG4gICAgICAgIGRvbU5vZGVJc0F0dGFjaGVkVG9Eb2N1bWVudDogZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAgICAgICAgIHJldHVybiBrby51dGlscy5kb21Ob2RlSXNDb250YWluZWRCeShub2RlLCBub2RlLm93bmVyRG9jdW1lbnQpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGFueURvbU5vZGVJc0F0dGFjaGVkVG9Eb2N1bWVudDogZnVuY3Rpb24obm9kZXMpIHtcbiAgICAgICAgICAgIHJldHVybiAhIWtvLnV0aWxzLmFycmF5Rmlyc3Qobm9kZXMsIGtvLnV0aWxzLmRvbU5vZGVJc0F0dGFjaGVkVG9Eb2N1bWVudCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgdGFnTmFtZUxvd2VyOiBmdW5jdGlvbihlbGVtZW50KSB7XG4gICAgICAgICAgICAvLyBGb3IgSFRNTCBlbGVtZW50cywgdGFnTmFtZSB3aWxsIGFsd2F5cyBiZSB1cHBlciBjYXNlOyBmb3IgWEhUTUwgZWxlbWVudHMsIGl0J2xsIGJlIGxvd2VyIGNhc2UuXG4gICAgICAgICAgICAvLyBQb3NzaWJsZSBmdXR1cmUgb3B0aW1pemF0aW9uOiBJZiB3ZSBrbm93IGl0J3MgYW4gZWxlbWVudCBmcm9tIGFuIFhIVE1MIGRvY3VtZW50IChub3QgSFRNTCksXG4gICAgICAgICAgICAvLyB3ZSBkb24ndCBuZWVkIHRvIGRvIHRoZSAudG9Mb3dlckNhc2UoKSBhcyBpdCB3aWxsIGFsd2F5cyBiZSBsb3dlciBjYXNlIGFueXdheS5cbiAgICAgICAgICAgIHJldHVybiBlbGVtZW50ICYmIGVsZW1lbnQudGFnTmFtZSAmJiBlbGVtZW50LnRhZ05hbWUudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgfSxcblxuICAgICAgICByZWdpc3RlckV2ZW50SGFuZGxlcjogZnVuY3Rpb24gKGVsZW1lbnQsIGV2ZW50VHlwZSwgaGFuZGxlcikge1xuICAgICAgICAgICAgdmFyIG11c3RVc2VBdHRhY2hFdmVudCA9IGllVmVyc2lvbiAmJiBldmVudHNUaGF0TXVzdEJlUmVnaXN0ZXJlZFVzaW5nQXR0YWNoRXZlbnRbZXZlbnRUeXBlXTtcbiAgICAgICAgICAgIGlmICghbXVzdFVzZUF0dGFjaEV2ZW50ICYmIHR5cGVvZiBqUXVlcnkgIT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgICAgICAgIGlmIChpc0NsaWNrT25DaGVja2FibGVFbGVtZW50KGVsZW1lbnQsIGV2ZW50VHlwZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gRm9yIGNsaWNrIGV2ZW50cyBvbiBjaGVja2JveGVzLCBqUXVlcnkgaW50ZXJmZXJlcyB3aXRoIHRoZSBldmVudCBoYW5kbGluZyBpbiBhbiBhd2t3YXJkIHdheTpcbiAgICAgICAgICAgICAgICAgICAgLy8gaXQgdG9nZ2xlcyB0aGUgZWxlbWVudCBjaGVja2VkIHN0YXRlICphZnRlciogdGhlIGNsaWNrIGV2ZW50IGhhbmRsZXJzIHJ1biwgd2hlcmVhcyBuYXRpdmVcbiAgICAgICAgICAgICAgICAgICAgLy8gY2xpY2sgZXZlbnRzIHRvZ2dsZSB0aGUgY2hlY2tlZCBzdGF0ZSAqYmVmb3JlKiB0aGUgZXZlbnQgaGFuZGxlci5cbiAgICAgICAgICAgICAgICAgICAgLy8gRml4IHRoaXMgYnkgaW50ZWNlcHRpbmcgdGhlIGhhbmRsZXIgYW5kIGFwcGx5aW5nIHRoZSBjb3JyZWN0IGNoZWNrZWRuZXNzIGJlZm9yZSBpdCBydW5zLlxuICAgICAgICAgICAgICAgICAgICB2YXIgb3JpZ2luYWxIYW5kbGVyID0gaGFuZGxlcjtcbiAgICAgICAgICAgICAgICAgICAgaGFuZGxlciA9IGZ1bmN0aW9uKGV2ZW50LCBldmVudERhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBqUXVlcnlTdXBwbGllZENoZWNrZWRTdGF0ZSA9IHRoaXMuY2hlY2tlZDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChldmVudERhdGEpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jaGVja2VkID0gZXZlbnREYXRhLmNoZWNrZWRTdGF0ZUJlZm9yZUV2ZW50ICE9PSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgb3JpZ2luYWxIYW5kbGVyLmNhbGwodGhpcywgZXZlbnQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jaGVja2VkID0galF1ZXJ5U3VwcGxpZWRDaGVja2VkU3RhdGU7IC8vIFJlc3RvcmUgdGhlIHN0YXRlIGpRdWVyeSBhcHBsaWVkXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGpRdWVyeShlbGVtZW50KVsnYmluZCddKGV2ZW50VHlwZSwgaGFuZGxlcik7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKCFtdXN0VXNlQXR0YWNoRXZlbnQgJiYgdHlwZW9mIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lciA9PSBcImZ1bmN0aW9uXCIpXG4gICAgICAgICAgICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKGV2ZW50VHlwZSwgaGFuZGxlciwgZmFsc2UpO1xuICAgICAgICAgICAgZWxzZSBpZiAodHlwZW9mIGVsZW1lbnQuYXR0YWNoRXZlbnQgIT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgICAgICAgIHZhciBhdHRhY2hFdmVudEhhbmRsZXIgPSBmdW5jdGlvbiAoZXZlbnQpIHsgaGFuZGxlci5jYWxsKGVsZW1lbnQsIGV2ZW50KTsgfSxcbiAgICAgICAgICAgICAgICAgICAgYXR0YWNoRXZlbnROYW1lID0gXCJvblwiICsgZXZlbnRUeXBlO1xuICAgICAgICAgICAgICAgIGVsZW1lbnQuYXR0YWNoRXZlbnQoYXR0YWNoRXZlbnROYW1lLCBhdHRhY2hFdmVudEhhbmRsZXIpO1xuXG4gICAgICAgICAgICAgICAgLy8gSUUgZG9lcyBub3QgZGlzcG9zZSBhdHRhY2hFdmVudCBoYW5kbGVycyBhdXRvbWF0aWNhbGx5ICh1bmxpa2Ugd2l0aCBhZGRFdmVudExpc3RlbmVyKVxuICAgICAgICAgICAgICAgIC8vIHNvIHRvIGF2b2lkIGxlYWtzLCB3ZSBoYXZlIHRvIHJlbW92ZSB0aGVtIG1hbnVhbGx5LiBTZWUgYnVnICM4NTZcbiAgICAgICAgICAgICAgICBrby51dGlscy5kb21Ob2RlRGlzcG9zYWwuYWRkRGlzcG9zZUNhbGxiYWNrKGVsZW1lbnQsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBlbGVtZW50LmRldGFjaEV2ZW50KGF0dGFjaEV2ZW50TmFtZSwgYXR0YWNoRXZlbnRIYW5kbGVyKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0gZWxzZVxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkJyb3dzZXIgZG9lc24ndCBzdXBwb3J0IGFkZEV2ZW50TGlzdGVuZXIgb3IgYXR0YWNoRXZlbnRcIik7XG4gICAgICAgIH0sXG5cbiAgICAgICAgdHJpZ2dlckV2ZW50OiBmdW5jdGlvbiAoZWxlbWVudCwgZXZlbnRUeXBlKSB7XG4gICAgICAgICAgICBpZiAoIShlbGVtZW50ICYmIGVsZW1lbnQubm9kZVR5cGUpKVxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcImVsZW1lbnQgbXVzdCBiZSBhIERPTSBub2RlIHdoZW4gY2FsbGluZyB0cmlnZ2VyRXZlbnRcIik7XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2YgalF1ZXJ5ICE9IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICAgICAgICB2YXIgZXZlbnREYXRhID0gW107XG4gICAgICAgICAgICAgICAgaWYgKGlzQ2xpY2tPbkNoZWNrYWJsZUVsZW1lbnQoZWxlbWVudCwgZXZlbnRUeXBlKSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBXb3JrIGFyb3VuZCB0aGUgalF1ZXJ5IFwiY2xpY2sgZXZlbnRzIG9uIGNoZWNrYm94ZXNcIiBpc3N1ZSBkZXNjcmliZWQgYWJvdmUgYnkgc3RvcmluZyB0aGUgb3JpZ2luYWwgY2hlY2tlZCBzdGF0ZSBiZWZvcmUgdHJpZ2dlcmluZyB0aGUgaGFuZGxlclxuICAgICAgICAgICAgICAgICAgICBldmVudERhdGEucHVzaCh7IGNoZWNrZWRTdGF0ZUJlZm9yZUV2ZW50OiBlbGVtZW50LmNoZWNrZWQgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGpRdWVyeShlbGVtZW50KVsndHJpZ2dlciddKGV2ZW50VHlwZSwgZXZlbnREYXRhKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGRvY3VtZW50LmNyZWF0ZUV2ZW50ID09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgZWxlbWVudC5kaXNwYXRjaEV2ZW50ID09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZXZlbnRDYXRlZ29yeSA9IGtub3duRXZlbnRUeXBlc0J5RXZlbnROYW1lW2V2ZW50VHlwZV0gfHwgXCJIVE1MRXZlbnRzXCI7XG4gICAgICAgICAgICAgICAgICAgIHZhciBldmVudCA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KGV2ZW50Q2F0ZWdvcnkpO1xuICAgICAgICAgICAgICAgICAgICBldmVudC5pbml0RXZlbnQoZXZlbnRUeXBlLCB0cnVlLCB0cnVlLCB3aW5kb3csIDAsIDAsIDAsIDAsIDAsIGZhbHNlLCBmYWxzZSwgZmFsc2UsIGZhbHNlLCAwLCBlbGVtZW50KTtcbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5kaXNwYXRjaEV2ZW50KGV2ZW50KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJUaGUgc3VwcGxpZWQgZWxlbWVudCBkb2Vzbid0IHN1cHBvcnQgZGlzcGF0Y2hFdmVudFwiKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGVsZW1lbnQuZmlyZUV2ZW50ICE9IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICAgICAgICAvLyBVbmxpa2Ugb3RoZXIgYnJvd3NlcnMsIElFIGRvZXNuJ3QgY2hhbmdlIHRoZSBjaGVja2VkIHN0YXRlIG9mIGNoZWNrYm94ZXMvcmFkaW9idXR0b25zIHdoZW4geW91IHRyaWdnZXIgdGhlaXIgXCJjbGlja1wiIGV2ZW50XG4gICAgICAgICAgICAgICAgLy8gc28gdG8gbWFrZSBpdCBjb25zaXN0ZW50LCB3ZSdsbCBkbyBpdCBtYW51YWxseSBoZXJlXG4gICAgICAgICAgICAgICAgaWYgKGlzQ2xpY2tPbkNoZWNrYWJsZUVsZW1lbnQoZWxlbWVudCwgZXZlbnRUeXBlKSlcbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5jaGVja2VkID0gZWxlbWVudC5jaGVja2VkICE9PSB0cnVlO1xuICAgICAgICAgICAgICAgIGVsZW1lbnQuZmlyZUV2ZW50KFwib25cIiArIGV2ZW50VHlwZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQnJvd3NlciBkb2Vzbid0IHN1cHBvcnQgdHJpZ2dlcmluZyBldmVudHNcIik7XG4gICAgICAgIH0sXG5cbiAgICAgICAgdW53cmFwT2JzZXJ2YWJsZTogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICByZXR1cm4ga28uaXNPYnNlcnZhYmxlKHZhbHVlKSA/IHZhbHVlKCkgOiB2YWx1ZTtcbiAgICAgICAgfSxcblxuICAgICAgICBwZWVrT2JzZXJ2YWJsZTogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICByZXR1cm4ga28uaXNPYnNlcnZhYmxlKHZhbHVlKSA/IHZhbHVlLnBlZWsoKSA6IHZhbHVlO1xuICAgICAgICB9LFxuXG4gICAgICAgIHRvZ2dsZURvbU5vZGVDc3NDbGFzczogZnVuY3Rpb24gKG5vZGUsIGNsYXNzTmFtZXMsIHNob3VsZEhhdmVDbGFzcykge1xuICAgICAgICAgICAgaWYgKGNsYXNzTmFtZXMpIHtcbiAgICAgICAgICAgICAgICB2YXIgY3NzQ2xhc3NOYW1lUmVnZXggPSAvXFxTKy9nLFxuICAgICAgICAgICAgICAgICAgICBjdXJyZW50Q2xhc3NOYW1lcyA9IG5vZGUuY2xhc3NOYW1lLm1hdGNoKGNzc0NsYXNzTmFtZVJlZ2V4KSB8fCBbXTtcbiAgICAgICAgICAgICAgICBrby51dGlscy5hcnJheUZvckVhY2goY2xhc3NOYW1lcy5tYXRjaChjc3NDbGFzc05hbWVSZWdleCksIGZ1bmN0aW9uKGNsYXNzTmFtZSkge1xuICAgICAgICAgICAgICAgICAgICBrby51dGlscy5hZGRPclJlbW92ZUl0ZW0oY3VycmVudENsYXNzTmFtZXMsIGNsYXNzTmFtZSwgc2hvdWxkSGF2ZUNsYXNzKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBub2RlLmNsYXNzTmFtZSA9IGN1cnJlbnRDbGFzc05hbWVzLmpvaW4oXCIgXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIHNldFRleHRDb250ZW50OiBmdW5jdGlvbihlbGVtZW50LCB0ZXh0Q29udGVudCkge1xuICAgICAgICAgICAgdmFyIHZhbHVlID0ga28udXRpbHMudW53cmFwT2JzZXJ2YWJsZSh0ZXh0Q29udGVudCk7XG4gICAgICAgICAgICBpZiAoKHZhbHVlID09PSBudWxsKSB8fCAodmFsdWUgPT09IHVuZGVmaW5lZCkpXG4gICAgICAgICAgICAgICAgdmFsdWUgPSBcIlwiO1xuXG4gICAgICAgICAgICAvLyBXZSBuZWVkIHRoZXJlIHRvIGJlIGV4YWN0bHkgb25lIGNoaWxkOiBhIHRleHQgbm9kZS5cbiAgICAgICAgICAgIC8vIElmIHRoZXJlIGFyZSBubyBjaGlsZHJlbiwgbW9yZSB0aGFuIG9uZSwgb3IgaWYgaXQncyBub3QgYSB0ZXh0IG5vZGUsXG4gICAgICAgICAgICAvLyB3ZSdsbCBjbGVhciBldmVyeXRoaW5nIGFuZCBjcmVhdGUgYSBzaW5nbGUgdGV4dCBub2RlLlxuICAgICAgICAgICAgdmFyIGlubmVyVGV4dE5vZGUgPSBrby52aXJ0dWFsRWxlbWVudHMuZmlyc3RDaGlsZChlbGVtZW50KTtcbiAgICAgICAgICAgIGlmICghaW5uZXJUZXh0Tm9kZSB8fCBpbm5lclRleHROb2RlLm5vZGVUeXBlICE9IDMgfHwga28udmlydHVhbEVsZW1lbnRzLm5leHRTaWJsaW5nKGlubmVyVGV4dE5vZGUpKSB7XG4gICAgICAgICAgICAgICAga28udmlydHVhbEVsZW1lbnRzLnNldERvbU5vZGVDaGlsZHJlbihlbGVtZW50LCBbZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUodmFsdWUpXSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlubmVyVGV4dE5vZGUuZGF0YSA9IHZhbHVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBrby51dGlscy5mb3JjZVJlZnJlc2goZWxlbWVudCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgc2V0RWxlbWVudE5hbWU6IGZ1bmN0aW9uKGVsZW1lbnQsIG5hbWUpIHtcbiAgICAgICAgICAgIGVsZW1lbnQubmFtZSA9IG5hbWU7XG5cbiAgICAgICAgICAgIC8vIFdvcmthcm91bmQgSUUgNi83IGlzc3VlXG4gICAgICAgICAgICAvLyAtIGh0dHBzOi8vZ2l0aHViLmNvbS9TdGV2ZVNhbmRlcnNvbi9rbm9ja291dC9pc3N1ZXMvMTk3XG4gICAgICAgICAgICAvLyAtIGh0dHA6Ly93d3cubWF0dHM0MTEuY29tL3Bvc3Qvc2V0dGluZ190aGVfbmFtZV9hdHRyaWJ1dGVfaW5faWVfZG9tL1xuICAgICAgICAgICAgaWYgKGllVmVyc2lvbiA8PSA3KSB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5tZXJnZUF0dHJpYnV0ZXMoZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcIjxpbnB1dCBuYW1lPSdcIiArIGVsZW1lbnQubmFtZSArIFwiJy8+XCIpLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNhdGNoKGUpIHt9IC8vIEZvciBJRTkgd2l0aCBkb2MgbW9kZSBcIklFOSBTdGFuZGFyZHNcIiBhbmQgYnJvd3NlciBtb2RlIFwiSUU5IENvbXBhdGliaWxpdHkgVmlld1wiXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgZm9yY2VSZWZyZXNoOiBmdW5jdGlvbihub2RlKSB7XG4gICAgICAgICAgICAvLyBXb3JrYXJvdW5kIGZvciBhbiBJRTkgcmVuZGVyaW5nIGJ1ZyAtIGh0dHBzOi8vZ2l0aHViLmNvbS9TdGV2ZVNhbmRlcnNvbi9rbm9ja291dC9pc3N1ZXMvMjA5XG4gICAgICAgICAgICBpZiAoaWVWZXJzaW9uID49IDkpIHtcbiAgICAgICAgICAgICAgICAvLyBGb3IgdGV4dCBub2RlcyBhbmQgY29tbWVudCBub2RlcyAobW9zdCBsaWtlbHkgdmlydHVhbCBlbGVtZW50cyksIHdlIHdpbGwgaGF2ZSB0byByZWZyZXNoIHRoZSBjb250YWluZXJcbiAgICAgICAgICAgICAgICB2YXIgZWxlbSA9IG5vZGUubm9kZVR5cGUgPT0gMSA/IG5vZGUgOiBub2RlLnBhcmVudE5vZGU7XG4gICAgICAgICAgICAgICAgaWYgKGVsZW0uc3R5bGUpXG4gICAgICAgICAgICAgICAgICAgIGVsZW0uc3R5bGUuem9vbSA9IGVsZW0uc3R5bGUuem9vbTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBlbnN1cmVTZWxlY3RFbGVtZW50SXNSZW5kZXJlZENvcnJlY3RseTogZnVuY3Rpb24oc2VsZWN0RWxlbWVudCkge1xuICAgICAgICAgICAgLy8gV29ya2Fyb3VuZCBmb3IgSUU5IHJlbmRlcmluZyBidWcgLSBpdCBkb2Vzbid0IHJlbGlhYmx5IGRpc3BsYXkgYWxsIHRoZSB0ZXh0IGluIGR5bmFtaWNhbGx5LWFkZGVkIHNlbGVjdCBib3hlcyB1bmxlc3MgeW91IGZvcmNlIGl0IHRvIHJlLXJlbmRlciBieSB1cGRhdGluZyB0aGUgd2lkdGguXG4gICAgICAgICAgICAvLyAoU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9TdGV2ZVNhbmRlcnNvbi9rbm9ja291dC9pc3N1ZXMvMzEyLCBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzU5MDg0OTQvc2VsZWN0LW9ubHktc2hvd3MtZmlyc3QtY2hhci1vZi1zZWxlY3RlZC1vcHRpb24pXG4gICAgICAgICAgICAvLyBBbHNvIGZpeGVzIElFNyBhbmQgSUU4IGJ1ZyB0aGF0IGNhdXNlcyBzZWxlY3RzIHRvIGJlIHplcm8gd2lkdGggaWYgZW5jbG9zZWQgYnkgJ2lmJyBvciAnd2l0aCcuIChTZWUgaXNzdWUgIzgzOSlcbiAgICAgICAgICAgIGlmIChpZVZlcnNpb24pIHtcbiAgICAgICAgICAgICAgICB2YXIgb3JpZ2luYWxXaWR0aCA9IHNlbGVjdEVsZW1lbnQuc3R5bGUud2lkdGg7XG4gICAgICAgICAgICAgICAgc2VsZWN0RWxlbWVudC5zdHlsZS53aWR0aCA9IDA7XG4gICAgICAgICAgICAgICAgc2VsZWN0RWxlbWVudC5zdHlsZS53aWR0aCA9IG9yaWdpbmFsV2lkdGg7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgcmFuZ2U6IGZ1bmN0aW9uIChtaW4sIG1heCkge1xuICAgICAgICAgICAgbWluID0ga28udXRpbHMudW53cmFwT2JzZXJ2YWJsZShtaW4pO1xuICAgICAgICAgICAgbWF4ID0ga28udXRpbHMudW53cmFwT2JzZXJ2YWJsZShtYXgpO1xuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IFtdO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IG1pbjsgaSA8PSBtYXg7IGkrKylcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaChpKTtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH0sXG5cbiAgICAgICAgbWFrZUFycmF5OiBmdW5jdGlvbihhcnJheUxpa2VPYmplY3QpIHtcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSBbXTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBqID0gYXJyYXlMaWtlT2JqZWN0Lmxlbmd0aDsgaSA8IGo7IGkrKykge1xuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKGFycmF5TGlrZU9iamVjdFtpXSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfSxcblxuICAgICAgICBpc0llNiA6IGlzSWU2LFxuICAgICAgICBpc0llNyA6IGlzSWU3LFxuICAgICAgICBpZVZlcnNpb24gOiBpZVZlcnNpb24sXG5cbiAgICAgICAgZ2V0Rm9ybUZpZWxkczogZnVuY3Rpb24oZm9ybSwgZmllbGROYW1lKSB7XG4gICAgICAgICAgICB2YXIgZmllbGRzID0ga28udXRpbHMubWFrZUFycmF5KGZvcm0uZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJpbnB1dFwiKSkuY29uY2F0KGtvLnV0aWxzLm1ha2VBcnJheShmb3JtLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwidGV4dGFyZWFcIikpKTtcbiAgICAgICAgICAgIHZhciBpc01hdGNoaW5nRmllbGQgPSAodHlwZW9mIGZpZWxkTmFtZSA9PSAnc3RyaW5nJylcbiAgICAgICAgICAgICAgICA/IGZ1bmN0aW9uKGZpZWxkKSB7IHJldHVybiBmaWVsZC5uYW1lID09PSBmaWVsZE5hbWUgfVxuICAgICAgICAgICAgICAgIDogZnVuY3Rpb24oZmllbGQpIHsgcmV0dXJuIGZpZWxkTmFtZS50ZXN0KGZpZWxkLm5hbWUpIH07IC8vIFRyZWF0IGZpZWxkTmFtZSBhcyByZWdleCBvciBvYmplY3QgY29udGFpbmluZyBwcmVkaWNhdGVcbiAgICAgICAgICAgIHZhciBtYXRjaGVzID0gW107XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gZmllbGRzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICAgICAgaWYgKGlzTWF0Y2hpbmdGaWVsZChmaWVsZHNbaV0pKVxuICAgICAgICAgICAgICAgICAgICBtYXRjaGVzLnB1c2goZmllbGRzW2ldKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICByZXR1cm4gbWF0Y2hlcztcbiAgICAgICAgfSxcblxuICAgICAgICBwYXJzZUpzb246IGZ1bmN0aW9uIChqc29uU3RyaW5nKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGpzb25TdHJpbmcgPT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgICAgIGpzb25TdHJpbmcgPSBrby51dGlscy5zdHJpbmdUcmltKGpzb25TdHJpbmcpO1xuICAgICAgICAgICAgICAgIGlmIChqc29uU3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChKU09OICYmIEpTT04ucGFyc2UpIC8vIFVzZSBuYXRpdmUgcGFyc2luZyB3aGVyZSBhdmFpbGFibGVcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBKU09OLnBhcnNlKGpzb25TdHJpbmcpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gKG5ldyBGdW5jdGlvbihcInJldHVybiBcIiArIGpzb25TdHJpbmcpKSgpOyAvLyBGYWxsYmFjayBvbiBsZXNzIHNhZmUgcGFyc2luZyBmb3Igb2xkZXIgYnJvd3NlcnNcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfSxcblxuICAgICAgICBzdHJpbmdpZnlKc29uOiBmdW5jdGlvbiAoZGF0YSwgcmVwbGFjZXIsIHNwYWNlKSB7ICAgLy8gcmVwbGFjZXIgYW5kIHNwYWNlIGFyZSBvcHRpb25hbFxuICAgICAgICAgICAgaWYgKCFKU09OIHx8ICFKU09OLnN0cmluZ2lmeSlcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBKU09OLnN0cmluZ2lmeSgpLiBTb21lIGJyb3dzZXJzIChlLmcuLCBJRSA8IDgpIGRvbid0IHN1cHBvcnQgaXQgbmF0aXZlbHksIGJ1dCB5b3UgY2FuIG92ZXJjb21lIHRoaXMgYnkgYWRkaW5nIGEgc2NyaXB0IHJlZmVyZW5jZSB0byBqc29uMi5qcywgZG93bmxvYWRhYmxlIGZyb20gaHR0cDovL3d3dy5qc29uLm9yZy9qc29uMi5qc1wiKTtcbiAgICAgICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShrby51dGlscy51bndyYXBPYnNlcnZhYmxlKGRhdGEpLCByZXBsYWNlciwgc3BhY2UpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHBvc3RKc29uOiBmdW5jdGlvbiAodXJsT3JGb3JtLCBkYXRhLCBvcHRpb25zKSB7XG4gICAgICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICAgICAgICAgIHZhciBwYXJhbXMgPSBvcHRpb25zWydwYXJhbXMnXSB8fCB7fTtcbiAgICAgICAgICAgIHZhciBpbmNsdWRlRmllbGRzID0gb3B0aW9uc1snaW5jbHVkZUZpZWxkcyddIHx8IHRoaXMuZmllbGRzSW5jbHVkZWRXaXRoSnNvblBvc3Q7XG4gICAgICAgICAgICB2YXIgdXJsID0gdXJsT3JGb3JtO1xuXG4gICAgICAgICAgICAvLyBJZiB3ZSB3ZXJlIGdpdmVuIGEgZm9ybSwgdXNlIGl0cyAnYWN0aW9uJyBVUkwgYW5kIHBpY2sgb3V0IGFueSByZXF1ZXN0ZWQgZmllbGQgdmFsdWVzXG4gICAgICAgICAgICBpZigodHlwZW9mIHVybE9yRm9ybSA9PSAnb2JqZWN0JykgJiYgKGtvLnV0aWxzLnRhZ05hbWVMb3dlcih1cmxPckZvcm0pID09PSBcImZvcm1cIikpIHtcbiAgICAgICAgICAgICAgICB2YXIgb3JpZ2luYWxGb3JtID0gdXJsT3JGb3JtO1xuICAgICAgICAgICAgICAgIHVybCA9IG9yaWdpbmFsRm9ybS5hY3Rpb247XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IGluY2x1ZGVGaWVsZHMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGZpZWxkcyA9IGtvLnV0aWxzLmdldEZvcm1GaWVsZHMob3JpZ2luYWxGb3JtLCBpbmNsdWRlRmllbGRzW2ldKTtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IGZpZWxkcy5sZW5ndGggLSAxOyBqID49IDA7IGotLSlcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhcmFtc1tmaWVsZHNbal0ubmFtZV0gPSBmaWVsZHNbal0udmFsdWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBkYXRhID0ga28udXRpbHMudW53cmFwT2JzZXJ2YWJsZShkYXRhKTtcbiAgICAgICAgICAgIHZhciBmb3JtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImZvcm1cIik7XG4gICAgICAgICAgICBmb3JtLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgICAgICAgIGZvcm0uYWN0aW9uID0gdXJsO1xuICAgICAgICAgICAgZm9ybS5tZXRob2QgPSBcInBvc3RcIjtcbiAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiBkYXRhKSB7XG4gICAgICAgICAgICAgICAgLy8gU2luY2UgJ2RhdGEnIHRoaXMgaXMgYSBtb2RlbCBvYmplY3QsIHdlIGluY2x1ZGUgYWxsIHByb3BlcnRpZXMgaW5jbHVkaW5nIHRob3NlIGluaGVyaXRlZCBmcm9tIGl0cyBwcm90b3R5cGVcbiAgICAgICAgICAgICAgICB2YXIgaW5wdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiaW5wdXRcIik7XG4gICAgICAgICAgICAgICAgaW5wdXQubmFtZSA9IGtleTtcbiAgICAgICAgICAgICAgICBpbnB1dC52YWx1ZSA9IGtvLnV0aWxzLnN0cmluZ2lmeUpzb24oa28udXRpbHMudW53cmFwT2JzZXJ2YWJsZShkYXRhW2tleV0pKTtcbiAgICAgICAgICAgICAgICBmb3JtLmFwcGVuZENoaWxkKGlucHV0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG9iamVjdEZvckVhY2gocGFyYW1zLCBmdW5jdGlvbihrZXksIHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgdmFyIGlucHV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImlucHV0XCIpO1xuICAgICAgICAgICAgICAgIGlucHV0Lm5hbWUgPSBrZXk7XG4gICAgICAgICAgICAgICAgaW5wdXQudmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICBmb3JtLmFwcGVuZENoaWxkKGlucHV0KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChmb3JtKTtcbiAgICAgICAgICAgIG9wdGlvbnNbJ3N1Ym1pdHRlciddID8gb3B0aW9uc1snc3VibWl0dGVyJ10oZm9ybSkgOiBmb3JtLnN1Ym1pdCgpO1xuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7IGZvcm0ucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChmb3JtKTsgfSwgMCk7XG4gICAgICAgIH1cbiAgICB9XG59KCkpO1xuXG5rby5leHBvcnRTeW1ib2woJ3V0aWxzJywga28udXRpbHMpO1xua28uZXhwb3J0U3ltYm9sKCd1dGlscy5hcnJheUZvckVhY2gnLCBrby51dGlscy5hcnJheUZvckVhY2gpO1xua28uZXhwb3J0U3ltYm9sKCd1dGlscy5hcnJheUZpcnN0Jywga28udXRpbHMuYXJyYXlGaXJzdCk7XG5rby5leHBvcnRTeW1ib2woJ3V0aWxzLmFycmF5RmlsdGVyJywga28udXRpbHMuYXJyYXlGaWx0ZXIpO1xua28uZXhwb3J0U3ltYm9sKCd1dGlscy5hcnJheUdldERpc3RpbmN0VmFsdWVzJywga28udXRpbHMuYXJyYXlHZXREaXN0aW5jdFZhbHVlcyk7XG5rby5leHBvcnRTeW1ib2woJ3V0aWxzLmFycmF5SW5kZXhPZicsIGtvLnV0aWxzLmFycmF5SW5kZXhPZik7XG5rby5leHBvcnRTeW1ib2woJ3V0aWxzLmFycmF5TWFwJywga28udXRpbHMuYXJyYXlNYXApO1xua28uZXhwb3J0U3ltYm9sKCd1dGlscy5hcnJheVB1c2hBbGwnLCBrby51dGlscy5hcnJheVB1c2hBbGwpO1xua28uZXhwb3J0U3ltYm9sKCd1dGlscy5hcnJheVJlbW92ZUl0ZW0nLCBrby51dGlscy5hcnJheVJlbW92ZUl0ZW0pO1xua28uZXhwb3J0U3ltYm9sKCd1dGlscy5leHRlbmQnLCBrby51dGlscy5leHRlbmQpO1xua28uZXhwb3J0U3ltYm9sKCd1dGlscy5maWVsZHNJbmNsdWRlZFdpdGhKc29uUG9zdCcsIGtvLnV0aWxzLmZpZWxkc0luY2x1ZGVkV2l0aEpzb25Qb3N0KTtcbmtvLmV4cG9ydFN5bWJvbCgndXRpbHMuZ2V0Rm9ybUZpZWxkcycsIGtvLnV0aWxzLmdldEZvcm1GaWVsZHMpO1xua28uZXhwb3J0U3ltYm9sKCd1dGlscy5wZWVrT2JzZXJ2YWJsZScsIGtvLnV0aWxzLnBlZWtPYnNlcnZhYmxlKTtcbmtvLmV4cG9ydFN5bWJvbCgndXRpbHMucG9zdEpzb24nLCBrby51dGlscy5wb3N0SnNvbik7XG5rby5leHBvcnRTeW1ib2woJ3V0aWxzLnBhcnNlSnNvbicsIGtvLnV0aWxzLnBhcnNlSnNvbik7XG5rby5leHBvcnRTeW1ib2woJ3V0aWxzLnJlZ2lzdGVyRXZlbnRIYW5kbGVyJywga28udXRpbHMucmVnaXN0ZXJFdmVudEhhbmRsZXIpO1xua28uZXhwb3J0U3ltYm9sKCd1dGlscy5zdHJpbmdpZnlKc29uJywga28udXRpbHMuc3RyaW5naWZ5SnNvbik7XG5rby5leHBvcnRTeW1ib2woJ3V0aWxzLnJhbmdlJywga28udXRpbHMucmFuZ2UpO1xua28uZXhwb3J0U3ltYm9sKCd1dGlscy50b2dnbGVEb21Ob2RlQ3NzQ2xhc3MnLCBrby51dGlscy50b2dnbGVEb21Ob2RlQ3NzQ2xhc3MpO1xua28uZXhwb3J0U3ltYm9sKCd1dGlscy50cmlnZ2VyRXZlbnQnLCBrby51dGlscy50cmlnZ2VyRXZlbnQpO1xua28uZXhwb3J0U3ltYm9sKCd1dGlscy51bndyYXBPYnNlcnZhYmxlJywga28udXRpbHMudW53cmFwT2JzZXJ2YWJsZSk7XG5rby5leHBvcnRTeW1ib2woJ3V0aWxzLm9iamVjdEZvckVhY2gnLCBrby51dGlscy5vYmplY3RGb3JFYWNoKTtcbmtvLmV4cG9ydFN5bWJvbCgndXRpbHMuYWRkT3JSZW1vdmVJdGVtJywga28udXRpbHMuYWRkT3JSZW1vdmVJdGVtKTtcbmtvLmV4cG9ydFN5bWJvbCgndW53cmFwJywga28udXRpbHMudW53cmFwT2JzZXJ2YWJsZSk7IC8vIENvbnZlbmllbnQgc2hvcnRoYW5kLCBiZWNhdXNlIHRoaXMgaXMgdXNlZCBzbyBjb21tb25seVxuXG5pZiAoIUZ1bmN0aW9uLnByb3RvdHlwZVsnYmluZCddKSB7XG4gICAgLy8gRnVuY3Rpb24ucHJvdG90eXBlLmJpbmQgaXMgYSBzdGFuZGFyZCBwYXJ0IG9mIEVDTUFTY3JpcHQgNXRoIEVkaXRpb24gKERlY2VtYmVyIDIwMDksIGh0dHA6Ly93d3cuZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9wdWJsaWNhdGlvbnMvZmlsZXMvRUNNQS1TVC9FQ01BLTI2Mi5wZGYpXG4gICAgLy8gSW4gY2FzZSB0aGUgYnJvd3NlciBkb2Vzbid0IGltcGxlbWVudCBpdCBuYXRpdmVseSwgcHJvdmlkZSBhIEphdmFTY3JpcHQgaW1wbGVtZW50YXRpb24uIFRoaXMgaW1wbGVtZW50YXRpb24gaXMgYmFzZWQgb24gdGhlIG9uZSBpbiBwcm90b3R5cGUuanNcbiAgICBGdW5jdGlvbi5wcm90b3R5cGVbJ2JpbmQnXSA9IGZ1bmN0aW9uIChvYmplY3QpIHtcbiAgICAgICAgdmFyIG9yaWdpbmFsRnVuY3Rpb24gPSB0aGlzLCBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKSwgb2JqZWN0ID0gYXJncy5zaGlmdCgpO1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIG9yaWdpbmFsRnVuY3Rpb24uYXBwbHkob2JqZWN0LCBhcmdzLmNvbmNhdChBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpKSk7XG4gICAgICAgIH07XG4gICAgfTtcbn1cblxua28udXRpbHMuZG9tRGF0YSA9IG5ldyAoZnVuY3Rpb24gKCkge1xuICAgIHZhciB1bmlxdWVJZCA9IDA7XG4gICAgdmFyIGRhdGFTdG9yZUtleUV4cGFuZG9Qcm9wZXJ0eU5hbWUgPSBcIl9fa29fX1wiICsgKG5ldyBEYXRlKS5nZXRUaW1lKCk7XG4gICAgdmFyIGRhdGFTdG9yZSA9IHt9O1xuICAgIHJldHVybiB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKG5vZGUsIGtleSkge1xuICAgICAgICAgICAgdmFyIGFsbERhdGFGb3JOb2RlID0ga28udXRpbHMuZG9tRGF0YS5nZXRBbGwobm9kZSwgZmFsc2UpO1xuICAgICAgICAgICAgcmV0dXJuIGFsbERhdGFGb3JOb2RlID09PSB1bmRlZmluZWQgPyB1bmRlZmluZWQgOiBhbGxEYXRhRm9yTm9kZVtrZXldO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uIChub2RlLCBrZXksIHZhbHVlKSB7XG4gICAgICAgICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIC8vIE1ha2Ugc3VyZSB3ZSBkb24ndCBhY3R1YWxseSBjcmVhdGUgYSBuZXcgZG9tRGF0YSBrZXkgaWYgd2UgYXJlIGFjdHVhbGx5IGRlbGV0aW5nIGEgdmFsdWVcbiAgICAgICAgICAgICAgICBpZiAoa28udXRpbHMuZG9tRGF0YS5nZXRBbGwobm9kZSwgZmFsc2UpID09PSB1bmRlZmluZWQpXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBhbGxEYXRhRm9yTm9kZSA9IGtvLnV0aWxzLmRvbURhdGEuZ2V0QWxsKG5vZGUsIHRydWUpO1xuICAgICAgICAgICAgYWxsRGF0YUZvck5vZGVba2V5XSA9IHZhbHVlO1xuICAgICAgICB9LFxuICAgICAgICBnZXRBbGw6IGZ1bmN0aW9uIChub2RlLCBjcmVhdGVJZk5vdEZvdW5kKSB7XG4gICAgICAgICAgICB2YXIgZGF0YVN0b3JlS2V5ID0gbm9kZVtkYXRhU3RvcmVLZXlFeHBhbmRvUHJvcGVydHlOYW1lXTtcbiAgICAgICAgICAgIHZhciBoYXNFeGlzdGluZ0RhdGFTdG9yZSA9IGRhdGFTdG9yZUtleSAmJiAoZGF0YVN0b3JlS2V5ICE9PSBcIm51bGxcIikgJiYgZGF0YVN0b3JlW2RhdGFTdG9yZUtleV07XG4gICAgICAgICAgICBpZiAoIWhhc0V4aXN0aW5nRGF0YVN0b3JlKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFjcmVhdGVJZk5vdEZvdW5kKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgIGRhdGFTdG9yZUtleSA9IG5vZGVbZGF0YVN0b3JlS2V5RXhwYW5kb1Byb3BlcnR5TmFtZV0gPSBcImtvXCIgKyB1bmlxdWVJZCsrO1xuICAgICAgICAgICAgICAgIGRhdGFTdG9yZVtkYXRhU3RvcmVLZXldID0ge307XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZGF0YVN0b3JlW2RhdGFTdG9yZUtleV07XG4gICAgICAgIH0sXG4gICAgICAgIGNsZWFyOiBmdW5jdGlvbiAobm9kZSkge1xuICAgICAgICAgICAgdmFyIGRhdGFTdG9yZUtleSA9IG5vZGVbZGF0YVN0b3JlS2V5RXhwYW5kb1Byb3BlcnR5TmFtZV07XG4gICAgICAgICAgICBpZiAoZGF0YVN0b3JlS2V5KSB7XG4gICAgICAgICAgICAgICAgZGVsZXRlIGRhdGFTdG9yZVtkYXRhU3RvcmVLZXldO1xuICAgICAgICAgICAgICAgIG5vZGVbZGF0YVN0b3JlS2V5RXhwYW5kb1Byb3BlcnR5TmFtZV0gPSBudWxsO1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlOyAvLyBFeHBvc2luZyBcImRpZCBjbGVhblwiIGZsYWcgcHVyZWx5IHNvIHNwZWNzIGNhbiBpbmZlciB3aGV0aGVyIHRoaW5ncyBoYXZlIGJlZW4gY2xlYW5lZCB1cCBhcyBpbnRlbmRlZFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxufSkoKTtcblxua28uZXhwb3J0U3ltYm9sKCd1dGlscy5kb21EYXRhJywga28udXRpbHMuZG9tRGF0YSk7XG5rby5leHBvcnRTeW1ib2woJ3V0aWxzLmRvbURhdGEuY2xlYXInLCBrby51dGlscy5kb21EYXRhLmNsZWFyKTsgLy8gRXhwb3J0aW5nIG9ubHkgc28gc3BlY3MgY2FuIGNsZWFyIHVwIGFmdGVyIHRoZW1zZWx2ZXMgZnVsbHlcblxua28udXRpbHMuZG9tTm9kZURpc3Bvc2FsID0gbmV3IChmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGRvbURhdGFLZXkgPSBcIl9fa29fZG9tTm9kZURpc3Bvc2FsX19cIiArIChuZXcgRGF0ZSkuZ2V0VGltZSgpO1xuICAgIHZhciBjbGVhbmFibGVOb2RlVHlwZXMgPSB7IDE6IHRydWUsIDg6IHRydWUsIDk6IHRydWUgfTsgICAgICAgLy8gRWxlbWVudCwgQ29tbWVudCwgRG9jdW1lbnRcbiAgICB2YXIgY2xlYW5hYmxlTm9kZVR5cGVzV2l0aERlc2NlbmRhbnRzID0geyAxOiB0cnVlLCA5OiB0cnVlIH07IC8vIEVsZW1lbnQsIERvY3VtZW50XG5cbiAgICBmdW5jdGlvbiBnZXREaXNwb3NlQ2FsbGJhY2tzQ29sbGVjdGlvbihub2RlLCBjcmVhdGVJZk5vdEZvdW5kKSB7XG4gICAgICAgIHZhciBhbGxEaXNwb3NlQ2FsbGJhY2tzID0ga28udXRpbHMuZG9tRGF0YS5nZXQobm9kZSwgZG9tRGF0YUtleSk7XG4gICAgICAgIGlmICgoYWxsRGlzcG9zZUNhbGxiYWNrcyA9PT0gdW5kZWZpbmVkKSAmJiBjcmVhdGVJZk5vdEZvdW5kKSB7XG4gICAgICAgICAgICBhbGxEaXNwb3NlQ2FsbGJhY2tzID0gW107XG4gICAgICAgICAgICBrby51dGlscy5kb21EYXRhLnNldChub2RlLCBkb21EYXRhS2V5LCBhbGxEaXNwb3NlQ2FsbGJhY2tzKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYWxsRGlzcG9zZUNhbGxiYWNrcztcbiAgICB9XG4gICAgZnVuY3Rpb24gZGVzdHJveUNhbGxiYWNrc0NvbGxlY3Rpb24obm9kZSkge1xuICAgICAgICBrby51dGlscy5kb21EYXRhLnNldChub2RlLCBkb21EYXRhS2V5LCB1bmRlZmluZWQpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNsZWFuU2luZ2xlTm9kZShub2RlKSB7XG4gICAgICAgIC8vIFJ1biBhbGwgdGhlIGRpc3Bvc2UgY2FsbGJhY2tzXG4gICAgICAgIHZhciBjYWxsYmFja3MgPSBnZXREaXNwb3NlQ2FsbGJhY2tzQ29sbGVjdGlvbihub2RlLCBmYWxzZSk7XG4gICAgICAgIGlmIChjYWxsYmFja3MpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrcyA9IGNhbGxiYWNrcy5zbGljZSgwKTsgLy8gQ2xvbmUsIGFzIHRoZSBhcnJheSBtYXkgYmUgbW9kaWZpZWQgZHVyaW5nIGl0ZXJhdGlvbiAodHlwaWNhbGx5LCBjYWxsYmFja3Mgd2lsbCByZW1vdmUgdGhlbXNlbHZlcylcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2FsbGJhY2tzLmxlbmd0aDsgaSsrKVxuICAgICAgICAgICAgICAgIGNhbGxiYWNrc1tpXShub2RlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEFsc28gZXJhc2UgdGhlIERPTSBkYXRhXG4gICAgICAgIGtvLnV0aWxzLmRvbURhdGEuY2xlYXIobm9kZSk7XG5cbiAgICAgICAgLy8gU3BlY2lhbCBzdXBwb3J0IGZvciBqUXVlcnkgaGVyZSBiZWNhdXNlIGl0J3Mgc28gY29tbW9ubHkgdXNlZC5cbiAgICAgICAgLy8gTWFueSBqUXVlcnkgcGx1Z2lucyAoaW5jbHVkaW5nIGpxdWVyeS50bXBsKSBzdG9yZSBkYXRhIHVzaW5nIGpRdWVyeSdzIGVxdWl2YWxlbnQgb2YgZG9tRGF0YVxuICAgICAgICAvLyBzbyBub3RpZnkgaXQgdG8gdGVhciBkb3duIGFueSByZXNvdXJjZXMgYXNzb2NpYXRlZCB3aXRoIHRoZSBub2RlICYgZGVzY2VuZGFudHMgaGVyZS5cbiAgICAgICAgaWYgKCh0eXBlb2YgalF1ZXJ5ID09IFwiZnVuY3Rpb25cIikgJiYgKHR5cGVvZiBqUXVlcnlbJ2NsZWFuRGF0YSddID09IFwiZnVuY3Rpb25cIikpXG4gICAgICAgICAgICBqUXVlcnlbJ2NsZWFuRGF0YSddKFtub2RlXSk7XG5cbiAgICAgICAgLy8gQWxzbyBjbGVhciBhbnkgaW1tZWRpYXRlLWNoaWxkIGNvbW1lbnQgbm9kZXMsIGFzIHRoZXNlIHdvdWxkbid0IGhhdmUgYmVlbiBmb3VuZCBieVxuICAgICAgICAvLyBub2RlLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiKlwiKSBpbiBjbGVhbk5vZGUoKSAoY29tbWVudCBub2RlcyBhcmVuJ3QgZWxlbWVudHMpXG4gICAgICAgIGlmIChjbGVhbmFibGVOb2RlVHlwZXNXaXRoRGVzY2VuZGFudHNbbm9kZS5ub2RlVHlwZV0pXG4gICAgICAgICAgICBjbGVhbkltbWVkaWF0ZUNvbW1lbnRUeXBlQ2hpbGRyZW4obm9kZSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY2xlYW5JbW1lZGlhdGVDb21tZW50VHlwZUNoaWxkcmVuKG5vZGVXaXRoQ2hpbGRyZW4pIHtcbiAgICAgICAgdmFyIGNoaWxkLCBuZXh0Q2hpbGQgPSBub2RlV2l0aENoaWxkcmVuLmZpcnN0Q2hpbGQ7XG4gICAgICAgIHdoaWxlIChjaGlsZCA9IG5leHRDaGlsZCkge1xuICAgICAgICAgICAgbmV4dENoaWxkID0gY2hpbGQubmV4dFNpYmxpbmc7XG4gICAgICAgICAgICBpZiAoY2hpbGQubm9kZVR5cGUgPT09IDgpXG4gICAgICAgICAgICAgICAgY2xlYW5TaW5nbGVOb2RlKGNoaWxkKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIGFkZERpc3Bvc2VDYWxsYmFjayA6IGZ1bmN0aW9uKG5vZGUsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGNhbGxiYWNrICE9IFwiZnVuY3Rpb25cIilcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDYWxsYmFjayBtdXN0IGJlIGEgZnVuY3Rpb25cIik7XG4gICAgICAgICAgICBnZXREaXNwb3NlQ2FsbGJhY2tzQ29sbGVjdGlvbihub2RlLCB0cnVlKS5wdXNoKGNhbGxiYWNrKTtcbiAgICAgICAgfSxcblxuICAgICAgICByZW1vdmVEaXNwb3NlQ2FsbGJhY2sgOiBmdW5jdGlvbihub2RlLCBjYWxsYmFjaykge1xuICAgICAgICAgICAgdmFyIGNhbGxiYWNrc0NvbGxlY3Rpb24gPSBnZXREaXNwb3NlQ2FsbGJhY2tzQ29sbGVjdGlvbihub2RlLCBmYWxzZSk7XG4gICAgICAgICAgICBpZiAoY2FsbGJhY2tzQ29sbGVjdGlvbikge1xuICAgICAgICAgICAgICAgIGtvLnV0aWxzLmFycmF5UmVtb3ZlSXRlbShjYWxsYmFja3NDb2xsZWN0aW9uLCBjYWxsYmFjayk7XG4gICAgICAgICAgICAgICAgaWYgKGNhbGxiYWNrc0NvbGxlY3Rpb24ubGVuZ3RoID09IDApXG4gICAgICAgICAgICAgICAgICAgIGRlc3Ryb3lDYWxsYmFja3NDb2xsZWN0aW9uKG5vZGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIGNsZWFuTm9kZSA6IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgICAgICAgIC8vIEZpcnN0IGNsZWFuIHRoaXMgbm9kZSwgd2hlcmUgYXBwbGljYWJsZVxuICAgICAgICAgICAgaWYgKGNsZWFuYWJsZU5vZGVUeXBlc1tub2RlLm5vZGVUeXBlXSkge1xuICAgICAgICAgICAgICAgIGNsZWFuU2luZ2xlTm9kZShub2RlKTtcblxuICAgICAgICAgICAgICAgIC8vIC4uLiB0aGVuIGl0cyBkZXNjZW5kYW50cywgd2hlcmUgYXBwbGljYWJsZVxuICAgICAgICAgICAgICAgIGlmIChjbGVhbmFibGVOb2RlVHlwZXNXaXRoRGVzY2VuZGFudHNbbm9kZS5ub2RlVHlwZV0pIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gQ2xvbmUgdGhlIGRlc2NlbmRhbnRzIGxpc3QgaW4gY2FzZSBpdCBjaGFuZ2VzIGR1cmluZyBpdGVyYXRpb25cbiAgICAgICAgICAgICAgICAgICAgdmFyIGRlc2NlbmRhbnRzID0gW107XG4gICAgICAgICAgICAgICAgICAgIGtvLnV0aWxzLmFycmF5UHVzaEFsbChkZXNjZW5kYW50cywgbm9kZS5nZXRFbGVtZW50c0J5VGFnTmFtZShcIipcIikpO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgaiA9IGRlc2NlbmRhbnRzLmxlbmd0aDsgaSA8IGo7IGkrKylcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsZWFuU2luZ2xlTm9kZShkZXNjZW5kYW50c1tpXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG5vZGU7XG4gICAgICAgIH0sXG5cbiAgICAgICAgcmVtb3ZlTm9kZSA6IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgICAgICAgIGtvLmNsZWFuTm9kZShub2RlKTtcbiAgICAgICAgICAgIGlmIChub2RlLnBhcmVudE5vZGUpXG4gICAgICAgICAgICAgICAgbm9kZS5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKG5vZGUpO1xuICAgICAgICB9XG4gICAgfVxufSkoKTtcbmtvLmNsZWFuTm9kZSA9IGtvLnV0aWxzLmRvbU5vZGVEaXNwb3NhbC5jbGVhbk5vZGU7IC8vIFNob3J0aGFuZCBuYW1lIGZvciBjb252ZW5pZW5jZVxua28ucmVtb3ZlTm9kZSA9IGtvLnV0aWxzLmRvbU5vZGVEaXNwb3NhbC5yZW1vdmVOb2RlOyAvLyBTaG9ydGhhbmQgbmFtZSBmb3IgY29udmVuaWVuY2VcbmtvLmV4cG9ydFN5bWJvbCgnY2xlYW5Ob2RlJywga28uY2xlYW5Ob2RlKTtcbmtvLmV4cG9ydFN5bWJvbCgncmVtb3ZlTm9kZScsIGtvLnJlbW92ZU5vZGUpO1xua28uZXhwb3J0U3ltYm9sKCd1dGlscy5kb21Ob2RlRGlzcG9zYWwnLCBrby51dGlscy5kb21Ob2RlRGlzcG9zYWwpO1xua28uZXhwb3J0U3ltYm9sKCd1dGlscy5kb21Ob2RlRGlzcG9zYWwuYWRkRGlzcG9zZUNhbGxiYWNrJywga28udXRpbHMuZG9tTm9kZURpc3Bvc2FsLmFkZERpc3Bvc2VDYWxsYmFjayk7XG5rby5leHBvcnRTeW1ib2woJ3V0aWxzLmRvbU5vZGVEaXNwb3NhbC5yZW1vdmVEaXNwb3NlQ2FsbGJhY2snLCBrby51dGlscy5kb21Ob2RlRGlzcG9zYWwucmVtb3ZlRGlzcG9zZUNhbGxiYWNrKTtcbihmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGxlYWRpbmdDb21tZW50UmVnZXggPSAvXihcXHMqKTwhLS0oLio/KS0tPi87XG5cbiAgICBmdW5jdGlvbiBzaW1wbGVIdG1sUGFyc2UoaHRtbCkge1xuICAgICAgICAvLyBCYXNlZCBvbiBqUXVlcnkncyBcImNsZWFuXCIgZnVuY3Rpb24sIGJ1dCBvbmx5IGFjY291bnRpbmcgZm9yIHRhYmxlLXJlbGF0ZWQgZWxlbWVudHMuXG4gICAgICAgIC8vIElmIHlvdSBoYXZlIHJlZmVyZW5jZWQgalF1ZXJ5LCB0aGlzIHdvbid0IGJlIHVzZWQgYW55d2F5IC0gS08gd2lsbCB1c2UgalF1ZXJ5J3MgXCJjbGVhblwiIGZ1bmN0aW9uIGRpcmVjdGx5XG5cbiAgICAgICAgLy8gTm90ZSB0aGF0IHRoZXJlJ3Mgc3RpbGwgYW4gaXNzdWUgaW4gSUUgPCA5IHdoZXJlYnkgaXQgd2lsbCBkaXNjYXJkIGNvbW1lbnQgbm9kZXMgdGhhdCBhcmUgdGhlIGZpcnN0IGNoaWxkIG9mXG4gICAgICAgIC8vIGEgZGVzY2VuZGFudCBub2RlLiBGb3IgZXhhbXBsZTogXCI8ZGl2PjwhLS0gbXljb21tZW50IC0tPmFiYzwvZGl2PlwiIHdpbGwgZ2V0IHBhcnNlZCBhcyBcIjxkaXY+YWJjPC9kaXY+XCJcbiAgICAgICAgLy8gVGhpcyB3b24ndCBhZmZlY3QgYW55b25lIHdobyBoYXMgcmVmZXJlbmNlZCBqUXVlcnksIGFuZCB0aGVyZSdzIGFsd2F5cyB0aGUgd29ya2Fyb3VuZCBvZiBpbnNlcnRpbmcgYSBkdW1teSBub2RlXG4gICAgICAgIC8vIChwb3NzaWJseSBhIHRleHQgbm9kZSkgaW4gZnJvbnQgb2YgdGhlIGNvbW1lbnQuIFNvLCBLTyBkb2VzIG5vdCBhdHRlbXB0IHRvIHdvcmthcm91bmQgdGhpcyBJRSBpc3N1ZSBhdXRvbWF0aWNhbGx5IGF0IHByZXNlbnQuXG5cbiAgICAgICAgLy8gVHJpbSB3aGl0ZXNwYWNlLCBvdGhlcndpc2UgaW5kZXhPZiB3b24ndCB3b3JrIGFzIGV4cGVjdGVkXG4gICAgICAgIHZhciB0YWdzID0ga28udXRpbHMuc3RyaW5nVHJpbShodG1sKS50b0xvd2VyQ2FzZSgpLCBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuXG4gICAgICAgIC8vIEZpbmRzIHRoZSBmaXJzdCBtYXRjaCBmcm9tIHRoZSBsZWZ0IGNvbHVtbiwgYW5kIHJldHVybnMgdGhlIGNvcnJlc3BvbmRpbmcgXCJ3cmFwXCIgZGF0YSBmcm9tIHRoZSByaWdodCBjb2x1bW5cbiAgICAgICAgdmFyIHdyYXAgPSB0YWdzLm1hdGNoKC9ePCh0aGVhZHx0Ym9keXx0Zm9vdCkvKSAgICAgICAgICAgICAgJiYgWzEsIFwiPHRhYmxlPlwiLCBcIjwvdGFibGU+XCJdIHx8XG4gICAgICAgICAgICAgICAgICAgIXRhZ3MuaW5kZXhPZihcIjx0clwiKSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJiYgWzIsIFwiPHRhYmxlPjx0Ym9keT5cIiwgXCI8L3Rib2R5PjwvdGFibGU+XCJdIHx8XG4gICAgICAgICAgICAgICAgICAgKCF0YWdzLmluZGV4T2YoXCI8dGRcIikgfHwgIXRhZ3MuaW5kZXhPZihcIjx0aFwiKSkgICAmJiBbMywgXCI8dGFibGU+PHRib2R5Pjx0cj5cIiwgXCI8L3RyPjwvdGJvZHk+PC90YWJsZT5cIl0gfHxcbiAgICAgICAgICAgICAgICAgICAvKiBhbnl0aGluZyBlbHNlICovICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgWzAsIFwiXCIsIFwiXCJdO1xuXG4gICAgICAgIC8vIEdvIHRvIGh0bWwgYW5kIGJhY2ssIHRoZW4gcGVlbCBvZmYgZXh0cmEgd3JhcHBlcnNcbiAgICAgICAgLy8gTm90ZSB0aGF0IHdlIGFsd2F5cyBwcmVmaXggd2l0aCBzb21lIGR1bW15IHRleHQsIGJlY2F1c2Ugb3RoZXJ3aXNlLCBJRTw5IHdpbGwgc3RyaXAgb3V0IGxlYWRpbmcgY29tbWVudCBub2RlcyBpbiBkZXNjZW5kYW50cy4gVG90YWwgbWFkbmVzcy5cbiAgICAgICAgdmFyIG1hcmt1cCA9IFwiaWdub3JlZDxkaXY+XCIgKyB3cmFwWzFdICsgaHRtbCArIHdyYXBbMl0gKyBcIjwvZGl2PlwiO1xuICAgICAgICBpZiAodHlwZW9mIHdpbmRvd1snaW5uZXJTaGl2J10gPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICBkaXYuYXBwZW5kQ2hpbGQod2luZG93Wydpbm5lclNoaXYnXShtYXJrdXApKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGRpdi5pbm5lckhUTUwgPSBtYXJrdXA7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBNb3ZlIHRvIHRoZSByaWdodCBkZXB0aFxuICAgICAgICB3aGlsZSAod3JhcFswXS0tKVxuICAgICAgICAgICAgZGl2ID0gZGl2Lmxhc3RDaGlsZDtcblxuICAgICAgICByZXR1cm4ga28udXRpbHMubWFrZUFycmF5KGRpdi5sYXN0Q2hpbGQuY2hpbGROb2Rlcyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24galF1ZXJ5SHRtbFBhcnNlKGh0bWwpIHtcbiAgICAgICAgLy8galF1ZXJ5J3MgXCJwYXJzZUhUTUxcIiBmdW5jdGlvbiB3YXMgaW50cm9kdWNlZCBpbiBqUXVlcnkgMS44LjAgYW5kIGlzIGEgZG9jdW1lbnRlZCBwdWJsaWMgQVBJLlxuICAgICAgICBpZiAoalF1ZXJ5WydwYXJzZUhUTUwnXSkge1xuICAgICAgICAgICAgcmV0dXJuIGpRdWVyeVsncGFyc2VIVE1MJ10oaHRtbCkgfHwgW107IC8vIEVuc3VyZSB3ZSBhbHdheXMgcmV0dXJuIGFuIGFycmF5IGFuZCBuZXZlciBudWxsXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBGb3IgalF1ZXJ5IDwgMS44LjAsIHdlIGZhbGwgYmFjayBvbiB0aGUgdW5kb2N1bWVudGVkIGludGVybmFsIFwiY2xlYW5cIiBmdW5jdGlvbi5cbiAgICAgICAgICAgIHZhciBlbGVtcyA9IGpRdWVyeVsnY2xlYW4nXShbaHRtbF0pO1xuXG4gICAgICAgICAgICAvLyBBcyBvZiBqUXVlcnkgMS43LjEsIGpRdWVyeSBwYXJzZXMgdGhlIEhUTUwgYnkgYXBwZW5kaW5nIGl0IHRvIHNvbWUgZHVtbXkgcGFyZW50IG5vZGVzIGhlbGQgaW4gYW4gaW4tbWVtb3J5IGRvY3VtZW50IGZyYWdtZW50LlxuICAgICAgICAgICAgLy8gVW5mb3J0dW5hdGVseSwgaXQgbmV2ZXIgY2xlYXJzIHRoZSBkdW1teSBwYXJlbnQgbm9kZXMgZnJvbSB0aGUgZG9jdW1lbnQgZnJhZ21lbnQsIHNvIGl0IGxlYWtzIG1lbW9yeSBvdmVyIHRpbWUuXG4gICAgICAgICAgICAvLyBGaXggdGhpcyBieSBmaW5kaW5nIHRoZSB0b3AtbW9zdCBkdW1teSBwYXJlbnQgZWxlbWVudCwgYW5kIGRldGFjaGluZyBpdCBmcm9tIGl0cyBvd25lciBmcmFnbWVudC5cbiAgICAgICAgICAgIGlmIChlbGVtcyAmJiBlbGVtc1swXSkge1xuICAgICAgICAgICAgICAgIC8vIEZpbmQgdGhlIHRvcC1tb3N0IHBhcmVudCBlbGVtZW50IHRoYXQncyBhIGRpcmVjdCBjaGlsZCBvZiBhIGRvY3VtZW50IGZyYWdtZW50XG4gICAgICAgICAgICAgICAgdmFyIGVsZW0gPSBlbGVtc1swXTtcbiAgICAgICAgICAgICAgICB3aGlsZSAoZWxlbS5wYXJlbnROb2RlICYmIGVsZW0ucGFyZW50Tm9kZS5ub2RlVHlwZSAhPT0gMTEgLyogaS5lLiwgRG9jdW1lbnRGcmFnbWVudCAqLylcbiAgICAgICAgICAgICAgICAgICAgZWxlbSA9IGVsZW0ucGFyZW50Tm9kZTtcbiAgICAgICAgICAgICAgICAvLyAuLi4gdGhlbiBkZXRhY2ggaXRcbiAgICAgICAgICAgICAgICBpZiAoZWxlbS5wYXJlbnROb2RlKVxuICAgICAgICAgICAgICAgICAgICBlbGVtLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoZWxlbSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBlbGVtcztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGtvLnV0aWxzLnBhcnNlSHRtbEZyYWdtZW50ID0gZnVuY3Rpb24oaHRtbCkge1xuICAgICAgICByZXR1cm4gdHlwZW9mIGpRdWVyeSAhPSAndW5kZWZpbmVkJyA/IGpRdWVyeUh0bWxQYXJzZShodG1sKSAgIC8vIEFzIGJlbG93LCBiZW5lZml0IGZyb20galF1ZXJ5J3Mgb3B0aW1pc2F0aW9ucyB3aGVyZSBwb3NzaWJsZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IHNpbXBsZUh0bWxQYXJzZShodG1sKTsgIC8vIC4uLiBvdGhlcndpc2UsIHRoaXMgc2ltcGxlIGxvZ2ljIHdpbGwgZG8gaW4gbW9zdCBjb21tb24gY2FzZXMuXG4gICAgfTtcblxuICAgIGtvLnV0aWxzLnNldEh0bWwgPSBmdW5jdGlvbihub2RlLCBodG1sKSB7XG4gICAgICAgIGtvLnV0aWxzLmVtcHR5RG9tTm9kZShub2RlKTtcblxuICAgICAgICAvLyBUaGVyZSdzIG5vIGxlZ2l0aW1hdGUgcmVhc29uIHRvIGRpc3BsYXkgYSBzdHJpbmdpZmllZCBvYnNlcnZhYmxlIHdpdGhvdXQgdW53cmFwcGluZyBpdCwgc28gd2UnbGwgdW53cmFwIGl0XG4gICAgICAgIGh0bWwgPSBrby51dGlscy51bndyYXBPYnNlcnZhYmxlKGh0bWwpO1xuXG4gICAgICAgIGlmICgoaHRtbCAhPT0gbnVsbCkgJiYgKGh0bWwgIT09IHVuZGVmaW5lZCkpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgaHRtbCAhPSAnc3RyaW5nJylcbiAgICAgICAgICAgICAgICBodG1sID0gaHRtbC50b1N0cmluZygpO1xuXG4gICAgICAgICAgICAvLyBqUXVlcnkgY29udGFpbnMgYSBsb3Qgb2Ygc29waGlzdGljYXRlZCBjb2RlIHRvIHBhcnNlIGFyYml0cmFyeSBIVE1MIGZyYWdtZW50cyxcbiAgICAgICAgICAgIC8vIGZvciBleGFtcGxlIDx0cj4gZWxlbWVudHMgd2hpY2ggYXJlIG5vdCBub3JtYWxseSBhbGxvd2VkIHRvIGV4aXN0IG9uIHRoZWlyIG93bi5cbiAgICAgICAgICAgIC8vIElmIHlvdSd2ZSByZWZlcmVuY2VkIGpRdWVyeSB3ZSdsbCB1c2UgdGhhdCByYXRoZXIgdGhhbiBkdXBsaWNhdGluZyBpdHMgY29kZS5cbiAgICAgICAgICAgIGlmICh0eXBlb2YgalF1ZXJ5ICE9ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgalF1ZXJ5KG5vZGUpWydodG1sJ10oaHRtbCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIC4uLiBvdGhlcndpc2UsIHVzZSBLTydzIG93biBwYXJzaW5nIGxvZ2ljLlxuICAgICAgICAgICAgICAgIHZhciBwYXJzZWROb2RlcyA9IGtvLnV0aWxzLnBhcnNlSHRtbEZyYWdtZW50KGh0bWwpO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcGFyc2VkTm9kZXMubGVuZ3RoOyBpKyspXG4gICAgICAgICAgICAgICAgICAgIG5vZGUuYXBwZW5kQ2hpbGQocGFyc2VkTm9kZXNbaV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbn0pKCk7XG5cbmtvLmV4cG9ydFN5bWJvbCgndXRpbHMucGFyc2VIdG1sRnJhZ21lbnQnLCBrby51dGlscy5wYXJzZUh0bWxGcmFnbWVudCk7XG5rby5leHBvcnRTeW1ib2woJ3V0aWxzLnNldEh0bWwnLCBrby51dGlscy5zZXRIdG1sKTtcblxua28ubWVtb2l6YXRpb24gPSAoZnVuY3Rpb24gKCkge1xuICAgIHZhciBtZW1vcyA9IHt9O1xuXG4gICAgZnVuY3Rpb24gcmFuZG9tTWF4OEhleENoYXJzKCkge1xuICAgICAgICByZXR1cm4gKCgoMSArIE1hdGgucmFuZG9tKCkpICogMHgxMDAwMDAwMDApIHwgMCkudG9TdHJpbmcoMTYpLnN1YnN0cmluZygxKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZ2VuZXJhdGVSYW5kb21JZCgpIHtcbiAgICAgICAgcmV0dXJuIHJhbmRvbU1heDhIZXhDaGFycygpICsgcmFuZG9tTWF4OEhleENoYXJzKCk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGZpbmRNZW1vTm9kZXMocm9vdE5vZGUsIGFwcGVuZFRvQXJyYXkpIHtcbiAgICAgICAgaWYgKCFyb290Tm9kZSlcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgaWYgKHJvb3ROb2RlLm5vZGVUeXBlID09IDgpIHtcbiAgICAgICAgICAgIHZhciBtZW1vSWQgPSBrby5tZW1vaXphdGlvbi5wYXJzZU1lbW9UZXh0KHJvb3ROb2RlLm5vZGVWYWx1ZSk7XG4gICAgICAgICAgICBpZiAobWVtb0lkICE9IG51bGwpXG4gICAgICAgICAgICAgICAgYXBwZW5kVG9BcnJheS5wdXNoKHsgZG9tTm9kZTogcm9vdE5vZGUsIG1lbW9JZDogbWVtb0lkIH0pO1xuICAgICAgICB9IGVsc2UgaWYgKHJvb3ROb2RlLm5vZGVUeXBlID09IDEpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBjaGlsZE5vZGVzID0gcm9vdE5vZGUuY2hpbGROb2RlcywgaiA9IGNoaWxkTm9kZXMubGVuZ3RoOyBpIDwgajsgaSsrKVxuICAgICAgICAgICAgICAgIGZpbmRNZW1vTm9kZXMoY2hpbGROb2Rlc1tpXSwgYXBwZW5kVG9BcnJheSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBtZW1vaXplOiBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT0gXCJmdW5jdGlvblwiKVxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIllvdSBjYW4gb25seSBwYXNzIGEgZnVuY3Rpb24gdG8ga28ubWVtb2l6YXRpb24ubWVtb2l6ZSgpXCIpO1xuICAgICAgICAgICAgdmFyIG1lbW9JZCA9IGdlbmVyYXRlUmFuZG9tSWQoKTtcbiAgICAgICAgICAgIG1lbW9zW21lbW9JZF0gPSBjYWxsYmFjaztcbiAgICAgICAgICAgIHJldHVybiBcIjwhLS1ba29fbWVtbzpcIiArIG1lbW9JZCArIFwiXS0tPlwiO1xuICAgICAgICB9LFxuXG4gICAgICAgIHVubWVtb2l6ZTogZnVuY3Rpb24gKG1lbW9JZCwgY2FsbGJhY2tQYXJhbXMpIHtcbiAgICAgICAgICAgIHZhciBjYWxsYmFjayA9IG1lbW9zW21lbW9JZF07XG4gICAgICAgICAgICBpZiAoY2FsbGJhY2sgPT09IHVuZGVmaW5lZClcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDb3VsZG4ndCBmaW5kIGFueSBtZW1vIHdpdGggSUQgXCIgKyBtZW1vSWQgKyBcIi4gUGVyaGFwcyBpdCdzIGFscmVhZHkgYmVlbiB1bm1lbW9pemVkLlwiKTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2suYXBwbHkobnVsbCwgY2FsbGJhY2tQYXJhbXMgfHwgW10pO1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZmluYWxseSB7IGRlbGV0ZSBtZW1vc1ttZW1vSWRdOyB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgdW5tZW1vaXplRG9tTm9kZUFuZERlc2NlbmRhbnRzOiBmdW5jdGlvbiAoZG9tTm9kZSwgZXh0cmFDYWxsYmFja1BhcmFtc0FycmF5KSB7XG4gICAgICAgICAgICB2YXIgbWVtb3MgPSBbXTtcbiAgICAgICAgICAgIGZpbmRNZW1vTm9kZXMoZG9tTm9kZSwgbWVtb3MpO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGogPSBtZW1vcy5sZW5ndGg7IGkgPCBqOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgbm9kZSA9IG1lbW9zW2ldLmRvbU5vZGU7XG4gICAgICAgICAgICAgICAgdmFyIGNvbWJpbmVkUGFyYW1zID0gW25vZGVdO1xuICAgICAgICAgICAgICAgIGlmIChleHRyYUNhbGxiYWNrUGFyYW1zQXJyYXkpXG4gICAgICAgICAgICAgICAgICAgIGtvLnV0aWxzLmFycmF5UHVzaEFsbChjb21iaW5lZFBhcmFtcywgZXh0cmFDYWxsYmFja1BhcmFtc0FycmF5KTtcbiAgICAgICAgICAgICAgICBrby5tZW1vaXphdGlvbi51bm1lbW9pemUobWVtb3NbaV0ubWVtb0lkLCBjb21iaW5lZFBhcmFtcyk7XG4gICAgICAgICAgICAgICAgbm9kZS5ub2RlVmFsdWUgPSBcIlwiOyAvLyBOZXV0ZXIgdGhpcyBub2RlIHNvIHdlIGRvbid0IHRyeSB0byB1bm1lbW9pemUgaXQgYWdhaW5cbiAgICAgICAgICAgICAgICBpZiAobm9kZS5wYXJlbnROb2RlKVxuICAgICAgICAgICAgICAgICAgICBub2RlLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQobm9kZSk7IC8vIElmIHBvc3NpYmxlLCBlcmFzZSBpdCB0b3RhbGx5IChub3QgYWx3YXlzIHBvc3NpYmxlIC0gc29tZW9uZSBlbHNlIG1pZ2h0IGp1c3QgaG9sZCBhIHJlZmVyZW5jZSB0byBpdCB0aGVuIGNhbGwgdW5tZW1vaXplRG9tTm9kZUFuZERlc2NlbmRhbnRzIGFnYWluKVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIHBhcnNlTWVtb1RleHQ6IGZ1bmN0aW9uIChtZW1vVGV4dCkge1xuICAgICAgICAgICAgdmFyIG1hdGNoID0gbWVtb1RleHQubWF0Y2goL15cXFtrb19tZW1vXFw6KC4qPylcXF0kLyk7XG4gICAgICAgICAgICByZXR1cm4gbWF0Y2ggPyBtYXRjaFsxXSA6IG51bGw7XG4gICAgICAgIH1cbiAgICB9O1xufSkoKTtcblxua28uZXhwb3J0U3ltYm9sKCdtZW1vaXphdGlvbicsIGtvLm1lbW9pemF0aW9uKTtcbmtvLmV4cG9ydFN5bWJvbCgnbWVtb2l6YXRpb24ubWVtb2l6ZScsIGtvLm1lbW9pemF0aW9uLm1lbW9pemUpO1xua28uZXhwb3J0U3ltYm9sKCdtZW1vaXphdGlvbi51bm1lbW9pemUnLCBrby5tZW1vaXphdGlvbi51bm1lbW9pemUpO1xua28uZXhwb3J0U3ltYm9sKCdtZW1vaXphdGlvbi5wYXJzZU1lbW9UZXh0Jywga28ubWVtb2l6YXRpb24ucGFyc2VNZW1vVGV4dCk7XG5rby5leHBvcnRTeW1ib2woJ21lbW9pemF0aW9uLnVubWVtb2l6ZURvbU5vZGVBbmREZXNjZW5kYW50cycsIGtvLm1lbW9pemF0aW9uLnVubWVtb2l6ZURvbU5vZGVBbmREZXNjZW5kYW50cyk7XG5rby5leHRlbmRlcnMgPSB7XG4gICAgJ3Rocm90dGxlJzogZnVuY3Rpb24odGFyZ2V0LCB0aW1lb3V0KSB7XG4gICAgICAgIC8vIFRocm90dGxpbmcgbWVhbnMgdHdvIHRoaW5nczpcblxuICAgICAgICAvLyAoMSkgRm9yIGRlcGVuZGVudCBvYnNlcnZhYmxlcywgd2UgdGhyb3R0bGUgKmV2YWx1YXRpb25zKiBzbyB0aGF0LCBubyBtYXR0ZXIgaG93IGZhc3QgaXRzIGRlcGVuZGVuY2llc1xuICAgICAgICAvLyAgICAgbm90aWZ5IHVwZGF0ZXMsIHRoZSB0YXJnZXQgZG9lc24ndCByZS1ldmFsdWF0ZSAoYW5kIGhlbmNlIGRvZXNuJ3Qgbm90aWZ5KSBmYXN0ZXIgdGhhbiBhIGNlcnRhaW4gcmF0ZVxuICAgICAgICB0YXJnZXRbJ3Rocm90dGxlRXZhbHVhdGlvbiddID0gdGltZW91dDtcblxuICAgICAgICAvLyAoMikgRm9yIHdyaXRhYmxlIHRhcmdldHMgKG9ic2VydmFibGVzLCBvciB3cml0YWJsZSBkZXBlbmRlbnQgb2JzZXJ2YWJsZXMpLCB3ZSB0aHJvdHRsZSAqd3JpdGVzKlxuICAgICAgICAvLyAgICAgc28gdGhlIHRhcmdldCBjYW5ub3QgY2hhbmdlIHZhbHVlIHN5bmNocm9ub3VzbHkgb3IgZmFzdGVyIHRoYW4gYSBjZXJ0YWluIHJhdGVcbiAgICAgICAgdmFyIHdyaXRlVGltZW91dEluc3RhbmNlID0gbnVsbDtcbiAgICAgICAgcmV0dXJuIGtvLmRlcGVuZGVudE9ic2VydmFibGUoe1xuICAgICAgICAgICAgJ3JlYWQnOiB0YXJnZXQsXG4gICAgICAgICAgICAnd3JpdGUnOiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dCh3cml0ZVRpbWVvdXRJbnN0YW5jZSk7XG4gICAgICAgICAgICAgICAgd3JpdGVUaW1lb3V0SW5zdGFuY2UgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICB0YXJnZXQodmFsdWUpO1xuICAgICAgICAgICAgICAgIH0sIHRpbWVvdXQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgJ25vdGlmeSc6IGZ1bmN0aW9uKHRhcmdldCwgbm90aWZ5V2hlbikge1xuICAgICAgICB0YXJnZXRbXCJlcXVhbGl0eUNvbXBhcmVyXCJdID0gbm90aWZ5V2hlbiA9PSBcImFsd2F5c1wiXG4gICAgICAgICAgICA/IGZ1bmN0aW9uKCkgeyByZXR1cm4gZmFsc2UgfSAvLyBUcmVhdCBhbGwgdmFsdWVzIGFzIG5vdCBlcXVhbFxuICAgICAgICAgICAgOiBrby5vYnNlcnZhYmxlW1wiZm5cIl1bXCJlcXVhbGl0eUNvbXBhcmVyXCJdO1xuICAgICAgICByZXR1cm4gdGFyZ2V0O1xuICAgIH1cbn07XG5cbmZ1bmN0aW9uIGFwcGx5RXh0ZW5kZXJzKHJlcXVlc3RlZEV4dGVuZGVycykge1xuICAgIHZhciB0YXJnZXQgPSB0aGlzO1xuICAgIGlmIChyZXF1ZXN0ZWRFeHRlbmRlcnMpIHtcbiAgICAgICAga28udXRpbHMub2JqZWN0Rm9yRWFjaChyZXF1ZXN0ZWRFeHRlbmRlcnMsIGZ1bmN0aW9uKGtleSwgdmFsdWUpIHtcbiAgICAgICAgICAgIHZhciBleHRlbmRlckhhbmRsZXIgPSBrby5leHRlbmRlcnNba2V5XTtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZXh0ZW5kZXJIYW5kbGVyID09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICB0YXJnZXQgPSBleHRlbmRlckhhbmRsZXIodGFyZ2V0LCB2YWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gdGFyZ2V0O1xufVxuXG5rby5leHBvcnRTeW1ib2woJ2V4dGVuZGVycycsIGtvLmV4dGVuZGVycyk7XG5cbmtvLnN1YnNjcmlwdGlvbiA9IGZ1bmN0aW9uICh0YXJnZXQsIGNhbGxiYWNrLCBkaXNwb3NlQ2FsbGJhY2spIHtcbiAgICB0aGlzLnRhcmdldCA9IHRhcmdldDtcbiAgICB0aGlzLmNhbGxiYWNrID0gY2FsbGJhY2s7XG4gICAgdGhpcy5kaXNwb3NlQ2FsbGJhY2sgPSBkaXNwb3NlQ2FsbGJhY2s7XG4gICAga28uZXhwb3J0UHJvcGVydHkodGhpcywgJ2Rpc3Bvc2UnLCB0aGlzLmRpc3Bvc2UpO1xufTtcbmtvLnN1YnNjcmlwdGlvbi5wcm90b3R5cGUuZGlzcG9zZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmlzRGlzcG9zZWQgPSB0cnVlO1xuICAgIHRoaXMuZGlzcG9zZUNhbGxiYWNrKCk7XG59O1xuXG5rby5zdWJzY3JpYmFibGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5fc3Vic2NyaXB0aW9ucyA9IHt9O1xuXG4gICAga28udXRpbHMuZXh0ZW5kKHRoaXMsIGtvLnN1YnNjcmliYWJsZVsnZm4nXSk7XG4gICAga28uZXhwb3J0UHJvcGVydHkodGhpcywgJ3N1YnNjcmliZScsIHRoaXMuc3Vic2NyaWJlKTtcbiAgICBrby5leHBvcnRQcm9wZXJ0eSh0aGlzLCAnZXh0ZW5kJywgdGhpcy5leHRlbmQpO1xuICAgIGtvLmV4cG9ydFByb3BlcnR5KHRoaXMsICdnZXRTdWJzY3JpcHRpb25zQ291bnQnLCB0aGlzLmdldFN1YnNjcmlwdGlvbnNDb3VudCk7XG59XG5cbnZhciBkZWZhdWx0RXZlbnQgPSBcImNoYW5nZVwiO1xuXG5rby5zdWJzY3JpYmFibGVbJ2ZuJ10gPSB7XG4gICAgc3Vic2NyaWJlOiBmdW5jdGlvbiAoY2FsbGJhY2ssIGNhbGxiYWNrVGFyZ2V0LCBldmVudCkge1xuICAgICAgICBldmVudCA9IGV2ZW50IHx8IGRlZmF1bHRFdmVudDtcbiAgICAgICAgdmFyIGJvdW5kQ2FsbGJhY2sgPSBjYWxsYmFja1RhcmdldCA/IGNhbGxiYWNrLmJpbmQoY2FsbGJhY2tUYXJnZXQpIDogY2FsbGJhY2s7XG5cbiAgICAgICAgdmFyIHN1YnNjcmlwdGlvbiA9IG5ldyBrby5zdWJzY3JpcHRpb24odGhpcywgYm91bmRDYWxsYmFjaywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAga28udXRpbHMuYXJyYXlSZW1vdmVJdGVtKHRoaXMuX3N1YnNjcmlwdGlvbnNbZXZlbnRdLCBzdWJzY3JpcHRpb24pO1xuICAgICAgICB9LmJpbmQodGhpcykpO1xuXG4gICAgICAgIGlmICghdGhpcy5fc3Vic2NyaXB0aW9uc1tldmVudF0pXG4gICAgICAgICAgICB0aGlzLl9zdWJzY3JpcHRpb25zW2V2ZW50XSA9IFtdO1xuICAgICAgICB0aGlzLl9zdWJzY3JpcHRpb25zW2V2ZW50XS5wdXNoKHN1YnNjcmlwdGlvbik7XG4gICAgICAgIHJldHVybiBzdWJzY3JpcHRpb247XG4gICAgfSxcblxuICAgIFwibm90aWZ5U3Vic2NyaWJlcnNcIjogZnVuY3Rpb24gKHZhbHVlVG9Ob3RpZnksIGV2ZW50KSB7XG4gICAgICAgIGV2ZW50ID0gZXZlbnQgfHwgZGVmYXVsdEV2ZW50O1xuICAgICAgICBpZiAodGhpcy5fc3Vic2NyaXB0aW9uc1tldmVudF0pIHtcbiAgICAgICAgICAgIGtvLmRlcGVuZGVuY3lEZXRlY3Rpb24uaWdub3JlKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGtvLnV0aWxzLmFycmF5Rm9yRWFjaCh0aGlzLl9zdWJzY3JpcHRpb25zW2V2ZW50XS5zbGljZSgwKSwgZnVuY3Rpb24gKHN1YnNjcmlwdGlvbikge1xuICAgICAgICAgICAgICAgICAgICAvLyBJbiBjYXNlIGEgc3Vic2NyaXB0aW9uIHdhcyBkaXNwb3NlZCBkdXJpbmcgdGhlIGFycmF5Rm9yRWFjaCBjeWNsZSwgY2hlY2tcbiAgICAgICAgICAgICAgICAgICAgLy8gZm9yIGlzRGlzcG9zZWQgb24gZWFjaCBzdWJzY3JpcHRpb24gYmVmb3JlIGludm9raW5nIGl0cyBjYWxsYmFja1xuICAgICAgICAgICAgICAgICAgICBpZiAoc3Vic2NyaXB0aW9uICYmIChzdWJzY3JpcHRpb24uaXNEaXNwb3NlZCAhPT0gdHJ1ZSkpXG4gICAgICAgICAgICAgICAgICAgICAgICBzdWJzY3JpcHRpb24uY2FsbGJhY2sodmFsdWVUb05vdGlmeSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBnZXRTdWJzY3JpcHRpb25zQ291bnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHRvdGFsID0gMDtcbiAgICAgICAga28udXRpbHMub2JqZWN0Rm9yRWFjaCh0aGlzLl9zdWJzY3JpcHRpb25zLCBmdW5jdGlvbihldmVudE5hbWUsIHN1YnNjcmlwdGlvbnMpIHtcbiAgICAgICAgICAgIHRvdGFsICs9IHN1YnNjcmlwdGlvbnMubGVuZ3RoO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHRvdGFsO1xuICAgIH0sXG5cbiAgICBleHRlbmQ6IGFwcGx5RXh0ZW5kZXJzXG59O1xuXG5cbmtvLmlzU3Vic2NyaWJhYmxlID0gZnVuY3Rpb24gKGluc3RhbmNlKSB7XG4gICAgcmV0dXJuIGluc3RhbmNlICE9IG51bGwgJiYgdHlwZW9mIGluc3RhbmNlLnN1YnNjcmliZSA9PSBcImZ1bmN0aW9uXCIgJiYgdHlwZW9mIGluc3RhbmNlW1wibm90aWZ5U3Vic2NyaWJlcnNcIl0gPT0gXCJmdW5jdGlvblwiO1xufTtcblxua28uZXhwb3J0U3ltYm9sKCdzdWJzY3JpYmFibGUnLCBrby5zdWJzY3JpYmFibGUpO1xua28uZXhwb3J0U3ltYm9sKCdpc1N1YnNjcmliYWJsZScsIGtvLmlzU3Vic2NyaWJhYmxlKTtcblxua28uZGVwZW5kZW5jeURldGVjdGlvbiA9IChmdW5jdGlvbiAoKSB7XG4gICAgdmFyIF9mcmFtZXMgPSBbXTtcblxuICAgIHJldHVybiB7XG4gICAgICAgIGJlZ2luOiBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgIF9mcmFtZXMucHVzaCh7IGNhbGxiYWNrOiBjYWxsYmFjaywgZGlzdGluY3REZXBlbmRlbmNpZXM6W10gfSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZW5kOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBfZnJhbWVzLnBvcCgpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHJlZ2lzdGVyRGVwZW5kZW5jeTogZnVuY3Rpb24gKHN1YnNjcmliYWJsZSkge1xuICAgICAgICAgICAgaWYgKCFrby5pc1N1YnNjcmliYWJsZShzdWJzY3JpYmFibGUpKVxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIk9ubHkgc3Vic2NyaWJhYmxlIHRoaW5ncyBjYW4gYWN0IGFzIGRlcGVuZGVuY2llc1wiKTtcbiAgICAgICAgICAgIGlmIChfZnJhbWVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICB2YXIgdG9wRnJhbWUgPSBfZnJhbWVzW19mcmFtZXMubGVuZ3RoIC0gMV07XG4gICAgICAgICAgICAgICAgaWYgKCF0b3BGcmFtZSB8fCBrby51dGlscy5hcnJheUluZGV4T2YodG9wRnJhbWUuZGlzdGluY3REZXBlbmRlbmNpZXMsIHN1YnNjcmliYWJsZSkgPj0gMClcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIHRvcEZyYW1lLmRpc3RpbmN0RGVwZW5kZW5jaWVzLnB1c2goc3Vic2NyaWJhYmxlKTtcbiAgICAgICAgICAgICAgICB0b3BGcmFtZS5jYWxsYmFjayhzdWJzY3JpYmFibGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIGlnbm9yZTogZnVuY3Rpb24oY2FsbGJhY2ssIGNhbGxiYWNrVGFyZ2V0LCBjYWxsYmFja0FyZ3MpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgX2ZyYW1lcy5wdXNoKG51bGwpO1xuICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjay5hcHBseShjYWxsYmFja1RhcmdldCwgY2FsbGJhY2tBcmdzIHx8IFtdKTtcbiAgICAgICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICAgICAgX2ZyYW1lcy5wb3AoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG59KSgpO1xudmFyIHByaW1pdGl2ZVR5cGVzID0geyAndW5kZWZpbmVkJzp0cnVlLCAnYm9vbGVhbic6dHJ1ZSwgJ251bWJlcic6dHJ1ZSwgJ3N0cmluZyc6dHJ1ZSB9O1xuXG5rby5vYnNlcnZhYmxlID0gZnVuY3Rpb24gKGluaXRpYWxWYWx1ZSkge1xuICAgIHZhciBfbGF0ZXN0VmFsdWUgPSBpbml0aWFsVmFsdWU7XG5cbiAgICBmdW5jdGlvbiBvYnNlcnZhYmxlKCkge1xuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIC8vIFdyaXRlXG5cbiAgICAgICAgICAgIC8vIElnbm9yZSB3cml0ZXMgaWYgdGhlIHZhbHVlIGhhc24ndCBjaGFuZ2VkXG4gICAgICAgICAgICBpZiAoKCFvYnNlcnZhYmxlWydlcXVhbGl0eUNvbXBhcmVyJ10pIHx8ICFvYnNlcnZhYmxlWydlcXVhbGl0eUNvbXBhcmVyJ10oX2xhdGVzdFZhbHVlLCBhcmd1bWVudHNbMF0pKSB7XG4gICAgICAgICAgICAgICAgb2JzZXJ2YWJsZS52YWx1ZVdpbGxNdXRhdGUoKTtcbiAgICAgICAgICAgICAgICBfbGF0ZXN0VmFsdWUgPSBhcmd1bWVudHNbMF07XG4gICAgICAgICAgICAgICAgaWYgKERFQlVHKSBvYnNlcnZhYmxlLl9sYXRlc3RWYWx1ZSA9IF9sYXRlc3RWYWx1ZTtcbiAgICAgICAgICAgICAgICBvYnNlcnZhYmxlLnZhbHVlSGFzTXV0YXRlZCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7IC8vIFBlcm1pdHMgY2hhaW5lZCBhc3NpZ25tZW50c1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgLy8gUmVhZFxuICAgICAgICAgICAga28uZGVwZW5kZW5jeURldGVjdGlvbi5yZWdpc3RlckRlcGVuZGVuY3kob2JzZXJ2YWJsZSk7IC8vIFRoZSBjYWxsZXIgb25seSBuZWVkcyB0byBiZSBub3RpZmllZCBvZiBjaGFuZ2VzIGlmIHRoZXkgZGlkIGEgXCJyZWFkXCIgb3BlcmF0aW9uXG4gICAgICAgICAgICByZXR1cm4gX2xhdGVzdFZhbHVlO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmIChERUJVRykgb2JzZXJ2YWJsZS5fbGF0ZXN0VmFsdWUgPSBfbGF0ZXN0VmFsdWU7XG4gICAga28uc3Vic2NyaWJhYmxlLmNhbGwob2JzZXJ2YWJsZSk7XG4gICAgb2JzZXJ2YWJsZS5wZWVrID0gZnVuY3Rpb24oKSB7IHJldHVybiBfbGF0ZXN0VmFsdWUgfTtcbiAgICBvYnNlcnZhYmxlLnZhbHVlSGFzTXV0YXRlZCA9IGZ1bmN0aW9uICgpIHsgb2JzZXJ2YWJsZVtcIm5vdGlmeVN1YnNjcmliZXJzXCJdKF9sYXRlc3RWYWx1ZSk7IH1cbiAgICBvYnNlcnZhYmxlLnZhbHVlV2lsbE11dGF0ZSA9IGZ1bmN0aW9uICgpIHsgb2JzZXJ2YWJsZVtcIm5vdGlmeVN1YnNjcmliZXJzXCJdKF9sYXRlc3RWYWx1ZSwgXCJiZWZvcmVDaGFuZ2VcIik7IH1cbiAgICBrby51dGlscy5leHRlbmQob2JzZXJ2YWJsZSwga28ub2JzZXJ2YWJsZVsnZm4nXSk7XG5cbiAgICBrby5leHBvcnRQcm9wZXJ0eShvYnNlcnZhYmxlLCAncGVlaycsIG9ic2VydmFibGUucGVlayk7XG4gICAga28uZXhwb3J0UHJvcGVydHkob2JzZXJ2YWJsZSwgXCJ2YWx1ZUhhc011dGF0ZWRcIiwgb2JzZXJ2YWJsZS52YWx1ZUhhc011dGF0ZWQpO1xuICAgIGtvLmV4cG9ydFByb3BlcnR5KG9ic2VydmFibGUsIFwidmFsdWVXaWxsTXV0YXRlXCIsIG9ic2VydmFibGUudmFsdWVXaWxsTXV0YXRlKTtcblxuICAgIHJldHVybiBvYnNlcnZhYmxlO1xufVxuXG5rby5vYnNlcnZhYmxlWydmbiddID0ge1xuICAgIFwiZXF1YWxpdHlDb21wYXJlclwiOiBmdW5jdGlvbiB2YWx1ZXNBcmVQcmltaXRpdmVBbmRFcXVhbChhLCBiKSB7XG4gICAgICAgIHZhciBvbGRWYWx1ZUlzUHJpbWl0aXZlID0gKGEgPT09IG51bGwpIHx8ICh0eXBlb2YoYSkgaW4gcHJpbWl0aXZlVHlwZXMpO1xuICAgICAgICByZXR1cm4gb2xkVmFsdWVJc1ByaW1pdGl2ZSA/IChhID09PSBiKSA6IGZhbHNlO1xuICAgIH1cbn07XG5cbnZhciBwcm90b1Byb3BlcnR5ID0ga28ub2JzZXJ2YWJsZS5wcm90b1Byb3BlcnR5ID0gXCJfX2tvX3Byb3RvX19cIjtcbmtvLm9ic2VydmFibGVbJ2ZuJ11bcHJvdG9Qcm9wZXJ0eV0gPSBrby5vYnNlcnZhYmxlO1xuXG5rby5oYXNQcm90b3R5cGUgPSBmdW5jdGlvbihpbnN0YW5jZSwgcHJvdG90eXBlKSB7XG4gICAgaWYgKChpbnN0YW5jZSA9PT0gbnVsbCkgfHwgKGluc3RhbmNlID09PSB1bmRlZmluZWQpIHx8IChpbnN0YW5jZVtwcm90b1Byb3BlcnR5XSA9PT0gdW5kZWZpbmVkKSkgcmV0dXJuIGZhbHNlO1xuICAgIGlmIChpbnN0YW5jZVtwcm90b1Byb3BlcnR5XSA9PT0gcHJvdG90eXBlKSByZXR1cm4gdHJ1ZTtcbiAgICByZXR1cm4ga28uaGFzUHJvdG90eXBlKGluc3RhbmNlW3Byb3RvUHJvcGVydHldLCBwcm90b3R5cGUpOyAvLyBXYWxrIHRoZSBwcm90b3R5cGUgY2hhaW5cbn07XG5cbmtvLmlzT2JzZXJ2YWJsZSA9IGZ1bmN0aW9uIChpbnN0YW5jZSkge1xuICAgIHJldHVybiBrby5oYXNQcm90b3R5cGUoaW5zdGFuY2UsIGtvLm9ic2VydmFibGUpO1xufVxua28uaXNXcml0ZWFibGVPYnNlcnZhYmxlID0gZnVuY3Rpb24gKGluc3RhbmNlKSB7XG4gICAgLy8gT2JzZXJ2YWJsZVxuICAgIGlmICgodHlwZW9mIGluc3RhbmNlID09IFwiZnVuY3Rpb25cIikgJiYgaW5zdGFuY2VbcHJvdG9Qcm9wZXJ0eV0gPT09IGtvLm9ic2VydmFibGUpXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIC8vIFdyaXRlYWJsZSBkZXBlbmRlbnQgb2JzZXJ2YWJsZVxuICAgIGlmICgodHlwZW9mIGluc3RhbmNlID09IFwiZnVuY3Rpb25cIikgJiYgKGluc3RhbmNlW3Byb3RvUHJvcGVydHldID09PSBrby5kZXBlbmRlbnRPYnNlcnZhYmxlKSAmJiAoaW5zdGFuY2UuaGFzV3JpdGVGdW5jdGlvbikpXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIC8vIEFueXRoaW5nIGVsc2VcbiAgICByZXR1cm4gZmFsc2U7XG59XG5cblxua28uZXhwb3J0U3ltYm9sKCdvYnNlcnZhYmxlJywga28ub2JzZXJ2YWJsZSk7XG5rby5leHBvcnRTeW1ib2woJ2lzT2JzZXJ2YWJsZScsIGtvLmlzT2JzZXJ2YWJsZSk7XG5rby5leHBvcnRTeW1ib2woJ2lzV3JpdGVhYmxlT2JzZXJ2YWJsZScsIGtvLmlzV3JpdGVhYmxlT2JzZXJ2YWJsZSk7XG5rby5vYnNlcnZhYmxlQXJyYXkgPSBmdW5jdGlvbiAoaW5pdGlhbFZhbHVlcykge1xuICAgIGluaXRpYWxWYWx1ZXMgPSBpbml0aWFsVmFsdWVzIHx8IFtdO1xuXG4gICAgaWYgKHR5cGVvZiBpbml0aWFsVmFsdWVzICE9ICdvYmplY3QnIHx8ICEoJ2xlbmd0aCcgaW4gaW5pdGlhbFZhbHVlcykpXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlRoZSBhcmd1bWVudCBwYXNzZWQgd2hlbiBpbml0aWFsaXppbmcgYW4gb2JzZXJ2YWJsZSBhcnJheSBtdXN0IGJlIGFuIGFycmF5LCBvciBudWxsLCBvciB1bmRlZmluZWQuXCIpO1xuXG4gICAgdmFyIHJlc3VsdCA9IGtvLm9ic2VydmFibGUoaW5pdGlhbFZhbHVlcyk7XG4gICAga28udXRpbHMuZXh0ZW5kKHJlc3VsdCwga28ub2JzZXJ2YWJsZUFycmF5WydmbiddKTtcbiAgICByZXR1cm4gcmVzdWx0O1xufTtcblxua28ub2JzZXJ2YWJsZUFycmF5WydmbiddID0ge1xuICAgICdyZW1vdmUnOiBmdW5jdGlvbiAodmFsdWVPclByZWRpY2F0ZSkge1xuICAgICAgICB2YXIgdW5kZXJseWluZ0FycmF5ID0gdGhpcy5wZWVrKCk7XG4gICAgICAgIHZhciByZW1vdmVkVmFsdWVzID0gW107XG4gICAgICAgIHZhciBwcmVkaWNhdGUgPSB0eXBlb2YgdmFsdWVPclByZWRpY2F0ZSA9PSBcImZ1bmN0aW9uXCIgPyB2YWx1ZU9yUHJlZGljYXRlIDogZnVuY3Rpb24gKHZhbHVlKSB7IHJldHVybiB2YWx1ZSA9PT0gdmFsdWVPclByZWRpY2F0ZTsgfTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB1bmRlcmx5aW5nQXJyYXkubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IHVuZGVybHlpbmdBcnJheVtpXTtcbiAgICAgICAgICAgIGlmIChwcmVkaWNhdGUodmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgaWYgKHJlbW92ZWRWYWx1ZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudmFsdWVXaWxsTXV0YXRlKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJlbW92ZWRWYWx1ZXMucHVzaCh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgdW5kZXJseWluZ0FycmF5LnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgICAgICBpLS07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJlbW92ZWRWYWx1ZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICB0aGlzLnZhbHVlSGFzTXV0YXRlZCgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZW1vdmVkVmFsdWVzO1xuICAgIH0sXG5cbiAgICAncmVtb3ZlQWxsJzogZnVuY3Rpb24gKGFycmF5T2ZWYWx1ZXMpIHtcbiAgICAgICAgLy8gSWYgeW91IHBhc3NlZCB6ZXJvIGFyZ3MsIHdlIHJlbW92ZSBldmVyeXRoaW5nXG4gICAgICAgIGlmIChhcnJheU9mVmFsdWVzID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHZhciB1bmRlcmx5aW5nQXJyYXkgPSB0aGlzLnBlZWsoKTtcbiAgICAgICAgICAgIHZhciBhbGxWYWx1ZXMgPSB1bmRlcmx5aW5nQXJyYXkuc2xpY2UoMCk7XG4gICAgICAgICAgICB0aGlzLnZhbHVlV2lsbE11dGF0ZSgpO1xuICAgICAgICAgICAgdW5kZXJseWluZ0FycmF5LnNwbGljZSgwLCB1bmRlcmx5aW5nQXJyYXkubGVuZ3RoKTtcbiAgICAgICAgICAgIHRoaXMudmFsdWVIYXNNdXRhdGVkKCk7XG4gICAgICAgICAgICByZXR1cm4gYWxsVmFsdWVzO1xuICAgICAgICB9XG4gICAgICAgIC8vIElmIHlvdSBwYXNzZWQgYW4gYXJnLCB3ZSBpbnRlcnByZXQgaXQgYXMgYW4gYXJyYXkgb2YgZW50cmllcyB0byByZW1vdmVcbiAgICAgICAgaWYgKCFhcnJheU9mVmFsdWVzKVxuICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICByZXR1cm4gdGhpc1sncmVtb3ZlJ10oZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICByZXR1cm4ga28udXRpbHMuYXJyYXlJbmRleE9mKGFycmF5T2ZWYWx1ZXMsIHZhbHVlKSA+PSAwO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgJ2Rlc3Ryb3knOiBmdW5jdGlvbiAodmFsdWVPclByZWRpY2F0ZSkge1xuICAgICAgICB2YXIgdW5kZXJseWluZ0FycmF5ID0gdGhpcy5wZWVrKCk7XG4gICAgICAgIHZhciBwcmVkaWNhdGUgPSB0eXBlb2YgdmFsdWVPclByZWRpY2F0ZSA9PSBcImZ1bmN0aW9uXCIgPyB2YWx1ZU9yUHJlZGljYXRlIDogZnVuY3Rpb24gKHZhbHVlKSB7IHJldHVybiB2YWx1ZSA9PT0gdmFsdWVPclByZWRpY2F0ZTsgfTtcbiAgICAgICAgdGhpcy52YWx1ZVdpbGxNdXRhdGUoKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IHVuZGVybHlpbmdBcnJheS5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICAgICAgdmFyIHZhbHVlID0gdW5kZXJseWluZ0FycmF5W2ldO1xuICAgICAgICAgICAgaWYgKHByZWRpY2F0ZSh2YWx1ZSkpXG4gICAgICAgICAgICAgICAgdW5kZXJseWluZ0FycmF5W2ldW1wiX2Rlc3Ryb3lcIl0gPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMudmFsdWVIYXNNdXRhdGVkKCk7XG4gICAgfSxcblxuICAgICdkZXN0cm95QWxsJzogZnVuY3Rpb24gKGFycmF5T2ZWYWx1ZXMpIHtcbiAgICAgICAgLy8gSWYgeW91IHBhc3NlZCB6ZXJvIGFyZ3MsIHdlIGRlc3Ryb3kgZXZlcnl0aGluZ1xuICAgICAgICBpZiAoYXJyYXlPZlZhbHVlcyA9PT0gdW5kZWZpbmVkKVxuICAgICAgICAgICAgcmV0dXJuIHRoaXNbJ2Rlc3Ryb3knXShmdW5jdGlvbigpIHsgcmV0dXJuIHRydWUgfSk7XG5cbiAgICAgICAgLy8gSWYgeW91IHBhc3NlZCBhbiBhcmcsIHdlIGludGVycHJldCBpdCBhcyBhbiBhcnJheSBvZiBlbnRyaWVzIHRvIGRlc3Ryb3lcbiAgICAgICAgaWYgKCFhcnJheU9mVmFsdWVzKVxuICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICByZXR1cm4gdGhpc1snZGVzdHJveSddKGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgcmV0dXJuIGtvLnV0aWxzLmFycmF5SW5kZXhPZihhcnJheU9mVmFsdWVzLCB2YWx1ZSkgPj0gMDtcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgICdpbmRleE9mJzogZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgdmFyIHVuZGVybHlpbmdBcnJheSA9IHRoaXMoKTtcbiAgICAgICAgcmV0dXJuIGtvLnV0aWxzLmFycmF5SW5kZXhPZih1bmRlcmx5aW5nQXJyYXksIGl0ZW0pO1xuICAgIH0sXG5cbiAgICAncmVwbGFjZSc6IGZ1bmN0aW9uKG9sZEl0ZW0sIG5ld0l0ZW0pIHtcbiAgICAgICAgdmFyIGluZGV4ID0gdGhpc1snaW5kZXhPZiddKG9sZEl0ZW0pO1xuICAgICAgICBpZiAoaW5kZXggPj0gMCkge1xuICAgICAgICAgICAgdGhpcy52YWx1ZVdpbGxNdXRhdGUoKTtcbiAgICAgICAgICAgIHRoaXMucGVlaygpW2luZGV4XSA9IG5ld0l0ZW07XG4gICAgICAgICAgICB0aGlzLnZhbHVlSGFzTXV0YXRlZCgpO1xuICAgICAgICB9XG4gICAgfVxufTtcblxuLy8gUG9wdWxhdGUga28ub2JzZXJ2YWJsZUFycmF5LmZuIHdpdGggcmVhZC93cml0ZSBmdW5jdGlvbnMgZnJvbSBuYXRpdmUgYXJyYXlzXG4vLyBJbXBvcnRhbnQ6IERvIG5vdCBhZGQgYW55IGFkZGl0aW9uYWwgZnVuY3Rpb25zIGhlcmUgdGhhdCBtYXkgcmVhc29uYWJseSBiZSB1c2VkIHRvICpyZWFkKiBkYXRhIGZyb20gdGhlIGFycmF5XG4vLyBiZWNhdXNlIHdlJ2xsIGV2YWwgdGhlbSB3aXRob3V0IGNhdXNpbmcgc3Vic2NyaXB0aW9ucywgc28ga28uY29tcHV0ZWQgb3V0cHV0IGNvdWxkIGVuZCB1cCBnZXR0aW5nIHN0YWxlXG5rby51dGlscy5hcnJheUZvckVhY2goW1wicG9wXCIsIFwicHVzaFwiLCBcInJldmVyc2VcIiwgXCJzaGlmdFwiLCBcInNvcnRcIiwgXCJzcGxpY2VcIiwgXCJ1bnNoaWZ0XCJdLCBmdW5jdGlvbiAobWV0aG9kTmFtZSkge1xuICAgIGtvLm9ic2VydmFibGVBcnJheVsnZm4nXVttZXRob2ROYW1lXSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgLy8gVXNlIFwicGVla1wiIHRvIGF2b2lkIGNyZWF0aW5nIGEgc3Vic2NyaXB0aW9uIGluIGFueSBjb21wdXRlZCB0aGF0IHdlJ3JlIGV4ZWN1dGluZyBpbiB0aGUgY29udGV4dCBvZlxuICAgICAgICAvLyAoZm9yIGNvbnNpc3RlbmN5IHdpdGggbXV0YXRpbmcgcmVndWxhciBvYnNlcnZhYmxlcylcbiAgICAgICAgdmFyIHVuZGVybHlpbmdBcnJheSA9IHRoaXMucGVlaygpO1xuICAgICAgICB0aGlzLnZhbHVlV2lsbE11dGF0ZSgpO1xuICAgICAgICB2YXIgbWV0aG9kQ2FsbFJlc3VsdCA9IHVuZGVybHlpbmdBcnJheVttZXRob2ROYW1lXS5hcHBseSh1bmRlcmx5aW5nQXJyYXksIGFyZ3VtZW50cyk7XG4gICAgICAgIHRoaXMudmFsdWVIYXNNdXRhdGVkKCk7XG4gICAgICAgIHJldHVybiBtZXRob2RDYWxsUmVzdWx0O1xuICAgIH07XG59KTtcblxuLy8gUG9wdWxhdGUga28ub2JzZXJ2YWJsZUFycmF5LmZuIHdpdGggcmVhZC1vbmx5IGZ1bmN0aW9ucyBmcm9tIG5hdGl2ZSBhcnJheXNcbmtvLnV0aWxzLmFycmF5Rm9yRWFjaChbXCJzbGljZVwiXSwgZnVuY3Rpb24gKG1ldGhvZE5hbWUpIHtcbiAgICBrby5vYnNlcnZhYmxlQXJyYXlbJ2ZuJ11bbWV0aG9kTmFtZV0gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciB1bmRlcmx5aW5nQXJyYXkgPSB0aGlzKCk7XG4gICAgICAgIHJldHVybiB1bmRlcmx5aW5nQXJyYXlbbWV0aG9kTmFtZV0uYXBwbHkodW5kZXJseWluZ0FycmF5LCBhcmd1bWVudHMpO1xuICAgIH07XG59KTtcblxua28uZXhwb3J0U3ltYm9sKCdvYnNlcnZhYmxlQXJyYXknLCBrby5vYnNlcnZhYmxlQXJyYXkpO1xua28uZGVwZW5kZW50T2JzZXJ2YWJsZSA9IGZ1bmN0aW9uIChldmFsdWF0b3JGdW5jdGlvbk9yT3B0aW9ucywgZXZhbHVhdG9yRnVuY3Rpb25UYXJnZXQsIG9wdGlvbnMpIHtcbiAgICB2YXIgX2xhdGVzdFZhbHVlLFxuICAgICAgICBfaGFzQmVlbkV2YWx1YXRlZCA9IGZhbHNlLFxuICAgICAgICBfaXNCZWluZ0V2YWx1YXRlZCA9IGZhbHNlLFxuICAgICAgICByZWFkRnVuY3Rpb24gPSBldmFsdWF0b3JGdW5jdGlvbk9yT3B0aW9ucztcblxuICAgIGlmIChyZWFkRnVuY3Rpb24gJiYgdHlwZW9mIHJlYWRGdW5jdGlvbiA9PSBcIm9iamVjdFwiKSB7XG4gICAgICAgIC8vIFNpbmdsZS1wYXJhbWV0ZXIgc3ludGF4IC0gZXZlcnl0aGluZyBpcyBvbiB0aGlzIFwib3B0aW9uc1wiIHBhcmFtXG4gICAgICAgIG9wdGlvbnMgPSByZWFkRnVuY3Rpb247XG4gICAgICAgIHJlYWRGdW5jdGlvbiA9IG9wdGlvbnNbXCJyZWFkXCJdO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIE11bHRpLXBhcmFtZXRlciBzeW50YXggLSBjb25zdHJ1Y3QgdGhlIG9wdGlvbnMgYWNjb3JkaW5nIHRvIHRoZSBwYXJhbXMgcGFzc2VkXG4gICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgICAgICBpZiAoIXJlYWRGdW5jdGlvbilcbiAgICAgICAgICAgIHJlYWRGdW5jdGlvbiA9IG9wdGlvbnNbXCJyZWFkXCJdO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIHJlYWRGdW5jdGlvbiAhPSBcImZ1bmN0aW9uXCIpXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlBhc3MgYSBmdW5jdGlvbiB0aGF0IHJldHVybnMgdGhlIHZhbHVlIG9mIHRoZSBrby5jb21wdXRlZFwiKTtcblxuICAgIGZ1bmN0aW9uIGFkZFN1YnNjcmlwdGlvblRvRGVwZW5kZW5jeShzdWJzY3JpYmFibGUpIHtcbiAgICAgICAgX3N1YnNjcmlwdGlvbnNUb0RlcGVuZGVuY2llcy5wdXNoKHN1YnNjcmliYWJsZS5zdWJzY3JpYmUoZXZhbHVhdGVQb3NzaWJseUFzeW5jKSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZGlzcG9zZUFsbFN1YnNjcmlwdGlvbnNUb0RlcGVuZGVuY2llcygpIHtcbiAgICAgICAga28udXRpbHMuYXJyYXlGb3JFYWNoKF9zdWJzY3JpcHRpb25zVG9EZXBlbmRlbmNpZXMsIGZ1bmN0aW9uIChzdWJzY3JpcHRpb24pIHtcbiAgICAgICAgICAgIHN1YnNjcmlwdGlvbi5kaXNwb3NlKCk7XG4gICAgICAgIH0pO1xuICAgICAgICBfc3Vic2NyaXB0aW9uc1RvRGVwZW5kZW5jaWVzID0gW107XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZXZhbHVhdGVQb3NzaWJseUFzeW5jKCkge1xuICAgICAgICB2YXIgdGhyb3R0bGVFdmFsdWF0aW9uVGltZW91dCA9IGRlcGVuZGVudE9ic2VydmFibGVbJ3Rocm90dGxlRXZhbHVhdGlvbiddO1xuICAgICAgICBpZiAodGhyb3R0bGVFdmFsdWF0aW9uVGltZW91dCAmJiB0aHJvdHRsZUV2YWx1YXRpb25UaW1lb3V0ID49IDApIHtcbiAgICAgICAgICAgIGNsZWFyVGltZW91dChldmFsdWF0aW9uVGltZW91dEluc3RhbmNlKTtcbiAgICAgICAgICAgIGV2YWx1YXRpb25UaW1lb3V0SW5zdGFuY2UgPSBzZXRUaW1lb3V0KGV2YWx1YXRlSW1tZWRpYXRlLCB0aHJvdHRsZUV2YWx1YXRpb25UaW1lb3V0KTtcbiAgICAgICAgfSBlbHNlXG4gICAgICAgICAgICBldmFsdWF0ZUltbWVkaWF0ZSgpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGV2YWx1YXRlSW1tZWRpYXRlKCkge1xuICAgICAgICBpZiAoX2lzQmVpbmdFdmFsdWF0ZWQpIHtcbiAgICAgICAgICAgIC8vIElmIHRoZSBldmFsdWF0aW9uIG9mIGEga28uY29tcHV0ZWQgY2F1c2VzIHNpZGUgZWZmZWN0cywgaXQncyBwb3NzaWJsZSB0aGF0IGl0IHdpbGwgdHJpZ2dlciBpdHMgb3duIHJlLWV2YWx1YXRpb24uXG4gICAgICAgICAgICAvLyBUaGlzIGlzIG5vdCBkZXNpcmFibGUgKGl0J3MgaGFyZCBmb3IgYSBkZXZlbG9wZXIgdG8gcmVhbGlzZSBhIGNoYWluIG9mIGRlcGVuZGVuY2llcyBtaWdodCBjYXVzZSB0aGlzLCBhbmQgdGhleSBhbG1vc3RcbiAgICAgICAgICAgIC8vIGNlcnRhaW5seSBkaWRuJ3QgaW50ZW5kIGluZmluaXRlIHJlLWV2YWx1YXRpb25zKS4gU28sIGZvciBwcmVkaWN0YWJpbGl0eSwgd2Ugc2ltcGx5IHByZXZlbnQga28uY29tcHV0ZWRzIGZyb20gY2F1c2luZ1xuICAgICAgICAgICAgLy8gdGhlaXIgb3duIHJlLWV2YWx1YXRpb24uIEZ1cnRoZXIgZGlzY3Vzc2lvbiBhdCBodHRwczovL2dpdGh1Yi5jb20vU3RldmVTYW5kZXJzb24va25vY2tvdXQvcHVsbC8zODdcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIERvbid0IGRpc3Bvc2Ugb24gZmlyc3QgZXZhbHVhdGlvbiwgYmVjYXVzZSB0aGUgXCJkaXNwb3NlV2hlblwiIGNhbGxiYWNrIG1pZ2h0XG4gICAgICAgIC8vIGUuZy4sIGRpc3Bvc2Ugd2hlbiB0aGUgYXNzb2NpYXRlZCBET00gZWxlbWVudCBpc24ndCBpbiB0aGUgZG9jLCBhbmQgaXQncyBub3RcbiAgICAgICAgLy8gZ29pbmcgdG8gYmUgaW4gdGhlIGRvYyB1bnRpbCAqYWZ0ZXIqIHRoZSBmaXJzdCBldmFsdWF0aW9uXG4gICAgICAgIGlmIChfaGFzQmVlbkV2YWx1YXRlZCAmJiBkaXNwb3NlV2hlbigpKSB7XG4gICAgICAgICAgICBkaXNwb3NlKCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBfaXNCZWluZ0V2YWx1YXRlZCA9IHRydWU7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBJbml0aWFsbHksIHdlIGFzc3VtZSB0aGF0IG5vbmUgb2YgdGhlIHN1YnNjcmlwdGlvbnMgYXJlIHN0aWxsIGJlaW5nIHVzZWQgKGkuZS4sIGFsbCBhcmUgY2FuZGlkYXRlcyBmb3IgZGlzcG9zYWwpLlxuICAgICAgICAgICAgLy8gVGhlbiwgZHVyaW5nIGV2YWx1YXRpb24sIHdlIGNyb3NzIG9mZiBhbnkgdGhhdCBhcmUgaW4gZmFjdCBzdGlsbCBiZWluZyB1c2VkLlxuICAgICAgICAgICAgdmFyIGRpc3Bvc2FsQ2FuZGlkYXRlcyA9IGtvLnV0aWxzLmFycmF5TWFwKF9zdWJzY3JpcHRpb25zVG9EZXBlbmRlbmNpZXMsIGZ1bmN0aW9uKGl0ZW0pIHtyZXR1cm4gaXRlbS50YXJnZXQ7fSk7XG5cbiAgICAgICAgICAgIGtvLmRlcGVuZGVuY3lEZXRlY3Rpb24uYmVnaW4oZnVuY3Rpb24oc3Vic2NyaWJhYmxlKSB7XG4gICAgICAgICAgICAgICAgdmFyIGluT2xkO1xuICAgICAgICAgICAgICAgIGlmICgoaW5PbGQgPSBrby51dGlscy5hcnJheUluZGV4T2YoZGlzcG9zYWxDYW5kaWRhdGVzLCBzdWJzY3JpYmFibGUpKSA+PSAwKVxuICAgICAgICAgICAgICAgICAgICBkaXNwb3NhbENhbmRpZGF0ZXNbaW5PbGRdID0gdW5kZWZpbmVkOyAvLyBEb24ndCB3YW50IHRvIGRpc3Bvc2UgdGhpcyBzdWJzY3JpcHRpb24sIGFzIGl0J3Mgc3RpbGwgYmVpbmcgdXNlZFxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgYWRkU3Vic2NyaXB0aW9uVG9EZXBlbmRlbmN5KHN1YnNjcmliYWJsZSk7IC8vIEJyYW5kIG5ldyBzdWJzY3JpcHRpb24gLSBhZGQgaXRcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICB2YXIgbmV3VmFsdWUgPSByZWFkRnVuY3Rpb24uY2FsbChldmFsdWF0b3JGdW5jdGlvblRhcmdldCk7XG5cbiAgICAgICAgICAgIC8vIEZvciBlYWNoIHN1YnNjcmlwdGlvbiBubyBsb25nZXIgYmVpbmcgdXNlZCwgcmVtb3ZlIGl0IGZyb20gdGhlIGFjdGl2ZSBzdWJzY3JpcHRpb25zIGxpc3QgYW5kIGRpc3Bvc2UgaXRcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSBkaXNwb3NhbENhbmRpZGF0ZXMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgICAgICBpZiAoZGlzcG9zYWxDYW5kaWRhdGVzW2ldKVxuICAgICAgICAgICAgICAgICAgICBfc3Vic2NyaXB0aW9uc1RvRGVwZW5kZW5jaWVzLnNwbGljZShpLCAxKVswXS5kaXNwb3NlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBfaGFzQmVlbkV2YWx1YXRlZCA9IHRydWU7XG5cbiAgICAgICAgICAgIGRlcGVuZGVudE9ic2VydmFibGVbXCJub3RpZnlTdWJzY3JpYmVyc1wiXShfbGF0ZXN0VmFsdWUsIFwiYmVmb3JlQ2hhbmdlXCIpO1xuXG4gICAgICAgICAgICBfbGF0ZXN0VmFsdWUgPSBuZXdWYWx1ZTtcbiAgICAgICAgICAgIGlmIChERUJVRykgZGVwZW5kZW50T2JzZXJ2YWJsZS5fbGF0ZXN0VmFsdWUgPSBfbGF0ZXN0VmFsdWU7XG4gICAgICAgICAgICBkZXBlbmRlbnRPYnNlcnZhYmxlW1wibm90aWZ5U3Vic2NyaWJlcnNcIl0oX2xhdGVzdFZhbHVlKTtcblxuICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAga28uZGVwZW5kZW5jeURldGVjdGlvbi5lbmQoKTtcbiAgICAgICAgICAgIF9pc0JlaW5nRXZhbHVhdGVkID0gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIV9zdWJzY3JpcHRpb25zVG9EZXBlbmRlbmNpZXMubGVuZ3RoKVxuICAgICAgICAgICAgZGlzcG9zZSgpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGRlcGVuZGVudE9ic2VydmFibGUoKSB7XG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiB3cml0ZUZ1bmN0aW9uID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICAvLyBXcml0aW5nIGEgdmFsdWVcbiAgICAgICAgICAgICAgICB3cml0ZUZ1bmN0aW9uLmFwcGx5KGV2YWx1YXRvckZ1bmN0aW9uVGFyZ2V0LCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3Qgd3JpdGUgYSB2YWx1ZSB0byBhIGtvLmNvbXB1dGVkIHVubGVzcyB5b3Ugc3BlY2lmeSBhICd3cml0ZScgb3B0aW9uLiBJZiB5b3Ugd2lzaCB0byByZWFkIHRoZSBjdXJyZW50IHZhbHVlLCBkb24ndCBwYXNzIGFueSBwYXJhbWV0ZXJzLlwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0aGlzOyAvLyBQZXJtaXRzIGNoYWluZWQgYXNzaWdubWVudHNcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIFJlYWRpbmcgdGhlIHZhbHVlXG4gICAgICAgICAgICBpZiAoIV9oYXNCZWVuRXZhbHVhdGVkKVxuICAgICAgICAgICAgICAgIGV2YWx1YXRlSW1tZWRpYXRlKCk7XG4gICAgICAgICAgICBrby5kZXBlbmRlbmN5RGV0ZWN0aW9uLnJlZ2lzdGVyRGVwZW5kZW5jeShkZXBlbmRlbnRPYnNlcnZhYmxlKTtcbiAgICAgICAgICAgIHJldHVybiBfbGF0ZXN0VmFsdWU7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwZWVrKCkge1xuICAgICAgICBpZiAoIV9oYXNCZWVuRXZhbHVhdGVkKVxuICAgICAgICAgICAgZXZhbHVhdGVJbW1lZGlhdGUoKTtcbiAgICAgICAgcmV0dXJuIF9sYXRlc3RWYWx1ZTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpc0FjdGl2ZSgpIHtcbiAgICAgICAgcmV0dXJuICFfaGFzQmVlbkV2YWx1YXRlZCB8fCBfc3Vic2NyaXB0aW9uc1RvRGVwZW5kZW5jaWVzLmxlbmd0aCA+IDA7XG4gICAgfVxuXG4gICAgLy8gQnkgaGVyZSwgXCJvcHRpb25zXCIgaXMgYWx3YXlzIG5vbi1udWxsXG4gICAgdmFyIHdyaXRlRnVuY3Rpb24gPSBvcHRpb25zW1wid3JpdGVcIl0sXG4gICAgICAgIGRpc3Bvc2VXaGVuTm9kZUlzUmVtb3ZlZCA9IG9wdGlvbnNbXCJkaXNwb3NlV2hlbk5vZGVJc1JlbW92ZWRcIl0gfHwgb3B0aW9ucy5kaXNwb3NlV2hlbk5vZGVJc1JlbW92ZWQgfHwgbnVsbCxcbiAgICAgICAgZGlzcG9zZVdoZW4gPSBvcHRpb25zW1wiZGlzcG9zZVdoZW5cIl0gfHwgb3B0aW9ucy5kaXNwb3NlV2hlbiB8fCBmdW5jdGlvbigpIHsgcmV0dXJuIGZhbHNlOyB9LFxuICAgICAgICBkaXNwb3NlID0gZGlzcG9zZUFsbFN1YnNjcmlwdGlvbnNUb0RlcGVuZGVuY2llcyxcbiAgICAgICAgX3N1YnNjcmlwdGlvbnNUb0RlcGVuZGVuY2llcyA9IFtdLFxuICAgICAgICBldmFsdWF0aW9uVGltZW91dEluc3RhbmNlID0gbnVsbDtcblxuICAgIGlmICghZXZhbHVhdG9yRnVuY3Rpb25UYXJnZXQpXG4gICAgICAgIGV2YWx1YXRvckZ1bmN0aW9uVGFyZ2V0ID0gb3B0aW9uc1tcIm93bmVyXCJdO1xuXG4gICAgZGVwZW5kZW50T2JzZXJ2YWJsZS5wZWVrID0gcGVlaztcbiAgICBkZXBlbmRlbnRPYnNlcnZhYmxlLmdldERlcGVuZGVuY2llc0NvdW50ID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gX3N1YnNjcmlwdGlvbnNUb0RlcGVuZGVuY2llcy5sZW5ndGg7IH07XG4gICAgZGVwZW5kZW50T2JzZXJ2YWJsZS5oYXNXcml0ZUZ1bmN0aW9uID0gdHlwZW9mIG9wdGlvbnNbXCJ3cml0ZVwiXSA9PT0gXCJmdW5jdGlvblwiO1xuICAgIGRlcGVuZGVudE9ic2VydmFibGUuZGlzcG9zZSA9IGZ1bmN0aW9uICgpIHsgZGlzcG9zZSgpOyB9O1xuICAgIGRlcGVuZGVudE9ic2VydmFibGUuaXNBY3RpdmUgPSBpc0FjdGl2ZTtcblxuICAgIGtvLnN1YnNjcmliYWJsZS5jYWxsKGRlcGVuZGVudE9ic2VydmFibGUpO1xuICAgIGtvLnV0aWxzLmV4dGVuZChkZXBlbmRlbnRPYnNlcnZhYmxlLCBrby5kZXBlbmRlbnRPYnNlcnZhYmxlWydmbiddKTtcblxuICAgIGtvLmV4cG9ydFByb3BlcnR5KGRlcGVuZGVudE9ic2VydmFibGUsICdwZWVrJywgZGVwZW5kZW50T2JzZXJ2YWJsZS5wZWVrKTtcbiAgICBrby5leHBvcnRQcm9wZXJ0eShkZXBlbmRlbnRPYnNlcnZhYmxlLCAnZGlzcG9zZScsIGRlcGVuZGVudE9ic2VydmFibGUuZGlzcG9zZSk7XG4gICAga28uZXhwb3J0UHJvcGVydHkoZGVwZW5kZW50T2JzZXJ2YWJsZSwgJ2lzQWN0aXZlJywgZGVwZW5kZW50T2JzZXJ2YWJsZS5pc0FjdGl2ZSk7XG4gICAga28uZXhwb3J0UHJvcGVydHkoZGVwZW5kZW50T2JzZXJ2YWJsZSwgJ2dldERlcGVuZGVuY2llc0NvdW50JywgZGVwZW5kZW50T2JzZXJ2YWJsZS5nZXREZXBlbmRlbmNpZXNDb3VudCk7XG5cbiAgICAvLyBFdmFsdWF0ZSwgdW5sZXNzIGRlZmVyRXZhbHVhdGlvbiBpcyB0cnVlXG4gICAgaWYgKG9wdGlvbnNbJ2RlZmVyRXZhbHVhdGlvbiddICE9PSB0cnVlKVxuICAgICAgICBldmFsdWF0ZUltbWVkaWF0ZSgpO1xuXG4gICAgLy8gQnVpbGQgXCJkaXNwb3NlV2hlbk5vZGVJc1JlbW92ZWRcIiBhbmQgXCJkaXNwb3NlV2hlbk5vZGVJc1JlbW92ZWRDYWxsYmFja1wiIG9wdGlvbiB2YWx1ZXMuXG4gICAgLy8gQnV0IHNraXAgaWYgaXNBY3RpdmUgaXMgZmFsc2UgKHRoZXJlIHdpbGwgbmV2ZXIgYmUgYW55IGRlcGVuZGVuY2llcyB0byBkaXNwb3NlKS5cbiAgICAvLyAoTm90ZTogXCJkaXNwb3NlV2hlbk5vZGVJc1JlbW92ZWRcIiBvcHRpb24gYm90aCBwcm9hY3RpdmVseSBkaXNwb3NlcyBhcyBzb29uIGFzIHRoZSBub2RlIGlzIHJlbW92ZWQgdXNpbmcga28ucmVtb3ZlTm9kZSgpLFxuICAgIC8vIHBsdXMgYWRkcyBhIFwiZGlzcG9zZVdoZW5cIiBjYWxsYmFjayB0aGF0LCBvbiBlYWNoIGV2YWx1YXRpb24sIGRpc3Bvc2VzIGlmIHRoZSBub2RlIHdhcyByZW1vdmVkIGJ5IHNvbWUgb3RoZXIgbWVhbnMuKVxuICAgIGlmIChkaXNwb3NlV2hlbk5vZGVJc1JlbW92ZWQgJiYgaXNBY3RpdmUoKSkge1xuICAgICAgICBkaXNwb3NlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBrby51dGlscy5kb21Ob2RlRGlzcG9zYWwucmVtb3ZlRGlzcG9zZUNhbGxiYWNrKGRpc3Bvc2VXaGVuTm9kZUlzUmVtb3ZlZCwgZGlzcG9zZSk7XG4gICAgICAgICAgICBkaXNwb3NlQWxsU3Vic2NyaXB0aW9uc1RvRGVwZW5kZW5jaWVzKCk7XG4gICAgICAgIH07XG4gICAgICAgIGtvLnV0aWxzLmRvbU5vZGVEaXNwb3NhbC5hZGREaXNwb3NlQ2FsbGJhY2soZGlzcG9zZVdoZW5Ob2RlSXNSZW1vdmVkLCBkaXNwb3NlKTtcbiAgICAgICAgdmFyIGV4aXN0aW5nRGlzcG9zZVdoZW5GdW5jdGlvbiA9IGRpc3Bvc2VXaGVuO1xuICAgICAgICBkaXNwb3NlV2hlbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAha28udXRpbHMuZG9tTm9kZUlzQXR0YWNoZWRUb0RvY3VtZW50KGRpc3Bvc2VXaGVuTm9kZUlzUmVtb3ZlZCkgfHwgZXhpc3RpbmdEaXNwb3NlV2hlbkZ1bmN0aW9uKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZGVwZW5kZW50T2JzZXJ2YWJsZTtcbn07XG5cbmtvLmlzQ29tcHV0ZWQgPSBmdW5jdGlvbihpbnN0YW5jZSkge1xuICAgIHJldHVybiBrby5oYXNQcm90b3R5cGUoaW5zdGFuY2UsIGtvLmRlcGVuZGVudE9ic2VydmFibGUpO1xufTtcblxudmFyIHByb3RvUHJvcCA9IGtvLm9ic2VydmFibGUucHJvdG9Qcm9wZXJ0eTsgLy8gPT0gXCJfX2tvX3Byb3RvX19cIlxua28uZGVwZW5kZW50T2JzZXJ2YWJsZVtwcm90b1Byb3BdID0ga28ub2JzZXJ2YWJsZTtcblxua28uZGVwZW5kZW50T2JzZXJ2YWJsZVsnZm4nXSA9IHt9O1xua28uZGVwZW5kZW50T2JzZXJ2YWJsZVsnZm4nXVtwcm90b1Byb3BdID0ga28uZGVwZW5kZW50T2JzZXJ2YWJsZTtcblxua28uZXhwb3J0U3ltYm9sKCdkZXBlbmRlbnRPYnNlcnZhYmxlJywga28uZGVwZW5kZW50T2JzZXJ2YWJsZSk7XG5rby5leHBvcnRTeW1ib2woJ2NvbXB1dGVkJywga28uZGVwZW5kZW50T2JzZXJ2YWJsZSk7IC8vIE1ha2UgXCJrby5jb21wdXRlZFwiIGFuIGFsaWFzIGZvciBcImtvLmRlcGVuZGVudE9ic2VydmFibGVcIlxua28uZXhwb3J0U3ltYm9sKCdpc0NvbXB1dGVkJywga28uaXNDb21wdXRlZCk7XG5cbihmdW5jdGlvbigpIHtcbiAgICB2YXIgbWF4TmVzdGVkT2JzZXJ2YWJsZURlcHRoID0gMTA7IC8vIEVzY2FwZSB0aGUgKHVubGlrZWx5KSBwYXRoYWxvZ2ljYWwgY2FzZSB3aGVyZSBhbiBvYnNlcnZhYmxlJ3MgY3VycmVudCB2YWx1ZSBpcyBpdHNlbGYgKG9yIHNpbWlsYXIgcmVmZXJlbmNlIGN5Y2xlKVxuXG4gICAga28udG9KUyA9IGZ1bmN0aW9uKHJvb3RPYmplY3QpIHtcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT0gMClcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIldoZW4gY2FsbGluZyBrby50b0pTLCBwYXNzIHRoZSBvYmplY3QgeW91IHdhbnQgdG8gY29udmVydC5cIik7XG5cbiAgICAgICAgLy8gV2UganVzdCB1bndyYXAgZXZlcnl0aGluZyBhdCBldmVyeSBsZXZlbCBpbiB0aGUgb2JqZWN0IGdyYXBoXG4gICAgICAgIHJldHVybiBtYXBKc09iamVjdEdyYXBoKHJvb3RPYmplY3QsIGZ1bmN0aW9uKHZhbHVlVG9NYXApIHtcbiAgICAgICAgICAgIC8vIExvb3AgYmVjYXVzZSBhbiBvYnNlcnZhYmxlJ3MgdmFsdWUgbWlnaHQgaW4gdHVybiBiZSBhbm90aGVyIG9ic2VydmFibGUgd3JhcHBlclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGtvLmlzT2JzZXJ2YWJsZSh2YWx1ZVRvTWFwKSAmJiAoaSA8IG1heE5lc3RlZE9ic2VydmFibGVEZXB0aCk7IGkrKylcbiAgICAgICAgICAgICAgICB2YWx1ZVRvTWFwID0gdmFsdWVUb01hcCgpO1xuICAgICAgICAgICAgcmV0dXJuIHZhbHVlVG9NYXA7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBrby50b0pTT04gPSBmdW5jdGlvbihyb290T2JqZWN0LCByZXBsYWNlciwgc3BhY2UpIHsgICAgIC8vIHJlcGxhY2VyIGFuZCBzcGFjZSBhcmUgb3B0aW9uYWxcbiAgICAgICAgdmFyIHBsYWluSmF2YVNjcmlwdE9iamVjdCA9IGtvLnRvSlMocm9vdE9iamVjdCk7XG4gICAgICAgIHJldHVybiBrby51dGlscy5zdHJpbmdpZnlKc29uKHBsYWluSmF2YVNjcmlwdE9iamVjdCwgcmVwbGFjZXIsIHNwYWNlKTtcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gbWFwSnNPYmplY3RHcmFwaChyb290T2JqZWN0LCBtYXBJbnB1dENhbGxiYWNrLCB2aXNpdGVkT2JqZWN0cykge1xuICAgICAgICB2aXNpdGVkT2JqZWN0cyA9IHZpc2l0ZWRPYmplY3RzIHx8IG5ldyBvYmplY3RMb29rdXAoKTtcblxuICAgICAgICByb290T2JqZWN0ID0gbWFwSW5wdXRDYWxsYmFjayhyb290T2JqZWN0KTtcbiAgICAgICAgdmFyIGNhbkhhdmVQcm9wZXJ0aWVzID0gKHR5cGVvZiByb290T2JqZWN0ID09IFwib2JqZWN0XCIpICYmIChyb290T2JqZWN0ICE9PSBudWxsKSAmJiAocm9vdE9iamVjdCAhPT0gdW5kZWZpbmVkKSAmJiAoIShyb290T2JqZWN0IGluc3RhbmNlb2YgRGF0ZSkpICYmICghKHJvb3RPYmplY3QgaW5zdGFuY2VvZiBTdHJpbmcpKSAmJiAoIShyb290T2JqZWN0IGluc3RhbmNlb2YgTnVtYmVyKSkgJiYgKCEocm9vdE9iamVjdCBpbnN0YW5jZW9mIEJvb2xlYW4pKTtcbiAgICAgICAgaWYgKCFjYW5IYXZlUHJvcGVydGllcylcbiAgICAgICAgICAgIHJldHVybiByb290T2JqZWN0O1xuXG4gICAgICAgIHZhciBvdXRwdXRQcm9wZXJ0aWVzID0gcm9vdE9iamVjdCBpbnN0YW5jZW9mIEFycmF5ID8gW10gOiB7fTtcbiAgICAgICAgdmlzaXRlZE9iamVjdHMuc2F2ZShyb290T2JqZWN0LCBvdXRwdXRQcm9wZXJ0aWVzKTtcblxuICAgICAgICB2aXNpdFByb3BlcnRpZXNPckFycmF5RW50cmllcyhyb290T2JqZWN0LCBmdW5jdGlvbihpbmRleGVyKSB7XG4gICAgICAgICAgICB2YXIgcHJvcGVydHlWYWx1ZSA9IG1hcElucHV0Q2FsbGJhY2socm9vdE9iamVjdFtpbmRleGVyXSk7XG5cbiAgICAgICAgICAgIHN3aXRjaCAodHlwZW9mIHByb3BlcnR5VmFsdWUpIHtcbiAgICAgICAgICAgICAgICBjYXNlIFwiYm9vbGVhblwiOlxuICAgICAgICAgICAgICAgIGNhc2UgXCJudW1iZXJcIjpcbiAgICAgICAgICAgICAgICBjYXNlIFwic3RyaW5nXCI6XG4gICAgICAgICAgICAgICAgY2FzZSBcImZ1bmN0aW9uXCI6XG4gICAgICAgICAgICAgICAgICAgIG91dHB1dFByb3BlcnRpZXNbaW5kZXhlcl0gPSBwcm9wZXJ0eVZhbHVlO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIFwib2JqZWN0XCI6XG4gICAgICAgICAgICAgICAgY2FzZSBcInVuZGVmaW5lZFwiOlxuICAgICAgICAgICAgICAgICAgICB2YXIgcHJldmlvdXNseU1hcHBlZFZhbHVlID0gdmlzaXRlZE9iamVjdHMuZ2V0KHByb3BlcnR5VmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICBvdXRwdXRQcm9wZXJ0aWVzW2luZGV4ZXJdID0gKHByZXZpb3VzbHlNYXBwZWRWYWx1ZSAhPT0gdW5kZWZpbmVkKVxuICAgICAgICAgICAgICAgICAgICAgICAgPyBwcmV2aW91c2x5TWFwcGVkVmFsdWVcbiAgICAgICAgICAgICAgICAgICAgICAgIDogbWFwSnNPYmplY3RHcmFwaChwcm9wZXJ0eVZhbHVlLCBtYXBJbnB1dENhbGxiYWNrLCB2aXNpdGVkT2JqZWN0cyk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gb3V0cHV0UHJvcGVydGllcztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB2aXNpdFByb3BlcnRpZXNPckFycmF5RW50cmllcyhyb290T2JqZWN0LCB2aXNpdG9yQ2FsbGJhY2spIHtcbiAgICAgICAgaWYgKHJvb3RPYmplY3QgaW5zdGFuY2VvZiBBcnJheSkge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCByb290T2JqZWN0Lmxlbmd0aDsgaSsrKVxuICAgICAgICAgICAgICAgIHZpc2l0b3JDYWxsYmFjayhpKTtcblxuICAgICAgICAgICAgLy8gRm9yIGFycmF5cywgYWxzbyByZXNwZWN0IHRvSlNPTiBwcm9wZXJ0eSBmb3IgY3VzdG9tIG1hcHBpbmdzIChmaXhlcyAjMjc4KVxuICAgICAgICAgICAgaWYgKHR5cGVvZiByb290T2JqZWN0Wyd0b0pTT04nXSA9PSAnZnVuY3Rpb24nKVxuICAgICAgICAgICAgICAgIHZpc2l0b3JDYWxsYmFjaygndG9KU09OJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBmb3IgKHZhciBwcm9wZXJ0eU5hbWUgaW4gcm9vdE9iamVjdCkge1xuICAgICAgICAgICAgICAgIHZpc2l0b3JDYWxsYmFjayhwcm9wZXJ0eU5hbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIG9iamVjdExvb2t1cCgpIHtcbiAgICAgICAgdGhpcy5rZXlzID0gW107XG4gICAgICAgIHRoaXMudmFsdWVzID0gW107XG4gICAgfTtcblxuICAgIG9iamVjdExvb2t1cC5wcm90b3R5cGUgPSB7XG4gICAgICAgIGNvbnN0cnVjdG9yOiBvYmplY3RMb29rdXAsXG4gICAgICAgIHNhdmU6IGZ1bmN0aW9uKGtleSwgdmFsdWUpIHtcbiAgICAgICAgICAgIHZhciBleGlzdGluZ0luZGV4ID0ga28udXRpbHMuYXJyYXlJbmRleE9mKHRoaXMua2V5cywga2V5KTtcbiAgICAgICAgICAgIGlmIChleGlzdGluZ0luZGV4ID49IDApXG4gICAgICAgICAgICAgICAgdGhpcy52YWx1ZXNbZXhpc3RpbmdJbmRleF0gPSB2YWx1ZTtcbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMua2V5cy5wdXNoKGtleSk7XG4gICAgICAgICAgICAgICAgdGhpcy52YWx1ZXMucHVzaCh2YWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIGdldDogZnVuY3Rpb24oa2V5KSB7XG4gICAgICAgICAgICB2YXIgZXhpc3RpbmdJbmRleCA9IGtvLnV0aWxzLmFycmF5SW5kZXhPZih0aGlzLmtleXMsIGtleSk7XG4gICAgICAgICAgICByZXR1cm4gKGV4aXN0aW5nSW5kZXggPj0gMCkgPyB0aGlzLnZhbHVlc1tleGlzdGluZ0luZGV4XSA6IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgIH07XG59KSgpO1xuXG5rby5leHBvcnRTeW1ib2woJ3RvSlMnLCBrby50b0pTKTtcbmtvLmV4cG9ydFN5bWJvbCgndG9KU09OJywga28udG9KU09OKTtcbihmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGhhc0RvbURhdGFFeHBhbmRvUHJvcGVydHkgPSAnX19rb19faGFzRG9tRGF0YU9wdGlvblZhbHVlX18nO1xuXG4gICAgLy8gTm9ybWFsbHksIFNFTEVDVCBlbGVtZW50cyBhbmQgdGhlaXIgT1BUSU9OcyBjYW4gb25seSB0YWtlIHZhbHVlIG9mIHR5cGUgJ3N0cmluZycgKGJlY2F1c2UgdGhlIHZhbHVlc1xuICAgIC8vIGFyZSBzdG9yZWQgb24gRE9NIGF0dHJpYnV0ZXMpLiBrby5zZWxlY3RFeHRlbnNpb25zIHByb3ZpZGVzIGEgd2F5IGZvciBTRUxFQ1RzL09QVElPTnMgdG8gaGF2ZSB2YWx1ZXNcbiAgICAvLyB0aGF0IGFyZSBhcmJpdHJhcnkgb2JqZWN0cy4gVGhpcyBpcyB2ZXJ5IGNvbnZlbmllbnQgd2hlbiBpbXBsZW1lbnRpbmcgdGhpbmdzIGxpa2UgY2FzY2FkaW5nIGRyb3Bkb3ducy5cbiAgICBrby5zZWxlY3RFeHRlbnNpb25zID0ge1xuICAgICAgICByZWFkVmFsdWUgOiBmdW5jdGlvbihlbGVtZW50KSB7XG4gICAgICAgICAgICBzd2l0Y2ggKGtvLnV0aWxzLnRhZ05hbWVMb3dlcihlbGVtZW50KSkge1xuICAgICAgICAgICAgICAgIGNhc2UgJ29wdGlvbic6XG4gICAgICAgICAgICAgICAgICAgIGlmIChlbGVtZW50W2hhc0RvbURhdGFFeHBhbmRvUHJvcGVydHldID09PSB0cnVlKVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGtvLnV0aWxzLmRvbURhdGEuZ2V0KGVsZW1lbnQsIGtvLmJpbmRpbmdIYW5kbGVycy5vcHRpb25zLm9wdGlvblZhbHVlRG9tRGF0YUtleSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBrby51dGlscy5pZVZlcnNpb24gPD0gN1xuICAgICAgICAgICAgICAgICAgICAgICAgPyAoZWxlbWVudC5nZXRBdHRyaWJ1dGVOb2RlKCd2YWx1ZScpICYmIGVsZW1lbnQuZ2V0QXR0cmlidXRlTm9kZSgndmFsdWUnKS5zcGVjaWZpZWQgPyBlbGVtZW50LnZhbHVlIDogZWxlbWVudC50ZXh0KVxuICAgICAgICAgICAgICAgICAgICAgICAgOiBlbGVtZW50LnZhbHVlO1xuICAgICAgICAgICAgICAgIGNhc2UgJ3NlbGVjdCc6XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBlbGVtZW50LnNlbGVjdGVkSW5kZXggPj0gMCA/IGtvLnNlbGVjdEV4dGVuc2lvbnMucmVhZFZhbHVlKGVsZW1lbnQub3B0aW9uc1tlbGVtZW50LnNlbGVjdGVkSW5kZXhdKSA6IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZWxlbWVudC52YWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICB3cml0ZVZhbHVlOiBmdW5jdGlvbihlbGVtZW50LCB2YWx1ZSkge1xuICAgICAgICAgICAgc3dpdGNoIChrby51dGlscy50YWdOYW1lTG93ZXIoZWxlbWVudCkpIHtcbiAgICAgICAgICAgICAgICBjYXNlICdvcHRpb24nOlxuICAgICAgICAgICAgICAgICAgICBzd2l0Y2godHlwZW9mIHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwic3RyaW5nXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAga28udXRpbHMuZG9tRGF0YS5zZXQoZWxlbWVudCwga28uYmluZGluZ0hhbmRsZXJzLm9wdGlvbnMub3B0aW9uVmFsdWVEb21EYXRhS2V5LCB1bmRlZmluZWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChoYXNEb21EYXRhRXhwYW5kb1Byb3BlcnR5IGluIGVsZW1lbnQpIHsgLy8gSUUgPD0gOCB0aHJvd3MgZXJyb3JzIGlmIHlvdSBkZWxldGUgbm9uLWV4aXN0ZW50IHByb3BlcnRpZXMgZnJvbSBhIERPTSBub2RlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBlbGVtZW50W2hhc0RvbURhdGFFeHBhbmRvUHJvcGVydHldO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50LnZhbHVlID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFN0b3JlIGFyYml0cmFyeSBvYmplY3QgdXNpbmcgRG9tRGF0YVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtvLnV0aWxzLmRvbURhdGEuc2V0KGVsZW1lbnQsIGtvLmJpbmRpbmdIYW5kbGVycy5vcHRpb25zLm9wdGlvblZhbHVlRG9tRGF0YUtleSwgdmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnRbaGFzRG9tRGF0YUV4cGFuZG9Qcm9wZXJ0eV0gPSB0cnVlO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gU3BlY2lhbCB0cmVhdG1lbnQgb2YgbnVtYmVycyBpcyBqdXN0IGZvciBiYWNrd2FyZCBjb21wYXRpYmlsaXR5LiBLTyAxLjIuMSB3cm90ZSBudW1lcmljYWwgdmFsdWVzIHRvIGVsZW1lbnQudmFsdWUuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudC52YWx1ZSA9IHR5cGVvZiB2YWx1ZSA9PT0gXCJudW1iZXJcIiA/IHZhbHVlIDogXCJcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlICdzZWxlY3QnOlxuICAgICAgICAgICAgICAgICAgICBpZiAodmFsdWUgPT09IFwiXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSB1bmRlZmluZWQpXG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50LnNlbGVjdGVkSW5kZXggPSAtMTtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IGVsZW1lbnQub3B0aW9ucy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGtvLnNlbGVjdEV4dGVuc2lvbnMucmVhZFZhbHVlKGVsZW1lbnQub3B0aW9uc1tpXSkgPT0gdmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50LnNlbGVjdGVkSW5kZXggPSBpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIC8vIGZvciBkcm9wLWRvd24gc2VsZWN0LCBlbnN1cmUgZmlyc3QgaXMgc2VsZWN0ZWRcbiAgICAgICAgICAgICAgICAgICAgaWYgKCEoZWxlbWVudC5zaXplID4gMSkgJiYgZWxlbWVudC5zZWxlY3RlZEluZGV4ID09PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5zZWxlY3RlZEluZGV4ID0gMDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICBpZiAoKHZhbHVlID09PSBudWxsKSB8fCAodmFsdWUgPT09IHVuZGVmaW5lZCkpXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IFwiXCI7XG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnQudmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xufSkoKTtcblxua28uZXhwb3J0U3ltYm9sKCdzZWxlY3RFeHRlbnNpb25zJywga28uc2VsZWN0RXh0ZW5zaW9ucyk7XG5rby5leHBvcnRTeW1ib2woJ3NlbGVjdEV4dGVuc2lvbnMucmVhZFZhbHVlJywga28uc2VsZWN0RXh0ZW5zaW9ucy5yZWFkVmFsdWUpO1xua28uZXhwb3J0U3ltYm9sKCdzZWxlY3RFeHRlbnNpb25zLndyaXRlVmFsdWUnLCBrby5zZWxlY3RFeHRlbnNpb25zLndyaXRlVmFsdWUpO1xua28uZXhwcmVzc2lvblJld3JpdGluZyA9IChmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHJlc3RvcmVDYXB0dXJlZFRva2Vuc1JlZ2V4ID0gL1xcQGtvX3Rva2VuXyhcXGQrKVxcQC9nO1xuICAgIHZhciBqYXZhU2NyaXB0UmVzZXJ2ZWRXb3JkcyA9IFtcInRydWVcIiwgXCJmYWxzZVwiLCBcIm51bGxcIiwgXCJ1bmRlZmluZWRcIl07XG5cbiAgICAvLyBNYXRjaGVzIHNvbWV0aGluZyB0aGF0IGNhbiBiZSBhc3NpZ25lZCB0by0tZWl0aGVyIGFuIGlzb2xhdGVkIGlkZW50aWZpZXIgb3Igc29tZXRoaW5nIGVuZGluZyB3aXRoIGEgcHJvcGVydHkgYWNjZXNzb3JcbiAgICAvLyBUaGlzIGlzIGRlc2lnbmVkIHRvIGJlIHNpbXBsZSBhbmQgYXZvaWQgZmFsc2UgbmVnYXRpdmVzLCBidXQgY291bGQgcHJvZHVjZSBmYWxzZSBwb3NpdGl2ZXMgKGUuZy4sIGErYi5jKS5cbiAgICB2YXIgamF2YVNjcmlwdEFzc2lnbm1lbnRUYXJnZXQgPSAvXig/OlskX2Etel1bJFxcd10qfCguKykoXFwuXFxzKlskX2Etel1bJFxcd10qfFxcWy4rXFxdKSkkL2k7XG5cbiAgICBmdW5jdGlvbiByZXN0b3JlVG9rZW5zKHN0cmluZywgdG9rZW5zKSB7XG4gICAgICAgIHZhciBwcmV2VmFsdWUgPSBudWxsO1xuICAgICAgICB3aGlsZSAoc3RyaW5nICE9IHByZXZWYWx1ZSkgeyAvLyBLZWVwIHJlc3RvcmluZyB0b2tlbnMgdW50aWwgaXQgbm8gbG9uZ2VyIG1ha2VzIGEgZGlmZmVyZW5jZSAodGhleSBtYXkgYmUgbmVzdGVkKVxuICAgICAgICAgICAgcHJldlZhbHVlID0gc3RyaW5nO1xuICAgICAgICAgICAgc3RyaW5nID0gc3RyaW5nLnJlcGxhY2UocmVzdG9yZUNhcHR1cmVkVG9rZW5zUmVnZXgsIGZ1bmN0aW9uIChtYXRjaCwgdG9rZW5JbmRleCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0b2tlbnNbdG9rZW5JbmRleF07XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc3RyaW5nO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldFdyaXRlYWJsZVZhbHVlKGV4cHJlc3Npb24pIHtcbiAgICAgICAgaWYgKGtvLnV0aWxzLmFycmF5SW5kZXhPZihqYXZhU2NyaXB0UmVzZXJ2ZWRXb3Jkcywga28udXRpbHMuc3RyaW5nVHJpbShleHByZXNzaW9uKS50b0xvd2VyQ2FzZSgpKSA+PSAwKVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB2YXIgbWF0Y2ggPSBleHByZXNzaW9uLm1hdGNoKGphdmFTY3JpcHRBc3NpZ25tZW50VGFyZ2V0KTtcbiAgICAgICAgcmV0dXJuIG1hdGNoID09PSBudWxsID8gZmFsc2UgOiBtYXRjaFsxXSA/ICgnT2JqZWN0KCcgKyBtYXRjaFsxXSArICcpJyArIG1hdGNoWzJdKSA6IGV4cHJlc3Npb247XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZW5zdXJlUXVvdGVkKGtleSkge1xuICAgICAgICB2YXIgdHJpbW1lZEtleSA9IGtvLnV0aWxzLnN0cmluZ1RyaW0oa2V5KTtcbiAgICAgICAgc3dpdGNoICh0cmltbWVkS2V5Lmxlbmd0aCAmJiB0cmltbWVkS2V5LmNoYXJBdCgwKSkge1xuICAgICAgICAgICAgY2FzZSBcIidcIjpcbiAgICAgICAgICAgIGNhc2UgJ1wiJzpcbiAgICAgICAgICAgICAgICByZXR1cm4ga2V5O1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICByZXR1cm4gXCInXCIgKyB0cmltbWVkS2V5ICsgXCInXCI7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBiaW5kaW5nUmV3cml0ZVZhbGlkYXRvcnM6IFtdLFxuXG4gICAgICAgIHBhcnNlT2JqZWN0TGl0ZXJhbDogZnVuY3Rpb24ob2JqZWN0TGl0ZXJhbFN0cmluZykge1xuICAgICAgICAgICAgLy8gQSBmdWxsIHRva2VuaXNlcitsZXhlciB3b3VsZCBhZGQgdG9vIG11Y2ggd2VpZ2h0IHRvIHRoaXMgbGlicmFyeSwgc28gaGVyZSdzIGEgc2ltcGxlIHBhcnNlclxuICAgICAgICAgICAgLy8gdGhhdCBpcyBzdWZmaWNpZW50IGp1c3QgdG8gc3BsaXQgYW4gb2JqZWN0IGxpdGVyYWwgc3RyaW5nIGludG8gYSBzZXQgb2YgdG9wLWxldmVsIGtleS12YWx1ZSBwYWlyc1xuXG4gICAgICAgICAgICB2YXIgc3RyID0ga28udXRpbHMuc3RyaW5nVHJpbShvYmplY3RMaXRlcmFsU3RyaW5nKTtcbiAgICAgICAgICAgIGlmIChzdHIubGVuZ3RoIDwgMylcbiAgICAgICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgICAgICBpZiAoc3RyLmNoYXJBdCgwKSA9PT0gXCJ7XCIpLy8gSWdub3JlIGFueSBicmFjZXMgc3Vycm91bmRpbmcgdGhlIHdob2xlIG9iamVjdCBsaXRlcmFsXG4gICAgICAgICAgICAgICAgc3RyID0gc3RyLnN1YnN0cmluZygxLCBzdHIubGVuZ3RoIC0gMSk7XG5cbiAgICAgICAgICAgIC8vIFB1bGwgb3V0IGFueSBzdHJpbmcgbGl0ZXJhbHMgYW5kIHJlZ2V4IGxpdGVyYWxzXG4gICAgICAgICAgICB2YXIgdG9rZW5zID0gW107XG4gICAgICAgICAgICB2YXIgdG9rZW5TdGFydCA9IG51bGwsIHRva2VuRW5kQ2hhcjtcbiAgICAgICAgICAgIGZvciAodmFyIHBvc2l0aW9uID0gMDsgcG9zaXRpb24gPCBzdHIubGVuZ3RoOyBwb3NpdGlvbisrKSB7XG4gICAgICAgICAgICAgICAgdmFyIGMgPSBzdHIuY2hhckF0KHBvc2l0aW9uKTtcbiAgICAgICAgICAgICAgICBpZiAodG9rZW5TdGFydCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKGMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ1wiJzpcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCInXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwiL1wiOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRva2VuU3RhcnQgPSBwb3NpdGlvbjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b2tlbkVuZENoYXIgPSBjO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICgoYyA9PSB0b2tlbkVuZENoYXIpICYmIChzdHIuY2hhckF0KHBvc2l0aW9uIC0gMSkgIT09IFwiXFxcXFwiKSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgdG9rZW4gPSBzdHIuc3Vic3RyaW5nKHRva2VuU3RhcnQsIHBvc2l0aW9uICsgMSk7XG4gICAgICAgICAgICAgICAgICAgIHRva2Vucy5wdXNoKHRva2VuKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHJlcGxhY2VtZW50ID0gXCJAa29fdG9rZW5fXCIgKyAodG9rZW5zLmxlbmd0aCAtIDEpICsgXCJAXCI7XG4gICAgICAgICAgICAgICAgICAgIHN0ciA9IHN0ci5zdWJzdHJpbmcoMCwgdG9rZW5TdGFydCkgKyByZXBsYWNlbWVudCArIHN0ci5zdWJzdHJpbmcocG9zaXRpb24gKyAxKTtcbiAgICAgICAgICAgICAgICAgICAgcG9zaXRpb24gLT0gKHRva2VuLmxlbmd0aCAtIHJlcGxhY2VtZW50Lmxlbmd0aCk7XG4gICAgICAgICAgICAgICAgICAgIHRva2VuU3RhcnQgPSBudWxsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gTmV4dCBwdWxsIG91dCBiYWxhbmNlZCBwYXJlbiwgYnJhY2UsIGFuZCBicmFja2V0IGJsb2Nrc1xuICAgICAgICAgICAgdG9rZW5TdGFydCA9IG51bGw7XG4gICAgICAgICAgICB0b2tlbkVuZENoYXIgPSBudWxsO1xuICAgICAgICAgICAgdmFyIHRva2VuRGVwdGggPSAwLCB0b2tlblN0YXJ0Q2hhciA9IG51bGw7XG4gICAgICAgICAgICBmb3IgKHZhciBwb3NpdGlvbiA9IDA7IHBvc2l0aW9uIDwgc3RyLmxlbmd0aDsgcG9zaXRpb24rKykge1xuICAgICAgICAgICAgICAgIHZhciBjID0gc3RyLmNoYXJBdChwb3NpdGlvbik7XG4gICAgICAgICAgICAgICAgaWYgKHRva2VuU3RhcnQgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgc3dpdGNoIChjKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwie1wiOiB0b2tlblN0YXJ0ID0gcG9zaXRpb247IHRva2VuU3RhcnRDaGFyID0gYztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b2tlbkVuZENoYXIgPSBcIn1cIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCIoXCI6IHRva2VuU3RhcnQgPSBwb3NpdGlvbjsgdG9rZW5TdGFydENoYXIgPSBjO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRva2VuRW5kQ2hhciA9IFwiKVwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcIltcIjogdG9rZW5TdGFydCA9IHBvc2l0aW9uOyB0b2tlblN0YXJ0Q2hhciA9IGM7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdG9rZW5FbmRDaGFyID0gXCJdXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoYyA9PT0gdG9rZW5TdGFydENoYXIpXG4gICAgICAgICAgICAgICAgICAgIHRva2VuRGVwdGgrKztcbiAgICAgICAgICAgICAgICBlbHNlIGlmIChjID09PSB0b2tlbkVuZENoYXIpIHtcbiAgICAgICAgICAgICAgICAgICAgdG9rZW5EZXB0aC0tO1xuICAgICAgICAgICAgICAgICAgICBpZiAodG9rZW5EZXB0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHRva2VuID0gc3RyLnN1YnN0cmluZyh0b2tlblN0YXJ0LCBwb3NpdGlvbiArIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdG9rZW5zLnB1c2godG9rZW4pO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJlcGxhY2VtZW50ID0gXCJAa29fdG9rZW5fXCIgKyAodG9rZW5zLmxlbmd0aCAtIDEpICsgXCJAXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdHIgPSBzdHIuc3Vic3RyaW5nKDAsIHRva2VuU3RhcnQpICsgcmVwbGFjZW1lbnQgKyBzdHIuc3Vic3RyaW5nKHBvc2l0aW9uICsgMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbiAtPSAodG9rZW4ubGVuZ3RoIC0gcmVwbGFjZW1lbnQubGVuZ3RoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRva2VuU3RhcnQgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBOb3cgd2UgY2FuIHNhZmVseSBzcGxpdCBvbiBjb21tYXMgdG8gZ2V0IHRoZSBrZXkvdmFsdWUgcGFpcnNcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSBbXTtcbiAgICAgICAgICAgIHZhciBrZXlWYWx1ZVBhaXJzID0gc3RyLnNwbGl0KFwiLFwiKTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBqID0ga2V5VmFsdWVQYWlycy5sZW5ndGg7IGkgPCBqOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgcGFpciA9IGtleVZhbHVlUGFpcnNbaV07XG4gICAgICAgICAgICAgICAgdmFyIGNvbG9uUG9zID0gcGFpci5pbmRleE9mKFwiOlwiKTtcbiAgICAgICAgICAgICAgICBpZiAoKGNvbG9uUG9zID4gMCkgJiYgKGNvbG9uUG9zIDwgcGFpci5sZW5ndGggLSAxKSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIga2V5ID0gcGFpci5zdWJzdHJpbmcoMCwgY29sb25Qb3MpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgdmFsdWUgPSBwYWlyLnN1YnN0cmluZyhjb2xvblBvcyArIDEpO1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQucHVzaCh7ICdrZXknOiByZXN0b3JlVG9rZW5zKGtleSwgdG9rZW5zKSwgJ3ZhbHVlJzogcmVzdG9yZVRva2Vucyh2YWx1ZSwgdG9rZW5zKSB9KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQucHVzaCh7ICd1bmtub3duJzogcmVzdG9yZVRva2VucyhwYWlyLCB0b2tlbnMpIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH0sXG5cbiAgICAgICAgcHJlUHJvY2Vzc0JpbmRpbmdzOiBmdW5jdGlvbiAob2JqZWN0TGl0ZXJhbFN0cmluZ09yS2V5VmFsdWVBcnJheSkge1xuICAgICAgICAgICAgdmFyIGtleVZhbHVlQXJyYXkgPSB0eXBlb2Ygb2JqZWN0TGl0ZXJhbFN0cmluZ09yS2V5VmFsdWVBcnJheSA9PT0gXCJzdHJpbmdcIlxuICAgICAgICAgICAgICAgID8ga28uZXhwcmVzc2lvblJld3JpdGluZy5wYXJzZU9iamVjdExpdGVyYWwob2JqZWN0TGl0ZXJhbFN0cmluZ09yS2V5VmFsdWVBcnJheSlcbiAgICAgICAgICAgICAgICA6IG9iamVjdExpdGVyYWxTdHJpbmdPcktleVZhbHVlQXJyYXk7XG4gICAgICAgICAgICB2YXIgcmVzdWx0U3RyaW5ncyA9IFtdLCBwcm9wZXJ0eUFjY2Vzc29yUmVzdWx0U3RyaW5ncyA9IFtdO1xuXG4gICAgICAgICAgICB2YXIga2V5VmFsdWVFbnRyeTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBrZXlWYWx1ZUVudHJ5ID0ga2V5VmFsdWVBcnJheVtpXTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKHJlc3VsdFN0cmluZ3MubGVuZ3RoID4gMClcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0U3RyaW5ncy5wdXNoKFwiLFwiKTtcblxuICAgICAgICAgICAgICAgIGlmIChrZXlWYWx1ZUVudHJ5WydrZXknXSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgcXVvdGVkS2V5ID0gZW5zdXJlUXVvdGVkKGtleVZhbHVlRW50cnlbJ2tleSddKSwgdmFsID0ga2V5VmFsdWVFbnRyeVsndmFsdWUnXTtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0U3RyaW5ncy5wdXNoKHF1b3RlZEtleSk7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdFN0cmluZ3MucHVzaChcIjpcIik7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdFN0cmluZ3MucHVzaCh2YWwpO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICh2YWwgPSBnZXRXcml0ZWFibGVWYWx1ZShrby51dGlscy5zdHJpbmdUcmltKHZhbCkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocHJvcGVydHlBY2Nlc3NvclJlc3VsdFN0cmluZ3MubGVuZ3RoID4gMClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eUFjY2Vzc29yUmVzdWx0U3RyaW5ncy5wdXNoKFwiLCBcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eUFjY2Vzc29yUmVzdWx0U3RyaW5ncy5wdXNoKHF1b3RlZEtleSArIFwiIDogZnVuY3Rpb24oX19rb192YWx1ZSkgeyBcIiArIHZhbCArIFwiID0gX19rb192YWx1ZTsgfVwiKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoa2V5VmFsdWVFbnRyeVsndW5rbm93biddKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdFN0cmluZ3MucHVzaChrZXlWYWx1ZUVudHJ5Wyd1bmtub3duJ10pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIGNvbWJpbmVkUmVzdWx0ID0gcmVzdWx0U3RyaW5ncy5qb2luKFwiXCIpO1xuICAgICAgICAgICAgaWYgKHByb3BlcnR5QWNjZXNzb3JSZXN1bHRTdHJpbmdzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICB2YXIgYWxsUHJvcGVydHlBY2Nlc3NvcnMgPSBwcm9wZXJ0eUFjY2Vzc29yUmVzdWx0U3RyaW5ncy5qb2luKFwiXCIpO1xuICAgICAgICAgICAgICAgIGNvbWJpbmVkUmVzdWx0ID0gY29tYmluZWRSZXN1bHQgKyBcIiwgJ19rb19wcm9wZXJ0eV93cml0ZXJzJyA6IHsgXCIgKyBhbGxQcm9wZXJ0eUFjY2Vzc29ycyArIFwiIH0gXCI7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBjb21iaW5lZFJlc3VsdDtcbiAgICAgICAgfSxcblxuICAgICAgICBrZXlWYWx1ZUFycmF5Q29udGFpbnNLZXk6IGZ1bmN0aW9uKGtleVZhbHVlQXJyYXksIGtleSkge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBrZXlWYWx1ZUFycmF5Lmxlbmd0aDsgaSsrKVxuICAgICAgICAgICAgICAgIGlmIChrby51dGlscy5zdHJpbmdUcmltKGtleVZhbHVlQXJyYXlbaV1bJ2tleSddKSA9PSBrZXkpXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8vIEludGVybmFsLCBwcml2YXRlIEtPIHV0aWxpdHkgZm9yIHVwZGF0aW5nIG1vZGVsIHByb3BlcnRpZXMgZnJvbSB3aXRoaW4gYmluZGluZ3NcbiAgICAgICAgLy8gcHJvcGVydHk6ICAgICAgICAgICAgSWYgdGhlIHByb3BlcnR5IGJlaW5nIHVwZGF0ZWQgaXMgKG9yIG1pZ2h0IGJlKSBhbiBvYnNlcnZhYmxlLCBwYXNzIGl0IGhlcmVcbiAgICAgICAgLy8gICAgICAgICAgICAgICAgICAgICAgSWYgaXQgdHVybnMgb3V0IHRvIGJlIGEgd3JpdGFibGUgb2JzZXJ2YWJsZSwgaXQgd2lsbCBiZSB3cml0dGVuIHRvIGRpcmVjdGx5XG4gICAgICAgIC8vIGFsbEJpbmRpbmdzQWNjZXNzb3I6IEFsbCBiaW5kaW5ncyBpbiB0aGUgY3VycmVudCBleGVjdXRpb24gY29udGV4dC5cbiAgICAgICAgLy8gICAgICAgICAgICAgICAgICAgICAgVGhpcyB3aWxsIGJlIHNlYXJjaGVkIGZvciBhICdfa29fcHJvcGVydHlfd3JpdGVycycgcHJvcGVydHkgaW4gY2FzZSB5b3UncmUgd3JpdGluZyB0byBhIG5vbi1vYnNlcnZhYmxlXG4gICAgICAgIC8vIGtleTogICAgICAgICAgICAgICAgIFRoZSBrZXkgaWRlbnRpZnlpbmcgdGhlIHByb3BlcnR5IHRvIGJlIHdyaXR0ZW4uIEV4YW1wbGU6IGZvciB7IGhhc0ZvY3VzOiBteVZhbHVlIH0sIHdyaXRlIHRvICdteVZhbHVlJyBieSBzcGVjaWZ5aW5nIHRoZSBrZXkgJ2hhc0ZvY3VzJ1xuICAgICAgICAvLyB2YWx1ZTogICAgICAgICAgICAgICBUaGUgdmFsdWUgdG8gYmUgd3JpdHRlblxuICAgICAgICAvLyBjaGVja0lmRGlmZmVyZW50OiAgICBJZiB0cnVlLCBhbmQgaWYgdGhlIHByb3BlcnR5IGJlaW5nIHdyaXR0ZW4gaXMgYSB3cml0YWJsZSBvYnNlcnZhYmxlLCB0aGUgdmFsdWUgd2lsbCBvbmx5IGJlIHdyaXR0ZW4gaWZcbiAgICAgICAgLy8gICAgICAgICAgICAgICAgICAgICAgaXQgaXMgIT09IGV4aXN0aW5nIHZhbHVlIG9uIHRoYXQgd3JpdGFibGUgb2JzZXJ2YWJsZVxuICAgICAgICB3cml0ZVZhbHVlVG9Qcm9wZXJ0eTogZnVuY3Rpb24ocHJvcGVydHksIGFsbEJpbmRpbmdzQWNjZXNzb3IsIGtleSwgdmFsdWUsIGNoZWNrSWZEaWZmZXJlbnQpIHtcbiAgICAgICAgICAgIGlmICghcHJvcGVydHkgfHwgIWtvLmlzT2JzZXJ2YWJsZShwcm9wZXJ0eSkpIHtcbiAgICAgICAgICAgICAgICB2YXIgcHJvcFdyaXRlcnMgPSBhbGxCaW5kaW5nc0FjY2Vzc29yKClbJ19rb19wcm9wZXJ0eV93cml0ZXJzJ107XG4gICAgICAgICAgICAgICAgaWYgKHByb3BXcml0ZXJzICYmIHByb3BXcml0ZXJzW2tleV0pXG4gICAgICAgICAgICAgICAgICAgIHByb3BXcml0ZXJzW2tleV0odmFsdWUpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChrby5pc1dyaXRlYWJsZU9ic2VydmFibGUocHJvcGVydHkpICYmICghY2hlY2tJZkRpZmZlcmVudCB8fCBwcm9wZXJ0eS5wZWVrKCkgIT09IHZhbHVlKSkge1xuICAgICAgICAgICAgICAgIHByb3BlcnR5KHZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG59KSgpO1xuXG5rby5leHBvcnRTeW1ib2woJ2V4cHJlc3Npb25SZXdyaXRpbmcnLCBrby5leHByZXNzaW9uUmV3cml0aW5nKTtcbmtvLmV4cG9ydFN5bWJvbCgnZXhwcmVzc2lvblJld3JpdGluZy5iaW5kaW5nUmV3cml0ZVZhbGlkYXRvcnMnLCBrby5leHByZXNzaW9uUmV3cml0aW5nLmJpbmRpbmdSZXdyaXRlVmFsaWRhdG9ycyk7XG5rby5leHBvcnRTeW1ib2woJ2V4cHJlc3Npb25SZXdyaXRpbmcucGFyc2VPYmplY3RMaXRlcmFsJywga28uZXhwcmVzc2lvblJld3JpdGluZy5wYXJzZU9iamVjdExpdGVyYWwpO1xua28uZXhwb3J0U3ltYm9sKCdleHByZXNzaW9uUmV3cml0aW5nLnByZVByb2Nlc3NCaW5kaW5ncycsIGtvLmV4cHJlc3Npb25SZXdyaXRpbmcucHJlUHJvY2Vzc0JpbmRpbmdzKTtcblxuLy8gRm9yIGJhY2t3YXJkIGNvbXBhdGliaWxpdHksIGRlZmluZSB0aGUgZm9sbG93aW5nIGFsaWFzZXMuIChQcmV2aW91c2x5LCB0aGVzZSBmdW5jdGlvbiBuYW1lcyB3ZXJlIG1pc2xlYWRpbmcgYmVjYXVzZVxuLy8gdGhleSByZWZlcnJlZCB0byBKU09OIHNwZWNpZmljYWxseSwgZXZlbiB0aG91Z2ggdGhleSBhY3R1YWxseSB3b3JrIHdpdGggYXJiaXRyYXJ5IEphdmFTY3JpcHQgb2JqZWN0IGxpdGVyYWwgZXhwcmVzc2lvbnMuKVxua28uZXhwb3J0U3ltYm9sKCdqc29uRXhwcmVzc2lvblJld3JpdGluZycsIGtvLmV4cHJlc3Npb25SZXdyaXRpbmcpO1xua28uZXhwb3J0U3ltYm9sKCdqc29uRXhwcmVzc2lvblJld3JpdGluZy5pbnNlcnRQcm9wZXJ0eUFjY2Vzc29yc0ludG9Kc29uJywga28uZXhwcmVzc2lvblJld3JpdGluZy5wcmVQcm9jZXNzQmluZGluZ3MpOyhmdW5jdGlvbigpIHtcbiAgICAvLyBcIlZpcnR1YWwgZWxlbWVudHNcIiBpcyBhbiBhYnN0cmFjdGlvbiBvbiB0b3Agb2YgdGhlIHVzdWFsIERPTSBBUEkgd2hpY2ggdW5kZXJzdGFuZHMgdGhlIG5vdGlvbiB0aGF0IGNvbW1lbnQgbm9kZXNcbiAgICAvLyBtYXkgYmUgdXNlZCB0byByZXByZXNlbnQgaGllcmFyY2h5IChpbiBhZGRpdGlvbiB0byB0aGUgRE9NJ3MgbmF0dXJhbCBoaWVyYXJjaHkpLlxuICAgIC8vIElmIHlvdSBjYWxsIHRoZSBET00tbWFuaXB1bGF0aW5nIGZ1bmN0aW9ucyBvbiBrby52aXJ0dWFsRWxlbWVudHMsIHlvdSB3aWxsIGJlIGFibGUgdG8gcmVhZCBhbmQgd3JpdGUgdGhlIHN0YXRlXG4gICAgLy8gb2YgdGhhdCB2aXJ0dWFsIGhpZXJhcmNoeVxuICAgIC8vXG4gICAgLy8gVGhlIHBvaW50IG9mIGFsbCB0aGlzIGlzIHRvIHN1cHBvcnQgY29udGFpbmVybGVzcyB0ZW1wbGF0ZXMgKGUuZy4sIDwhLS0ga28gZm9yZWFjaDpzb21lQ29sbGVjdGlvbiAtLT5ibGFoPCEtLSAva28gLS0+KVxuICAgIC8vIHdpdGhvdXQgaGF2aW5nIHRvIHNjYXR0ZXIgc3BlY2lhbCBjYXNlcyBhbGwgb3ZlciB0aGUgYmluZGluZyBhbmQgdGVtcGxhdGluZyBjb2RlLlxuXG4gICAgLy8gSUUgOSBjYW5ub3QgcmVsaWFibHkgcmVhZCB0aGUgXCJub2RlVmFsdWVcIiBwcm9wZXJ0eSBvZiBhIGNvbW1lbnQgbm9kZSAoc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9TdGV2ZVNhbmRlcnNvbi9rbm9ja291dC9pc3N1ZXMvMTg2KVxuICAgIC8vIGJ1dCBpdCBkb2VzIGdpdmUgdGhlbSBhIG5vbnN0YW5kYXJkIGFsdGVybmF0aXZlIHByb3BlcnR5IGNhbGxlZCBcInRleHRcIiB0aGF0IGl0IGNhbiByZWFkIHJlbGlhYmx5LiBPdGhlciBicm93c2VycyBkb24ndCBoYXZlIHRoYXQgcHJvcGVydHkuXG4gICAgLy8gU28sIHVzZSBub2RlLnRleHQgd2hlcmUgYXZhaWxhYmxlLCBhbmQgbm9kZS5ub2RlVmFsdWUgZWxzZXdoZXJlXG4gICAgdmFyIGNvbW1lbnROb2Rlc0hhdmVUZXh0UHJvcGVydHkgPSBkb2N1bWVudCAmJiBkb2N1bWVudC5jcmVhdGVDb21tZW50KFwidGVzdFwiKS50ZXh0ID09PSBcIjwhLS10ZXN0LS0+XCI7XG5cbiAgICB2YXIgc3RhcnRDb21tZW50UmVnZXggPSBjb21tZW50Tm9kZXNIYXZlVGV4dFByb3BlcnR5ID8gL148IS0tXFxzKmtvKD86XFxzKyguK1xccypcXDpbXFxzXFxTXSopKT9cXHMqLS0+JC8gOiAvXlxccyprbyg/OlxccysoLitcXHMqXFw6W1xcc1xcU10qKSk/XFxzKiQvO1xuICAgIHZhciBlbmRDb21tZW50UmVnZXggPSAgIGNvbW1lbnROb2Rlc0hhdmVUZXh0UHJvcGVydHkgPyAvXjwhLS1cXHMqXFwva29cXHMqLS0+JC8gOiAvXlxccypcXC9rb1xccyokLztcbiAgICB2YXIgaHRtbFRhZ3NXaXRoT3B0aW9uYWxseUNsb3NpbmdDaGlsZHJlbiA9IHsgJ3VsJzogdHJ1ZSwgJ29sJzogdHJ1ZSB9O1xuXG4gICAgZnVuY3Rpb24gaXNTdGFydENvbW1lbnQobm9kZSkge1xuICAgICAgICByZXR1cm4gKG5vZGUubm9kZVR5cGUgPT0gOCkgJiYgKGNvbW1lbnROb2Rlc0hhdmVUZXh0UHJvcGVydHkgPyBub2RlLnRleHQgOiBub2RlLm5vZGVWYWx1ZSkubWF0Y2goc3RhcnRDb21tZW50UmVnZXgpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGlzRW5kQ29tbWVudChub2RlKSB7XG4gICAgICAgIHJldHVybiAobm9kZS5ub2RlVHlwZSA9PSA4KSAmJiAoY29tbWVudE5vZGVzSGF2ZVRleHRQcm9wZXJ0eSA/IG5vZGUudGV4dCA6IG5vZGUubm9kZVZhbHVlKS5tYXRjaChlbmRDb21tZW50UmVnZXgpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldFZpcnR1YWxDaGlsZHJlbihzdGFydENvbW1lbnQsIGFsbG93VW5iYWxhbmNlZCkge1xuICAgICAgICB2YXIgY3VycmVudE5vZGUgPSBzdGFydENvbW1lbnQ7XG4gICAgICAgIHZhciBkZXB0aCA9IDE7XG4gICAgICAgIHZhciBjaGlsZHJlbiA9IFtdO1xuICAgICAgICB3aGlsZSAoY3VycmVudE5vZGUgPSBjdXJyZW50Tm9kZS5uZXh0U2libGluZykge1xuICAgICAgICAgICAgaWYgKGlzRW5kQ29tbWVudChjdXJyZW50Tm9kZSkpIHtcbiAgICAgICAgICAgICAgICBkZXB0aC0tO1xuICAgICAgICAgICAgICAgIGlmIChkZXB0aCA9PT0gMClcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNoaWxkcmVuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjaGlsZHJlbi5wdXNoKGN1cnJlbnROb2RlKTtcblxuICAgICAgICAgICAgaWYgKGlzU3RhcnRDb21tZW50KGN1cnJlbnROb2RlKSlcbiAgICAgICAgICAgICAgICBkZXB0aCsrO1xuICAgICAgICB9XG4gICAgICAgIGlmICghYWxsb3dVbmJhbGFuY2VkKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgY2xvc2luZyBjb21tZW50IHRhZyB0byBtYXRjaDogXCIgKyBzdGFydENvbW1lbnQubm9kZVZhbHVlKTtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0TWF0Y2hpbmdFbmRDb21tZW50KHN0YXJ0Q29tbWVudCwgYWxsb3dVbmJhbGFuY2VkKSB7XG4gICAgICAgIHZhciBhbGxWaXJ0dWFsQ2hpbGRyZW4gPSBnZXRWaXJ0dWFsQ2hpbGRyZW4oc3RhcnRDb21tZW50LCBhbGxvd1VuYmFsYW5jZWQpO1xuICAgICAgICBpZiAoYWxsVmlydHVhbENoaWxkcmVuKSB7XG4gICAgICAgICAgICBpZiAoYWxsVmlydHVhbENoaWxkcmVuLmxlbmd0aCA+IDApXG4gICAgICAgICAgICAgICAgcmV0dXJuIGFsbFZpcnR1YWxDaGlsZHJlblthbGxWaXJ0dWFsQ2hpbGRyZW4ubGVuZ3RoIC0gMV0ubmV4dFNpYmxpbmc7XG4gICAgICAgICAgICByZXR1cm4gc3RhcnRDb21tZW50Lm5leHRTaWJsaW5nO1xuICAgICAgICB9IGVsc2VcbiAgICAgICAgICAgIHJldHVybiBudWxsOyAvLyBNdXN0IGhhdmUgbm8gbWF0Y2hpbmcgZW5kIGNvbW1lbnQsIGFuZCBhbGxvd1VuYmFsYW5jZWQgaXMgdHJ1ZVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldFVuYmFsYW5jZWRDaGlsZFRhZ3Mobm9kZSkge1xuICAgICAgICAvLyBlLmcuLCBmcm9tIDxkaXY+T0s8L2Rpdj48IS0tIGtvIGJsYWggLS0+PHNwYW4+QW5vdGhlcjwvc3Bhbj4sIHJldHVybnM6IDwhLS0ga28gYmxhaCAtLT48c3Bhbj5Bbm90aGVyPC9zcGFuPlxuICAgICAgICAvLyAgICAgICBmcm9tIDxkaXY+T0s8L2Rpdj48IS0tIC9rbyAtLT48IS0tIC9rbyAtLT4sICAgICAgICAgICAgIHJldHVybnM6IDwhLS0gL2tvIC0tPjwhLS0gL2tvIC0tPlxuICAgICAgICB2YXIgY2hpbGROb2RlID0gbm9kZS5maXJzdENoaWxkLCBjYXB0dXJlUmVtYWluaW5nID0gbnVsbDtcbiAgICAgICAgaWYgKGNoaWxkTm9kZSkge1xuICAgICAgICAgICAgZG8ge1xuICAgICAgICAgICAgICAgIGlmIChjYXB0dXJlUmVtYWluaW5nKSAgICAgICAgICAgICAgICAgICAvLyBXZSBhbHJlYWR5IGhpdCBhbiB1bmJhbGFuY2VkIG5vZGUgYW5kIGFyZSBub3cganVzdCBzY29vcGluZyB1cCBhbGwgc3Vic2VxdWVudCBub2Rlc1xuICAgICAgICAgICAgICAgICAgICBjYXB0dXJlUmVtYWluaW5nLnB1c2goY2hpbGROb2RlKTtcbiAgICAgICAgICAgICAgICBlbHNlIGlmIChpc1N0YXJ0Q29tbWVudChjaGlsZE5vZGUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBtYXRjaGluZ0VuZENvbW1lbnQgPSBnZXRNYXRjaGluZ0VuZENvbW1lbnQoY2hpbGROb2RlLCAvKiBhbGxvd1VuYmFsYW5jZWQ6ICovIHRydWUpO1xuICAgICAgICAgICAgICAgICAgICBpZiAobWF0Y2hpbmdFbmRDb21tZW50KSAgICAgICAgICAgICAvLyBJdCdzIGEgYmFsYW5jZWQgdGFnLCBzbyBza2lwIGltbWVkaWF0ZWx5IHRvIHRoZSBlbmQgb2YgdGhpcyB2aXJ0dWFsIHNldFxuICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGROb2RlID0gbWF0Y2hpbmdFbmRDb21tZW50O1xuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXB0dXJlUmVtYWluaW5nID0gW2NoaWxkTm9kZV07IC8vIEl0J3MgdW5iYWxhbmNlZCwgc28gc3RhcnQgY2FwdHVyaW5nIGZyb20gdGhpcyBwb2ludFxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoaXNFbmRDb21tZW50KGNoaWxkTm9kZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FwdHVyZVJlbWFpbmluZyA9IFtjaGlsZE5vZGVdOyAgICAgLy8gSXQncyB1bmJhbGFuY2VkIChpZiBpdCB3YXNuJ3QsIHdlJ2QgaGF2ZSBza2lwcGVkIG92ZXIgaXQgYWxyZWFkeSksIHNvIHN0YXJ0IGNhcHR1cmluZ1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gd2hpbGUgKGNoaWxkTm9kZSA9IGNoaWxkTm9kZS5uZXh0U2libGluZyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGNhcHR1cmVSZW1haW5pbmc7XG4gICAgfVxuXG4gICAga28udmlydHVhbEVsZW1lbnRzID0ge1xuICAgICAgICBhbGxvd2VkQmluZGluZ3M6IHt9LFxuXG4gICAgICAgIGNoaWxkTm9kZXM6IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgICAgICAgIHJldHVybiBpc1N0YXJ0Q29tbWVudChub2RlKSA/IGdldFZpcnR1YWxDaGlsZHJlbihub2RlKSA6IG5vZGUuY2hpbGROb2RlcztcbiAgICAgICAgfSxcblxuICAgICAgICBlbXB0eU5vZGU6IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgICAgICAgIGlmICghaXNTdGFydENvbW1lbnQobm9kZSkpXG4gICAgICAgICAgICAgICAga28udXRpbHMuZW1wdHlEb21Ob2RlKG5vZGUpO1xuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdmFyIHZpcnR1YWxDaGlsZHJlbiA9IGtvLnZpcnR1YWxFbGVtZW50cy5jaGlsZE5vZGVzKG5vZGUpO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBqID0gdmlydHVhbENoaWxkcmVuLmxlbmd0aDsgaSA8IGo7IGkrKylcbiAgICAgICAgICAgICAgICAgICAga28ucmVtb3ZlTm9kZSh2aXJ0dWFsQ2hpbGRyZW5baV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIHNldERvbU5vZGVDaGlsZHJlbjogZnVuY3Rpb24obm9kZSwgY2hpbGROb2Rlcykge1xuICAgICAgICAgICAgaWYgKCFpc1N0YXJ0Q29tbWVudChub2RlKSlcbiAgICAgICAgICAgICAgICBrby51dGlscy5zZXREb21Ob2RlQ2hpbGRyZW4obm9kZSwgY2hpbGROb2Rlcyk7XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBrby52aXJ0dWFsRWxlbWVudHMuZW1wdHlOb2RlKG5vZGUpO1xuICAgICAgICAgICAgICAgIHZhciBlbmRDb21tZW50Tm9kZSA9IG5vZGUubmV4dFNpYmxpbmc7IC8vIE11c3QgYmUgdGhlIG5leHQgc2libGluZywgYXMgd2UganVzdCBlbXB0aWVkIHRoZSBjaGlsZHJlblxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBqID0gY2hpbGROb2Rlcy5sZW5ndGg7IGkgPCBqOyBpKyspXG4gICAgICAgICAgICAgICAgICAgIGVuZENvbW1lbnROb2RlLnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKGNoaWxkTm9kZXNbaV0sIGVuZENvbW1lbnROb2RlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBwcmVwZW5kOiBmdW5jdGlvbihjb250YWluZXJOb2RlLCBub2RlVG9QcmVwZW5kKSB7XG4gICAgICAgICAgICBpZiAoIWlzU3RhcnRDb21tZW50KGNvbnRhaW5lck5vZGUpKSB7XG4gICAgICAgICAgICAgICAgaWYgKGNvbnRhaW5lck5vZGUuZmlyc3RDaGlsZClcbiAgICAgICAgICAgICAgICAgICAgY29udGFpbmVyTm9kZS5pbnNlcnRCZWZvcmUobm9kZVRvUHJlcGVuZCwgY29udGFpbmVyTm9kZS5maXJzdENoaWxkKTtcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIGNvbnRhaW5lck5vZGUuYXBwZW5kQ2hpbGQobm9kZVRvUHJlcGVuZCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIFN0YXJ0IGNvbW1lbnRzIG11c3QgYWx3YXlzIGhhdmUgYSBwYXJlbnQgYW5kIGF0IGxlYXN0IG9uZSBmb2xsb3dpbmcgc2libGluZyAodGhlIGVuZCBjb21tZW50KVxuICAgICAgICAgICAgICAgIGNvbnRhaW5lck5vZGUucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUobm9kZVRvUHJlcGVuZCwgY29udGFpbmVyTm9kZS5uZXh0U2libGluZyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgaW5zZXJ0QWZ0ZXI6IGZ1bmN0aW9uKGNvbnRhaW5lck5vZGUsIG5vZGVUb0luc2VydCwgaW5zZXJ0QWZ0ZXJOb2RlKSB7XG4gICAgICAgICAgICBpZiAoIWluc2VydEFmdGVyTm9kZSkge1xuICAgICAgICAgICAgICAgIGtvLnZpcnR1YWxFbGVtZW50cy5wcmVwZW5kKGNvbnRhaW5lck5vZGUsIG5vZGVUb0luc2VydCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKCFpc1N0YXJ0Q29tbWVudChjb250YWluZXJOb2RlKSkge1xuICAgICAgICAgICAgICAgIC8vIEluc2VydCBhZnRlciBpbnNlcnRpb24gcG9pbnRcbiAgICAgICAgICAgICAgICBpZiAoaW5zZXJ0QWZ0ZXJOb2RlLm5leHRTaWJsaW5nKVxuICAgICAgICAgICAgICAgICAgICBjb250YWluZXJOb2RlLmluc2VydEJlZm9yZShub2RlVG9JbnNlcnQsIGluc2VydEFmdGVyTm9kZS5uZXh0U2libGluZyk7XG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBjb250YWluZXJOb2RlLmFwcGVuZENoaWxkKG5vZGVUb0luc2VydCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIENoaWxkcmVuIG9mIHN0YXJ0IGNvbW1lbnRzIG11c3QgYWx3YXlzIGhhdmUgYSBwYXJlbnQgYW5kIGF0IGxlYXN0IG9uZSBmb2xsb3dpbmcgc2libGluZyAodGhlIGVuZCBjb21tZW50KVxuICAgICAgICAgICAgICAgIGNvbnRhaW5lck5vZGUucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUobm9kZVRvSW5zZXJ0LCBpbnNlcnRBZnRlck5vZGUubmV4dFNpYmxpbmcpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIGZpcnN0Q2hpbGQ6IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgICAgICAgIGlmICghaXNTdGFydENvbW1lbnQobm9kZSkpXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5vZGUuZmlyc3RDaGlsZDtcbiAgICAgICAgICAgIGlmICghbm9kZS5uZXh0U2libGluZyB8fCBpc0VuZENvbW1lbnQobm9kZS5uZXh0U2libGluZykpXG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICByZXR1cm4gbm9kZS5uZXh0U2libGluZztcbiAgICAgICAgfSxcblxuICAgICAgICBuZXh0U2libGluZzogZnVuY3Rpb24obm9kZSkge1xuICAgICAgICAgICAgaWYgKGlzU3RhcnRDb21tZW50KG5vZGUpKVxuICAgICAgICAgICAgICAgIG5vZGUgPSBnZXRNYXRjaGluZ0VuZENvbW1lbnQobm9kZSk7XG4gICAgICAgICAgICBpZiAobm9kZS5uZXh0U2libGluZyAmJiBpc0VuZENvbW1lbnQobm9kZS5uZXh0U2libGluZykpXG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICByZXR1cm4gbm9kZS5uZXh0U2libGluZztcbiAgICAgICAgfSxcblxuICAgICAgICB2aXJ0dWFsTm9kZUJpbmRpbmdWYWx1ZTogZnVuY3Rpb24obm9kZSkge1xuICAgICAgICAgICAgdmFyIHJlZ2V4TWF0Y2ggPSBpc1N0YXJ0Q29tbWVudChub2RlKTtcbiAgICAgICAgICAgIHJldHVybiByZWdleE1hdGNoID8gcmVnZXhNYXRjaFsxXSA6IG51bGw7XG4gICAgICAgIH0sXG5cbiAgICAgICAgbm9ybWFsaXNlVmlydHVhbEVsZW1lbnREb21TdHJ1Y3R1cmU6IGZ1bmN0aW9uKGVsZW1lbnRWZXJpZmllZCkge1xuICAgICAgICAgICAgLy8gV29ya2Fyb3VuZCBmb3IgaHR0cHM6Ly9naXRodWIuY29tL1N0ZXZlU2FuZGVyc29uL2tub2Nrb3V0L2lzc3Vlcy8xNTVcbiAgICAgICAgICAgIC8vIChJRSA8PSA4IG9yIElFIDkgcXVpcmtzIG1vZGUgcGFyc2VzIHlvdXIgSFRNTCB3ZWlyZGx5LCB0cmVhdGluZyBjbG9zaW5nIDwvbGk+IHRhZ3MgYXMgaWYgdGhleSBkb24ndCBleGlzdCwgdGhlcmVieSBtb3ZpbmcgY29tbWVudCBub2Rlc1xuICAgICAgICAgICAgLy8gdGhhdCBhcmUgZGlyZWN0IGRlc2NlbmRhbnRzIG9mIDx1bD4gaW50byB0aGUgcHJlY2VkaW5nIDxsaT4pXG4gICAgICAgICAgICBpZiAoIWh0bWxUYWdzV2l0aE9wdGlvbmFsbHlDbG9zaW5nQ2hpbGRyZW5ba28udXRpbHMudGFnTmFtZUxvd2VyKGVsZW1lbnRWZXJpZmllZCldKVxuICAgICAgICAgICAgICAgIHJldHVybjtcblxuICAgICAgICAgICAgLy8gU2NhbiBpbW1lZGlhdGUgY2hpbGRyZW4gdG8gc2VlIGlmIHRoZXkgY29udGFpbiB1bmJhbGFuY2VkIGNvbW1lbnQgdGFncy4gSWYgdGhleSBkbywgdGhvc2UgY29tbWVudCB0YWdzXG4gICAgICAgICAgICAvLyBtdXN0IGJlIGludGVuZGVkIHRvIGFwcGVhciAqYWZ0ZXIqIHRoYXQgY2hpbGQsIHNvIG1vdmUgdGhlbSB0aGVyZS5cbiAgICAgICAgICAgIHZhciBjaGlsZE5vZGUgPSBlbGVtZW50VmVyaWZpZWQuZmlyc3RDaGlsZDtcbiAgICAgICAgICAgIGlmIChjaGlsZE5vZGUpIHtcbiAgICAgICAgICAgICAgICBkbyB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjaGlsZE5vZGUubm9kZVR5cGUgPT09IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB1bmJhbGFuY2VkVGFncyA9IGdldFVuYmFsYW5jZWRDaGlsZFRhZ3MoY2hpbGROb2RlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh1bmJhbGFuY2VkVGFncykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZpeCB1cCB0aGUgRE9NIGJ5IG1vdmluZyB0aGUgdW5iYWxhbmNlZCB0YWdzIHRvIHdoZXJlIHRoZXkgbW9zdCBsaWtlbHkgd2VyZSBpbnRlbmRlZCB0byBiZSBwbGFjZWQgLSAqYWZ0ZXIqIHRoZSBjaGlsZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBub2RlVG9JbnNlcnRCZWZvcmUgPSBjaGlsZE5vZGUubmV4dFNpYmxpbmc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB1bmJhbGFuY2VkVGFncy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobm9kZVRvSW5zZXJ0QmVmb3JlKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudFZlcmlmaWVkLmluc2VydEJlZm9yZSh1bmJhbGFuY2VkVGFnc1tpXSwgbm9kZVRvSW5zZXJ0QmVmb3JlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudFZlcmlmaWVkLmFwcGVuZENoaWxkKHVuYmFsYW5jZWRUYWdzW2ldKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IHdoaWxlIChjaGlsZE5vZGUgPSBjaGlsZE5vZGUubmV4dFNpYmxpbmcpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbn0pKCk7XG5rby5leHBvcnRTeW1ib2woJ3ZpcnR1YWxFbGVtZW50cycsIGtvLnZpcnR1YWxFbGVtZW50cyk7XG5rby5leHBvcnRTeW1ib2woJ3ZpcnR1YWxFbGVtZW50cy5hbGxvd2VkQmluZGluZ3MnLCBrby52aXJ0dWFsRWxlbWVudHMuYWxsb3dlZEJpbmRpbmdzKTtcbmtvLmV4cG9ydFN5bWJvbCgndmlydHVhbEVsZW1lbnRzLmVtcHR5Tm9kZScsIGtvLnZpcnR1YWxFbGVtZW50cy5lbXB0eU5vZGUpO1xuLy9rby5leHBvcnRTeW1ib2woJ3ZpcnR1YWxFbGVtZW50cy5maXJzdENoaWxkJywga28udmlydHVhbEVsZW1lbnRzLmZpcnN0Q2hpbGQpOyAgICAgLy8gZmlyc3RDaGlsZCBpcyBub3QgbWluaWZpZWRcbmtvLmV4cG9ydFN5bWJvbCgndmlydHVhbEVsZW1lbnRzLmluc2VydEFmdGVyJywga28udmlydHVhbEVsZW1lbnRzLmluc2VydEFmdGVyKTtcbi8va28uZXhwb3J0U3ltYm9sKCd2aXJ0dWFsRWxlbWVudHMubmV4dFNpYmxpbmcnLCBrby52aXJ0dWFsRWxlbWVudHMubmV4dFNpYmxpbmcpOyAgIC8vIG5leHRTaWJsaW5nIGlzIG5vdCBtaW5pZmllZFxua28uZXhwb3J0U3ltYm9sKCd2aXJ0dWFsRWxlbWVudHMucHJlcGVuZCcsIGtvLnZpcnR1YWxFbGVtZW50cy5wcmVwZW5kKTtcbmtvLmV4cG9ydFN5bWJvbCgndmlydHVhbEVsZW1lbnRzLnNldERvbU5vZGVDaGlsZHJlbicsIGtvLnZpcnR1YWxFbGVtZW50cy5zZXREb21Ob2RlQ2hpbGRyZW4pO1xuKGZ1bmN0aW9uKCkge1xuICAgIHZhciBkZWZhdWx0QmluZGluZ0F0dHJpYnV0ZU5hbWUgPSBcImRhdGEtYmluZFwiO1xuXG4gICAga28uYmluZGluZ1Byb3ZpZGVyID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuYmluZGluZ0NhY2hlID0ge307XG4gICAgfTtcblxuICAgIGtvLnV0aWxzLmV4dGVuZChrby5iaW5kaW5nUHJvdmlkZXIucHJvdG90eXBlLCB7XG4gICAgICAgICdub2RlSGFzQmluZGluZ3MnOiBmdW5jdGlvbihub2RlKSB7XG4gICAgICAgICAgICBzd2l0Y2ggKG5vZGUubm9kZVR5cGUpIHtcbiAgICAgICAgICAgICAgICBjYXNlIDE6IHJldHVybiBub2RlLmdldEF0dHJpYnV0ZShkZWZhdWx0QmluZGluZ0F0dHJpYnV0ZU5hbWUpICE9IG51bGw7ICAgLy8gRWxlbWVudFxuICAgICAgICAgICAgICAgIGNhc2UgODogcmV0dXJuIGtvLnZpcnR1YWxFbGVtZW50cy52aXJ0dWFsTm9kZUJpbmRpbmdWYWx1ZShub2RlKSAhPSBudWxsOyAvLyBDb21tZW50IG5vZGVcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgJ2dldEJpbmRpbmdzJzogZnVuY3Rpb24obm9kZSwgYmluZGluZ0NvbnRleHQpIHtcbiAgICAgICAgICAgIHZhciBiaW5kaW5nc1N0cmluZyA9IHRoaXNbJ2dldEJpbmRpbmdzU3RyaW5nJ10obm9kZSwgYmluZGluZ0NvbnRleHQpO1xuICAgICAgICAgICAgcmV0dXJuIGJpbmRpbmdzU3RyaW5nID8gdGhpc1sncGFyc2VCaW5kaW5nc1N0cmluZyddKGJpbmRpbmdzU3RyaW5nLCBiaW5kaW5nQ29udGV4dCwgbm9kZSkgOiBudWxsO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8vIFRoZSBmb2xsb3dpbmcgZnVuY3Rpb24gaXMgb25seSB1c2VkIGludGVybmFsbHkgYnkgdGhpcyBkZWZhdWx0IHByb3ZpZGVyLlxuICAgICAgICAvLyBJdCdzIG5vdCBwYXJ0IG9mIHRoZSBpbnRlcmZhY2UgZGVmaW5pdGlvbiBmb3IgYSBnZW5lcmFsIGJpbmRpbmcgcHJvdmlkZXIuXG4gICAgICAgICdnZXRCaW5kaW5nc1N0cmluZyc6IGZ1bmN0aW9uKG5vZGUsIGJpbmRpbmdDb250ZXh0KSB7XG4gICAgICAgICAgICBzd2l0Y2ggKG5vZGUubm9kZVR5cGUpIHtcbiAgICAgICAgICAgICAgICBjYXNlIDE6IHJldHVybiBub2RlLmdldEF0dHJpYnV0ZShkZWZhdWx0QmluZGluZ0F0dHJpYnV0ZU5hbWUpOyAgIC8vIEVsZW1lbnRcbiAgICAgICAgICAgICAgICBjYXNlIDg6IHJldHVybiBrby52aXJ0dWFsRWxlbWVudHMudmlydHVhbE5vZGVCaW5kaW5nVmFsdWUobm9kZSk7IC8vIENvbW1lbnQgbm9kZVxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6IHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIC8vIFRoZSBmb2xsb3dpbmcgZnVuY3Rpb24gaXMgb25seSB1c2VkIGludGVybmFsbHkgYnkgdGhpcyBkZWZhdWx0IHByb3ZpZGVyLlxuICAgICAgICAvLyBJdCdzIG5vdCBwYXJ0IG9mIHRoZSBpbnRlcmZhY2UgZGVmaW5pdGlvbiBmb3IgYSBnZW5lcmFsIGJpbmRpbmcgcHJvdmlkZXIuXG4gICAgICAgICdwYXJzZUJpbmRpbmdzU3RyaW5nJzogZnVuY3Rpb24oYmluZGluZ3NTdHJpbmcsIGJpbmRpbmdDb250ZXh0LCBub2RlKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHZhciBiaW5kaW5nRnVuY3Rpb24gPSBjcmVhdGVCaW5kaW5nc1N0cmluZ0V2YWx1YXRvclZpYUNhY2hlKGJpbmRpbmdzU3RyaW5nLCB0aGlzLmJpbmRpbmdDYWNoZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGJpbmRpbmdGdW5jdGlvbihiaW5kaW5nQ29udGV4dCwgbm9kZSk7XG4gICAgICAgICAgICB9IGNhdGNoIChleCkge1xuICAgICAgICAgICAgICAgIGV4Lm1lc3NhZ2UgPSBcIlVuYWJsZSB0byBwYXJzZSBiaW5kaW5ncy5cXG5CaW5kaW5ncyB2YWx1ZTogXCIgKyBiaW5kaW5nc1N0cmluZyArIFwiXFxuTWVzc2FnZTogXCIgKyBleC5tZXNzYWdlO1xuICAgICAgICAgICAgICAgIHRocm93IGV4O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICBrby5iaW5kaW5nUHJvdmlkZXJbJ2luc3RhbmNlJ10gPSBuZXcga28uYmluZGluZ1Byb3ZpZGVyKCk7XG5cbiAgICBmdW5jdGlvbiBjcmVhdGVCaW5kaW5nc1N0cmluZ0V2YWx1YXRvclZpYUNhY2hlKGJpbmRpbmdzU3RyaW5nLCBjYWNoZSkge1xuICAgICAgICB2YXIgY2FjaGVLZXkgPSBiaW5kaW5nc1N0cmluZztcbiAgICAgICAgcmV0dXJuIGNhY2hlW2NhY2hlS2V5XVxuICAgICAgICAgICAgfHwgKGNhY2hlW2NhY2hlS2V5XSA9IGNyZWF0ZUJpbmRpbmdzU3RyaW5nRXZhbHVhdG9yKGJpbmRpbmdzU3RyaW5nKSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY3JlYXRlQmluZGluZ3NTdHJpbmdFdmFsdWF0b3IoYmluZGluZ3NTdHJpbmcpIHtcbiAgICAgICAgLy8gQnVpbGQgdGhlIHNvdXJjZSBmb3IgYSBmdW5jdGlvbiB0aGF0IGV2YWx1YXRlcyBcImV4cHJlc3Npb25cIlxuICAgICAgICAvLyBGb3IgZWFjaCBzY29wZSB2YXJpYWJsZSwgYWRkIGFuIGV4dHJhIGxldmVsIG9mIFwid2l0aFwiIG5lc3RpbmdcbiAgICAgICAgLy8gRXhhbXBsZSByZXN1bHQ6IHdpdGgoc2MxKSB7IHdpdGgoc2MwKSB7IHJldHVybiAoZXhwcmVzc2lvbikgfSB9XG4gICAgICAgIHZhciByZXdyaXR0ZW5CaW5kaW5ncyA9IGtvLmV4cHJlc3Npb25SZXdyaXRpbmcucHJlUHJvY2Vzc0JpbmRpbmdzKGJpbmRpbmdzU3RyaW5nKSxcbiAgICAgICAgICAgIGZ1bmN0aW9uQm9keSA9IFwid2l0aCgkY29udGV4dCl7d2l0aCgkZGF0YXx8e30pe3JldHVybntcIiArIHJld3JpdHRlbkJpbmRpbmdzICsgXCJ9fX1cIjtcbiAgICAgICAgcmV0dXJuIG5ldyBGdW5jdGlvbihcIiRjb250ZXh0XCIsIFwiJGVsZW1lbnRcIiwgZnVuY3Rpb25Cb2R5KTtcbiAgICB9XG59KSgpO1xuXG5rby5leHBvcnRTeW1ib2woJ2JpbmRpbmdQcm92aWRlcicsIGtvLmJpbmRpbmdQcm92aWRlcik7XG4oZnVuY3Rpb24gKCkge1xuICAgIGtvLmJpbmRpbmdIYW5kbGVycyA9IHt9O1xuXG4gICAga28uYmluZGluZ0NvbnRleHQgPSBmdW5jdGlvbihkYXRhSXRlbSwgcGFyZW50QmluZGluZ0NvbnRleHQsIGRhdGFJdGVtQWxpYXMpIHtcbiAgICAgICAgaWYgKHBhcmVudEJpbmRpbmdDb250ZXh0KSB7XG4gICAgICAgICAgICBrby51dGlscy5leHRlbmQodGhpcywgcGFyZW50QmluZGluZ0NvbnRleHQpOyAvLyBJbmhlcml0ICRyb290IGFuZCBhbnkgY3VzdG9tIHByb3BlcnRpZXNcbiAgICAgICAgICAgIHRoaXNbJyRwYXJlbnRDb250ZXh0J10gPSBwYXJlbnRCaW5kaW5nQ29udGV4dDtcbiAgICAgICAgICAgIHRoaXNbJyRwYXJlbnQnXSA9IHBhcmVudEJpbmRpbmdDb250ZXh0WyckZGF0YSddO1xuICAgICAgICAgICAgdGhpc1snJHBhcmVudHMnXSA9IChwYXJlbnRCaW5kaW5nQ29udGV4dFsnJHBhcmVudHMnXSB8fCBbXSkuc2xpY2UoMCk7XG4gICAgICAgICAgICB0aGlzWyckcGFyZW50cyddLnVuc2hpZnQodGhpc1snJHBhcmVudCddKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXNbJyRwYXJlbnRzJ10gPSBbXTtcbiAgICAgICAgICAgIHRoaXNbJyRyb290J10gPSBkYXRhSXRlbTtcbiAgICAgICAgICAgIC8vIEV4cG9ydCAna28nIGluIHRoZSBiaW5kaW5nIGNvbnRleHQgc28gaXQgd2lsbCBiZSBhdmFpbGFibGUgaW4gYmluZGluZ3MgYW5kIHRlbXBsYXRlc1xuICAgICAgICAgICAgLy8gZXZlbiBpZiAna28nIGlzbid0IGV4cG9ydGVkIGFzIGEgZ2xvYmFsLCBzdWNoIGFzIHdoZW4gdXNpbmcgYW4gQU1EIGxvYWRlci5cbiAgICAgICAgICAgIC8vIFNlZSBodHRwczovL2dpdGh1Yi5jb20vU3RldmVTYW5kZXJzb24va25vY2tvdXQvaXNzdWVzLzQ5MFxuICAgICAgICAgICAgdGhpc1sna28nXSA9IGtvO1xuICAgICAgICB9XG4gICAgICAgIHRoaXNbJyRkYXRhJ10gPSBkYXRhSXRlbTtcbiAgICAgICAgaWYgKGRhdGFJdGVtQWxpYXMpXG4gICAgICAgICAgICB0aGlzW2RhdGFJdGVtQWxpYXNdID0gZGF0YUl0ZW07XG4gICAgfVxuICAgIGtvLmJpbmRpbmdDb250ZXh0LnByb3RvdHlwZVsnY3JlYXRlQ2hpbGRDb250ZXh0J10gPSBmdW5jdGlvbiAoZGF0YUl0ZW0sIGRhdGFJdGVtQWxpYXMpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBrby5iaW5kaW5nQ29udGV4dChkYXRhSXRlbSwgdGhpcywgZGF0YUl0ZW1BbGlhcyk7XG4gICAgfTtcbiAgICBrby5iaW5kaW5nQ29udGV4dC5wcm90b3R5cGVbJ2V4dGVuZCddID0gZnVuY3Rpb24ocHJvcGVydGllcykge1xuICAgICAgICB2YXIgY2xvbmUgPSBrby51dGlscy5leHRlbmQobmV3IGtvLmJpbmRpbmdDb250ZXh0KCksIHRoaXMpO1xuICAgICAgICByZXR1cm4ga28udXRpbHMuZXh0ZW5kKGNsb25lLCBwcm9wZXJ0aWVzKTtcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gdmFsaWRhdGVUaGF0QmluZGluZ0lzQWxsb3dlZEZvclZpcnR1YWxFbGVtZW50cyhiaW5kaW5nTmFtZSkge1xuICAgICAgICB2YXIgdmFsaWRhdG9yID0ga28udmlydHVhbEVsZW1lbnRzLmFsbG93ZWRCaW5kaW5nc1tiaW5kaW5nTmFtZV07XG4gICAgICAgIGlmICghdmFsaWRhdG9yKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVGhlIGJpbmRpbmcgJ1wiICsgYmluZGluZ05hbWUgKyBcIicgY2Fubm90IGJlIHVzZWQgd2l0aCB2aXJ0dWFsIGVsZW1lbnRzXCIpXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gYXBwbHlCaW5kaW5nc1RvRGVzY2VuZGFudHNJbnRlcm5hbCAodmlld01vZGVsLCBlbGVtZW50T3JWaXJ0dWFsRWxlbWVudCwgYmluZGluZ0NvbnRleHRzTWF5RGlmZmVyRnJvbURvbVBhcmVudEVsZW1lbnQpIHtcbiAgICAgICAgdmFyIGN1cnJlbnRDaGlsZCwgbmV4dEluUXVldWUgPSBrby52aXJ0dWFsRWxlbWVudHMuZmlyc3RDaGlsZChlbGVtZW50T3JWaXJ0dWFsRWxlbWVudCk7XG4gICAgICAgIHdoaWxlIChjdXJyZW50Q2hpbGQgPSBuZXh0SW5RdWV1ZSkge1xuICAgICAgICAgICAgLy8gS2VlcCBhIHJlY29yZCBvZiB0aGUgbmV4dCBjaGlsZCAqYmVmb3JlKiBhcHBseWluZyBiaW5kaW5ncywgaW4gY2FzZSB0aGUgYmluZGluZyByZW1vdmVzIHRoZSBjdXJyZW50IGNoaWxkIGZyb20gaXRzIHBvc2l0aW9uXG4gICAgICAgICAgICBuZXh0SW5RdWV1ZSA9IGtvLnZpcnR1YWxFbGVtZW50cy5uZXh0U2libGluZyhjdXJyZW50Q2hpbGQpO1xuICAgICAgICAgICAgYXBwbHlCaW5kaW5nc1RvTm9kZUFuZERlc2NlbmRhbnRzSW50ZXJuYWwodmlld01vZGVsLCBjdXJyZW50Q2hpbGQsIGJpbmRpbmdDb250ZXh0c01heURpZmZlckZyb21Eb21QYXJlbnRFbGVtZW50KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGFwcGx5QmluZGluZ3NUb05vZGVBbmREZXNjZW5kYW50c0ludGVybmFsICh2aWV3TW9kZWwsIG5vZGVWZXJpZmllZCwgYmluZGluZ0NvbnRleHRNYXlEaWZmZXJGcm9tRG9tUGFyZW50RWxlbWVudCkge1xuICAgICAgICB2YXIgc2hvdWxkQmluZERlc2NlbmRhbnRzID0gdHJ1ZTtcblxuICAgICAgICAvLyBQZXJmIG9wdGltaXNhdGlvbjogQXBwbHkgYmluZGluZ3Mgb25seSBpZi4uLlxuICAgICAgICAvLyAoMSkgV2UgbmVlZCB0byBzdG9yZSB0aGUgYmluZGluZyBjb250ZXh0IG9uIHRoaXMgbm9kZSAoYmVjYXVzZSBpdCBtYXkgZGlmZmVyIGZyb20gdGhlIERPTSBwYXJlbnQgbm9kZSdzIGJpbmRpbmcgY29udGV4dClcbiAgICAgICAgLy8gICAgIE5vdGUgdGhhdCB3ZSBjYW4ndCBzdG9yZSBiaW5kaW5nIGNvbnRleHRzIG9uIG5vbi1lbGVtZW50cyAoZS5nLiwgdGV4dCBub2RlcyksIGFzIElFIGRvZXNuJ3QgYWxsb3cgZXhwYW5kbyBwcm9wZXJ0aWVzIGZvciB0aG9zZVxuICAgICAgICAvLyAoMikgSXQgbWlnaHQgaGF2ZSBiaW5kaW5ncyAoZS5nLiwgaXQgaGFzIGEgZGF0YS1iaW5kIGF0dHJpYnV0ZSwgb3IgaXQncyBhIG1hcmtlciBmb3IgYSBjb250YWluZXJsZXNzIHRlbXBsYXRlKVxuICAgICAgICB2YXIgaXNFbGVtZW50ID0gKG5vZGVWZXJpZmllZC5ub2RlVHlwZSA9PT0gMSk7XG4gICAgICAgIGlmIChpc0VsZW1lbnQpIC8vIFdvcmthcm91bmQgSUUgPD0gOCBIVE1MIHBhcnNpbmcgd2VpcmRuZXNzXG4gICAgICAgICAgICBrby52aXJ0dWFsRWxlbWVudHMubm9ybWFsaXNlVmlydHVhbEVsZW1lbnREb21TdHJ1Y3R1cmUobm9kZVZlcmlmaWVkKTtcblxuICAgICAgICB2YXIgc2hvdWxkQXBwbHlCaW5kaW5ncyA9IChpc0VsZW1lbnQgJiYgYmluZGluZ0NvbnRleHRNYXlEaWZmZXJGcm9tRG9tUGFyZW50RWxlbWVudCkgICAgICAgICAgICAgLy8gQ2FzZSAoMSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8fCBrby5iaW5kaW5nUHJvdmlkZXJbJ2luc3RhbmNlJ11bJ25vZGVIYXNCaW5kaW5ncyddKG5vZGVWZXJpZmllZCk7ICAgICAgIC8vIENhc2UgKDIpXG4gICAgICAgIGlmIChzaG91bGRBcHBseUJpbmRpbmdzKVxuICAgICAgICAgICAgc2hvdWxkQmluZERlc2NlbmRhbnRzID0gYXBwbHlCaW5kaW5nc1RvTm9kZUludGVybmFsKG5vZGVWZXJpZmllZCwgbnVsbCwgdmlld01vZGVsLCBiaW5kaW5nQ29udGV4dE1heURpZmZlckZyb21Eb21QYXJlbnRFbGVtZW50KS5zaG91bGRCaW5kRGVzY2VuZGFudHM7XG5cbiAgICAgICAgaWYgKHNob3VsZEJpbmREZXNjZW5kYW50cykge1xuICAgICAgICAgICAgLy8gV2UncmUgcmVjdXJzaW5nIGF1dG9tYXRpY2FsbHkgaW50byAocmVhbCBvciB2aXJ0dWFsKSBjaGlsZCBub2RlcyB3aXRob3V0IGNoYW5naW5nIGJpbmRpbmcgY29udGV4dHMuIFNvLFxuICAgICAgICAgICAgLy8gICogRm9yIGNoaWxkcmVuIG9mIGEgKnJlYWwqIGVsZW1lbnQsIHRoZSBiaW5kaW5nIGNvbnRleHQgaXMgY2VydGFpbmx5IHRoZSBzYW1lIGFzIG9uIHRoZWlyIERPTSAucGFyZW50Tm9kZSxcbiAgICAgICAgICAgIC8vICAgIGhlbmNlIGJpbmRpbmdDb250ZXh0c01heURpZmZlckZyb21Eb21QYXJlbnRFbGVtZW50IGlzIGZhbHNlXG4gICAgICAgICAgICAvLyAgKiBGb3IgY2hpbGRyZW4gb2YgYSAqdmlydHVhbCogZWxlbWVudCwgd2UgY2FuJ3QgYmUgc3VyZS4gRXZhbHVhdGluZyAucGFyZW50Tm9kZSBvbiB0aG9zZSBjaGlsZHJlbiBtYXlcbiAgICAgICAgICAgIC8vICAgIHNraXAgb3ZlciBhbnkgbnVtYmVyIG9mIGludGVybWVkaWF0ZSB2aXJ0dWFsIGVsZW1lbnRzLCBhbnkgb2Ygd2hpY2ggbWlnaHQgZGVmaW5lIGEgY3VzdG9tIGJpbmRpbmcgY29udGV4dCxcbiAgICAgICAgICAgIC8vICAgIGhlbmNlIGJpbmRpbmdDb250ZXh0c01heURpZmZlckZyb21Eb21QYXJlbnRFbGVtZW50IGlzIHRydWVcbiAgICAgICAgICAgIGFwcGx5QmluZGluZ3NUb0Rlc2NlbmRhbnRzSW50ZXJuYWwodmlld01vZGVsLCBub2RlVmVyaWZpZWQsIC8qIGJpbmRpbmdDb250ZXh0c01heURpZmZlckZyb21Eb21QYXJlbnRFbGVtZW50OiAqLyAhaXNFbGVtZW50KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHZhciBib3VuZEVsZW1lbnREb21EYXRhS2V5ID0gJ19fa29fYm91bmRFbGVtZW50JztcbiAgICBmdW5jdGlvbiBhcHBseUJpbmRpbmdzVG9Ob2RlSW50ZXJuYWwgKG5vZGUsIGJpbmRpbmdzLCB2aWV3TW9kZWxPckJpbmRpbmdDb250ZXh0LCBiaW5kaW5nQ29udGV4dE1heURpZmZlckZyb21Eb21QYXJlbnRFbGVtZW50KSB7XG4gICAgICAgIC8vIE5lZWQgdG8gYmUgc3VyZSB0aGF0IGluaXRzIGFyZSBvbmx5IHJ1biBvbmNlLCBhbmQgdXBkYXRlcyBuZXZlciBydW4gdW50aWwgYWxsIHRoZSBpbml0cyBoYXZlIGJlZW4gcnVuXG4gICAgICAgIHZhciBpbml0UGhhc2UgPSAwOyAvLyAwID0gYmVmb3JlIGFsbCBpbml0cywgMSA9IGR1cmluZyBpbml0cywgMiA9IGFmdGVyIGFsbCBpbml0c1xuXG4gICAgICAgIC8vIEVhY2ggdGltZSB0aGUgZGVwZW5kZW50T2JzZXJ2YWJsZSBpcyBldmFsdWF0ZWQgKGFmdGVyIGRhdGEgY2hhbmdlcyksXG4gICAgICAgIC8vIHRoZSBiaW5kaW5nIGF0dHJpYnV0ZSBpcyByZXBhcnNlZCBzbyB0aGF0IGl0IGNhbiBwaWNrIG91dCB0aGUgY29ycmVjdFxuICAgICAgICAvLyBtb2RlbCBwcm9wZXJ0aWVzIGluIHRoZSBjb250ZXh0IG9mIHRoZSBjaGFuZ2VkIGRhdGEuXG4gICAgICAgIC8vIERPTSBldmVudCBjYWxsYmFja3MgbmVlZCB0byBiZSBhYmxlIHRvIGFjY2VzcyB0aGlzIGNoYW5nZWQgZGF0YSxcbiAgICAgICAgLy8gc28gd2UgbmVlZCBhIHNpbmdsZSBwYXJzZWRCaW5kaW5ncyB2YXJpYWJsZSAoc2hhcmVkIGJ5IGFsbCBjYWxsYmFja3NcbiAgICAgICAgLy8gYXNzb2NpYXRlZCB3aXRoIHRoaXMgbm9kZSdzIGJpbmRpbmdzKSB0aGF0IGFsbCB0aGUgY2xvc3VyZXMgY2FuIGFjY2Vzcy5cbiAgICAgICAgdmFyIHBhcnNlZEJpbmRpbmdzO1xuICAgICAgICBmdW5jdGlvbiBtYWtlVmFsdWVBY2Nlc3NvcihiaW5kaW5nS2V5KSB7XG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkgeyByZXR1cm4gcGFyc2VkQmluZGluZ3NbYmluZGluZ0tleV0gfVxuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIHBhcnNlZEJpbmRpbmdzQWNjZXNzb3IoKSB7XG4gICAgICAgICAgICByZXR1cm4gcGFyc2VkQmluZGluZ3M7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgYmluZGluZ0hhbmRsZXJUaGF0Q29udHJvbHNEZXNjZW5kYW50QmluZGluZ3M7XG5cbiAgICAgICAgLy8gUHJldmVudCBtdWx0aXBsZSBhcHBseUJpbmRpbmdzIGNhbGxzIGZvciB0aGUgc2FtZSBub2RlLCBleGNlcHQgd2hlbiBhIGJpbmRpbmcgdmFsdWUgaXMgc3BlY2lmaWVkXG4gICAgICAgIHZhciBhbHJlYWR5Qm91bmQgPSBrby51dGlscy5kb21EYXRhLmdldChub2RlLCBib3VuZEVsZW1lbnREb21EYXRhS2V5KTtcbiAgICAgICAgaWYgKCFiaW5kaW5ncykge1xuICAgICAgICAgICAgaWYgKGFscmVhZHlCb3VuZCkge1xuICAgICAgICAgICAgICAgIHRocm93IEVycm9yKFwiWW91IGNhbm5vdCBhcHBseSBiaW5kaW5ncyBtdWx0aXBsZSB0aW1lcyB0byB0aGUgc2FtZSBlbGVtZW50LlwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGtvLnV0aWxzLmRvbURhdGEuc2V0KG5vZGUsIGJvdW5kRWxlbWVudERvbURhdGFLZXksIHRydWUpO1xuICAgICAgICB9XG5cbiAgICAgICAga28uZGVwZW5kZW50T2JzZXJ2YWJsZShcbiAgICAgICAgICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAvLyBFbnN1cmUgd2UgaGF2ZSBhIG5vbm51bGwgYmluZGluZyBjb250ZXh0IHRvIHdvcmsgd2l0aFxuICAgICAgICAgICAgICAgIHZhciBiaW5kaW5nQ29udGV4dEluc3RhbmNlID0gdmlld01vZGVsT3JCaW5kaW5nQ29udGV4dCAmJiAodmlld01vZGVsT3JCaW5kaW5nQ29udGV4dCBpbnN0YW5jZW9mIGtvLmJpbmRpbmdDb250ZXh0KVxuICAgICAgICAgICAgICAgICAgICA/IHZpZXdNb2RlbE9yQmluZGluZ0NvbnRleHRcbiAgICAgICAgICAgICAgICAgICAgOiBuZXcga28uYmluZGluZ0NvbnRleHQoa28udXRpbHMudW53cmFwT2JzZXJ2YWJsZSh2aWV3TW9kZWxPckJpbmRpbmdDb250ZXh0KSk7XG4gICAgICAgICAgICAgICAgdmFyIHZpZXdNb2RlbCA9IGJpbmRpbmdDb250ZXh0SW5zdGFuY2VbJyRkYXRhJ107XG5cbiAgICAgICAgICAgICAgICAvLyBPcHRpbWl6YXRpb246IERvbid0IHN0b3JlIHRoZSBiaW5kaW5nIGNvbnRleHQgb24gdGhpcyBub2RlIGlmIGl0J3MgZGVmaW5pdGVseSB0aGUgc2FtZSBhcyBvbiBub2RlLnBhcmVudE5vZGUsIGJlY2F1c2VcbiAgICAgICAgICAgICAgICAvLyB3ZSBjYW4gZWFzaWx5IHJlY292ZXIgaXQganVzdCBieSBzY2FubmluZyB1cCB0aGUgbm9kZSdzIGFuY2VzdG9ycyBpbiB0aGUgRE9NXG4gICAgICAgICAgICAgICAgLy8gKG5vdGU6IGhlcmUsIHBhcmVudCBub2RlIG1lYW5zIFwicmVhbCBET00gcGFyZW50XCIgbm90IFwidmlydHVhbCBwYXJlbnRcIiwgYXMgdGhlcmUncyBubyBPKDEpIHdheSB0byBmaW5kIHRoZSB2aXJ0dWFsIHBhcmVudClcbiAgICAgICAgICAgICAgICBpZiAoIWFscmVhZHlCb3VuZCAmJiBiaW5kaW5nQ29udGV4dE1heURpZmZlckZyb21Eb21QYXJlbnRFbGVtZW50KVxuICAgICAgICAgICAgICAgICAgICBrby5zdG9yZWRCaW5kaW5nQ29udGV4dEZvck5vZGUobm9kZSwgYmluZGluZ0NvbnRleHRJbnN0YW5jZSk7XG5cbiAgICAgICAgICAgICAgICAvLyBVc2UgZXZhbHVhdGVkQmluZGluZ3MgaWYgZ2l2ZW4sIG90aGVyd2lzZSBmYWxsIGJhY2sgb24gYXNraW5nIHRoZSBiaW5kaW5ncyBwcm92aWRlciB0byBnaXZlIHVzIHNvbWUgYmluZGluZ3NcbiAgICAgICAgICAgICAgICB2YXIgZXZhbHVhdGVkQmluZGluZ3MgPSAodHlwZW9mIGJpbmRpbmdzID09IFwiZnVuY3Rpb25cIikgPyBiaW5kaW5ncyhiaW5kaW5nQ29udGV4dEluc3RhbmNlLCBub2RlKSA6IGJpbmRpbmdzO1xuICAgICAgICAgICAgICAgIHBhcnNlZEJpbmRpbmdzID0gZXZhbHVhdGVkQmluZGluZ3MgfHwga28uYmluZGluZ1Byb3ZpZGVyWydpbnN0YW5jZSddWydnZXRCaW5kaW5ncyddKG5vZGUsIGJpbmRpbmdDb250ZXh0SW5zdGFuY2UpO1xuXG4gICAgICAgICAgICAgICAgaWYgKHBhcnNlZEJpbmRpbmdzKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEZpcnN0IHJ1biBhbGwgdGhlIGluaXRzLCBzbyBiaW5kaW5ncyBjYW4gcmVnaXN0ZXIgZm9yIG5vdGlmaWNhdGlvbiBvbiBjaGFuZ2VzXG4gICAgICAgICAgICAgICAgICAgIGlmIChpbml0UGhhc2UgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluaXRQaGFzZSA9IDE7XG4gICAgICAgICAgICAgICAgICAgICAgICBrby51dGlscy5vYmplY3RGb3JFYWNoKHBhcnNlZEJpbmRpbmdzLCBmdW5jdGlvbihiaW5kaW5nS2V5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGJpbmRpbmcgPSBrby5iaW5kaW5nSGFuZGxlcnNbYmluZGluZ0tleV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGJpbmRpbmcgJiYgbm9kZS5ub2RlVHlwZSA9PT0gOClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsaWRhdGVUaGF0QmluZGluZ0lzQWxsb3dlZEZvclZpcnR1YWxFbGVtZW50cyhiaW5kaW5nS2V5KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChiaW5kaW5nICYmIHR5cGVvZiBiaW5kaW5nW1wiaW5pdFwiXSA9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGhhbmRsZXJJbml0Rm4gPSBiaW5kaW5nW1wiaW5pdFwiXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGluaXRSZXN1bHQgPSBoYW5kbGVySW5pdEZuKG5vZGUsIG1ha2VWYWx1ZUFjY2Vzc29yKGJpbmRpbmdLZXkpLCBwYXJzZWRCaW5kaW5nc0FjY2Vzc29yLCB2aWV3TW9kZWwsIGJpbmRpbmdDb250ZXh0SW5zdGFuY2UpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIElmIHRoaXMgYmluZGluZyBoYW5kbGVyIGNsYWltcyB0byBjb250cm9sIGRlc2NlbmRhbnQgYmluZGluZ3MsIG1ha2UgYSBub3RlIG9mIHRoaXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGluaXRSZXN1bHQgJiYgaW5pdFJlc3VsdFsnY29udHJvbHNEZXNjZW5kYW50QmluZGluZ3MnXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGJpbmRpbmdIYW5kbGVyVGhhdENvbnRyb2xzRGVzY2VuZGFudEJpbmRpbmdzICE9PSB1bmRlZmluZWQpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTXVsdGlwbGUgYmluZGluZ3MgKFwiICsgYmluZGluZ0hhbmRsZXJUaGF0Q29udHJvbHNEZXNjZW5kYW50QmluZGluZ3MgKyBcIiBhbmQgXCIgKyBiaW5kaW5nS2V5ICsgXCIpIGFyZSB0cnlpbmcgdG8gY29udHJvbCBkZXNjZW5kYW50IGJpbmRpbmdzIG9mIHRoZSBzYW1lIGVsZW1lbnQuIFlvdSBjYW5ub3QgdXNlIHRoZXNlIGJpbmRpbmdzIHRvZ2V0aGVyIG9uIHRoZSBzYW1lIGVsZW1lbnQuXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYmluZGluZ0hhbmRsZXJUaGF0Q29udHJvbHNEZXNjZW5kYW50QmluZGluZ3MgPSBiaW5kaW5nS2V5O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbml0UGhhc2UgPSAyO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gLi4uIHRoZW4gcnVuIGFsbCB0aGUgdXBkYXRlcywgd2hpY2ggbWlnaHQgdHJpZ2dlciBjaGFuZ2VzIGV2ZW4gb24gdGhlIGZpcnN0IGV2YWx1YXRpb25cbiAgICAgICAgICAgICAgICAgICAgaWYgKGluaXRQaGFzZSA9PT0gMikge1xuICAgICAgICAgICAgICAgICAgICAgICAga28udXRpbHMub2JqZWN0Rm9yRWFjaChwYXJzZWRCaW5kaW5ncywgZnVuY3Rpb24oYmluZGluZ0tleSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBiaW5kaW5nID0ga28uYmluZGluZ0hhbmRsZXJzW2JpbmRpbmdLZXldO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChiaW5kaW5nICYmIHR5cGVvZiBiaW5kaW5nW1widXBkYXRlXCJdID09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgaGFuZGxlclVwZGF0ZUZuID0gYmluZGluZ1tcInVwZGF0ZVwiXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaGFuZGxlclVwZGF0ZUZuKG5vZGUsIG1ha2VWYWx1ZUFjY2Vzc29yKGJpbmRpbmdLZXkpLCBwYXJzZWRCaW5kaW5nc0FjY2Vzc29yLCB2aWV3TW9kZWwsIGJpbmRpbmdDb250ZXh0SW5zdGFuY2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG51bGwsXG4gICAgICAgICAgICB7IGRpc3Bvc2VXaGVuTm9kZUlzUmVtb3ZlZCA6IG5vZGUgfVxuICAgICAgICApO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzaG91bGRCaW5kRGVzY2VuZGFudHM6IGJpbmRpbmdIYW5kbGVyVGhhdENvbnRyb2xzRGVzY2VuZGFudEJpbmRpbmdzID09PSB1bmRlZmluZWRcbiAgICAgICAgfTtcbiAgICB9O1xuXG4gICAgdmFyIHN0b3JlZEJpbmRpbmdDb250ZXh0RG9tRGF0YUtleSA9IFwiX19rb19iaW5kaW5nQ29udGV4dF9fXCI7XG4gICAga28uc3RvcmVkQmluZGluZ0NvbnRleHRGb3JOb2RlID0gZnVuY3Rpb24gKG5vZGUsIGJpbmRpbmdDb250ZXh0KSB7XG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09IDIpXG4gICAgICAgICAgICBrby51dGlscy5kb21EYXRhLnNldChub2RlLCBzdG9yZWRCaW5kaW5nQ29udGV4dERvbURhdGFLZXksIGJpbmRpbmdDb250ZXh0KTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgcmV0dXJuIGtvLnV0aWxzLmRvbURhdGEuZ2V0KG5vZGUsIHN0b3JlZEJpbmRpbmdDb250ZXh0RG9tRGF0YUtleSk7XG4gICAgfVxuXG4gICAga28uYXBwbHlCaW5kaW5nc1RvTm9kZSA9IGZ1bmN0aW9uIChub2RlLCBiaW5kaW5ncywgdmlld01vZGVsKSB7XG4gICAgICAgIGlmIChub2RlLm5vZGVUeXBlID09PSAxKSAvLyBJZiBpdCdzIGFuIGVsZW1lbnQsIHdvcmthcm91bmQgSUUgPD0gOCBIVE1MIHBhcnNpbmcgd2VpcmRuZXNzXG4gICAgICAgICAgICBrby52aXJ0dWFsRWxlbWVudHMubm9ybWFsaXNlVmlydHVhbEVsZW1lbnREb21TdHJ1Y3R1cmUobm9kZSk7XG4gICAgICAgIHJldHVybiBhcHBseUJpbmRpbmdzVG9Ob2RlSW50ZXJuYWwobm9kZSwgYmluZGluZ3MsIHZpZXdNb2RlbCwgdHJ1ZSk7XG4gICAgfTtcblxuICAgIGtvLmFwcGx5QmluZGluZ3NUb0Rlc2NlbmRhbnRzID0gZnVuY3Rpb24odmlld01vZGVsLCByb290Tm9kZSkge1xuICAgICAgICBpZiAocm9vdE5vZGUubm9kZVR5cGUgPT09IDEgfHwgcm9vdE5vZGUubm9kZVR5cGUgPT09IDgpXG4gICAgICAgICAgICBhcHBseUJpbmRpbmdzVG9EZXNjZW5kYW50c0ludGVybmFsKHZpZXdNb2RlbCwgcm9vdE5vZGUsIHRydWUpO1xuICAgIH07XG5cbiAgICBrby5hcHBseUJpbmRpbmdzID0gZnVuY3Rpb24gKHZpZXdNb2RlbCwgcm9vdE5vZGUpIHtcbiAgICAgICAgaWYgKHJvb3ROb2RlICYmIChyb290Tm9kZS5ub2RlVHlwZSAhPT0gMSkgJiYgKHJvb3ROb2RlLm5vZGVUeXBlICE9PSA4KSlcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcImtvLmFwcGx5QmluZGluZ3M6IGZpcnN0IHBhcmFtZXRlciBzaG91bGQgYmUgeW91ciB2aWV3IG1vZGVsOyBzZWNvbmQgcGFyYW1ldGVyIHNob3VsZCBiZSBhIERPTSBub2RlXCIpO1xuICAgICAgICByb290Tm9kZSA9IHJvb3ROb2RlIHx8IHdpbmRvdy5kb2N1bWVudC5ib2R5OyAvLyBNYWtlIFwicm9vdE5vZGVcIiBwYXJhbWV0ZXIgb3B0aW9uYWxcblxuICAgICAgICBhcHBseUJpbmRpbmdzVG9Ob2RlQW5kRGVzY2VuZGFudHNJbnRlcm5hbCh2aWV3TW9kZWwsIHJvb3ROb2RlLCB0cnVlKTtcbiAgICB9O1xuXG4gICAgLy8gUmV0cmlldmluZyBiaW5kaW5nIGNvbnRleHQgZnJvbSBhcmJpdHJhcnkgbm9kZXNcbiAgICBrby5jb250ZXh0Rm9yID0gZnVuY3Rpb24obm9kZSkge1xuICAgICAgICAvLyBXZSBjYW4gb25seSBkbyBzb21ldGhpbmcgbWVhbmluZ2Z1bCBmb3IgZWxlbWVudHMgYW5kIGNvbW1lbnQgbm9kZXMgKGluIHBhcnRpY3VsYXIsIG5vdCB0ZXh0IG5vZGVzLCBhcyBJRSBjYW4ndCBzdG9yZSBkb21kYXRhIGZvciB0aGVtKVxuICAgICAgICBzd2l0Y2ggKG5vZGUubm9kZVR5cGUpIHtcbiAgICAgICAgICAgIGNhc2UgMTpcbiAgICAgICAgICAgIGNhc2UgODpcbiAgICAgICAgICAgICAgICB2YXIgY29udGV4dCA9IGtvLnN0b3JlZEJpbmRpbmdDb250ZXh0Rm9yTm9kZShub2RlKTtcbiAgICAgICAgICAgICAgICBpZiAoY29udGV4dCkgcmV0dXJuIGNvbnRleHQ7XG4gICAgICAgICAgICAgICAgaWYgKG5vZGUucGFyZW50Tm9kZSkgcmV0dXJuIGtvLmNvbnRleHRGb3Iobm9kZS5wYXJlbnROb2RlKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH07XG4gICAga28uZGF0YUZvciA9IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgICAgdmFyIGNvbnRleHQgPSBrby5jb250ZXh0Rm9yKG5vZGUpO1xuICAgICAgICByZXR1cm4gY29udGV4dCA/IGNvbnRleHRbJyRkYXRhJ10gOiB1bmRlZmluZWQ7XG4gICAgfTtcblxuICAgIGtvLmV4cG9ydFN5bWJvbCgnYmluZGluZ0hhbmRsZXJzJywga28uYmluZGluZ0hhbmRsZXJzKTtcbiAgICBrby5leHBvcnRTeW1ib2woJ2FwcGx5QmluZGluZ3MnLCBrby5hcHBseUJpbmRpbmdzKTtcbiAgICBrby5leHBvcnRTeW1ib2woJ2FwcGx5QmluZGluZ3NUb0Rlc2NlbmRhbnRzJywga28uYXBwbHlCaW5kaW5nc1RvRGVzY2VuZGFudHMpO1xuICAgIGtvLmV4cG9ydFN5bWJvbCgnYXBwbHlCaW5kaW5nc1RvTm9kZScsIGtvLmFwcGx5QmluZGluZ3NUb05vZGUpO1xuICAgIGtvLmV4cG9ydFN5bWJvbCgnY29udGV4dEZvcicsIGtvLmNvbnRleHRGb3IpO1xuICAgIGtvLmV4cG9ydFN5bWJvbCgnZGF0YUZvcicsIGtvLmRhdGFGb3IpO1xufSkoKTtcbnZhciBhdHRySHRtbFRvSmF2YXNjcmlwdE1hcCA9IHsgJ2NsYXNzJzogJ2NsYXNzTmFtZScsICdmb3InOiAnaHRtbEZvcicgfTtcbmtvLmJpbmRpbmdIYW5kbGVyc1snYXR0ciddID0ge1xuICAgICd1cGRhdGUnOiBmdW5jdGlvbihlbGVtZW50LCB2YWx1ZUFjY2Vzc29yLCBhbGxCaW5kaW5nc0FjY2Vzc29yKSB7XG4gICAgICAgIHZhciB2YWx1ZSA9IGtvLnV0aWxzLnVud3JhcE9ic2VydmFibGUodmFsdWVBY2Nlc3NvcigpKSB8fCB7fTtcbiAgICAgICAga28udXRpbHMub2JqZWN0Rm9yRWFjaCh2YWx1ZSwgZnVuY3Rpb24oYXR0ck5hbWUsIGF0dHJWYWx1ZSkge1xuICAgICAgICAgICAgYXR0clZhbHVlID0ga28udXRpbHMudW53cmFwT2JzZXJ2YWJsZShhdHRyVmFsdWUpO1xuXG4gICAgICAgICAgICAvLyBUbyBjb3ZlciBjYXNlcyBsaWtlIFwiYXR0cjogeyBjaGVja2VkOnNvbWVQcm9wIH1cIiwgd2Ugd2FudCB0byByZW1vdmUgdGhlIGF0dHJpYnV0ZSBlbnRpcmVseVxuICAgICAgICAgICAgLy8gd2hlbiBzb21lUHJvcCBpcyBhIFwibm8gdmFsdWVcIi1saWtlIHZhbHVlIChzdHJpY3RseSBudWxsLCBmYWxzZSwgb3IgdW5kZWZpbmVkKVxuICAgICAgICAgICAgLy8gKGJlY2F1c2UgdGhlIGFic2VuY2Ugb2YgdGhlIFwiY2hlY2tlZFwiIGF0dHIgaXMgaG93IHRvIG1hcmsgYW4gZWxlbWVudCBhcyBub3QgY2hlY2tlZCwgZXRjLilcbiAgICAgICAgICAgIHZhciB0b1JlbW92ZSA9IChhdHRyVmFsdWUgPT09IGZhbHNlKSB8fCAoYXR0clZhbHVlID09PSBudWxsKSB8fCAoYXR0clZhbHVlID09PSB1bmRlZmluZWQpO1xuICAgICAgICAgICAgaWYgKHRvUmVtb3ZlKVxuICAgICAgICAgICAgICAgIGVsZW1lbnQucmVtb3ZlQXR0cmlidXRlKGF0dHJOYW1lKTtcblxuICAgICAgICAgICAgLy8gSW4gSUUgPD0gNyBhbmQgSUU4IFF1aXJrcyBNb2RlLCB5b3UgaGF2ZSB0byB1c2UgdGhlIEphdmFzY3JpcHQgcHJvcGVydHkgbmFtZSBpbnN0ZWFkIG9mIHRoZVxuICAgICAgICAgICAgLy8gSFRNTCBhdHRyaWJ1dGUgbmFtZSBmb3IgY2VydGFpbiBhdHRyaWJ1dGVzLiBJRTggU3RhbmRhcmRzIE1vZGUgc3VwcG9ydHMgdGhlIGNvcnJlY3QgYmVoYXZpb3IsXG4gICAgICAgICAgICAvLyBidXQgaW5zdGVhZCBvZiBmaWd1cmluZyBvdXQgdGhlIG1vZGUsIHdlJ2xsIGp1c3Qgc2V0IHRoZSBhdHRyaWJ1dGUgdGhyb3VnaCB0aGUgSmF2YXNjcmlwdFxuICAgICAgICAgICAgLy8gcHJvcGVydHkgZm9yIElFIDw9IDguXG4gICAgICAgICAgICBpZiAoa28udXRpbHMuaWVWZXJzaW9uIDw9IDggJiYgYXR0ck5hbWUgaW4gYXR0ckh0bWxUb0phdmFzY3JpcHRNYXApIHtcbiAgICAgICAgICAgICAgICBhdHRyTmFtZSA9IGF0dHJIdG1sVG9KYXZhc2NyaXB0TWFwW2F0dHJOYW1lXTtcbiAgICAgICAgICAgICAgICBpZiAodG9SZW1vdmUpXG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnQucmVtb3ZlQXR0cmlidXRlKGF0dHJOYW1lKTtcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnRbYXR0ck5hbWVdID0gYXR0clZhbHVlO1xuICAgICAgICAgICAgfSBlbHNlIGlmICghdG9SZW1vdmUpIHtcbiAgICAgICAgICAgICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZShhdHRyTmFtZSwgYXR0clZhbHVlLnRvU3RyaW5nKCkpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBUcmVhdCBcIm5hbWVcIiBzcGVjaWFsbHkgLSBhbHRob3VnaCB5b3UgY2FuIHRoaW5rIG9mIGl0IGFzIGFuIGF0dHJpYnV0ZSwgaXQgYWxzbyBuZWVkc1xuICAgICAgICAgICAgLy8gc3BlY2lhbCBoYW5kbGluZyBvbiBvbGRlciB2ZXJzaW9ucyBvZiBJRSAoaHR0cHM6Ly9naXRodWIuY29tL1N0ZXZlU2FuZGVyc29uL2tub2Nrb3V0L3B1bGwvMzMzKVxuICAgICAgICAgICAgLy8gRGVsaWJlcmF0ZWx5IGJlaW5nIGNhc2Utc2Vuc2l0aXZlIGhlcmUgYmVjYXVzZSBYSFRNTCB3b3VsZCByZWdhcmQgXCJOYW1lXCIgYXMgYSBkaWZmZXJlbnQgdGhpbmdcbiAgICAgICAgICAgIC8vIGVudGlyZWx5LCBhbmQgdGhlcmUncyBubyBzdHJvbmcgcmVhc29uIHRvIGFsbG93IGZvciBzdWNoIGNhc2luZyBpbiBIVE1MLlxuICAgICAgICAgICAgaWYgKGF0dHJOYW1lID09PSBcIm5hbWVcIikge1xuICAgICAgICAgICAgICAgIGtvLnV0aWxzLnNldEVsZW1lbnROYW1lKGVsZW1lbnQsIHRvUmVtb3ZlID8gXCJcIiA6IGF0dHJWYWx1ZS50b1N0cmluZygpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxufTtcbmtvLmJpbmRpbmdIYW5kbGVyc1snY2hlY2tlZCddID0ge1xuICAgICdpbml0JzogZnVuY3Rpb24gKGVsZW1lbnQsIHZhbHVlQWNjZXNzb3IsIGFsbEJpbmRpbmdzQWNjZXNzb3IpIHtcbiAgICAgICAgdmFyIHVwZGF0ZUhhbmRsZXIgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciB2YWx1ZVRvV3JpdGU7XG4gICAgICAgICAgICBpZiAoZWxlbWVudC50eXBlID09IFwiY2hlY2tib3hcIikge1xuICAgICAgICAgICAgICAgIHZhbHVlVG9Xcml0ZSA9IGVsZW1lbnQuY2hlY2tlZDtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoKGVsZW1lbnQudHlwZSA9PSBcInJhZGlvXCIpICYmIChlbGVtZW50LmNoZWNrZWQpKSB7XG4gICAgICAgICAgICAgICAgdmFsdWVUb1dyaXRlID0gZWxlbWVudC52YWx1ZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuOyAvLyBcImNoZWNrZWRcIiBiaW5kaW5nIG9ubHkgcmVzcG9uZHMgdG8gY2hlY2tib3hlcyBhbmQgc2VsZWN0ZWQgcmFkaW8gYnV0dG9uc1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgbW9kZWxWYWx1ZSA9IHZhbHVlQWNjZXNzb3IoKSwgdW53cmFwcGVkVmFsdWUgPSBrby51dGlscy51bndyYXBPYnNlcnZhYmxlKG1vZGVsVmFsdWUpO1xuICAgICAgICAgICAgaWYgKChlbGVtZW50LnR5cGUgPT0gXCJjaGVja2JveFwiKSAmJiAodW53cmFwcGVkVmFsdWUgaW5zdGFuY2VvZiBBcnJheSkpIHtcbiAgICAgICAgICAgICAgICAvLyBGb3IgY2hlY2tib3hlcyBib3VuZCB0byBhbiBhcnJheSwgd2UgYWRkL3JlbW92ZSB0aGUgY2hlY2tib3ggdmFsdWUgdG8gdGhhdCBhcnJheVxuICAgICAgICAgICAgICAgIC8vIFRoaXMgd29ya3MgZm9yIGJvdGggb2JzZXJ2YWJsZSBhbmQgbm9uLW9ic2VydmFibGUgYXJyYXlzXG4gICAgICAgICAgICAgICAga28udXRpbHMuYWRkT3JSZW1vdmVJdGVtKG1vZGVsVmFsdWUsIGVsZW1lbnQudmFsdWUsIGVsZW1lbnQuY2hlY2tlZCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGtvLmV4cHJlc3Npb25SZXdyaXRpbmcud3JpdGVWYWx1ZVRvUHJvcGVydHkobW9kZWxWYWx1ZSwgYWxsQmluZGluZ3NBY2Nlc3NvciwgJ2NoZWNrZWQnLCB2YWx1ZVRvV3JpdGUsIHRydWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBrby51dGlscy5yZWdpc3RlckV2ZW50SGFuZGxlcihlbGVtZW50LCBcImNsaWNrXCIsIHVwZGF0ZUhhbmRsZXIpO1xuXG4gICAgICAgIC8vIElFIDYgd29uJ3QgYWxsb3cgcmFkaW8gYnV0dG9ucyB0byBiZSBzZWxlY3RlZCB1bmxlc3MgdGhleSBoYXZlIGEgbmFtZVxuICAgICAgICBpZiAoKGVsZW1lbnQudHlwZSA9PSBcInJhZGlvXCIpICYmICFlbGVtZW50Lm5hbWUpXG4gICAgICAgICAgICBrby5iaW5kaW5nSGFuZGxlcnNbJ3VuaXF1ZU5hbWUnXVsnaW5pdCddKGVsZW1lbnQsIGZ1bmN0aW9uKCkgeyByZXR1cm4gdHJ1ZSB9KTtcbiAgICB9LFxuICAgICd1cGRhdGUnOiBmdW5jdGlvbiAoZWxlbWVudCwgdmFsdWVBY2Nlc3Nvcikge1xuICAgICAgICB2YXIgdmFsdWUgPSBrby51dGlscy51bndyYXBPYnNlcnZhYmxlKHZhbHVlQWNjZXNzb3IoKSk7XG5cbiAgICAgICAgaWYgKGVsZW1lbnQudHlwZSA9PSBcImNoZWNrYm94XCIpIHtcbiAgICAgICAgICAgIGlmICh2YWx1ZSBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAgICAgICAgICAgLy8gV2hlbiBib3VuZCB0byBhbiBhcnJheSwgdGhlIGNoZWNrYm94IGJlaW5nIGNoZWNrZWQgcmVwcmVzZW50cyBpdHMgdmFsdWUgYmVpbmcgcHJlc2VudCBpbiB0aGF0IGFycmF5XG4gICAgICAgICAgICAgICAgZWxlbWVudC5jaGVja2VkID0ga28udXRpbHMuYXJyYXlJbmRleE9mKHZhbHVlLCBlbGVtZW50LnZhbHVlKSA+PSAwO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBXaGVuIGJvdW5kIHRvIGFueSBvdGhlciB2YWx1ZSAobm90IGFuIGFycmF5KSwgdGhlIGNoZWNrYm94IGJlaW5nIGNoZWNrZWQgcmVwcmVzZW50cyB0aGUgdmFsdWUgYmVpbmcgdHJ1ZWlzaFxuICAgICAgICAgICAgICAgIGVsZW1lbnQuY2hlY2tlZCA9IHZhbHVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKGVsZW1lbnQudHlwZSA9PSBcInJhZGlvXCIpIHtcbiAgICAgICAgICAgIGVsZW1lbnQuY2hlY2tlZCA9IChlbGVtZW50LnZhbHVlID09IHZhbHVlKTtcbiAgICAgICAgfVxuICAgIH1cbn07XG52YXIgY2xhc3Nlc1dyaXR0ZW5CeUJpbmRpbmdLZXkgPSAnX19rb19fY3NzVmFsdWUnO1xua28uYmluZGluZ0hhbmRsZXJzWydjc3MnXSA9IHtcbiAgICAndXBkYXRlJzogZnVuY3Rpb24gKGVsZW1lbnQsIHZhbHVlQWNjZXNzb3IpIHtcbiAgICAgICAgdmFyIHZhbHVlID0ga28udXRpbHMudW53cmFwT2JzZXJ2YWJsZSh2YWx1ZUFjY2Vzc29yKCkpO1xuICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgICAgIGtvLnV0aWxzLm9iamVjdEZvckVhY2godmFsdWUsIGZ1bmN0aW9uKGNsYXNzTmFtZSwgc2hvdWxkSGF2ZUNsYXNzKSB7XG4gICAgICAgICAgICAgICAgc2hvdWxkSGF2ZUNsYXNzID0ga28udXRpbHMudW53cmFwT2JzZXJ2YWJsZShzaG91bGRIYXZlQ2xhc3MpO1xuICAgICAgICAgICAgICAgIGtvLnV0aWxzLnRvZ2dsZURvbU5vZGVDc3NDbGFzcyhlbGVtZW50LCBjbGFzc05hbWUsIHNob3VsZEhhdmVDbGFzcyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhbHVlID0gU3RyaW5nKHZhbHVlIHx8ICcnKTsgLy8gTWFrZSBzdXJlIHdlIGRvbid0IHRyeSB0byBzdG9yZSBvciBzZXQgYSBub24tc3RyaW5nIHZhbHVlXG4gICAgICAgICAgICBrby51dGlscy50b2dnbGVEb21Ob2RlQ3NzQ2xhc3MoZWxlbWVudCwgZWxlbWVudFtjbGFzc2VzV3JpdHRlbkJ5QmluZGluZ0tleV0sIGZhbHNlKTtcbiAgICAgICAgICAgIGVsZW1lbnRbY2xhc3Nlc1dyaXR0ZW5CeUJpbmRpbmdLZXldID0gdmFsdWU7XG4gICAgICAgICAgICBrby51dGlscy50b2dnbGVEb21Ob2RlQ3NzQ2xhc3MoZWxlbWVudCwgdmFsdWUsIHRydWUpO1xuICAgICAgICB9XG4gICAgfVxufTtcbmtvLmJpbmRpbmdIYW5kbGVyc1snZW5hYmxlJ10gPSB7XG4gICAgJ3VwZGF0ZSc6IGZ1bmN0aW9uIChlbGVtZW50LCB2YWx1ZUFjY2Vzc29yKSB7XG4gICAgICAgIHZhciB2YWx1ZSA9IGtvLnV0aWxzLnVud3JhcE9ic2VydmFibGUodmFsdWVBY2Nlc3NvcigpKTtcbiAgICAgICAgaWYgKHZhbHVlICYmIGVsZW1lbnQuZGlzYWJsZWQpXG4gICAgICAgICAgICBlbGVtZW50LnJlbW92ZUF0dHJpYnV0ZShcImRpc2FibGVkXCIpO1xuICAgICAgICBlbHNlIGlmICgoIXZhbHVlKSAmJiAoIWVsZW1lbnQuZGlzYWJsZWQpKVxuICAgICAgICAgICAgZWxlbWVudC5kaXNhYmxlZCA9IHRydWU7XG4gICAgfVxufTtcblxua28uYmluZGluZ0hhbmRsZXJzWydkaXNhYmxlJ10gPSB7XG4gICAgJ3VwZGF0ZSc6IGZ1bmN0aW9uIChlbGVtZW50LCB2YWx1ZUFjY2Vzc29yKSB7XG4gICAgICAgIGtvLmJpbmRpbmdIYW5kbGVyc1snZW5hYmxlJ11bJ3VwZGF0ZSddKGVsZW1lbnQsIGZ1bmN0aW9uKCkgeyByZXR1cm4gIWtvLnV0aWxzLnVud3JhcE9ic2VydmFibGUodmFsdWVBY2Nlc3NvcigpKSB9KTtcbiAgICB9XG59O1xuLy8gRm9yIGNlcnRhaW4gY29tbW9uIGV2ZW50cyAoY3VycmVudGx5IGp1c3QgJ2NsaWNrJyksIGFsbG93IGEgc2ltcGxpZmllZCBkYXRhLWJpbmRpbmcgc3ludGF4XG4vLyBlLmcuIGNsaWNrOmhhbmRsZXIgaW5zdGVhZCBvZiB0aGUgdXN1YWwgZnVsbC1sZW5ndGggZXZlbnQ6e2NsaWNrOmhhbmRsZXJ9XG5mdW5jdGlvbiBtYWtlRXZlbnRIYW5kbGVyU2hvcnRjdXQoZXZlbnROYW1lKSB7XG4gICAga28uYmluZGluZ0hhbmRsZXJzW2V2ZW50TmFtZV0gPSB7XG4gICAgICAgICdpbml0JzogZnVuY3Rpb24oZWxlbWVudCwgdmFsdWVBY2Nlc3NvciwgYWxsQmluZGluZ3NBY2Nlc3Nvciwgdmlld01vZGVsKSB7XG4gICAgICAgICAgICB2YXIgbmV3VmFsdWVBY2Nlc3NvciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgcmVzdWx0ID0ge307XG4gICAgICAgICAgICAgICAgcmVzdWx0W2V2ZW50TmFtZV0gPSB2YWx1ZUFjY2Vzc29yKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICByZXR1cm4ga28uYmluZGluZ0hhbmRsZXJzWydldmVudCddWydpbml0J10uY2FsbCh0aGlzLCBlbGVtZW50LCBuZXdWYWx1ZUFjY2Vzc29yLCBhbGxCaW5kaW5nc0FjY2Vzc29yLCB2aWV3TW9kZWwpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5rby5iaW5kaW5nSGFuZGxlcnNbJ2V2ZW50J10gPSB7XG4gICAgJ2luaXQnIDogZnVuY3Rpb24gKGVsZW1lbnQsIHZhbHVlQWNjZXNzb3IsIGFsbEJpbmRpbmdzQWNjZXNzb3IsIHZpZXdNb2RlbCkge1xuICAgICAgICB2YXIgZXZlbnRzVG9IYW5kbGUgPSB2YWx1ZUFjY2Vzc29yKCkgfHwge307XG4gICAgICAgIGtvLnV0aWxzLm9iamVjdEZvckVhY2goZXZlbnRzVG9IYW5kbGUsIGZ1bmN0aW9uKGV2ZW50TmFtZSkge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBldmVudE5hbWUgPT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgICAgIGtvLnV0aWxzLnJlZ2lzdGVyRXZlbnRIYW5kbGVyKGVsZW1lbnQsIGV2ZW50TmFtZSwgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBoYW5kbGVyUmV0dXJuVmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIHZhciBoYW5kbGVyRnVuY3Rpb24gPSB2YWx1ZUFjY2Vzc29yKClbZXZlbnROYW1lXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFoYW5kbGVyRnVuY3Rpb24pXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIHZhciBhbGxCaW5kaW5ncyA9IGFsbEJpbmRpbmdzQWNjZXNzb3IoKTtcblxuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gVGFrZSBhbGwgdGhlIGV2ZW50IGFyZ3MsIGFuZCBwcmVmaXggd2l0aCB0aGUgdmlld21vZGVsXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgYXJnc0ZvckhhbmRsZXIgPSBrby51dGlscy5tYWtlQXJyYXkoYXJndW1lbnRzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZ3NGb3JIYW5kbGVyLnVuc2hpZnQodmlld01vZGVsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGhhbmRsZXJSZXR1cm5WYWx1ZSA9IGhhbmRsZXJGdW5jdGlvbi5hcHBseSh2aWV3TW9kZWwsIGFyZ3NGb3JIYW5kbGVyKTtcbiAgICAgICAgICAgICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChoYW5kbGVyUmV0dXJuVmFsdWUgIT09IHRydWUpIHsgLy8gTm9ybWFsbHkgd2Ugd2FudCB0byBwcmV2ZW50IGRlZmF1bHQgYWN0aW9uLiBEZXZlbG9wZXIgY2FuIG92ZXJyaWRlIHRoaXMgYmUgZXhwbGljaXRseSByZXR1cm5pbmcgdHJ1ZS5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXZlbnQucHJldmVudERlZmF1bHQpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBldmVudC5yZXR1cm5WYWx1ZSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIGJ1YmJsZSA9IGFsbEJpbmRpbmdzW2V2ZW50TmFtZSArICdCdWJibGUnXSAhPT0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIGlmICghYnViYmxlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBldmVudC5jYW5jZWxCdWJibGUgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGV2ZW50LnN0b3BQcm9wYWdhdGlvbilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG59O1xuLy8gXCJmb3JlYWNoOiBzb21lRXhwcmVzc2lvblwiIGlzIGVxdWl2YWxlbnQgdG8gXCJ0ZW1wbGF0ZTogeyBmb3JlYWNoOiBzb21lRXhwcmVzc2lvbiB9XCJcbi8vIFwiZm9yZWFjaDogeyBkYXRhOiBzb21lRXhwcmVzc2lvbiwgYWZ0ZXJBZGQ6IG15Zm4gfVwiIGlzIGVxdWl2YWxlbnQgdG8gXCJ0ZW1wbGF0ZTogeyBmb3JlYWNoOiBzb21lRXhwcmVzc2lvbiwgYWZ0ZXJBZGQ6IG15Zm4gfVwiXG5rby5iaW5kaW5nSGFuZGxlcnNbJ2ZvcmVhY2gnXSA9IHtcbiAgICBtYWtlVGVtcGxhdGVWYWx1ZUFjY2Vzc29yOiBmdW5jdGlvbih2YWx1ZUFjY2Vzc29yKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBtb2RlbFZhbHVlID0gdmFsdWVBY2Nlc3NvcigpLFxuICAgICAgICAgICAgICAgIHVud3JhcHBlZFZhbHVlID0ga28udXRpbHMucGVla09ic2VydmFibGUobW9kZWxWYWx1ZSk7ICAgIC8vIFVud3JhcCB3aXRob3V0IHNldHRpbmcgYSBkZXBlbmRlbmN5IGhlcmVcblxuICAgICAgICAgICAgLy8gSWYgdW53cmFwcGVkVmFsdWUgaXMgdGhlIGFycmF5LCBwYXNzIGluIHRoZSB3cmFwcGVkIHZhbHVlIG9uIGl0cyBvd25cbiAgICAgICAgICAgIC8vIFRoZSB2YWx1ZSB3aWxsIGJlIHVud3JhcHBlZCBhbmQgdHJhY2tlZCB3aXRoaW4gdGhlIHRlbXBsYXRlIGJpbmRpbmdcbiAgICAgICAgICAgIC8vIChTZWUgaHR0cHM6Ly9naXRodWIuY29tL1N0ZXZlU2FuZGVyc29uL2tub2Nrb3V0L2lzc3Vlcy81MjMpXG4gICAgICAgICAgICBpZiAoKCF1bndyYXBwZWRWYWx1ZSkgfHwgdHlwZW9mIHVud3JhcHBlZFZhbHVlLmxlbmd0aCA9PSBcIm51bWJlclwiKVxuICAgICAgICAgICAgICAgIHJldHVybiB7ICdmb3JlYWNoJzogbW9kZWxWYWx1ZSwgJ3RlbXBsYXRlRW5naW5lJzoga28ubmF0aXZlVGVtcGxhdGVFbmdpbmUuaW5zdGFuY2UgfTtcblxuICAgICAgICAgICAgLy8gSWYgdW53cmFwcGVkVmFsdWUuZGF0YSBpcyB0aGUgYXJyYXksIHByZXNlcnZlIGFsbCByZWxldmFudCBvcHRpb25zIGFuZCB1bndyYXAgYWdhaW4gdmFsdWUgc28gd2UgZ2V0IHVwZGF0ZXNcbiAgICAgICAgICAgIGtvLnV0aWxzLnVud3JhcE9ic2VydmFibGUobW9kZWxWYWx1ZSk7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICdmb3JlYWNoJzogdW53cmFwcGVkVmFsdWVbJ2RhdGEnXSxcbiAgICAgICAgICAgICAgICAnYXMnOiB1bndyYXBwZWRWYWx1ZVsnYXMnXSxcbiAgICAgICAgICAgICAgICAnaW5jbHVkZURlc3Ryb3llZCc6IHVud3JhcHBlZFZhbHVlWydpbmNsdWRlRGVzdHJveWVkJ10sXG4gICAgICAgICAgICAgICAgJ2FmdGVyQWRkJzogdW53cmFwcGVkVmFsdWVbJ2FmdGVyQWRkJ10sXG4gICAgICAgICAgICAgICAgJ2JlZm9yZVJlbW92ZSc6IHVud3JhcHBlZFZhbHVlWydiZWZvcmVSZW1vdmUnXSxcbiAgICAgICAgICAgICAgICAnYWZ0ZXJSZW5kZXInOiB1bndyYXBwZWRWYWx1ZVsnYWZ0ZXJSZW5kZXInXSxcbiAgICAgICAgICAgICAgICAnYmVmb3JlTW92ZSc6IHVud3JhcHBlZFZhbHVlWydiZWZvcmVNb3ZlJ10sXG4gICAgICAgICAgICAgICAgJ2FmdGVyTW92ZSc6IHVud3JhcHBlZFZhbHVlWydhZnRlck1vdmUnXSxcbiAgICAgICAgICAgICAgICAndGVtcGxhdGVFbmdpbmUnOiBrby5uYXRpdmVUZW1wbGF0ZUVuZ2luZS5pbnN0YW5jZVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfTtcbiAgICB9LFxuICAgICdpbml0JzogZnVuY3Rpb24oZWxlbWVudCwgdmFsdWVBY2Nlc3NvciwgYWxsQmluZGluZ3NBY2Nlc3Nvciwgdmlld01vZGVsLCBiaW5kaW5nQ29udGV4dCkge1xuICAgICAgICByZXR1cm4ga28uYmluZGluZ0hhbmRsZXJzWyd0ZW1wbGF0ZSddWydpbml0J10oZWxlbWVudCwga28uYmluZGluZ0hhbmRsZXJzWydmb3JlYWNoJ10ubWFrZVRlbXBsYXRlVmFsdWVBY2Nlc3Nvcih2YWx1ZUFjY2Vzc29yKSk7XG4gICAgfSxcbiAgICAndXBkYXRlJzogZnVuY3Rpb24oZWxlbWVudCwgdmFsdWVBY2Nlc3NvciwgYWxsQmluZGluZ3NBY2Nlc3Nvciwgdmlld01vZGVsLCBiaW5kaW5nQ29udGV4dCkge1xuICAgICAgICByZXR1cm4ga28uYmluZGluZ0hhbmRsZXJzWyd0ZW1wbGF0ZSddWyd1cGRhdGUnXShlbGVtZW50LCBrby5iaW5kaW5nSGFuZGxlcnNbJ2ZvcmVhY2gnXS5tYWtlVGVtcGxhdGVWYWx1ZUFjY2Vzc29yKHZhbHVlQWNjZXNzb3IpLCBhbGxCaW5kaW5nc0FjY2Vzc29yLCB2aWV3TW9kZWwsIGJpbmRpbmdDb250ZXh0KTtcbiAgICB9XG59O1xua28uZXhwcmVzc2lvblJld3JpdGluZy5iaW5kaW5nUmV3cml0ZVZhbGlkYXRvcnNbJ2ZvcmVhY2gnXSA9IGZhbHNlOyAvLyBDYW4ndCByZXdyaXRlIGNvbnRyb2wgZmxvdyBiaW5kaW5nc1xua28udmlydHVhbEVsZW1lbnRzLmFsbG93ZWRCaW5kaW5nc1snZm9yZWFjaCddID0gdHJ1ZTtcbnZhciBoYXNmb2N1c1VwZGF0aW5nUHJvcGVydHkgPSAnX19rb19oYXNmb2N1c1VwZGF0aW5nJztcbnZhciBoYXNmb2N1c0xhc3RWYWx1ZSA9ICdfX2tvX2hhc2ZvY3VzTGFzdFZhbHVlJztcbmtvLmJpbmRpbmdIYW5kbGVyc1snaGFzZm9jdXMnXSA9IHtcbiAgICAnaW5pdCc6IGZ1bmN0aW9uKGVsZW1lbnQsIHZhbHVlQWNjZXNzb3IsIGFsbEJpbmRpbmdzQWNjZXNzb3IpIHtcbiAgICAgICAgdmFyIGhhbmRsZUVsZW1lbnRGb2N1c0NoYW5nZSA9IGZ1bmN0aW9uKGlzRm9jdXNlZCkge1xuICAgICAgICAgICAgLy8gV2hlcmUgcG9zc2libGUsIGlnbm9yZSB3aGljaCBldmVudCB3YXMgcmFpc2VkIGFuZCBkZXRlcm1pbmUgZm9jdXMgc3RhdGUgdXNpbmcgYWN0aXZlRWxlbWVudCxcbiAgICAgICAgICAgIC8vIGFzIHRoaXMgYXZvaWRzIHBoYW50b20gZm9jdXMvYmx1ciBldmVudHMgcmFpc2VkIHdoZW4gY2hhbmdpbmcgdGFicyBpbiBtb2Rlcm4gYnJvd3NlcnMuXG4gICAgICAgICAgICAvLyBIb3dldmVyLCBub3QgYWxsIEtPLXRhcmdldGVkIGJyb3dzZXJzIChGaXJlZm94IDIpIHN1cHBvcnQgYWN0aXZlRWxlbWVudC4gRm9yIHRob3NlIGJyb3dzZXJzLFxuICAgICAgICAgICAgLy8gcHJldmVudCBhIGxvc3Mgb2YgZm9jdXMgd2hlbiBjaGFuZ2luZyB0YWJzL3dpbmRvd3MgYnkgc2V0dGluZyBhIGZsYWcgdGhhdCBwcmV2ZW50cyBoYXNmb2N1c1xuICAgICAgICAgICAgLy8gZnJvbSBjYWxsaW5nICdibHVyKCknIG9uIHRoZSBlbGVtZW50IHdoZW4gaXQgbG9zZXMgZm9jdXMuXG4gICAgICAgICAgICAvLyBEaXNjdXNzaW9uIGF0IGh0dHBzOi8vZ2l0aHViLmNvbS9TdGV2ZVNhbmRlcnNvbi9rbm9ja291dC9wdWxsLzM1MlxuICAgICAgICAgICAgZWxlbWVudFtoYXNmb2N1c1VwZGF0aW5nUHJvcGVydHldID0gdHJ1ZTtcbiAgICAgICAgICAgIHZhciBvd25lckRvYyA9IGVsZW1lbnQub3duZXJEb2N1bWVudDtcbiAgICAgICAgICAgIGlmIChcImFjdGl2ZUVsZW1lbnRcIiBpbiBvd25lckRvYykge1xuICAgICAgICAgICAgICAgIHZhciBhY3RpdmU7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgYWN0aXZlID0gb3duZXJEb2MuYWN0aXZlRWxlbWVudDtcbiAgICAgICAgICAgICAgICB9IGNhdGNoKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gSUU5IHRocm93cyBpZiB5b3UgYWNjZXNzIGFjdGl2ZUVsZW1lbnQgZHVyaW5nIHBhZ2UgbG9hZCAoc2VlIGlzc3VlICM3MDMpXG4gICAgICAgICAgICAgICAgICAgIGFjdGl2ZSA9IG93bmVyRG9jLmJvZHk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlzRm9jdXNlZCA9IChhY3RpdmUgPT09IGVsZW1lbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIG1vZGVsVmFsdWUgPSB2YWx1ZUFjY2Vzc29yKCk7XG4gICAgICAgICAgICBrby5leHByZXNzaW9uUmV3cml0aW5nLndyaXRlVmFsdWVUb1Byb3BlcnR5KG1vZGVsVmFsdWUsIGFsbEJpbmRpbmdzQWNjZXNzb3IsICdoYXNmb2N1cycsIGlzRm9jdXNlZCwgdHJ1ZSk7XG5cbiAgICAgICAgICAgIC8vY2FjaGUgdGhlIGxhdGVzdCB2YWx1ZSwgc28gd2UgY2FuIGF2b2lkIHVubmVjZXNzYXJpbHkgY2FsbGluZyBmb2N1cy9ibHVyIGluIHRoZSB1cGRhdGUgZnVuY3Rpb25cbiAgICAgICAgICAgIGVsZW1lbnRbaGFzZm9jdXNMYXN0VmFsdWVdID0gaXNGb2N1c2VkO1xuICAgICAgICAgICAgZWxlbWVudFtoYXNmb2N1c1VwZGF0aW5nUHJvcGVydHldID0gZmFsc2U7XG4gICAgICAgIH07XG4gICAgICAgIHZhciBoYW5kbGVFbGVtZW50Rm9jdXNJbiA9IGhhbmRsZUVsZW1lbnRGb2N1c0NoYW5nZS5iaW5kKG51bGwsIHRydWUpO1xuICAgICAgICB2YXIgaGFuZGxlRWxlbWVudEZvY3VzT3V0ID0gaGFuZGxlRWxlbWVudEZvY3VzQ2hhbmdlLmJpbmQobnVsbCwgZmFsc2UpO1xuXG4gICAgICAgIGtvLnV0aWxzLnJlZ2lzdGVyRXZlbnRIYW5kbGVyKGVsZW1lbnQsIFwiZm9jdXNcIiwgaGFuZGxlRWxlbWVudEZvY3VzSW4pO1xuICAgICAgICBrby51dGlscy5yZWdpc3RlckV2ZW50SGFuZGxlcihlbGVtZW50LCBcImZvY3VzaW5cIiwgaGFuZGxlRWxlbWVudEZvY3VzSW4pOyAvLyBGb3IgSUVcbiAgICAgICAga28udXRpbHMucmVnaXN0ZXJFdmVudEhhbmRsZXIoZWxlbWVudCwgXCJibHVyXCIsICBoYW5kbGVFbGVtZW50Rm9jdXNPdXQpO1xuICAgICAgICBrby51dGlscy5yZWdpc3RlckV2ZW50SGFuZGxlcihlbGVtZW50LCBcImZvY3Vzb3V0XCIsICBoYW5kbGVFbGVtZW50Rm9jdXNPdXQpOyAvLyBGb3IgSUVcbiAgICB9LFxuICAgICd1cGRhdGUnOiBmdW5jdGlvbihlbGVtZW50LCB2YWx1ZUFjY2Vzc29yKSB7XG4gICAgICAgIHZhciB2YWx1ZSA9ICEha28udXRpbHMudW53cmFwT2JzZXJ2YWJsZSh2YWx1ZUFjY2Vzc29yKCkpOyAvL2ZvcmNlIGJvb2xlYW4gdG8gY29tcGFyZSB3aXRoIGxhc3QgdmFsdWVcbiAgICAgICAgaWYgKCFlbGVtZW50W2hhc2ZvY3VzVXBkYXRpbmdQcm9wZXJ0eV0gJiYgZWxlbWVudFtoYXNmb2N1c0xhc3RWYWx1ZV0gIT09IHZhbHVlKSB7XG4gICAgICAgICAgICB2YWx1ZSA/IGVsZW1lbnQuZm9jdXMoKSA6IGVsZW1lbnQuYmx1cigpO1xuICAgICAgICAgICAga28uZGVwZW5kZW5jeURldGVjdGlvbi5pZ25vcmUoa28udXRpbHMudHJpZ2dlckV2ZW50LCBudWxsLCBbZWxlbWVudCwgdmFsdWUgPyBcImZvY3VzaW5cIiA6IFwiZm9jdXNvdXRcIl0pOyAvLyBGb3IgSUUsIHdoaWNoIGRvZXNuJ3QgcmVsaWFibHkgZmlyZSBcImZvY3VzXCIgb3IgXCJibHVyXCIgZXZlbnRzIHN5bmNocm9ub3VzbHlcbiAgICAgICAgfVxuICAgIH1cbn07XG5cbmtvLmJpbmRpbmdIYW5kbGVyc1snaGFzRm9jdXMnXSA9IGtvLmJpbmRpbmdIYW5kbGVyc1snaGFzZm9jdXMnXTsgLy8gTWFrZSBcImhhc0ZvY3VzXCIgYW4gYWxpYXNcbmtvLmJpbmRpbmdIYW5kbGVyc1snaHRtbCddID0ge1xuICAgICdpbml0JzogZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIFByZXZlbnQgYmluZGluZyBvbiB0aGUgZHluYW1pY2FsbHktaW5qZWN0ZWQgSFRNTCAoYXMgZGV2ZWxvcGVycyBhcmUgdW5saWtlbHkgdG8gZXhwZWN0IHRoYXQsIGFuZCBpdCBoYXMgc2VjdXJpdHkgaW1wbGljYXRpb25zKVxuICAgICAgICByZXR1cm4geyAnY29udHJvbHNEZXNjZW5kYW50QmluZGluZ3MnOiB0cnVlIH07XG4gICAgfSxcbiAgICAndXBkYXRlJzogZnVuY3Rpb24gKGVsZW1lbnQsIHZhbHVlQWNjZXNzb3IpIHtcbiAgICAgICAgLy8gc2V0SHRtbCB3aWxsIHVud3JhcCB0aGUgdmFsdWUgaWYgbmVlZGVkXG4gICAgICAgIGtvLnV0aWxzLnNldEh0bWwoZWxlbWVudCwgdmFsdWVBY2Nlc3NvcigpKTtcbiAgICB9XG59O1xudmFyIHdpdGhJZkRvbURhdGFLZXkgPSAnX19rb193aXRoSWZCaW5kaW5nRGF0YSc7XG4vLyBNYWtlcyBhIGJpbmRpbmcgbGlrZSB3aXRoIG9yIGlmXG5mdW5jdGlvbiBtYWtlV2l0aElmQmluZGluZyhiaW5kaW5nS2V5LCBpc1dpdGgsIGlzTm90LCBtYWtlQ29udGV4dENhbGxiYWNrKSB7XG4gICAga28uYmluZGluZ0hhbmRsZXJzW2JpbmRpbmdLZXldID0ge1xuICAgICAgICAnaW5pdCc6IGZ1bmN0aW9uKGVsZW1lbnQsIHZhbHVlQWNjZXNzb3IsIGFsbEJpbmRpbmdzQWNjZXNzb3IsIHZpZXdNb2RlbCwgYmluZGluZ0NvbnRleHQpIHtcbiAgICAgICAgICAgIGtvLnV0aWxzLmRvbURhdGEuc2V0KGVsZW1lbnQsIHdpdGhJZkRvbURhdGFLZXksIHt9KTtcbiAgICAgICAgICAgIHJldHVybiB7ICdjb250cm9sc0Rlc2NlbmRhbnRCaW5kaW5ncyc6IHRydWUgfTtcbiAgICAgICAgfSxcbiAgICAgICAgJ3VwZGF0ZSc6IGZ1bmN0aW9uKGVsZW1lbnQsIHZhbHVlQWNjZXNzb3IsIGFsbEJpbmRpbmdzQWNjZXNzb3IsIHZpZXdNb2RlbCwgYmluZGluZ0NvbnRleHQpIHtcbiAgICAgICAgICAgIHZhciB3aXRoSWZEYXRhID0ga28udXRpbHMuZG9tRGF0YS5nZXQoZWxlbWVudCwgd2l0aElmRG9tRGF0YUtleSksXG4gICAgICAgICAgICAgICAgZGF0YVZhbHVlID0ga28udXRpbHMudW53cmFwT2JzZXJ2YWJsZSh2YWx1ZUFjY2Vzc29yKCkpLFxuICAgICAgICAgICAgICAgIHNob3VsZERpc3BsYXkgPSAhaXNOb3QgIT09ICFkYXRhVmFsdWUsIC8vIGVxdWl2YWxlbnQgdG8gaXNOb3QgPyAhZGF0YVZhbHVlIDogISFkYXRhVmFsdWVcbiAgICAgICAgICAgICAgICBpc0ZpcnN0UmVuZGVyID0gIXdpdGhJZkRhdGEuc2F2ZWROb2RlcyxcbiAgICAgICAgICAgICAgICBuZWVkc1JlZnJlc2ggPSBpc0ZpcnN0UmVuZGVyIHx8IGlzV2l0aCB8fCAoc2hvdWxkRGlzcGxheSAhPT0gd2l0aElmRGF0YS5kaWREaXNwbGF5T25MYXN0VXBkYXRlKTtcblxuICAgICAgICAgICAgaWYgKG5lZWRzUmVmcmVzaCkge1xuICAgICAgICAgICAgICAgIGlmIChpc0ZpcnN0UmVuZGVyKSB7XG4gICAgICAgICAgICAgICAgICAgIHdpdGhJZkRhdGEuc2F2ZWROb2RlcyA9IGtvLnV0aWxzLmNsb25lTm9kZXMoa28udmlydHVhbEVsZW1lbnRzLmNoaWxkTm9kZXMoZWxlbWVudCksIHRydWUgLyogc2hvdWxkQ2xlYW5Ob2RlcyAqLyk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKHNob3VsZERpc3BsYXkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFpc0ZpcnN0UmVuZGVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBrby52aXJ0dWFsRWxlbWVudHMuc2V0RG9tTm9kZUNoaWxkcmVuKGVsZW1lbnQsIGtvLnV0aWxzLmNsb25lTm9kZXMod2l0aElmRGF0YS5zYXZlZE5vZGVzKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAga28uYXBwbHlCaW5kaW5nc1RvRGVzY2VuZGFudHMobWFrZUNvbnRleHRDYWxsYmFjayA/IG1ha2VDb250ZXh0Q2FsbGJhY2soYmluZGluZ0NvbnRleHQsIGRhdGFWYWx1ZSkgOiBiaW5kaW5nQ29udGV4dCwgZWxlbWVudCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAga28udmlydHVhbEVsZW1lbnRzLmVtcHR5Tm9kZShlbGVtZW50KTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB3aXRoSWZEYXRhLmRpZERpc3BsYXlPbkxhc3RVcGRhdGUgPSBzaG91bGREaXNwbGF5O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbiAgICBrby5leHByZXNzaW9uUmV3cml0aW5nLmJpbmRpbmdSZXdyaXRlVmFsaWRhdG9yc1tiaW5kaW5nS2V5XSA9IGZhbHNlOyAvLyBDYW4ndCByZXdyaXRlIGNvbnRyb2wgZmxvdyBiaW5kaW5nc1xuICAgIGtvLnZpcnR1YWxFbGVtZW50cy5hbGxvd2VkQmluZGluZ3NbYmluZGluZ0tleV0gPSB0cnVlO1xufVxuXG4vLyBDb25zdHJ1Y3QgdGhlIGFjdHVhbCBiaW5kaW5nIGhhbmRsZXJzXG5tYWtlV2l0aElmQmluZGluZygnaWYnKTtcbm1ha2VXaXRoSWZCaW5kaW5nKCdpZm5vdCcsIGZhbHNlIC8qIGlzV2l0aCAqLywgdHJ1ZSAvKiBpc05vdCAqLyk7XG5tYWtlV2l0aElmQmluZGluZygnd2l0aCcsIHRydWUgLyogaXNXaXRoICovLCBmYWxzZSAvKiBpc05vdCAqLyxcbiAgICBmdW5jdGlvbihiaW5kaW5nQ29udGV4dCwgZGF0YVZhbHVlKSB7XG4gICAgICAgIHJldHVybiBiaW5kaW5nQ29udGV4dFsnY3JlYXRlQ2hpbGRDb250ZXh0J10oZGF0YVZhbHVlKTtcbiAgICB9XG4pO1xuZnVuY3Rpb24gZW5zdXJlRHJvcGRvd25TZWxlY3Rpb25Jc0NvbnNpc3RlbnRXaXRoTW9kZWxWYWx1ZShlbGVtZW50LCBtb2RlbFZhbHVlLCBwcmVmZXJNb2RlbFZhbHVlKSB7XG4gICAgaWYgKHByZWZlck1vZGVsVmFsdWUpIHtcbiAgICAgICAgaWYgKG1vZGVsVmFsdWUgIT09IGtvLnNlbGVjdEV4dGVuc2lvbnMucmVhZFZhbHVlKGVsZW1lbnQpKVxuICAgICAgICAgICAga28uc2VsZWN0RXh0ZW5zaW9ucy53cml0ZVZhbHVlKGVsZW1lbnQsIG1vZGVsVmFsdWUpO1xuICAgIH1cblxuICAgIC8vIE5vIG1hdHRlciB3aGljaCBkaXJlY3Rpb24gd2UncmUgc3luY2luZyBpbiwgd2Ugd2FudCB0aGUgZW5kIHJlc3VsdCB0byBiZSBlcXVhbGl0eSBiZXR3ZWVuIGRyb3Bkb3duIHZhbHVlIGFuZCBtb2RlbCB2YWx1ZS5cbiAgICAvLyBJZiB0aGV5IGFyZW4ndCBlcXVhbCwgZWl0aGVyIHdlIHByZWZlciB0aGUgZHJvcGRvd24gdmFsdWUsIG9yIHRoZSBtb2RlbCB2YWx1ZSBjb3VsZG4ndCBiZSByZXByZXNlbnRlZCwgc28gZWl0aGVyIHdheSxcbiAgICAvLyBjaGFuZ2UgdGhlIG1vZGVsIHZhbHVlIHRvIG1hdGNoIHRoZSBkcm9wZG93bi5cbiAgICBpZiAobW9kZWxWYWx1ZSAhPT0ga28uc2VsZWN0RXh0ZW5zaW9ucy5yZWFkVmFsdWUoZWxlbWVudCkpXG4gICAgICAgIGtvLmRlcGVuZGVuY3lEZXRlY3Rpb24uaWdub3JlKGtvLnV0aWxzLnRyaWdnZXJFdmVudCwgbnVsbCwgW2VsZW1lbnQsIFwiY2hhbmdlXCJdKTtcbn07XG5cbmtvLmJpbmRpbmdIYW5kbGVyc1snb3B0aW9ucyddID0ge1xuICAgICdpbml0JzogZnVuY3Rpb24oZWxlbWVudCkge1xuICAgICAgICBpZiAoa28udXRpbHMudGFnTmFtZUxvd2VyKGVsZW1lbnQpICE9PSBcInNlbGVjdFwiKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwib3B0aW9ucyBiaW5kaW5nIGFwcGxpZXMgb25seSB0byBTRUxFQ1QgZWxlbWVudHNcIik7XG5cbiAgICAgICAgLy8gUmVtb3ZlIGFsbCBleGlzdGluZyA8b3B0aW9uPnMuXG4gICAgICAgIHdoaWxlIChlbGVtZW50Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGVsZW1lbnQucmVtb3ZlKDApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gRW5zdXJlcyB0aGF0IHRoZSBiaW5kaW5nIHByb2Nlc3NvciBkb2Vzbid0IHRyeSB0byBiaW5kIHRoZSBvcHRpb25zXG4gICAgICAgIHJldHVybiB7ICdjb250cm9sc0Rlc2NlbmRhbnRCaW5kaW5ncyc6IHRydWUgfTtcbiAgICB9LFxuICAgICd1cGRhdGUnOiBmdW5jdGlvbiAoZWxlbWVudCwgdmFsdWVBY2Nlc3NvciwgYWxsQmluZGluZ3NBY2Nlc3Nvcikge1xuICAgICAgICB2YXIgc2VsZWN0V2FzUHJldmlvdXNseUVtcHR5ID0gZWxlbWVudC5sZW5ndGggPT0gMDtcbiAgICAgICAgdmFyIHByZXZpb3VzU2Nyb2xsVG9wID0gKCFzZWxlY3RXYXNQcmV2aW91c2x5RW1wdHkgJiYgZWxlbWVudC5tdWx0aXBsZSkgPyBlbGVtZW50LnNjcm9sbFRvcCA6IG51bGw7XG5cbiAgICAgICAgdmFyIHVud3JhcHBlZEFycmF5ID0ga28udXRpbHMudW53cmFwT2JzZXJ2YWJsZSh2YWx1ZUFjY2Vzc29yKCkpO1xuICAgICAgICB2YXIgYWxsQmluZGluZ3MgPSBhbGxCaW5kaW5nc0FjY2Vzc29yKCk7XG4gICAgICAgIHZhciBpbmNsdWRlRGVzdHJveWVkID0gYWxsQmluZGluZ3NbJ29wdGlvbnNJbmNsdWRlRGVzdHJveWVkJ107XG4gICAgICAgIHZhciBjYXB0aW9uUGxhY2Vob2xkZXIgPSB7fTtcbiAgICAgICAgdmFyIGNhcHRpb25WYWx1ZTtcbiAgICAgICAgdmFyIHByZXZpb3VzU2VsZWN0ZWRWYWx1ZXM7XG4gICAgICAgIGlmIChlbGVtZW50Lm11bHRpcGxlKSB7XG4gICAgICAgICAgICBwcmV2aW91c1NlbGVjdGVkVmFsdWVzID0ga28udXRpbHMuYXJyYXlNYXAoZWxlbWVudC5zZWxlY3RlZE9wdGlvbnMgfHwga28udXRpbHMuYXJyYXlGaWx0ZXIoZWxlbWVudC5jaGlsZE5vZGVzLCBmdW5jdGlvbiAobm9kZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbm9kZS50YWdOYW1lICYmIChrby51dGlscy50YWdOYW1lTG93ZXIobm9kZSkgPT09IFwib3B0aW9uXCIpICYmIG5vZGUuc2VsZWN0ZWQ7XG4gICAgICAgICAgICAgICAgfSksIGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBrby5zZWxlY3RFeHRlbnNpb25zLnJlYWRWYWx1ZShub2RlKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIGlmIChlbGVtZW50LnNlbGVjdGVkSW5kZXggPj0gMCkge1xuICAgICAgICAgICAgcHJldmlvdXNTZWxlY3RlZFZhbHVlcyA9IFsga28uc2VsZWN0RXh0ZW5zaW9ucy5yZWFkVmFsdWUoZWxlbWVudC5vcHRpb25zW2VsZW1lbnQuc2VsZWN0ZWRJbmRleF0pIF07XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodW53cmFwcGVkQXJyYXkpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgdW53cmFwcGVkQXJyYXkubGVuZ3RoID09IFwidW5kZWZpbmVkXCIpIC8vIENvZXJjZSBzaW5nbGUgdmFsdWUgaW50byBhcnJheVxuICAgICAgICAgICAgICAgIHVud3JhcHBlZEFycmF5ID0gW3Vud3JhcHBlZEFycmF5XTtcblxuICAgICAgICAgICAgLy8gRmlsdGVyIG91dCBhbnkgZW50cmllcyBtYXJrZWQgYXMgZGVzdHJveWVkXG4gICAgICAgICAgICB2YXIgZmlsdGVyZWRBcnJheSA9IGtvLnV0aWxzLmFycmF5RmlsdGVyKHVud3JhcHBlZEFycmF5LCBmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGluY2x1ZGVEZXN0cm95ZWQgfHwgaXRlbSA9PT0gdW5kZWZpbmVkIHx8IGl0ZW0gPT09IG51bGwgfHwgIWtvLnV0aWxzLnVud3JhcE9ic2VydmFibGUoaXRlbVsnX2Rlc3Ryb3knXSk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgLy8gSWYgY2FwdGlvbiBpcyBpbmNsdWRlZCwgYWRkIGl0IHRvIHRoZSBhcnJheVxuICAgICAgICAgICAgaWYgKCdvcHRpb25zQ2FwdGlvbicgaW4gYWxsQmluZGluZ3MpIHtcbiAgICAgICAgICAgICAgICBjYXB0aW9uVmFsdWUgPSBrby51dGlscy51bndyYXBPYnNlcnZhYmxlKGFsbEJpbmRpbmdzWydvcHRpb25zQ2FwdGlvbiddKTtcbiAgICAgICAgICAgICAgICAvLyBJZiBjYXB0aW9uIHZhbHVlIGlzIG51bGwgb3IgdW5kZWZpbmVkLCBkb24ndCBzaG93IGEgY2FwdGlvblxuICAgICAgICAgICAgICAgIGlmIChjYXB0aW9uVmFsdWUgIT09IG51bGwgJiYgY2FwdGlvblZhbHVlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgZmlsdGVyZWRBcnJheS51bnNoaWZ0KGNhcHRpb25QbGFjZWhvbGRlcik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gSWYgYSBmYWxzeSB2YWx1ZSBpcyBwcm92aWRlZCAoZS5nLiBudWxsKSwgd2UnbGwgc2ltcGx5IGVtcHR5IHRoZSBzZWxlY3QgZWxlbWVudFxuICAgICAgICAgICAgdW53cmFwcGVkQXJyYXkgPSBbXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGFwcGx5VG9PYmplY3Qob2JqZWN0LCBwcmVkaWNhdGUsIGRlZmF1bHRWYWx1ZSkge1xuICAgICAgICAgICAgdmFyIHByZWRpY2F0ZVR5cGUgPSB0eXBlb2YgcHJlZGljYXRlO1xuICAgICAgICAgICAgaWYgKHByZWRpY2F0ZVR5cGUgPT0gXCJmdW5jdGlvblwiKSAgICAvLyBHaXZlbiBhIGZ1bmN0aW9uOyBydW4gaXQgYWdhaW5zdCB0aGUgZGF0YSB2YWx1ZVxuICAgICAgICAgICAgICAgIHJldHVybiBwcmVkaWNhdGUob2JqZWN0KTtcbiAgICAgICAgICAgIGVsc2UgaWYgKHByZWRpY2F0ZVR5cGUgPT0gXCJzdHJpbmdcIikgLy8gR2l2ZW4gYSBzdHJpbmc7IHRyZWF0IGl0IGFzIGEgcHJvcGVydHkgbmFtZSBvbiB0aGUgZGF0YSB2YWx1ZVxuICAgICAgICAgICAgICAgIHJldHVybiBvYmplY3RbcHJlZGljYXRlXTtcbiAgICAgICAgICAgIGVsc2UgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEdpdmVuIG5vIG9wdGlvbnNUZXh0IGFyZzsgdXNlIHRoZSBkYXRhIHZhbHVlIGl0c2VsZlxuICAgICAgICAgICAgICAgIHJldHVybiBkZWZhdWx0VmFsdWU7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBUaGUgZm9sbG93aW5nIGZ1bmN0aW9ucyBjYW4gcnVuIGF0IHR3byBkaWZmZXJlbnQgdGltZXM6XG4gICAgICAgIC8vIFRoZSBmaXJzdCBpcyB3aGVuIHRoZSB3aG9sZSBhcnJheSBpcyBiZWluZyB1cGRhdGVkIGRpcmVjdGx5IGZyb20gdGhpcyBiaW5kaW5nIGhhbmRsZXIuXG4gICAgICAgIC8vIFRoZSBzZWNvbmQgaXMgd2hlbiBhbiBvYnNlcnZhYmxlIHZhbHVlIGZvciBhIHNwZWNpZmljIGFycmF5IGVudHJ5IGlzIHVwZGF0ZWQuXG4gICAgICAgIC8vIG9sZE9wdGlvbnMgd2lsbCBiZSBlbXB0eSBpbiB0aGUgZmlyc3QgY2FzZSwgYnV0IHdpbGwgYmUgZmlsbGVkIHdpdGggdGhlIHByZXZpb3VzbHkgZ2VuZXJhdGVkIG9wdGlvbiBpbiB0aGUgc2Vjb25kLlxuICAgICAgICBmdW5jdGlvbiBvcHRpb25Gb3JBcnJheUl0ZW0oYXJyYXlFbnRyeSwgaW5kZXgsIG9sZE9wdGlvbnMpIHtcbiAgICAgICAgICAgIGlmIChvbGRPcHRpb25zLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHByZXZpb3VzU2VsZWN0ZWRWYWx1ZXMgPSBvbGRPcHRpb25zWzBdLnNlbGVjdGVkICYmIFsga28uc2VsZWN0RXh0ZW5zaW9ucy5yZWFkVmFsdWUob2xkT3B0aW9uc1swXSkgXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBvcHRpb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwib3B0aW9uXCIpO1xuICAgICAgICAgICAgaWYgKGFycmF5RW50cnkgPT09IGNhcHRpb25QbGFjZWhvbGRlcikge1xuICAgICAgICAgICAgICAgIGtvLnV0aWxzLnNldEh0bWwob3B0aW9uLCBjYXB0aW9uVmFsdWUpO1xuICAgICAgICAgICAgICAgIGtvLnNlbGVjdEV4dGVuc2lvbnMud3JpdGVWYWx1ZShvcHRpb24sIHVuZGVmaW5lZCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIEFwcGx5IGEgdmFsdWUgdG8gdGhlIG9wdGlvbiBlbGVtZW50XG4gICAgICAgICAgICAgICAgdmFyIG9wdGlvblZhbHVlID0gYXBwbHlUb09iamVjdChhcnJheUVudHJ5LCBhbGxCaW5kaW5nc1snb3B0aW9uc1ZhbHVlJ10sIGFycmF5RW50cnkpO1xuICAgICAgICAgICAgICAgIGtvLnNlbGVjdEV4dGVuc2lvbnMud3JpdGVWYWx1ZShvcHRpb24sIGtvLnV0aWxzLnVud3JhcE9ic2VydmFibGUob3B0aW9uVmFsdWUpKTtcblxuICAgICAgICAgICAgICAgIC8vIEFwcGx5IHNvbWUgdGV4dCB0byB0aGUgb3B0aW9uIGVsZW1lbnRcbiAgICAgICAgICAgICAgICB2YXIgb3B0aW9uVGV4dCA9IGFwcGx5VG9PYmplY3QoYXJyYXlFbnRyeSwgYWxsQmluZGluZ3NbJ29wdGlvbnNUZXh0J10sIG9wdGlvblZhbHVlKTtcbiAgICAgICAgICAgICAgICBrby51dGlscy5zZXRUZXh0Q29udGVudChvcHRpb24sIG9wdGlvblRleHQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIFtvcHRpb25dO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gc2V0U2VsZWN0aW9uQ2FsbGJhY2soYXJyYXlFbnRyeSwgbmV3T3B0aW9ucykge1xuICAgICAgICAgICAgLy8gSUU2IGRvZXNuJ3QgbGlrZSB1cyB0byBhc3NpZ24gc2VsZWN0aW9uIHRvIE9QVElPTiBub2RlcyBiZWZvcmUgdGhleSdyZSBhZGRlZCB0byB0aGUgZG9jdW1lbnQuXG4gICAgICAgICAgICAvLyBUaGF0J3Mgd2h5IHdlIGZpcnN0IGFkZGVkIHRoZW0gd2l0aG91dCBzZWxlY3Rpb24uIE5vdyBpdCdzIHRpbWUgdG8gc2V0IHRoZSBzZWxlY3Rpb24uXG4gICAgICAgICAgICBpZiAocHJldmlvdXNTZWxlY3RlZFZhbHVlcykge1xuICAgICAgICAgICAgICAgIHZhciBpc1NlbGVjdGVkID0ga28udXRpbHMuYXJyYXlJbmRleE9mKHByZXZpb3VzU2VsZWN0ZWRWYWx1ZXMsIGtvLnNlbGVjdEV4dGVuc2lvbnMucmVhZFZhbHVlKG5ld09wdGlvbnNbMF0pKSA+PSAwO1xuICAgICAgICAgICAgICAgIGtvLnV0aWxzLnNldE9wdGlvbk5vZGVTZWxlY3Rpb25TdGF0ZShuZXdPcHRpb25zWzBdLCBpc1NlbGVjdGVkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBjYWxsYmFjayA9IHNldFNlbGVjdGlvbkNhbGxiYWNrO1xuICAgICAgICBpZiAoYWxsQmluZGluZ3NbJ29wdGlvbnNBZnRlclJlbmRlciddKSB7XG4gICAgICAgICAgICBjYWxsYmFjayA9IGZ1bmN0aW9uKGFycmF5RW50cnksIG5ld09wdGlvbnMpIHtcbiAgICAgICAgICAgICAgICBzZXRTZWxlY3Rpb25DYWxsYmFjayhhcnJheUVudHJ5LCBuZXdPcHRpb25zKTtcbiAgICAgICAgICAgICAgICBrby5kZXBlbmRlbmN5RGV0ZWN0aW9uLmlnbm9yZShhbGxCaW5kaW5nc1snb3B0aW9uc0FmdGVyUmVuZGVyJ10sIG51bGwsIFtuZXdPcHRpb25zWzBdLCBhcnJheUVudHJ5ICE9PSBjYXB0aW9uUGxhY2Vob2xkZXIgPyBhcnJheUVudHJ5IDogdW5kZWZpbmVkXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBrby51dGlscy5zZXREb21Ob2RlQ2hpbGRyZW5Gcm9tQXJyYXlNYXBwaW5nKGVsZW1lbnQsIGZpbHRlcmVkQXJyYXksIG9wdGlvbkZvckFycmF5SXRlbSwgbnVsbCwgY2FsbGJhY2spO1xuXG4gICAgICAgIC8vIENsZWFyIHByZXZpb3VzU2VsZWN0ZWRWYWx1ZXMgc28gdGhhdCBmdXR1cmUgdXBkYXRlcyB0byBpbmRpdmlkdWFsIG9iamVjdHMgZG9uJ3QgZ2V0IHN0YWxlIGRhdGFcbiAgICAgICAgcHJldmlvdXNTZWxlY3RlZFZhbHVlcyA9IG51bGw7XG5cbiAgICAgICAgaWYgKHNlbGVjdFdhc1ByZXZpb3VzbHlFbXB0eSAmJiAoJ3ZhbHVlJyBpbiBhbGxCaW5kaW5ncykpIHtcbiAgICAgICAgICAgIC8vIEVuc3VyZSBjb25zaXN0ZW5jeSBiZXR3ZWVuIG1vZGVsIHZhbHVlIGFuZCBzZWxlY3RlZCBvcHRpb24uXG4gICAgICAgICAgICAvLyBJZiB0aGUgZHJvcGRvd24gaXMgYmVpbmcgcG9wdWxhdGVkIGZvciB0aGUgZmlyc3QgdGltZSBoZXJlIChvciB3YXMgb3RoZXJ3aXNlIHByZXZpb3VzbHkgZW1wdHkpLFxuICAgICAgICAgICAgLy8gdGhlIGRyb3Bkb3duIHNlbGVjdGlvbiBzdGF0ZSBpcyBtZWFuaW5nbGVzcywgc28gd2UgcHJlc2VydmUgdGhlIG1vZGVsIHZhbHVlLlxuICAgICAgICAgICAgZW5zdXJlRHJvcGRvd25TZWxlY3Rpb25Jc0NvbnNpc3RlbnRXaXRoTW9kZWxWYWx1ZShlbGVtZW50LCBrby51dGlscy5wZWVrT2JzZXJ2YWJsZShhbGxCaW5kaW5nc1sndmFsdWUnXSksIC8qIHByZWZlck1vZGVsVmFsdWUgKi8gdHJ1ZSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBXb3JrYXJvdW5kIGZvciBJRSBidWdcbiAgICAgICAga28udXRpbHMuZW5zdXJlU2VsZWN0RWxlbWVudElzUmVuZGVyZWRDb3JyZWN0bHkoZWxlbWVudCk7XG5cbiAgICAgICAgaWYgKHByZXZpb3VzU2Nyb2xsVG9wICYmIE1hdGguYWJzKHByZXZpb3VzU2Nyb2xsVG9wIC0gZWxlbWVudC5zY3JvbGxUb3ApID4gMjApXG4gICAgICAgICAgICBlbGVtZW50LnNjcm9sbFRvcCA9IHByZXZpb3VzU2Nyb2xsVG9wO1xuICAgIH1cbn07XG5rby5iaW5kaW5nSGFuZGxlcnNbJ29wdGlvbnMnXS5vcHRpb25WYWx1ZURvbURhdGFLZXkgPSAnX19rby5vcHRpb25WYWx1ZURvbURhdGFfXyc7XG5rby5iaW5kaW5nSGFuZGxlcnNbJ3NlbGVjdGVkT3B0aW9ucyddID0ge1xuICAgICdpbml0JzogZnVuY3Rpb24gKGVsZW1lbnQsIHZhbHVlQWNjZXNzb3IsIGFsbEJpbmRpbmdzQWNjZXNzb3IpIHtcbiAgICAgICAga28udXRpbHMucmVnaXN0ZXJFdmVudEhhbmRsZXIoZWxlbWVudCwgXCJjaGFuZ2VcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHZhbHVlID0gdmFsdWVBY2Nlc3NvcigpLCB2YWx1ZVRvV3JpdGUgPSBbXTtcbiAgICAgICAgICAgIGtvLnV0aWxzLmFycmF5Rm9yRWFjaChlbGVtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKFwib3B0aW9uXCIpLCBmdW5jdGlvbihub2RlKSB7XG4gICAgICAgICAgICAgICAgaWYgKG5vZGUuc2VsZWN0ZWQpXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlVG9Xcml0ZS5wdXNoKGtvLnNlbGVjdEV4dGVuc2lvbnMucmVhZFZhbHVlKG5vZGUpKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAga28uZXhwcmVzc2lvblJld3JpdGluZy53cml0ZVZhbHVlVG9Qcm9wZXJ0eSh2YWx1ZSwgYWxsQmluZGluZ3NBY2Nlc3NvciwgJ3NlbGVjdGVkT3B0aW9ucycsIHZhbHVlVG9Xcml0ZSk7XG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgJ3VwZGF0ZSc6IGZ1bmN0aW9uIChlbGVtZW50LCB2YWx1ZUFjY2Vzc29yKSB7XG4gICAgICAgIGlmIChrby51dGlscy50YWdOYW1lTG93ZXIoZWxlbWVudCkgIT0gXCJzZWxlY3RcIilcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcInZhbHVlcyBiaW5kaW5nIGFwcGxpZXMgb25seSB0byBTRUxFQ1QgZWxlbWVudHNcIik7XG5cbiAgICAgICAgdmFyIG5ld1ZhbHVlID0ga28udXRpbHMudW53cmFwT2JzZXJ2YWJsZSh2YWx1ZUFjY2Vzc29yKCkpO1xuICAgICAgICBpZiAobmV3VmFsdWUgJiYgdHlwZW9mIG5ld1ZhbHVlLmxlbmd0aCA9PSBcIm51bWJlclwiKSB7XG4gICAgICAgICAgICBrby51dGlscy5hcnJheUZvckVhY2goZWxlbWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZShcIm9wdGlvblwiKSwgZnVuY3Rpb24obm9kZSkge1xuICAgICAgICAgICAgICAgIHZhciBpc1NlbGVjdGVkID0ga28udXRpbHMuYXJyYXlJbmRleE9mKG5ld1ZhbHVlLCBrby5zZWxlY3RFeHRlbnNpb25zLnJlYWRWYWx1ZShub2RlKSkgPj0gMDtcbiAgICAgICAgICAgICAgICBrby51dGlscy5zZXRPcHRpb25Ob2RlU2VsZWN0aW9uU3RhdGUobm9kZSwgaXNTZWxlY3RlZCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cbn07XG5rby5iaW5kaW5nSGFuZGxlcnNbJ3N0eWxlJ10gPSB7XG4gICAgJ3VwZGF0ZSc6IGZ1bmN0aW9uIChlbGVtZW50LCB2YWx1ZUFjY2Vzc29yKSB7XG4gICAgICAgIHZhciB2YWx1ZSA9IGtvLnV0aWxzLnVud3JhcE9ic2VydmFibGUodmFsdWVBY2Nlc3NvcigpIHx8IHt9KTtcbiAgICAgICAga28udXRpbHMub2JqZWN0Rm9yRWFjaCh2YWx1ZSwgZnVuY3Rpb24oc3R5bGVOYW1lLCBzdHlsZVZhbHVlKSB7XG4gICAgICAgICAgICBzdHlsZVZhbHVlID0ga28udXRpbHMudW53cmFwT2JzZXJ2YWJsZShzdHlsZVZhbHVlKTtcbiAgICAgICAgICAgIGVsZW1lbnQuc3R5bGVbc3R5bGVOYW1lXSA9IHN0eWxlVmFsdWUgfHwgXCJcIjsgLy8gRW1wdHkgc3RyaW5nIHJlbW92ZXMgdGhlIHZhbHVlLCB3aGVyZWFzIG51bGwvdW5kZWZpbmVkIGhhdmUgbm8gZWZmZWN0XG4gICAgICAgIH0pO1xuICAgIH1cbn07XG5rby5iaW5kaW5nSGFuZGxlcnNbJ3N1Ym1pdCddID0ge1xuICAgICdpbml0JzogZnVuY3Rpb24gKGVsZW1lbnQsIHZhbHVlQWNjZXNzb3IsIGFsbEJpbmRpbmdzQWNjZXNzb3IsIHZpZXdNb2RlbCkge1xuICAgICAgICBpZiAodHlwZW9mIHZhbHVlQWNjZXNzb3IoKSAhPSBcImZ1bmN0aW9uXCIpXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJUaGUgdmFsdWUgZm9yIGEgc3VibWl0IGJpbmRpbmcgbXVzdCBiZSBhIGZ1bmN0aW9uXCIpO1xuICAgICAgICBrby51dGlscy5yZWdpc3RlckV2ZW50SGFuZGxlcihlbGVtZW50LCBcInN1Ym1pdFwiLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgIHZhciBoYW5kbGVyUmV0dXJuVmFsdWU7XG4gICAgICAgICAgICB2YXIgdmFsdWUgPSB2YWx1ZUFjY2Vzc29yKCk7XG4gICAgICAgICAgICB0cnkgeyBoYW5kbGVyUmV0dXJuVmFsdWUgPSB2YWx1ZS5jYWxsKHZpZXdNb2RlbCwgZWxlbWVudCk7IH1cbiAgICAgICAgICAgIGZpbmFsbHkge1xuICAgICAgICAgICAgICAgIGlmIChoYW5kbGVyUmV0dXJuVmFsdWUgIT09IHRydWUpIHsgLy8gTm9ybWFsbHkgd2Ugd2FudCB0byBwcmV2ZW50IGRlZmF1bHQgYWN0aW9uLiBEZXZlbG9wZXIgY2FuIG92ZXJyaWRlIHRoaXMgYmUgZXhwbGljaXRseSByZXR1cm5pbmcgdHJ1ZS5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGV2ZW50LnByZXZlbnREZWZhdWx0KVxuICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnQucmV0dXJuVmFsdWUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbn07XG5rby5iaW5kaW5nSGFuZGxlcnNbJ3RleHQnXSA9IHtcbiAgICAndXBkYXRlJzogZnVuY3Rpb24gKGVsZW1lbnQsIHZhbHVlQWNjZXNzb3IpIHtcbiAgICAgICAga28udXRpbHMuc2V0VGV4dENvbnRlbnQoZWxlbWVudCwgdmFsdWVBY2Nlc3NvcigpKTtcbiAgICB9XG59O1xua28udmlydHVhbEVsZW1lbnRzLmFsbG93ZWRCaW5kaW5nc1sndGV4dCddID0gdHJ1ZTtcbmtvLmJpbmRpbmdIYW5kbGVyc1sndW5pcXVlTmFtZSddID0ge1xuICAgICdpbml0JzogZnVuY3Rpb24gKGVsZW1lbnQsIHZhbHVlQWNjZXNzb3IpIHtcbiAgICAgICAgaWYgKHZhbHVlQWNjZXNzb3IoKSkge1xuICAgICAgICAgICAgdmFyIG5hbWUgPSBcImtvX3VuaXF1ZV9cIiArICgrK2tvLmJpbmRpbmdIYW5kbGVyc1sndW5pcXVlTmFtZSddLmN1cnJlbnRJbmRleCk7XG4gICAgICAgICAgICBrby51dGlscy5zZXRFbGVtZW50TmFtZShlbGVtZW50LCBuYW1lKTtcbiAgICAgICAgfVxuICAgIH1cbn07XG5rby5iaW5kaW5nSGFuZGxlcnNbJ3VuaXF1ZU5hbWUnXS5jdXJyZW50SW5kZXggPSAwO1xua28uYmluZGluZ0hhbmRsZXJzWyd2YWx1ZSddID0ge1xuICAgICdpbml0JzogZnVuY3Rpb24gKGVsZW1lbnQsIHZhbHVlQWNjZXNzb3IsIGFsbEJpbmRpbmdzQWNjZXNzb3IpIHtcbiAgICAgICAgLy8gQWx3YXlzIGNhdGNoIFwiY2hhbmdlXCIgZXZlbnQ7IHBvc3NpYmx5IG90aGVyIGV2ZW50cyB0b28gaWYgYXNrZWRcbiAgICAgICAgdmFyIGV2ZW50c1RvQ2F0Y2ggPSBbXCJjaGFuZ2VcIl07XG4gICAgICAgIHZhciByZXF1ZXN0ZWRFdmVudHNUb0NhdGNoID0gYWxsQmluZGluZ3NBY2Nlc3NvcigpW1widmFsdWVVcGRhdGVcIl07XG4gICAgICAgIHZhciBwcm9wZXJ0eUNoYW5nZWRGaXJlZCA9IGZhbHNlO1xuICAgICAgICBpZiAocmVxdWVzdGVkRXZlbnRzVG9DYXRjaCkge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiByZXF1ZXN0ZWRFdmVudHNUb0NhdGNoID09IFwic3RyaW5nXCIpIC8vIEFsbG93IGJvdGggaW5kaXZpZHVhbCBldmVudCBuYW1lcywgYW5kIGFycmF5cyBvZiBldmVudCBuYW1lc1xuICAgICAgICAgICAgICAgIHJlcXVlc3RlZEV2ZW50c1RvQ2F0Y2ggPSBbcmVxdWVzdGVkRXZlbnRzVG9DYXRjaF07XG4gICAgICAgICAgICBrby51dGlscy5hcnJheVB1c2hBbGwoZXZlbnRzVG9DYXRjaCwgcmVxdWVzdGVkRXZlbnRzVG9DYXRjaCk7XG4gICAgICAgICAgICBldmVudHNUb0NhdGNoID0ga28udXRpbHMuYXJyYXlHZXREaXN0aW5jdFZhbHVlcyhldmVudHNUb0NhdGNoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciB2YWx1ZVVwZGF0ZUhhbmRsZXIgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHByb3BlcnR5Q2hhbmdlZEZpcmVkID0gZmFsc2U7XG4gICAgICAgICAgICB2YXIgbW9kZWxWYWx1ZSA9IHZhbHVlQWNjZXNzb3IoKTtcbiAgICAgICAgICAgIHZhciBlbGVtZW50VmFsdWUgPSBrby5zZWxlY3RFeHRlbnNpb25zLnJlYWRWYWx1ZShlbGVtZW50KTtcbiAgICAgICAgICAgIGtvLmV4cHJlc3Npb25SZXdyaXRpbmcud3JpdGVWYWx1ZVRvUHJvcGVydHkobW9kZWxWYWx1ZSwgYWxsQmluZGluZ3NBY2Nlc3NvciwgJ3ZhbHVlJywgZWxlbWVudFZhbHVlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFdvcmthcm91bmQgZm9yIGh0dHBzOi8vZ2l0aHViLmNvbS9TdGV2ZVNhbmRlcnNvbi9rbm9ja291dC9pc3N1ZXMvMTIyXG4gICAgICAgIC8vIElFIGRvZXNuJ3QgZmlyZSBcImNoYW5nZVwiIGV2ZW50cyBvbiB0ZXh0Ym94ZXMgaWYgdGhlIHVzZXIgc2VsZWN0cyBhIHZhbHVlIGZyb20gaXRzIGF1dG9jb21wbGV0ZSBsaXN0XG4gICAgICAgIHZhciBpZUF1dG9Db21wbGV0ZUhhY2tOZWVkZWQgPSBrby51dGlscy5pZVZlcnNpb24gJiYgZWxlbWVudC50YWdOYW1lLnRvTG93ZXJDYXNlKCkgPT0gXCJpbnB1dFwiICYmIGVsZW1lbnQudHlwZSA9PSBcInRleHRcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJiYgZWxlbWVudC5hdXRvY29tcGxldGUgIT0gXCJvZmZcIiAmJiAoIWVsZW1lbnQuZm9ybSB8fCBlbGVtZW50LmZvcm0uYXV0b2NvbXBsZXRlICE9IFwib2ZmXCIpO1xuICAgICAgICBpZiAoaWVBdXRvQ29tcGxldGVIYWNrTmVlZGVkICYmIGtvLnV0aWxzLmFycmF5SW5kZXhPZihldmVudHNUb0NhdGNoLCBcInByb3BlcnR5Y2hhbmdlXCIpID09IC0xKSB7XG4gICAgICAgICAgICBrby51dGlscy5yZWdpc3RlckV2ZW50SGFuZGxlcihlbGVtZW50LCBcInByb3BlcnR5Y2hhbmdlXCIsIGZ1bmN0aW9uICgpIHsgcHJvcGVydHlDaGFuZ2VkRmlyZWQgPSB0cnVlIH0pO1xuICAgICAgICAgICAga28udXRpbHMucmVnaXN0ZXJFdmVudEhhbmRsZXIoZWxlbWVudCwgXCJibHVyXCIsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGlmIChwcm9wZXJ0eUNoYW5nZWRGaXJlZCkge1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZVVwZGF0ZUhhbmRsZXIoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGtvLnV0aWxzLmFycmF5Rm9yRWFjaChldmVudHNUb0NhdGNoLCBmdW5jdGlvbihldmVudE5hbWUpIHtcbiAgICAgICAgICAgIC8vIFRoZSBzeW50YXggXCJhZnRlcjxldmVudG5hbWU+XCIgbWVhbnMgXCJydW4gdGhlIGhhbmRsZXIgYXN5bmNocm9ub3VzbHkgYWZ0ZXIgdGhlIGV2ZW50XCJcbiAgICAgICAgICAgIC8vIFRoaXMgaXMgdXNlZnVsLCBmb3IgZXhhbXBsZSwgdG8gY2F0Y2ggXCJrZXlkb3duXCIgZXZlbnRzIGFmdGVyIHRoZSBicm93c2VyIGhhcyB1cGRhdGVkIHRoZSBjb250cm9sXG4gICAgICAgICAgICAvLyAob3RoZXJ3aXNlLCBrby5zZWxlY3RFeHRlbnNpb25zLnJlYWRWYWx1ZSh0aGlzKSB3aWxsIHJlY2VpdmUgdGhlIGNvbnRyb2wncyB2YWx1ZSAqYmVmb3JlKiB0aGUga2V5IGV2ZW50KVxuICAgICAgICAgICAgdmFyIGhhbmRsZXIgPSB2YWx1ZVVwZGF0ZUhhbmRsZXI7XG4gICAgICAgICAgICBpZiAoa28udXRpbHMuc3RyaW5nU3RhcnRzV2l0aChldmVudE5hbWUsIFwiYWZ0ZXJcIikpIHtcbiAgICAgICAgICAgICAgICBoYW5kbGVyID0gZnVuY3Rpb24oKSB7IHNldFRpbWVvdXQodmFsdWVVcGRhdGVIYW5kbGVyLCAwKSB9O1xuICAgICAgICAgICAgICAgIGV2ZW50TmFtZSA9IGV2ZW50TmFtZS5zdWJzdHJpbmcoXCJhZnRlclwiLmxlbmd0aCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBrby51dGlscy5yZWdpc3RlckV2ZW50SGFuZGxlcihlbGVtZW50LCBldmVudE5hbWUsIGhhbmRsZXIpO1xuICAgICAgICB9KTtcbiAgICB9LFxuICAgICd1cGRhdGUnOiBmdW5jdGlvbiAoZWxlbWVudCwgdmFsdWVBY2Nlc3Nvcikge1xuICAgICAgICB2YXIgdmFsdWVJc1NlbGVjdE9wdGlvbiA9IGtvLnV0aWxzLnRhZ05hbWVMb3dlcihlbGVtZW50KSA9PT0gXCJzZWxlY3RcIjtcbiAgICAgICAgdmFyIG5ld1ZhbHVlID0ga28udXRpbHMudW53cmFwT2JzZXJ2YWJsZSh2YWx1ZUFjY2Vzc29yKCkpO1xuICAgICAgICB2YXIgZWxlbWVudFZhbHVlID0ga28uc2VsZWN0RXh0ZW5zaW9ucy5yZWFkVmFsdWUoZWxlbWVudCk7XG4gICAgICAgIHZhciB2YWx1ZUhhc0NoYW5nZWQgPSAobmV3VmFsdWUgIT09IGVsZW1lbnRWYWx1ZSk7XG5cbiAgICAgICAgaWYgKHZhbHVlSGFzQ2hhbmdlZCkge1xuICAgICAgICAgICAgdmFyIGFwcGx5VmFsdWVBY3Rpb24gPSBmdW5jdGlvbiAoKSB7IGtvLnNlbGVjdEV4dGVuc2lvbnMud3JpdGVWYWx1ZShlbGVtZW50LCBuZXdWYWx1ZSk7IH07XG4gICAgICAgICAgICBhcHBseVZhbHVlQWN0aW9uKCk7XG5cbiAgICAgICAgICAgIC8vIFdvcmthcm91bmQgZm9yIElFNiBidWc6IEl0IHdvbid0IHJlbGlhYmx5IGFwcGx5IHZhbHVlcyB0byBTRUxFQ1Qgbm9kZXMgZHVyaW5nIHRoZSBzYW1lIGV4ZWN1dGlvbiB0aHJlYWRcbiAgICAgICAgICAgIC8vIHJpZ2h0IGFmdGVyIHlvdSd2ZSBjaGFuZ2VkIHRoZSBzZXQgb2YgT1BUSU9OIG5vZGVzIG9uIGl0LiBTbyBmb3IgdGhhdCBub2RlIHR5cGUsIHdlJ2xsIHNjaGVkdWxlIGEgc2Vjb25kIHRocmVhZFxuICAgICAgICAgICAgLy8gdG8gYXBwbHkgdGhlIHZhbHVlIGFzIHdlbGwuXG4gICAgICAgICAgICB2YXIgYWxzb0FwcGx5QXN5bmNocm9ub3VzbHkgPSB2YWx1ZUlzU2VsZWN0T3B0aW9uO1xuICAgICAgICAgICAgaWYgKGFsc29BcHBseUFzeW5jaHJvbm91c2x5KVxuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoYXBwbHlWYWx1ZUFjdGlvbiwgMCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJZiB5b3UgdHJ5IHRvIHNldCBhIG1vZGVsIHZhbHVlIHRoYXQgY2FuJ3QgYmUgcmVwcmVzZW50ZWQgaW4gYW4gYWxyZWFkeS1wb3B1bGF0ZWQgZHJvcGRvd24sIHJlamVjdCB0aGF0IGNoYW5nZSxcbiAgICAgICAgLy8gYmVjYXVzZSB5b3UncmUgbm90IGFsbG93ZWQgdG8gaGF2ZSBhIG1vZGVsIHZhbHVlIHRoYXQgZGlzYWdyZWVzIHdpdGggYSB2aXNpYmxlIFVJIHNlbGVjdGlvbi5cbiAgICAgICAgaWYgKHZhbHVlSXNTZWxlY3RPcHRpb24gJiYgKGVsZW1lbnQubGVuZ3RoID4gMCkpXG4gICAgICAgICAgICBlbnN1cmVEcm9wZG93blNlbGVjdGlvbklzQ29uc2lzdGVudFdpdGhNb2RlbFZhbHVlKGVsZW1lbnQsIG5ld1ZhbHVlLCAvKiBwcmVmZXJNb2RlbFZhbHVlICovIGZhbHNlKTtcbiAgICB9XG59O1xua28uYmluZGluZ0hhbmRsZXJzWyd2aXNpYmxlJ10gPSB7XG4gICAgJ3VwZGF0ZSc6IGZ1bmN0aW9uIChlbGVtZW50LCB2YWx1ZUFjY2Vzc29yKSB7XG4gICAgICAgIHZhciB2YWx1ZSA9IGtvLnV0aWxzLnVud3JhcE9ic2VydmFibGUodmFsdWVBY2Nlc3NvcigpKTtcbiAgICAgICAgdmFyIGlzQ3VycmVudGx5VmlzaWJsZSA9ICEoZWxlbWVudC5zdHlsZS5kaXNwbGF5ID09IFwibm9uZVwiKTtcbiAgICAgICAgaWYgKHZhbHVlICYmICFpc0N1cnJlbnRseVZpc2libGUpXG4gICAgICAgICAgICBlbGVtZW50LnN0eWxlLmRpc3BsYXkgPSBcIlwiO1xuICAgICAgICBlbHNlIGlmICgoIXZhbHVlKSAmJiBpc0N1cnJlbnRseVZpc2libGUpXG4gICAgICAgICAgICBlbGVtZW50LnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICB9XG59O1xuLy8gJ2NsaWNrJyBpcyBqdXN0IGEgc2hvcnRoYW5kIGZvciB0aGUgdXN1YWwgZnVsbC1sZW5ndGggZXZlbnQ6e2NsaWNrOmhhbmRsZXJ9XG5tYWtlRXZlbnRIYW5kbGVyU2hvcnRjdXQoJ2NsaWNrJyk7XG4vLyBJZiB5b3Ugd2FudCB0byBtYWtlIGEgY3VzdG9tIHRlbXBsYXRlIGVuZ2luZSxcbi8vXG4vLyBbMV0gSW5oZXJpdCBmcm9tIHRoaXMgY2xhc3MgKGxpa2Uga28ubmF0aXZlVGVtcGxhdGVFbmdpbmUgZG9lcylcbi8vIFsyXSBPdmVycmlkZSAncmVuZGVyVGVtcGxhdGVTb3VyY2UnLCBzdXBwbHlpbmcgYSBmdW5jdGlvbiB3aXRoIHRoaXMgc2lnbmF0dXJlOlxuLy9cbi8vICAgICAgICBmdW5jdGlvbiAodGVtcGxhdGVTb3VyY2UsIGJpbmRpbmdDb250ZXh0LCBvcHRpb25zKSB7XG4vLyAgICAgICAgICAgIC8vIC0gdGVtcGxhdGVTb3VyY2UudGV4dCgpIGlzIHRoZSB0ZXh0IG9mIHRoZSB0ZW1wbGF0ZSB5b3Ugc2hvdWxkIHJlbmRlclxuLy8gICAgICAgICAgICAvLyAtIGJpbmRpbmdDb250ZXh0LiRkYXRhIGlzIHRoZSBkYXRhIHlvdSBzaG91bGQgcGFzcyBpbnRvIHRoZSB0ZW1wbGF0ZVxuLy8gICAgICAgICAgICAvLyAgIC0geW91IG1pZ2h0IGFsc28gd2FudCB0byBtYWtlIGJpbmRpbmdDb250ZXh0LiRwYXJlbnQsIGJpbmRpbmdDb250ZXh0LiRwYXJlbnRzLFxuLy8gICAgICAgICAgICAvLyAgICAgYW5kIGJpbmRpbmdDb250ZXh0LiRyb290IGF2YWlsYWJsZSBpbiB0aGUgdGVtcGxhdGUgdG9vXG4vLyAgICAgICAgICAgIC8vIC0gb3B0aW9ucyBnaXZlcyB5b3UgYWNjZXNzIHRvIGFueSBvdGhlciBwcm9wZXJ0aWVzIHNldCBvbiBcImRhdGEtYmluZDogeyB0ZW1wbGF0ZTogb3B0aW9ucyB9XCJcbi8vICAgICAgICAgICAgLy9cbi8vICAgICAgICAgICAgLy8gUmV0dXJuIHZhbHVlOiBhbiBhcnJheSBvZiBET00gbm9kZXNcbi8vICAgICAgICB9XG4vL1xuLy8gWzNdIE92ZXJyaWRlICdjcmVhdGVKYXZhU2NyaXB0RXZhbHVhdG9yQmxvY2snLCBzdXBwbHlpbmcgYSBmdW5jdGlvbiB3aXRoIHRoaXMgc2lnbmF0dXJlOlxuLy9cbi8vICAgICAgICBmdW5jdGlvbiAoc2NyaXB0KSB7XG4vLyAgICAgICAgICAgIC8vIFJldHVybiB2YWx1ZTogV2hhdGV2ZXIgc3ludGF4IG1lYW5zIFwiRXZhbHVhdGUgdGhlIEphdmFTY3JpcHQgc3RhdGVtZW50ICdzY3JpcHQnIGFuZCBvdXRwdXQgdGhlIHJlc3VsdFwiXG4vLyAgICAgICAgICAgIC8vICAgICAgICAgICAgICAgRm9yIGV4YW1wbGUsIHRoZSBqcXVlcnkudG1wbCB0ZW1wbGF0ZSBlbmdpbmUgY29udmVydHMgJ3NvbWVTY3JpcHQnIHRvICckeyBzb21lU2NyaXB0IH0nXG4vLyAgICAgICAgfVxuLy9cbi8vICAgICBUaGlzIGlzIG9ubHkgbmVjZXNzYXJ5IGlmIHlvdSB3YW50IHRvIGFsbG93IGRhdGEtYmluZCBhdHRyaWJ1dGVzIHRvIHJlZmVyZW5jZSBhcmJpdHJhcnkgdGVtcGxhdGUgdmFyaWFibGVzLlxuLy8gICAgIElmIHlvdSBkb24ndCB3YW50IHRvIGFsbG93IHRoYXQsIHlvdSBjYW4gc2V0IHRoZSBwcm9wZXJ0eSAnYWxsb3dUZW1wbGF0ZVJld3JpdGluZycgdG8gZmFsc2UgKGxpa2Uga28ubmF0aXZlVGVtcGxhdGVFbmdpbmUgZG9lcylcbi8vICAgICBhbmQgdGhlbiB5b3UgZG9uJ3QgbmVlZCB0byBvdmVycmlkZSAnY3JlYXRlSmF2YVNjcmlwdEV2YWx1YXRvckJsb2NrJy5cblxua28udGVtcGxhdGVFbmdpbmUgPSBmdW5jdGlvbiAoKSB7IH07XG5cbmtvLnRlbXBsYXRlRW5naW5lLnByb3RvdHlwZVsncmVuZGVyVGVtcGxhdGVTb3VyY2UnXSA9IGZ1bmN0aW9uICh0ZW1wbGF0ZVNvdXJjZSwgYmluZGluZ0NvbnRleHQsIG9wdGlvbnMpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJPdmVycmlkZSByZW5kZXJUZW1wbGF0ZVNvdXJjZVwiKTtcbn07XG5cbmtvLnRlbXBsYXRlRW5naW5lLnByb3RvdHlwZVsnY3JlYXRlSmF2YVNjcmlwdEV2YWx1YXRvckJsb2NrJ10gPSBmdW5jdGlvbiAoc2NyaXB0KSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiT3ZlcnJpZGUgY3JlYXRlSmF2YVNjcmlwdEV2YWx1YXRvckJsb2NrXCIpO1xufTtcblxua28udGVtcGxhdGVFbmdpbmUucHJvdG90eXBlWydtYWtlVGVtcGxhdGVTb3VyY2UnXSA9IGZ1bmN0aW9uKHRlbXBsYXRlLCB0ZW1wbGF0ZURvY3VtZW50KSB7XG4gICAgLy8gTmFtZWQgdGVtcGxhdGVcbiAgICBpZiAodHlwZW9mIHRlbXBsYXRlID09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgdGVtcGxhdGVEb2N1bWVudCA9IHRlbXBsYXRlRG9jdW1lbnQgfHwgZG9jdW1lbnQ7XG4gICAgICAgIHZhciBlbGVtID0gdGVtcGxhdGVEb2N1bWVudC5nZXRFbGVtZW50QnlJZCh0ZW1wbGF0ZSk7XG4gICAgICAgIGlmICghZWxlbSlcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIHRlbXBsYXRlIHdpdGggSUQgXCIgKyB0ZW1wbGF0ZSk7XG4gICAgICAgIHJldHVybiBuZXcga28udGVtcGxhdGVTb3VyY2VzLmRvbUVsZW1lbnQoZWxlbSk7XG4gICAgfSBlbHNlIGlmICgodGVtcGxhdGUubm9kZVR5cGUgPT0gMSkgfHwgKHRlbXBsYXRlLm5vZGVUeXBlID09IDgpKSB7XG4gICAgICAgIC8vIEFub255bW91cyB0ZW1wbGF0ZVxuICAgICAgICByZXR1cm4gbmV3IGtvLnRlbXBsYXRlU291cmNlcy5hbm9ueW1vdXNUZW1wbGF0ZSh0ZW1wbGF0ZSk7XG4gICAgfSBlbHNlXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlVua25vd24gdGVtcGxhdGUgdHlwZTogXCIgKyB0ZW1wbGF0ZSk7XG59O1xuXG5rby50ZW1wbGF0ZUVuZ2luZS5wcm90b3R5cGVbJ3JlbmRlclRlbXBsYXRlJ10gPSBmdW5jdGlvbiAodGVtcGxhdGUsIGJpbmRpbmdDb250ZXh0LCBvcHRpb25zLCB0ZW1wbGF0ZURvY3VtZW50KSB7XG4gICAgdmFyIHRlbXBsYXRlU291cmNlID0gdGhpc1snbWFrZVRlbXBsYXRlU291cmNlJ10odGVtcGxhdGUsIHRlbXBsYXRlRG9jdW1lbnQpO1xuICAgIHJldHVybiB0aGlzWydyZW5kZXJUZW1wbGF0ZVNvdXJjZSddKHRlbXBsYXRlU291cmNlLCBiaW5kaW5nQ29udGV4dCwgb3B0aW9ucyk7XG59O1xuXG5rby50ZW1wbGF0ZUVuZ2luZS5wcm90b3R5cGVbJ2lzVGVtcGxhdGVSZXdyaXR0ZW4nXSA9IGZ1bmN0aW9uICh0ZW1wbGF0ZSwgdGVtcGxhdGVEb2N1bWVudCkge1xuICAgIC8vIFNraXAgcmV3cml0aW5nIGlmIHJlcXVlc3RlZFxuICAgIGlmICh0aGlzWydhbGxvd1RlbXBsYXRlUmV3cml0aW5nJ10gPT09IGZhbHNlKVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICByZXR1cm4gdGhpc1snbWFrZVRlbXBsYXRlU291cmNlJ10odGVtcGxhdGUsIHRlbXBsYXRlRG9jdW1lbnQpWydkYXRhJ10oXCJpc1Jld3JpdHRlblwiKTtcbn07XG5cbmtvLnRlbXBsYXRlRW5naW5lLnByb3RvdHlwZVsncmV3cml0ZVRlbXBsYXRlJ10gPSBmdW5jdGlvbiAodGVtcGxhdGUsIHJld3JpdGVyQ2FsbGJhY2ssIHRlbXBsYXRlRG9jdW1lbnQpIHtcbiAgICB2YXIgdGVtcGxhdGVTb3VyY2UgPSB0aGlzWydtYWtlVGVtcGxhdGVTb3VyY2UnXSh0ZW1wbGF0ZSwgdGVtcGxhdGVEb2N1bWVudCk7XG4gICAgdmFyIHJld3JpdHRlbiA9IHJld3JpdGVyQ2FsbGJhY2sodGVtcGxhdGVTb3VyY2VbJ3RleHQnXSgpKTtcbiAgICB0ZW1wbGF0ZVNvdXJjZVsndGV4dCddKHJld3JpdHRlbik7XG4gICAgdGVtcGxhdGVTb3VyY2VbJ2RhdGEnXShcImlzUmV3cml0dGVuXCIsIHRydWUpO1xufTtcblxua28uZXhwb3J0U3ltYm9sKCd0ZW1wbGF0ZUVuZ2luZScsIGtvLnRlbXBsYXRlRW5naW5lKTtcblxua28udGVtcGxhdGVSZXdyaXRpbmcgPSAoZnVuY3Rpb24gKCkge1xuICAgIHZhciBtZW1vaXplRGF0YUJpbmRpbmdBdHRyaWJ1dGVTeW50YXhSZWdleCA9IC8oPChbYS16XStcXGQqKSg/OlxccysoPyFkYXRhLWJpbmRcXHMqPVxccyopW2EtejAtOVxcLV0rKD86PSg/OlxcXCJbXlxcXCJdKlxcXCJ8XFwnW15cXCddKlxcJykpPykqXFxzKylkYXRhLWJpbmRcXHMqPVxccyooW1wiJ10pKFtcXHNcXFNdKj8pXFwzL2dpO1xuICAgIHZhciBtZW1vaXplVmlydHVhbENvbnRhaW5lckJpbmRpbmdTeW50YXhSZWdleCA9IC88IS0tXFxzKmtvXFxiXFxzKihbXFxzXFxTXSo/KVxccyotLT4vZztcblxuICAgIGZ1bmN0aW9uIHZhbGlkYXRlRGF0YUJpbmRWYWx1ZXNGb3JSZXdyaXRpbmcoa2V5VmFsdWVBcnJheSkge1xuICAgICAgICB2YXIgYWxsVmFsaWRhdG9ycyA9IGtvLmV4cHJlc3Npb25SZXdyaXRpbmcuYmluZGluZ1Jld3JpdGVWYWxpZGF0b3JzO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGtleVZhbHVlQXJyYXkubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBrZXkgPSBrZXlWYWx1ZUFycmF5W2ldWydrZXknXTtcbiAgICAgICAgICAgIGlmIChhbGxWYWxpZGF0b3JzLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgICAgICB2YXIgdmFsaWRhdG9yID0gYWxsVmFsaWRhdG9yc1trZXldO1xuXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB2YWxpZGF0b3IgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgICAgICAgICB2YXIgcG9zc2libGVFcnJvck1lc3NhZ2UgPSB2YWxpZGF0b3Ioa2V5VmFsdWVBcnJheVtpXVsndmFsdWUnXSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChwb3NzaWJsZUVycm9yTWVzc2FnZSlcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihwb3NzaWJsZUVycm9yTWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICghdmFsaWRhdG9yKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlRoaXMgdGVtcGxhdGUgZW5naW5lIGRvZXMgbm90IHN1cHBvcnQgdGhlICdcIiArIGtleSArIFwiJyBiaW5kaW5nIHdpdGhpbiBpdHMgdGVtcGxhdGVzXCIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNvbnN0cnVjdE1lbW9pemVkVGFnUmVwbGFjZW1lbnQoZGF0YUJpbmRBdHRyaWJ1dGVWYWx1ZSwgdGFnVG9SZXRhaW4sIG5vZGVOYW1lLCB0ZW1wbGF0ZUVuZ2luZSkge1xuICAgICAgICB2YXIgZGF0YUJpbmRLZXlWYWx1ZUFycmF5ID0ga28uZXhwcmVzc2lvblJld3JpdGluZy5wYXJzZU9iamVjdExpdGVyYWwoZGF0YUJpbmRBdHRyaWJ1dGVWYWx1ZSk7XG4gICAgICAgIHZhbGlkYXRlRGF0YUJpbmRWYWx1ZXNGb3JSZXdyaXRpbmcoZGF0YUJpbmRLZXlWYWx1ZUFycmF5KTtcbiAgICAgICAgdmFyIHJld3JpdHRlbkRhdGFCaW5kQXR0cmlidXRlVmFsdWUgPSBrby5leHByZXNzaW9uUmV3cml0aW5nLnByZVByb2Nlc3NCaW5kaW5ncyhkYXRhQmluZEtleVZhbHVlQXJyYXkpO1xuXG4gICAgICAgIC8vIEZvciBubyBvYnZpb3VzIHJlYXNvbiwgT3BlcmEgZmFpbHMgdG8gZXZhbHVhdGUgcmV3cml0dGVuRGF0YUJpbmRBdHRyaWJ1dGVWYWx1ZSB1bmxlc3MgaXQncyB3cmFwcGVkIGluIGFuIGFkZGl0aW9uYWxcbiAgICAgICAgLy8gYW5vbnltb3VzIGZ1bmN0aW9uLCBldmVuIHRob3VnaCBPcGVyYSdzIGJ1aWx0LWluIGRlYnVnZ2VyIGNhbiBldmFsdWF0ZSBpdCBhbnl3YXkuIE5vIG90aGVyIGJyb3dzZXIgcmVxdWlyZXMgdGhpc1xuICAgICAgICAvLyBleHRyYSBpbmRpcmVjdGlvbi5cbiAgICAgICAgdmFyIGFwcGx5QmluZGluZ3NUb05leHRTaWJsaW5nU2NyaXB0ID1cbiAgICAgICAgICAgIFwia28uX190cl9hbWJ0bnMoZnVuY3Rpb24oJGNvbnRleHQsJGVsZW1lbnQpe3JldHVybihmdW5jdGlvbigpe3JldHVybnsgXCIgKyByZXdyaXR0ZW5EYXRhQmluZEF0dHJpYnV0ZVZhbHVlICsgXCIgfSB9KSgpfSwnXCIgKyBub2RlTmFtZS50b0xvd2VyQ2FzZSgpICsgXCInKVwiO1xuICAgICAgICByZXR1cm4gdGVtcGxhdGVFbmdpbmVbJ2NyZWF0ZUphdmFTY3JpcHRFdmFsdWF0b3JCbG9jayddKGFwcGx5QmluZGluZ3NUb05leHRTaWJsaW5nU2NyaXB0KSArIHRhZ1RvUmV0YWluO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIGVuc3VyZVRlbXBsYXRlSXNSZXdyaXR0ZW46IGZ1bmN0aW9uICh0ZW1wbGF0ZSwgdGVtcGxhdGVFbmdpbmUsIHRlbXBsYXRlRG9jdW1lbnQpIHtcbiAgICAgICAgICAgIGlmICghdGVtcGxhdGVFbmdpbmVbJ2lzVGVtcGxhdGVSZXdyaXR0ZW4nXSh0ZW1wbGF0ZSwgdGVtcGxhdGVEb2N1bWVudCkpXG4gICAgICAgICAgICAgICAgdGVtcGxhdGVFbmdpbmVbJ3Jld3JpdGVUZW1wbGF0ZSddKHRlbXBsYXRlLCBmdW5jdGlvbiAoaHRtbFN0cmluZykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4ga28udGVtcGxhdGVSZXdyaXRpbmcubWVtb2l6ZUJpbmRpbmdBdHRyaWJ1dGVTeW50YXgoaHRtbFN0cmluZywgdGVtcGxhdGVFbmdpbmUpO1xuICAgICAgICAgICAgICAgIH0sIHRlbXBsYXRlRG9jdW1lbnQpO1xuICAgICAgICB9LFxuXG4gICAgICAgIG1lbW9pemVCaW5kaW5nQXR0cmlidXRlU3ludGF4OiBmdW5jdGlvbiAoaHRtbFN0cmluZywgdGVtcGxhdGVFbmdpbmUpIHtcbiAgICAgICAgICAgIHJldHVybiBodG1sU3RyaW5nLnJlcGxhY2UobWVtb2l6ZURhdGFCaW5kaW5nQXR0cmlidXRlU3ludGF4UmVnZXgsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY29uc3RydWN0TWVtb2l6ZWRUYWdSZXBsYWNlbWVudCgvKiBkYXRhQmluZEF0dHJpYnV0ZVZhbHVlOiAqLyBhcmd1bWVudHNbNF0sIC8qIHRhZ1RvUmV0YWluOiAqLyBhcmd1bWVudHNbMV0sIC8qIG5vZGVOYW1lOiAqLyBhcmd1bWVudHNbMl0sIHRlbXBsYXRlRW5naW5lKTtcbiAgICAgICAgICAgIH0pLnJlcGxhY2UobWVtb2l6ZVZpcnR1YWxDb250YWluZXJCaW5kaW5nU3ludGF4UmVnZXgsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjb25zdHJ1Y3RNZW1vaXplZFRhZ1JlcGxhY2VtZW50KC8qIGRhdGFCaW5kQXR0cmlidXRlVmFsdWU6ICovIGFyZ3VtZW50c1sxXSwgLyogdGFnVG9SZXRhaW46ICovIFwiPCEtLSBrbyAtLT5cIiwgLyogbm9kZU5hbWU6ICovIFwiI2NvbW1lbnRcIiwgdGVtcGxhdGVFbmdpbmUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgYXBwbHlNZW1vaXplZEJpbmRpbmdzVG9OZXh0U2libGluZzogZnVuY3Rpb24gKGJpbmRpbmdzLCBub2RlTmFtZSkge1xuICAgICAgICAgICAgcmV0dXJuIGtvLm1lbW9pemF0aW9uLm1lbW9pemUoZnVuY3Rpb24gKGRvbU5vZGUsIGJpbmRpbmdDb250ZXh0KSB7XG4gICAgICAgICAgICAgICAgdmFyIG5vZGVUb0JpbmQgPSBkb21Ob2RlLm5leHRTaWJsaW5nO1xuICAgICAgICAgICAgICAgIGlmIChub2RlVG9CaW5kICYmIG5vZGVUb0JpbmQubm9kZU5hbWUudG9Mb3dlckNhc2UoKSA9PT0gbm9kZU5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAga28uYXBwbHlCaW5kaW5nc1RvTm9kZShub2RlVG9CaW5kLCBiaW5kaW5ncywgYmluZGluZ0NvbnRleHQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxufSkoKTtcblxuXG4vLyBFeHBvcnRlZCBvbmx5IGJlY2F1c2UgaXQgaGFzIHRvIGJlIHJlZmVyZW5jZWQgYnkgc3RyaW5nIGxvb2t1cCBmcm9tIHdpdGhpbiByZXdyaXR0ZW4gdGVtcGxhdGVcbmtvLmV4cG9ydFN5bWJvbCgnX190cl9hbWJ0bnMnLCBrby50ZW1wbGF0ZVJld3JpdGluZy5hcHBseU1lbW9pemVkQmluZGluZ3NUb05leHRTaWJsaW5nKTtcbihmdW5jdGlvbigpIHtcbiAgICAvLyBBIHRlbXBsYXRlIHNvdXJjZSByZXByZXNlbnRzIGEgcmVhZC93cml0ZSB3YXkgb2YgYWNjZXNzaW5nIGEgdGVtcGxhdGUuIFRoaXMgaXMgdG8gZWxpbWluYXRlIHRoZSBuZWVkIGZvciB0ZW1wbGF0ZSBsb2FkaW5nL3NhdmluZ1xuICAgIC8vIGxvZ2ljIHRvIGJlIGR1cGxpY2F0ZWQgaW4gZXZlcnkgdGVtcGxhdGUgZW5naW5lIChhbmQgbWVhbnMgdGhleSBjYW4gYWxsIHdvcmsgd2l0aCBhbm9ueW1vdXMgdGVtcGxhdGVzLCBldGMuKVxuICAgIC8vXG4gICAgLy8gVHdvIGFyZSBwcm92aWRlZCBieSBkZWZhdWx0OlxuICAgIC8vICAxLiBrby50ZW1wbGF0ZVNvdXJjZXMuZG9tRWxlbWVudCAgICAgICAtIHJlYWRzL3dyaXRlcyB0aGUgdGV4dCBjb250ZW50IG9mIGFuIGFyYml0cmFyeSBET00gZWxlbWVudFxuICAgIC8vICAyLiBrby50ZW1wbGF0ZVNvdXJjZXMuYW5vbnltb3VzRWxlbWVudCAtIHVzZXMga28udXRpbHMuZG9tRGF0YSB0byByZWFkL3dyaXRlIHRleHQgKmFzc29jaWF0ZWQqIHdpdGggdGhlIERPTSBlbGVtZW50LCBidXRcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aXRob3V0IHJlYWRpbmcvd3JpdGluZyB0aGUgYWN0dWFsIGVsZW1lbnQgdGV4dCBjb250ZW50LCBzaW5jZSBpdCB3aWxsIGJlIG92ZXJ3cml0dGVuXG4gICAgLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2l0aCB0aGUgcmVuZGVyZWQgdGVtcGxhdGUgb3V0cHV0LlxuICAgIC8vIFlvdSBjYW4gaW1wbGVtZW50IHlvdXIgb3duIHRlbXBsYXRlIHNvdXJjZSBpZiB5b3Ugd2FudCB0byBmZXRjaC9zdG9yZSB0ZW1wbGF0ZXMgc29tZXdoZXJlIG90aGVyIHRoYW4gaW4gRE9NIGVsZW1lbnRzLlxuICAgIC8vIFRlbXBsYXRlIHNvdXJjZXMgbmVlZCB0byBoYXZlIHRoZSBmb2xsb3dpbmcgZnVuY3Rpb25zOlxuICAgIC8vICAgdGV4dCgpIFx0XHRcdC0gcmV0dXJucyB0aGUgdGVtcGxhdGUgdGV4dCBmcm9tIHlvdXIgc3RvcmFnZSBsb2NhdGlvblxuICAgIC8vICAgdGV4dCh2YWx1ZSlcdFx0LSB3cml0ZXMgdGhlIHN1cHBsaWVkIHRlbXBsYXRlIHRleHQgdG8geW91ciBzdG9yYWdlIGxvY2F0aW9uXG4gICAgLy8gICBkYXRhKGtleSlcdFx0XHQtIHJlYWRzIHZhbHVlcyBzdG9yZWQgdXNpbmcgZGF0YShrZXksIHZhbHVlKSAtIHNlZSBiZWxvd1xuICAgIC8vICAgZGF0YShrZXksIHZhbHVlKVx0LSBhc3NvY2lhdGVzIFwidmFsdWVcIiB3aXRoIHRoaXMgdGVtcGxhdGUgYW5kIHRoZSBrZXkgXCJrZXlcIi4gSXMgdXNlZCB0byBzdG9yZSBpbmZvcm1hdGlvbiBsaWtlIFwiaXNSZXdyaXR0ZW5cIi5cbiAgICAvL1xuICAgIC8vIE9wdGlvbmFsbHksIHRlbXBsYXRlIHNvdXJjZXMgY2FuIGFsc28gaGF2ZSB0aGUgZm9sbG93aW5nIGZ1bmN0aW9uczpcbiAgICAvLyAgIG5vZGVzKCkgICAgICAgICAgICAtIHJldHVybnMgYSBET00gZWxlbWVudCBjb250YWluaW5nIHRoZSBub2RlcyBvZiB0aGlzIHRlbXBsYXRlLCB3aGVyZSBhdmFpbGFibGVcbiAgICAvLyAgIG5vZGVzKHZhbHVlKSAgICAgICAtIHdyaXRlcyB0aGUgZ2l2ZW4gRE9NIGVsZW1lbnQgdG8geW91ciBzdG9yYWdlIGxvY2F0aW9uXG4gICAgLy8gSWYgYSBET00gZWxlbWVudCBpcyBhdmFpbGFibGUgZm9yIGEgZ2l2ZW4gdGVtcGxhdGUgc291cmNlLCB0ZW1wbGF0ZSBlbmdpbmVzIGFyZSBlbmNvdXJhZ2VkIHRvIHVzZSBpdCBpbiBwcmVmZXJlbmNlIG92ZXIgdGV4dCgpXG4gICAgLy8gZm9yIGltcHJvdmVkIHNwZWVkLiBIb3dldmVyLCBhbGwgdGVtcGxhdGVTb3VyY2VzIG11c3Qgc3VwcGx5IHRleHQoKSBldmVuIGlmIHRoZXkgZG9uJ3Qgc3VwcGx5IG5vZGVzKCkuXG4gICAgLy9cbiAgICAvLyBPbmNlIHlvdSd2ZSBpbXBsZW1lbnRlZCBhIHRlbXBsYXRlU291cmNlLCBtYWtlIHlvdXIgdGVtcGxhdGUgZW5naW5lIHVzZSBpdCBieSBzdWJjbGFzc2luZyB3aGF0ZXZlciB0ZW1wbGF0ZSBlbmdpbmUgeW91IHdlcmVcbiAgICAvLyB1c2luZyBhbmQgb3ZlcnJpZGluZyBcIm1ha2VUZW1wbGF0ZVNvdXJjZVwiIHRvIHJldHVybiBhbiBpbnN0YW5jZSBvZiB5b3VyIGN1c3RvbSB0ZW1wbGF0ZSBzb3VyY2UuXG5cbiAgICBrby50ZW1wbGF0ZVNvdXJjZXMgPSB7fTtcblxuICAgIC8vIC0tLS0ga28udGVtcGxhdGVTb3VyY2VzLmRvbUVsZW1lbnQgLS0tLS1cblxuICAgIGtvLnRlbXBsYXRlU291cmNlcy5kb21FbGVtZW50ID0gZnVuY3Rpb24oZWxlbWVudCkge1xuICAgICAgICB0aGlzLmRvbUVsZW1lbnQgPSBlbGVtZW50O1xuICAgIH1cblxuICAgIGtvLnRlbXBsYXRlU291cmNlcy5kb21FbGVtZW50LnByb3RvdHlwZVsndGV4dCddID0gZnVuY3Rpb24oLyogdmFsdWVUb1dyaXRlICovKSB7XG4gICAgICAgIHZhciB0YWdOYW1lTG93ZXIgPSBrby51dGlscy50YWdOYW1lTG93ZXIodGhpcy5kb21FbGVtZW50KSxcbiAgICAgICAgICAgIGVsZW1Db250ZW50c1Byb3BlcnR5ID0gdGFnTmFtZUxvd2VyID09PSBcInNjcmlwdFwiID8gXCJ0ZXh0XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogdGFnTmFtZUxvd2VyID09PSBcInRleHRhcmVhXCIgPyBcInZhbHVlXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogXCJpbm5lckhUTUxcIjtcblxuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5kb21FbGVtZW50W2VsZW1Db250ZW50c1Byb3BlcnR5XTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhciB2YWx1ZVRvV3JpdGUgPSBhcmd1bWVudHNbMF07XG4gICAgICAgICAgICBpZiAoZWxlbUNvbnRlbnRzUHJvcGVydHkgPT09IFwiaW5uZXJIVE1MXCIpXG4gICAgICAgICAgICAgICAga28udXRpbHMuc2V0SHRtbCh0aGlzLmRvbUVsZW1lbnQsIHZhbHVlVG9Xcml0ZSk7XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgdGhpcy5kb21FbGVtZW50W2VsZW1Db250ZW50c1Byb3BlcnR5XSA9IHZhbHVlVG9Xcml0ZTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBrby50ZW1wbGF0ZVNvdXJjZXMuZG9tRWxlbWVudC5wcm90b3R5cGVbJ2RhdGEnXSA9IGZ1bmN0aW9uKGtleSAvKiwgdmFsdWVUb1dyaXRlICovKSB7XG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICByZXR1cm4ga28udXRpbHMuZG9tRGF0YS5nZXQodGhpcy5kb21FbGVtZW50LCBcInRlbXBsYXRlU291cmNlRGF0YV9cIiArIGtleSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBrby51dGlscy5kb21EYXRhLnNldCh0aGlzLmRvbUVsZW1lbnQsIFwidGVtcGxhdGVTb3VyY2VEYXRhX1wiICsga2V5LCBhcmd1bWVudHNbMV0pO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8vIC0tLS0ga28udGVtcGxhdGVTb3VyY2VzLmFub255bW91c1RlbXBsYXRlIC0tLS0tXG4gICAgLy8gQW5vbnltb3VzIHRlbXBsYXRlcyBhcmUgbm9ybWFsbHkgc2F2ZWQvcmV0cmlldmVkIGFzIERPTSBub2RlcyB0aHJvdWdoIFwibm9kZXNcIi5cbiAgICAvLyBGb3IgY29tcGF0aWJpbGl0eSwgeW91IGNhbiBhbHNvIHJlYWQgXCJ0ZXh0XCI7IGl0IHdpbGwgYmUgc2VyaWFsaXplZCBmcm9tIHRoZSBub2RlcyBvbiBkZW1hbmQuXG4gICAgLy8gV3JpdGluZyB0byBcInRleHRcIiBpcyBzdGlsbCBzdXBwb3J0ZWQsIGJ1dCB0aGVuIHRoZSB0ZW1wbGF0ZSBkYXRhIHdpbGwgbm90IGJlIGF2YWlsYWJsZSBhcyBET00gbm9kZXMuXG5cbiAgICB2YXIgYW5vbnltb3VzVGVtcGxhdGVzRG9tRGF0YUtleSA9IFwiX19rb19hbm9uX3RlbXBsYXRlX19cIjtcbiAgICBrby50ZW1wbGF0ZVNvdXJjZXMuYW5vbnltb3VzVGVtcGxhdGUgPSBmdW5jdGlvbihlbGVtZW50KSB7XG4gICAgICAgIHRoaXMuZG9tRWxlbWVudCA9IGVsZW1lbnQ7XG4gICAgfVxuICAgIGtvLnRlbXBsYXRlU291cmNlcy5hbm9ueW1vdXNUZW1wbGF0ZS5wcm90b3R5cGUgPSBuZXcga28udGVtcGxhdGVTb3VyY2VzLmRvbUVsZW1lbnQoKTtcbiAgICBrby50ZW1wbGF0ZVNvdXJjZXMuYW5vbnltb3VzVGVtcGxhdGUucHJvdG90eXBlLmNvbnN0cnVjdG9yID0ga28udGVtcGxhdGVTb3VyY2VzLmFub255bW91c1RlbXBsYXRlO1xuICAgIGtvLnRlbXBsYXRlU291cmNlcy5hbm9ueW1vdXNUZW1wbGF0ZS5wcm90b3R5cGVbJ3RleHQnXSA9IGZ1bmN0aW9uKC8qIHZhbHVlVG9Xcml0ZSAqLykge1xuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PSAwKSB7XG4gICAgICAgICAgICB2YXIgdGVtcGxhdGVEYXRhID0ga28udXRpbHMuZG9tRGF0YS5nZXQodGhpcy5kb21FbGVtZW50LCBhbm9ueW1vdXNUZW1wbGF0ZXNEb21EYXRhS2V5KSB8fCB7fTtcbiAgICAgICAgICAgIGlmICh0ZW1wbGF0ZURhdGEudGV4dERhdGEgPT09IHVuZGVmaW5lZCAmJiB0ZW1wbGF0ZURhdGEuY29udGFpbmVyRGF0YSlcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZURhdGEudGV4dERhdGEgPSB0ZW1wbGF0ZURhdGEuY29udGFpbmVyRGF0YS5pbm5lckhUTUw7XG4gICAgICAgICAgICByZXR1cm4gdGVtcGxhdGVEYXRhLnRleHREYXRhO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmFyIHZhbHVlVG9Xcml0ZSA9IGFyZ3VtZW50c1swXTtcbiAgICAgICAgICAgIGtvLnV0aWxzLmRvbURhdGEuc2V0KHRoaXMuZG9tRWxlbWVudCwgYW5vbnltb3VzVGVtcGxhdGVzRG9tRGF0YUtleSwge3RleHREYXRhOiB2YWx1ZVRvV3JpdGV9KTtcbiAgICAgICAgfVxuICAgIH07XG4gICAga28udGVtcGxhdGVTb3VyY2VzLmRvbUVsZW1lbnQucHJvdG90eXBlWydub2RlcyddID0gZnVuY3Rpb24oLyogdmFsdWVUb1dyaXRlICovKSB7XG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09IDApIHtcbiAgICAgICAgICAgIHZhciB0ZW1wbGF0ZURhdGEgPSBrby51dGlscy5kb21EYXRhLmdldCh0aGlzLmRvbUVsZW1lbnQsIGFub255bW91c1RlbXBsYXRlc0RvbURhdGFLZXkpIHx8IHt9O1xuICAgICAgICAgICAgcmV0dXJuIHRlbXBsYXRlRGF0YS5jb250YWluZXJEYXRhO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmFyIHZhbHVlVG9Xcml0ZSA9IGFyZ3VtZW50c1swXTtcbiAgICAgICAgICAgIGtvLnV0aWxzLmRvbURhdGEuc2V0KHRoaXMuZG9tRWxlbWVudCwgYW5vbnltb3VzVGVtcGxhdGVzRG9tRGF0YUtleSwge2NvbnRhaW5lckRhdGE6IHZhbHVlVG9Xcml0ZX0pO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIGtvLmV4cG9ydFN5bWJvbCgndGVtcGxhdGVTb3VyY2VzJywga28udGVtcGxhdGVTb3VyY2VzKTtcbiAgICBrby5leHBvcnRTeW1ib2woJ3RlbXBsYXRlU291cmNlcy5kb21FbGVtZW50Jywga28udGVtcGxhdGVTb3VyY2VzLmRvbUVsZW1lbnQpO1xuICAgIGtvLmV4cG9ydFN5bWJvbCgndGVtcGxhdGVTb3VyY2VzLmFub255bW91c1RlbXBsYXRlJywga28udGVtcGxhdGVTb3VyY2VzLmFub255bW91c1RlbXBsYXRlKTtcbn0pKCk7XG4oZnVuY3Rpb24gKCkge1xuICAgIHZhciBfdGVtcGxhdGVFbmdpbmU7XG4gICAga28uc2V0VGVtcGxhdGVFbmdpbmUgPSBmdW5jdGlvbiAodGVtcGxhdGVFbmdpbmUpIHtcbiAgICAgICAgaWYgKCh0ZW1wbGF0ZUVuZ2luZSAhPSB1bmRlZmluZWQpICYmICEodGVtcGxhdGVFbmdpbmUgaW5zdGFuY2VvZiBrby50ZW1wbGF0ZUVuZ2luZSkpXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJ0ZW1wbGF0ZUVuZ2luZSBtdXN0IGluaGVyaXQgZnJvbSBrby50ZW1wbGF0ZUVuZ2luZVwiKTtcbiAgICAgICAgX3RlbXBsYXRlRW5naW5lID0gdGVtcGxhdGVFbmdpbmU7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaW52b2tlRm9yRWFjaE5vZGVPckNvbW1lbnRJbkNvbnRpbnVvdXNSYW5nZShmaXJzdE5vZGUsIGxhc3ROb2RlLCBhY3Rpb24pIHtcbiAgICAgICAgdmFyIG5vZGUsIG5leHRJblF1ZXVlID0gZmlyc3ROb2RlLCBmaXJzdE91dE9mUmFuZ2VOb2RlID0ga28udmlydHVhbEVsZW1lbnRzLm5leHRTaWJsaW5nKGxhc3ROb2RlKTtcbiAgICAgICAgd2hpbGUgKG5leHRJblF1ZXVlICYmICgobm9kZSA9IG5leHRJblF1ZXVlKSAhPT0gZmlyc3RPdXRPZlJhbmdlTm9kZSkpIHtcbiAgICAgICAgICAgIG5leHRJblF1ZXVlID0ga28udmlydHVhbEVsZW1lbnRzLm5leHRTaWJsaW5nKG5vZGUpO1xuICAgICAgICAgICAgaWYgKG5vZGUubm9kZVR5cGUgPT09IDEgfHwgbm9kZS5ub2RlVHlwZSA9PT0gOClcbiAgICAgICAgICAgICAgICBhY3Rpb24obm9kZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBhY3RpdmF0ZUJpbmRpbmdzT25Db250aW51b3VzTm9kZUFycmF5KGNvbnRpbnVvdXNOb2RlQXJyYXksIGJpbmRpbmdDb250ZXh0KSB7XG4gICAgICAgIC8vIFRvIGJlIHVzZWQgb24gYW55IG5vZGVzIHRoYXQgaGF2ZSBiZWVuIHJlbmRlcmVkIGJ5IGEgdGVtcGxhdGUgYW5kIGhhdmUgYmVlbiBpbnNlcnRlZCBpbnRvIHNvbWUgcGFyZW50IGVsZW1lbnRcbiAgICAgICAgLy8gV2Fsa3MgdGhyb3VnaCBjb250aW51b3VzTm9kZUFycmF5ICh3aGljaCAqbXVzdCogYmUgY29udGludW91cywgaS5lLiwgYW4gdW5pbnRlcnJ1cHRlZCBzZXF1ZW5jZSBvZiBzaWJsaW5nIG5vZGVzLCBiZWNhdXNlXG4gICAgICAgIC8vIHRoZSBhbGdvcml0aG0gZm9yIHdhbGtpbmcgdGhlbSByZWxpZXMgb24gdGhpcyksIGFuZCBmb3IgZWFjaCB0b3AtbGV2ZWwgaXRlbSBpbiB0aGUgdmlydHVhbC1lbGVtZW50IHNlbnNlLFxuICAgICAgICAvLyAoMSkgRG9lcyBhIHJlZ3VsYXIgXCJhcHBseUJpbmRpbmdzXCIgdG8gYXNzb2NpYXRlIGJpbmRpbmdDb250ZXh0IHdpdGggdGhpcyBub2RlIGFuZCB0byBhY3RpdmF0ZSBhbnkgbm9uLW1lbW9pemVkIGJpbmRpbmdzXG4gICAgICAgIC8vICgyKSBVbm1lbW9pemVzIGFueSBtZW1vcyBpbiB0aGUgRE9NIHN1YnRyZWUgKGUuZy4sIHRvIGFjdGl2YXRlIGJpbmRpbmdzIHRoYXQgaGFkIGJlZW4gbWVtb2l6ZWQgZHVyaW5nIHRlbXBsYXRlIHJld3JpdGluZylcblxuICAgICAgICBpZiAoY29udGludW91c05vZGVBcnJheS5sZW5ndGgpIHtcbiAgICAgICAgICAgIHZhciBmaXJzdE5vZGUgPSBjb250aW51b3VzTm9kZUFycmF5WzBdLCBsYXN0Tm9kZSA9IGNvbnRpbnVvdXNOb2RlQXJyYXlbY29udGludW91c05vZGVBcnJheS5sZW5ndGggLSAxXTtcblxuICAgICAgICAgICAgLy8gTmVlZCB0byBhcHBseUJpbmRpbmdzICpiZWZvcmUqIHVubWVtb3ppYXRpb24sIGJlY2F1c2UgdW5tZW1vaXphdGlvbiBtaWdodCBpbnRyb2R1Y2UgZXh0cmEgbm9kZXMgKHRoYXQgd2UgZG9uJ3Qgd2FudCB0byByZS1iaW5kKVxuICAgICAgICAgICAgLy8gd2hlcmVhcyBhIHJlZ3VsYXIgYXBwbHlCaW5kaW5ncyB3b24ndCBpbnRyb2R1Y2UgbmV3IG1lbW9pemVkIG5vZGVzXG4gICAgICAgICAgICBpbnZva2VGb3JFYWNoTm9kZU9yQ29tbWVudEluQ29udGludW91c1JhbmdlKGZpcnN0Tm9kZSwgbGFzdE5vZGUsIGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgICAgICAgICAgICBrby5hcHBseUJpbmRpbmdzKGJpbmRpbmdDb250ZXh0LCBub2RlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaW52b2tlRm9yRWFjaE5vZGVPckNvbW1lbnRJbkNvbnRpbnVvdXNSYW5nZShmaXJzdE5vZGUsIGxhc3ROb2RlLCBmdW5jdGlvbihub2RlKSB7XG4gICAgICAgICAgICAgICAga28ubWVtb2l6YXRpb24udW5tZW1vaXplRG9tTm9kZUFuZERlc2NlbmRhbnRzKG5vZGUsIFtiaW5kaW5nQ29udGV4dF0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXRGaXJzdE5vZGVGcm9tUG9zc2libGVBcnJheShub2RlT3JOb2RlQXJyYXkpIHtcbiAgICAgICAgcmV0dXJuIG5vZGVPck5vZGVBcnJheS5ub2RlVHlwZSA/IG5vZGVPck5vZGVBcnJheVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogbm9kZU9yTm9kZUFycmF5Lmxlbmd0aCA+IDAgPyBub2RlT3JOb2RlQXJyYXlbMF1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IG51bGw7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZXhlY3V0ZVRlbXBsYXRlKHRhcmdldE5vZGVPck5vZGVBcnJheSwgcmVuZGVyTW9kZSwgdGVtcGxhdGUsIGJpbmRpbmdDb250ZXh0LCBvcHRpb25zKSB7XG4gICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgICAgICB2YXIgZmlyc3RUYXJnZXROb2RlID0gdGFyZ2V0Tm9kZU9yTm9kZUFycmF5ICYmIGdldEZpcnN0Tm9kZUZyb21Qb3NzaWJsZUFycmF5KHRhcmdldE5vZGVPck5vZGVBcnJheSk7XG4gICAgICAgIHZhciB0ZW1wbGF0ZURvY3VtZW50ID0gZmlyc3RUYXJnZXROb2RlICYmIGZpcnN0VGFyZ2V0Tm9kZS5vd25lckRvY3VtZW50O1xuICAgICAgICB2YXIgdGVtcGxhdGVFbmdpbmVUb1VzZSA9IChvcHRpb25zWyd0ZW1wbGF0ZUVuZ2luZSddIHx8IF90ZW1wbGF0ZUVuZ2luZSk7XG4gICAgICAgIGtvLnRlbXBsYXRlUmV3cml0aW5nLmVuc3VyZVRlbXBsYXRlSXNSZXdyaXR0ZW4odGVtcGxhdGUsIHRlbXBsYXRlRW5naW5lVG9Vc2UsIHRlbXBsYXRlRG9jdW1lbnQpO1xuICAgICAgICB2YXIgcmVuZGVyZWROb2Rlc0FycmF5ID0gdGVtcGxhdGVFbmdpbmVUb1VzZVsncmVuZGVyVGVtcGxhdGUnXSh0ZW1wbGF0ZSwgYmluZGluZ0NvbnRleHQsIG9wdGlvbnMsIHRlbXBsYXRlRG9jdW1lbnQpO1xuXG4gICAgICAgIC8vIExvb3NlbHkgY2hlY2sgcmVzdWx0IGlzIGFuIGFycmF5IG9mIERPTSBub2Rlc1xuICAgICAgICBpZiAoKHR5cGVvZiByZW5kZXJlZE5vZGVzQXJyYXkubGVuZ3RoICE9IFwibnVtYmVyXCIpIHx8IChyZW5kZXJlZE5vZGVzQXJyYXkubGVuZ3RoID4gMCAmJiB0eXBlb2YgcmVuZGVyZWROb2Rlc0FycmF5WzBdLm5vZGVUeXBlICE9IFwibnVtYmVyXCIpKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVGVtcGxhdGUgZW5naW5lIG11c3QgcmV0dXJuIGFuIGFycmF5IG9mIERPTSBub2Rlc1wiKTtcblxuICAgICAgICB2YXIgaGF2ZUFkZGVkTm9kZXNUb1BhcmVudCA9IGZhbHNlO1xuICAgICAgICBzd2l0Y2ggKHJlbmRlck1vZGUpIHtcbiAgICAgICAgICAgIGNhc2UgXCJyZXBsYWNlQ2hpbGRyZW5cIjpcbiAgICAgICAgICAgICAgICBrby52aXJ0dWFsRWxlbWVudHMuc2V0RG9tTm9kZUNoaWxkcmVuKHRhcmdldE5vZGVPck5vZGVBcnJheSwgcmVuZGVyZWROb2Rlc0FycmF5KTtcbiAgICAgICAgICAgICAgICBoYXZlQWRkZWROb2Rlc1RvUGFyZW50ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJyZXBsYWNlTm9kZVwiOlxuICAgICAgICAgICAgICAgIGtvLnV0aWxzLnJlcGxhY2VEb21Ob2Rlcyh0YXJnZXROb2RlT3JOb2RlQXJyYXksIHJlbmRlcmVkTm9kZXNBcnJheSk7XG4gICAgICAgICAgICAgICAgaGF2ZUFkZGVkTm9kZXNUb1BhcmVudCA9IHRydWU7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwiaWdub3JlVGFyZ2V0Tm9kZVwiOiBicmVhaztcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVW5rbm93biByZW5kZXJNb2RlOiBcIiArIHJlbmRlck1vZGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGhhdmVBZGRlZE5vZGVzVG9QYXJlbnQpIHtcbiAgICAgICAgICAgIGFjdGl2YXRlQmluZGluZ3NPbkNvbnRpbnVvdXNOb2RlQXJyYXkocmVuZGVyZWROb2Rlc0FycmF5LCBiaW5kaW5nQ29udGV4dCk7XG4gICAgICAgICAgICBpZiAob3B0aW9uc1snYWZ0ZXJSZW5kZXInXSlcbiAgICAgICAgICAgICAgICBrby5kZXBlbmRlbmN5RGV0ZWN0aW9uLmlnbm9yZShvcHRpb25zWydhZnRlclJlbmRlciddLCBudWxsLCBbcmVuZGVyZWROb2Rlc0FycmF5LCBiaW5kaW5nQ29udGV4dFsnJGRhdGEnXV0pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJlbmRlcmVkTm9kZXNBcnJheTtcbiAgICB9XG5cbiAgICBrby5yZW5kZXJUZW1wbGF0ZSA9IGZ1bmN0aW9uICh0ZW1wbGF0ZSwgZGF0YU9yQmluZGluZ0NvbnRleHQsIG9wdGlvbnMsIHRhcmdldE5vZGVPck5vZGVBcnJheSwgcmVuZGVyTW9kZSkge1xuICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICAgICAgaWYgKChvcHRpb25zWyd0ZW1wbGF0ZUVuZ2luZSddIHx8IF90ZW1wbGF0ZUVuZ2luZSkgPT0gdW5kZWZpbmVkKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiU2V0IGEgdGVtcGxhdGUgZW5naW5lIGJlZm9yZSBjYWxsaW5nIHJlbmRlclRlbXBsYXRlXCIpO1xuICAgICAgICByZW5kZXJNb2RlID0gcmVuZGVyTW9kZSB8fCBcInJlcGxhY2VDaGlsZHJlblwiO1xuXG4gICAgICAgIGlmICh0YXJnZXROb2RlT3JOb2RlQXJyYXkpIHtcbiAgICAgICAgICAgIHZhciBmaXJzdFRhcmdldE5vZGUgPSBnZXRGaXJzdE5vZGVGcm9tUG9zc2libGVBcnJheSh0YXJnZXROb2RlT3JOb2RlQXJyYXkpO1xuXG4gICAgICAgICAgICB2YXIgd2hlblRvRGlzcG9zZSA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICghZmlyc3RUYXJnZXROb2RlKSB8fCAha28udXRpbHMuZG9tTm9kZUlzQXR0YWNoZWRUb0RvY3VtZW50KGZpcnN0VGFyZ2V0Tm9kZSk7IH07IC8vIFBhc3NpdmUgZGlzcG9zYWwgKG9uIG5leHQgZXZhbHVhdGlvbilcbiAgICAgICAgICAgIHZhciBhY3RpdmVseURpc3Bvc2VXaGVuTm9kZUlzUmVtb3ZlZCA9IChmaXJzdFRhcmdldE5vZGUgJiYgcmVuZGVyTW9kZSA9PSBcInJlcGxhY2VOb2RlXCIpID8gZmlyc3RUYXJnZXROb2RlLnBhcmVudE5vZGUgOiBmaXJzdFRhcmdldE5vZGU7XG5cbiAgICAgICAgICAgIHJldHVybiBrby5kZXBlbmRlbnRPYnNlcnZhYmxlKCAvLyBTbyB0aGUgRE9NIGlzIGF1dG9tYXRpY2FsbHkgdXBkYXRlZCB3aGVuIGFueSBkZXBlbmRlbmN5IGNoYW5nZXNcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEVuc3VyZSB3ZSd2ZSBnb3QgYSBwcm9wZXIgYmluZGluZyBjb250ZXh0IHRvIHdvcmsgd2l0aFxuICAgICAgICAgICAgICAgICAgICB2YXIgYmluZGluZ0NvbnRleHQgPSAoZGF0YU9yQmluZGluZ0NvbnRleHQgJiYgKGRhdGFPckJpbmRpbmdDb250ZXh0IGluc3RhbmNlb2Yga28uYmluZGluZ0NvbnRleHQpKVxuICAgICAgICAgICAgICAgICAgICAgICAgPyBkYXRhT3JCaW5kaW5nQ29udGV4dFxuICAgICAgICAgICAgICAgICAgICAgICAgOiBuZXcga28uYmluZGluZ0NvbnRleHQoa28udXRpbHMudW53cmFwT2JzZXJ2YWJsZShkYXRhT3JCaW5kaW5nQ29udGV4dCkpO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIFN1cHBvcnQgc2VsZWN0aW5nIHRlbXBsYXRlIGFzIGEgZnVuY3Rpb24gb2YgdGhlIGRhdGEgYmVpbmcgcmVuZGVyZWRcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRlbXBsYXRlTmFtZSA9IHR5cGVvZih0ZW1wbGF0ZSkgPT0gJ2Z1bmN0aW9uJyA/IHRlbXBsYXRlKGJpbmRpbmdDb250ZXh0WyckZGF0YSddLCBiaW5kaW5nQ29udGV4dCkgOiB0ZW1wbGF0ZTtcblxuICAgICAgICAgICAgICAgICAgICB2YXIgcmVuZGVyZWROb2Rlc0FycmF5ID0gZXhlY3V0ZVRlbXBsYXRlKHRhcmdldE5vZGVPck5vZGVBcnJheSwgcmVuZGVyTW9kZSwgdGVtcGxhdGVOYW1lLCBiaW5kaW5nQ29udGV4dCwgb3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZW5kZXJNb2RlID09IFwicmVwbGFjZU5vZGVcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0Tm9kZU9yTm9kZUFycmF5ID0gcmVuZGVyZWROb2Rlc0FycmF5O1xuICAgICAgICAgICAgICAgICAgICAgICAgZmlyc3RUYXJnZXROb2RlID0gZ2V0Rmlyc3ROb2RlRnJvbVBvc3NpYmxlQXJyYXkodGFyZ2V0Tm9kZU9yTm9kZUFycmF5KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgbnVsbCxcbiAgICAgICAgICAgICAgICB7IGRpc3Bvc2VXaGVuOiB3aGVuVG9EaXNwb3NlLCBkaXNwb3NlV2hlbk5vZGVJc1JlbW92ZWQ6IGFjdGl2ZWx5RGlzcG9zZVdoZW5Ob2RlSXNSZW1vdmVkIH1cbiAgICAgICAgICAgICk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBXZSBkb24ndCB5ZXQgaGF2ZSBhIERPTSBub2RlIHRvIGV2YWx1YXRlLCBzbyB1c2UgYSBtZW1vIGFuZCByZW5kZXIgdGhlIHRlbXBsYXRlIGxhdGVyIHdoZW4gdGhlcmUgaXMgYSBET00gbm9kZVxuICAgICAgICAgICAgcmV0dXJuIGtvLm1lbW9pemF0aW9uLm1lbW9pemUoZnVuY3Rpb24gKGRvbU5vZGUpIHtcbiAgICAgICAgICAgICAgICBrby5yZW5kZXJUZW1wbGF0ZSh0ZW1wbGF0ZSwgZGF0YU9yQmluZGluZ0NvbnRleHQsIG9wdGlvbnMsIGRvbU5vZGUsIFwicmVwbGFjZU5vZGVcIik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBrby5yZW5kZXJUZW1wbGF0ZUZvckVhY2ggPSBmdW5jdGlvbiAodGVtcGxhdGUsIGFycmF5T3JPYnNlcnZhYmxlQXJyYXksIG9wdGlvbnMsIHRhcmdldE5vZGUsIHBhcmVudEJpbmRpbmdDb250ZXh0KSB7XG4gICAgICAgIC8vIFNpbmNlIHNldERvbU5vZGVDaGlsZHJlbkZyb21BcnJheU1hcHBpbmcgYWx3YXlzIGNhbGxzIGV4ZWN1dGVUZW1wbGF0ZUZvckFycmF5SXRlbSBhbmQgdGhlblxuICAgICAgICAvLyBhY3RpdmF0ZUJpbmRpbmdzQ2FsbGJhY2sgZm9yIGFkZGVkIGl0ZW1zLCB3ZSBjYW4gc3RvcmUgdGhlIGJpbmRpbmcgY29udGV4dCBpbiB0aGUgZm9ybWVyIHRvIHVzZSBpbiB0aGUgbGF0dGVyLlxuICAgICAgICB2YXIgYXJyYXlJdGVtQ29udGV4dDtcblxuICAgICAgICAvLyBUaGlzIHdpbGwgYmUgY2FsbGVkIGJ5IHNldERvbU5vZGVDaGlsZHJlbkZyb21BcnJheU1hcHBpbmcgdG8gZ2V0IHRoZSBub2RlcyB0byBhZGQgdG8gdGFyZ2V0Tm9kZVxuICAgICAgICB2YXIgZXhlY3V0ZVRlbXBsYXRlRm9yQXJyYXlJdGVtID0gZnVuY3Rpb24gKGFycmF5VmFsdWUsIGluZGV4KSB7XG4gICAgICAgICAgICAvLyBTdXBwb3J0IHNlbGVjdGluZyB0ZW1wbGF0ZSBhcyBhIGZ1bmN0aW9uIG9mIHRoZSBkYXRhIGJlaW5nIHJlbmRlcmVkXG4gICAgICAgICAgICBhcnJheUl0ZW1Db250ZXh0ID0gcGFyZW50QmluZGluZ0NvbnRleHRbJ2NyZWF0ZUNoaWxkQ29udGV4dCddKGtvLnV0aWxzLnVud3JhcE9ic2VydmFibGUoYXJyYXlWYWx1ZSksIG9wdGlvbnNbJ2FzJ10pO1xuICAgICAgICAgICAgYXJyYXlJdGVtQ29udGV4dFsnJGluZGV4J10gPSBpbmRleDtcbiAgICAgICAgICAgIHZhciB0ZW1wbGF0ZU5hbWUgPSB0eXBlb2YodGVtcGxhdGUpID09ICdmdW5jdGlvbicgPyB0ZW1wbGF0ZShhcnJheVZhbHVlLCBhcnJheUl0ZW1Db250ZXh0KSA6IHRlbXBsYXRlO1xuICAgICAgICAgICAgcmV0dXJuIGV4ZWN1dGVUZW1wbGF0ZShudWxsLCBcImlnbm9yZVRhcmdldE5vZGVcIiwgdGVtcGxhdGVOYW1lLCBhcnJheUl0ZW1Db250ZXh0LCBvcHRpb25zKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFRoaXMgd2lsbCBiZSBjYWxsZWQgd2hlbmV2ZXIgc2V0RG9tTm9kZUNoaWxkcmVuRnJvbUFycmF5TWFwcGluZyBoYXMgYWRkZWQgbm9kZXMgdG8gdGFyZ2V0Tm9kZVxuICAgICAgICB2YXIgYWN0aXZhdGVCaW5kaW5nc0NhbGxiYWNrID0gZnVuY3Rpb24oYXJyYXlWYWx1ZSwgYWRkZWROb2Rlc0FycmF5LCBpbmRleCkge1xuICAgICAgICAgICAgYWN0aXZhdGVCaW5kaW5nc09uQ29udGludW91c05vZGVBcnJheShhZGRlZE5vZGVzQXJyYXksIGFycmF5SXRlbUNvbnRleHQpO1xuICAgICAgICAgICAgaWYgKG9wdGlvbnNbJ2FmdGVyUmVuZGVyJ10pXG4gICAgICAgICAgICAgICAgb3B0aW9uc1snYWZ0ZXJSZW5kZXInXShhZGRlZE5vZGVzQXJyYXksIGFycmF5VmFsdWUpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiBrby5kZXBlbmRlbnRPYnNlcnZhYmxlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciB1bndyYXBwZWRBcnJheSA9IGtvLnV0aWxzLnVud3JhcE9ic2VydmFibGUoYXJyYXlPck9ic2VydmFibGVBcnJheSkgfHwgW107XG4gICAgICAgICAgICBpZiAodHlwZW9mIHVud3JhcHBlZEFycmF5Lmxlbmd0aCA9PSBcInVuZGVmaW5lZFwiKSAvLyBDb2VyY2Ugc2luZ2xlIHZhbHVlIGludG8gYXJyYXlcbiAgICAgICAgICAgICAgICB1bndyYXBwZWRBcnJheSA9IFt1bndyYXBwZWRBcnJheV07XG5cbiAgICAgICAgICAgIC8vIEZpbHRlciBvdXQgYW55IGVudHJpZXMgbWFya2VkIGFzIGRlc3Ryb3llZFxuICAgICAgICAgICAgdmFyIGZpbHRlcmVkQXJyYXkgPSBrby51dGlscy5hcnJheUZpbHRlcih1bndyYXBwZWRBcnJheSwgZnVuY3Rpb24oaXRlbSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBvcHRpb25zWydpbmNsdWRlRGVzdHJveWVkJ10gfHwgaXRlbSA9PT0gdW5kZWZpbmVkIHx8IGl0ZW0gPT09IG51bGwgfHwgIWtvLnV0aWxzLnVud3JhcE9ic2VydmFibGUoaXRlbVsnX2Rlc3Ryb3knXSk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgLy8gQ2FsbCBzZXREb21Ob2RlQ2hpbGRyZW5Gcm9tQXJyYXlNYXBwaW5nLCBpZ25vcmluZyBhbnkgb2JzZXJ2YWJsZXMgdW53cmFwcGVkIHdpdGhpbiAobW9zdCBsaWtlbHkgZnJvbSBhIGNhbGxiYWNrIGZ1bmN0aW9uKS5cbiAgICAgICAgICAgIC8vIElmIHRoZSBhcnJheSBpdGVtcyBhcmUgb2JzZXJ2YWJsZXMsIHRob3VnaCwgdGhleSB3aWxsIGJlIHVud3JhcHBlZCBpbiBleGVjdXRlVGVtcGxhdGVGb3JBcnJheUl0ZW0gYW5kIG1hbmFnZWQgd2l0aGluIHNldERvbU5vZGVDaGlsZHJlbkZyb21BcnJheU1hcHBpbmcuXG4gICAgICAgICAgICBrby5kZXBlbmRlbmN5RGV0ZWN0aW9uLmlnbm9yZShrby51dGlscy5zZXREb21Ob2RlQ2hpbGRyZW5Gcm9tQXJyYXlNYXBwaW5nLCBudWxsLCBbdGFyZ2V0Tm9kZSwgZmlsdGVyZWRBcnJheSwgZXhlY3V0ZVRlbXBsYXRlRm9yQXJyYXlJdGVtLCBvcHRpb25zLCBhY3RpdmF0ZUJpbmRpbmdzQ2FsbGJhY2tdKTtcblxuICAgICAgICB9LCBudWxsLCB7IGRpc3Bvc2VXaGVuTm9kZUlzUmVtb3ZlZDogdGFyZ2V0Tm9kZSB9KTtcbiAgICB9O1xuXG4gICAgdmFyIHRlbXBsYXRlQ29tcHV0ZWREb21EYXRhS2V5ID0gJ19fa29fX3RlbXBsYXRlQ29tcHV0ZWREb21EYXRhS2V5X18nO1xuICAgIGZ1bmN0aW9uIGRpc3Bvc2VPbGRDb21wdXRlZEFuZFN0b3JlTmV3T25lKGVsZW1lbnQsIG5ld0NvbXB1dGVkKSB7XG4gICAgICAgIHZhciBvbGRDb21wdXRlZCA9IGtvLnV0aWxzLmRvbURhdGEuZ2V0KGVsZW1lbnQsIHRlbXBsYXRlQ29tcHV0ZWREb21EYXRhS2V5KTtcbiAgICAgICAgaWYgKG9sZENvbXB1dGVkICYmICh0eXBlb2Yob2xkQ29tcHV0ZWQuZGlzcG9zZSkgPT0gJ2Z1bmN0aW9uJykpXG4gICAgICAgICAgICBvbGRDb21wdXRlZC5kaXNwb3NlKCk7XG4gICAgICAgIGtvLnV0aWxzLmRvbURhdGEuc2V0KGVsZW1lbnQsIHRlbXBsYXRlQ29tcHV0ZWREb21EYXRhS2V5LCAobmV3Q29tcHV0ZWQgJiYgbmV3Q29tcHV0ZWQuaXNBY3RpdmUoKSkgPyBuZXdDb21wdXRlZCA6IHVuZGVmaW5lZCk7XG4gICAgfVxuXG4gICAga28uYmluZGluZ0hhbmRsZXJzWyd0ZW1wbGF0ZSddID0ge1xuICAgICAgICAnaW5pdCc6IGZ1bmN0aW9uKGVsZW1lbnQsIHZhbHVlQWNjZXNzb3IpIHtcbiAgICAgICAgICAgIC8vIFN1cHBvcnQgYW5vbnltb3VzIHRlbXBsYXRlc1xuICAgICAgICAgICAgdmFyIGJpbmRpbmdWYWx1ZSA9IGtvLnV0aWxzLnVud3JhcE9ic2VydmFibGUodmFsdWVBY2Nlc3NvcigpKTtcbiAgICAgICAgICAgIGlmICgodHlwZW9mIGJpbmRpbmdWYWx1ZSAhPSBcInN0cmluZ1wiKSAmJiAoIWJpbmRpbmdWYWx1ZVsnbmFtZSddKSAmJiAoZWxlbWVudC5ub2RlVHlwZSA9PSAxIHx8IGVsZW1lbnQubm9kZVR5cGUgPT0gOCkpIHtcbiAgICAgICAgICAgICAgICAvLyBJdCdzIGFuIGFub255bW91cyB0ZW1wbGF0ZSAtIHN0b3JlIHRoZSBlbGVtZW50IGNvbnRlbnRzLCB0aGVuIGNsZWFyIHRoZSBlbGVtZW50XG4gICAgICAgICAgICAgICAgdmFyIHRlbXBsYXRlTm9kZXMgPSBlbGVtZW50Lm5vZGVUeXBlID09IDEgPyBlbGVtZW50LmNoaWxkTm9kZXMgOiBrby52aXJ0dWFsRWxlbWVudHMuY2hpbGROb2RlcyhlbGVtZW50KSxcbiAgICAgICAgICAgICAgICAgICAgY29udGFpbmVyID0ga28udXRpbHMubW92ZUNsZWFuZWROb2Rlc1RvQ29udGFpbmVyRWxlbWVudCh0ZW1wbGF0ZU5vZGVzKTsgLy8gVGhpcyBhbHNvIHJlbW92ZXMgdGhlIG5vZGVzIGZyb20gdGhlaXIgY3VycmVudCBwYXJlbnRcbiAgICAgICAgICAgICAgICBuZXcga28udGVtcGxhdGVTb3VyY2VzLmFub255bW91c1RlbXBsYXRlKGVsZW1lbnQpWydub2RlcyddKGNvbnRhaW5lcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4geyAnY29udHJvbHNEZXNjZW5kYW50QmluZGluZ3MnOiB0cnVlIH07XG4gICAgICAgIH0sXG4gICAgICAgICd1cGRhdGUnOiBmdW5jdGlvbiAoZWxlbWVudCwgdmFsdWVBY2Nlc3NvciwgYWxsQmluZGluZ3NBY2Nlc3Nvciwgdmlld01vZGVsLCBiaW5kaW5nQ29udGV4dCkge1xuICAgICAgICAgICAgdmFyIHRlbXBsYXRlTmFtZSA9IGtvLnV0aWxzLnVud3JhcE9ic2VydmFibGUodmFsdWVBY2Nlc3NvcigpKSxcbiAgICAgICAgICAgICAgICBvcHRpb25zID0ge30sXG4gICAgICAgICAgICAgICAgc2hvdWxkRGlzcGxheSA9IHRydWUsXG4gICAgICAgICAgICAgICAgZGF0YVZhbHVlLFxuICAgICAgICAgICAgICAgIHRlbXBsYXRlQ29tcHV0ZWQgPSBudWxsO1xuXG4gICAgICAgICAgICBpZiAodHlwZW9mIHRlbXBsYXRlTmFtZSAhPSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICAgICAgb3B0aW9ucyA9IHRlbXBsYXRlTmFtZTtcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZU5hbWUgPSBrby51dGlscy51bndyYXBPYnNlcnZhYmxlKG9wdGlvbnNbJ25hbWUnXSk7XG5cbiAgICAgICAgICAgICAgICAvLyBTdXBwb3J0IFwiaWZcIi9cImlmbm90XCIgY29uZGl0aW9uc1xuICAgICAgICAgICAgICAgIGlmICgnaWYnIGluIG9wdGlvbnMpXG4gICAgICAgICAgICAgICAgICAgIHNob3VsZERpc3BsYXkgPSBrby51dGlscy51bndyYXBPYnNlcnZhYmxlKG9wdGlvbnNbJ2lmJ10pO1xuICAgICAgICAgICAgICAgIGlmIChzaG91bGREaXNwbGF5ICYmICdpZm5vdCcgaW4gb3B0aW9ucylcbiAgICAgICAgICAgICAgICAgICAgc2hvdWxkRGlzcGxheSA9ICFrby51dGlscy51bndyYXBPYnNlcnZhYmxlKG9wdGlvbnNbJ2lmbm90J10pO1xuXG4gICAgICAgICAgICAgICAgZGF0YVZhbHVlID0ga28udXRpbHMudW53cmFwT2JzZXJ2YWJsZShvcHRpb25zWydkYXRhJ10pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoJ2ZvcmVhY2gnIGluIG9wdGlvbnMpIHtcbiAgICAgICAgICAgICAgICAvLyBSZW5kZXIgb25jZSBmb3IgZWFjaCBkYXRhIHBvaW50ICh0cmVhdGluZyBkYXRhIHNldCBhcyBlbXB0eSBpZiBzaG91bGREaXNwbGF5PT1mYWxzZSlcbiAgICAgICAgICAgICAgICB2YXIgZGF0YUFycmF5ID0gKHNob3VsZERpc3BsYXkgJiYgb3B0aW9uc1snZm9yZWFjaCddKSB8fCBbXTtcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZUNvbXB1dGVkID0ga28ucmVuZGVyVGVtcGxhdGVGb3JFYWNoKHRlbXBsYXRlTmFtZSB8fCBlbGVtZW50LCBkYXRhQXJyYXksIG9wdGlvbnMsIGVsZW1lbnQsIGJpbmRpbmdDb250ZXh0KTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoIXNob3VsZERpc3BsYXkpIHtcbiAgICAgICAgICAgICAgICBrby52aXJ0dWFsRWxlbWVudHMuZW1wdHlOb2RlKGVsZW1lbnQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBSZW5kZXIgb25jZSBmb3IgdGhpcyBzaW5nbGUgZGF0YSBwb2ludCAob3IgdXNlIHRoZSB2aWV3TW9kZWwgaWYgbm8gZGF0YSB3YXMgcHJvdmlkZWQpXG4gICAgICAgICAgICAgICAgdmFyIGlubmVyQmluZGluZ0NvbnRleHQgPSAoJ2RhdGEnIGluIG9wdGlvbnMpID9cbiAgICAgICAgICAgICAgICAgICAgYmluZGluZ0NvbnRleHRbJ2NyZWF0ZUNoaWxkQ29udGV4dCddKGRhdGFWYWx1ZSwgb3B0aW9uc1snYXMnXSkgOiAgLy8gR2l2ZW4gYW4gZXhwbGl0aXQgJ2RhdGEnIHZhbHVlLCB3ZSBjcmVhdGUgYSBjaGlsZCBiaW5kaW5nIGNvbnRleHQgZm9yIGl0XG4gICAgICAgICAgICAgICAgICAgIGJpbmRpbmdDb250ZXh0OyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gR2l2ZW4gbm8gZXhwbGljaXQgJ2RhdGEnIHZhbHVlLCB3ZSByZXRhaW4gdGhlIHNhbWUgYmluZGluZyBjb250ZXh0XG4gICAgICAgICAgICAgICAgdGVtcGxhdGVDb21wdXRlZCA9IGtvLnJlbmRlclRlbXBsYXRlKHRlbXBsYXRlTmFtZSB8fCBlbGVtZW50LCBpbm5lckJpbmRpbmdDb250ZXh0LCBvcHRpb25zLCBlbGVtZW50KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gSXQgb25seSBtYWtlcyBzZW5zZSB0byBoYXZlIGEgc2luZ2xlIHRlbXBsYXRlIGNvbXB1dGVkIHBlciBlbGVtZW50IChvdGhlcndpc2Ugd2hpY2ggb25lIHNob3VsZCBoYXZlIGl0cyBvdXRwdXQgZGlzcGxheWVkPylcbiAgICAgICAgICAgIGRpc3Bvc2VPbGRDb21wdXRlZEFuZFN0b3JlTmV3T25lKGVsZW1lbnQsIHRlbXBsYXRlQ29tcHV0ZWQpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8vIEFub255bW91cyB0ZW1wbGF0ZXMgY2FuJ3QgYmUgcmV3cml0dGVuLiBHaXZlIGEgbmljZSBlcnJvciBtZXNzYWdlIGlmIHlvdSB0cnkgdG8gZG8gaXQuXG4gICAga28uZXhwcmVzc2lvblJld3JpdGluZy5iaW5kaW5nUmV3cml0ZVZhbGlkYXRvcnNbJ3RlbXBsYXRlJ10gPSBmdW5jdGlvbihiaW5kaW5nVmFsdWUpIHtcbiAgICAgICAgdmFyIHBhcnNlZEJpbmRpbmdWYWx1ZSA9IGtvLmV4cHJlc3Npb25SZXdyaXRpbmcucGFyc2VPYmplY3RMaXRlcmFsKGJpbmRpbmdWYWx1ZSk7XG5cbiAgICAgICAgaWYgKChwYXJzZWRCaW5kaW5nVmFsdWUubGVuZ3RoID09IDEpICYmIHBhcnNlZEJpbmRpbmdWYWx1ZVswXVsndW5rbm93biddKVxuICAgICAgICAgICAgcmV0dXJuIG51bGw7IC8vIEl0IGxvb2tzIGxpa2UgYSBzdHJpbmcgbGl0ZXJhbCwgbm90IGFuIG9iamVjdCBsaXRlcmFsLCBzbyB0cmVhdCBpdCBhcyBhIG5hbWVkIHRlbXBsYXRlICh3aGljaCBpcyBhbGxvd2VkIGZvciByZXdyaXRpbmcpXG5cbiAgICAgICAgaWYgKGtvLmV4cHJlc3Npb25SZXdyaXRpbmcua2V5VmFsdWVBcnJheUNvbnRhaW5zS2V5KHBhcnNlZEJpbmRpbmdWYWx1ZSwgXCJuYW1lXCIpKVxuICAgICAgICAgICAgcmV0dXJuIG51bGw7IC8vIE5hbWVkIHRlbXBsYXRlcyBjYW4gYmUgcmV3cml0dGVuLCBzbyByZXR1cm4gXCJubyBlcnJvclwiXG4gICAgICAgIHJldHVybiBcIlRoaXMgdGVtcGxhdGUgZW5naW5lIGRvZXMgbm90IHN1cHBvcnQgYW5vbnltb3VzIHRlbXBsYXRlcyBuZXN0ZWQgd2l0aGluIGl0cyB0ZW1wbGF0ZXNcIjtcbiAgICB9O1xuXG4gICAga28udmlydHVhbEVsZW1lbnRzLmFsbG93ZWRCaW5kaW5nc1sndGVtcGxhdGUnXSA9IHRydWU7XG59KSgpO1xuXG5rby5leHBvcnRTeW1ib2woJ3NldFRlbXBsYXRlRW5naW5lJywga28uc2V0VGVtcGxhdGVFbmdpbmUpO1xua28uZXhwb3J0U3ltYm9sKCdyZW5kZXJUZW1wbGF0ZScsIGtvLnJlbmRlclRlbXBsYXRlKTtcblxua28udXRpbHMuY29tcGFyZUFycmF5cyA9IChmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHN0YXR1c05vdEluT2xkID0gJ2FkZGVkJywgc3RhdHVzTm90SW5OZXcgPSAnZGVsZXRlZCc7XG5cbiAgICAvLyBTaW1wbGUgY2FsY3VsYXRpb24gYmFzZWQgb24gTGV2ZW5zaHRlaW4gZGlzdGFuY2UuXG4gICAgZnVuY3Rpb24gY29tcGFyZUFycmF5cyhvbGRBcnJheSwgbmV3QXJyYXksIGRvbnRMaW1pdE1vdmVzKSB7XG4gICAgICAgIG9sZEFycmF5ID0gb2xkQXJyYXkgfHwgW107XG4gICAgICAgIG5ld0FycmF5ID0gbmV3QXJyYXkgfHwgW107XG5cbiAgICAgICAgaWYgKG9sZEFycmF5Lmxlbmd0aCA8PSBuZXdBcnJheS5sZW5ndGgpXG4gICAgICAgICAgICByZXR1cm4gY29tcGFyZVNtYWxsQXJyYXlUb0JpZ0FycmF5KG9sZEFycmF5LCBuZXdBcnJheSwgc3RhdHVzTm90SW5PbGQsIHN0YXR1c05vdEluTmV3LCBkb250TGltaXRNb3Zlcyk7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHJldHVybiBjb21wYXJlU21hbGxBcnJheVRvQmlnQXJyYXkobmV3QXJyYXksIG9sZEFycmF5LCBzdGF0dXNOb3RJbk5ldywgc3RhdHVzTm90SW5PbGQsIGRvbnRMaW1pdE1vdmVzKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjb21wYXJlU21hbGxBcnJheVRvQmlnQXJyYXkoc21sQXJyYXksIGJpZ0FycmF5LCBzdGF0dXNOb3RJblNtbCwgc3RhdHVzTm90SW5CaWcsIGRvbnRMaW1pdE1vdmVzKSB7XG4gICAgICAgIHZhciBteU1pbiA9IE1hdGgubWluLFxuICAgICAgICAgICAgbXlNYXggPSBNYXRoLm1heCxcbiAgICAgICAgICAgIGVkaXREaXN0YW5jZU1hdHJpeCA9IFtdLFxuICAgICAgICAgICAgc21sSW5kZXgsIHNtbEluZGV4TWF4ID0gc21sQXJyYXkubGVuZ3RoLFxuICAgICAgICAgICAgYmlnSW5kZXgsIGJpZ0luZGV4TWF4ID0gYmlnQXJyYXkubGVuZ3RoLFxuICAgICAgICAgICAgY29tcGFyZVJhbmdlID0gKGJpZ0luZGV4TWF4IC0gc21sSW5kZXhNYXgpIHx8IDEsXG4gICAgICAgICAgICBtYXhEaXN0YW5jZSA9IHNtbEluZGV4TWF4ICsgYmlnSW5kZXhNYXggKyAxLFxuICAgICAgICAgICAgdGhpc1JvdywgbGFzdFJvdyxcbiAgICAgICAgICAgIGJpZ0luZGV4TWF4Rm9yUm93LCBiaWdJbmRleE1pbkZvclJvdztcblxuICAgICAgICBmb3IgKHNtbEluZGV4ID0gMDsgc21sSW5kZXggPD0gc21sSW5kZXhNYXg7IHNtbEluZGV4KyspIHtcbiAgICAgICAgICAgIGxhc3RSb3cgPSB0aGlzUm93O1xuICAgICAgICAgICAgZWRpdERpc3RhbmNlTWF0cml4LnB1c2godGhpc1JvdyA9IFtdKTtcbiAgICAgICAgICAgIGJpZ0luZGV4TWF4Rm9yUm93ID0gbXlNaW4oYmlnSW5kZXhNYXgsIHNtbEluZGV4ICsgY29tcGFyZVJhbmdlKTtcbiAgICAgICAgICAgIGJpZ0luZGV4TWluRm9yUm93ID0gbXlNYXgoMCwgc21sSW5kZXggLSAxKTtcbiAgICAgICAgICAgIGZvciAoYmlnSW5kZXggPSBiaWdJbmRleE1pbkZvclJvdzsgYmlnSW5kZXggPD0gYmlnSW5kZXhNYXhGb3JSb3c7IGJpZ0luZGV4KyspIHtcbiAgICAgICAgICAgICAgICBpZiAoIWJpZ0luZGV4KVxuICAgICAgICAgICAgICAgICAgICB0aGlzUm93W2JpZ0luZGV4XSA9IHNtbEluZGV4ICsgMTtcbiAgICAgICAgICAgICAgICBlbHNlIGlmICghc21sSW5kZXgpICAvLyBUb3Agcm93IC0gdHJhbnNmb3JtIGVtcHR5IGFycmF5IGludG8gbmV3IGFycmF5IHZpYSBhZGRpdGlvbnNcbiAgICAgICAgICAgICAgICAgICAgdGhpc1Jvd1tiaWdJbmRleF0gPSBiaWdJbmRleCArIDE7XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoc21sQXJyYXlbc21sSW5kZXggLSAxXSA9PT0gYmlnQXJyYXlbYmlnSW5kZXggLSAxXSlcbiAgICAgICAgICAgICAgICAgICAgdGhpc1Jvd1tiaWdJbmRleF0gPSBsYXN0Um93W2JpZ0luZGV4IC0gMV07ICAgICAgICAgICAgICAgICAgLy8gY29weSB2YWx1ZSAobm8gZWRpdClcbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5vcnRoRGlzdGFuY2UgPSBsYXN0Um93W2JpZ0luZGV4XSB8fCBtYXhEaXN0YW5jZTsgICAgICAgLy8gbm90IGluIGJpZyAoZGVsZXRpb24pXG4gICAgICAgICAgICAgICAgICAgIHZhciB3ZXN0RGlzdGFuY2UgPSB0aGlzUm93W2JpZ0luZGV4IC0gMV0gfHwgbWF4RGlzdGFuY2U7ICAgIC8vIG5vdCBpbiBzbWFsbCAoYWRkaXRpb24pXG4gICAgICAgICAgICAgICAgICAgIHRoaXNSb3dbYmlnSW5kZXhdID0gbXlNaW4obm9ydGhEaXN0YW5jZSwgd2VzdERpc3RhbmNlKSArIDE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGVkaXRTY3JpcHQgPSBbXSwgbWVNaW51c09uZSwgbm90SW5TbWwgPSBbXSwgbm90SW5CaWcgPSBbXTtcbiAgICAgICAgZm9yIChzbWxJbmRleCA9IHNtbEluZGV4TWF4LCBiaWdJbmRleCA9IGJpZ0luZGV4TWF4OyBzbWxJbmRleCB8fCBiaWdJbmRleDspIHtcbiAgICAgICAgICAgIG1lTWludXNPbmUgPSBlZGl0RGlzdGFuY2VNYXRyaXhbc21sSW5kZXhdW2JpZ0luZGV4XSAtIDE7XG4gICAgICAgICAgICBpZiAoYmlnSW5kZXggJiYgbWVNaW51c09uZSA9PT0gZWRpdERpc3RhbmNlTWF0cml4W3NtbEluZGV4XVtiaWdJbmRleC0xXSkge1xuICAgICAgICAgICAgICAgIG5vdEluU21sLnB1c2goZWRpdFNjcmlwdFtlZGl0U2NyaXB0Lmxlbmd0aF0gPSB7ICAgICAvLyBhZGRlZFxuICAgICAgICAgICAgICAgICAgICAnc3RhdHVzJzogc3RhdHVzTm90SW5TbWwsXG4gICAgICAgICAgICAgICAgICAgICd2YWx1ZSc6IGJpZ0FycmF5Wy0tYmlnSW5kZXhdLFxuICAgICAgICAgICAgICAgICAgICAnaW5kZXgnOiBiaWdJbmRleCB9KTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoc21sSW5kZXggJiYgbWVNaW51c09uZSA9PT0gZWRpdERpc3RhbmNlTWF0cml4W3NtbEluZGV4IC0gMV1bYmlnSW5kZXhdKSB7XG4gICAgICAgICAgICAgICAgbm90SW5CaWcucHVzaChlZGl0U2NyaXB0W2VkaXRTY3JpcHQubGVuZ3RoXSA9IHsgICAgIC8vIGRlbGV0ZWRcbiAgICAgICAgICAgICAgICAgICAgJ3N0YXR1cyc6IHN0YXR1c05vdEluQmlnLFxuICAgICAgICAgICAgICAgICAgICAndmFsdWUnOiBzbWxBcnJheVstLXNtbEluZGV4XSxcbiAgICAgICAgICAgICAgICAgICAgJ2luZGV4Jzogc21sSW5kZXggfSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGVkaXRTY3JpcHQucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICdzdGF0dXMnOiBcInJldGFpbmVkXCIsXG4gICAgICAgICAgICAgICAgICAgICd2YWx1ZSc6IGJpZ0FycmF5Wy0tYmlnSW5kZXhdIH0pO1xuICAgICAgICAgICAgICAgIC0tc21sSW5kZXg7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobm90SW5TbWwubGVuZ3RoICYmIG5vdEluQmlnLmxlbmd0aCkge1xuICAgICAgICAgICAgLy8gU2V0IGEgbGltaXQgb24gdGhlIG51bWJlciBvZiBjb25zZWN1dGl2ZSBub24tbWF0Y2hpbmcgY29tcGFyaXNvbnM7IGhhdmluZyBpdCBhIG11bHRpcGxlIG9mXG4gICAgICAgICAgICAvLyBzbWxJbmRleE1heCBrZWVwcyB0aGUgdGltZSBjb21wbGV4aXR5IG9mIHRoaXMgYWxnb3JpdGhtIGxpbmVhci5cbiAgICAgICAgICAgIHZhciBsaW1pdEZhaWxlZENvbXBhcmVzID0gc21sSW5kZXhNYXggKiAxMCwgZmFpbGVkQ29tcGFyZXMsXG4gICAgICAgICAgICAgICAgYSwgZCwgbm90SW5TbWxJdGVtLCBub3RJbkJpZ0l0ZW07XG4gICAgICAgICAgICAvLyBHbyB0aHJvdWdoIHRoZSBpdGVtcyB0aGF0IGhhdmUgYmVlbiBhZGRlZCBhbmQgZGVsZXRlZCBhbmQgdHJ5IHRvIGZpbmQgbWF0Y2hlcyBiZXR3ZWVuIHRoZW0uXG4gICAgICAgICAgICBmb3IgKGZhaWxlZENvbXBhcmVzID0gYSA9IDA7IChkb250TGltaXRNb3ZlcyB8fCBmYWlsZWRDb21wYXJlcyA8IGxpbWl0RmFpbGVkQ29tcGFyZXMpICYmIChub3RJblNtbEl0ZW0gPSBub3RJblNtbFthXSk7IGErKykge1xuICAgICAgICAgICAgICAgIGZvciAoZCA9IDA7IG5vdEluQmlnSXRlbSA9IG5vdEluQmlnW2RdOyBkKyspIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG5vdEluU21sSXRlbVsndmFsdWUnXSA9PT0gbm90SW5CaWdJdGVtWyd2YWx1ZSddKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBub3RJblNtbEl0ZW1bJ21vdmVkJ10gPSBub3RJbkJpZ0l0ZW1bJ2luZGV4J107XG4gICAgICAgICAgICAgICAgICAgICAgICBub3RJbkJpZ0l0ZW1bJ21vdmVkJ10gPSBub3RJblNtbEl0ZW1bJ2luZGV4J107XG4gICAgICAgICAgICAgICAgICAgICAgICBub3RJbkJpZy5zcGxpY2UoZCwxKTsgICAgICAgLy8gVGhpcyBpdGVtIGlzIG1hcmtlZCBhcyBtb3ZlZDsgc28gcmVtb3ZlIGl0IGZyb20gbm90SW5CaWcgbGlzdFxuICAgICAgICAgICAgICAgICAgICAgICAgZmFpbGVkQ29tcGFyZXMgPSBkID0gMDsgICAgIC8vIFJlc2V0IGZhaWxlZCBjb21wYXJlcyBjb3VudCBiZWNhdXNlIHdlJ3JlIGNoZWNraW5nIGZvciBjb25zZWN1dGl2ZSBmYWlsdXJlc1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZmFpbGVkQ29tcGFyZXMgKz0gZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZWRpdFNjcmlwdC5yZXZlcnNlKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNvbXBhcmVBcnJheXM7XG59KSgpO1xuXG5rby5leHBvcnRTeW1ib2woJ3V0aWxzLmNvbXBhcmVBcnJheXMnLCBrby51dGlscy5jb21wYXJlQXJyYXlzKTtcblxuKGZ1bmN0aW9uICgpIHtcbiAgICAvLyBPYmplY3RpdmU6XG4gICAgLy8gKiBHaXZlbiBhbiBpbnB1dCBhcnJheSwgYSBjb250YWluZXIgRE9NIG5vZGUsIGFuZCBhIGZ1bmN0aW9uIGZyb20gYXJyYXkgZWxlbWVudHMgdG8gYXJyYXlzIG9mIERPTSBub2RlcyxcbiAgICAvLyAgIG1hcCB0aGUgYXJyYXkgZWxlbWVudHMgdG8gYXJyYXlzIG9mIERPTSBub2RlcywgY29uY2F0ZW5hdGUgdG9nZXRoZXIgYWxsIHRoZXNlIGFycmF5cywgYW5kIHVzZSB0aGVtIHRvIHBvcHVsYXRlIHRoZSBjb250YWluZXIgRE9NIG5vZGVcbiAgICAvLyAqIE5leHQgdGltZSB3ZSdyZSBnaXZlbiB0aGUgc2FtZSBjb21iaW5hdGlvbiBvZiB0aGluZ3MgKHdpdGggdGhlIGFycmF5IHBvc3NpYmx5IGhhdmluZyBtdXRhdGVkKSwgdXBkYXRlIHRoZSBjb250YWluZXIgRE9NIG5vZGVcbiAgICAvLyAgIHNvIHRoYXQgaXRzIGNoaWxkcmVuIGlzIGFnYWluIHRoZSBjb25jYXRlbmF0aW9uIG9mIHRoZSBtYXBwaW5ncyBvZiB0aGUgYXJyYXkgZWxlbWVudHMsIGJ1dCBkb24ndCByZS1tYXAgYW55IGFycmF5IGVsZW1lbnRzIHRoYXQgd2VcbiAgICAvLyAgIHByZXZpb3VzbHkgbWFwcGVkIC0gcmV0YWluIHRob3NlIG5vZGVzLCBhbmQganVzdCBpbnNlcnQvZGVsZXRlIG90aGVyIG9uZXNcblxuICAgIC8vIFwiY2FsbGJhY2tBZnRlckFkZGluZ05vZGVzXCIgd2lsbCBiZSBpbnZva2VkIGFmdGVyIGFueSBcIm1hcHBpbmdcIi1nZW5lcmF0ZWQgbm9kZXMgYXJlIGluc2VydGVkIGludG8gdGhlIGNvbnRhaW5lciBub2RlXG4gICAgLy8gWW91IGNhbiB1c2UgdGhpcywgZm9yIGV4YW1wbGUsIHRvIGFjdGl2YXRlIGJpbmRpbmdzIG9uIHRob3NlIG5vZGVzLlxuXG4gICAgZnVuY3Rpb24gZml4VXBOb2Rlc1RvQmVNb3ZlZE9yUmVtb3ZlZChjb250aWd1b3VzTm9kZUFycmF5KSB7XG4gICAgICAgIC8vIEJlZm9yZSBtb3ZpbmcsIGRlbGV0aW5nLCBvciByZXBsYWNpbmcgYSBzZXQgb2Ygbm9kZXMgdGhhdCB3ZXJlIHByZXZpb3VzbHkgb3V0cHV0dGVkIGJ5IHRoZSBcIm1hcFwiIGZ1bmN0aW9uLCB3ZSBoYXZlIHRvIHJlY29uY2lsZVxuICAgICAgICAvLyB0aGVtIGFnYWluc3Qgd2hhdCBpcyBpbiB0aGUgRE9NIHJpZ2h0IG5vdy4gSXQgbWF5IGJlIHRoYXQgc29tZSBvZiB0aGUgbm9kZXMgaGF2ZSBhbHJlYWR5IGJlZW4gcmVtb3ZlZCBmcm9tIHRoZSBkb2N1bWVudCxcbiAgICAgICAgLy8gb3IgdGhhdCBuZXcgbm9kZXMgbWlnaHQgaGF2ZSBiZWVuIGluc2VydGVkIGluIHRoZSBtaWRkbGUsIGZvciBleGFtcGxlIGJ5IGEgYmluZGluZy4gQWxzbywgdGhlcmUgbWF5IHByZXZpb3VzbHkgaGF2ZSBiZWVuXG4gICAgICAgIC8vIGxlYWRpbmcgY29tbWVudCBub2RlcyAoY3JlYXRlZCBieSByZXdyaXR0ZW4gc3RyaW5nLWJhc2VkIHRlbXBsYXRlcykgdGhhdCBoYXZlIHNpbmNlIGJlZW4gcmVtb3ZlZCBkdXJpbmcgYmluZGluZy5cbiAgICAgICAgLy8gU28sIHRoaXMgZnVuY3Rpb24gdHJhbnNsYXRlcyB0aGUgb2xkIFwibWFwXCIgb3V0cHV0IGFycmF5IGludG8gaXRzIGJlc3QgZ3Vlc3Mgb2Ygd2hhdCBzZXQgb2YgY3VycmVudCBET00gbm9kZXMgc2hvdWxkIGJlIHJlbW92ZWQuXG4gICAgICAgIC8vXG4gICAgICAgIC8vIFJ1bGVzOlxuICAgICAgICAvLyAgIFtBXSBBbnkgbGVhZGluZyBub2RlcyB0aGF0IGFyZW4ndCBpbiB0aGUgZG9jdW1lbnQgYW55IG1vcmUgc2hvdWxkIGJlIGlnbm9yZWRcbiAgICAgICAgLy8gICAgICAgVGhlc2UgbW9zdCBsaWtlbHkgY29ycmVzcG9uZCB0byBtZW1vaXphdGlvbiBub2RlcyB0aGF0IHdlcmUgYWxyZWFkeSByZW1vdmVkIGR1cmluZyBiaW5kaW5nXG4gICAgICAgIC8vICAgICAgIFNlZSBodHRwczovL2dpdGh1Yi5jb20vU3RldmVTYW5kZXJzb24va25vY2tvdXQvcHVsbC80NDBcbiAgICAgICAgLy8gICBbQl0gV2Ugd2FudCB0byBvdXRwdXQgYSBjb250aWd1b3VzIHNlcmllcyBvZiBub2RlcyB0aGF0IGFyZSBzdGlsbCBpbiB0aGUgZG9jdW1lbnQuIFNvLCBpZ25vcmUgYW55IG5vZGVzIHRoYXRcbiAgICAgICAgLy8gICAgICAgaGF2ZSBhbHJlYWR5IGJlZW4gcmVtb3ZlZCwgYW5kIGluY2x1ZGUgYW55IG5vZGVzIHRoYXQgaGF2ZSBiZWVuIGluc2VydGVkIGFtb25nIHRoZSBwcmV2aW91cyBjb2xsZWN0aW9uXG5cbiAgICAgICAgLy8gUnVsZSBbQV1cbiAgICAgICAgd2hpbGUgKGNvbnRpZ3VvdXNOb2RlQXJyYXkubGVuZ3RoICYmICFrby51dGlscy5kb21Ob2RlSXNBdHRhY2hlZFRvRG9jdW1lbnQoY29udGlndW91c05vZGVBcnJheVswXSkpXG4gICAgICAgICAgICBjb250aWd1b3VzTm9kZUFycmF5LnNwbGljZSgwLCAxKTtcblxuICAgICAgICAvLyBSdWxlIFtCXVxuICAgICAgICBpZiAoY29udGlndW91c05vZGVBcnJheS5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICAvLyBCdWlsZCB1cCB0aGUgYWN0dWFsIG5ldyBjb250aWd1b3VzIG5vZGUgc2V0XG4gICAgICAgICAgICB2YXIgY3VycmVudCA9IGNvbnRpZ3VvdXNOb2RlQXJyYXlbMF0sIGxhc3QgPSBjb250aWd1b3VzTm9kZUFycmF5W2NvbnRpZ3VvdXNOb2RlQXJyYXkubGVuZ3RoIC0gMV0sIG5ld0NvbnRpZ3VvdXNTZXQgPSBbY3VycmVudF07XG4gICAgICAgICAgICB3aGlsZSAoY3VycmVudCAhPT0gbGFzdCkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnQgPSBjdXJyZW50Lm5leHRTaWJsaW5nO1xuICAgICAgICAgICAgICAgIGlmICghY3VycmVudCkgLy8gV29uJ3QgaGFwcGVuLCBleGNlcHQgaWYgdGhlIGRldmVsb3BlciBoYXMgbWFudWFsbHkgcmVtb3ZlZCBzb21lIERPTSBlbGVtZW50cyAodGhlbiB3ZSdyZSBpbiBhbiB1bmRlZmluZWQgc2NlbmFyaW8pXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICBuZXdDb250aWd1b3VzU2V0LnB1c2goY3VycmVudCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIC4uLiB0aGVuIG11dGF0ZSB0aGUgaW5wdXQgYXJyYXkgdG8gbWF0Y2ggdGhpcy5cbiAgICAgICAgICAgIC8vIChUaGUgZm9sbG93aW5nIGxpbmUgcmVwbGFjZXMgdGhlIGNvbnRlbnRzIG9mIGNvbnRpZ3VvdXNOb2RlQXJyYXkgd2l0aCBuZXdDb250aWd1b3VzU2V0KVxuICAgICAgICAgICAgQXJyYXkucHJvdG90eXBlLnNwbGljZS5hcHBseShjb250aWd1b3VzTm9kZUFycmF5LCBbMCwgY29udGlndW91c05vZGVBcnJheS5sZW5ndGhdLmNvbmNhdChuZXdDb250aWd1b3VzU2V0KSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGNvbnRpZ3VvdXNOb2RlQXJyYXk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbWFwTm9kZUFuZFJlZnJlc2hXaGVuQ2hhbmdlZChjb250YWluZXJOb2RlLCBtYXBwaW5nLCB2YWx1ZVRvTWFwLCBjYWxsYmFja0FmdGVyQWRkaW5nTm9kZXMsIGluZGV4KSB7XG4gICAgICAgIC8vIE1hcCB0aGlzIGFycmF5IHZhbHVlIGluc2lkZSBhIGRlcGVuZGVudE9ic2VydmFibGUgc28gd2UgcmUtbWFwIHdoZW4gYW55IGRlcGVuZGVuY3kgY2hhbmdlc1xuICAgICAgICB2YXIgbWFwcGVkTm9kZXMgPSBbXTtcbiAgICAgICAgdmFyIGRlcGVuZGVudE9ic2VydmFibGUgPSBrby5kZXBlbmRlbnRPYnNlcnZhYmxlKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIG5ld01hcHBlZE5vZGVzID0gbWFwcGluZyh2YWx1ZVRvTWFwLCBpbmRleCwgZml4VXBOb2Rlc1RvQmVNb3ZlZE9yUmVtb3ZlZChtYXBwZWROb2RlcykpIHx8IFtdO1xuXG4gICAgICAgICAgICAvLyBPbiBzdWJzZXF1ZW50IGV2YWx1YXRpb25zLCBqdXN0IHJlcGxhY2UgdGhlIHByZXZpb3VzbHktaW5zZXJ0ZWQgRE9NIG5vZGVzXG4gICAgICAgICAgICBpZiAobWFwcGVkTm9kZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIGtvLnV0aWxzLnJlcGxhY2VEb21Ob2RlcyhtYXBwZWROb2RlcywgbmV3TWFwcGVkTm9kZXMpO1xuICAgICAgICAgICAgICAgIGlmIChjYWxsYmFja0FmdGVyQWRkaW5nTm9kZXMpXG4gICAgICAgICAgICAgICAgICAgIGtvLmRlcGVuZGVuY3lEZXRlY3Rpb24uaWdub3JlKGNhbGxiYWNrQWZ0ZXJBZGRpbmdOb2RlcywgbnVsbCwgW3ZhbHVlVG9NYXAsIG5ld01hcHBlZE5vZGVzLCBpbmRleF0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBSZXBsYWNlIHRoZSBjb250ZW50cyBvZiB0aGUgbWFwcGVkTm9kZXMgYXJyYXksIHRoZXJlYnkgdXBkYXRpbmcgdGhlIHJlY29yZFxuICAgICAgICAgICAgLy8gb2Ygd2hpY2ggbm9kZXMgd291bGQgYmUgZGVsZXRlZCBpZiB2YWx1ZVRvTWFwIHdhcyBpdHNlbGYgbGF0ZXIgcmVtb3ZlZFxuICAgICAgICAgICAgbWFwcGVkTm9kZXMuc3BsaWNlKDAsIG1hcHBlZE5vZGVzLmxlbmd0aCk7XG4gICAgICAgICAgICBrby51dGlscy5hcnJheVB1c2hBbGwobWFwcGVkTm9kZXMsIG5ld01hcHBlZE5vZGVzKTtcbiAgICAgICAgfSwgbnVsbCwgeyBkaXNwb3NlV2hlbk5vZGVJc1JlbW92ZWQ6IGNvbnRhaW5lck5vZGUsIGRpc3Bvc2VXaGVuOiBmdW5jdGlvbigpIHsgcmV0dXJuICFrby51dGlscy5hbnlEb21Ob2RlSXNBdHRhY2hlZFRvRG9jdW1lbnQobWFwcGVkTm9kZXMpOyB9IH0pO1xuICAgICAgICByZXR1cm4geyBtYXBwZWROb2RlcyA6IG1hcHBlZE5vZGVzLCBkZXBlbmRlbnRPYnNlcnZhYmxlIDogKGRlcGVuZGVudE9ic2VydmFibGUuaXNBY3RpdmUoKSA/IGRlcGVuZGVudE9ic2VydmFibGUgOiB1bmRlZmluZWQpIH07XG4gICAgfVxuXG4gICAgdmFyIGxhc3RNYXBwaW5nUmVzdWx0RG9tRGF0YUtleSA9IFwic2V0RG9tTm9kZUNoaWxkcmVuRnJvbUFycmF5TWFwcGluZ19sYXN0TWFwcGluZ1Jlc3VsdFwiO1xuXG4gICAga28udXRpbHMuc2V0RG9tTm9kZUNoaWxkcmVuRnJvbUFycmF5TWFwcGluZyA9IGZ1bmN0aW9uIChkb21Ob2RlLCBhcnJheSwgbWFwcGluZywgb3B0aW9ucywgY2FsbGJhY2tBZnRlckFkZGluZ05vZGVzKSB7XG4gICAgICAgIC8vIENvbXBhcmUgdGhlIHByb3ZpZGVkIGFycmF5IGFnYWluc3QgdGhlIHByZXZpb3VzIG9uZVxuICAgICAgICBhcnJheSA9IGFycmF5IHx8IFtdO1xuICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICAgICAgdmFyIGlzRmlyc3RFeGVjdXRpb24gPSBrby51dGlscy5kb21EYXRhLmdldChkb21Ob2RlLCBsYXN0TWFwcGluZ1Jlc3VsdERvbURhdGFLZXkpID09PSB1bmRlZmluZWQ7XG4gICAgICAgIHZhciBsYXN0TWFwcGluZ1Jlc3VsdCA9IGtvLnV0aWxzLmRvbURhdGEuZ2V0KGRvbU5vZGUsIGxhc3RNYXBwaW5nUmVzdWx0RG9tRGF0YUtleSkgfHwgW107XG4gICAgICAgIHZhciBsYXN0QXJyYXkgPSBrby51dGlscy5hcnJheU1hcChsYXN0TWFwcGluZ1Jlc3VsdCwgZnVuY3Rpb24gKHgpIHsgcmV0dXJuIHguYXJyYXlFbnRyeTsgfSk7XG4gICAgICAgIHZhciBlZGl0U2NyaXB0ID0ga28udXRpbHMuY29tcGFyZUFycmF5cyhsYXN0QXJyYXksIGFycmF5LCBvcHRpb25zWydkb250TGltaXRNb3ZlcyddKTtcblxuICAgICAgICAvLyBCdWlsZCB0aGUgbmV3IG1hcHBpbmcgcmVzdWx0XG4gICAgICAgIHZhciBuZXdNYXBwaW5nUmVzdWx0ID0gW107XG4gICAgICAgIHZhciBsYXN0TWFwcGluZ1Jlc3VsdEluZGV4ID0gMDtcbiAgICAgICAgdmFyIG5ld01hcHBpbmdSZXN1bHRJbmRleCA9IDA7XG5cbiAgICAgICAgdmFyIG5vZGVzVG9EZWxldGUgPSBbXTtcbiAgICAgICAgdmFyIGl0ZW1zVG9Qcm9jZXNzID0gW107XG4gICAgICAgIHZhciBpdGVtc0ZvckJlZm9yZVJlbW92ZUNhbGxiYWNrcyA9IFtdO1xuICAgICAgICB2YXIgaXRlbXNGb3JNb3ZlQ2FsbGJhY2tzID0gW107XG4gICAgICAgIHZhciBpdGVtc0ZvckFmdGVyQWRkQ2FsbGJhY2tzID0gW107XG4gICAgICAgIHZhciBtYXBEYXRhO1xuXG4gICAgICAgIGZ1bmN0aW9uIGl0ZW1Nb3ZlZE9yUmV0YWluZWQoZWRpdFNjcmlwdEluZGV4LCBvbGRQb3NpdGlvbikge1xuICAgICAgICAgICAgbWFwRGF0YSA9IGxhc3RNYXBwaW5nUmVzdWx0W29sZFBvc2l0aW9uXTtcbiAgICAgICAgICAgIGlmIChuZXdNYXBwaW5nUmVzdWx0SW5kZXggIT09IG9sZFBvc2l0aW9uKVxuICAgICAgICAgICAgICAgIGl0ZW1zRm9yTW92ZUNhbGxiYWNrc1tlZGl0U2NyaXB0SW5kZXhdID0gbWFwRGF0YTtcbiAgICAgICAgICAgIC8vIFNpbmNlIHVwZGF0aW5nIHRoZSBpbmRleCBtaWdodCBjaGFuZ2UgdGhlIG5vZGVzLCBkbyBzbyBiZWZvcmUgY2FsbGluZyBmaXhVcE5vZGVzVG9CZU1vdmVkT3JSZW1vdmVkXG4gICAgICAgICAgICBtYXBEYXRhLmluZGV4T2JzZXJ2YWJsZShuZXdNYXBwaW5nUmVzdWx0SW5kZXgrKyk7XG4gICAgICAgICAgICBmaXhVcE5vZGVzVG9CZU1vdmVkT3JSZW1vdmVkKG1hcERhdGEubWFwcGVkTm9kZXMpO1xuICAgICAgICAgICAgbmV3TWFwcGluZ1Jlc3VsdC5wdXNoKG1hcERhdGEpO1xuICAgICAgICAgICAgaXRlbXNUb1Byb2Nlc3MucHVzaChtYXBEYXRhKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGNhbGxDYWxsYmFjayhjYWxsYmFjaywgaXRlbXMpIHtcbiAgICAgICAgICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBuID0gaXRlbXMubGVuZ3RoOyBpIDwgbjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpdGVtc1tpXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAga28udXRpbHMuYXJyYXlGb3JFYWNoKGl0ZW1zW2ldLm1hcHBlZE5vZGVzLCBmdW5jdGlvbihub2RlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2sobm9kZSwgaSwgaXRlbXNbaV0uYXJyYXlFbnRyeSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBlZGl0U2NyaXB0SXRlbSwgbW92ZWRJbmRleDsgZWRpdFNjcmlwdEl0ZW0gPSBlZGl0U2NyaXB0W2ldOyBpKyspIHtcbiAgICAgICAgICAgIG1vdmVkSW5kZXggPSBlZGl0U2NyaXB0SXRlbVsnbW92ZWQnXTtcbiAgICAgICAgICAgIHN3aXRjaCAoZWRpdFNjcmlwdEl0ZW1bJ3N0YXR1cyddKSB7XG4gICAgICAgICAgICAgICAgY2FzZSBcImRlbGV0ZWRcIjpcbiAgICAgICAgICAgICAgICAgICAgaWYgKG1vdmVkSW5kZXggPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWFwRGF0YSA9IGxhc3RNYXBwaW5nUmVzdWx0W2xhc3RNYXBwaW5nUmVzdWx0SW5kZXhdO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBTdG9wIHRyYWNraW5nIGNoYW5nZXMgdG8gdGhlIG1hcHBpbmcgZm9yIHRoZXNlIG5vZGVzXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobWFwRGF0YS5kZXBlbmRlbnRPYnNlcnZhYmxlKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hcERhdGEuZGVwZW5kZW50T2JzZXJ2YWJsZS5kaXNwb3NlKCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFF1ZXVlIHRoZXNlIG5vZGVzIGZvciBsYXRlciByZW1vdmFsXG4gICAgICAgICAgICAgICAgICAgICAgICBub2Rlc1RvRGVsZXRlLnB1c2guYXBwbHkobm9kZXNUb0RlbGV0ZSwgZml4VXBOb2Rlc1RvQmVNb3ZlZE9yUmVtb3ZlZChtYXBEYXRhLm1hcHBlZE5vZGVzKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAob3B0aW9uc1snYmVmb3JlUmVtb3ZlJ10pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtc0ZvckJlZm9yZVJlbW92ZUNhbGxiYWNrc1tpXSA9IG1hcERhdGE7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbXNUb1Byb2Nlc3MucHVzaChtYXBEYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBsYXN0TWFwcGluZ1Jlc3VsdEluZGV4Kys7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgY2FzZSBcInJldGFpbmVkXCI6XG4gICAgICAgICAgICAgICAgICAgIGl0ZW1Nb3ZlZE9yUmV0YWluZWQoaSwgbGFzdE1hcHBpbmdSZXN1bHRJbmRleCsrKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICBjYXNlIFwiYWRkZWRcIjpcbiAgICAgICAgICAgICAgICAgICAgaWYgKG1vdmVkSW5kZXggIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaXRlbU1vdmVkT3JSZXRhaW5lZChpLCBtb3ZlZEluZGV4KTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hcERhdGEgPSB7IGFycmF5RW50cnk6IGVkaXRTY3JpcHRJdGVtWyd2YWx1ZSddLCBpbmRleE9ic2VydmFibGU6IGtvLm9ic2VydmFibGUobmV3TWFwcGluZ1Jlc3VsdEluZGV4KyspIH07XG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdNYXBwaW5nUmVzdWx0LnB1c2gobWFwRGF0YSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpdGVtc1RvUHJvY2Vzcy5wdXNoKG1hcERhdGEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFpc0ZpcnN0RXhlY3V0aW9uKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW1zRm9yQWZ0ZXJBZGRDYWxsYmFja3NbaV0gPSBtYXBEYXRhO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ2FsbCBiZWZvcmVNb3ZlIGZpcnN0IGJlZm9yZSBhbnkgY2hhbmdlcyBoYXZlIGJlZW4gbWFkZSB0byB0aGUgRE9NXG4gICAgICAgIGNhbGxDYWxsYmFjayhvcHRpb25zWydiZWZvcmVNb3ZlJ10sIGl0ZW1zRm9yTW92ZUNhbGxiYWNrcyk7XG5cbiAgICAgICAgLy8gTmV4dCByZW1vdmUgbm9kZXMgZm9yIGRlbGV0ZWQgaXRlbXMgKG9yIGp1c3QgY2xlYW4gaWYgdGhlcmUncyBhIGJlZm9yZVJlbW92ZSBjYWxsYmFjaylcbiAgICAgICAga28udXRpbHMuYXJyYXlGb3JFYWNoKG5vZGVzVG9EZWxldGUsIG9wdGlvbnNbJ2JlZm9yZVJlbW92ZSddID8ga28uY2xlYW5Ob2RlIDoga28ucmVtb3ZlTm9kZSk7XG5cbiAgICAgICAgLy8gTmV4dCBhZGQvcmVvcmRlciB0aGUgcmVtYWluaW5nIGl0ZW1zICh3aWxsIGluY2x1ZGUgZGVsZXRlZCBpdGVtcyBpZiB0aGVyZSdzIGEgYmVmb3JlUmVtb3ZlIGNhbGxiYWNrKVxuICAgICAgICBmb3IgKHZhciBpID0gMCwgbmV4dE5vZGUgPSBrby52aXJ0dWFsRWxlbWVudHMuZmlyc3RDaGlsZChkb21Ob2RlKSwgbGFzdE5vZGUsIG5vZGU7IG1hcERhdGEgPSBpdGVtc1RvUHJvY2Vzc1tpXTsgaSsrKSB7XG4gICAgICAgICAgICAvLyBHZXQgbm9kZXMgZm9yIG5ld2x5IGFkZGVkIGl0ZW1zXG4gICAgICAgICAgICBpZiAoIW1hcERhdGEubWFwcGVkTm9kZXMpXG4gICAgICAgICAgICAgICAga28udXRpbHMuZXh0ZW5kKG1hcERhdGEsIG1hcE5vZGVBbmRSZWZyZXNoV2hlbkNoYW5nZWQoZG9tTm9kZSwgbWFwcGluZywgbWFwRGF0YS5hcnJheUVudHJ5LCBjYWxsYmFja0FmdGVyQWRkaW5nTm9kZXMsIG1hcERhdGEuaW5kZXhPYnNlcnZhYmxlKSk7XG5cbiAgICAgICAgICAgIC8vIFB1dCBub2RlcyBpbiB0aGUgcmlnaHQgcGxhY2UgaWYgdGhleSBhcmVuJ3QgdGhlcmUgYWxyZWFkeVxuICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IG5vZGUgPSBtYXBEYXRhLm1hcHBlZE5vZGVzW2pdOyBuZXh0Tm9kZSA9IG5vZGUubmV4dFNpYmxpbmcsIGxhc3ROb2RlID0gbm9kZSwgaisrKSB7XG4gICAgICAgICAgICAgICAgaWYgKG5vZGUgIT09IG5leHROb2RlKVxuICAgICAgICAgICAgICAgICAgICBrby52aXJ0dWFsRWxlbWVudHMuaW5zZXJ0QWZ0ZXIoZG9tTm9kZSwgbm9kZSwgbGFzdE5vZGUpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBSdW4gdGhlIGNhbGxiYWNrcyBmb3IgbmV3bHkgYWRkZWQgbm9kZXMgKGZvciBleGFtcGxlLCB0byBhcHBseSBiaW5kaW5ncywgZXRjLilcbiAgICAgICAgICAgIGlmICghbWFwRGF0YS5pbml0aWFsaXplZCAmJiBjYWxsYmFja0FmdGVyQWRkaW5nTm9kZXMpIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFja0FmdGVyQWRkaW5nTm9kZXMobWFwRGF0YS5hcnJheUVudHJ5LCBtYXBEYXRhLm1hcHBlZE5vZGVzLCBtYXBEYXRhLmluZGV4T2JzZXJ2YWJsZSk7XG4gICAgICAgICAgICAgICAgbWFwRGF0YS5pbml0aWFsaXplZCA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJZiB0aGVyZSdzIGEgYmVmb3JlUmVtb3ZlIGNhbGxiYWNrLCBjYWxsIGl0IGFmdGVyIHJlb3JkZXJpbmcuXG4gICAgICAgIC8vIE5vdGUgdGhhdCB3ZSBhc3N1bWUgdGhhdCB0aGUgYmVmb3JlUmVtb3ZlIGNhbGxiYWNrIHdpbGwgdXN1YWxseSBiZSB1c2VkIHRvIHJlbW92ZSB0aGUgbm9kZXMgdXNpbmdcbiAgICAgICAgLy8gc29tZSBzb3J0IG9mIGFuaW1hdGlvbiwgd2hpY2ggaXMgd2h5IHdlIGZpcnN0IHJlb3JkZXIgdGhlIG5vZGVzIHRoYXQgd2lsbCBiZSByZW1vdmVkLiBJZiB0aGVcbiAgICAgICAgLy8gY2FsbGJhY2sgaW5zdGVhZCByZW1vdmVzIHRoZSBub2RlcyByaWdodCBhd2F5LCBpdCB3b3VsZCBiZSBtb3JlIGVmZmljaWVudCB0byBza2lwIHJlb3JkZXJpbmcgdGhlbS5cbiAgICAgICAgLy8gUGVyaGFwcyB3ZSdsbCBtYWtlIHRoYXQgY2hhbmdlIGluIHRoZSBmdXR1cmUgaWYgdGhpcyBzY2VuYXJpbyBiZWNvbWVzIG1vcmUgY29tbW9uLlxuICAgICAgICBjYWxsQ2FsbGJhY2sob3B0aW9uc1snYmVmb3JlUmVtb3ZlJ10sIGl0ZW1zRm9yQmVmb3JlUmVtb3ZlQ2FsbGJhY2tzKTtcblxuICAgICAgICAvLyBGaW5hbGx5IGNhbGwgYWZ0ZXJNb3ZlIGFuZCBhZnRlckFkZCBjYWxsYmFja3NcbiAgICAgICAgY2FsbENhbGxiYWNrKG9wdGlvbnNbJ2FmdGVyTW92ZSddLCBpdGVtc0Zvck1vdmVDYWxsYmFja3MpO1xuICAgICAgICBjYWxsQ2FsbGJhY2sob3B0aW9uc1snYWZ0ZXJBZGQnXSwgaXRlbXNGb3JBZnRlckFkZENhbGxiYWNrcyk7XG5cbiAgICAgICAgLy8gU3RvcmUgYSBjb3B5IG9mIHRoZSBhcnJheSBpdGVtcyB3ZSBqdXN0IGNvbnNpZGVyZWQgc28gd2UgY2FuIGRpZmZlcmVuY2UgaXQgbmV4dCB0aW1lXG4gICAgICAgIGtvLnV0aWxzLmRvbURhdGEuc2V0KGRvbU5vZGUsIGxhc3RNYXBwaW5nUmVzdWx0RG9tRGF0YUtleSwgbmV3TWFwcGluZ1Jlc3VsdCk7XG4gICAgfVxufSkoKTtcblxua28uZXhwb3J0U3ltYm9sKCd1dGlscy5zZXREb21Ob2RlQ2hpbGRyZW5Gcm9tQXJyYXlNYXBwaW5nJywga28udXRpbHMuc2V0RG9tTm9kZUNoaWxkcmVuRnJvbUFycmF5TWFwcGluZyk7XG5rby5uYXRpdmVUZW1wbGF0ZUVuZ2luZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzWydhbGxvd1RlbXBsYXRlUmV3cml0aW5nJ10gPSBmYWxzZTtcbn1cblxua28ubmF0aXZlVGVtcGxhdGVFbmdpbmUucHJvdG90eXBlID0gbmV3IGtvLnRlbXBsYXRlRW5naW5lKCk7XG5rby5uYXRpdmVUZW1wbGF0ZUVuZ2luZS5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBrby5uYXRpdmVUZW1wbGF0ZUVuZ2luZTtcbmtvLm5hdGl2ZVRlbXBsYXRlRW5naW5lLnByb3RvdHlwZVsncmVuZGVyVGVtcGxhdGVTb3VyY2UnXSA9IGZ1bmN0aW9uICh0ZW1wbGF0ZVNvdXJjZSwgYmluZGluZ0NvbnRleHQsIG9wdGlvbnMpIHtcbiAgICB2YXIgdXNlTm9kZXNJZkF2YWlsYWJsZSA9ICEoa28udXRpbHMuaWVWZXJzaW9uIDwgOSksIC8vIElFPDkgY2xvbmVOb2RlIGRvZXNuJ3Qgd29yayBwcm9wZXJseVxuICAgICAgICB0ZW1wbGF0ZU5vZGVzRnVuYyA9IHVzZU5vZGVzSWZBdmFpbGFibGUgPyB0ZW1wbGF0ZVNvdXJjZVsnbm9kZXMnXSA6IG51bGwsXG4gICAgICAgIHRlbXBsYXRlTm9kZXMgPSB0ZW1wbGF0ZU5vZGVzRnVuYyA/IHRlbXBsYXRlU291cmNlWydub2RlcyddKCkgOiBudWxsO1xuXG4gICAgaWYgKHRlbXBsYXRlTm9kZXMpIHtcbiAgICAgICAgcmV0dXJuIGtvLnV0aWxzLm1ha2VBcnJheSh0ZW1wbGF0ZU5vZGVzLmNsb25lTm9kZSh0cnVlKS5jaGlsZE5vZGVzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgdGVtcGxhdGVUZXh0ID0gdGVtcGxhdGVTb3VyY2VbJ3RleHQnXSgpO1xuICAgICAgICByZXR1cm4ga28udXRpbHMucGFyc2VIdG1sRnJhZ21lbnQodGVtcGxhdGVUZXh0KTtcbiAgICB9XG59O1xuXG5rby5uYXRpdmVUZW1wbGF0ZUVuZ2luZS5pbnN0YW5jZSA9IG5ldyBrby5uYXRpdmVUZW1wbGF0ZUVuZ2luZSgpO1xua28uc2V0VGVtcGxhdGVFbmdpbmUoa28ubmF0aXZlVGVtcGxhdGVFbmdpbmUuaW5zdGFuY2UpO1xuXG5rby5leHBvcnRTeW1ib2woJ25hdGl2ZVRlbXBsYXRlRW5naW5lJywga28ubmF0aXZlVGVtcGxhdGVFbmdpbmUpO1xuKGZ1bmN0aW9uKCkge1xuICAgIGtvLmpxdWVyeVRtcGxUZW1wbGF0ZUVuZ2luZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgLy8gRGV0ZWN0IHdoaWNoIHZlcnNpb24gb2YganF1ZXJ5LXRtcGwgeW91J3JlIHVzaW5nLiBVbmZvcnR1bmF0ZWx5IGpxdWVyeS10bXBsXG4gICAgICAgIC8vIGRvZXNuJ3QgZXhwb3NlIGEgdmVyc2lvbiBudW1iZXIsIHNvIHdlIGhhdmUgdG8gaW5mZXIgaXQuXG4gICAgICAgIC8vIE5vdGUgdGhhdCBhcyBvZiBLbm9ja291dCAxLjMsIHdlIG9ubHkgc3VwcG9ydCBqUXVlcnkudG1wbCAxLjAuMHByZSBhbmQgbGF0ZXIsXG4gICAgICAgIC8vIHdoaWNoIEtPIGludGVybmFsbHkgcmVmZXJzIHRvIGFzIHZlcnNpb24gXCIyXCIsIHNvIG9sZGVyIHZlcnNpb25zIGFyZSBubyBsb25nZXIgZGV0ZWN0ZWQuXG4gICAgICAgIHZhciBqUXVlcnlUbXBsVmVyc2lvbiA9IHRoaXMualF1ZXJ5VG1wbFZlcnNpb24gPSAoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAoKHR5cGVvZihqUXVlcnkpID09IFwidW5kZWZpbmVkXCIpIHx8ICEoalF1ZXJ5Wyd0bXBsJ10pKVxuICAgICAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICAgICAgLy8gU2luY2UgaXQgZXhwb3NlcyBubyBvZmZpY2lhbCB2ZXJzaW9uIG51bWJlciwgd2UgdXNlIG91ciBvd24gbnVtYmVyaW5nIHN5c3RlbS4gVG8gYmUgdXBkYXRlZCBhcyBqcXVlcnktdG1wbCBldm9sdmVzLlxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBpZiAoalF1ZXJ5Wyd0bXBsJ11bJ3RhZyddWyd0bXBsJ11bJ29wZW4nXS50b1N0cmluZygpLmluZGV4T2YoJ19fJykgPj0gMCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBTaW5jZSAxLjAuMHByZSwgY3VzdG9tIHRhZ3Mgc2hvdWxkIGFwcGVuZCBtYXJrdXAgdG8gYW4gYXJyYXkgY2FsbGVkIFwiX19cIlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gMjsgLy8gRmluYWwgdmVyc2lvbiBvZiBqcXVlcnkudG1wbFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gY2F0Y2goZXgpIHsgLyogQXBwYXJlbnRseSBub3QgdGhlIHZlcnNpb24gd2Ugd2VyZSBsb29raW5nIGZvciAqLyB9XG5cbiAgICAgICAgICAgIHJldHVybiAxOyAvLyBBbnkgb2xkZXIgdmVyc2lvbiB0aGF0IHdlIGRvbid0IHN1cHBvcnRcbiAgICAgICAgfSkoKTtcblxuICAgICAgICBmdW5jdGlvbiBlbnN1cmVIYXNSZWZlcmVuY2VkSlF1ZXJ5VGVtcGxhdGVzKCkge1xuICAgICAgICAgICAgaWYgKGpRdWVyeVRtcGxWZXJzaW9uIDwgMilcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJZb3VyIHZlcnNpb24gb2YgalF1ZXJ5LnRtcGwgaXMgdG9vIG9sZC4gUGxlYXNlIHVwZ3JhZGUgdG8galF1ZXJ5LnRtcGwgMS4wLjBwcmUgb3IgbGF0ZXIuXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gZXhlY3V0ZVRlbXBsYXRlKGNvbXBpbGVkVGVtcGxhdGUsIGRhdGEsIGpRdWVyeVRlbXBsYXRlT3B0aW9ucykge1xuICAgICAgICAgICAgcmV0dXJuIGpRdWVyeVsndG1wbCddKGNvbXBpbGVkVGVtcGxhdGUsIGRhdGEsIGpRdWVyeVRlbXBsYXRlT3B0aW9ucyk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzWydyZW5kZXJUZW1wbGF0ZVNvdXJjZSddID0gZnVuY3Rpb24odGVtcGxhdGVTb3VyY2UsIGJpbmRpbmdDb250ZXh0LCBvcHRpb25zKSB7XG4gICAgICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICAgICAgICAgIGVuc3VyZUhhc1JlZmVyZW5jZWRKUXVlcnlUZW1wbGF0ZXMoKTtcblxuICAgICAgICAgICAgLy8gRW5zdXJlIHdlIGhhdmUgc3RvcmVkIGEgcHJlY29tcGlsZWQgdmVyc2lvbiBvZiB0aGlzIHRlbXBsYXRlIChkb24ndCB3YW50IHRvIHJlcGFyc2Ugb24gZXZlcnkgcmVuZGVyKVxuICAgICAgICAgICAgdmFyIHByZWNvbXBpbGVkID0gdGVtcGxhdGVTb3VyY2VbJ2RhdGEnXSgncHJlY29tcGlsZWQnKTtcbiAgICAgICAgICAgIGlmICghcHJlY29tcGlsZWQpIHtcbiAgICAgICAgICAgICAgICB2YXIgdGVtcGxhdGVUZXh0ID0gdGVtcGxhdGVTb3VyY2VbJ3RleHQnXSgpIHx8IFwiXCI7XG4gICAgICAgICAgICAgICAgLy8gV3JhcCBpbiBcIndpdGgoJHdoYXRldmVyLmtvQmluZGluZ0NvbnRleHQpIHsgLi4uIH1cIlxuICAgICAgICAgICAgICAgIHRlbXBsYXRlVGV4dCA9IFwie3trb193aXRoICRpdGVtLmtvQmluZGluZ0NvbnRleHR9fVwiICsgdGVtcGxhdGVUZXh0ICsgXCJ7ey9rb193aXRofX1cIjtcblxuICAgICAgICAgICAgICAgIHByZWNvbXBpbGVkID0galF1ZXJ5Wyd0ZW1wbGF0ZSddKG51bGwsIHRlbXBsYXRlVGV4dCk7XG4gICAgICAgICAgICAgICAgdGVtcGxhdGVTb3VyY2VbJ2RhdGEnXSgncHJlY29tcGlsZWQnLCBwcmVjb21waWxlZCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBkYXRhID0gW2JpbmRpbmdDb250ZXh0WyckZGF0YSddXTsgLy8gUHJld3JhcCB0aGUgZGF0YSBpbiBhbiBhcnJheSB0byBzdG9wIGpxdWVyeS50bXBsIGZyb20gdHJ5aW5nIHRvIHVud3JhcCBhbnkgYXJyYXlzXG4gICAgICAgICAgICB2YXIgalF1ZXJ5VGVtcGxhdGVPcHRpb25zID0galF1ZXJ5WydleHRlbmQnXSh7ICdrb0JpbmRpbmdDb250ZXh0JzogYmluZGluZ0NvbnRleHQgfSwgb3B0aW9uc1sndGVtcGxhdGVPcHRpb25zJ10pO1xuXG4gICAgICAgICAgICB2YXIgcmVzdWx0Tm9kZXMgPSBleGVjdXRlVGVtcGxhdGUocHJlY29tcGlsZWQsIGRhdGEsIGpRdWVyeVRlbXBsYXRlT3B0aW9ucyk7XG4gICAgICAgICAgICByZXN1bHROb2Rlc1snYXBwZW5kVG8nXShkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpKTsgLy8gVXNpbmcgXCJhcHBlbmRUb1wiIGZvcmNlcyBqUXVlcnkvalF1ZXJ5LnRtcGwgdG8gcGVyZm9ybSBuZWNlc3NhcnkgY2xlYW51cCB3b3JrXG5cbiAgICAgICAgICAgIGpRdWVyeVsnZnJhZ21lbnRzJ10gPSB7fTsgLy8gQ2xlYXIgalF1ZXJ5J3MgZnJhZ21lbnQgY2FjaGUgdG8gYXZvaWQgYSBtZW1vcnkgbGVhayBhZnRlciBhIGxhcmdlIG51bWJlciBvZiB0ZW1wbGF0ZSByZW5kZXJzXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0Tm9kZXM7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpc1snY3JlYXRlSmF2YVNjcmlwdEV2YWx1YXRvckJsb2NrJ10gPSBmdW5jdGlvbihzY3JpcHQpIHtcbiAgICAgICAgICAgIHJldHVybiBcInt7a29fY29kZSAoKGZ1bmN0aW9uKCkgeyByZXR1cm4gXCIgKyBzY3JpcHQgKyBcIiB9KSgpKSB9fVwiO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXNbJ2FkZFRlbXBsYXRlJ10gPSBmdW5jdGlvbih0ZW1wbGF0ZU5hbWUsIHRlbXBsYXRlTWFya3VwKSB7XG4gICAgICAgICAgICBkb2N1bWVudC53cml0ZShcIjxzY3JpcHQgdHlwZT0ndGV4dC9odG1sJyBpZD0nXCIgKyB0ZW1wbGF0ZU5hbWUgKyBcIic+XCIgKyB0ZW1wbGF0ZU1hcmt1cCArIFwiPFwiICsgXCIvc2NyaXB0PlwiKTtcbiAgICAgICAgfTtcblxuICAgICAgICBpZiAoalF1ZXJ5VG1wbFZlcnNpb24gPiAwKSB7XG4gICAgICAgICAgICBqUXVlcnlbJ3RtcGwnXVsndGFnJ11bJ2tvX2NvZGUnXSA9IHtcbiAgICAgICAgICAgICAgICBvcGVuOiBcIl9fLnB1c2goJDEgfHwgJycpO1wiXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgalF1ZXJ5Wyd0bXBsJ11bJ3RhZyddWydrb193aXRoJ10gPSB7XG4gICAgICAgICAgICAgICAgb3BlbjogXCJ3aXRoKCQxKSB7XCIsXG4gICAgICAgICAgICAgICAgY2xvc2U6IFwifSBcIlxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBrby5qcXVlcnlUbXBsVGVtcGxhdGVFbmdpbmUucHJvdG90eXBlID0gbmV3IGtvLnRlbXBsYXRlRW5naW5lKCk7XG4gICAga28uanF1ZXJ5VG1wbFRlbXBsYXRlRW5naW5lLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IGtvLmpxdWVyeVRtcGxUZW1wbGF0ZUVuZ2luZTtcblxuICAgIC8vIFVzZSB0aGlzIG9uZSBieSBkZWZhdWx0ICpvbmx5IGlmIGpxdWVyeS50bXBsIGlzIHJlZmVyZW5jZWQqXG4gICAgdmFyIGpxdWVyeVRtcGxUZW1wbGF0ZUVuZ2luZUluc3RhbmNlID0gbmV3IGtvLmpxdWVyeVRtcGxUZW1wbGF0ZUVuZ2luZSgpO1xuICAgIGlmIChqcXVlcnlUbXBsVGVtcGxhdGVFbmdpbmVJbnN0YW5jZS5qUXVlcnlUbXBsVmVyc2lvbiA+IDApXG4gICAgICAgIGtvLnNldFRlbXBsYXRlRW5naW5lKGpxdWVyeVRtcGxUZW1wbGF0ZUVuZ2luZUluc3RhbmNlKTtcblxuICAgIGtvLmV4cG9ydFN5bWJvbCgnanF1ZXJ5VG1wbFRlbXBsYXRlRW5naW5lJywga28uanF1ZXJ5VG1wbFRlbXBsYXRlRW5naW5lKTtcbn0pKCk7XG59KSk7XG59KCkpO1xufSkoKTtcbiIsIi8vIExvY2F0aW9uQmFyIG1vZHVsZSBleHRyYWN0ZWQgZnJvbSBCYWNrYm9uZS5qcyAxLjAuMFxuLy8gKGFjdHVhbGx5IGl0J3MgY29tbWl0IGY2ZmEwY2I4N2UyNmJiM2QxYjdmNDcxNDRmZDcyMGQxYWI0OGU4OGYpXG4vL1xuLy8gdGhlIGRlcGVuZGVuY3kgb24gYmFja2JvbmUsIHVuZGVyc2NvcmUgYW5kIGpxdWVyeSBoYXZlIGJlZW4gcmVtb3ZlZCB0byB0dXJuXG4vLyB0aGlzIGludG8gYSBzbWFsbCBzdGFuZGFsb25lIGxpYnJhcnkgZm9yIGhhbmRsaW5nIGJyb3dzZXIncyBoaXN0b3J5IEFQSVxuLy8gY3Jvc3MgYnJvd3NlciBhbmQgd2l0aCBhIGZhbGxiYWNrIHRvIGhhc2hjaGFuZ2UgZXZlbnRzIG9yIHBvbGxpbmcuXG5cbihmdW5jdGlvbihkZWZpbmUpIHtcbmRlZmluZShmdW5jdGlvbigpIHtcblxuICAvLyAzIGhlbHBlciBmdW5jdGlvbnMgd2UgdXNlIHRvIGF2b2lkIHB1bGxpbmcgaW4gZW50aXJlIF8gYW5kICRcbiAgZnVuY3Rpb24gZXh0ZW5kKG9iaiwgc291cmNlKSB7XG4gICAgZm9yICh2YXIgcHJvcCBpbiBzb3VyY2UpIHtcbiAgICAgIG9ialtwcm9wXSA9IHNvdXJjZVtwcm9wXTtcbiAgICB9XG4gICAgcmV0dXJuIG9iajtcbiAgfVxuICBmdW5jdGlvbiBvbihvYmosIHR5cGUsIGZuKSB7XG4gICAgaWYgKG9iai5hdHRhY2hFdmVudCkge1xuICAgICAgb2JqWydlJyt0eXBlK2ZuXSA9IGZuO1xuICAgICAgb2JqW3R5cGUrZm5dID0gZnVuY3Rpb24oKXsgb2JqWydlJyt0eXBlK2ZuXSggd2luZG93LmV2ZW50ICk7IH07XG4gICAgICBvYmouYXR0YWNoRXZlbnQoICdvbicrdHlwZSwgb2JqW3R5cGUrZm5dICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG9iai5hZGRFdmVudExpc3RlbmVyKCB0eXBlLCBmbiwgZmFsc2UgKTtcbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gb2ZmKG9iaiwgdHlwZSwgZm4pIHtcbiAgICBpZiAob2JqLmRldGFjaEV2ZW50KSB7XG4gICAgICBvYmouZGV0YWNoRXZlbnQoJ29uJyt0eXBlLCBvYmpbdHlwZStmbl0pO1xuICAgICAgb2JqW3R5cGUrZm5dID0gbnVsbDtcbiAgICB9IGVsc2Uge1xuICAgICAgb2JqLnJlbW92ZUV2ZW50TGlzdGVuZXIodHlwZSwgZm4sIGZhbHNlKTtcbiAgICB9XG4gIH1cblxuXG5cblxuXG4gIC8vIHRoaXMgaXMgbW9zdGx5IG9yaWdpbmFsIGNvZGUgd2l0aCBtaW5vciBtb2RpZmljYXRpb25zLCBtb3N0eWxlIHRvIGF2b2lkXG4gIC8vIGRlcGVuZGVuY3kgb24gM3JkIHBhcnR5IGxpYnJhcmllcyArIHJlbmFtaW5nIEJhY2tib25lLkhpc3RvcnkgLT4gTG9jYXRpb25CYXJcbiAgLy9cbiAgLy8gQmFja2JvbmUuSGlzdG9yeVxuICAvLyAtLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gSGFuZGxlcyBjcm9zcy1icm93c2VyIGhpc3RvcnkgbWFuYWdlbWVudCwgYmFzZWQgb24gZWl0aGVyXG4gIC8vIFtwdXNoU3RhdGVdKGh0dHA6Ly9kaXZlaW50b2h0bWw1LmluZm8vaGlzdG9yeS5odG1sKSBhbmQgcmVhbCBVUkxzLCBvclxuICAvLyBbb25oYXNoY2hhbmdlXShodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL0RPTS93aW5kb3cub25oYXNoY2hhbmdlKVxuICAvLyBhbmQgVVJMIGZyYWdtZW50cy4gSWYgdGhlIGJyb3dzZXIgc3VwcG9ydHMgbmVpdGhlciAob2xkIElFLCBuYXRjaCksXG4gIC8vIGZhbGxzIGJhY2sgdG8gcG9sbGluZy5cbiAgdmFyIExvY2F0aW9uQmFyID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5oYW5kbGVycyA9IFtdO1xuXG4gICAgLy8gTU9ESUZJQ0FUSU9OIE9GIE9SSUdJTkFMIEJBQ0tCT05FLkhJU1RPUllcbiAgICAvL1xuICAgIC8vIF8uYmluZEFsbCh0aGlzLCAnY2hlY2tVcmwnKTtcbiAgICAvL1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB2YXIgY2hlY2tVcmwgPSB0aGlzLmNoZWNrVXJsO1xuICAgIHRoaXMuY2hlY2tVcmwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBjaGVja1VybC5hcHBseShzZWxmLCBhcmd1bWVudHMpO1xuICAgIH07XG5cbiAgICAvLyBFbnN1cmUgdGhhdCBgTG9jYXRpb25CYXJgIGNhbiBiZSB1c2VkIG91dHNpZGUgb2YgdGhlIGJyb3dzZXIuXG4gICAgaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICB0aGlzLmxvY2F0aW9uID0gd2luZG93LmxvY2F0aW9uO1xuICAgICAgdGhpcy5oaXN0b3J5ID0gd2luZG93Lmhpc3Rvcnk7XG4gICAgfVxuICB9O1xuXG4gIC8vIENhY2hlZCByZWdleCBmb3Igc3RyaXBwaW5nIGEgbGVhZGluZyBoYXNoL3NsYXNoIGFuZCB0cmFpbGluZyBzcGFjZS5cbiAgdmFyIHJvdXRlU3RyaXBwZXIgPSAvXlsjXFwvXXxcXHMrJC9nO1xuXG4gIC8vIENhY2hlZCByZWdleCBmb3Igc3RyaXBwaW5nIGxlYWRpbmcgYW5kIHRyYWlsaW5nIHNsYXNoZXMuXG4gIHZhciByb290U3RyaXBwZXIgPSAvXlxcLyt8XFwvKyQvZztcblxuICAvLyBDYWNoZWQgcmVnZXggZm9yIGRldGVjdGluZyBNU0lFLlxuICB2YXIgaXNFeHBsb3JlciA9IC9tc2llIFtcXHcuXSsvO1xuXG4gIC8vIENhY2hlZCByZWdleCBmb3IgcmVtb3ZpbmcgYSB0cmFpbGluZyBzbGFzaC5cbiAgdmFyIHRyYWlsaW5nU2xhc2ggPSAvXFwvJC87XG5cbiAgLy8gQ2FjaGVkIHJlZ2V4IGZvciBzdHJpcHBpbmcgdXJscyBvZiBoYXNoIGFuZCBxdWVyeS5cbiAgdmFyIHBhdGhTdHJpcHBlciA9IC9bPyNdLiokLztcblxuICAvLyBIYXMgdGhlIGhpc3RvcnkgaGFuZGxpbmcgYWxyZWFkeSBiZWVuIHN0YXJ0ZWQ/XG4gIExvY2F0aW9uQmFyLnN0YXJ0ZWQgPSBmYWxzZTtcblxuICAvLyBTZXQgdXAgYWxsIGluaGVyaXRhYmxlICoqTG9jYXRpb25CYXIqKiBwcm9wZXJ0aWVzIGFuZCBtZXRob2RzLlxuICBleHRlbmQoTG9jYXRpb25CYXIucHJvdG90eXBlLCB7XG5cbiAgICAvLyBUaGUgZGVmYXVsdCBpbnRlcnZhbCB0byBwb2xsIGZvciBoYXNoIGNoYW5nZXMsIGlmIG5lY2Vzc2FyeSwgaXNcbiAgICAvLyB0d2VudHkgdGltZXMgYSBzZWNvbmQuXG4gICAgaW50ZXJ2YWw6IDUwLFxuXG4gICAgLy8gR2V0cyB0aGUgdHJ1ZSBoYXNoIHZhbHVlLiBDYW5ub3QgdXNlIGxvY2F0aW9uLmhhc2ggZGlyZWN0bHkgZHVlIHRvIGJ1Z1xuICAgIC8vIGluIEZpcmVmb3ggd2hlcmUgbG9jYXRpb24uaGFzaCB3aWxsIGFsd2F5cyBiZSBkZWNvZGVkLlxuICAgIGdldEhhc2g6IGZ1bmN0aW9uKHdpbmRvdykge1xuICAgICAgdmFyIG1hdGNoID0gKHdpbmRvdyB8fCB0aGlzKS5sb2NhdGlvbi5ocmVmLm1hdGNoKC8jKC4qKSQvKTtcbiAgICAgIHJldHVybiBtYXRjaCA/IG1hdGNoWzFdIDogJyc7XG4gICAgfSxcblxuICAgIC8vIEdldCB0aGUgY3Jvc3MtYnJvd3NlciBub3JtYWxpemVkIFVSTCBmcmFnbWVudCwgZWl0aGVyIGZyb20gdGhlIFVSTCxcbiAgICAvLyB0aGUgaGFzaCwgb3IgdGhlIG92ZXJyaWRlLlxuICAgIGdldEZyYWdtZW50OiBmdW5jdGlvbihmcmFnbWVudCwgZm9yY2VQdXNoU3RhdGUpIHtcbiAgICAgIGlmIChmcmFnbWVudCA9PSBudWxsKSB7XG4gICAgICAgIGlmICh0aGlzLl9oYXNQdXNoU3RhdGUgfHwgIXRoaXMuX3dhbnRzSGFzaENoYW5nZSB8fCBmb3JjZVB1c2hTdGF0ZSkge1xuICAgICAgICAgIGZyYWdtZW50ID0gdGhpcy5sb2NhdGlvbi5wYXRobmFtZTtcbiAgICAgICAgICB2YXIgcm9vdCA9IHRoaXMucm9vdC5yZXBsYWNlKHRyYWlsaW5nU2xhc2gsICcnKTtcbiAgICAgICAgICBpZiAoIWZyYWdtZW50LmluZGV4T2Yocm9vdCkpIGZyYWdtZW50ID0gZnJhZ21lbnQuc2xpY2Uocm9vdC5sZW5ndGgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGZyYWdtZW50ID0gdGhpcy5nZXRIYXNoKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBmcmFnbWVudC5yZXBsYWNlKHJvdXRlU3RyaXBwZXIsICcnKTtcbiAgICB9LFxuXG4gICAgLy8gU3RhcnQgdGhlIGhhc2ggY2hhbmdlIGhhbmRsaW5nLCByZXR1cm5pbmcgYHRydWVgIGlmIHRoZSBjdXJyZW50IFVSTCBtYXRjaGVzXG4gICAgLy8gYW4gZXhpc3Rpbmcgcm91dGUsIGFuZCBgZmFsc2VgIG90aGVyd2lzZS5cbiAgICBzdGFydDogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgaWYgKExvY2F0aW9uQmFyLnN0YXJ0ZWQpIHRocm93IG5ldyBFcnJvcihcIkxvY2F0aW9uQmFyIGhhcyBhbHJlYWR5IGJlZW4gc3RhcnRlZFwiKTtcbiAgICAgIExvY2F0aW9uQmFyLnN0YXJ0ZWQgPSB0cnVlO1xuXG4gICAgICAvLyBGaWd1cmUgb3V0IHRoZSBpbml0aWFsIGNvbmZpZ3VyYXRpb24uIERvIHdlIG5lZWQgYW4gaWZyYW1lP1xuICAgICAgLy8gSXMgcHVzaFN0YXRlIGRlc2lyZWQgLi4uIGlzIGl0IGF2YWlsYWJsZT9cbiAgICAgIHRoaXMub3B0aW9ucyAgICAgICAgICA9IGV4dGVuZCh7cm9vdDogJy8nfSwgb3B0aW9ucyk7XG4gICAgICB0aGlzLnJvb3QgICAgICAgICAgICAgPSB0aGlzLm9wdGlvbnMucm9vdDtcbiAgICAgIHRoaXMuX3dhbnRzSGFzaENoYW5nZSA9IHRoaXMub3B0aW9ucy5oYXNoQ2hhbmdlICE9PSBmYWxzZTtcbiAgICAgIHRoaXMuX3dhbnRzUHVzaFN0YXRlICA9ICEhdGhpcy5vcHRpb25zLnB1c2hTdGF0ZTtcbiAgICAgIHRoaXMuX2hhc1B1c2hTdGF0ZSAgICA9ICEhKHRoaXMub3B0aW9ucy5wdXNoU3RhdGUgJiYgdGhpcy5oaXN0b3J5ICYmIHRoaXMuaGlzdG9yeS5wdXNoU3RhdGUpO1xuICAgICAgdmFyIGZyYWdtZW50ICAgICAgICAgID0gdGhpcy5nZXRGcmFnbWVudCgpO1xuICAgICAgdmFyIGRvY01vZGUgICAgICAgICAgID0gZG9jdW1lbnQuZG9jdW1lbnRNb2RlO1xuICAgICAgdmFyIG9sZElFICAgICAgICAgICAgID0gKGlzRXhwbG9yZXIuZXhlYyhuYXZpZ2F0b3IudXNlckFnZW50LnRvTG93ZXJDYXNlKCkpICYmICghZG9jTW9kZSB8fCBkb2NNb2RlIDw9IDcpKTtcblxuICAgICAgLy8gTm9ybWFsaXplIHJvb3QgdG8gYWx3YXlzIGluY2x1ZGUgYSBsZWFkaW5nIGFuZCB0cmFpbGluZyBzbGFzaC5cbiAgICAgIHRoaXMucm9vdCA9ICgnLycgKyB0aGlzLnJvb3QgKyAnLycpLnJlcGxhY2Uocm9vdFN0cmlwcGVyLCAnLycpO1xuXG4gICAgICBpZiAob2xkSUUgJiYgdGhpcy5fd2FudHNIYXNoQ2hhbmdlKSB7XG4gICAgICAgIC8vIE1PRElGSUNBVElPTiBPRiBPUklHSU5BTCBCQUNLQk9ORS5ISVNUT1JZXG4gICAgICAgIC8vXG4gICAgICAgIC8vIHRoaXMuaWZyYW1lID0gJCgnPGlmcmFtZSBzcmM9XCJqYXZhc2NyaXB0OjBcIiB0YWJpbmRleD1cIi0xXCIgLz4nKS5oaWRlKCkuYXBwZW5kVG8oJ2JvZHknKVswXS5jb250ZW50V2luZG93O1xuICAgICAgICAvL1xuICAgICAgICB0aGlzLmlmcmFtZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJpZnJhbWVcIik7XG4gICAgICAgIHRoaXMuaWZyYW1lLnNldEF0dHJpYnV0ZShcInNyY1wiLCBcImphdmFzY3JpcHQ6MFwiKTtcbiAgICAgICAgdGhpcy5pZnJhbWUuc2V0QXR0cmlidXRlKFwidGFiaW5kZXhcIiwgLTEpO1xuICAgICAgICB0aGlzLmlmcmFtZS5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQodGhpcy5pZnJhbWUpO1xuICAgICAgICB0aGlzLmlmcmFtZSA9IHRoaXMuaWZyYW1lLmNvbnRlbnRXaW5kb3c7XG4gICAgICAgIHRoaXMubmF2aWdhdGUoZnJhZ21lbnQpO1xuICAgICAgfVxuXG4gICAgICAvLyBEZXBlbmRpbmcgb24gd2hldGhlciB3ZSdyZSB1c2luZyBwdXNoU3RhdGUgb3IgaGFzaGVzLCBhbmQgd2hldGhlclxuICAgICAgLy8gJ29uaGFzaGNoYW5nZScgaXMgc3VwcG9ydGVkLCBkZXRlcm1pbmUgaG93IHdlIGNoZWNrIHRoZSBVUkwgc3RhdGUuXG4gICAgICBpZiAodGhpcy5faGFzUHVzaFN0YXRlKSB7XG4gICAgICAgIG9uKHdpbmRvdywgJ3BvcHN0YXRlJywgdGhpcy5jaGVja1VybCk7XG4gICAgICB9IGVsc2UgaWYgKHRoaXMuX3dhbnRzSGFzaENoYW5nZSAmJiAoJ29uaGFzaGNoYW5nZScgaW4gd2luZG93KSAmJiAhb2xkSUUpIHtcbiAgICAgICAgb24od2luZG93LCAnaGFzaGNoYW5nZScsIHRoaXMuY2hlY2tVcmwpO1xuICAgICAgfSBlbHNlIGlmICh0aGlzLl93YW50c0hhc2hDaGFuZ2UpIHtcbiAgICAgICAgdGhpcy5fY2hlY2tVcmxJbnRlcnZhbCA9IHNldEludGVydmFsKHRoaXMuY2hlY2tVcmwsIHRoaXMuaW50ZXJ2YWwpO1xuICAgICAgfVxuXG4gICAgICAvLyBEZXRlcm1pbmUgaWYgd2UgbmVlZCB0byBjaGFuZ2UgdGhlIGJhc2UgdXJsLCBmb3IgYSBwdXNoU3RhdGUgbGlua1xuICAgICAgLy8gb3BlbmVkIGJ5IGEgbm9uLXB1c2hTdGF0ZSBicm93c2VyLlxuICAgICAgdGhpcy5mcmFnbWVudCA9IGZyYWdtZW50O1xuICAgICAgdmFyIGxvYyA9IHRoaXMubG9jYXRpb247XG4gICAgICB2YXIgYXRSb290ID0gbG9jLnBhdGhuYW1lLnJlcGxhY2UoL1teXFwvXSQvLCAnJCYvJykgPT09IHRoaXMucm9vdDtcblxuICAgICAgLy8gVHJhbnNpdGlvbiBmcm9tIGhhc2hDaGFuZ2UgdG8gcHVzaFN0YXRlIG9yIHZpY2UgdmVyc2EgaWYgYm90aCBhcmVcbiAgICAgIC8vIHJlcXVlc3RlZC5cbiAgICAgIGlmICh0aGlzLl93YW50c0hhc2hDaGFuZ2UgJiYgdGhpcy5fd2FudHNQdXNoU3RhdGUpIHtcblxuICAgICAgICAvLyBJZiB3ZSd2ZSBzdGFydGVkIG9mZiB3aXRoIGEgcm91dGUgZnJvbSBhIGBwdXNoU3RhdGVgLWVuYWJsZWRcbiAgICAgICAgLy8gYnJvd3NlciwgYnV0IHdlJ3JlIGN1cnJlbnRseSBpbiBhIGJyb3dzZXIgdGhhdCBkb2Vzbid0IHN1cHBvcnQgaXQuLi5cbiAgICAgICAgaWYgKCF0aGlzLl9oYXNQdXNoU3RhdGUgJiYgIWF0Um9vdCkge1xuICAgICAgICAgIHRoaXMuZnJhZ21lbnQgPSB0aGlzLmdldEZyYWdtZW50KG51bGwsIHRydWUpO1xuICAgICAgICAgIHRoaXMubG9jYXRpb24ucmVwbGFjZSh0aGlzLnJvb3QgKyB0aGlzLmxvY2F0aW9uLnNlYXJjaCArICcjJyArIHRoaXMuZnJhZ21lbnQpO1xuICAgICAgICAgIC8vIFJldHVybiBpbW1lZGlhdGVseSBhcyBicm93c2VyIHdpbGwgZG8gcmVkaXJlY3QgdG8gbmV3IHVybFxuICAgICAgICAgIHJldHVybiB0cnVlO1xuXG4gICAgICAgIC8vIE9yIGlmIHdlJ3ZlIHN0YXJ0ZWQgb3V0IHdpdGggYSBoYXNoLWJhc2VkIHJvdXRlLCBidXQgd2UncmUgY3VycmVudGx5XG4gICAgICAgIC8vIGluIGEgYnJvd3NlciB3aGVyZSBpdCBjb3VsZCBiZSBgcHVzaFN0YXRlYC1iYXNlZCBpbnN0ZWFkLi4uXG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5faGFzUHVzaFN0YXRlICYmIGF0Um9vdCAmJiBsb2MuaGFzaCkge1xuICAgICAgICAgIHRoaXMuZnJhZ21lbnQgPSB0aGlzLmdldEhhc2goKS5yZXBsYWNlKHJvdXRlU3RyaXBwZXIsICcnKTtcbiAgICAgICAgICB0aGlzLmhpc3RvcnkucmVwbGFjZVN0YXRlKHt9LCBkb2N1bWVudC50aXRsZSwgdGhpcy5yb290ICsgdGhpcy5mcmFnbWVudCArIGxvYy5zZWFyY2gpO1xuICAgICAgICB9XG5cbiAgICAgIH1cblxuICAgICAgaWYgKCF0aGlzLm9wdGlvbnMuc2lsZW50KSByZXR1cm4gdGhpcy5sb2FkVXJsKCk7XG4gICAgfSxcblxuICAgIC8vIERpc2FibGUgQmFja2JvbmUuaGlzdG9yeSwgcGVyaGFwcyB0ZW1wb3JhcmlseS4gTm90IHVzZWZ1bCBpbiBhIHJlYWwgYXBwLFxuICAgIC8vIGJ1dCBwb3NzaWJseSB1c2VmdWwgZm9yIHVuaXQgdGVzdGluZyBSb3V0ZXJzLlxuICAgIHN0b3A6IGZ1bmN0aW9uKCkge1xuICAgICAgb2ZmKHdpbmRvdywgJ3BvcHN0YXRlJywgdGhpcy5jaGVja1VybCk7XG4gICAgICBvZmYod2luZG93LCAnaGFzaGNoYW5nZScsIHRoaXMuY2hlY2tVcmwpO1xuICAgICAgY2xlYXJJbnRlcnZhbCh0aGlzLl9jaGVja1VybEludGVydmFsKTtcbiAgICAgIExvY2F0aW9uQmFyLnN0YXJ0ZWQgPSBmYWxzZTtcbiAgICB9LFxuXG4gICAgLy8gQWRkIGEgcm91dGUgdG8gYmUgdGVzdGVkIHdoZW4gdGhlIGZyYWdtZW50IGNoYW5nZXMuIFJvdXRlcyBhZGRlZCBsYXRlclxuICAgIC8vIG1heSBvdmVycmlkZSBwcmV2aW91cyByb3V0ZXMuXG4gICAgcm91dGU6IGZ1bmN0aW9uKHJvdXRlLCBjYWxsYmFjaykge1xuICAgICAgdGhpcy5oYW5kbGVycy51bnNoaWZ0KHtyb3V0ZTogcm91dGUsIGNhbGxiYWNrOiBjYWxsYmFja30pO1xuICAgIH0sXG5cbiAgICAvLyBDaGVja3MgdGhlIGN1cnJlbnQgVVJMIHRvIHNlZSBpZiBpdCBoYXMgY2hhbmdlZCwgYW5kIGlmIGl0IGhhcyxcbiAgICAvLyBjYWxscyBgbG9hZFVybGAsIG5vcm1hbGl6aW5nIGFjcm9zcyB0aGUgaGlkZGVuIGlmcmFtZS5cbiAgICBjaGVja1VybDogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgY3VycmVudCA9IHRoaXMuZ2V0RnJhZ21lbnQoKTtcbiAgICAgIGlmIChjdXJyZW50ID09PSB0aGlzLmZyYWdtZW50ICYmIHRoaXMuaWZyYW1lKSB7XG4gICAgICAgIGN1cnJlbnQgPSB0aGlzLmdldEZyYWdtZW50KHRoaXMuZ2V0SGFzaCh0aGlzLmlmcmFtZSkpO1xuICAgICAgfVxuICAgICAgaWYgKGN1cnJlbnQgPT09IHRoaXMuZnJhZ21lbnQpIHJldHVybiBmYWxzZTtcbiAgICAgIGlmICh0aGlzLmlmcmFtZSkgdGhpcy5uYXZpZ2F0ZShjdXJyZW50KTtcbiAgICAgIHRoaXMubG9hZFVybCgpO1xuICAgIH0sXG5cbiAgICAvLyBBdHRlbXB0IHRvIGxvYWQgdGhlIGN1cnJlbnQgVVJMIGZyYWdtZW50LiBJZiBhIHJvdXRlIHN1Y2NlZWRzIHdpdGggYVxuICAgIC8vIG1hdGNoLCByZXR1cm5zIGB0cnVlYC4gSWYgbm8gZGVmaW5lZCByb3V0ZXMgbWF0Y2hlcyB0aGUgZnJhZ21lbnQsXG4gICAgLy8gcmV0dXJucyBgZmFsc2VgLlxuICAgIGxvYWRVcmw6IGZ1bmN0aW9uKGZyYWdtZW50KSB7XG4gICAgICAvLyBNT0RJRklDQVRJT04gT0YgT1JJR0lOQUwgQkFDS0JPTkUuSElTVE9SWVxuICAgICAgLy9cbiAgICAgIC8vIHJldHVybiBfLmFueSh0aGlzLmhhbmRsZXJzLCBmdW5jdGlvbihoYW5kbGVyKSB7XG4gICAgICAvLyAgIGlmIChoYW5kbGVyLnJvdXRlLnRlc3QoZnJhZ21lbnQpKSB7XG4gICAgICAvLyAgICAgaGFuZGxlci5jYWxsYmFjayhmcmFnbWVudCk7XG4gICAgICAvLyAgICAgcmV0dXJuIHRydWU7XG4gICAgICAvLyAgIH1cbiAgICAgIC8vIH0pO1xuICAgICAgLy9cbiAgICAgIGZyYWdtZW50ID0gdGhpcy5mcmFnbWVudCA9IHRoaXMuZ2V0RnJhZ21lbnQoZnJhZ21lbnQpO1xuICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSB0aGlzLmhhbmRsZXJzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICB2YXIgaGFuZGxlciA9IHRoaXMuaGFuZGxlcnNbaV07XG4gICAgICAgIGlmIChoYW5kbGVyLnJvdXRlLnRlc3QoZnJhZ21lbnQpKSB7XG4gICAgICAgICAgaGFuZGxlci5jYWxsYmFjayhmcmFnbWVudCk7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9LFxuXG4gICAgLy8gU2F2ZSBhIGZyYWdtZW50IGludG8gdGhlIGhhc2ggaGlzdG9yeSwgb3IgcmVwbGFjZSB0aGUgVVJMIHN0YXRlIGlmIHRoZVxuICAgIC8vICdyZXBsYWNlJyBvcHRpb24gaXMgcGFzc2VkLiBZb3UgYXJlIHJlc3BvbnNpYmxlIGZvciBwcm9wZXJseSBVUkwtZW5jb2RpbmdcbiAgICAvLyB0aGUgZnJhZ21lbnQgaW4gYWR2YW5jZS5cbiAgICAvL1xuICAgIC8vIFRoZSBvcHRpb25zIG9iamVjdCBjYW4gY29udGFpbiBgdHJpZ2dlcjogdHJ1ZWAgaWYgeW91IHdpc2ggdG8gaGF2ZSB0aGVcbiAgICAvLyByb3V0ZSBjYWxsYmFjayBiZSBmaXJlZCAobm90IHVzdWFsbHkgZGVzaXJhYmxlKSwgb3IgYHJlcGxhY2U6IHRydWVgLCBpZlxuICAgIC8vIHlvdSB3aXNoIHRvIG1vZGlmeSB0aGUgY3VycmVudCBVUkwgd2l0aG91dCBhZGRpbmcgYW4gZW50cnkgdG8gdGhlIGhpc3RvcnkuXG4gICAgbmF2aWdhdGU6IGZ1bmN0aW9uKGZyYWdtZW50LCBvcHRpb25zKSB7XG4gICAgICBpZiAoIUxvY2F0aW9uQmFyLnN0YXJ0ZWQpIHJldHVybiBmYWxzZTtcbiAgICAgIGlmICghb3B0aW9ucyB8fCBvcHRpb25zID09PSB0cnVlKSBvcHRpb25zID0ge3RyaWdnZXI6ICEhb3B0aW9uc307XG5cbiAgICAgIHZhciB1cmwgPSB0aGlzLnJvb3QgKyAoZnJhZ21lbnQgPSB0aGlzLmdldEZyYWdtZW50KGZyYWdtZW50IHx8ICcnKSk7XG5cbiAgICAgIC8vIFN0cmlwIHRoZSBmcmFnbWVudCBvZiB0aGUgcXVlcnkgYW5kIGhhc2ggZm9yIG1hdGNoaW5nLlxuICAgICAgZnJhZ21lbnQgPSBmcmFnbWVudC5yZXBsYWNlKHBhdGhTdHJpcHBlciwgJycpO1xuXG4gICAgICBpZiAodGhpcy5mcmFnbWVudCA9PT0gZnJhZ21lbnQpIHJldHVybjtcbiAgICAgIHRoaXMuZnJhZ21lbnQgPSBmcmFnbWVudDtcblxuICAgICAgLy8gRG9uJ3QgaW5jbHVkZSBhIHRyYWlsaW5nIHNsYXNoIG9uIHRoZSByb290LlxuICAgICAgaWYgKGZyYWdtZW50ID09PSAnJyAmJiB1cmwgIT09ICcvJykgdXJsID0gdXJsLnNsaWNlKDAsIC0xKTtcblxuICAgICAgLy8gSWYgcHVzaFN0YXRlIGlzIGF2YWlsYWJsZSwgd2UgdXNlIGl0IHRvIHNldCB0aGUgZnJhZ21lbnQgYXMgYSByZWFsIFVSTC5cbiAgICAgIGlmICh0aGlzLl9oYXNQdXNoU3RhdGUpIHtcbiAgICAgICAgdGhpcy5oaXN0b3J5W29wdGlvbnMucmVwbGFjZSA/ICdyZXBsYWNlU3RhdGUnIDogJ3B1c2hTdGF0ZSddKHt9LCBkb2N1bWVudC50aXRsZSwgdXJsKTtcblxuICAgICAgLy8gSWYgaGFzaCBjaGFuZ2VzIGhhdmVuJ3QgYmVlbiBleHBsaWNpdGx5IGRpc2FibGVkLCB1cGRhdGUgdGhlIGhhc2hcbiAgICAgIC8vIGZyYWdtZW50IHRvIHN0b3JlIGhpc3RvcnkuXG4gICAgICB9IGVsc2UgaWYgKHRoaXMuX3dhbnRzSGFzaENoYW5nZSkge1xuICAgICAgICB0aGlzLl91cGRhdGVIYXNoKHRoaXMubG9jYXRpb24sIGZyYWdtZW50LCBvcHRpb25zLnJlcGxhY2UpO1xuICAgICAgICBpZiAodGhpcy5pZnJhbWUgJiYgKGZyYWdtZW50ICE9PSB0aGlzLmdldEZyYWdtZW50KHRoaXMuZ2V0SGFzaCh0aGlzLmlmcmFtZSkpKSkge1xuICAgICAgICAgIC8vIE9wZW5pbmcgYW5kIGNsb3NpbmcgdGhlIGlmcmFtZSB0cmlja3MgSUU3IGFuZCBlYXJsaWVyIHRvIHB1c2ggYVxuICAgICAgICAgIC8vIGhpc3RvcnkgZW50cnkgb24gaGFzaC10YWcgY2hhbmdlLiAgV2hlbiByZXBsYWNlIGlzIHRydWUsIHdlIGRvbid0XG4gICAgICAgICAgLy8gd2FudCB0aGlzLlxuICAgICAgICAgIGlmKCFvcHRpb25zLnJlcGxhY2UpIHRoaXMuaWZyYW1lLmRvY3VtZW50Lm9wZW4oKS5jbG9zZSgpO1xuICAgICAgICAgIHRoaXMuX3VwZGF0ZUhhc2godGhpcy5pZnJhbWUubG9jYXRpb24sIGZyYWdtZW50LCBvcHRpb25zLnJlcGxhY2UpO1xuICAgICAgICB9XG5cbiAgICAgIC8vIElmIHlvdSd2ZSB0b2xkIHVzIHRoYXQgeW91IGV4cGxpY2l0bHkgZG9uJ3Qgd2FudCBmYWxsYmFjayBoYXNoY2hhbmdlLVxuICAgICAgLy8gYmFzZWQgaGlzdG9yeSwgdGhlbiBgbmF2aWdhdGVgIGJlY29tZXMgYSBwYWdlIHJlZnJlc2guXG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdGhpcy5sb2NhdGlvbi5hc3NpZ24odXJsKTtcbiAgICAgIH1cbiAgICAgIGlmIChvcHRpb25zLnRyaWdnZXIpIHJldHVybiB0aGlzLmxvYWRVcmwoZnJhZ21lbnQpO1xuICAgIH0sXG5cbiAgICAvLyBVcGRhdGUgdGhlIGhhc2ggbG9jYXRpb24sIGVpdGhlciByZXBsYWNpbmcgdGhlIGN1cnJlbnQgZW50cnksIG9yIGFkZGluZ1xuICAgIC8vIGEgbmV3IG9uZSB0byB0aGUgYnJvd3NlciBoaXN0b3J5LlxuICAgIF91cGRhdGVIYXNoOiBmdW5jdGlvbihsb2NhdGlvbiwgZnJhZ21lbnQsIHJlcGxhY2UpIHtcbiAgICAgIGlmIChyZXBsYWNlKSB7XG4gICAgICAgIHZhciBocmVmID0gbG9jYXRpb24uaHJlZi5yZXBsYWNlKC8oamF2YXNjcmlwdDp8IykuKiQvLCAnJyk7XG4gICAgICAgIGxvY2F0aW9uLnJlcGxhY2UoaHJlZiArICcjJyArIGZyYWdtZW50KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFNvbWUgYnJvd3NlcnMgcmVxdWlyZSB0aGF0IGBoYXNoYCBjb250YWlucyBhIGxlYWRpbmcgIy5cbiAgICAgICAgbG9jYXRpb24uaGFzaCA9ICcjJyArIGZyYWdtZW50O1xuICAgICAgfVxuICAgIH1cblxuICB9KTtcblxuXG5cbiAgLy8gYWRkIHNvbWUgZmVhdHVyZXMgdG8gTG9jYXRpb25CYXJcblxuICAvLyBhIG1vcmUgaW50dWl0aXZlIGFsaWFzIGZvciBuYXZpZ2F0ZVxuICBMb2NhdGlvbkJhci5wcm90b3R5cGUudXBkYXRlID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMubmF2aWdhdGUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfTtcblxuICAvLyBhIGdlbmVyaWMgY2FsbGJhY2sgZm9yIGFueSBjaGFuZ2VzXG4gIExvY2F0aW9uQmFyLnByb3RvdHlwZS5vbkNoYW5nZSA9IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgIHRoaXMucm91dGUoL14oLio/KSQvLCBjYWxsYmFjayk7XG4gIH07XG5cbiAgLy8gY2hlY2tzIGlmIHRoZSBicm93c2VyIGhhcyBwdXNoc3RhdGUgc3VwcG9ydFxuICBMb2NhdGlvbkJhci5wcm90b3R5cGUuaGFzUHVzaFN0YXRlID0gZnVuY3Rpb24gKCkge1xuICAgIGlmICghTG9jYXRpb25CYXIuc3RhcnRlZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwib25seSBhdmFpbGFibGUgYWZ0ZXIgbG9jYXRpb25CYXIuc3RhcnQoKVwiKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX2hhc1B1c2hTdGF0ZTtcbiAgfTtcblxuXG5cblxuXG5cbiAgLy8gZXhwb3J0XG4gIHJldHVybiBMb2NhdGlvbkJhcjtcbn0pO1xufSkodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kID8gZGVmaW5lIDogZnVuY3Rpb24gKGZhY3RvcnkpIHsgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KHJlcXVpcmUpOyB9KTsiLCIvKiFcbiAqIG11c3RhY2hlLmpzIC0gTG9naWMtbGVzcyB7e211c3RhY2hlfX0gdGVtcGxhdGVzIHdpdGggSmF2YVNjcmlwdFxuICogaHR0cDovL2dpdGh1Yi5jb20vamFubC9tdXN0YWNoZS5qc1xuICovXG5cbi8qZ2xvYmFsIGRlZmluZTogZmFsc2UqL1xuXG4oZnVuY3Rpb24gKHJvb3QsIGZhY3RvcnkpIHtcbiAgaWYgKHR5cGVvZiBleHBvcnRzID09PSBcIm9iamVjdFwiICYmIGV4cG9ydHMpIHtcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3Rvcnk7IC8vIENvbW1vbkpTXG4gIH0gZWxzZSBpZiAodHlwZW9mIGRlZmluZSA9PT0gXCJmdW5jdGlvblwiICYmIGRlZmluZS5hbWQpIHtcbiAgICBkZWZpbmUoZmFjdG9yeSk7IC8vIEFNRFxuICB9IGVsc2Uge1xuICAgIHJvb3QuTXVzdGFjaGUgPSBmYWN0b3J5OyAvLyA8c2NyaXB0PlxuICB9XG59KHRoaXMsIChmdW5jdGlvbiAoKSB7XG5cbiAgdmFyIGV4cG9ydHMgPSB7fTtcblxuICBleHBvcnRzLm5hbWUgPSBcIm11c3RhY2hlLmpzXCI7XG4gIGV4cG9ydHMudmVyc2lvbiA9IFwiMC43LjJcIjtcbiAgZXhwb3J0cy50YWdzID0gW1wie3tcIiwgXCJ9fVwiXTtcblxuICBleHBvcnRzLlNjYW5uZXIgPSBTY2FubmVyO1xuICBleHBvcnRzLkNvbnRleHQgPSBDb250ZXh0O1xuICBleHBvcnRzLldyaXRlciA9IFdyaXRlcjtcblxuICB2YXIgd2hpdGVSZSA9IC9cXHMqLztcbiAgdmFyIHNwYWNlUmUgPSAvXFxzKy87XG4gIHZhciBub25TcGFjZVJlID0gL1xcUy87XG4gIHZhciBlcVJlID0gL1xccyo9LztcbiAgdmFyIGN1cmx5UmUgPSAvXFxzKlxcfS87XG4gIHZhciB0YWdSZSA9IC8jfFxcXnxcXC98PnxcXHt8Jnw9fCEvO1xuXG4gIC8vIFdvcmthcm91bmQgZm9yIGh0dHBzOi8vaXNzdWVzLmFwYWNoZS5vcmcvamlyYS9icm93c2UvQ09VQ0hEQi01NzdcbiAgLy8gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9qYW5sL211c3RhY2hlLmpzL2lzc3Vlcy8xODlcbiAgZnVuY3Rpb24gdGVzdFJlKHJlLCBzdHJpbmcpIHtcbiAgICByZXR1cm4gUmVnRXhwLnByb3RvdHlwZS50ZXN0LmNhbGwocmUsIHN0cmluZyk7XG4gIH1cblxuICBmdW5jdGlvbiBpc1doaXRlc3BhY2Uoc3RyaW5nKSB7XG4gICAgcmV0dXJuICF0ZXN0UmUobm9uU3BhY2VSZSwgc3RyaW5nKTtcbiAgfVxuXG4gIHZhciBpc0FycmF5ID0gQXJyYXkuaXNBcnJheSB8fCBmdW5jdGlvbiAob2JqKSB7XG4gICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmopID09PSBcIltvYmplY3QgQXJyYXldXCI7XG4gIH07XG5cbiAgZnVuY3Rpb24gZXNjYXBlUmUoc3RyaW5nKSB7XG4gICAgcmV0dXJuIHN0cmluZy5yZXBsYWNlKC9bXFwtXFxbXFxde30oKSorPy4sXFxcXFxcXiR8I1xcc10vZywgXCJcXFxcJCZcIik7XG4gIH1cblxuICB2YXIgZW50aXR5TWFwID0ge1xuICAgIFwiJlwiOiBcIiZhbXA7XCIsXG4gICAgXCI8XCI6IFwiJmx0O1wiLFxuICAgIFwiPlwiOiBcIiZndDtcIixcbiAgICAnXCInOiAnJnF1b3Q7JyxcbiAgICBcIidcIjogJyYjMzk7JyxcbiAgICBcIi9cIjogJyYjeDJGOydcbiAgfTtcblxuICBmdW5jdGlvbiBlc2NhcGVIdG1sKHN0cmluZykge1xuICAgIHJldHVybiBTdHJpbmcoc3RyaW5nKS5yZXBsYWNlKC9bJjw+XCInXFwvXS9nLCBmdW5jdGlvbiAocykge1xuICAgICAgcmV0dXJuIGVudGl0eU1hcFtzXTtcbiAgICB9KTtcbiAgfVxuXG4gIC8vIEV4cG9ydCB0aGUgZXNjYXBpbmcgZnVuY3Rpb24gc28gdGhhdCB0aGUgdXNlciBtYXkgb3ZlcnJpZGUgaXQuXG4gIC8vIFNlZSBodHRwczovL2dpdGh1Yi5jb20vamFubC9tdXN0YWNoZS5qcy9pc3N1ZXMvMjQ0XG4gIGV4cG9ydHMuZXNjYXBlID0gZXNjYXBlSHRtbDtcblxuICBmdW5jdGlvbiBTY2FubmVyKHN0cmluZykge1xuICAgIHRoaXMuc3RyaW5nID0gc3RyaW5nO1xuICAgIHRoaXMudGFpbCA9IHN0cmluZztcbiAgICB0aGlzLnBvcyA9IDA7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBgdHJ1ZWAgaWYgdGhlIHRhaWwgaXMgZW1wdHkgKGVuZCBvZiBzdHJpbmcpLlxuICAgKi9cbiAgU2Nhbm5lci5wcm90b3R5cGUuZW9zID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLnRhaWwgPT09IFwiXCI7XG4gIH07XG5cbiAgLyoqXG4gICAqIFRyaWVzIHRvIG1hdGNoIHRoZSBnaXZlbiByZWd1bGFyIGV4cHJlc3Npb24gYXQgdGhlIGN1cnJlbnQgcG9zaXRpb24uXG4gICAqIFJldHVybnMgdGhlIG1hdGNoZWQgdGV4dCBpZiBpdCBjYW4gbWF0Y2gsIHRoZSBlbXB0eSBzdHJpbmcgb3RoZXJ3aXNlLlxuICAgKi9cbiAgU2Nhbm5lci5wcm90b3R5cGUuc2NhbiA9IGZ1bmN0aW9uIChyZSkge1xuICAgIHZhciBtYXRjaCA9IHRoaXMudGFpbC5tYXRjaChyZSk7XG5cbiAgICBpZiAobWF0Y2ggJiYgbWF0Y2guaW5kZXggPT09IDApIHtcbiAgICAgIHRoaXMudGFpbCA9IHRoaXMudGFpbC5zdWJzdHJpbmcobWF0Y2hbMF0ubGVuZ3RoKTtcbiAgICAgIHRoaXMucG9zICs9IG1hdGNoWzBdLmxlbmd0aDtcbiAgICAgIHJldHVybiBtYXRjaFswXTtcbiAgICB9XG5cbiAgICByZXR1cm4gXCJcIjtcbiAgfTtcblxuICAvKipcbiAgICogU2tpcHMgYWxsIHRleHQgdW50aWwgdGhlIGdpdmVuIHJlZ3VsYXIgZXhwcmVzc2lvbiBjYW4gYmUgbWF0Y2hlZC4gUmV0dXJuc1xuICAgKiB0aGUgc2tpcHBlZCBzdHJpbmcsIHdoaWNoIGlzIHRoZSBlbnRpcmUgdGFpbCBpZiBubyBtYXRjaCBjYW4gYmUgbWFkZS5cbiAgICovXG4gIFNjYW5uZXIucHJvdG90eXBlLnNjYW5VbnRpbCA9IGZ1bmN0aW9uIChyZSkge1xuICAgIHZhciBtYXRjaCwgcG9zID0gdGhpcy50YWlsLnNlYXJjaChyZSk7XG5cbiAgICBzd2l0Y2ggKHBvcykge1xuICAgIGNhc2UgLTE6XG4gICAgICBtYXRjaCA9IHRoaXMudGFpbDtcbiAgICAgIHRoaXMucG9zICs9IHRoaXMudGFpbC5sZW5ndGg7XG4gICAgICB0aGlzLnRhaWwgPSBcIlwiO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAwOlxuICAgICAgbWF0Y2ggPSBcIlwiO1xuICAgICAgYnJlYWs7XG4gICAgZGVmYXVsdDpcbiAgICAgIG1hdGNoID0gdGhpcy50YWlsLnN1YnN0cmluZygwLCBwb3MpO1xuICAgICAgdGhpcy50YWlsID0gdGhpcy50YWlsLnN1YnN0cmluZyhwb3MpO1xuICAgICAgdGhpcy5wb3MgKz0gcG9zO1xuICAgIH1cblxuICAgIHJldHVybiBtYXRjaDtcbiAgfTtcblxuICBmdW5jdGlvbiBDb250ZXh0KHZpZXcsIHBhcmVudCkge1xuICAgIHRoaXMudmlldyA9IHZpZXc7XG4gICAgdGhpcy5wYXJlbnQgPSBwYXJlbnQ7XG4gICAgdGhpcy5jbGVhckNhY2hlKCk7XG4gIH1cblxuICBDb250ZXh0Lm1ha2UgPSBmdW5jdGlvbiAodmlldykge1xuICAgIHJldHVybiAodmlldyBpbnN0YW5jZW9mIENvbnRleHQpID8gdmlldyA6IG5ldyBDb250ZXh0KHZpZXcpO1xuICB9O1xuXG4gIENvbnRleHQucHJvdG90eXBlLmNsZWFyQ2FjaGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5fY2FjaGUgPSB7fTtcbiAgfTtcblxuICBDb250ZXh0LnByb3RvdHlwZS5wdXNoID0gZnVuY3Rpb24gKHZpZXcpIHtcbiAgICByZXR1cm4gbmV3IENvbnRleHQodmlldywgdGhpcyk7XG4gIH07XG5cbiAgQ29udGV4dC5wcm90b3R5cGUubG9va3VwID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB2YXIgdmFsdWUgPSB0aGlzLl9jYWNoZVtuYW1lXTtcblxuICAgIGlmICghdmFsdWUpIHtcbiAgICAgIGlmIChuYW1lID09PSBcIi5cIikge1xuICAgICAgICB2YWx1ZSA9IHRoaXMudmlldztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBjb250ZXh0ID0gdGhpcztcblxuICAgICAgICB3aGlsZSAoY29udGV4dCkge1xuICAgICAgICAgIGlmIChuYW1lLmluZGV4T2YoXCIuXCIpID4gMCkge1xuICAgICAgICAgICAgdmFyIG5hbWVzID0gbmFtZS5zcGxpdChcIi5cIiksIGkgPSAwO1xuXG4gICAgICAgICAgICB2YWx1ZSA9IGNvbnRleHQudmlldztcblxuICAgICAgICAgICAgd2hpbGUgKHZhbHVlICYmIGkgPCBuYW1lcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZVtuYW1lc1tpKytdXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmFsdWUgPSBjb250ZXh0LnZpZXdbbmFtZV07XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKHZhbHVlICE9IG51bGwpIHtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnRleHQgPSBjb250ZXh0LnBhcmVudDtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB0aGlzLl9jYWNoZVtuYW1lXSA9IHZhbHVlO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2YgdmFsdWUgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgdmFsdWUgPSB2YWx1ZS5jYWxsKHRoaXMudmlldyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHZhbHVlO1xuICB9O1xuXG4gIGZ1bmN0aW9uIFdyaXRlcigpIHtcbiAgICB0aGlzLmNsZWFyQ2FjaGUoKTtcbiAgfVxuXG4gIFdyaXRlci5wcm90b3R5cGUuY2xlYXJDYWNoZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLl9jYWNoZSA9IHt9O1xuICAgIHRoaXMuX3BhcnRpYWxDYWNoZSA9IHt9O1xuICB9O1xuXG4gIFdyaXRlci5wcm90b3R5cGUuY29tcGlsZSA9IGZ1bmN0aW9uICh0ZW1wbGF0ZSwgdGFncykge1xuICAgIHZhciBmbiA9IHRoaXMuX2NhY2hlW3RlbXBsYXRlXTtcblxuICAgIGlmICghZm4pIHtcbiAgICAgIHZhciB0b2tlbnMgPSBleHBvcnRzLnBhcnNlKHRlbXBsYXRlLCB0YWdzKTtcbiAgICAgIGZuID0gdGhpcy5fY2FjaGVbdGVtcGxhdGVdID0gdGhpcy5jb21waWxlVG9rZW5zKHRva2VucywgdGVtcGxhdGUpO1xuICAgIH1cblxuICAgIHJldHVybiBmbjtcbiAgfTtcblxuICBXcml0ZXIucHJvdG90eXBlLmNvbXBpbGVQYXJ0aWFsID0gZnVuY3Rpb24gKG5hbWUsIHRlbXBsYXRlLCB0YWdzKSB7XG4gICAgdmFyIGZuID0gdGhpcy5jb21waWxlKHRlbXBsYXRlLCB0YWdzKTtcbiAgICB0aGlzLl9wYXJ0aWFsQ2FjaGVbbmFtZV0gPSBmbjtcbiAgICByZXR1cm4gZm47XG4gIH07XG5cbiAgV3JpdGVyLnByb3RvdHlwZS5jb21waWxlVG9rZW5zID0gZnVuY3Rpb24gKHRva2VucywgdGVtcGxhdGUpIHtcbiAgICB2YXIgZm4gPSBjb21waWxlVG9rZW5zKHRva2Vucyk7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2aWV3LCBwYXJ0aWFscykge1xuICAgICAgaWYgKHBhcnRpYWxzKSB7XG4gICAgICAgIGlmICh0eXBlb2YgcGFydGlhbHMgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgIHNlbGYuX2xvYWRQYXJ0aWFsID0gcGFydGlhbHM7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZm9yICh2YXIgbmFtZSBpbiBwYXJ0aWFscykge1xuICAgICAgICAgICAgc2VsZi5jb21waWxlUGFydGlhbChuYW1lLCBwYXJ0aWFsc1tuYW1lXSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBmbihzZWxmLCBDb250ZXh0Lm1ha2UodmlldyksIHRlbXBsYXRlKTtcbiAgICB9O1xuICB9O1xuXG4gIFdyaXRlci5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24gKHRlbXBsYXRlLCB2aWV3LCBwYXJ0aWFscykge1xuICAgIHJldHVybiB0aGlzLmNvbXBpbGUodGVtcGxhdGUpKHZpZXcsIHBhcnRpYWxzKTtcbiAgfTtcblxuICBXcml0ZXIucHJvdG90eXBlLl9zZWN0aW9uID0gZnVuY3Rpb24gKG5hbWUsIGNvbnRleHQsIHRleHQsIGNhbGxiYWNrKSB7XG4gICAgdmFyIHZhbHVlID0gY29udGV4dC5sb29rdXAobmFtZSk7XG5cbiAgICBzd2l0Y2ggKHR5cGVvZiB2YWx1ZSkge1xuICAgIGNhc2UgXCJvYmplY3RcIjpcbiAgICAgIGlmIChpc0FycmF5KHZhbHVlKSkge1xuICAgICAgICB2YXIgYnVmZmVyID0gXCJcIjtcblxuICAgICAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gdmFsdWUubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICAgICAgICBidWZmZXIgKz0gY2FsbGJhY2sodGhpcywgY29udGV4dC5wdXNoKHZhbHVlW2ldKSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gYnVmZmVyO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdmFsdWUgPyBjYWxsYmFjayh0aGlzLCBjb250ZXh0LnB1c2godmFsdWUpKSA6IFwiXCI7XG4gICAgY2FzZSBcImZ1bmN0aW9uXCI6XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICB2YXIgc2NvcGVkUmVuZGVyID0gZnVuY3Rpb24gKHRlbXBsYXRlKSB7XG4gICAgICAgIHJldHVybiBzZWxmLnJlbmRlcih0ZW1wbGF0ZSwgY29udGV4dCk7XG4gICAgICB9O1xuXG4gICAgICB2YXIgcmVzdWx0ID0gdmFsdWUuY2FsbChjb250ZXh0LnZpZXcsIHRleHQsIHNjb3BlZFJlbmRlcik7XG4gICAgICByZXR1cm4gcmVzdWx0ICE9IG51bGwgPyByZXN1bHQgOiBcIlwiO1xuICAgIGRlZmF1bHQ6XG4gICAgICBpZiAodmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrKHRoaXMsIGNvbnRleHQpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBcIlwiO1xuICB9O1xuXG4gIFdyaXRlci5wcm90b3R5cGUuX2ludmVydGVkID0gZnVuY3Rpb24gKG5hbWUsIGNvbnRleHQsIGNhbGxiYWNrKSB7XG4gICAgdmFyIHZhbHVlID0gY29udGV4dC5sb29rdXAobmFtZSk7XG5cbiAgICAvLyBVc2UgSmF2YVNjcmlwdCdzIGRlZmluaXRpb24gb2YgZmFsc3kuIEluY2x1ZGUgZW1wdHkgYXJyYXlzLlxuICAgIC8vIFNlZSBodHRwczovL2dpdGh1Yi5jb20vamFubC9tdXN0YWNoZS5qcy9pc3N1ZXMvMTg2XG4gICAgaWYgKCF2YWx1ZSB8fCAoaXNBcnJheSh2YWx1ZSkgJiYgdmFsdWUubGVuZ3RoID09PSAwKSkge1xuICAgICAgcmV0dXJuIGNhbGxiYWNrKHRoaXMsIGNvbnRleHQpO1xuICAgIH1cblxuICAgIHJldHVybiBcIlwiO1xuICB9O1xuXG4gIFdyaXRlci5wcm90b3R5cGUuX3BhcnRpYWwgPSBmdW5jdGlvbiAobmFtZSwgY29udGV4dCkge1xuICAgIGlmICghKG5hbWUgaW4gdGhpcy5fcGFydGlhbENhY2hlKSAmJiB0aGlzLl9sb2FkUGFydGlhbCkge1xuICAgICAgdGhpcy5jb21waWxlUGFydGlhbChuYW1lLCB0aGlzLl9sb2FkUGFydGlhbChuYW1lKSk7XG4gICAgfVxuXG4gICAgdmFyIGZuID0gdGhpcy5fcGFydGlhbENhY2hlW25hbWVdO1xuXG4gICAgcmV0dXJuIGZuID8gZm4oY29udGV4dCkgOiBcIlwiO1xuICB9O1xuXG4gIFdyaXRlci5wcm90b3R5cGUuX25hbWUgPSBmdW5jdGlvbiAobmFtZSwgY29udGV4dCkge1xuICAgIHZhciB2YWx1ZSA9IGNvbnRleHQubG9va3VwKG5hbWUpO1xuXG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICB2YWx1ZSA9IHZhbHVlLmNhbGwoY29udGV4dC52aWV3KTtcbiAgICB9XG5cbiAgICByZXR1cm4gKHZhbHVlID09IG51bGwpID8gXCJcIiA6IFN0cmluZyh2YWx1ZSk7XG4gIH07XG5cbiAgV3JpdGVyLnByb3RvdHlwZS5fZXNjYXBlZCA9IGZ1bmN0aW9uIChuYW1lLCBjb250ZXh0KSB7XG4gICAgcmV0dXJuIGV4cG9ydHMuZXNjYXBlKHRoaXMuX25hbWUobmFtZSwgY29udGV4dCkpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBMb3ctbGV2ZWwgZnVuY3Rpb24gdGhhdCBjb21waWxlcyB0aGUgZ2l2ZW4gYHRva2Vuc2AgaW50byBhIGZ1bmN0aW9uXG4gICAqIHRoYXQgYWNjZXB0cyB0aHJlZSBhcmd1bWVudHM6IGEgV3JpdGVyLCBhIENvbnRleHQsIGFuZCB0aGUgdGVtcGxhdGUuXG4gICAqL1xuICBmdW5jdGlvbiBjb21waWxlVG9rZW5zKHRva2Vucykge1xuICAgIHZhciBzdWJSZW5kZXJzID0ge307XG5cbiAgICBmdW5jdGlvbiBzdWJSZW5kZXIoaSwgdG9rZW5zLCB0ZW1wbGF0ZSkge1xuICAgICAgaWYgKCFzdWJSZW5kZXJzW2ldKSB7XG4gICAgICAgIHZhciBmbiA9IGNvbXBpbGVUb2tlbnModG9rZW5zKTtcbiAgICAgICAgc3ViUmVuZGVyc1tpXSA9IGZ1bmN0aW9uICh3cml0ZXIsIGNvbnRleHQpIHtcbiAgICAgICAgICByZXR1cm4gZm4od3JpdGVyLCBjb250ZXh0LCB0ZW1wbGF0ZSk7XG4gICAgICAgIH07XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBzdWJSZW5kZXJzW2ldO1xuICAgIH1cblxuICAgIHJldHVybiBmdW5jdGlvbiAod3JpdGVyLCBjb250ZXh0LCB0ZW1wbGF0ZSkge1xuICAgICAgdmFyIGJ1ZmZlciA9IFwiXCI7XG4gICAgICB2YXIgdG9rZW4sIHNlY3Rpb25UZXh0O1xuXG4gICAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gdG9rZW5zLmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XG4gICAgICAgIHRva2VuID0gdG9rZW5zW2ldO1xuXG4gICAgICAgIHN3aXRjaCAodG9rZW5bMF0pIHtcbiAgICAgICAgY2FzZSBcIiNcIjpcbiAgICAgICAgICBzZWN0aW9uVGV4dCA9IHRlbXBsYXRlLnNsaWNlKHRva2VuWzNdLCB0b2tlbls1XSk7XG4gICAgICAgICAgYnVmZmVyICs9IHdyaXRlci5fc2VjdGlvbih0b2tlblsxXSwgY29udGV4dCwgc2VjdGlvblRleHQsIHN1YlJlbmRlcihpLCB0b2tlbls0XSwgdGVtcGxhdGUpKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcIl5cIjpcbiAgICAgICAgICBidWZmZXIgKz0gd3JpdGVyLl9pbnZlcnRlZCh0b2tlblsxXSwgY29udGV4dCwgc3ViUmVuZGVyKGksIHRva2VuWzRdLCB0ZW1wbGF0ZSkpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwiPlwiOlxuICAgICAgICAgIGJ1ZmZlciArPSB3cml0ZXIuX3BhcnRpYWwodG9rZW5bMV0sIGNvbnRleHQpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwiJlwiOlxuICAgICAgICAgIGJ1ZmZlciArPSB3cml0ZXIuX25hbWUodG9rZW5bMV0sIGNvbnRleHQpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwibmFtZVwiOlxuICAgICAgICAgIGJ1ZmZlciArPSB3cml0ZXIuX2VzY2FwZWQodG9rZW5bMV0sIGNvbnRleHQpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwidGV4dFwiOlxuICAgICAgICAgIGJ1ZmZlciArPSB0b2tlblsxXTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gYnVmZmVyO1xuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogRm9ybXMgdGhlIGdpdmVuIGFycmF5IG9mIGB0b2tlbnNgIGludG8gYSBuZXN0ZWQgdHJlZSBzdHJ1Y3R1cmUgd2hlcmVcbiAgICogdG9rZW5zIHRoYXQgcmVwcmVzZW50IGEgc2VjdGlvbiBoYXZlIHR3byBhZGRpdGlvbmFsIGl0ZW1zOiAxKSBhbiBhcnJheSBvZlxuICAgKiBhbGwgdG9rZW5zIHRoYXQgYXBwZWFyIGluIHRoYXQgc2VjdGlvbiBhbmQgMikgdGhlIGluZGV4IGluIHRoZSBvcmlnaW5hbFxuICAgKiB0ZW1wbGF0ZSB0aGF0IHJlcHJlc2VudHMgdGhlIGVuZCBvZiB0aGF0IHNlY3Rpb24uXG4gICAqL1xuICBmdW5jdGlvbiBuZXN0VG9rZW5zKHRva2Vucykge1xuICAgIHZhciB0cmVlID0gW107XG4gICAgdmFyIGNvbGxlY3RvciA9IHRyZWU7XG4gICAgdmFyIHNlY3Rpb25zID0gW107XG5cbiAgICB2YXIgdG9rZW47XG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IHRva2Vucy5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICAgICAgdG9rZW4gPSB0b2tlbnNbaV07XG4gICAgICBzd2l0Y2ggKHRva2VuWzBdKSB7XG4gICAgICBjYXNlICcjJzpcbiAgICAgIGNhc2UgJ14nOlxuICAgICAgICBzZWN0aW9ucy5wdXNoKHRva2VuKTtcbiAgICAgICAgY29sbGVjdG9yLnB1c2godG9rZW4pO1xuICAgICAgICBjb2xsZWN0b3IgPSB0b2tlbls0XSA9IFtdO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJy8nOlxuICAgICAgICB2YXIgc2VjdGlvbiA9IHNlY3Rpb25zLnBvcCgpO1xuICAgICAgICBzZWN0aW9uWzVdID0gdG9rZW5bMl07XG4gICAgICAgIGNvbGxlY3RvciA9IHNlY3Rpb25zLmxlbmd0aCA+IDAgPyBzZWN0aW9uc1tzZWN0aW9ucy5sZW5ndGggLSAxXVs0XSA6IHRyZWU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgY29sbGVjdG9yLnB1c2godG9rZW4pO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0cmVlO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbWJpbmVzIHRoZSB2YWx1ZXMgb2YgY29uc2VjdXRpdmUgdGV4dCB0b2tlbnMgaW4gdGhlIGdpdmVuIGB0b2tlbnNgIGFycmF5XG4gICAqIHRvIGEgc2luZ2xlIHRva2VuLlxuICAgKi9cbiAgZnVuY3Rpb24gc3F1YXNoVG9rZW5zKHRva2Vucykge1xuICAgIHZhciBzcXVhc2hlZFRva2VucyA9IFtdO1xuXG4gICAgdmFyIHRva2VuLCBsYXN0VG9rZW47XG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IHRva2Vucy5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICAgICAgdG9rZW4gPSB0b2tlbnNbaV07XG4gICAgICBpZiAodG9rZW5bMF0gPT09ICd0ZXh0JyAmJiBsYXN0VG9rZW4gJiYgbGFzdFRva2VuWzBdID09PSAndGV4dCcpIHtcbiAgICAgICAgbGFzdFRva2VuWzFdICs9IHRva2VuWzFdO1xuICAgICAgICBsYXN0VG9rZW5bM10gPSB0b2tlblszXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxhc3RUb2tlbiA9IHRva2VuO1xuICAgICAgICBzcXVhc2hlZFRva2Vucy5wdXNoKHRva2VuKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gc3F1YXNoZWRUb2tlbnM7XG4gIH1cblxuICBmdW5jdGlvbiBlc2NhcGVUYWdzKHRhZ3MpIHtcbiAgICByZXR1cm4gW1xuICAgICAgbmV3IFJlZ0V4cChlc2NhcGVSZSh0YWdzWzBdKSArIFwiXFxcXHMqXCIpLFxuICAgICAgbmV3IFJlZ0V4cChcIlxcXFxzKlwiICsgZXNjYXBlUmUodGFnc1sxXSkpXG4gICAgXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBCcmVha3MgdXAgdGhlIGdpdmVuIGB0ZW1wbGF0ZWAgc3RyaW5nIGludG8gYSB0cmVlIG9mIHRva2VuIG9iamVjdHMuIElmXG4gICAqIGB0YWdzYCBpcyBnaXZlbiBoZXJlIGl0IG11c3QgYmUgYW4gYXJyYXkgd2l0aCB0d28gc3RyaW5nIHZhbHVlczogdGhlXG4gICAqIG9wZW5pbmcgYW5kIGNsb3NpbmcgdGFncyB1c2VkIGluIHRoZSB0ZW1wbGF0ZSAoZS5nLiBbXCI8JVwiLCBcIiU+XCJdKS4gT2ZcbiAgICogY291cnNlLCB0aGUgZGVmYXVsdCBpcyB0byB1c2UgbXVzdGFjaGVzIChpLmUuIE11c3RhY2hlLnRhZ3MpLlxuICAgKi9cbiAgZXhwb3J0cy5wYXJzZSA9IGZ1bmN0aW9uICh0ZW1wbGF0ZSwgdGFncykge1xuICAgIHRlbXBsYXRlID0gdGVtcGxhdGUgfHwgJyc7XG4gICAgdGFncyA9IHRhZ3MgfHwgZXhwb3J0cy50YWdzO1xuXG4gICAgaWYgKHR5cGVvZiB0YWdzID09PSAnc3RyaW5nJykgdGFncyA9IHRhZ3Muc3BsaXQoc3BhY2VSZSk7XG4gICAgaWYgKHRhZ3MubGVuZ3RoICE9PSAyKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgdGFnczogJyArIHRhZ3Muam9pbignLCAnKSk7XG4gICAgfVxuXG4gICAgdmFyIHRhZ1JlcyA9IGVzY2FwZVRhZ3ModGFncyk7XG4gICAgdmFyIHNjYW5uZXIgPSBuZXcgU2Nhbm5lcih0ZW1wbGF0ZSk7XG5cbiAgICB2YXIgc2VjdGlvbnMgPSBbXTsgICAgIC8vIFN0YWNrIHRvIGhvbGQgc2VjdGlvbiB0b2tlbnNcbiAgICB2YXIgdG9rZW5zID0gW107ICAgICAgIC8vIEJ1ZmZlciB0byBob2xkIHRoZSB0b2tlbnNcbiAgICB2YXIgc3BhY2VzID0gW107ICAgICAgIC8vIEluZGljZXMgb2Ygd2hpdGVzcGFjZSB0b2tlbnMgb24gdGhlIGN1cnJlbnQgbGluZVxuICAgIHZhciBoYXNUYWcgPSBmYWxzZTsgICAgLy8gSXMgdGhlcmUgYSB7e3RhZ319IG9uIHRoZSBjdXJyZW50IGxpbmU/XG4gICAgdmFyIG5vblNwYWNlID0gZmFsc2U7ICAvLyBJcyB0aGVyZSBhIG5vbi1zcGFjZSBjaGFyIG9uIHRoZSBjdXJyZW50IGxpbmU/XG5cbiAgICAvLyBTdHJpcHMgYWxsIHdoaXRlc3BhY2UgdG9rZW5zIGFycmF5IGZvciB0aGUgY3VycmVudCBsaW5lXG4gICAgLy8gaWYgdGhlcmUgd2FzIGEge3sjdGFnfX0gb24gaXQgYW5kIG90aGVyd2lzZSBvbmx5IHNwYWNlLlxuICAgIGZ1bmN0aW9uIHN0cmlwU3BhY2UoKSB7XG4gICAgICBpZiAoaGFzVGFnICYmICFub25TcGFjZSkge1xuICAgICAgICB3aGlsZSAoc3BhY2VzLmxlbmd0aCkge1xuICAgICAgICAgIHRva2Vucy5zcGxpY2Uoc3BhY2VzLnBvcCgpLCAxKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3BhY2VzID0gW107XG4gICAgICB9XG5cbiAgICAgIGhhc1RhZyA9IGZhbHNlO1xuICAgICAgbm9uU3BhY2UgPSBmYWxzZTtcbiAgICB9XG5cbiAgICB2YXIgc3RhcnQsIHR5cGUsIHZhbHVlLCBjaHI7XG4gICAgd2hpbGUgKCFzY2FubmVyLmVvcygpKSB7XG4gICAgICBzdGFydCA9IHNjYW5uZXIucG9zO1xuICAgICAgdmFsdWUgPSBzY2FubmVyLnNjYW5VbnRpbCh0YWdSZXNbMF0pO1xuXG4gICAgICBpZiAodmFsdWUpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IHZhbHVlLmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XG4gICAgICAgICAgY2hyID0gdmFsdWUuY2hhckF0KGkpO1xuXG4gICAgICAgICAgaWYgKGlzV2hpdGVzcGFjZShjaHIpKSB7XG4gICAgICAgICAgICBzcGFjZXMucHVzaCh0b2tlbnMubGVuZ3RoKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbm9uU3BhY2UgPSB0cnVlO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHRva2Vucy5wdXNoKFtcInRleHRcIiwgY2hyLCBzdGFydCwgc3RhcnQgKyAxXSk7XG4gICAgICAgICAgc3RhcnQgKz0gMTtcblxuICAgICAgICAgIGlmIChjaHIgPT09IFwiXFxuXCIpIHtcbiAgICAgICAgICAgIHN0cmlwU3BhY2UoKTsgLy8gQ2hlY2sgZm9yIHdoaXRlc3BhY2Ugb24gdGhlIGN1cnJlbnQgbGluZS5cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgc3RhcnQgPSBzY2FubmVyLnBvcztcblxuICAgICAgLy8gTWF0Y2ggdGhlIG9wZW5pbmcgdGFnLlxuICAgICAgaWYgKCFzY2FubmVyLnNjYW4odGFnUmVzWzBdKSkge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgaGFzVGFnID0gdHJ1ZTtcbiAgICAgIHR5cGUgPSBzY2FubmVyLnNjYW4odGFnUmUpIHx8IFwibmFtZVwiO1xuXG4gICAgICAvLyBTa2lwIGFueSB3aGl0ZXNwYWNlIGJldHdlZW4gdGFnIGFuZCB2YWx1ZS5cbiAgICAgIHNjYW5uZXIuc2Nhbih3aGl0ZVJlKTtcblxuICAgICAgLy8gRXh0cmFjdCB0aGUgdGFnIHZhbHVlLlxuICAgICAgaWYgKHR5cGUgPT09IFwiPVwiKSB7XG4gICAgICAgIHZhbHVlID0gc2Nhbm5lci5zY2FuVW50aWwoZXFSZSk7XG4gICAgICAgIHNjYW5uZXIuc2NhbihlcVJlKTtcbiAgICAgICAgc2Nhbm5lci5zY2FuVW50aWwodGFnUmVzWzFdKTtcbiAgICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gXCJ7XCIpIHtcbiAgICAgICAgdmFyIGNsb3NlUmUgPSBuZXcgUmVnRXhwKFwiXFxcXHMqXCIgKyBlc2NhcGVSZShcIn1cIiArIHRhZ3NbMV0pKTtcbiAgICAgICAgdmFsdWUgPSBzY2FubmVyLnNjYW5VbnRpbChjbG9zZVJlKTtcbiAgICAgICAgc2Nhbm5lci5zY2FuKGN1cmx5UmUpO1xuICAgICAgICBzY2FubmVyLnNjYW5VbnRpbCh0YWdSZXNbMV0pO1xuICAgICAgICB0eXBlID0gXCImXCI7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YWx1ZSA9IHNjYW5uZXIuc2NhblVudGlsKHRhZ1Jlc1sxXSk7XG4gICAgICB9XG5cbiAgICAgIC8vIE1hdGNoIHRoZSBjbG9zaW5nIHRhZy5cbiAgICAgIGlmICghc2Nhbm5lci5zY2FuKHRhZ1Jlc1sxXSkpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmNsb3NlZCB0YWcgYXQgJyArIHNjYW5uZXIucG9zKTtcbiAgICAgIH1cblxuICAgICAgLy8gQ2hlY2sgc2VjdGlvbiBuZXN0aW5nLlxuICAgICAgaWYgKHR5cGUgPT09ICcvJykge1xuICAgICAgICBpZiAoc2VjdGlvbnMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbm9wZW5lZCBzZWN0aW9uIFwiJyArIHZhbHVlICsgJ1wiIGF0ICcgKyBzdGFydCk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgc2VjdGlvbiA9IHNlY3Rpb25zLnBvcCgpO1xuXG4gICAgICAgIGlmIChzZWN0aW9uWzFdICE9PSB2YWx1ZSkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVW5jbG9zZWQgc2VjdGlvbiBcIicgKyBzZWN0aW9uWzFdICsgJ1wiIGF0ICcgKyBzdGFydCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgdmFyIHRva2VuID0gW3R5cGUsIHZhbHVlLCBzdGFydCwgc2Nhbm5lci5wb3NdO1xuICAgICAgdG9rZW5zLnB1c2godG9rZW4pO1xuXG4gICAgICBpZiAodHlwZSA9PT0gJyMnIHx8IHR5cGUgPT09ICdeJykge1xuICAgICAgICBzZWN0aW9ucy5wdXNoKHRva2VuKTtcbiAgICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gXCJuYW1lXCIgfHwgdHlwZSA9PT0gXCJ7XCIgfHwgdHlwZSA9PT0gXCImXCIpIHtcbiAgICAgICAgbm9uU3BhY2UgPSB0cnVlO1xuICAgICAgfSBlbHNlIGlmICh0eXBlID09PSBcIj1cIikge1xuICAgICAgICAvLyBTZXQgdGhlIHRhZ3MgZm9yIHRoZSBuZXh0IHRpbWUgYXJvdW5kLlxuICAgICAgICB0YWdzID0gdmFsdWUuc3BsaXQoc3BhY2VSZSk7XG5cbiAgICAgICAgaWYgKHRhZ3MubGVuZ3RoICE9PSAyKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIHRhZ3MgYXQgJyArIHN0YXJ0ICsgJzogJyArIHRhZ3Muam9pbignLCAnKSk7XG4gICAgICAgIH1cblxuICAgICAgICB0YWdSZXMgPSBlc2NhcGVUYWdzKHRhZ3MpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIE1ha2Ugc3VyZSB0aGVyZSBhcmUgbm8gb3BlbiBzZWN0aW9ucyB3aGVuIHdlJ3JlIGRvbmUuXG4gICAgdmFyIHNlY3Rpb24gPSBzZWN0aW9ucy5wb3AoKTtcbiAgICBpZiAoc2VjdGlvbikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmNsb3NlZCBzZWN0aW9uIFwiJyArIHNlY3Rpb25bMV0gKyAnXCIgYXQgJyArIHNjYW5uZXIucG9zKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmVzdFRva2VucyhzcXVhc2hUb2tlbnModG9rZW5zKSk7XG4gIH07XG5cbiAgLy8gVGhlIGhpZ2gtbGV2ZWwgY2xlYXJDYWNoZSwgY29tcGlsZSwgY29tcGlsZVBhcnRpYWwsIGFuZCByZW5kZXIgZnVuY3Rpb25zXG4gIC8vIHVzZSB0aGlzIGRlZmF1bHQgd3JpdGVyLlxuICB2YXIgX3dyaXRlciA9IG5ldyBXcml0ZXIoKTtcblxuICAvKipcbiAgICogQ2xlYXJzIGFsbCBjYWNoZWQgdGVtcGxhdGVzIGFuZCBwYXJ0aWFscyBpbiB0aGUgZGVmYXVsdCB3cml0ZXIuXG4gICAqL1xuICBleHBvcnRzLmNsZWFyQ2FjaGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIF93cml0ZXIuY2xlYXJDYWNoZSgpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBDb21waWxlcyB0aGUgZ2l2ZW4gYHRlbXBsYXRlYCB0byBhIHJldXNhYmxlIGZ1bmN0aW9uIHVzaW5nIHRoZSBkZWZhdWx0XG4gICAqIHdyaXRlci5cbiAgICovXG4gIGV4cG9ydHMuY29tcGlsZSA9IGZ1bmN0aW9uICh0ZW1wbGF0ZSwgdGFncykge1xuICAgIHJldHVybiBfd3JpdGVyLmNvbXBpbGUodGVtcGxhdGUsIHRhZ3MpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBDb21waWxlcyB0aGUgcGFydGlhbCB3aXRoIHRoZSBnaXZlbiBgbmFtZWAgYW5kIGB0ZW1wbGF0ZWAgdG8gYSByZXVzYWJsZVxuICAgKiBmdW5jdGlvbiB1c2luZyB0aGUgZGVmYXVsdCB3cml0ZXIuXG4gICAqL1xuICBleHBvcnRzLmNvbXBpbGVQYXJ0aWFsID0gZnVuY3Rpb24gKG5hbWUsIHRlbXBsYXRlLCB0YWdzKSB7XG4gICAgcmV0dXJuIF93cml0ZXIuY29tcGlsZVBhcnRpYWwobmFtZSwgdGVtcGxhdGUsIHRhZ3MpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBDb21waWxlcyB0aGUgZ2l2ZW4gYXJyYXkgb2YgdG9rZW5zICh0aGUgb3V0cHV0IG9mIGEgcGFyc2UpIHRvIGEgcmV1c2FibGVcbiAgICogZnVuY3Rpb24gdXNpbmcgdGhlIGRlZmF1bHQgd3JpdGVyLlxuICAgKi9cbiAgZXhwb3J0cy5jb21waWxlVG9rZW5zID0gZnVuY3Rpb24gKHRva2VucywgdGVtcGxhdGUpIHtcbiAgICByZXR1cm4gX3dyaXRlci5jb21waWxlVG9rZW5zKHRva2VucywgdGVtcGxhdGUpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBSZW5kZXJzIHRoZSBgdGVtcGxhdGVgIHdpdGggdGhlIGdpdmVuIGB2aWV3YCBhbmQgYHBhcnRpYWxzYCB1c2luZyB0aGVcbiAgICogZGVmYXVsdCB3cml0ZXIuXG4gICAqL1xuICBleHBvcnRzLnJlbmRlciA9IGZ1bmN0aW9uICh0ZW1wbGF0ZSwgdmlldywgcGFydGlhbHMpIHtcbiAgICByZXR1cm4gX3dyaXRlci5yZW5kZXIodGVtcGxhdGUsIHZpZXcsIHBhcnRpYWxzKTtcbiAgfTtcblxuICAvLyBUaGlzIGlzIGhlcmUgZm9yIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5IHdpdGggMC40LnguXG4gIGV4cG9ydHMudG9faHRtbCA9IGZ1bmN0aW9uICh0ZW1wbGF0ZSwgdmlldywgcGFydGlhbHMsIHNlbmQpIHtcbiAgICB2YXIgcmVzdWx0ID0gZXhwb3J0cy5yZW5kZXIodGVtcGxhdGUsIHZpZXcsIHBhcnRpYWxzKTtcblxuICAgIGlmICh0eXBlb2Ygc2VuZCA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICBzZW5kKHJlc3VsdCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuICB9O1xuXG4gIHJldHVybiBleHBvcnRzO1xuXG59KCkpKSk7XG4iLCIvLyAgICAgVW5kZXJzY29yZS5qcyAxLjUuMlxuLy8gICAgIGh0dHA6Ly91bmRlcnNjb3JlanMub3JnXG4vLyAgICAgKGMpIDIwMDktMjAxMyBKZXJlbXkgQXNoa2VuYXMsIERvY3VtZW50Q2xvdWQgYW5kIEludmVzdGlnYXRpdmUgUmVwb3J0ZXJzICYgRWRpdG9yc1xuLy8gICAgIFVuZGVyc2NvcmUgbWF5IGJlIGZyZWVseSBkaXN0cmlidXRlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2UuXG5cbihmdW5jdGlvbigpIHtcblxuICAvLyBCYXNlbGluZSBzZXR1cFxuICAvLyAtLS0tLS0tLS0tLS0tLVxuXG4gIC8vIEVzdGFibGlzaCB0aGUgcm9vdCBvYmplY3QsIGB3aW5kb3dgIGluIHRoZSBicm93c2VyLCBvciBgZXhwb3J0c2Agb24gdGhlIHNlcnZlci5cbiAgdmFyIHJvb3QgPSB0aGlzO1xuXG4gIC8vIFNhdmUgdGhlIHByZXZpb3VzIHZhbHVlIG9mIHRoZSBgX2AgdmFyaWFibGUuXG4gIHZhciBwcmV2aW91c1VuZGVyc2NvcmUgPSByb290Ll87XG5cbiAgLy8gRXN0YWJsaXNoIHRoZSBvYmplY3QgdGhhdCBnZXRzIHJldHVybmVkIHRvIGJyZWFrIG91dCBvZiBhIGxvb3AgaXRlcmF0aW9uLlxuICB2YXIgYnJlYWtlciA9IHt9O1xuXG4gIC8vIFNhdmUgYnl0ZXMgaW4gdGhlIG1pbmlmaWVkIChidXQgbm90IGd6aXBwZWQpIHZlcnNpb246XG4gIHZhciBBcnJheVByb3RvID0gQXJyYXkucHJvdG90eXBlLCBPYmpQcm90byA9IE9iamVjdC5wcm90b3R5cGUsIEZ1bmNQcm90byA9IEZ1bmN0aW9uLnByb3RvdHlwZTtcblxuICAvLyBDcmVhdGUgcXVpY2sgcmVmZXJlbmNlIHZhcmlhYmxlcyBmb3Igc3BlZWQgYWNjZXNzIHRvIGNvcmUgcHJvdG90eXBlcy5cbiAgdmFyXG4gICAgcHVzaCAgICAgICAgICAgICA9IEFycmF5UHJvdG8ucHVzaCxcbiAgICBzbGljZSAgICAgICAgICAgID0gQXJyYXlQcm90by5zbGljZSxcbiAgICBjb25jYXQgICAgICAgICAgID0gQXJyYXlQcm90by5jb25jYXQsXG4gICAgdG9TdHJpbmcgICAgICAgICA9IE9ialByb3RvLnRvU3RyaW5nLFxuICAgIGhhc093blByb3BlcnR5ICAgPSBPYmpQcm90by5oYXNPd25Qcm9wZXJ0eTtcblxuICAvLyBBbGwgKipFQ01BU2NyaXB0IDUqKiBuYXRpdmUgZnVuY3Rpb24gaW1wbGVtZW50YXRpb25zIHRoYXQgd2UgaG9wZSB0byB1c2VcbiAgLy8gYXJlIGRlY2xhcmVkIGhlcmUuXG4gIHZhclxuICAgIG5hdGl2ZUZvckVhY2ggICAgICA9IEFycmF5UHJvdG8uZm9yRWFjaCxcbiAgICBuYXRpdmVNYXAgICAgICAgICAgPSBBcnJheVByb3RvLm1hcCxcbiAgICBuYXRpdmVSZWR1Y2UgICAgICAgPSBBcnJheVByb3RvLnJlZHVjZSxcbiAgICBuYXRpdmVSZWR1Y2VSaWdodCAgPSBBcnJheVByb3RvLnJlZHVjZVJpZ2h0LFxuICAgIG5hdGl2ZUZpbHRlciAgICAgICA9IEFycmF5UHJvdG8uZmlsdGVyLFxuICAgIG5hdGl2ZUV2ZXJ5ICAgICAgICA9IEFycmF5UHJvdG8uZXZlcnksXG4gICAgbmF0aXZlU29tZSAgICAgICAgID0gQXJyYXlQcm90by5zb21lLFxuICAgIG5hdGl2ZUluZGV4T2YgICAgICA9IEFycmF5UHJvdG8uaW5kZXhPZixcbiAgICBuYXRpdmVMYXN0SW5kZXhPZiAgPSBBcnJheVByb3RvLmxhc3RJbmRleE9mLFxuICAgIG5hdGl2ZUlzQXJyYXkgICAgICA9IEFycmF5LmlzQXJyYXksXG4gICAgbmF0aXZlS2V5cyAgICAgICAgID0gT2JqZWN0LmtleXMsXG4gICAgbmF0aXZlQmluZCAgICAgICAgID0gRnVuY1Byb3RvLmJpbmQ7XG5cbiAgLy8gQ3JlYXRlIGEgc2FmZSByZWZlcmVuY2UgdG8gdGhlIFVuZGVyc2NvcmUgb2JqZWN0IGZvciB1c2UgYmVsb3cuXG4gIHZhciBfID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgaWYgKG9iaiBpbnN0YW5jZW9mIF8pIHJldHVybiBvYmo7XG4gICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIF8pKSByZXR1cm4gbmV3IF8ob2JqKTtcbiAgICB0aGlzLl93cmFwcGVkID0gb2JqO1xuICB9O1xuXG4gIC8vIEV4cG9ydCB0aGUgVW5kZXJzY29yZSBvYmplY3QgZm9yICoqTm9kZS5qcyoqLCB3aXRoXG4gIC8vIGJhY2t3YXJkcy1jb21wYXRpYmlsaXR5IGZvciB0aGUgb2xkIGByZXF1aXJlKClgIEFQSS4gSWYgd2UncmUgaW5cbiAgLy8gdGhlIGJyb3dzZXIsIGFkZCBgX2AgYXMgYSBnbG9iYWwgb2JqZWN0IHZpYSBhIHN0cmluZyBpZGVudGlmaWVyLFxuICAvLyBmb3IgQ2xvc3VyZSBDb21waWxlciBcImFkdmFuY2VkXCIgbW9kZS5cbiAgaWYgKHR5cGVvZiBleHBvcnRzICE9PSAndW5kZWZpbmVkJykge1xuICAgIGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xuICAgICAgZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gXztcbiAgICB9XG4gICAgZXhwb3J0cy5fID0gXztcbiAgfSBlbHNlIHtcbiAgICByb290Ll8gPSBfO1xuICB9XG5cbiAgLy8gQ3VycmVudCB2ZXJzaW9uLlxuICBfLlZFUlNJT04gPSAnMS41LjInO1xuXG4gIC8vIENvbGxlY3Rpb24gRnVuY3Rpb25zXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gVGhlIGNvcm5lcnN0b25lLCBhbiBgZWFjaGAgaW1wbGVtZW50YXRpb24sIGFrYSBgZm9yRWFjaGAuXG4gIC8vIEhhbmRsZXMgb2JqZWN0cyB3aXRoIHRoZSBidWlsdC1pbiBgZm9yRWFjaGAsIGFycmF5cywgYW5kIHJhdyBvYmplY3RzLlxuICAvLyBEZWxlZ2F0ZXMgdG8gKipFQ01BU2NyaXB0IDUqKidzIG5hdGl2ZSBgZm9yRWFjaGAgaWYgYXZhaWxhYmxlLlxuICB2YXIgZWFjaCA9IF8uZWFjaCA9IF8uZm9yRWFjaCA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0b3IsIGNvbnRleHQpIHtcbiAgICBpZiAob2JqID09IG51bGwpIHJldHVybjtcbiAgICBpZiAobmF0aXZlRm9yRWFjaCAmJiBvYmouZm9yRWFjaCA9PT0gbmF0aXZlRm9yRWFjaCkge1xuICAgICAgb2JqLmZvckVhY2goaXRlcmF0b3IsIGNvbnRleHQpO1xuICAgIH0gZWxzZSBpZiAob2JqLmxlbmd0aCA9PT0gK29iai5sZW5ndGgpIHtcbiAgICAgIGZvciAodmFyIGkgPSAwLCBsZW5ndGggPSBvYmoubGVuZ3RoOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgb2JqW2ldLCBpLCBvYmopID09PSBicmVha2VyKSByZXR1cm47XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBrZXlzID0gXy5rZXlzKG9iaik7XG4gICAgICBmb3IgKHZhciBpID0gMCwgbGVuZ3RoID0ga2V5cy5sZW5ndGg7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoaXRlcmF0b3IuY2FsbChjb250ZXh0LCBvYmpba2V5c1tpXV0sIGtleXNbaV0sIG9iaikgPT09IGJyZWFrZXIpIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgLy8gUmV0dXJuIHRoZSByZXN1bHRzIG9mIGFwcGx5aW5nIHRoZSBpdGVyYXRvciB0byBlYWNoIGVsZW1lbnQuXG4gIC8vIERlbGVnYXRlcyB0byAqKkVDTUFTY3JpcHQgNSoqJ3MgbmF0aXZlIGBtYXBgIGlmIGF2YWlsYWJsZS5cbiAgXy5tYXAgPSBfLmNvbGxlY3QgPSBmdW5jdGlvbihvYmosIGl0ZXJhdG9yLCBjb250ZXh0KSB7XG4gICAgdmFyIHJlc3VsdHMgPSBbXTtcbiAgICBpZiAob2JqID09IG51bGwpIHJldHVybiByZXN1bHRzO1xuICAgIGlmIChuYXRpdmVNYXAgJiYgb2JqLm1hcCA9PT0gbmF0aXZlTWFwKSByZXR1cm4gb2JqLm1hcChpdGVyYXRvciwgY29udGV4dCk7XG4gICAgZWFjaChvYmosIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCwgbGlzdCkge1xuICAgICAgcmVzdWx0cy5wdXNoKGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgdmFsdWUsIGluZGV4LCBsaXN0KSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3VsdHM7XG4gIH07XG5cbiAgdmFyIHJlZHVjZUVycm9yID0gJ1JlZHVjZSBvZiBlbXB0eSBhcnJheSB3aXRoIG5vIGluaXRpYWwgdmFsdWUnO1xuXG4gIC8vICoqUmVkdWNlKiogYnVpbGRzIHVwIGEgc2luZ2xlIHJlc3VsdCBmcm9tIGEgbGlzdCBvZiB2YWx1ZXMsIGFrYSBgaW5qZWN0YCxcbiAgLy8gb3IgYGZvbGRsYC4gRGVsZWdhdGVzIHRvICoqRUNNQVNjcmlwdCA1KioncyBuYXRpdmUgYHJlZHVjZWAgaWYgYXZhaWxhYmxlLlxuICBfLnJlZHVjZSA9IF8uZm9sZGwgPSBfLmluamVjdCA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0b3IsIG1lbW8sIGNvbnRleHQpIHtcbiAgICB2YXIgaW5pdGlhbCA9IGFyZ3VtZW50cy5sZW5ndGggPiAyO1xuICAgIGlmIChvYmogPT0gbnVsbCkgb2JqID0gW107XG4gICAgaWYgKG5hdGl2ZVJlZHVjZSAmJiBvYmoucmVkdWNlID09PSBuYXRpdmVSZWR1Y2UpIHtcbiAgICAgIGlmIChjb250ZXh0KSBpdGVyYXRvciA9IF8uYmluZChpdGVyYXRvciwgY29udGV4dCk7XG4gICAgICByZXR1cm4gaW5pdGlhbCA/IG9iai5yZWR1Y2UoaXRlcmF0b3IsIG1lbW8pIDogb2JqLnJlZHVjZShpdGVyYXRvcik7XG4gICAgfVxuICAgIGVhY2gob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGxpc3QpIHtcbiAgICAgIGlmICghaW5pdGlhbCkge1xuICAgICAgICBtZW1vID0gdmFsdWU7XG4gICAgICAgIGluaXRpYWwgPSB0cnVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbWVtbyA9IGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgbWVtbywgdmFsdWUsIGluZGV4LCBsaXN0KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBpZiAoIWluaXRpYWwpIHRocm93IG5ldyBUeXBlRXJyb3IocmVkdWNlRXJyb3IpO1xuICAgIHJldHVybiBtZW1vO1xuICB9O1xuXG4gIC8vIFRoZSByaWdodC1hc3NvY2lhdGl2ZSB2ZXJzaW9uIG9mIHJlZHVjZSwgYWxzbyBrbm93biBhcyBgZm9sZHJgLlxuICAvLyBEZWxlZ2F0ZXMgdG8gKipFQ01BU2NyaXB0IDUqKidzIG5hdGl2ZSBgcmVkdWNlUmlnaHRgIGlmIGF2YWlsYWJsZS5cbiAgXy5yZWR1Y2VSaWdodCA9IF8uZm9sZHIgPSBmdW5jdGlvbihvYmosIGl0ZXJhdG9yLCBtZW1vLCBjb250ZXh0KSB7XG4gICAgdmFyIGluaXRpYWwgPSBhcmd1bWVudHMubGVuZ3RoID4gMjtcbiAgICBpZiAob2JqID09IG51bGwpIG9iaiA9IFtdO1xuICAgIGlmIChuYXRpdmVSZWR1Y2VSaWdodCAmJiBvYmoucmVkdWNlUmlnaHQgPT09IG5hdGl2ZVJlZHVjZVJpZ2h0KSB7XG4gICAgICBpZiAoY29udGV4dCkgaXRlcmF0b3IgPSBfLmJpbmQoaXRlcmF0b3IsIGNvbnRleHQpO1xuICAgICAgcmV0dXJuIGluaXRpYWwgPyBvYmoucmVkdWNlUmlnaHQoaXRlcmF0b3IsIG1lbW8pIDogb2JqLnJlZHVjZVJpZ2h0KGl0ZXJhdG9yKTtcbiAgICB9XG4gICAgdmFyIGxlbmd0aCA9IG9iai5sZW5ndGg7XG4gICAgaWYgKGxlbmd0aCAhPT0gK2xlbmd0aCkge1xuICAgICAgdmFyIGtleXMgPSBfLmtleXMob2JqKTtcbiAgICAgIGxlbmd0aCA9IGtleXMubGVuZ3RoO1xuICAgIH1cbiAgICBlYWNoKG9iaiwgZnVuY3Rpb24odmFsdWUsIGluZGV4LCBsaXN0KSB7XG4gICAgICBpbmRleCA9IGtleXMgPyBrZXlzWy0tbGVuZ3RoXSA6IC0tbGVuZ3RoO1xuICAgICAgaWYgKCFpbml0aWFsKSB7XG4gICAgICAgIG1lbW8gPSBvYmpbaW5kZXhdO1xuICAgICAgICBpbml0aWFsID0gdHJ1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG1lbW8gPSBpdGVyYXRvci5jYWxsKGNvbnRleHQsIG1lbW8sIG9ialtpbmRleF0sIGluZGV4LCBsaXN0KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBpZiAoIWluaXRpYWwpIHRocm93IG5ldyBUeXBlRXJyb3IocmVkdWNlRXJyb3IpO1xuICAgIHJldHVybiBtZW1vO1xuICB9O1xuXG4gIC8vIFJldHVybiB0aGUgZmlyc3QgdmFsdWUgd2hpY2ggcGFzc2VzIGEgdHJ1dGggdGVzdC4gQWxpYXNlZCBhcyBgZGV0ZWN0YC5cbiAgXy5maW5kID0gXy5kZXRlY3QgPSBmdW5jdGlvbihvYmosIGl0ZXJhdG9yLCBjb250ZXh0KSB7XG4gICAgdmFyIHJlc3VsdDtcbiAgICBhbnkob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGxpc3QpIHtcbiAgICAgIGlmIChpdGVyYXRvci5jYWxsKGNvbnRleHQsIHZhbHVlLCBpbmRleCwgbGlzdCkpIHtcbiAgICAgICAgcmVzdWx0ID0gdmFsdWU7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG5cbiAgLy8gUmV0dXJuIGFsbCB0aGUgZWxlbWVudHMgdGhhdCBwYXNzIGEgdHJ1dGggdGVzdC5cbiAgLy8gRGVsZWdhdGVzIHRvICoqRUNNQVNjcmlwdCA1KioncyBuYXRpdmUgYGZpbHRlcmAgaWYgYXZhaWxhYmxlLlxuICAvLyBBbGlhc2VkIGFzIGBzZWxlY3RgLlxuICBfLmZpbHRlciA9IF8uc2VsZWN0ID0gZnVuY3Rpb24ob2JqLCBpdGVyYXRvciwgY29udGV4dCkge1xuICAgIHZhciByZXN1bHRzID0gW107XG4gICAgaWYgKG9iaiA9PSBudWxsKSByZXR1cm4gcmVzdWx0cztcbiAgICBpZiAobmF0aXZlRmlsdGVyICYmIG9iai5maWx0ZXIgPT09IG5hdGl2ZUZpbHRlcikgcmV0dXJuIG9iai5maWx0ZXIoaXRlcmF0b3IsIGNvbnRleHQpO1xuICAgIGVhY2gob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGxpc3QpIHtcbiAgICAgIGlmIChpdGVyYXRvci5jYWxsKGNvbnRleHQsIHZhbHVlLCBpbmRleCwgbGlzdCkpIHJlc3VsdHMucHVzaCh2YWx1ZSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3VsdHM7XG4gIH07XG5cbiAgLy8gUmV0dXJuIGFsbCB0aGUgZWxlbWVudHMgZm9yIHdoaWNoIGEgdHJ1dGggdGVzdCBmYWlscy5cbiAgXy5yZWplY3QgPSBmdW5jdGlvbihvYmosIGl0ZXJhdG9yLCBjb250ZXh0KSB7XG4gICAgcmV0dXJuIF8uZmlsdGVyKG9iaiwgZnVuY3Rpb24odmFsdWUsIGluZGV4LCBsaXN0KSB7XG4gICAgICByZXR1cm4gIWl0ZXJhdG9yLmNhbGwoY29udGV4dCwgdmFsdWUsIGluZGV4LCBsaXN0KTtcbiAgICB9LCBjb250ZXh0KTtcbiAgfTtcblxuICAvLyBEZXRlcm1pbmUgd2hldGhlciBhbGwgb2YgdGhlIGVsZW1lbnRzIG1hdGNoIGEgdHJ1dGggdGVzdC5cbiAgLy8gRGVsZWdhdGVzIHRvICoqRUNNQVNjcmlwdCA1KioncyBuYXRpdmUgYGV2ZXJ5YCBpZiBhdmFpbGFibGUuXG4gIC8vIEFsaWFzZWQgYXMgYGFsbGAuXG4gIF8uZXZlcnkgPSBfLmFsbCA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0b3IsIGNvbnRleHQpIHtcbiAgICBpdGVyYXRvciB8fCAoaXRlcmF0b3IgPSBfLmlkZW50aXR5KTtcbiAgICB2YXIgcmVzdWx0ID0gdHJ1ZTtcbiAgICBpZiAob2JqID09IG51bGwpIHJldHVybiByZXN1bHQ7XG4gICAgaWYgKG5hdGl2ZUV2ZXJ5ICYmIG9iai5ldmVyeSA9PT0gbmF0aXZlRXZlcnkpIHJldHVybiBvYmouZXZlcnkoaXRlcmF0b3IsIGNvbnRleHQpO1xuICAgIGVhY2gob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGxpc3QpIHtcbiAgICAgIGlmICghKHJlc3VsdCA9IHJlc3VsdCAmJiBpdGVyYXRvci5jYWxsKGNvbnRleHQsIHZhbHVlLCBpbmRleCwgbGlzdCkpKSByZXR1cm4gYnJlYWtlcjtcbiAgICB9KTtcbiAgICByZXR1cm4gISFyZXN1bHQ7XG4gIH07XG5cbiAgLy8gRGV0ZXJtaW5lIGlmIGF0IGxlYXN0IG9uZSBlbGVtZW50IGluIHRoZSBvYmplY3QgbWF0Y2hlcyBhIHRydXRoIHRlc3QuXG4gIC8vIERlbGVnYXRlcyB0byAqKkVDTUFTY3JpcHQgNSoqJ3MgbmF0aXZlIGBzb21lYCBpZiBhdmFpbGFibGUuXG4gIC8vIEFsaWFzZWQgYXMgYGFueWAuXG4gIHZhciBhbnkgPSBfLnNvbWUgPSBfLmFueSA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0b3IsIGNvbnRleHQpIHtcbiAgICBpdGVyYXRvciB8fCAoaXRlcmF0b3IgPSBfLmlkZW50aXR5KTtcbiAgICB2YXIgcmVzdWx0ID0gZmFsc2U7XG4gICAgaWYgKG9iaiA9PSBudWxsKSByZXR1cm4gcmVzdWx0O1xuICAgIGlmIChuYXRpdmVTb21lICYmIG9iai5zb21lID09PSBuYXRpdmVTb21lKSByZXR1cm4gb2JqLnNvbWUoaXRlcmF0b3IsIGNvbnRleHQpO1xuICAgIGVhY2gob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGxpc3QpIHtcbiAgICAgIGlmIChyZXN1bHQgfHwgKHJlc3VsdCA9IGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgdmFsdWUsIGluZGV4LCBsaXN0KSkpIHJldHVybiBicmVha2VyO1xuICAgIH0pO1xuICAgIHJldHVybiAhIXJlc3VsdDtcbiAgfTtcblxuICAvLyBEZXRlcm1pbmUgaWYgdGhlIGFycmF5IG9yIG9iamVjdCBjb250YWlucyBhIGdpdmVuIHZhbHVlICh1c2luZyBgPT09YCkuXG4gIC8vIEFsaWFzZWQgYXMgYGluY2x1ZGVgLlxuICBfLmNvbnRhaW5zID0gXy5pbmNsdWRlID0gZnVuY3Rpb24ob2JqLCB0YXJnZXQpIHtcbiAgICBpZiAob2JqID09IG51bGwpIHJldHVybiBmYWxzZTtcbiAgICBpZiAobmF0aXZlSW5kZXhPZiAmJiBvYmouaW5kZXhPZiA9PT0gbmF0aXZlSW5kZXhPZikgcmV0dXJuIG9iai5pbmRleE9mKHRhcmdldCkgIT0gLTE7XG4gICAgcmV0dXJuIGFueShvYmosIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICByZXR1cm4gdmFsdWUgPT09IHRhcmdldDtcbiAgICB9KTtcbiAgfTtcblxuICAvLyBJbnZva2UgYSBtZXRob2QgKHdpdGggYXJndW1lbnRzKSBvbiBldmVyeSBpdGVtIGluIGEgY29sbGVjdGlvbi5cbiAgXy5pbnZva2UgPSBmdW5jdGlvbihvYmosIG1ldGhvZCkge1xuICAgIHZhciBhcmdzID0gc2xpY2UuY2FsbChhcmd1bWVudHMsIDIpO1xuICAgIHZhciBpc0Z1bmMgPSBfLmlzRnVuY3Rpb24obWV0aG9kKTtcbiAgICByZXR1cm4gXy5tYXAob2JqLCBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgcmV0dXJuIChpc0Z1bmMgPyBtZXRob2QgOiB2YWx1ZVttZXRob2RdKS5hcHBseSh2YWx1ZSwgYXJncyk7XG4gICAgfSk7XG4gIH07XG5cbiAgLy8gQ29udmVuaWVuY2UgdmVyc2lvbiBvZiBhIGNvbW1vbiB1c2UgY2FzZSBvZiBgbWFwYDogZmV0Y2hpbmcgYSBwcm9wZXJ0eS5cbiAgXy5wbHVjayA9IGZ1bmN0aW9uKG9iaiwga2V5KSB7XG4gICAgcmV0dXJuIF8ubWFwKG9iaiwgZnVuY3Rpb24odmFsdWUpeyByZXR1cm4gdmFsdWVba2V5XTsgfSk7XG4gIH07XG5cbiAgLy8gQ29udmVuaWVuY2UgdmVyc2lvbiBvZiBhIGNvbW1vbiB1c2UgY2FzZSBvZiBgZmlsdGVyYDogc2VsZWN0aW5nIG9ubHkgb2JqZWN0c1xuICAvLyBjb250YWluaW5nIHNwZWNpZmljIGBrZXk6dmFsdWVgIHBhaXJzLlxuICBfLndoZXJlID0gZnVuY3Rpb24ob2JqLCBhdHRycywgZmlyc3QpIHtcbiAgICBpZiAoXy5pc0VtcHR5KGF0dHJzKSkgcmV0dXJuIGZpcnN0ID8gdm9pZCAwIDogW107XG4gICAgcmV0dXJuIF9bZmlyc3QgPyAnZmluZCcgOiAnZmlsdGVyJ10ob2JqLCBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgZm9yICh2YXIga2V5IGluIGF0dHJzKSB7XG4gICAgICAgIGlmIChhdHRyc1trZXldICE9PSB2YWx1ZVtrZXldKSByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9KTtcbiAgfTtcblxuICAvLyBDb252ZW5pZW5jZSB2ZXJzaW9uIG9mIGEgY29tbW9uIHVzZSBjYXNlIG9mIGBmaW5kYDogZ2V0dGluZyB0aGUgZmlyc3Qgb2JqZWN0XG4gIC8vIGNvbnRhaW5pbmcgc3BlY2lmaWMgYGtleTp2YWx1ZWAgcGFpcnMuXG4gIF8uZmluZFdoZXJlID0gZnVuY3Rpb24ob2JqLCBhdHRycykge1xuICAgIHJldHVybiBfLndoZXJlKG9iaiwgYXR0cnMsIHRydWUpO1xuICB9O1xuXG4gIC8vIFJldHVybiB0aGUgbWF4aW11bSBlbGVtZW50IG9yIChlbGVtZW50LWJhc2VkIGNvbXB1dGF0aW9uKS5cbiAgLy8gQ2FuJ3Qgb3B0aW1pemUgYXJyYXlzIG9mIGludGVnZXJzIGxvbmdlciB0aGFuIDY1LDUzNSBlbGVtZW50cy5cbiAgLy8gU2VlIFtXZWJLaXQgQnVnIDgwNzk3XShodHRwczovL2J1Z3Mud2Via2l0Lm9yZy9zaG93X2J1Zy5jZ2k/aWQ9ODA3OTcpXG4gIF8ubWF4ID0gZnVuY3Rpb24ob2JqLCBpdGVyYXRvciwgY29udGV4dCkge1xuICAgIGlmICghaXRlcmF0b3IgJiYgXy5pc0FycmF5KG9iaikgJiYgb2JqWzBdID09PSArb2JqWzBdICYmIG9iai5sZW5ndGggPCA2NTUzNSkge1xuICAgICAgcmV0dXJuIE1hdGgubWF4LmFwcGx5KE1hdGgsIG9iaik7XG4gICAgfVxuICAgIGlmICghaXRlcmF0b3IgJiYgXy5pc0VtcHR5KG9iaikpIHJldHVybiAtSW5maW5pdHk7XG4gICAgdmFyIHJlc3VsdCA9IHtjb21wdXRlZCA6IC1JbmZpbml0eSwgdmFsdWU6IC1JbmZpbml0eX07XG4gICAgZWFjaChvYmosIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCwgbGlzdCkge1xuICAgICAgdmFyIGNvbXB1dGVkID0gaXRlcmF0b3IgPyBpdGVyYXRvci5jYWxsKGNvbnRleHQsIHZhbHVlLCBpbmRleCwgbGlzdCkgOiB2YWx1ZTtcbiAgICAgIGNvbXB1dGVkID4gcmVzdWx0LmNvbXB1dGVkICYmIChyZXN1bHQgPSB7dmFsdWUgOiB2YWx1ZSwgY29tcHV0ZWQgOiBjb21wdXRlZH0pO1xuICAgIH0pO1xuICAgIHJldHVybiByZXN1bHQudmFsdWU7XG4gIH07XG5cbiAgLy8gUmV0dXJuIHRoZSBtaW5pbXVtIGVsZW1lbnQgKG9yIGVsZW1lbnQtYmFzZWQgY29tcHV0YXRpb24pLlxuICBfLm1pbiA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0b3IsIGNvbnRleHQpIHtcbiAgICBpZiAoIWl0ZXJhdG9yICYmIF8uaXNBcnJheShvYmopICYmIG9ialswXSA9PT0gK29ialswXSAmJiBvYmoubGVuZ3RoIDwgNjU1MzUpIHtcbiAgICAgIHJldHVybiBNYXRoLm1pbi5hcHBseShNYXRoLCBvYmopO1xuICAgIH1cbiAgICBpZiAoIWl0ZXJhdG9yICYmIF8uaXNFbXB0eShvYmopKSByZXR1cm4gSW5maW5pdHk7XG4gICAgdmFyIHJlc3VsdCA9IHtjb21wdXRlZCA6IEluZmluaXR5LCB2YWx1ZTogSW5maW5pdHl9O1xuICAgIGVhY2gob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGxpc3QpIHtcbiAgICAgIHZhciBjb21wdXRlZCA9IGl0ZXJhdG9yID8gaXRlcmF0b3IuY2FsbChjb250ZXh0LCB2YWx1ZSwgaW5kZXgsIGxpc3QpIDogdmFsdWU7XG4gICAgICBjb21wdXRlZCA8IHJlc3VsdC5jb21wdXRlZCAmJiAocmVzdWx0ID0ge3ZhbHVlIDogdmFsdWUsIGNvbXB1dGVkIDogY29tcHV0ZWR9KTtcbiAgICB9KTtcbiAgICByZXR1cm4gcmVzdWx0LnZhbHVlO1xuICB9O1xuXG4gIC8vIFNodWZmbGUgYW4gYXJyYXksIHVzaW5nIHRoZSBtb2Rlcm4gdmVyc2lvbiBvZiB0aGUgXG4gIC8vIFtGaXNoZXItWWF0ZXMgc2h1ZmZsZV0oaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9GaXNoZXLigJNZYXRlc19zaHVmZmxlKS5cbiAgXy5zaHVmZmxlID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIHJhbmQ7XG4gICAgdmFyIGluZGV4ID0gMDtcbiAgICB2YXIgc2h1ZmZsZWQgPSBbXTtcbiAgICBlYWNoKG9iaiwgZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgIHJhbmQgPSBfLnJhbmRvbShpbmRleCsrKTtcbiAgICAgIHNodWZmbGVkW2luZGV4IC0gMV0gPSBzaHVmZmxlZFtyYW5kXTtcbiAgICAgIHNodWZmbGVkW3JhbmRdID0gdmFsdWU7XG4gICAgfSk7XG4gICAgcmV0dXJuIHNodWZmbGVkO1xuICB9O1xuXG4gIC8vIFNhbXBsZSAqKm4qKiByYW5kb20gdmFsdWVzIGZyb20gYW4gYXJyYXkuXG4gIC8vIElmICoqbioqIGlzIG5vdCBzcGVjaWZpZWQsIHJldHVybnMgYSBzaW5nbGUgcmFuZG9tIGVsZW1lbnQgZnJvbSB0aGUgYXJyYXkuXG4gIC8vIFRoZSBpbnRlcm5hbCBgZ3VhcmRgIGFyZ3VtZW50IGFsbG93cyBpdCB0byB3b3JrIHdpdGggYG1hcGAuXG4gIF8uc2FtcGxlID0gZnVuY3Rpb24ob2JqLCBuLCBndWFyZCkge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoIDwgMiB8fCBndWFyZCkge1xuICAgICAgcmV0dXJuIG9ialtfLnJhbmRvbShvYmoubGVuZ3RoIC0gMSldO1xuICAgIH1cbiAgICByZXR1cm4gXy5zaHVmZmxlKG9iaikuc2xpY2UoMCwgTWF0aC5tYXgoMCwgbikpO1xuICB9O1xuXG4gIC8vIEFuIGludGVybmFsIGZ1bmN0aW9uIHRvIGdlbmVyYXRlIGxvb2t1cCBpdGVyYXRvcnMuXG4gIHZhciBsb29rdXBJdGVyYXRvciA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgcmV0dXJuIF8uaXNGdW5jdGlvbih2YWx1ZSkgPyB2YWx1ZSA6IGZ1bmN0aW9uKG9iail7IHJldHVybiBvYmpbdmFsdWVdOyB9O1xuICB9O1xuXG4gIC8vIFNvcnQgdGhlIG9iamVjdCdzIHZhbHVlcyBieSBhIGNyaXRlcmlvbiBwcm9kdWNlZCBieSBhbiBpdGVyYXRvci5cbiAgXy5zb3J0QnkgPSBmdW5jdGlvbihvYmosIHZhbHVlLCBjb250ZXh0KSB7XG4gICAgdmFyIGl0ZXJhdG9yID0gbG9va3VwSXRlcmF0b3IodmFsdWUpO1xuICAgIHJldHVybiBfLnBsdWNrKF8ubWFwKG9iaiwgZnVuY3Rpb24odmFsdWUsIGluZGV4LCBsaXN0KSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB2YWx1ZTogdmFsdWUsXG4gICAgICAgIGluZGV4OiBpbmRleCxcbiAgICAgICAgY3JpdGVyaWE6IGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgdmFsdWUsIGluZGV4LCBsaXN0KVxuICAgICAgfTtcbiAgICB9KS5zb3J0KGZ1bmN0aW9uKGxlZnQsIHJpZ2h0KSB7XG4gICAgICB2YXIgYSA9IGxlZnQuY3JpdGVyaWE7XG4gICAgICB2YXIgYiA9IHJpZ2h0LmNyaXRlcmlhO1xuICAgICAgaWYgKGEgIT09IGIpIHtcbiAgICAgICAgaWYgKGEgPiBiIHx8IGEgPT09IHZvaWQgMCkgcmV0dXJuIDE7XG4gICAgICAgIGlmIChhIDwgYiB8fCBiID09PSB2b2lkIDApIHJldHVybiAtMTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBsZWZ0LmluZGV4IC0gcmlnaHQuaW5kZXg7XG4gICAgfSksICd2YWx1ZScpO1xuICB9O1xuXG4gIC8vIEFuIGludGVybmFsIGZ1bmN0aW9uIHVzZWQgZm9yIGFnZ3JlZ2F0ZSBcImdyb3VwIGJ5XCIgb3BlcmF0aW9ucy5cbiAgdmFyIGdyb3VwID0gZnVuY3Rpb24oYmVoYXZpb3IpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24ob2JqLCB2YWx1ZSwgY29udGV4dCkge1xuICAgICAgdmFyIHJlc3VsdCA9IHt9O1xuICAgICAgdmFyIGl0ZXJhdG9yID0gdmFsdWUgPT0gbnVsbCA/IF8uaWRlbnRpdHkgOiBsb29rdXBJdGVyYXRvcih2YWx1ZSk7XG4gICAgICBlYWNoKG9iaiwgZnVuY3Rpb24odmFsdWUsIGluZGV4KSB7XG4gICAgICAgIHZhciBrZXkgPSBpdGVyYXRvci5jYWxsKGNvbnRleHQsIHZhbHVlLCBpbmRleCwgb2JqKTtcbiAgICAgICAgYmVoYXZpb3IocmVzdWx0LCBrZXksIHZhbHVlKTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9O1xuICB9O1xuXG4gIC8vIEdyb3VwcyB0aGUgb2JqZWN0J3MgdmFsdWVzIGJ5IGEgY3JpdGVyaW9uLiBQYXNzIGVpdGhlciBhIHN0cmluZyBhdHRyaWJ1dGVcbiAgLy8gdG8gZ3JvdXAgYnksIG9yIGEgZnVuY3Rpb24gdGhhdCByZXR1cm5zIHRoZSBjcml0ZXJpb24uXG4gIF8uZ3JvdXBCeSA9IGdyb3VwKGZ1bmN0aW9uKHJlc3VsdCwga2V5LCB2YWx1ZSkge1xuICAgIChfLmhhcyhyZXN1bHQsIGtleSkgPyByZXN1bHRba2V5XSA6IChyZXN1bHRba2V5XSA9IFtdKSkucHVzaCh2YWx1ZSk7XG4gIH0pO1xuXG4gIC8vIEluZGV4ZXMgdGhlIG9iamVjdCdzIHZhbHVlcyBieSBhIGNyaXRlcmlvbiwgc2ltaWxhciB0byBgZ3JvdXBCeWAsIGJ1dCBmb3JcbiAgLy8gd2hlbiB5b3Uga25vdyB0aGF0IHlvdXIgaW5kZXggdmFsdWVzIHdpbGwgYmUgdW5pcXVlLlxuICBfLmluZGV4QnkgPSBncm91cChmdW5jdGlvbihyZXN1bHQsIGtleSwgdmFsdWUpIHtcbiAgICByZXN1bHRba2V5XSA9IHZhbHVlO1xuICB9KTtcblxuICAvLyBDb3VudHMgaW5zdGFuY2VzIG9mIGFuIG9iamVjdCB0aGF0IGdyb3VwIGJ5IGEgY2VydGFpbiBjcml0ZXJpb24uIFBhc3NcbiAgLy8gZWl0aGVyIGEgc3RyaW5nIGF0dHJpYnV0ZSB0byBjb3VudCBieSwgb3IgYSBmdW5jdGlvbiB0aGF0IHJldHVybnMgdGhlXG4gIC8vIGNyaXRlcmlvbi5cbiAgXy5jb3VudEJ5ID0gZ3JvdXAoZnVuY3Rpb24ocmVzdWx0LCBrZXkpIHtcbiAgICBfLmhhcyhyZXN1bHQsIGtleSkgPyByZXN1bHRba2V5XSsrIDogcmVzdWx0W2tleV0gPSAxO1xuICB9KTtcblxuICAvLyBVc2UgYSBjb21wYXJhdG9yIGZ1bmN0aW9uIHRvIGZpZ3VyZSBvdXQgdGhlIHNtYWxsZXN0IGluZGV4IGF0IHdoaWNoXG4gIC8vIGFuIG9iamVjdCBzaG91bGQgYmUgaW5zZXJ0ZWQgc28gYXMgdG8gbWFpbnRhaW4gb3JkZXIuIFVzZXMgYmluYXJ5IHNlYXJjaC5cbiAgXy5zb3J0ZWRJbmRleCA9IGZ1bmN0aW9uKGFycmF5LCBvYmosIGl0ZXJhdG9yLCBjb250ZXh0KSB7XG4gICAgaXRlcmF0b3IgPSBpdGVyYXRvciA9PSBudWxsID8gXy5pZGVudGl0eSA6IGxvb2t1cEl0ZXJhdG9yKGl0ZXJhdG9yKTtcbiAgICB2YXIgdmFsdWUgPSBpdGVyYXRvci5jYWxsKGNvbnRleHQsIG9iaik7XG4gICAgdmFyIGxvdyA9IDAsIGhpZ2ggPSBhcnJheS5sZW5ndGg7XG4gICAgd2hpbGUgKGxvdyA8IGhpZ2gpIHtcbiAgICAgIHZhciBtaWQgPSAobG93ICsgaGlnaCkgPj4+IDE7XG4gICAgICBpdGVyYXRvci5jYWxsKGNvbnRleHQsIGFycmF5W21pZF0pIDwgdmFsdWUgPyBsb3cgPSBtaWQgKyAxIDogaGlnaCA9IG1pZDtcbiAgICB9XG4gICAgcmV0dXJuIGxvdztcbiAgfTtcblxuICAvLyBTYWZlbHkgY3JlYXRlIGEgcmVhbCwgbGl2ZSBhcnJheSBmcm9tIGFueXRoaW5nIGl0ZXJhYmxlLlxuICBfLnRvQXJyYXkgPSBmdW5jdGlvbihvYmopIHtcbiAgICBpZiAoIW9iaikgcmV0dXJuIFtdO1xuICAgIGlmIChfLmlzQXJyYXkob2JqKSkgcmV0dXJuIHNsaWNlLmNhbGwob2JqKTtcbiAgICBpZiAob2JqLmxlbmd0aCA9PT0gK29iai5sZW5ndGgpIHJldHVybiBfLm1hcChvYmosIF8uaWRlbnRpdHkpO1xuICAgIHJldHVybiBfLnZhbHVlcyhvYmopO1xuICB9O1xuXG4gIC8vIFJldHVybiB0aGUgbnVtYmVyIG9mIGVsZW1lbnRzIGluIGFuIG9iamVjdC5cbiAgXy5zaXplID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgaWYgKG9iaiA9PSBudWxsKSByZXR1cm4gMDtcbiAgICByZXR1cm4gKG9iai5sZW5ndGggPT09ICtvYmoubGVuZ3RoKSA/IG9iai5sZW5ndGggOiBfLmtleXMob2JqKS5sZW5ndGg7XG4gIH07XG5cbiAgLy8gQXJyYXkgRnVuY3Rpb25zXG4gIC8vIC0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIEdldCB0aGUgZmlyc3QgZWxlbWVudCBvZiBhbiBhcnJheS4gUGFzc2luZyAqKm4qKiB3aWxsIHJldHVybiB0aGUgZmlyc3QgTlxuICAvLyB2YWx1ZXMgaW4gdGhlIGFycmF5LiBBbGlhc2VkIGFzIGBoZWFkYCBhbmQgYHRha2VgLiBUaGUgKipndWFyZCoqIGNoZWNrXG4gIC8vIGFsbG93cyBpdCB0byB3b3JrIHdpdGggYF8ubWFwYC5cbiAgXy5maXJzdCA9IF8uaGVhZCA9IF8udGFrZSA9IGZ1bmN0aW9uKGFycmF5LCBuLCBndWFyZCkge1xuICAgIGlmIChhcnJheSA9PSBudWxsKSByZXR1cm4gdm9pZCAwO1xuICAgIHJldHVybiAobiA9PSBudWxsKSB8fCBndWFyZCA/IGFycmF5WzBdIDogc2xpY2UuY2FsbChhcnJheSwgMCwgbik7XG4gIH07XG5cbiAgLy8gUmV0dXJucyBldmVyeXRoaW5nIGJ1dCB0aGUgbGFzdCBlbnRyeSBvZiB0aGUgYXJyYXkuIEVzcGVjaWFsbHkgdXNlZnVsIG9uXG4gIC8vIHRoZSBhcmd1bWVudHMgb2JqZWN0LiBQYXNzaW5nICoqbioqIHdpbGwgcmV0dXJuIGFsbCB0aGUgdmFsdWVzIGluXG4gIC8vIHRoZSBhcnJheSwgZXhjbHVkaW5nIHRoZSBsYXN0IE4uIFRoZSAqKmd1YXJkKiogY2hlY2sgYWxsb3dzIGl0IHRvIHdvcmsgd2l0aFxuICAvLyBgXy5tYXBgLlxuICBfLmluaXRpYWwgPSBmdW5jdGlvbihhcnJheSwgbiwgZ3VhcmQpIHtcbiAgICByZXR1cm4gc2xpY2UuY2FsbChhcnJheSwgMCwgYXJyYXkubGVuZ3RoIC0gKChuID09IG51bGwpIHx8IGd1YXJkID8gMSA6IG4pKTtcbiAgfTtcblxuICAvLyBHZXQgdGhlIGxhc3QgZWxlbWVudCBvZiBhbiBhcnJheS4gUGFzc2luZyAqKm4qKiB3aWxsIHJldHVybiB0aGUgbGFzdCBOXG4gIC8vIHZhbHVlcyBpbiB0aGUgYXJyYXkuIFRoZSAqKmd1YXJkKiogY2hlY2sgYWxsb3dzIGl0IHRvIHdvcmsgd2l0aCBgXy5tYXBgLlxuICBfLmxhc3QgPSBmdW5jdGlvbihhcnJheSwgbiwgZ3VhcmQpIHtcbiAgICBpZiAoYXJyYXkgPT0gbnVsbCkgcmV0dXJuIHZvaWQgMDtcbiAgICBpZiAoKG4gPT0gbnVsbCkgfHwgZ3VhcmQpIHtcbiAgICAgIHJldHVybiBhcnJheVthcnJheS5sZW5ndGggLSAxXTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHNsaWNlLmNhbGwoYXJyYXksIE1hdGgubWF4KGFycmF5Lmxlbmd0aCAtIG4sIDApKTtcbiAgICB9XG4gIH07XG5cbiAgLy8gUmV0dXJucyBldmVyeXRoaW5nIGJ1dCB0aGUgZmlyc3QgZW50cnkgb2YgdGhlIGFycmF5LiBBbGlhc2VkIGFzIGB0YWlsYCBhbmQgYGRyb3BgLlxuICAvLyBFc3BlY2lhbGx5IHVzZWZ1bCBvbiB0aGUgYXJndW1lbnRzIG9iamVjdC4gUGFzc2luZyBhbiAqKm4qKiB3aWxsIHJldHVyblxuICAvLyB0aGUgcmVzdCBOIHZhbHVlcyBpbiB0aGUgYXJyYXkuIFRoZSAqKmd1YXJkKipcbiAgLy8gY2hlY2sgYWxsb3dzIGl0IHRvIHdvcmsgd2l0aCBgXy5tYXBgLlxuICBfLnJlc3QgPSBfLnRhaWwgPSBfLmRyb3AgPSBmdW5jdGlvbihhcnJheSwgbiwgZ3VhcmQpIHtcbiAgICByZXR1cm4gc2xpY2UuY2FsbChhcnJheSwgKG4gPT0gbnVsbCkgfHwgZ3VhcmQgPyAxIDogbik7XG4gIH07XG5cbiAgLy8gVHJpbSBvdXQgYWxsIGZhbHN5IHZhbHVlcyBmcm9tIGFuIGFycmF5LlxuICBfLmNvbXBhY3QgPSBmdW5jdGlvbihhcnJheSkge1xuICAgIHJldHVybiBfLmZpbHRlcihhcnJheSwgXy5pZGVudGl0eSk7XG4gIH07XG5cbiAgLy8gSW50ZXJuYWwgaW1wbGVtZW50YXRpb24gb2YgYSByZWN1cnNpdmUgYGZsYXR0ZW5gIGZ1bmN0aW9uLlxuICB2YXIgZmxhdHRlbiA9IGZ1bmN0aW9uKGlucHV0LCBzaGFsbG93LCBvdXRwdXQpIHtcbiAgICBpZiAoc2hhbGxvdyAmJiBfLmV2ZXJ5KGlucHV0LCBfLmlzQXJyYXkpKSB7XG4gICAgICByZXR1cm4gY29uY2F0LmFwcGx5KG91dHB1dCwgaW5wdXQpO1xuICAgIH1cbiAgICBlYWNoKGlucHV0LCBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgaWYgKF8uaXNBcnJheSh2YWx1ZSkgfHwgXy5pc0FyZ3VtZW50cyh2YWx1ZSkpIHtcbiAgICAgICAgc2hhbGxvdyA/IHB1c2guYXBwbHkob3V0cHV0LCB2YWx1ZSkgOiBmbGF0dGVuKHZhbHVlLCBzaGFsbG93LCBvdXRwdXQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgb3V0cHV0LnB1c2godmFsdWUpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBvdXRwdXQ7XG4gIH07XG5cbiAgLy8gRmxhdHRlbiBvdXQgYW4gYXJyYXksIGVpdGhlciByZWN1cnNpdmVseSAoYnkgZGVmYXVsdCksIG9yIGp1c3Qgb25lIGxldmVsLlxuICBfLmZsYXR0ZW4gPSBmdW5jdGlvbihhcnJheSwgc2hhbGxvdykge1xuICAgIHJldHVybiBmbGF0dGVuKGFycmF5LCBzaGFsbG93LCBbXSk7XG4gIH07XG5cbiAgLy8gUmV0dXJuIGEgdmVyc2lvbiBvZiB0aGUgYXJyYXkgdGhhdCBkb2VzIG5vdCBjb250YWluIHRoZSBzcGVjaWZpZWQgdmFsdWUocykuXG4gIF8ud2l0aG91dCA9IGZ1bmN0aW9uKGFycmF5KSB7XG4gICAgcmV0dXJuIF8uZGlmZmVyZW5jZShhcnJheSwgc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpKTtcbiAgfTtcblxuICAvLyBQcm9kdWNlIGEgZHVwbGljYXRlLWZyZWUgdmVyc2lvbiBvZiB0aGUgYXJyYXkuIElmIHRoZSBhcnJheSBoYXMgYWxyZWFkeVxuICAvLyBiZWVuIHNvcnRlZCwgeW91IGhhdmUgdGhlIG9wdGlvbiBvZiB1c2luZyBhIGZhc3RlciBhbGdvcml0aG0uXG4gIC8vIEFsaWFzZWQgYXMgYHVuaXF1ZWAuXG4gIF8udW5pcSA9IF8udW5pcXVlID0gZnVuY3Rpb24oYXJyYXksIGlzU29ydGVkLCBpdGVyYXRvciwgY29udGV4dCkge1xuICAgIGlmIChfLmlzRnVuY3Rpb24oaXNTb3J0ZWQpKSB7XG4gICAgICBjb250ZXh0ID0gaXRlcmF0b3I7XG4gICAgICBpdGVyYXRvciA9IGlzU29ydGVkO1xuICAgICAgaXNTb3J0ZWQgPSBmYWxzZTtcbiAgICB9XG4gICAgdmFyIGluaXRpYWwgPSBpdGVyYXRvciA/IF8ubWFwKGFycmF5LCBpdGVyYXRvciwgY29udGV4dCkgOiBhcnJheTtcbiAgICB2YXIgcmVzdWx0cyA9IFtdO1xuICAgIHZhciBzZWVuID0gW107XG4gICAgZWFjaChpbml0aWFsLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgpIHtcbiAgICAgIGlmIChpc1NvcnRlZCA/ICghaW5kZXggfHwgc2VlbltzZWVuLmxlbmd0aCAtIDFdICE9PSB2YWx1ZSkgOiAhXy5jb250YWlucyhzZWVuLCB2YWx1ZSkpIHtcbiAgICAgICAgc2Vlbi5wdXNoKHZhbHVlKTtcbiAgICAgICAgcmVzdWx0cy5wdXNoKGFycmF5W2luZGV4XSk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3VsdHM7XG4gIH07XG5cbiAgLy8gUHJvZHVjZSBhbiBhcnJheSB0aGF0IGNvbnRhaW5zIHRoZSB1bmlvbjogZWFjaCBkaXN0aW5jdCBlbGVtZW50IGZyb20gYWxsIG9mXG4gIC8vIHRoZSBwYXNzZWQtaW4gYXJyYXlzLlxuICBfLnVuaW9uID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIF8udW5pcShfLmZsYXR0ZW4oYXJndW1lbnRzLCB0cnVlKSk7XG4gIH07XG5cbiAgLy8gUHJvZHVjZSBhbiBhcnJheSB0aGF0IGNvbnRhaW5zIGV2ZXJ5IGl0ZW0gc2hhcmVkIGJldHdlZW4gYWxsIHRoZVxuICAvLyBwYXNzZWQtaW4gYXJyYXlzLlxuICBfLmludGVyc2VjdGlvbiA9IGZ1bmN0aW9uKGFycmF5KSB7XG4gICAgdmFyIHJlc3QgPSBzbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgcmV0dXJuIF8uZmlsdGVyKF8udW5pcShhcnJheSksIGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgIHJldHVybiBfLmV2ZXJ5KHJlc3QsIGZ1bmN0aW9uKG90aGVyKSB7XG4gICAgICAgIHJldHVybiBfLmluZGV4T2Yob3RoZXIsIGl0ZW0pID49IDA7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfTtcblxuICAvLyBUYWtlIHRoZSBkaWZmZXJlbmNlIGJldHdlZW4gb25lIGFycmF5IGFuZCBhIG51bWJlciBvZiBvdGhlciBhcnJheXMuXG4gIC8vIE9ubHkgdGhlIGVsZW1lbnRzIHByZXNlbnQgaW4ganVzdCB0aGUgZmlyc3QgYXJyYXkgd2lsbCByZW1haW4uXG4gIF8uZGlmZmVyZW5jZSA9IGZ1bmN0aW9uKGFycmF5KSB7XG4gICAgdmFyIHJlc3QgPSBjb25jYXQuYXBwbHkoQXJyYXlQcm90bywgc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpKTtcbiAgICByZXR1cm4gXy5maWx0ZXIoYXJyYXksIGZ1bmN0aW9uKHZhbHVlKXsgcmV0dXJuICFfLmNvbnRhaW5zKHJlc3QsIHZhbHVlKTsgfSk7XG4gIH07XG5cbiAgLy8gWmlwIHRvZ2V0aGVyIG11bHRpcGxlIGxpc3RzIGludG8gYSBzaW5nbGUgYXJyYXkgLS0gZWxlbWVudHMgdGhhdCBzaGFyZVxuICAvLyBhbiBpbmRleCBnbyB0b2dldGhlci5cbiAgXy56aXAgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgbGVuZ3RoID0gXy5tYXgoXy5wbHVjayhhcmd1bWVudHMsIFwibGVuZ3RoXCIpLmNvbmNhdCgwKSk7XG4gICAgdmFyIHJlc3VsdHMgPSBuZXcgQXJyYXkobGVuZ3RoKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICByZXN1bHRzW2ldID0gXy5wbHVjayhhcmd1bWVudHMsICcnICsgaSk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHRzO1xuICB9O1xuXG4gIC8vIENvbnZlcnRzIGxpc3RzIGludG8gb2JqZWN0cy4gUGFzcyBlaXRoZXIgYSBzaW5nbGUgYXJyYXkgb2YgYFtrZXksIHZhbHVlXWBcbiAgLy8gcGFpcnMsIG9yIHR3byBwYXJhbGxlbCBhcnJheXMgb2YgdGhlIHNhbWUgbGVuZ3RoIC0tIG9uZSBvZiBrZXlzLCBhbmQgb25lIG9mXG4gIC8vIHRoZSBjb3JyZXNwb25kaW5nIHZhbHVlcy5cbiAgXy5vYmplY3QgPSBmdW5jdGlvbihsaXN0LCB2YWx1ZXMpIHtcbiAgICBpZiAobGlzdCA9PSBudWxsKSByZXR1cm4ge307XG4gICAgdmFyIHJlc3VsdCA9IHt9O1xuICAgIGZvciAodmFyIGkgPSAwLCBsZW5ndGggPSBsaXN0Lmxlbmd0aDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAodmFsdWVzKSB7XG4gICAgICAgIHJlc3VsdFtsaXN0W2ldXSA9IHZhbHVlc1tpXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlc3VsdFtsaXN0W2ldWzBdXSA9IGxpc3RbaV1bMV07XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG5cbiAgLy8gSWYgdGhlIGJyb3dzZXIgZG9lc24ndCBzdXBwbHkgdXMgd2l0aCBpbmRleE9mIChJJ20gbG9va2luZyBhdCB5b3UsICoqTVNJRSoqKSxcbiAgLy8gd2UgbmVlZCB0aGlzIGZ1bmN0aW9uLiBSZXR1cm4gdGhlIHBvc2l0aW9uIG9mIHRoZSBmaXJzdCBvY2N1cnJlbmNlIG9mIGFuXG4gIC8vIGl0ZW0gaW4gYW4gYXJyYXksIG9yIC0xIGlmIHRoZSBpdGVtIGlzIG5vdCBpbmNsdWRlZCBpbiB0aGUgYXJyYXkuXG4gIC8vIERlbGVnYXRlcyB0byAqKkVDTUFTY3JpcHQgNSoqJ3MgbmF0aXZlIGBpbmRleE9mYCBpZiBhdmFpbGFibGUuXG4gIC8vIElmIHRoZSBhcnJheSBpcyBsYXJnZSBhbmQgYWxyZWFkeSBpbiBzb3J0IG9yZGVyLCBwYXNzIGB0cnVlYFxuICAvLyBmb3IgKippc1NvcnRlZCoqIHRvIHVzZSBiaW5hcnkgc2VhcmNoLlxuICBfLmluZGV4T2YgPSBmdW5jdGlvbihhcnJheSwgaXRlbSwgaXNTb3J0ZWQpIHtcbiAgICBpZiAoYXJyYXkgPT0gbnVsbCkgcmV0dXJuIC0xO1xuICAgIHZhciBpID0gMCwgbGVuZ3RoID0gYXJyYXkubGVuZ3RoO1xuICAgIGlmIChpc1NvcnRlZCkge1xuICAgICAgaWYgKHR5cGVvZiBpc1NvcnRlZCA9PSAnbnVtYmVyJykge1xuICAgICAgICBpID0gKGlzU29ydGVkIDwgMCA/IE1hdGgubWF4KDAsIGxlbmd0aCArIGlzU29ydGVkKSA6IGlzU29ydGVkKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGkgPSBfLnNvcnRlZEluZGV4KGFycmF5LCBpdGVtKTtcbiAgICAgICAgcmV0dXJuIGFycmF5W2ldID09PSBpdGVtID8gaSA6IC0xO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAobmF0aXZlSW5kZXhPZiAmJiBhcnJheS5pbmRleE9mID09PSBuYXRpdmVJbmRleE9mKSByZXR1cm4gYXJyYXkuaW5kZXhPZihpdGVtLCBpc1NvcnRlZCk7XG4gICAgZm9yICg7IGkgPCBsZW5ndGg7IGkrKykgaWYgKGFycmF5W2ldID09PSBpdGVtKSByZXR1cm4gaTtcbiAgICByZXR1cm4gLTE7XG4gIH07XG5cbiAgLy8gRGVsZWdhdGVzIHRvICoqRUNNQVNjcmlwdCA1KioncyBuYXRpdmUgYGxhc3RJbmRleE9mYCBpZiBhdmFpbGFibGUuXG4gIF8ubGFzdEluZGV4T2YgPSBmdW5jdGlvbihhcnJheSwgaXRlbSwgZnJvbSkge1xuICAgIGlmIChhcnJheSA9PSBudWxsKSByZXR1cm4gLTE7XG4gICAgdmFyIGhhc0luZGV4ID0gZnJvbSAhPSBudWxsO1xuICAgIGlmIChuYXRpdmVMYXN0SW5kZXhPZiAmJiBhcnJheS5sYXN0SW5kZXhPZiA9PT0gbmF0aXZlTGFzdEluZGV4T2YpIHtcbiAgICAgIHJldHVybiBoYXNJbmRleCA/IGFycmF5Lmxhc3RJbmRleE9mKGl0ZW0sIGZyb20pIDogYXJyYXkubGFzdEluZGV4T2YoaXRlbSk7XG4gICAgfVxuICAgIHZhciBpID0gKGhhc0luZGV4ID8gZnJvbSA6IGFycmF5Lmxlbmd0aCk7XG4gICAgd2hpbGUgKGktLSkgaWYgKGFycmF5W2ldID09PSBpdGVtKSByZXR1cm4gaTtcbiAgICByZXR1cm4gLTE7XG4gIH07XG5cbiAgLy8gR2VuZXJhdGUgYW4gaW50ZWdlciBBcnJheSBjb250YWluaW5nIGFuIGFyaXRobWV0aWMgcHJvZ3Jlc3Npb24uIEEgcG9ydCBvZlxuICAvLyB0aGUgbmF0aXZlIFB5dGhvbiBgcmFuZ2UoKWAgZnVuY3Rpb24uIFNlZVxuICAvLyBbdGhlIFB5dGhvbiBkb2N1bWVudGF0aW9uXShodHRwOi8vZG9jcy5weXRob24ub3JnL2xpYnJhcnkvZnVuY3Rpb25zLmh0bWwjcmFuZ2UpLlxuICBfLnJhbmdlID0gZnVuY3Rpb24oc3RhcnQsIHN0b3AsIHN0ZXApIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA8PSAxKSB7XG4gICAgICBzdG9wID0gc3RhcnQgfHwgMDtcbiAgICAgIHN0YXJ0ID0gMDtcbiAgICB9XG4gICAgc3RlcCA9IGFyZ3VtZW50c1syXSB8fCAxO1xuXG4gICAgdmFyIGxlbmd0aCA9IE1hdGgubWF4KE1hdGguY2VpbCgoc3RvcCAtIHN0YXJ0KSAvIHN0ZXApLCAwKTtcbiAgICB2YXIgaWR4ID0gMDtcbiAgICB2YXIgcmFuZ2UgPSBuZXcgQXJyYXkobGVuZ3RoKTtcblxuICAgIHdoaWxlKGlkeCA8IGxlbmd0aCkge1xuICAgICAgcmFuZ2VbaWR4KytdID0gc3RhcnQ7XG4gICAgICBzdGFydCArPSBzdGVwO1xuICAgIH1cblxuICAgIHJldHVybiByYW5nZTtcbiAgfTtcblxuICAvLyBGdW5jdGlvbiAoYWhlbSkgRnVuY3Rpb25zXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIFJldXNhYmxlIGNvbnN0cnVjdG9yIGZ1bmN0aW9uIGZvciBwcm90b3R5cGUgc2V0dGluZy5cbiAgdmFyIGN0b3IgPSBmdW5jdGlvbigpe307XG5cbiAgLy8gQ3JlYXRlIGEgZnVuY3Rpb24gYm91bmQgdG8gYSBnaXZlbiBvYmplY3QgKGFzc2lnbmluZyBgdGhpc2AsIGFuZCBhcmd1bWVudHMsXG4gIC8vIG9wdGlvbmFsbHkpLiBEZWxlZ2F0ZXMgdG8gKipFQ01BU2NyaXB0IDUqKidzIG5hdGl2ZSBgRnVuY3Rpb24uYmluZGAgaWZcbiAgLy8gYXZhaWxhYmxlLlxuICBfLmJpbmQgPSBmdW5jdGlvbihmdW5jLCBjb250ZXh0KSB7XG4gICAgdmFyIGFyZ3MsIGJvdW5kO1xuICAgIGlmIChuYXRpdmVCaW5kICYmIGZ1bmMuYmluZCA9PT0gbmF0aXZlQmluZCkgcmV0dXJuIG5hdGl2ZUJpbmQuYXBwbHkoZnVuYywgc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpKTtcbiAgICBpZiAoIV8uaXNGdW5jdGlvbihmdW5jKSkgdGhyb3cgbmV3IFR5cGVFcnJvcjtcbiAgICBhcmdzID0gc2xpY2UuY2FsbChhcmd1bWVudHMsIDIpO1xuICAgIHJldHVybiBib3VuZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIGJvdW5kKSkgcmV0dXJuIGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncy5jb25jYXQoc2xpY2UuY2FsbChhcmd1bWVudHMpKSk7XG4gICAgICBjdG9yLnByb3RvdHlwZSA9IGZ1bmMucHJvdG90eXBlO1xuICAgICAgdmFyIHNlbGYgPSBuZXcgY3RvcjtcbiAgICAgIGN0b3IucHJvdG90eXBlID0gbnVsbDtcbiAgICAgIHZhciByZXN1bHQgPSBmdW5jLmFwcGx5KHNlbGYsIGFyZ3MuY29uY2F0KHNsaWNlLmNhbGwoYXJndW1lbnRzKSkpO1xuICAgICAgaWYgKE9iamVjdChyZXN1bHQpID09PSByZXN1bHQpIHJldHVybiByZXN1bHQ7XG4gICAgICByZXR1cm4gc2VsZjtcbiAgICB9O1xuICB9O1xuXG4gIC8vIFBhcnRpYWxseSBhcHBseSBhIGZ1bmN0aW9uIGJ5IGNyZWF0aW5nIGEgdmVyc2lvbiB0aGF0IGhhcyBoYWQgc29tZSBvZiBpdHNcbiAgLy8gYXJndW1lbnRzIHByZS1maWxsZWQsIHdpdGhvdXQgY2hhbmdpbmcgaXRzIGR5bmFtaWMgYHRoaXNgIGNvbnRleHQuXG4gIF8ucGFydGlhbCA9IGZ1bmN0aW9uKGZ1bmMpIHtcbiAgICB2YXIgYXJncyA9IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gZnVuYy5hcHBseSh0aGlzLCBhcmdzLmNvbmNhdChzbGljZS5jYWxsKGFyZ3VtZW50cykpKTtcbiAgICB9O1xuICB9O1xuXG4gIC8vIEJpbmQgYWxsIG9mIGFuIG9iamVjdCdzIG1ldGhvZHMgdG8gdGhhdCBvYmplY3QuIFVzZWZ1bCBmb3IgZW5zdXJpbmcgdGhhdFxuICAvLyBhbGwgY2FsbGJhY2tzIGRlZmluZWQgb24gYW4gb2JqZWN0IGJlbG9uZyB0byBpdC5cbiAgXy5iaW5kQWxsID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIGZ1bmNzID0gc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgIGlmIChmdW5jcy5sZW5ndGggPT09IDApIHRocm93IG5ldyBFcnJvcihcImJpbmRBbGwgbXVzdCBiZSBwYXNzZWQgZnVuY3Rpb24gbmFtZXNcIik7XG4gICAgZWFjaChmdW5jcywgZnVuY3Rpb24oZikgeyBvYmpbZl0gPSBfLmJpbmQob2JqW2ZdLCBvYmopOyB9KTtcbiAgICByZXR1cm4gb2JqO1xuICB9O1xuXG4gIC8vIE1lbW9pemUgYW4gZXhwZW5zaXZlIGZ1bmN0aW9uIGJ5IHN0b3JpbmcgaXRzIHJlc3VsdHMuXG4gIF8ubWVtb2l6ZSA9IGZ1bmN0aW9uKGZ1bmMsIGhhc2hlcikge1xuICAgIHZhciBtZW1vID0ge307XG4gICAgaGFzaGVyIHx8IChoYXNoZXIgPSBfLmlkZW50aXR5KTtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIga2V5ID0gaGFzaGVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICByZXR1cm4gXy5oYXMobWVtbywga2V5KSA/IG1lbW9ba2V5XSA6IChtZW1vW2tleV0gPSBmdW5jLmFwcGx5KHRoaXMsIGFyZ3VtZW50cykpO1xuICAgIH07XG4gIH07XG5cbiAgLy8gRGVsYXlzIGEgZnVuY3Rpb24gZm9yIHRoZSBnaXZlbiBudW1iZXIgb2YgbWlsbGlzZWNvbmRzLCBhbmQgdGhlbiBjYWxsc1xuICAvLyBpdCB3aXRoIHRoZSBhcmd1bWVudHMgc3VwcGxpZWQuXG4gIF8uZGVsYXkgPSBmdW5jdGlvbihmdW5jLCB3YWl0KSB7XG4gICAgdmFyIGFyZ3MgPSBzbGljZS5jYWxsKGFyZ3VtZW50cywgMik7XG4gICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuY3Rpb24oKXsgcmV0dXJuIGZ1bmMuYXBwbHkobnVsbCwgYXJncyk7IH0sIHdhaXQpO1xuICB9O1xuXG4gIC8vIERlZmVycyBhIGZ1bmN0aW9uLCBzY2hlZHVsaW5nIGl0IHRvIHJ1biBhZnRlciB0aGUgY3VycmVudCBjYWxsIHN0YWNrIGhhc1xuICAvLyBjbGVhcmVkLlxuICBfLmRlZmVyID0gZnVuY3Rpb24oZnVuYykge1xuICAgIHJldHVybiBfLmRlbGF5LmFwcGx5KF8sIFtmdW5jLCAxXS5jb25jYXQoc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpKSk7XG4gIH07XG5cbiAgLy8gUmV0dXJucyBhIGZ1bmN0aW9uLCB0aGF0LCB3aGVuIGludm9rZWQsIHdpbGwgb25seSBiZSB0cmlnZ2VyZWQgYXQgbW9zdCBvbmNlXG4gIC8vIGR1cmluZyBhIGdpdmVuIHdpbmRvdyBvZiB0aW1lLiBOb3JtYWxseSwgdGhlIHRocm90dGxlZCBmdW5jdGlvbiB3aWxsIHJ1blxuICAvLyBhcyBtdWNoIGFzIGl0IGNhbiwgd2l0aG91dCBldmVyIGdvaW5nIG1vcmUgdGhhbiBvbmNlIHBlciBgd2FpdGAgZHVyYXRpb247XG4gIC8vIGJ1dCBpZiB5b3UnZCBsaWtlIHRvIGRpc2FibGUgdGhlIGV4ZWN1dGlvbiBvbiB0aGUgbGVhZGluZyBlZGdlLCBwYXNzXG4gIC8vIGB7bGVhZGluZzogZmFsc2V9YC4gVG8gZGlzYWJsZSBleGVjdXRpb24gb24gdGhlIHRyYWlsaW5nIGVkZ2UsIGRpdHRvLlxuICBfLnRocm90dGxlID0gZnVuY3Rpb24oZnVuYywgd2FpdCwgb3B0aW9ucykge1xuICAgIHZhciBjb250ZXh0LCBhcmdzLCByZXN1bHQ7XG4gICAgdmFyIHRpbWVvdXQgPSBudWxsO1xuICAgIHZhciBwcmV2aW91cyA9IDA7XG4gICAgb3B0aW9ucyB8fCAob3B0aW9ucyA9IHt9KTtcbiAgICB2YXIgbGF0ZXIgPSBmdW5jdGlvbigpIHtcbiAgICAgIHByZXZpb3VzID0gb3B0aW9ucy5sZWFkaW5nID09PSBmYWxzZSA/IDAgOiBuZXcgRGF0ZTtcbiAgICAgIHRpbWVvdXQgPSBudWxsO1xuICAgICAgcmVzdWx0ID0gZnVuYy5hcHBseShjb250ZXh0LCBhcmdzKTtcbiAgICB9O1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBub3cgPSBuZXcgRGF0ZTtcbiAgICAgIGlmICghcHJldmlvdXMgJiYgb3B0aW9ucy5sZWFkaW5nID09PSBmYWxzZSkgcHJldmlvdXMgPSBub3c7XG4gICAgICB2YXIgcmVtYWluaW5nID0gd2FpdCAtIChub3cgLSBwcmV2aW91cyk7XG4gICAgICBjb250ZXh0ID0gdGhpcztcbiAgICAgIGFyZ3MgPSBhcmd1bWVudHM7XG4gICAgICBpZiAocmVtYWluaW5nIDw9IDApIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuICAgICAgICB0aW1lb3V0ID0gbnVsbDtcbiAgICAgICAgcHJldmlvdXMgPSBub3c7XG4gICAgICAgIHJlc3VsdCA9IGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncyk7XG4gICAgICB9IGVsc2UgaWYgKCF0aW1lb3V0ICYmIG9wdGlvbnMudHJhaWxpbmcgIT09IGZhbHNlKSB7XG4gICAgICAgIHRpbWVvdXQgPSBzZXRUaW1lb3V0KGxhdGVyLCByZW1haW5pbmcpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9O1xuICB9O1xuXG4gIC8vIFJldHVybnMgYSBmdW5jdGlvbiwgdGhhdCwgYXMgbG9uZyBhcyBpdCBjb250aW51ZXMgdG8gYmUgaW52b2tlZCwgd2lsbCBub3RcbiAgLy8gYmUgdHJpZ2dlcmVkLiBUaGUgZnVuY3Rpb24gd2lsbCBiZSBjYWxsZWQgYWZ0ZXIgaXQgc3RvcHMgYmVpbmcgY2FsbGVkIGZvclxuICAvLyBOIG1pbGxpc2Vjb25kcy4gSWYgYGltbWVkaWF0ZWAgaXMgcGFzc2VkLCB0cmlnZ2VyIHRoZSBmdW5jdGlvbiBvbiB0aGVcbiAgLy8gbGVhZGluZyBlZGdlLCBpbnN0ZWFkIG9mIHRoZSB0cmFpbGluZy5cbiAgXy5kZWJvdW5jZSA9IGZ1bmN0aW9uKGZ1bmMsIHdhaXQsIGltbWVkaWF0ZSkge1xuICAgIHZhciB0aW1lb3V0LCBhcmdzLCBjb250ZXh0LCB0aW1lc3RhbXAsIHJlc3VsdDtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICBjb250ZXh0ID0gdGhpcztcbiAgICAgIGFyZ3MgPSBhcmd1bWVudHM7XG4gICAgICB0aW1lc3RhbXAgPSBuZXcgRGF0ZSgpO1xuICAgICAgdmFyIGxhdGVyID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBsYXN0ID0gKG5ldyBEYXRlKCkpIC0gdGltZXN0YW1wO1xuICAgICAgICBpZiAobGFzdCA8IHdhaXQpIHtcbiAgICAgICAgICB0aW1lb3V0ID0gc2V0VGltZW91dChsYXRlciwgd2FpdCAtIGxhc3QpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRpbWVvdXQgPSBudWxsO1xuICAgICAgICAgIGlmICghaW1tZWRpYXRlKSByZXN1bHQgPSBmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgICAgdmFyIGNhbGxOb3cgPSBpbW1lZGlhdGUgJiYgIXRpbWVvdXQ7XG4gICAgICBpZiAoIXRpbWVvdXQpIHtcbiAgICAgICAgdGltZW91dCA9IHNldFRpbWVvdXQobGF0ZXIsIHdhaXQpO1xuICAgICAgfVxuICAgICAgaWYgKGNhbGxOb3cpIHJlc3VsdCA9IGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncyk7XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH07XG4gIH07XG5cbiAgLy8gUmV0dXJucyBhIGZ1bmN0aW9uIHRoYXQgd2lsbCBiZSBleGVjdXRlZCBhdCBtb3N0IG9uZSB0aW1lLCBubyBtYXR0ZXIgaG93XG4gIC8vIG9mdGVuIHlvdSBjYWxsIGl0LiBVc2VmdWwgZm9yIGxhenkgaW5pdGlhbGl6YXRpb24uXG4gIF8ub25jZSA9IGZ1bmN0aW9uKGZ1bmMpIHtcbiAgICB2YXIgcmFuID0gZmFsc2UsIG1lbW87XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKHJhbikgcmV0dXJuIG1lbW87XG4gICAgICByYW4gPSB0cnVlO1xuICAgICAgbWVtbyA9IGZ1bmMuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgIGZ1bmMgPSBudWxsO1xuICAgICAgcmV0dXJuIG1lbW87XG4gICAgfTtcbiAgfTtcblxuICAvLyBSZXR1cm5zIHRoZSBmaXJzdCBmdW5jdGlvbiBwYXNzZWQgYXMgYW4gYXJndW1lbnQgdG8gdGhlIHNlY29uZCxcbiAgLy8gYWxsb3dpbmcgeW91IHRvIGFkanVzdCBhcmd1bWVudHMsIHJ1biBjb2RlIGJlZm9yZSBhbmQgYWZ0ZXIsIGFuZFxuICAvLyBjb25kaXRpb25hbGx5IGV4ZWN1dGUgdGhlIG9yaWdpbmFsIGZ1bmN0aW9uLlxuICBfLndyYXAgPSBmdW5jdGlvbihmdW5jLCB3cmFwcGVyKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGFyZ3MgPSBbZnVuY107XG4gICAgICBwdXNoLmFwcGx5KGFyZ3MsIGFyZ3VtZW50cyk7XG4gICAgICByZXR1cm4gd3JhcHBlci5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICB9O1xuICB9O1xuXG4gIC8vIFJldHVybnMgYSBmdW5jdGlvbiB0aGF0IGlzIHRoZSBjb21wb3NpdGlvbiBvZiBhIGxpc3Qgb2YgZnVuY3Rpb25zLCBlYWNoXG4gIC8vIGNvbnN1bWluZyB0aGUgcmV0dXJuIHZhbHVlIG9mIHRoZSBmdW5jdGlvbiB0aGF0IGZvbGxvd3MuXG4gIF8uY29tcG9zZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBmdW5jcyA9IGFyZ3VtZW50cztcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgYXJncyA9IGFyZ3VtZW50cztcbiAgICAgIGZvciAodmFyIGkgPSBmdW5jcy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICBhcmdzID0gW2Z1bmNzW2ldLmFwcGx5KHRoaXMsIGFyZ3MpXTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBhcmdzWzBdO1xuICAgIH07XG4gIH07XG5cbiAgLy8gUmV0dXJucyBhIGZ1bmN0aW9uIHRoYXQgd2lsbCBvbmx5IGJlIGV4ZWN1dGVkIGFmdGVyIGJlaW5nIGNhbGxlZCBOIHRpbWVzLlxuICBfLmFmdGVyID0gZnVuY3Rpb24odGltZXMsIGZ1bmMpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoLS10aW1lcyA8IDEpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmMuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgIH1cbiAgICB9O1xuICB9O1xuXG4gIC8vIE9iamVjdCBGdW5jdGlvbnNcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIFJldHJpZXZlIHRoZSBuYW1lcyBvZiBhbiBvYmplY3QncyBwcm9wZXJ0aWVzLlxuICAvLyBEZWxlZ2F0ZXMgdG8gKipFQ01BU2NyaXB0IDUqKidzIG5hdGl2ZSBgT2JqZWN0LmtleXNgXG4gIF8ua2V5cyA9IG5hdGl2ZUtleXMgfHwgZnVuY3Rpb24ob2JqKSB7XG4gICAgaWYgKG9iaiAhPT0gT2JqZWN0KG9iaikpIHRocm93IG5ldyBUeXBlRXJyb3IoJ0ludmFsaWQgb2JqZWN0Jyk7XG4gICAgdmFyIGtleXMgPSBbXTtcbiAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSBpZiAoXy5oYXMob2JqLCBrZXkpKSBrZXlzLnB1c2goa2V5KTtcbiAgICByZXR1cm4ga2V5cztcbiAgfTtcblxuICAvLyBSZXRyaWV2ZSB0aGUgdmFsdWVzIG9mIGFuIG9iamVjdCdzIHByb3BlcnRpZXMuXG4gIF8udmFsdWVzID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIGtleXMgPSBfLmtleXMob2JqKTtcbiAgICB2YXIgbGVuZ3RoID0ga2V5cy5sZW5ndGg7XG4gICAgdmFyIHZhbHVlcyA9IG5ldyBBcnJheShsZW5ndGgpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhbHVlc1tpXSA9IG9ialtrZXlzW2ldXTtcbiAgICB9XG4gICAgcmV0dXJuIHZhbHVlcztcbiAgfTtcblxuICAvLyBDb252ZXJ0IGFuIG9iamVjdCBpbnRvIGEgbGlzdCBvZiBgW2tleSwgdmFsdWVdYCBwYWlycy5cbiAgXy5wYWlycyA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHZhciBrZXlzID0gXy5rZXlzKG9iaik7XG4gICAgdmFyIGxlbmd0aCA9IGtleXMubGVuZ3RoO1xuICAgIHZhciBwYWlycyA9IG5ldyBBcnJheShsZW5ndGgpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIHBhaXJzW2ldID0gW2tleXNbaV0sIG9ialtrZXlzW2ldXV07XG4gICAgfVxuICAgIHJldHVybiBwYWlycztcbiAgfTtcblxuICAvLyBJbnZlcnQgdGhlIGtleXMgYW5kIHZhbHVlcyBvZiBhbiBvYmplY3QuIFRoZSB2YWx1ZXMgbXVzdCBiZSBzZXJpYWxpemFibGUuXG4gIF8uaW52ZXJ0ID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIHJlc3VsdCA9IHt9O1xuICAgIHZhciBrZXlzID0gXy5rZXlzKG9iaik7XG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbmd0aCA9IGtleXMubGVuZ3RoOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIHJlc3VsdFtvYmpba2V5c1tpXV1dID0ga2V5c1tpXTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcblxuICAvLyBSZXR1cm4gYSBzb3J0ZWQgbGlzdCBvZiB0aGUgZnVuY3Rpb24gbmFtZXMgYXZhaWxhYmxlIG9uIHRoZSBvYmplY3QuXG4gIC8vIEFsaWFzZWQgYXMgYG1ldGhvZHNgXG4gIF8uZnVuY3Rpb25zID0gXy5tZXRob2RzID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIG5hbWVzID0gW107XG4gICAgZm9yICh2YXIga2V5IGluIG9iaikge1xuICAgICAgaWYgKF8uaXNGdW5jdGlvbihvYmpba2V5XSkpIG5hbWVzLnB1c2goa2V5KTtcbiAgICB9XG4gICAgcmV0dXJuIG5hbWVzLnNvcnQoKTtcbiAgfTtcblxuICAvLyBFeHRlbmQgYSBnaXZlbiBvYmplY3Qgd2l0aCBhbGwgdGhlIHByb3BlcnRpZXMgaW4gcGFzc2VkLWluIG9iamVjdChzKS5cbiAgXy5leHRlbmQgPSBmdW5jdGlvbihvYmopIHtcbiAgICBlYWNoKHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSwgZnVuY3Rpb24oc291cmNlKSB7XG4gICAgICBpZiAoc291cmNlKSB7XG4gICAgICAgIGZvciAodmFyIHByb3AgaW4gc291cmNlKSB7XG4gICAgICAgICAgb2JqW3Byb3BdID0gc291cmNlW3Byb3BdO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIG9iajtcbiAgfTtcblxuICAvLyBSZXR1cm4gYSBjb3B5IG9mIHRoZSBvYmplY3Qgb25seSBjb250YWluaW5nIHRoZSB3aGl0ZWxpc3RlZCBwcm9wZXJ0aWVzLlxuICBfLnBpY2sgPSBmdW5jdGlvbihvYmopIHtcbiAgICB2YXIgY29weSA9IHt9O1xuICAgIHZhciBrZXlzID0gY29uY2F0LmFwcGx5KEFycmF5UHJvdG8sIHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSk7XG4gICAgZWFjaChrZXlzLCBmdW5jdGlvbihrZXkpIHtcbiAgICAgIGlmIChrZXkgaW4gb2JqKSBjb3B5W2tleV0gPSBvYmpba2V5XTtcbiAgICB9KTtcbiAgICByZXR1cm4gY29weTtcbiAgfTtcblxuICAgLy8gUmV0dXJuIGEgY29weSBvZiB0aGUgb2JqZWN0IHdpdGhvdXQgdGhlIGJsYWNrbGlzdGVkIHByb3BlcnRpZXMuXG4gIF8ub21pdCA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHZhciBjb3B5ID0ge307XG4gICAgdmFyIGtleXMgPSBjb25jYXQuYXBwbHkoQXJyYXlQcm90bywgc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpKTtcbiAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgICBpZiAoIV8uY29udGFpbnMoa2V5cywga2V5KSkgY29weVtrZXldID0gb2JqW2tleV07XG4gICAgfVxuICAgIHJldHVybiBjb3B5O1xuICB9O1xuXG4gIC8vIEZpbGwgaW4gYSBnaXZlbiBvYmplY3Qgd2l0aCBkZWZhdWx0IHByb3BlcnRpZXMuXG4gIF8uZGVmYXVsdHMgPSBmdW5jdGlvbihvYmopIHtcbiAgICBlYWNoKHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSwgZnVuY3Rpb24oc291cmNlKSB7XG4gICAgICBpZiAoc291cmNlKSB7XG4gICAgICAgIGZvciAodmFyIHByb3AgaW4gc291cmNlKSB7XG4gICAgICAgICAgaWYgKG9ialtwcm9wXSA9PT0gdm9pZCAwKSBvYmpbcHJvcF0gPSBzb3VyY2VbcHJvcF07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gb2JqO1xuICB9O1xuXG4gIC8vIENyZWF0ZSBhIChzaGFsbG93LWNsb25lZCkgZHVwbGljYXRlIG9mIGFuIG9iamVjdC5cbiAgXy5jbG9uZSA9IGZ1bmN0aW9uKG9iaikge1xuICAgIGlmICghXy5pc09iamVjdChvYmopKSByZXR1cm4gb2JqO1xuICAgIHJldHVybiBfLmlzQXJyYXkob2JqKSA/IG9iai5zbGljZSgpIDogXy5leHRlbmQoe30sIG9iaik7XG4gIH07XG5cbiAgLy8gSW52b2tlcyBpbnRlcmNlcHRvciB3aXRoIHRoZSBvYmosIGFuZCB0aGVuIHJldHVybnMgb2JqLlxuICAvLyBUaGUgcHJpbWFyeSBwdXJwb3NlIG9mIHRoaXMgbWV0aG9kIGlzIHRvIFwidGFwIGludG9cIiBhIG1ldGhvZCBjaGFpbiwgaW5cbiAgLy8gb3JkZXIgdG8gcGVyZm9ybSBvcGVyYXRpb25zIG9uIGludGVybWVkaWF0ZSByZXN1bHRzIHdpdGhpbiB0aGUgY2hhaW4uXG4gIF8udGFwID0gZnVuY3Rpb24ob2JqLCBpbnRlcmNlcHRvcikge1xuICAgIGludGVyY2VwdG9yKG9iaik7XG4gICAgcmV0dXJuIG9iajtcbiAgfTtcblxuICAvLyBJbnRlcm5hbCByZWN1cnNpdmUgY29tcGFyaXNvbiBmdW5jdGlvbiBmb3IgYGlzRXF1YWxgLlxuICB2YXIgZXEgPSBmdW5jdGlvbihhLCBiLCBhU3RhY2ssIGJTdGFjaykge1xuICAgIC8vIElkZW50aWNhbCBvYmplY3RzIGFyZSBlcXVhbC4gYDAgPT09IC0wYCwgYnV0IHRoZXkgYXJlbid0IGlkZW50aWNhbC5cbiAgICAvLyBTZWUgdGhlIFtIYXJtb255IGBlZ2FsYCBwcm9wb3NhbF0oaHR0cDovL3dpa2kuZWNtYXNjcmlwdC5vcmcvZG9rdS5waHA/aWQ9aGFybW9ueTplZ2FsKS5cbiAgICBpZiAoYSA9PT0gYikgcmV0dXJuIGEgIT09IDAgfHwgMSAvIGEgPT0gMSAvIGI7XG4gICAgLy8gQSBzdHJpY3QgY29tcGFyaXNvbiBpcyBuZWNlc3NhcnkgYmVjYXVzZSBgbnVsbCA9PSB1bmRlZmluZWRgLlxuICAgIGlmIChhID09IG51bGwgfHwgYiA9PSBudWxsKSByZXR1cm4gYSA9PT0gYjtcbiAgICAvLyBVbndyYXAgYW55IHdyYXBwZWQgb2JqZWN0cy5cbiAgICBpZiAoYSBpbnN0YW5jZW9mIF8pIGEgPSBhLl93cmFwcGVkO1xuICAgIGlmIChiIGluc3RhbmNlb2YgXykgYiA9IGIuX3dyYXBwZWQ7XG4gICAgLy8gQ29tcGFyZSBgW1tDbGFzc11dYCBuYW1lcy5cbiAgICB2YXIgY2xhc3NOYW1lID0gdG9TdHJpbmcuY2FsbChhKTtcbiAgICBpZiAoY2xhc3NOYW1lICE9IHRvU3RyaW5nLmNhbGwoYikpIHJldHVybiBmYWxzZTtcbiAgICBzd2l0Y2ggKGNsYXNzTmFtZSkge1xuICAgICAgLy8gU3RyaW5ncywgbnVtYmVycywgZGF0ZXMsIGFuZCBib29sZWFucyBhcmUgY29tcGFyZWQgYnkgdmFsdWUuXG4gICAgICBjYXNlICdbb2JqZWN0IFN0cmluZ10nOlxuICAgICAgICAvLyBQcmltaXRpdmVzIGFuZCB0aGVpciBjb3JyZXNwb25kaW5nIG9iamVjdCB3cmFwcGVycyBhcmUgZXF1aXZhbGVudDsgdGh1cywgYFwiNVwiYCBpc1xuICAgICAgICAvLyBlcXVpdmFsZW50IHRvIGBuZXcgU3RyaW5nKFwiNVwiKWAuXG4gICAgICAgIHJldHVybiBhID09IFN0cmluZyhiKTtcbiAgICAgIGNhc2UgJ1tvYmplY3QgTnVtYmVyXSc6XG4gICAgICAgIC8vIGBOYU5gcyBhcmUgZXF1aXZhbGVudCwgYnV0IG5vbi1yZWZsZXhpdmUuIEFuIGBlZ2FsYCBjb21wYXJpc29uIGlzIHBlcmZvcm1lZCBmb3JcbiAgICAgICAgLy8gb3RoZXIgbnVtZXJpYyB2YWx1ZXMuXG4gICAgICAgIHJldHVybiBhICE9ICthID8gYiAhPSArYiA6IChhID09IDAgPyAxIC8gYSA9PSAxIC8gYiA6IGEgPT0gK2IpO1xuICAgICAgY2FzZSAnW29iamVjdCBEYXRlXSc6XG4gICAgICBjYXNlICdbb2JqZWN0IEJvb2xlYW5dJzpcbiAgICAgICAgLy8gQ29lcmNlIGRhdGVzIGFuZCBib29sZWFucyB0byBudW1lcmljIHByaW1pdGl2ZSB2YWx1ZXMuIERhdGVzIGFyZSBjb21wYXJlZCBieSB0aGVpclxuICAgICAgICAvLyBtaWxsaXNlY29uZCByZXByZXNlbnRhdGlvbnMuIE5vdGUgdGhhdCBpbnZhbGlkIGRhdGVzIHdpdGggbWlsbGlzZWNvbmQgcmVwcmVzZW50YXRpb25zXG4gICAgICAgIC8vIG9mIGBOYU5gIGFyZSBub3QgZXF1aXZhbGVudC5cbiAgICAgICAgcmV0dXJuICthID09ICtiO1xuICAgICAgLy8gUmVnRXhwcyBhcmUgY29tcGFyZWQgYnkgdGhlaXIgc291cmNlIHBhdHRlcm5zIGFuZCBmbGFncy5cbiAgICAgIGNhc2UgJ1tvYmplY3QgUmVnRXhwXSc6XG4gICAgICAgIHJldHVybiBhLnNvdXJjZSA9PSBiLnNvdXJjZSAmJlxuICAgICAgICAgICAgICAgYS5nbG9iYWwgPT0gYi5nbG9iYWwgJiZcbiAgICAgICAgICAgICAgIGEubXVsdGlsaW5lID09IGIubXVsdGlsaW5lICYmXG4gICAgICAgICAgICAgICBhLmlnbm9yZUNhc2UgPT0gYi5pZ25vcmVDYXNlO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIGEgIT0gJ29iamVjdCcgfHwgdHlwZW9mIGIgIT0gJ29iamVjdCcpIHJldHVybiBmYWxzZTtcbiAgICAvLyBBc3N1bWUgZXF1YWxpdHkgZm9yIGN5Y2xpYyBzdHJ1Y3R1cmVzLiBUaGUgYWxnb3JpdGhtIGZvciBkZXRlY3RpbmcgY3ljbGljXG4gICAgLy8gc3RydWN0dXJlcyBpcyBhZGFwdGVkIGZyb20gRVMgNS4xIHNlY3Rpb24gMTUuMTIuMywgYWJzdHJhY3Qgb3BlcmF0aW9uIGBKT2AuXG4gICAgdmFyIGxlbmd0aCA9IGFTdGFjay5sZW5ndGg7XG4gICAgd2hpbGUgKGxlbmd0aC0tKSB7XG4gICAgICAvLyBMaW5lYXIgc2VhcmNoLiBQZXJmb3JtYW5jZSBpcyBpbnZlcnNlbHkgcHJvcG9ydGlvbmFsIHRvIHRoZSBudW1iZXIgb2ZcbiAgICAgIC8vIHVuaXF1ZSBuZXN0ZWQgc3RydWN0dXJlcy5cbiAgICAgIGlmIChhU3RhY2tbbGVuZ3RoXSA9PSBhKSByZXR1cm4gYlN0YWNrW2xlbmd0aF0gPT0gYjtcbiAgICB9XG4gICAgLy8gT2JqZWN0cyB3aXRoIGRpZmZlcmVudCBjb25zdHJ1Y3RvcnMgYXJlIG5vdCBlcXVpdmFsZW50LCBidXQgYE9iamVjdGBzXG4gICAgLy8gZnJvbSBkaWZmZXJlbnQgZnJhbWVzIGFyZS5cbiAgICB2YXIgYUN0b3IgPSBhLmNvbnN0cnVjdG9yLCBiQ3RvciA9IGIuY29uc3RydWN0b3I7XG4gICAgaWYgKGFDdG9yICE9PSBiQ3RvciAmJiAhKF8uaXNGdW5jdGlvbihhQ3RvcikgJiYgKGFDdG9yIGluc3RhbmNlb2YgYUN0b3IpICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIF8uaXNGdW5jdGlvbihiQ3RvcikgJiYgKGJDdG9yIGluc3RhbmNlb2YgYkN0b3IpKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICAvLyBBZGQgdGhlIGZpcnN0IG9iamVjdCB0byB0aGUgc3RhY2sgb2YgdHJhdmVyc2VkIG9iamVjdHMuXG4gICAgYVN0YWNrLnB1c2goYSk7XG4gICAgYlN0YWNrLnB1c2goYik7XG4gICAgdmFyIHNpemUgPSAwLCByZXN1bHQgPSB0cnVlO1xuICAgIC8vIFJlY3Vyc2l2ZWx5IGNvbXBhcmUgb2JqZWN0cyBhbmQgYXJyYXlzLlxuICAgIGlmIChjbGFzc05hbWUgPT0gJ1tvYmplY3QgQXJyYXldJykge1xuICAgICAgLy8gQ29tcGFyZSBhcnJheSBsZW5ndGhzIHRvIGRldGVybWluZSBpZiBhIGRlZXAgY29tcGFyaXNvbiBpcyBuZWNlc3NhcnkuXG4gICAgICBzaXplID0gYS5sZW5ndGg7XG4gICAgICByZXN1bHQgPSBzaXplID09IGIubGVuZ3RoO1xuICAgICAgaWYgKHJlc3VsdCkge1xuICAgICAgICAvLyBEZWVwIGNvbXBhcmUgdGhlIGNvbnRlbnRzLCBpZ25vcmluZyBub24tbnVtZXJpYyBwcm9wZXJ0aWVzLlxuICAgICAgICB3aGlsZSAoc2l6ZS0tKSB7XG4gICAgICAgICAgaWYgKCEocmVzdWx0ID0gZXEoYVtzaXplXSwgYltzaXplXSwgYVN0YWNrLCBiU3RhY2spKSkgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gRGVlcCBjb21wYXJlIG9iamVjdHMuXG4gICAgICBmb3IgKHZhciBrZXkgaW4gYSkge1xuICAgICAgICBpZiAoXy5oYXMoYSwga2V5KSkge1xuICAgICAgICAgIC8vIENvdW50IHRoZSBleHBlY3RlZCBudW1iZXIgb2YgcHJvcGVydGllcy5cbiAgICAgICAgICBzaXplKys7XG4gICAgICAgICAgLy8gRGVlcCBjb21wYXJlIGVhY2ggbWVtYmVyLlxuICAgICAgICAgIGlmICghKHJlc3VsdCA9IF8uaGFzKGIsIGtleSkgJiYgZXEoYVtrZXldLCBiW2tleV0sIGFTdGFjaywgYlN0YWNrKSkpIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICAvLyBFbnN1cmUgdGhhdCBib3RoIG9iamVjdHMgY29udGFpbiB0aGUgc2FtZSBudW1iZXIgb2YgcHJvcGVydGllcy5cbiAgICAgIGlmIChyZXN1bHQpIHtcbiAgICAgICAgZm9yIChrZXkgaW4gYikge1xuICAgICAgICAgIGlmIChfLmhhcyhiLCBrZXkpICYmICEoc2l6ZS0tKSkgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgcmVzdWx0ID0gIXNpemU7XG4gICAgICB9XG4gICAgfVxuICAgIC8vIFJlbW92ZSB0aGUgZmlyc3Qgb2JqZWN0IGZyb20gdGhlIHN0YWNrIG9mIHRyYXZlcnNlZCBvYmplY3RzLlxuICAgIGFTdGFjay5wb3AoKTtcbiAgICBiU3RhY2sucG9wKCk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcblxuICAvLyBQZXJmb3JtIGEgZGVlcCBjb21wYXJpc29uIHRvIGNoZWNrIGlmIHR3byBvYmplY3RzIGFyZSBlcXVhbC5cbiAgXy5pc0VxdWFsID0gZnVuY3Rpb24oYSwgYikge1xuICAgIHJldHVybiBlcShhLCBiLCBbXSwgW10pO1xuICB9O1xuXG4gIC8vIElzIGEgZ2l2ZW4gYXJyYXksIHN0cmluZywgb3Igb2JqZWN0IGVtcHR5P1xuICAvLyBBbiBcImVtcHR5XCIgb2JqZWN0IGhhcyBubyBlbnVtZXJhYmxlIG93bi1wcm9wZXJ0aWVzLlxuICBfLmlzRW1wdHkgPSBmdW5jdGlvbihvYmopIHtcbiAgICBpZiAob2JqID09IG51bGwpIHJldHVybiB0cnVlO1xuICAgIGlmIChfLmlzQXJyYXkob2JqKSB8fCBfLmlzU3RyaW5nKG9iaikpIHJldHVybiBvYmoubGVuZ3RoID09PSAwO1xuICAgIGZvciAodmFyIGtleSBpbiBvYmopIGlmIChfLmhhcyhvYmosIGtleSkpIHJldHVybiBmYWxzZTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfTtcblxuICAvLyBJcyBhIGdpdmVuIHZhbHVlIGEgRE9NIGVsZW1lbnQ/XG4gIF8uaXNFbGVtZW50ID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuICEhKG9iaiAmJiBvYmoubm9kZVR5cGUgPT09IDEpO1xuICB9O1xuXG4gIC8vIElzIGEgZ2l2ZW4gdmFsdWUgYW4gYXJyYXk/XG4gIC8vIERlbGVnYXRlcyB0byBFQ01BNSdzIG5hdGl2ZSBBcnJheS5pc0FycmF5XG4gIF8uaXNBcnJheSA9IG5hdGl2ZUlzQXJyYXkgfHwgZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIHRvU3RyaW5nLmNhbGwob2JqKSA9PSAnW29iamVjdCBBcnJheV0nO1xuICB9O1xuXG4gIC8vIElzIGEgZ2l2ZW4gdmFyaWFibGUgYW4gb2JqZWN0P1xuICBfLmlzT2JqZWN0ID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIG9iaiA9PT0gT2JqZWN0KG9iaik7XG4gIH07XG5cbiAgLy8gQWRkIHNvbWUgaXNUeXBlIG1ldGhvZHM6IGlzQXJndW1lbnRzLCBpc0Z1bmN0aW9uLCBpc1N0cmluZywgaXNOdW1iZXIsIGlzRGF0ZSwgaXNSZWdFeHAuXG4gIGVhY2goWydBcmd1bWVudHMnLCAnRnVuY3Rpb24nLCAnU3RyaW5nJywgJ051bWJlcicsICdEYXRlJywgJ1JlZ0V4cCddLCBmdW5jdGlvbihuYW1lKSB7XG4gICAgX1snaXMnICsgbmFtZV0gPSBmdW5jdGlvbihvYmopIHtcbiAgICAgIHJldHVybiB0b1N0cmluZy5jYWxsKG9iaikgPT0gJ1tvYmplY3QgJyArIG5hbWUgKyAnXSc7XG4gICAgfTtcbiAgfSk7XG5cbiAgLy8gRGVmaW5lIGEgZmFsbGJhY2sgdmVyc2lvbiBvZiB0aGUgbWV0aG9kIGluIGJyb3dzZXJzIChhaGVtLCBJRSksIHdoZXJlXG4gIC8vIHRoZXJlIGlzbid0IGFueSBpbnNwZWN0YWJsZSBcIkFyZ3VtZW50c1wiIHR5cGUuXG4gIGlmICghXy5pc0FyZ3VtZW50cyhhcmd1bWVudHMpKSB7XG4gICAgXy5pc0FyZ3VtZW50cyA9IGZ1bmN0aW9uKG9iaikge1xuICAgICAgcmV0dXJuICEhKG9iaiAmJiBfLmhhcyhvYmosICdjYWxsZWUnKSk7XG4gICAgfTtcbiAgfVxuXG4gIC8vIE9wdGltaXplIGBpc0Z1bmN0aW9uYCBpZiBhcHByb3ByaWF0ZS5cbiAgaWYgKHR5cGVvZiAoLy4vKSAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIF8uaXNGdW5jdGlvbiA9IGZ1bmN0aW9uKG9iaikge1xuICAgICAgcmV0dXJuIHR5cGVvZiBvYmogPT09ICdmdW5jdGlvbic7XG4gICAgfTtcbiAgfVxuXG4gIC8vIElzIGEgZ2l2ZW4gb2JqZWN0IGEgZmluaXRlIG51bWJlcj9cbiAgXy5pc0Zpbml0ZSA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiBpc0Zpbml0ZShvYmopICYmICFpc05hTihwYXJzZUZsb2F0KG9iaikpO1xuICB9O1xuXG4gIC8vIElzIHRoZSBnaXZlbiB2YWx1ZSBgTmFOYD8gKE5hTiBpcyB0aGUgb25seSBudW1iZXIgd2hpY2ggZG9lcyBub3QgZXF1YWwgaXRzZWxmKS5cbiAgXy5pc05hTiA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiBfLmlzTnVtYmVyKG9iaikgJiYgb2JqICE9ICtvYmo7XG4gIH07XG5cbiAgLy8gSXMgYSBnaXZlbiB2YWx1ZSBhIGJvb2xlYW4/XG4gIF8uaXNCb29sZWFuID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIG9iaiA9PT0gdHJ1ZSB8fCBvYmogPT09IGZhbHNlIHx8IHRvU3RyaW5nLmNhbGwob2JqKSA9PSAnW29iamVjdCBCb29sZWFuXSc7XG4gIH07XG5cbiAgLy8gSXMgYSBnaXZlbiB2YWx1ZSBlcXVhbCB0byBudWxsP1xuICBfLmlzTnVsbCA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiBvYmogPT09IG51bGw7XG4gIH07XG5cbiAgLy8gSXMgYSBnaXZlbiB2YXJpYWJsZSB1bmRlZmluZWQ/XG4gIF8uaXNVbmRlZmluZWQgPSBmdW5jdGlvbihvYmopIHtcbiAgICByZXR1cm4gb2JqID09PSB2b2lkIDA7XG4gIH07XG5cbiAgLy8gU2hvcnRjdXQgZnVuY3Rpb24gZm9yIGNoZWNraW5nIGlmIGFuIG9iamVjdCBoYXMgYSBnaXZlbiBwcm9wZXJ0eSBkaXJlY3RseVxuICAvLyBvbiBpdHNlbGYgKGluIG90aGVyIHdvcmRzLCBub3Qgb24gYSBwcm90b3R5cGUpLlxuICBfLmhhcyA9IGZ1bmN0aW9uKG9iaiwga2V5KSB7XG4gICAgcmV0dXJuIGhhc093blByb3BlcnR5LmNhbGwob2JqLCBrZXkpO1xuICB9O1xuXG4gIC8vIFV0aWxpdHkgRnVuY3Rpb25zXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gUnVuIFVuZGVyc2NvcmUuanMgaW4gKm5vQ29uZmxpY3QqIG1vZGUsIHJldHVybmluZyB0aGUgYF9gIHZhcmlhYmxlIHRvIGl0c1xuICAvLyBwcmV2aW91cyBvd25lci4gUmV0dXJucyBhIHJlZmVyZW5jZSB0byB0aGUgVW5kZXJzY29yZSBvYmplY3QuXG4gIF8ubm9Db25mbGljdCA9IGZ1bmN0aW9uKCkge1xuICAgIHJvb3QuXyA9IHByZXZpb3VzVW5kZXJzY29yZTtcbiAgICByZXR1cm4gdGhpcztcbiAgfTtcblxuICAvLyBLZWVwIHRoZSBpZGVudGl0eSBmdW5jdGlvbiBhcm91bmQgZm9yIGRlZmF1bHQgaXRlcmF0b3JzLlxuICBfLmlkZW50aXR5ID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH07XG5cbiAgLy8gUnVuIGEgZnVuY3Rpb24gKipuKiogdGltZXMuXG4gIF8udGltZXMgPSBmdW5jdGlvbihuLCBpdGVyYXRvciwgY29udGV4dCkge1xuICAgIHZhciBhY2N1bSA9IEFycmF5KE1hdGgubWF4KDAsIG4pKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG47IGkrKykgYWNjdW1baV0gPSBpdGVyYXRvci5jYWxsKGNvbnRleHQsIGkpO1xuICAgIHJldHVybiBhY2N1bTtcbiAgfTtcblxuICAvLyBSZXR1cm4gYSByYW5kb20gaW50ZWdlciBiZXR3ZWVuIG1pbiBhbmQgbWF4IChpbmNsdXNpdmUpLlxuICBfLnJhbmRvbSA9IGZ1bmN0aW9uKG1pbiwgbWF4KSB7XG4gICAgaWYgKG1heCA9PSBudWxsKSB7XG4gICAgICBtYXggPSBtaW47XG4gICAgICBtaW4gPSAwO1xuICAgIH1cbiAgICByZXR1cm4gbWluICsgTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogKG1heCAtIG1pbiArIDEpKTtcbiAgfTtcblxuICAvLyBMaXN0IG9mIEhUTUwgZW50aXRpZXMgZm9yIGVzY2FwaW5nLlxuICB2YXIgZW50aXR5TWFwID0ge1xuICAgIGVzY2FwZToge1xuICAgICAgJyYnOiAnJmFtcDsnLFxuICAgICAgJzwnOiAnJmx0OycsXG4gICAgICAnPic6ICcmZ3Q7JyxcbiAgICAgICdcIic6ICcmcXVvdDsnLFxuICAgICAgXCInXCI6ICcmI3gyNzsnXG4gICAgfVxuICB9O1xuICBlbnRpdHlNYXAudW5lc2NhcGUgPSBfLmludmVydChlbnRpdHlNYXAuZXNjYXBlKTtcblxuICAvLyBSZWdleGVzIGNvbnRhaW5pbmcgdGhlIGtleXMgYW5kIHZhbHVlcyBsaXN0ZWQgaW1tZWRpYXRlbHkgYWJvdmUuXG4gIHZhciBlbnRpdHlSZWdleGVzID0ge1xuICAgIGVzY2FwZTogICBuZXcgUmVnRXhwKCdbJyArIF8ua2V5cyhlbnRpdHlNYXAuZXNjYXBlKS5qb2luKCcnKSArICddJywgJ2cnKSxcbiAgICB1bmVzY2FwZTogbmV3IFJlZ0V4cCgnKCcgKyBfLmtleXMoZW50aXR5TWFwLnVuZXNjYXBlKS5qb2luKCd8JykgKyAnKScsICdnJylcbiAgfTtcblxuICAvLyBGdW5jdGlvbnMgZm9yIGVzY2FwaW5nIGFuZCB1bmVzY2FwaW5nIHN0cmluZ3MgdG8vZnJvbSBIVE1MIGludGVycG9sYXRpb24uXG4gIF8uZWFjaChbJ2VzY2FwZScsICd1bmVzY2FwZSddLCBmdW5jdGlvbihtZXRob2QpIHtcbiAgICBfW21ldGhvZF0gPSBmdW5jdGlvbihzdHJpbmcpIHtcbiAgICAgIGlmIChzdHJpbmcgPT0gbnVsbCkgcmV0dXJuICcnO1xuICAgICAgcmV0dXJuICgnJyArIHN0cmluZykucmVwbGFjZShlbnRpdHlSZWdleGVzW21ldGhvZF0sIGZ1bmN0aW9uKG1hdGNoKSB7XG4gICAgICAgIHJldHVybiBlbnRpdHlNYXBbbWV0aG9kXVttYXRjaF07XG4gICAgICB9KTtcbiAgICB9O1xuICB9KTtcblxuICAvLyBJZiB0aGUgdmFsdWUgb2YgdGhlIG5hbWVkIGBwcm9wZXJ0eWAgaXMgYSBmdW5jdGlvbiB0aGVuIGludm9rZSBpdCB3aXRoIHRoZVxuICAvLyBgb2JqZWN0YCBhcyBjb250ZXh0OyBvdGhlcndpc2UsIHJldHVybiBpdC5cbiAgXy5yZXN1bHQgPSBmdW5jdGlvbihvYmplY3QsIHByb3BlcnR5KSB7XG4gICAgaWYgKG9iamVjdCA9PSBudWxsKSByZXR1cm4gdm9pZCAwO1xuICAgIHZhciB2YWx1ZSA9IG9iamVjdFtwcm9wZXJ0eV07XG4gICAgcmV0dXJuIF8uaXNGdW5jdGlvbih2YWx1ZSkgPyB2YWx1ZS5jYWxsKG9iamVjdCkgOiB2YWx1ZTtcbiAgfTtcblxuICAvLyBBZGQgeW91ciBvd24gY3VzdG9tIGZ1bmN0aW9ucyB0byB0aGUgVW5kZXJzY29yZSBvYmplY3QuXG4gIF8ubWl4aW4gPSBmdW5jdGlvbihvYmopIHtcbiAgICBlYWNoKF8uZnVuY3Rpb25zKG9iaiksIGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgIHZhciBmdW5jID0gX1tuYW1lXSA9IG9ialtuYW1lXTtcbiAgICAgIF8ucHJvdG90eXBlW25hbWVdID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBhcmdzID0gW3RoaXMuX3dyYXBwZWRdO1xuICAgICAgICBwdXNoLmFwcGx5KGFyZ3MsIGFyZ3VtZW50cyk7XG4gICAgICAgIHJldHVybiByZXN1bHQuY2FsbCh0aGlzLCBmdW5jLmFwcGx5KF8sIGFyZ3MpKTtcbiAgICAgIH07XG4gICAgfSk7XG4gIH07XG5cbiAgLy8gR2VuZXJhdGUgYSB1bmlxdWUgaW50ZWdlciBpZCAodW5pcXVlIHdpdGhpbiB0aGUgZW50aXJlIGNsaWVudCBzZXNzaW9uKS5cbiAgLy8gVXNlZnVsIGZvciB0ZW1wb3JhcnkgRE9NIGlkcy5cbiAgdmFyIGlkQ291bnRlciA9IDA7XG4gIF8udW5pcXVlSWQgPSBmdW5jdGlvbihwcmVmaXgpIHtcbiAgICB2YXIgaWQgPSArK2lkQ291bnRlciArICcnO1xuICAgIHJldHVybiBwcmVmaXggPyBwcmVmaXggKyBpZCA6IGlkO1xuICB9O1xuXG4gIC8vIEJ5IGRlZmF1bHQsIFVuZGVyc2NvcmUgdXNlcyBFUkItc3R5bGUgdGVtcGxhdGUgZGVsaW1pdGVycywgY2hhbmdlIHRoZVxuICAvLyBmb2xsb3dpbmcgdGVtcGxhdGUgc2V0dGluZ3MgdG8gdXNlIGFsdGVybmF0aXZlIGRlbGltaXRlcnMuXG4gIF8udGVtcGxhdGVTZXR0aW5ncyA9IHtcbiAgICBldmFsdWF0ZSAgICA6IC88JShbXFxzXFxTXSs/KSU+L2csXG4gICAgaW50ZXJwb2xhdGUgOiAvPCU9KFtcXHNcXFNdKz8pJT4vZyxcbiAgICBlc2NhcGUgICAgICA6IC88JS0oW1xcc1xcU10rPyklPi9nXG4gIH07XG5cbiAgLy8gV2hlbiBjdXN0b21pemluZyBgdGVtcGxhdGVTZXR0aW5nc2AsIGlmIHlvdSBkb24ndCB3YW50IHRvIGRlZmluZSBhblxuICAvLyBpbnRlcnBvbGF0aW9uLCBldmFsdWF0aW9uIG9yIGVzY2FwaW5nIHJlZ2V4LCB3ZSBuZWVkIG9uZSB0aGF0IGlzXG4gIC8vIGd1YXJhbnRlZWQgbm90IHRvIG1hdGNoLlxuICB2YXIgbm9NYXRjaCA9IC8oLileLztcblxuICAvLyBDZXJ0YWluIGNoYXJhY3RlcnMgbmVlZCB0byBiZSBlc2NhcGVkIHNvIHRoYXQgdGhleSBjYW4gYmUgcHV0IGludG8gYVxuICAvLyBzdHJpbmcgbGl0ZXJhbC5cbiAgdmFyIGVzY2FwZXMgPSB7XG4gICAgXCInXCI6ICAgICAgXCInXCIsXG4gICAgJ1xcXFwnOiAgICAgJ1xcXFwnLFxuICAgICdcXHInOiAgICAgJ3InLFxuICAgICdcXG4nOiAgICAgJ24nLFxuICAgICdcXHQnOiAgICAgJ3QnLFxuICAgICdcXHUyMDI4JzogJ3UyMDI4JyxcbiAgICAnXFx1MjAyOSc6ICd1MjAyOSdcbiAgfTtcblxuICB2YXIgZXNjYXBlciA9IC9cXFxcfCd8XFxyfFxcbnxcXHR8XFx1MjAyOHxcXHUyMDI5L2c7XG5cbiAgLy8gSmF2YVNjcmlwdCBtaWNyby10ZW1wbGF0aW5nLCBzaW1pbGFyIHRvIEpvaG4gUmVzaWcncyBpbXBsZW1lbnRhdGlvbi5cbiAgLy8gVW5kZXJzY29yZSB0ZW1wbGF0aW5nIGhhbmRsZXMgYXJiaXRyYXJ5IGRlbGltaXRlcnMsIHByZXNlcnZlcyB3aGl0ZXNwYWNlLFxuICAvLyBhbmQgY29ycmVjdGx5IGVzY2FwZXMgcXVvdGVzIHdpdGhpbiBpbnRlcnBvbGF0ZWQgY29kZS5cbiAgXy50ZW1wbGF0ZSA9IGZ1bmN0aW9uKHRleHQsIGRhdGEsIHNldHRpbmdzKSB7XG4gICAgdmFyIHJlbmRlcjtcbiAgICBzZXR0aW5ncyA9IF8uZGVmYXVsdHMoe30sIHNldHRpbmdzLCBfLnRlbXBsYXRlU2V0dGluZ3MpO1xuXG4gICAgLy8gQ29tYmluZSBkZWxpbWl0ZXJzIGludG8gb25lIHJlZ3VsYXIgZXhwcmVzc2lvbiB2aWEgYWx0ZXJuYXRpb24uXG4gICAgdmFyIG1hdGNoZXIgPSBuZXcgUmVnRXhwKFtcbiAgICAgIChzZXR0aW5ncy5lc2NhcGUgfHwgbm9NYXRjaCkuc291cmNlLFxuICAgICAgKHNldHRpbmdzLmludGVycG9sYXRlIHx8IG5vTWF0Y2gpLnNvdXJjZSxcbiAgICAgIChzZXR0aW5ncy5ldmFsdWF0ZSB8fCBub01hdGNoKS5zb3VyY2VcbiAgICBdLmpvaW4oJ3wnKSArICd8JCcsICdnJyk7XG5cbiAgICAvLyBDb21waWxlIHRoZSB0ZW1wbGF0ZSBzb3VyY2UsIGVzY2FwaW5nIHN0cmluZyBsaXRlcmFscyBhcHByb3ByaWF0ZWx5LlxuICAgIHZhciBpbmRleCA9IDA7XG4gICAgdmFyIHNvdXJjZSA9IFwiX19wKz0nXCI7XG4gICAgdGV4dC5yZXBsYWNlKG1hdGNoZXIsIGZ1bmN0aW9uKG1hdGNoLCBlc2NhcGUsIGludGVycG9sYXRlLCBldmFsdWF0ZSwgb2Zmc2V0KSB7XG4gICAgICBzb3VyY2UgKz0gdGV4dC5zbGljZShpbmRleCwgb2Zmc2V0KVxuICAgICAgICAucmVwbGFjZShlc2NhcGVyLCBmdW5jdGlvbihtYXRjaCkgeyByZXR1cm4gJ1xcXFwnICsgZXNjYXBlc1ttYXRjaF07IH0pO1xuXG4gICAgICBpZiAoZXNjYXBlKSB7XG4gICAgICAgIHNvdXJjZSArPSBcIicrXFxuKChfX3Q9KFwiICsgZXNjYXBlICsgXCIpKT09bnVsbD8nJzpfLmVzY2FwZShfX3QpKStcXG4nXCI7XG4gICAgICB9XG4gICAgICBpZiAoaW50ZXJwb2xhdGUpIHtcbiAgICAgICAgc291cmNlICs9IFwiJytcXG4oKF9fdD0oXCIgKyBpbnRlcnBvbGF0ZSArIFwiKSk9PW51bGw/Jyc6X190KStcXG4nXCI7XG4gICAgICB9XG4gICAgICBpZiAoZXZhbHVhdGUpIHtcbiAgICAgICAgc291cmNlICs9IFwiJztcXG5cIiArIGV2YWx1YXRlICsgXCJcXG5fX3ArPSdcIjtcbiAgICAgIH1cbiAgICAgIGluZGV4ID0gb2Zmc2V0ICsgbWF0Y2gubGVuZ3RoO1xuICAgICAgcmV0dXJuIG1hdGNoO1xuICAgIH0pO1xuICAgIHNvdXJjZSArPSBcIic7XFxuXCI7XG5cbiAgICAvLyBJZiBhIHZhcmlhYmxlIGlzIG5vdCBzcGVjaWZpZWQsIHBsYWNlIGRhdGEgdmFsdWVzIGluIGxvY2FsIHNjb3BlLlxuICAgIGlmICghc2V0dGluZ3MudmFyaWFibGUpIHNvdXJjZSA9ICd3aXRoKG9ianx8e30pe1xcbicgKyBzb3VyY2UgKyAnfVxcbic7XG5cbiAgICBzb3VyY2UgPSBcInZhciBfX3QsX19wPScnLF9faj1BcnJheS5wcm90b3R5cGUuam9pbixcIiArXG4gICAgICBcInByaW50PWZ1bmN0aW9uKCl7X19wKz1fX2ouY2FsbChhcmd1bWVudHMsJycpO307XFxuXCIgK1xuICAgICAgc291cmNlICsgXCJyZXR1cm4gX19wO1xcblwiO1xuXG4gICAgdHJ5IHtcbiAgICAgIHJlbmRlciA9IG5ldyBGdW5jdGlvbihzZXR0aW5ncy52YXJpYWJsZSB8fCAnb2JqJywgJ18nLCBzb3VyY2UpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGUuc291cmNlID0gc291cmNlO1xuICAgICAgdGhyb3cgZTtcbiAgICB9XG5cbiAgICBpZiAoZGF0YSkgcmV0dXJuIHJlbmRlcihkYXRhLCBfKTtcbiAgICB2YXIgdGVtcGxhdGUgPSBmdW5jdGlvbihkYXRhKSB7XG4gICAgICByZXR1cm4gcmVuZGVyLmNhbGwodGhpcywgZGF0YSwgXyk7XG4gICAgfTtcblxuICAgIC8vIFByb3ZpZGUgdGhlIGNvbXBpbGVkIGZ1bmN0aW9uIHNvdXJjZSBhcyBhIGNvbnZlbmllbmNlIGZvciBwcmVjb21waWxhdGlvbi5cbiAgICB0ZW1wbGF0ZS5zb3VyY2UgPSAnZnVuY3Rpb24oJyArIChzZXR0aW5ncy52YXJpYWJsZSB8fCAnb2JqJykgKyAnKXtcXG4nICsgc291cmNlICsgJ30nO1xuXG4gICAgcmV0dXJuIHRlbXBsYXRlO1xuICB9O1xuXG4gIC8vIEFkZCBhIFwiY2hhaW5cIiBmdW5jdGlvbiwgd2hpY2ggd2lsbCBkZWxlZ2F0ZSB0byB0aGUgd3JhcHBlci5cbiAgXy5jaGFpbiA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiBfKG9iaikuY2hhaW4oKTtcbiAgfTtcblxuICAvLyBPT1BcbiAgLy8gLS0tLS0tLS0tLS0tLS0tXG4gIC8vIElmIFVuZGVyc2NvcmUgaXMgY2FsbGVkIGFzIGEgZnVuY3Rpb24sIGl0IHJldHVybnMgYSB3cmFwcGVkIG9iamVjdCB0aGF0XG4gIC8vIGNhbiBiZSB1c2VkIE9PLXN0eWxlLiBUaGlzIHdyYXBwZXIgaG9sZHMgYWx0ZXJlZCB2ZXJzaW9ucyBvZiBhbGwgdGhlXG4gIC8vIHVuZGVyc2NvcmUgZnVuY3Rpb25zLiBXcmFwcGVkIG9iamVjdHMgbWF5IGJlIGNoYWluZWQuXG5cbiAgLy8gSGVscGVyIGZ1bmN0aW9uIHRvIGNvbnRpbnVlIGNoYWluaW5nIGludGVybWVkaWF0ZSByZXN1bHRzLlxuICB2YXIgcmVzdWx0ID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIHRoaXMuX2NoYWluID8gXyhvYmopLmNoYWluKCkgOiBvYmo7XG4gIH07XG5cbiAgLy8gQWRkIGFsbCBvZiB0aGUgVW5kZXJzY29yZSBmdW5jdGlvbnMgdG8gdGhlIHdyYXBwZXIgb2JqZWN0LlxuICBfLm1peGluKF8pO1xuXG4gIC8vIEFkZCBhbGwgbXV0YXRvciBBcnJheSBmdW5jdGlvbnMgdG8gdGhlIHdyYXBwZXIuXG4gIGVhY2goWydwb3AnLCAncHVzaCcsICdyZXZlcnNlJywgJ3NoaWZ0JywgJ3NvcnQnLCAnc3BsaWNlJywgJ3Vuc2hpZnQnXSwgZnVuY3Rpb24obmFtZSkge1xuICAgIHZhciBtZXRob2QgPSBBcnJheVByb3RvW25hbWVdO1xuICAgIF8ucHJvdG90eXBlW25hbWVdID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgb2JqID0gdGhpcy5fd3JhcHBlZDtcbiAgICAgIG1ldGhvZC5hcHBseShvYmosIGFyZ3VtZW50cyk7XG4gICAgICBpZiAoKG5hbWUgPT0gJ3NoaWZ0JyB8fCBuYW1lID09ICdzcGxpY2UnKSAmJiBvYmoubGVuZ3RoID09PSAwKSBkZWxldGUgb2JqWzBdO1xuICAgICAgcmV0dXJuIHJlc3VsdC5jYWxsKHRoaXMsIG9iaik7XG4gICAgfTtcbiAgfSk7XG5cbiAgLy8gQWRkIGFsbCBhY2Nlc3NvciBBcnJheSBmdW5jdGlvbnMgdG8gdGhlIHdyYXBwZXIuXG4gIGVhY2goWydjb25jYXQnLCAnam9pbicsICdzbGljZSddLCBmdW5jdGlvbihuYW1lKSB7XG4gICAgdmFyIG1ldGhvZCA9IEFycmF5UHJvdG9bbmFtZV07XG4gICAgXy5wcm90b3R5cGVbbmFtZV0gPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiByZXN1bHQuY2FsbCh0aGlzLCBtZXRob2QuYXBwbHkodGhpcy5fd3JhcHBlZCwgYXJndW1lbnRzKSk7XG4gICAgfTtcbiAgfSk7XG5cbiAgXy5leHRlbmQoXy5wcm90b3R5cGUsIHtcblxuICAgIC8vIFN0YXJ0IGNoYWluaW5nIGEgd3JhcHBlZCBVbmRlcnNjb3JlIG9iamVjdC5cbiAgICBjaGFpbjogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLl9jaGFpbiA9IHRydWU7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgLy8gRXh0cmFjdHMgdGhlIHJlc3VsdCBmcm9tIGEgd3JhcHBlZCBhbmQgY2hhaW5lZCBvYmplY3QuXG4gICAgdmFsdWU6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMuX3dyYXBwZWQ7XG4gICAgfVxuXG4gIH0pO1xuXG59KS5jYWxsKHRoaXMpO1xuIiwibW9kdWxlLmV4cG9ydHMgPSB7XG4gIGJhbmtzOiBbIFwic3B2XCIsIFwiZmFuYVwiLCBcImxsb3lkc1wiIF0sXG4gIGN1c3RvbWVyczogW1xuICAgIHsgYmFuazogXCJzcHZcIiwgbmFtZTogXCJib2JcIiAsIGRlc2M6IFwiYm9iIGlzIGEgbGF0ZSBwYXllclwifSxcbiAgICB7IGJhbms6IFwiZmFuYVwiLCBuYW1lOiBcImFsaWNlXCIsIGRlc2M6IFwiYWxpY2UgYWx3YXlzIHBheXMgb24gdGltZVwifSxcbiAgICB7IGJhbms6IFwibGxveWRzXCIsIG5hbWU6IFwiY3JhaWdcIiwgZGVzYzogXCJjcmFpZyBpcyBjaGlsbGluIG9uIHN1bmRheVwiICB9LFxuICAgIHsgYmFuazogXCJmYW5hXCIsIG5hbWU6IFwiZGF2aWRcIiB9LFxuICAgIHsgYmFuazogXCJzcHZcIiwgbmFtZTogXCJlbGxhXCIgfSxcbiAgICB7IGJhbms6IFwiZmFuYVwiLCBuYW1lOiBcImZyYW5rXCIgfSxcbiAgICB7IGJhbms6IFwic3B2XCIsIG5hbWU6IFwiZ2VvcmdlXCIgfSxcbiAgICB7IGJhbms6IFwiZmFuYVwiLCBuYW1lOiBcImhhbm5haFwiIH0sXG4gICAgeyBiYW5rOiBcImZhbmFcIiwgbmFtZTogXCJqYW5lXCIgfSxcbiAgICB7IGJhbms6IFwibGxveWRzXCIsIG5hbWU6IFwia3Jpc1wiIH0sXG4gICAgeyBiYW5rOiBcInNwdlwiLCBuYW1lOiBcImphbWVzXCIgfVxuICBdXG59XG4iLCJcblxuLy9cbi8vIFRoZSBzaGltcyBpbiB0aGlzIGZpbGUgYXJlIG5vdCBmdWxseSBpbXBsZW1lbnRlZCBzaGltcyBmb3IgdGhlIEVTNVxuLy8gZmVhdHVyZXMsIGJ1dCBkbyB3b3JrIGZvciB0aGUgcGFydGljdWxhciB1c2VjYXNlcyB0aGVyZSBpcyBpblxuLy8gdGhlIG90aGVyIG1vZHVsZXMuXG4vL1xuXG52YXIgdG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nO1xudmFyIGhhc093blByb3BlcnR5ID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcblxuLy8gQXJyYXkuaXNBcnJheSBpcyBzdXBwb3J0ZWQgaW4gSUU5XG5mdW5jdGlvbiBpc0FycmF5KHhzKSB7XG4gIHJldHVybiB0b1N0cmluZy5jYWxsKHhzKSA9PT0gJ1tvYmplY3QgQXJyYXldJztcbn1cbmV4cG9ydHMuaXNBcnJheSA9IHR5cGVvZiBBcnJheS5pc0FycmF5ID09PSAnZnVuY3Rpb24nID8gQXJyYXkuaXNBcnJheSA6IGlzQXJyYXk7XG5cbi8vIEFycmF5LnByb3RvdHlwZS5pbmRleE9mIGlzIHN1cHBvcnRlZCBpbiBJRTlcbmV4cG9ydHMuaW5kZXhPZiA9IGZ1bmN0aW9uIGluZGV4T2YoeHMsIHgpIHtcbiAgaWYgKHhzLmluZGV4T2YpIHJldHVybiB4cy5pbmRleE9mKHgpO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IHhzLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKHggPT09IHhzW2ldKSByZXR1cm4gaTtcbiAgfVxuICByZXR1cm4gLTE7XG59O1xuXG4vLyBBcnJheS5wcm90b3R5cGUuZmlsdGVyIGlzIHN1cHBvcnRlZCBpbiBJRTlcbmV4cG9ydHMuZmlsdGVyID0gZnVuY3Rpb24gZmlsdGVyKHhzLCBmbikge1xuICBpZiAoeHMuZmlsdGVyKSByZXR1cm4geHMuZmlsdGVyKGZuKTtcbiAgdmFyIHJlcyA9IFtdO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IHhzLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKGZuKHhzW2ldLCBpLCB4cykpIHJlcy5wdXNoKHhzW2ldKTtcbiAgfVxuICByZXR1cm4gcmVzO1xufTtcblxuLy8gQXJyYXkucHJvdG90eXBlLmZvckVhY2ggaXMgc3VwcG9ydGVkIGluIElFOVxuZXhwb3J0cy5mb3JFYWNoID0gZnVuY3Rpb24gZm9yRWFjaCh4cywgZm4sIHNlbGYpIHtcbiAgaWYgKHhzLmZvckVhY2gpIHJldHVybiB4cy5mb3JFYWNoKGZuLCBzZWxmKTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB4cy5sZW5ndGg7IGkrKykge1xuICAgIGZuLmNhbGwoc2VsZiwgeHNbaV0sIGksIHhzKTtcbiAgfVxufTtcblxuLy8gQXJyYXkucHJvdG90eXBlLm1hcCBpcyBzdXBwb3J0ZWQgaW4gSUU5XG5leHBvcnRzLm1hcCA9IGZ1bmN0aW9uIG1hcCh4cywgZm4pIHtcbiAgaWYgKHhzLm1hcCkgcmV0dXJuIHhzLm1hcChmbik7XG4gIHZhciBvdXQgPSBuZXcgQXJyYXkoeHMubGVuZ3RoKTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB4cy5sZW5ndGg7IGkrKykge1xuICAgIG91dFtpXSA9IGZuKHhzW2ldLCBpLCB4cyk7XG4gIH1cbiAgcmV0dXJuIG91dDtcbn07XG5cbi8vIEFycmF5LnByb3RvdHlwZS5yZWR1Y2UgaXMgc3VwcG9ydGVkIGluIElFOVxuZXhwb3J0cy5yZWR1Y2UgPSBmdW5jdGlvbiByZWR1Y2UoYXJyYXksIGNhbGxiYWNrLCBvcHRfaW5pdGlhbFZhbHVlKSB7XG4gIGlmIChhcnJheS5yZWR1Y2UpIHJldHVybiBhcnJheS5yZWR1Y2UoY2FsbGJhY2ssIG9wdF9pbml0aWFsVmFsdWUpO1xuICB2YXIgdmFsdWUsIGlzVmFsdWVTZXQgPSBmYWxzZTtcblxuICBpZiAoMiA8IGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICB2YWx1ZSA9IG9wdF9pbml0aWFsVmFsdWU7XG4gICAgaXNWYWx1ZVNldCA9IHRydWU7XG4gIH1cbiAgZm9yICh2YXIgaSA9IDAsIGwgPSBhcnJheS5sZW5ndGg7IGwgPiBpOyArK2kpIHtcbiAgICBpZiAoYXJyYXkuaGFzT3duUHJvcGVydHkoaSkpIHtcbiAgICAgIGlmIChpc1ZhbHVlU2V0KSB7XG4gICAgICAgIHZhbHVlID0gY2FsbGJhY2sodmFsdWUsIGFycmF5W2ldLCBpLCBhcnJheSk7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgdmFsdWUgPSBhcnJheVtpXTtcbiAgICAgICAgaXNWYWx1ZVNldCA9IHRydWU7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHZhbHVlO1xufTtcblxuLy8gU3RyaW5nLnByb3RvdHlwZS5zdWJzdHIgLSBuZWdhdGl2ZSBpbmRleCBkb24ndCB3b3JrIGluIElFOFxuaWYgKCdhYicuc3Vic3RyKC0xKSAhPT0gJ2InKSB7XG4gIGV4cG9ydHMuc3Vic3RyID0gZnVuY3Rpb24gKHN0ciwgc3RhcnQsIGxlbmd0aCkge1xuICAgIC8vIGRpZCB3ZSBnZXQgYSBuZWdhdGl2ZSBzdGFydCwgY2FsY3VsYXRlIGhvdyBtdWNoIGl0IGlzIGZyb20gdGhlIGJlZ2lubmluZyBvZiB0aGUgc3RyaW5nXG4gICAgaWYgKHN0YXJ0IDwgMCkgc3RhcnQgPSBzdHIubGVuZ3RoICsgc3RhcnQ7XG5cbiAgICAvLyBjYWxsIHRoZSBvcmlnaW5hbCBmdW5jdGlvblxuICAgIHJldHVybiBzdHIuc3Vic3RyKHN0YXJ0LCBsZW5ndGgpO1xuICB9O1xufSBlbHNlIHtcbiAgZXhwb3J0cy5zdWJzdHIgPSBmdW5jdGlvbiAoc3RyLCBzdGFydCwgbGVuZ3RoKSB7XG4gICAgcmV0dXJuIHN0ci5zdWJzdHIoc3RhcnQsIGxlbmd0aCk7XG4gIH07XG59XG5cbi8vIFN0cmluZy5wcm90b3R5cGUudHJpbSBpcyBzdXBwb3J0ZWQgaW4gSUU5XG5leHBvcnRzLnRyaW0gPSBmdW5jdGlvbiAoc3RyKSB7XG4gIGlmIChzdHIudHJpbSkgcmV0dXJuIHN0ci50cmltKCk7XG4gIHJldHVybiBzdHIucmVwbGFjZSgvXlxccyt8XFxzKyQvZywgJycpO1xufTtcblxuLy8gRnVuY3Rpb24ucHJvdG90eXBlLmJpbmQgaXMgc3VwcG9ydGVkIGluIElFOVxuZXhwb3J0cy5iaW5kID0gZnVuY3Rpb24gKCkge1xuICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cyk7XG4gIHZhciBmbiA9IGFyZ3Muc2hpZnQoKTtcbiAgaWYgKGZuLmJpbmQpIHJldHVybiBmbi5iaW5kLmFwcGx5KGZuLCBhcmdzKTtcbiAgdmFyIHNlbGYgPSBhcmdzLnNoaWZ0KCk7XG4gIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgZm4uYXBwbHkoc2VsZiwgYXJncy5jb25jYXQoW0FycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cyldKSk7XG4gIH07XG59O1xuXG4vLyBPYmplY3QuY3JlYXRlIGlzIHN1cHBvcnRlZCBpbiBJRTlcbmZ1bmN0aW9uIGNyZWF0ZShwcm90b3R5cGUsIHByb3BlcnRpZXMpIHtcbiAgdmFyIG9iamVjdDtcbiAgaWYgKHByb3RvdHlwZSA9PT0gbnVsbCkge1xuICAgIG9iamVjdCA9IHsgJ19fcHJvdG9fXycgOiBudWxsIH07XG4gIH1cbiAgZWxzZSB7XG4gICAgaWYgKHR5cGVvZiBwcm90b3R5cGUgIT09ICdvYmplY3QnKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgICAndHlwZW9mIHByb3RvdHlwZVsnICsgKHR5cGVvZiBwcm90b3R5cGUpICsgJ10gIT0gXFwnb2JqZWN0XFwnJ1xuICAgICAgKTtcbiAgICB9XG4gICAgdmFyIFR5cGUgPSBmdW5jdGlvbiAoKSB7fTtcbiAgICBUeXBlLnByb3RvdHlwZSA9IHByb3RvdHlwZTtcbiAgICBvYmplY3QgPSBuZXcgVHlwZSgpO1xuICAgIG9iamVjdC5fX3Byb3RvX18gPSBwcm90b3R5cGU7XG4gIH1cbiAgaWYgKHR5cGVvZiBwcm9wZXJ0aWVzICE9PSAndW5kZWZpbmVkJyAmJiBPYmplY3QuZGVmaW5lUHJvcGVydGllcykge1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKG9iamVjdCwgcHJvcGVydGllcyk7XG4gIH1cbiAgcmV0dXJuIG9iamVjdDtcbn1cbmV4cG9ydHMuY3JlYXRlID0gdHlwZW9mIE9iamVjdC5jcmVhdGUgPT09ICdmdW5jdGlvbicgPyBPYmplY3QuY3JlYXRlIDogY3JlYXRlO1xuXG4vLyBPYmplY3Qua2V5cyBhbmQgT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMgaXMgc3VwcG9ydGVkIGluIElFOSBob3dldmVyXG4vLyB0aGV5IGRvIHNob3cgYSBkZXNjcmlwdGlvbiBhbmQgbnVtYmVyIHByb3BlcnR5IG9uIEVycm9yIG9iamVjdHNcbmZ1bmN0aW9uIG5vdE9iamVjdChvYmplY3QpIHtcbiAgcmV0dXJuICgodHlwZW9mIG9iamVjdCAhPSBcIm9iamVjdFwiICYmIHR5cGVvZiBvYmplY3QgIT0gXCJmdW5jdGlvblwiKSB8fCBvYmplY3QgPT09IG51bGwpO1xufVxuXG5mdW5jdGlvbiBrZXlzU2hpbShvYmplY3QpIHtcbiAgaWYgKG5vdE9iamVjdChvYmplY3QpKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIk9iamVjdC5rZXlzIGNhbGxlZCBvbiBhIG5vbi1vYmplY3RcIik7XG4gIH1cblxuICB2YXIgcmVzdWx0ID0gW107XG4gIGZvciAodmFyIG5hbWUgaW4gb2JqZWN0KSB7XG4gICAgaWYgKGhhc093blByb3BlcnR5LmNhbGwob2JqZWN0LCBuYW1lKSkge1xuICAgICAgcmVzdWx0LnB1c2gobmFtZSk7XG4gICAgfVxuICB9XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbi8vIGdldE93blByb3BlcnR5TmFtZXMgaXMgYWxtb3N0IHRoZSBzYW1lIGFzIE9iamVjdC5rZXlzIG9uZSBrZXkgZmVhdHVyZVxuLy8gIGlzIHRoYXQgaXQgcmV0dXJucyBoaWRkZW4gcHJvcGVydGllcywgc2luY2UgdGhhdCBjYW4ndCBiZSBpbXBsZW1lbnRlZCxcbi8vICB0aGlzIGZlYXR1cmUgZ2V0cyByZWR1Y2VkIHNvIGl0IGp1c3Qgc2hvd3MgdGhlIGxlbmd0aCBwcm9wZXJ0eSBvbiBhcnJheXNcbmZ1bmN0aW9uIHByb3BlcnR5U2hpbShvYmplY3QpIHtcbiAgaWYgKG5vdE9iamVjdChvYmplY3QpKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIk9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzIGNhbGxlZCBvbiBhIG5vbi1vYmplY3RcIik7XG4gIH1cblxuICB2YXIgcmVzdWx0ID0ga2V5c1NoaW0ob2JqZWN0KTtcbiAgaWYgKGV4cG9ydHMuaXNBcnJheShvYmplY3QpICYmIGV4cG9ydHMuaW5kZXhPZihvYmplY3QsICdsZW5ndGgnKSA9PT0gLTEpIHtcbiAgICByZXN1bHQucHVzaCgnbGVuZ3RoJyk7XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxudmFyIGtleXMgPSB0eXBlb2YgT2JqZWN0LmtleXMgPT09ICdmdW5jdGlvbicgPyBPYmplY3Qua2V5cyA6IGtleXNTaGltO1xudmFyIGdldE93blByb3BlcnR5TmFtZXMgPSB0eXBlb2YgT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMgPT09ICdmdW5jdGlvbicgP1xuICBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyA6IHByb3BlcnR5U2hpbTtcblxuaWYgKG5ldyBFcnJvcigpLmhhc093blByb3BlcnR5KCdkZXNjcmlwdGlvbicpKSB7XG4gIHZhciBFUlJPUl9QUk9QRVJUWV9GSUxURVIgPSBmdW5jdGlvbiAob2JqLCBhcnJheSkge1xuICAgIGlmICh0b1N0cmluZy5jYWxsKG9iaikgPT09ICdbb2JqZWN0IEVycm9yXScpIHtcbiAgICAgIGFycmF5ID0gZXhwb3J0cy5maWx0ZXIoYXJyYXksIGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgIHJldHVybiBuYW1lICE9PSAnZGVzY3JpcHRpb24nICYmIG5hbWUgIT09ICdudW1iZXInICYmIG5hbWUgIT09ICdtZXNzYWdlJztcbiAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gYXJyYXk7XG4gIH07XG5cbiAgZXhwb3J0cy5rZXlzID0gZnVuY3Rpb24gKG9iamVjdCkge1xuICAgIHJldHVybiBFUlJPUl9QUk9QRVJUWV9GSUxURVIob2JqZWN0LCBrZXlzKG9iamVjdCkpO1xuICB9O1xuICBleHBvcnRzLmdldE93blByb3BlcnR5TmFtZXMgPSBmdW5jdGlvbiAob2JqZWN0KSB7XG4gICAgcmV0dXJuIEVSUk9SX1BST1BFUlRZX0ZJTFRFUihvYmplY3QsIGdldE93blByb3BlcnR5TmFtZXMob2JqZWN0KSk7XG4gIH07XG59IGVsc2Uge1xuICBleHBvcnRzLmtleXMgPSBrZXlzO1xuICBleHBvcnRzLmdldE93blByb3BlcnR5TmFtZXMgPSBnZXRPd25Qcm9wZXJ0eU5hbWVzO1xufVxuXG4vLyBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yIC0gc3VwcG9ydGVkIGluIElFOCBidXQgb25seSBvbiBkb20gZWxlbWVudHNcbmZ1bmN0aW9uIHZhbHVlT2JqZWN0KHZhbHVlLCBrZXkpIHtcbiAgcmV0dXJuIHsgdmFsdWU6IHZhbHVlW2tleV0gfTtcbn1cblxuaWYgKHR5cGVvZiBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yID09PSAnZnVuY3Rpb24nKSB7XG4gIHRyeSB7XG4gICAgT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih7J2EnOiAxfSwgJ2EnKTtcbiAgICBleHBvcnRzLmdldE93blByb3BlcnR5RGVzY3JpcHRvciA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3I7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICAvLyBJRTggZG9tIGVsZW1lbnQgaXNzdWUgLSB1c2UgYSB0cnkgY2F0Y2ggYW5kIGRlZmF1bHQgdG8gdmFsdWVPYmplY3RcbiAgICBleHBvcnRzLmdldE93blByb3BlcnR5RGVzY3JpcHRvciA9IGZ1bmN0aW9uICh2YWx1ZSwga2V5KSB7XG4gICAgICB0cnkge1xuICAgICAgICByZXR1cm4gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih2YWx1ZSwga2V5KTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlT2JqZWN0KHZhbHVlLCBrZXkpO1xuICAgICAgfVxuICAgIH07XG4gIH1cbn0gZWxzZSB7XG4gIGV4cG9ydHMuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yID0gdmFsdWVPYmplY3Q7XG59XG4iLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxudmFyIHV0aWwgPSByZXF1aXJlKCd1dGlsJyk7XG5cbmZ1bmN0aW9uIEV2ZW50RW1pdHRlcigpIHtcbiAgdGhpcy5fZXZlbnRzID0gdGhpcy5fZXZlbnRzIHx8IHt9O1xuICB0aGlzLl9tYXhMaXN0ZW5lcnMgPSB0aGlzLl9tYXhMaXN0ZW5lcnMgfHwgdW5kZWZpbmVkO1xufVxubW9kdWxlLmV4cG9ydHMgPSBFdmVudEVtaXR0ZXI7XG5cbi8vIEJhY2t3YXJkcy1jb21wYXQgd2l0aCBub2RlIDAuMTAueFxuRXZlbnRFbWl0dGVyLkV2ZW50RW1pdHRlciA9IEV2ZW50RW1pdHRlcjtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5fZXZlbnRzID0gdW5kZWZpbmVkO1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5fbWF4TGlzdGVuZXJzID0gdW5kZWZpbmVkO1xuXG4vLyBCeSBkZWZhdWx0IEV2ZW50RW1pdHRlcnMgd2lsbCBwcmludCBhIHdhcm5pbmcgaWYgbW9yZSB0aGFuIDEwIGxpc3RlbmVycyBhcmVcbi8vIGFkZGVkIHRvIGl0LiBUaGlzIGlzIGEgdXNlZnVsIGRlZmF1bHQgd2hpY2ggaGVscHMgZmluZGluZyBtZW1vcnkgbGVha3MuXG5FdmVudEVtaXR0ZXIuZGVmYXVsdE1heExpc3RlbmVycyA9IDEwO1xuXG4vLyBPYnZpb3VzbHkgbm90IGFsbCBFbWl0dGVycyBzaG91bGQgYmUgbGltaXRlZCB0byAxMC4gVGhpcyBmdW5jdGlvbiBhbGxvd3Ncbi8vIHRoYXQgdG8gYmUgaW5jcmVhc2VkLiBTZXQgdG8gemVybyBmb3IgdW5saW1pdGVkLlxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5zZXRNYXhMaXN0ZW5lcnMgPSBmdW5jdGlvbihuKSB7XG4gIGlmICghdXRpbC5pc051bWJlcihuKSB8fCBuIDwgMClcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ24gbXVzdCBiZSBhIHBvc2l0aXZlIG51bWJlcicpO1xuICB0aGlzLl9tYXhMaXN0ZW5lcnMgPSBuO1xuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIGVyLCBoYW5kbGVyLCBsZW4sIGFyZ3MsIGksIGxpc3RlbmVycztcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcblxuICAvLyBJZiB0aGVyZSBpcyBubyAnZXJyb3InIGV2ZW50IGxpc3RlbmVyIHRoZW4gdGhyb3cuXG4gIGlmICh0eXBlID09PSAnZXJyb3InKSB7XG4gICAgaWYgKCF0aGlzLl9ldmVudHMuZXJyb3IgfHxcbiAgICAgICAgKHV0aWwuaXNPYmplY3QodGhpcy5fZXZlbnRzLmVycm9yKSAmJiAhdGhpcy5fZXZlbnRzLmVycm9yLmxlbmd0aCkpIHtcbiAgICAgIGVyID0gYXJndW1lbnRzWzFdO1xuICAgICAgaWYgKGVyIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgICAgdGhyb3cgZXI7IC8vIFVuaGFuZGxlZCAnZXJyb3InIGV2ZW50XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBUeXBlRXJyb3IoJ1VuY2F1Z2h0LCB1bnNwZWNpZmllZCBcImVycm9yXCIgZXZlbnQuJyk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgaGFuZGxlciA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICBpZiAodXRpbC5pc1VuZGVmaW5lZChoYW5kbGVyKSlcbiAgICByZXR1cm4gZmFsc2U7XG5cbiAgaWYgKHV0aWwuaXNGdW5jdGlvbihoYW5kbGVyKSkge1xuICAgIHN3aXRjaCAoYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgLy8gZmFzdCBjYXNlc1xuICAgICAgY2FzZSAxOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAyOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcywgYXJndW1lbnRzWzFdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDM6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0sIGFyZ3VtZW50c1syXSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgLy8gc2xvd2VyXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBsZW4gPSBhcmd1bWVudHMubGVuZ3RoO1xuICAgICAgICBhcmdzID0gbmV3IEFycmF5KGxlbiAtIDEpO1xuICAgICAgICBmb3IgKGkgPSAxOyBpIDwgbGVuOyBpKyspXG4gICAgICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgICAgIGhhbmRsZXIuYXBwbHkodGhpcywgYXJncyk7XG4gICAgfVxuICB9IGVsc2UgaWYgKHV0aWwuaXNPYmplY3QoaGFuZGxlcikpIHtcbiAgICBsZW4gPSBhcmd1bWVudHMubGVuZ3RoO1xuICAgIGFyZ3MgPSBuZXcgQXJyYXkobGVuIC0gMSk7XG4gICAgZm9yIChpID0gMTsgaSA8IGxlbjsgaSsrKVxuICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG5cbiAgICBsaXN0ZW5lcnMgPSBoYW5kbGVyLnNsaWNlKCk7XG4gICAgbGVuID0gbGlzdGVuZXJzLmxlbmd0aDtcbiAgICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpKyspXG4gICAgICBsaXN0ZW5lcnNbaV0uYXBwbHkodGhpcywgYXJncyk7XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXIgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICB2YXIgbTtcblxuICBpZiAoIXV0aWwuaXNGdW5jdGlvbihsaXN0ZW5lcikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCdsaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcblxuICAvLyBUbyBhdm9pZCByZWN1cnNpb24gaW4gdGhlIGNhc2UgdGhhdCB0eXBlID09PSBcIm5ld0xpc3RlbmVyXCIhIEJlZm9yZVxuICAvLyBhZGRpbmcgaXQgdG8gdGhlIGxpc3RlbmVycywgZmlyc3QgZW1pdCBcIm5ld0xpc3RlbmVyXCIuXG4gIGlmICh0aGlzLl9ldmVudHMubmV3TGlzdGVuZXIpXG4gICAgdGhpcy5lbWl0KCduZXdMaXN0ZW5lcicsIHR5cGUsXG4gICAgICAgICAgICAgIHV0aWwuaXNGdW5jdGlvbihsaXN0ZW5lci5saXN0ZW5lcikgP1xuICAgICAgICAgICAgICBsaXN0ZW5lci5saXN0ZW5lciA6IGxpc3RlbmVyKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICAvLyBPcHRpbWl6ZSB0aGUgY2FzZSBvZiBvbmUgbGlzdGVuZXIuIERvbid0IG5lZWQgdGhlIGV4dHJhIGFycmF5IG9iamVjdC5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBsaXN0ZW5lcjtcbiAgZWxzZSBpZiAodXRpbC5pc09iamVjdCh0aGlzLl9ldmVudHNbdHlwZV0pKVxuICAgIC8vIElmIHdlJ3ZlIGFscmVhZHkgZ290IGFuIGFycmF5LCBqdXN0IGFwcGVuZC5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0ucHVzaChsaXN0ZW5lcik7XG4gIGVsc2VcbiAgICAvLyBBZGRpbmcgdGhlIHNlY29uZCBlbGVtZW50LCBuZWVkIHRvIGNoYW5nZSB0byBhcnJheS5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBbdGhpcy5fZXZlbnRzW3R5cGVdLCBsaXN0ZW5lcl07XG5cbiAgLy8gQ2hlY2sgZm9yIGxpc3RlbmVyIGxlYWtcbiAgaWYgKHV0aWwuaXNPYmplY3QodGhpcy5fZXZlbnRzW3R5cGVdKSAmJiAhdGhpcy5fZXZlbnRzW3R5cGVdLndhcm5lZCkge1xuICAgIHZhciBtO1xuICAgIGlmICghdXRpbC5pc1VuZGVmaW5lZCh0aGlzLl9tYXhMaXN0ZW5lcnMpKSB7XG4gICAgICBtID0gdGhpcy5fbWF4TGlzdGVuZXJzO1xuICAgIH0gZWxzZSB7XG4gICAgICBtID0gRXZlbnRFbWl0dGVyLmRlZmF1bHRNYXhMaXN0ZW5lcnM7XG4gICAgfVxuXG4gICAgaWYgKG0gJiYgbSA+IDAgJiYgdGhpcy5fZXZlbnRzW3R5cGVdLmxlbmd0aCA+IG0pIHtcbiAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXS53YXJuZWQgPSB0cnVlO1xuICAgICAgY29uc29sZS5lcnJvcignKG5vZGUpIHdhcm5pbmc6IHBvc3NpYmxlIEV2ZW50RW1pdHRlciBtZW1vcnkgJyArXG4gICAgICAgICAgICAgICAgICAgICdsZWFrIGRldGVjdGVkLiAlZCBsaXN0ZW5lcnMgYWRkZWQuICcgK1xuICAgICAgICAgICAgICAgICAgICAnVXNlIGVtaXR0ZXIuc2V0TWF4TGlzdGVuZXJzKCkgdG8gaW5jcmVhc2UgbGltaXQuJyxcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLmxlbmd0aCk7XG4gICAgICBjb25zb2xlLnRyYWNlKCk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lcjtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbmNlID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgaWYgKCF1dGlsLmlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgZnVuY3Rpb24gZygpIHtcbiAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGcpO1xuICAgIGxpc3RlbmVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gIH1cblxuICBnLmxpc3RlbmVyID0gbGlzdGVuZXI7XG4gIHRoaXMub24odHlwZSwgZyk7XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vLyBlbWl0cyBhICdyZW1vdmVMaXN0ZW5lcicgZXZlbnQgaWZmIHRoZSBsaXN0ZW5lciB3YXMgcmVtb3ZlZFxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lciA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIHZhciBsaXN0LCBwb3NpdGlvbiwgbGVuZ3RoLCBpO1xuXG4gIGlmICghdXRpbC5pc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzIHx8ICF0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgcmV0dXJuIHRoaXM7XG5cbiAgbGlzdCA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgbGVuZ3RoID0gbGlzdC5sZW5ndGg7XG4gIHBvc2l0aW9uID0gLTE7XG5cbiAgaWYgKGxpc3QgPT09IGxpc3RlbmVyIHx8XG4gICAgICAodXRpbC5pc0Z1bmN0aW9uKGxpc3QubGlzdGVuZXIpICYmIGxpc3QubGlzdGVuZXIgPT09IGxpc3RlbmVyKSkge1xuICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgaWYgKHRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcilcbiAgICAgIHRoaXMuZW1pdCgncmVtb3ZlTGlzdGVuZXInLCB0eXBlLCBsaXN0ZW5lcik7XG5cbiAgfSBlbHNlIGlmICh1dGlsLmlzT2JqZWN0KGxpc3QpKSB7XG4gICAgZm9yIChpID0gbGVuZ3RoOyBpLS0gPiAwOykge1xuICAgICAgaWYgKGxpc3RbaV0gPT09IGxpc3RlbmVyIHx8XG4gICAgICAgICAgKGxpc3RbaV0ubGlzdGVuZXIgJiYgbGlzdFtpXS5saXN0ZW5lciA9PT0gbGlzdGVuZXIpKSB7XG4gICAgICAgIHBvc2l0aW9uID0gaTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHBvc2l0aW9uIDwgMClcbiAgICAgIHJldHVybiB0aGlzO1xuXG4gICAgaWYgKGxpc3QubGVuZ3RoID09PSAxKSB7XG4gICAgICBsaXN0Lmxlbmd0aCA9IDA7XG4gICAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICAgIH0gZWxzZSB7XG4gICAgICBsaXN0LnNwbGljZShwb3NpdGlvbiwgMSk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcilcbiAgICAgIHRoaXMuZW1pdCgncmVtb3ZlTGlzdGVuZXInLCB0eXBlLCBsaXN0ZW5lcik7XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlQWxsTGlzdGVuZXJzID0gZnVuY3Rpb24odHlwZSkge1xuICB2YXIga2V5LCBsaXN0ZW5lcnM7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpXG4gICAgcmV0dXJuIHRoaXM7XG5cbiAgLy8gbm90IGxpc3RlbmluZyBmb3IgcmVtb3ZlTGlzdGVuZXIsIG5vIG5lZWQgdG8gZW1pdFxuICBpZiAoIXRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcikge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKVxuICAgICAgdGhpcy5fZXZlbnRzID0ge307XG4gICAgZWxzZSBpZiAodGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIGVtaXQgcmVtb3ZlTGlzdGVuZXIgZm9yIGFsbCBsaXN0ZW5lcnMgb24gYWxsIGV2ZW50c1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgIGZvciAoa2V5IGluIHRoaXMuX2V2ZW50cykge1xuICAgICAgaWYgKGtleSA9PT0gJ3JlbW92ZUxpc3RlbmVyJykgY29udGludWU7XG4gICAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycyhrZXkpO1xuICAgIH1cbiAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycygncmVtb3ZlTGlzdGVuZXInKTtcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGxpc3RlbmVycyA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICBpZiAodXRpbC5pc0Z1bmN0aW9uKGxpc3RlbmVycykpIHtcbiAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGxpc3RlbmVycyk7XG4gIH0gZWxzZSB7XG4gICAgLy8gTElGTyBvcmRlclxuICAgIHdoaWxlIChsaXN0ZW5lcnMubGVuZ3RoKVxuICAgICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcnNbbGlzdGVuZXJzLmxlbmd0aCAtIDFdKTtcbiAgfVxuICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5saXN0ZW5lcnMgPSBmdW5jdGlvbih0eXBlKSB7XG4gIHZhciByZXQ7XG4gIGlmICghdGhpcy5fZXZlbnRzIHx8ICF0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgcmV0ID0gW107XG4gIGVsc2UgaWYgKHV0aWwuaXNGdW5jdGlvbih0aGlzLl9ldmVudHNbdHlwZV0pKVxuICAgIHJldCA9IFt0aGlzLl9ldmVudHNbdHlwZV1dO1xuICBlbHNlXG4gICAgcmV0ID0gdGhpcy5fZXZlbnRzW3R5cGVdLnNsaWNlKCk7XG4gIHJldHVybiByZXQ7XG59O1xuXG5FdmVudEVtaXR0ZXIubGlzdGVuZXJDb3VudCA9IGZ1bmN0aW9uKGVtaXR0ZXIsIHR5cGUpIHtcbiAgdmFyIHJldDtcbiAgaWYgKCFlbWl0dGVyLl9ldmVudHMgfHwgIWVtaXR0ZXIuX2V2ZW50c1t0eXBlXSlcbiAgICByZXQgPSAwO1xuICBlbHNlIGlmICh1dGlsLmlzRnVuY3Rpb24oZW1pdHRlci5fZXZlbnRzW3R5cGVdKSlcbiAgICByZXQgPSAxO1xuICBlbHNlXG4gICAgcmV0ID0gZW1pdHRlci5fZXZlbnRzW3R5cGVdLmxlbmd0aDtcbiAgcmV0dXJuIHJldDtcbn07IiwiXG4vLyBub3QgaW1wbGVtZW50ZWRcbi8vIFRoZSByZWFzb24gZm9yIGhhdmluZyBhbiBlbXB0eSBmaWxlIGFuZCBub3QgdGhyb3dpbmcgaXMgdG8gYWxsb3dcbi8vIHVudHJhZGl0aW9uYWwgaW1wbGVtZW50YXRpb24gb2YgdGhpcyBtb2R1bGUuXG4iLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxudmFyIHNoaW1zID0gcmVxdWlyZSgnX3NoaW1zJyk7XG5cbnZhciBmb3JtYXRSZWdFeHAgPSAvJVtzZGolXS9nO1xuZXhwb3J0cy5mb3JtYXQgPSBmdW5jdGlvbihmKSB7XG4gIGlmICghaXNTdHJpbmcoZikpIHtcbiAgICB2YXIgb2JqZWN0cyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBvYmplY3RzLnB1c2goaW5zcGVjdChhcmd1bWVudHNbaV0pKTtcbiAgICB9XG4gICAgcmV0dXJuIG9iamVjdHMuam9pbignICcpO1xuICB9XG5cbiAgdmFyIGkgPSAxO1xuICB2YXIgYXJncyA9IGFyZ3VtZW50cztcbiAgdmFyIGxlbiA9IGFyZ3MubGVuZ3RoO1xuICB2YXIgc3RyID0gU3RyaW5nKGYpLnJlcGxhY2UoZm9ybWF0UmVnRXhwLCBmdW5jdGlvbih4KSB7XG4gICAgaWYgKHggPT09ICclJScpIHJldHVybiAnJSc7XG4gICAgaWYgKGkgPj0gbGVuKSByZXR1cm4geDtcbiAgICBzd2l0Y2ggKHgpIHtcbiAgICAgIGNhc2UgJyVzJzogcmV0dXJuIFN0cmluZyhhcmdzW2krK10pO1xuICAgICAgY2FzZSAnJWQnOiByZXR1cm4gTnVtYmVyKGFyZ3NbaSsrXSk7XG4gICAgICBjYXNlICclaic6XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KGFyZ3NbaSsrXSk7XG4gICAgICAgIH0gY2F0Y2ggKF8pIHtcbiAgICAgICAgICByZXR1cm4gJ1tDaXJjdWxhcl0nO1xuICAgICAgICB9XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4geDtcbiAgICB9XG4gIH0pO1xuICBmb3IgKHZhciB4ID0gYXJnc1tpXTsgaSA8IGxlbjsgeCA9IGFyZ3NbKytpXSkge1xuICAgIGlmIChpc051bGwoeCkgfHwgIWlzT2JqZWN0KHgpKSB7XG4gICAgICBzdHIgKz0gJyAnICsgeDtcbiAgICB9IGVsc2Uge1xuICAgICAgc3RyICs9ICcgJyArIGluc3BlY3QoeCk7XG4gICAgfVxuICB9XG4gIHJldHVybiBzdHI7XG59O1xuXG4vKipcbiAqIEVjaG9zIHRoZSB2YWx1ZSBvZiBhIHZhbHVlLiBUcnlzIHRvIHByaW50IHRoZSB2YWx1ZSBvdXRcbiAqIGluIHRoZSBiZXN0IHdheSBwb3NzaWJsZSBnaXZlbiB0aGUgZGlmZmVyZW50IHR5cGVzLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmogVGhlIG9iamVjdCB0byBwcmludCBvdXQuXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0cyBPcHRpb25hbCBvcHRpb25zIG9iamVjdCB0aGF0IGFsdGVycyB0aGUgb3V0cHV0LlxuICovXG4vKiBsZWdhY3k6IG9iaiwgc2hvd0hpZGRlbiwgZGVwdGgsIGNvbG9ycyovXG5mdW5jdGlvbiBpbnNwZWN0KG9iaiwgb3B0cykge1xuICAvLyBkZWZhdWx0IG9wdGlvbnNcbiAgdmFyIGN0eCA9IHtcbiAgICBzZWVuOiBbXSxcbiAgICBzdHlsaXplOiBzdHlsaXplTm9Db2xvclxuICB9O1xuICAvLyBsZWdhY3kuLi5cbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPj0gMykgY3R4LmRlcHRoID0gYXJndW1lbnRzWzJdO1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+PSA0KSBjdHguY29sb3JzID0gYXJndW1lbnRzWzNdO1xuICBpZiAoaXNCb29sZWFuKG9wdHMpKSB7XG4gICAgLy8gbGVnYWN5Li4uXG4gICAgY3R4LnNob3dIaWRkZW4gPSBvcHRzO1xuICB9IGVsc2UgaWYgKG9wdHMpIHtcbiAgICAvLyBnb3QgYW4gXCJvcHRpb25zXCIgb2JqZWN0XG4gICAgZXhwb3J0cy5fZXh0ZW5kKGN0eCwgb3B0cyk7XG4gIH1cbiAgLy8gc2V0IGRlZmF1bHQgb3B0aW9uc1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LnNob3dIaWRkZW4pKSBjdHguc2hvd0hpZGRlbiA9IGZhbHNlO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmRlcHRoKSkgY3R4LmRlcHRoID0gMjtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5jb2xvcnMpKSBjdHguY29sb3JzID0gZmFsc2U7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguY3VzdG9tSW5zcGVjdCkpIGN0eC5jdXN0b21JbnNwZWN0ID0gdHJ1ZTtcbiAgaWYgKGN0eC5jb2xvcnMpIGN0eC5zdHlsaXplID0gc3R5bGl6ZVdpdGhDb2xvcjtcbiAgcmV0dXJuIGZvcm1hdFZhbHVlKGN0eCwgb2JqLCBjdHguZGVwdGgpO1xufVxuZXhwb3J0cy5pbnNwZWN0ID0gaW5zcGVjdDtcblxuXG4vLyBodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0FOU0lfZXNjYXBlX2NvZGUjZ3JhcGhpY3Ncbmluc3BlY3QuY29sb3JzID0ge1xuICAnYm9sZCcgOiBbMSwgMjJdLFxuICAnaXRhbGljJyA6IFszLCAyM10sXG4gICd1bmRlcmxpbmUnIDogWzQsIDI0XSxcbiAgJ2ludmVyc2UnIDogWzcsIDI3XSxcbiAgJ3doaXRlJyA6IFszNywgMzldLFxuICAnZ3JleScgOiBbOTAsIDM5XSxcbiAgJ2JsYWNrJyA6IFszMCwgMzldLFxuICAnYmx1ZScgOiBbMzQsIDM5XSxcbiAgJ2N5YW4nIDogWzM2LCAzOV0sXG4gICdncmVlbicgOiBbMzIsIDM5XSxcbiAgJ21hZ2VudGEnIDogWzM1LCAzOV0sXG4gICdyZWQnIDogWzMxLCAzOV0sXG4gICd5ZWxsb3cnIDogWzMzLCAzOV1cbn07XG5cbi8vIERvbid0IHVzZSAnYmx1ZScgbm90IHZpc2libGUgb24gY21kLmV4ZVxuaW5zcGVjdC5zdHlsZXMgPSB7XG4gICdzcGVjaWFsJzogJ2N5YW4nLFxuICAnbnVtYmVyJzogJ3llbGxvdycsXG4gICdib29sZWFuJzogJ3llbGxvdycsXG4gICd1bmRlZmluZWQnOiAnZ3JleScsXG4gICdudWxsJzogJ2JvbGQnLFxuICAnc3RyaW5nJzogJ2dyZWVuJyxcbiAgJ2RhdGUnOiAnbWFnZW50YScsXG4gIC8vIFwibmFtZVwiOiBpbnRlbnRpb25hbGx5IG5vdCBzdHlsaW5nXG4gICdyZWdleHAnOiAncmVkJ1xufTtcblxuXG5mdW5jdGlvbiBzdHlsaXplV2l0aENvbG9yKHN0ciwgc3R5bGVUeXBlKSB7XG4gIHZhciBzdHlsZSA9IGluc3BlY3Quc3R5bGVzW3N0eWxlVHlwZV07XG5cbiAgaWYgKHN0eWxlKSB7XG4gICAgcmV0dXJuICdcXHUwMDFiWycgKyBpbnNwZWN0LmNvbG9yc1tzdHlsZV1bMF0gKyAnbScgKyBzdHIgK1xuICAgICAgICAgICAnXFx1MDAxYlsnICsgaW5zcGVjdC5jb2xvcnNbc3R5bGVdWzFdICsgJ20nO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBzdHI7XG4gIH1cbn1cblxuXG5mdW5jdGlvbiBzdHlsaXplTm9Db2xvcihzdHIsIHN0eWxlVHlwZSkge1xuICByZXR1cm4gc3RyO1xufVxuXG5cbmZ1bmN0aW9uIGFycmF5VG9IYXNoKGFycmF5KSB7XG4gIHZhciBoYXNoID0ge307XG5cbiAgc2hpbXMuZm9yRWFjaChhcnJheSwgZnVuY3Rpb24odmFsLCBpZHgpIHtcbiAgICBoYXNoW3ZhbF0gPSB0cnVlO1xuICB9KTtcblxuICByZXR1cm4gaGFzaDtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRWYWx1ZShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMpIHtcbiAgLy8gUHJvdmlkZSBhIGhvb2sgZm9yIHVzZXItc3BlY2lmaWVkIGluc3BlY3QgZnVuY3Rpb25zLlxuICAvLyBDaGVjayB0aGF0IHZhbHVlIGlzIGFuIG9iamVjdCB3aXRoIGFuIGluc3BlY3QgZnVuY3Rpb24gb24gaXRcbiAgaWYgKGN0eC5jdXN0b21JbnNwZWN0ICYmXG4gICAgICB2YWx1ZSAmJlxuICAgICAgaXNGdW5jdGlvbih2YWx1ZS5pbnNwZWN0KSAmJlxuICAgICAgLy8gRmlsdGVyIG91dCB0aGUgdXRpbCBtb2R1bGUsIGl0J3MgaW5zcGVjdCBmdW5jdGlvbiBpcyBzcGVjaWFsXG4gICAgICB2YWx1ZS5pbnNwZWN0ICE9PSBleHBvcnRzLmluc3BlY3QgJiZcbiAgICAgIC8vIEFsc28gZmlsdGVyIG91dCBhbnkgcHJvdG90eXBlIG9iamVjdHMgdXNpbmcgdGhlIGNpcmN1bGFyIGNoZWNrLlxuICAgICAgISh2YWx1ZS5jb25zdHJ1Y3RvciAmJiB2YWx1ZS5jb25zdHJ1Y3Rvci5wcm90b3R5cGUgPT09IHZhbHVlKSkge1xuICAgIHZhciByZXQgPSB2YWx1ZS5pbnNwZWN0KHJlY3Vyc2VUaW1lcyk7XG4gICAgaWYgKCFpc1N0cmluZyhyZXQpKSB7XG4gICAgICByZXQgPSBmb3JtYXRWYWx1ZShjdHgsIHJldCwgcmVjdXJzZVRpbWVzKTtcbiAgICB9XG4gICAgcmV0dXJuIHJldDtcbiAgfVxuXG4gIC8vIFByaW1pdGl2ZSB0eXBlcyBjYW5ub3QgaGF2ZSBwcm9wZXJ0aWVzXG4gIHZhciBwcmltaXRpdmUgPSBmb3JtYXRQcmltaXRpdmUoY3R4LCB2YWx1ZSk7XG4gIGlmIChwcmltaXRpdmUpIHtcbiAgICByZXR1cm4gcHJpbWl0aXZlO1xuICB9XG5cbiAgLy8gTG9vayB1cCB0aGUga2V5cyBvZiB0aGUgb2JqZWN0LlxuICB2YXIga2V5cyA9IHNoaW1zLmtleXModmFsdWUpO1xuICB2YXIgdmlzaWJsZUtleXMgPSBhcnJheVRvSGFzaChrZXlzKTtcblxuICBpZiAoY3R4LnNob3dIaWRkZW4pIHtcbiAgICBrZXlzID0gc2hpbXMuZ2V0T3duUHJvcGVydHlOYW1lcyh2YWx1ZSk7XG4gIH1cblxuICAvLyBTb21lIHR5cGUgb2Ygb2JqZWN0IHdpdGhvdXQgcHJvcGVydGllcyBjYW4gYmUgc2hvcnRjdXR0ZWQuXG4gIGlmIChrZXlzLmxlbmd0aCA9PT0gMCkge1xuICAgIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xuICAgICAgdmFyIG5hbWUgPSB2YWx1ZS5uYW1lID8gJzogJyArIHZhbHVlLm5hbWUgOiAnJztcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZSgnW0Z1bmN0aW9uJyArIG5hbWUgKyAnXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICAgIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAncmVnZXhwJyk7XG4gICAgfVxuICAgIGlmIChpc0RhdGUodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoRGF0ZS5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdkYXRlJyk7XG4gICAgfVxuICAgIGlmIChpc0Vycm9yKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgICB9XG4gIH1cblxuICB2YXIgYmFzZSA9ICcnLCBhcnJheSA9IGZhbHNlLCBicmFjZXMgPSBbJ3snLCAnfSddO1xuXG4gIC8vIE1ha2UgQXJyYXkgc2F5IHRoYXQgdGhleSBhcmUgQXJyYXlcbiAgaWYgKGlzQXJyYXkodmFsdWUpKSB7XG4gICAgYXJyYXkgPSB0cnVlO1xuICAgIGJyYWNlcyA9IFsnWycsICddJ107XG4gIH1cblxuICAvLyBNYWtlIGZ1bmN0aW9ucyBzYXkgdGhhdCB0aGV5IGFyZSBmdW5jdGlvbnNcbiAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgdmFyIG4gPSB2YWx1ZS5uYW1lID8gJzogJyArIHZhbHVlLm5hbWUgOiAnJztcbiAgICBiYXNlID0gJyBbRnVuY3Rpb24nICsgbiArICddJztcbiAgfVxuXG4gIC8vIE1ha2UgUmVnRXhwcyBzYXkgdGhhdCB0aGV5IGFyZSBSZWdFeHBzXG4gIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKTtcbiAgfVxuXG4gIC8vIE1ha2UgZGF0ZXMgd2l0aCBwcm9wZXJ0aWVzIGZpcnN0IHNheSB0aGUgZGF0ZVxuICBpZiAoaXNEYXRlKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBEYXRlLnByb3RvdHlwZS50b1VUQ1N0cmluZy5jYWxsKHZhbHVlKTtcbiAgfVxuXG4gIC8vIE1ha2UgZXJyb3Igd2l0aCBtZXNzYWdlIGZpcnN0IHNheSB0aGUgZXJyb3JcbiAgaWYgKGlzRXJyb3IodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgfVxuXG4gIGlmIChrZXlzLmxlbmd0aCA9PT0gMCAmJiAoIWFycmF5IHx8IHZhbHVlLmxlbmd0aCA9PSAwKSkge1xuICAgIHJldHVybiBicmFjZXNbMF0gKyBiYXNlICsgYnJhY2VzWzFdO1xuICB9XG5cbiAgaWYgKHJlY3Vyc2VUaW1lcyA8IDApIHtcbiAgICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ3JlZ2V4cCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoJ1tPYmplY3RdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cblxuICBjdHguc2Vlbi5wdXNoKHZhbHVlKTtcblxuICB2YXIgb3V0cHV0O1xuICBpZiAoYXJyYXkpIHtcbiAgICBvdXRwdXQgPSBmb3JtYXRBcnJheShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXlzKTtcbiAgfSBlbHNlIHtcbiAgICBvdXRwdXQgPSBrZXlzLm1hcChmdW5jdGlvbihrZXkpIHtcbiAgICAgIHJldHVybiBmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXksIGFycmF5KTtcbiAgICB9KTtcbiAgfVxuXG4gIGN0eC5zZWVuLnBvcCgpO1xuXG4gIHJldHVybiByZWR1Y2VUb1NpbmdsZVN0cmluZyhvdXRwdXQsIGJhc2UsIGJyYWNlcyk7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0UHJpbWl0aXZlKGN0eCwgdmFsdWUpIHtcbiAgaWYgKGlzVW5kZWZpbmVkKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJ3VuZGVmaW5lZCcsICd1bmRlZmluZWQnKTtcbiAgaWYgKGlzU3RyaW5nKHZhbHVlKSkge1xuICAgIHZhciBzaW1wbGUgPSAnXFwnJyArIEpTT04uc3RyaW5naWZ5KHZhbHVlKS5yZXBsYWNlKC9eXCJ8XCIkL2csICcnKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcXFxcIi9nLCAnXCInKSArICdcXCcnO1xuICAgIHJldHVybiBjdHguc3R5bGl6ZShzaW1wbGUsICdzdHJpbmcnKTtcbiAgfVxuICBpZiAoaXNOdW1iZXIodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnJyArIHZhbHVlLCAnbnVtYmVyJyk7XG4gIGlmIChpc0Jvb2xlYW4odmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnJyArIHZhbHVlLCAnYm9vbGVhbicpO1xuICAvLyBGb3Igc29tZSByZWFzb24gdHlwZW9mIG51bGwgaXMgXCJvYmplY3RcIiwgc28gc3BlY2lhbCBjYXNlIGhlcmUuXG4gIGlmIChpc051bGwodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnbnVsbCcsICdudWxsJyk7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0RXJyb3IodmFsdWUpIHtcbiAgcmV0dXJuICdbJyArIEVycm9yLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSArICddJztcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRBcnJheShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXlzKSB7XG4gIHZhciBvdXRwdXQgPSBbXTtcbiAgZm9yICh2YXIgaSA9IDAsIGwgPSB2YWx1ZS5sZW5ndGg7IGkgPCBsOyArK2kpIHtcbiAgICBpZiAoaGFzT3duUHJvcGVydHkodmFsdWUsIFN0cmluZyhpKSkpIHtcbiAgICAgIG91dHB1dC5wdXNoKGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsXG4gICAgICAgICAgU3RyaW5nKGkpLCB0cnVlKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG91dHB1dC5wdXNoKCcnKTtcbiAgICB9XG4gIH1cblxuICBzaGltcy5mb3JFYWNoKGtleXMsIGZ1bmN0aW9uKGtleSkge1xuICAgIGlmICgha2V5Lm1hdGNoKC9eXFxkKyQvKSkge1xuICAgICAgb3V0cHV0LnB1c2goZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cyxcbiAgICAgICAgICBrZXksIHRydWUpKTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gb3V0cHV0O1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleSwgYXJyYXkpIHtcbiAgdmFyIG5hbWUsIHN0ciwgZGVzYztcbiAgZGVzYyA9IHNoaW1zLmdldE93blByb3BlcnR5RGVzY3JpcHRvcih2YWx1ZSwga2V5KSB8fCB7IHZhbHVlOiB2YWx1ZVtrZXldIH07XG4gIGlmIChkZXNjLmdldCkge1xuICAgIGlmIChkZXNjLnNldCkge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tHZXR0ZXIvU2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbR2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmIChkZXNjLnNldCkge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tTZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cblxuICBpZiAoIWhhc093blByb3BlcnR5KHZpc2libGVLZXlzLCBrZXkpKSB7XG4gICAgbmFtZSA9ICdbJyArIGtleSArICddJztcbiAgfVxuICBpZiAoIXN0cikge1xuICAgIGlmIChzaGltcy5pbmRleE9mKGN0eC5zZWVuLCBkZXNjLnZhbHVlKSA8IDApIHtcbiAgICAgIGlmIChpc051bGwocmVjdXJzZVRpbWVzKSkge1xuICAgICAgICBzdHIgPSBmb3JtYXRWYWx1ZShjdHgsIGRlc2MudmFsdWUsIG51bGwpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3RyID0gZm9ybWF0VmFsdWUoY3R4LCBkZXNjLnZhbHVlLCByZWN1cnNlVGltZXMgLSAxKTtcbiAgICAgIH1cbiAgICAgIGlmIChzdHIuaW5kZXhPZignXFxuJykgPiAtMSkge1xuICAgICAgICBpZiAoYXJyYXkpIHtcbiAgICAgICAgICBzdHIgPSBzdHIuc3BsaXQoJ1xcbicpLm1hcChmdW5jdGlvbihsaW5lKSB7XG4gICAgICAgICAgICByZXR1cm4gJyAgJyArIGxpbmU7XG4gICAgICAgICAgfSkuam9pbignXFxuJykuc3Vic3RyKDIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHN0ciA9ICdcXG4nICsgc3RyLnNwbGl0KCdcXG4nKS5tYXAoZnVuY3Rpb24obGluZSkge1xuICAgICAgICAgICAgcmV0dXJuICcgICAnICsgbGluZTtcbiAgICAgICAgICB9KS5qb2luKCdcXG4nKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0NpcmN1bGFyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG4gIGlmIChpc1VuZGVmaW5lZChuYW1lKSkge1xuICAgIGlmIChhcnJheSAmJiBrZXkubWF0Y2goL15cXGQrJC8pKSB7XG4gICAgICByZXR1cm4gc3RyO1xuICAgIH1cbiAgICBuYW1lID0gSlNPTi5zdHJpbmdpZnkoJycgKyBrZXkpO1xuICAgIGlmIChuYW1lLm1hdGNoKC9eXCIoW2EtekEtWl9dW2EtekEtWl8wLTldKilcIiQvKSkge1xuICAgICAgbmFtZSA9IG5hbWUuc3Vic3RyKDEsIG5hbWUubGVuZ3RoIC0gMik7XG4gICAgICBuYW1lID0gY3R4LnN0eWxpemUobmFtZSwgJ25hbWUnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmFtZSA9IG5hbWUucmVwbGFjZSgvJy9nLCBcIlxcXFwnXCIpXG4gICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXFxcXCIvZywgJ1wiJylcbiAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLyheXCJ8XCIkKS9nLCBcIidcIik7XG4gICAgICBuYW1lID0gY3R4LnN0eWxpemUobmFtZSwgJ3N0cmluZycpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBuYW1lICsgJzogJyArIHN0cjtcbn1cblxuXG5mdW5jdGlvbiByZWR1Y2VUb1NpbmdsZVN0cmluZyhvdXRwdXQsIGJhc2UsIGJyYWNlcykge1xuICB2YXIgbnVtTGluZXNFc3QgPSAwO1xuICB2YXIgbGVuZ3RoID0gc2hpbXMucmVkdWNlKG91dHB1dCwgZnVuY3Rpb24ocHJldiwgY3VyKSB7XG4gICAgbnVtTGluZXNFc3QrKztcbiAgICBpZiAoY3VyLmluZGV4T2YoJ1xcbicpID49IDApIG51bUxpbmVzRXN0Kys7XG4gICAgcmV0dXJuIHByZXYgKyBjdXIucmVwbGFjZSgvXFx1MDAxYlxcW1xcZFxcZD9tL2csICcnKS5sZW5ndGggKyAxO1xuICB9LCAwKTtcblxuICBpZiAobGVuZ3RoID4gNjApIHtcbiAgICByZXR1cm4gYnJhY2VzWzBdICtcbiAgICAgICAgICAgKGJhc2UgPT09ICcnID8gJycgOiBiYXNlICsgJ1xcbiAnKSArXG4gICAgICAgICAgICcgJyArXG4gICAgICAgICAgIG91dHB1dC5qb2luKCcsXFxuICAnKSArXG4gICAgICAgICAgICcgJyArXG4gICAgICAgICAgIGJyYWNlc1sxXTtcbiAgfVxuXG4gIHJldHVybiBicmFjZXNbMF0gKyBiYXNlICsgJyAnICsgb3V0cHV0LmpvaW4oJywgJykgKyAnICcgKyBicmFjZXNbMV07XG59XG5cblxuLy8gTk9URTogVGhlc2UgdHlwZSBjaGVja2luZyBmdW5jdGlvbnMgaW50ZW50aW9uYWxseSBkb24ndCB1c2UgYGluc3RhbmNlb2ZgXG4vLyBiZWNhdXNlIGl0IGlzIGZyYWdpbGUgYW5kIGNhbiBiZSBlYXNpbHkgZmFrZWQgd2l0aCBgT2JqZWN0LmNyZWF0ZSgpYC5cbmZ1bmN0aW9uIGlzQXJyYXkoYXIpIHtcbiAgcmV0dXJuIHNoaW1zLmlzQXJyYXkoYXIpO1xufVxuZXhwb3J0cy5pc0FycmF5ID0gaXNBcnJheTtcblxuZnVuY3Rpb24gaXNCb29sZWFuKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Jvb2xlYW4nO1xufVxuZXhwb3J0cy5pc0Jvb2xlYW4gPSBpc0Jvb2xlYW47XG5cbmZ1bmN0aW9uIGlzTnVsbChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNOdWxsID0gaXNOdWxsO1xuXG5mdW5jdGlvbiBpc051bGxPclVuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PSBudWxsO1xufVxuZXhwb3J0cy5pc051bGxPclVuZGVmaW5lZCA9IGlzTnVsbE9yVW5kZWZpbmVkO1xuXG5mdW5jdGlvbiBpc051bWJlcihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdudW1iZXInO1xufVxuZXhwb3J0cy5pc051bWJlciA9IGlzTnVtYmVyO1xuXG5mdW5jdGlvbiBpc1N0cmluZyhhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnO1xufVxuZXhwb3J0cy5pc1N0cmluZyA9IGlzU3RyaW5nO1xuXG5mdW5jdGlvbiBpc1N5bWJvbChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdzeW1ib2wnO1xufVxuZXhwb3J0cy5pc1N5bWJvbCA9IGlzU3ltYm9sO1xuXG5mdW5jdGlvbiBpc1VuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gdm9pZCAwO1xufVxuZXhwb3J0cy5pc1VuZGVmaW5lZCA9IGlzVW5kZWZpbmVkO1xuXG5mdW5jdGlvbiBpc1JlZ0V4cChyZSkge1xuICByZXR1cm4gaXNPYmplY3QocmUpICYmIG9iamVjdFRvU3RyaW5nKHJlKSA9PT0gJ1tvYmplY3QgUmVnRXhwXSc7XG59XG5leHBvcnRzLmlzUmVnRXhwID0gaXNSZWdFeHA7XG5cbmZ1bmN0aW9uIGlzT2JqZWN0KGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ29iamVjdCcgJiYgYXJnO1xufVxuZXhwb3J0cy5pc09iamVjdCA9IGlzT2JqZWN0O1xuXG5mdW5jdGlvbiBpc0RhdGUoZCkge1xuICByZXR1cm4gaXNPYmplY3QoZCkgJiYgb2JqZWN0VG9TdHJpbmcoZCkgPT09ICdbb2JqZWN0IERhdGVdJztcbn1cbmV4cG9ydHMuaXNEYXRlID0gaXNEYXRlO1xuXG5mdW5jdGlvbiBpc0Vycm9yKGUpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KGUpICYmIG9iamVjdFRvU3RyaW5nKGUpID09PSAnW29iamVjdCBFcnJvcl0nO1xufVxuZXhwb3J0cy5pc0Vycm9yID0gaXNFcnJvcjtcblxuZnVuY3Rpb24gaXNGdW5jdGlvbihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdmdW5jdGlvbic7XG59XG5leHBvcnRzLmlzRnVuY3Rpb24gPSBpc0Z1bmN0aW9uO1xuXG5mdW5jdGlvbiBpc1ByaW1pdGl2ZShhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gbnVsbCB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ2Jvb2xlYW4nIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnbnVtYmVyJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3N0cmluZycgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdzeW1ib2wnIHx8ICAvLyBFUzYgc3ltYm9sXG4gICAgICAgICB0eXBlb2YgYXJnID09PSAndW5kZWZpbmVkJztcbn1cbmV4cG9ydHMuaXNQcmltaXRpdmUgPSBpc1ByaW1pdGl2ZTtcblxuZnVuY3Rpb24gaXNCdWZmZXIoYXJnKSB7XG4gIHJldHVybiBhcmcgJiYgdHlwZW9mIGFyZyA9PT0gJ29iamVjdCdcbiAgICAmJiB0eXBlb2YgYXJnLmNvcHkgPT09ICdmdW5jdGlvbidcbiAgICAmJiB0eXBlb2YgYXJnLmZpbGwgPT09ICdmdW5jdGlvbidcbiAgICAmJiB0eXBlb2YgYXJnLmJpbmFyeVNsaWNlID09PSAnZnVuY3Rpb24nXG4gIDtcbn1cbmV4cG9ydHMuaXNCdWZmZXIgPSBpc0J1ZmZlcjtcblxuZnVuY3Rpb24gb2JqZWN0VG9TdHJpbmcobykge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG8pO1xufVxuXG5cbmZ1bmN0aW9uIHBhZChuKSB7XG4gIHJldHVybiBuIDwgMTAgPyAnMCcgKyBuLnRvU3RyaW5nKDEwKSA6IG4udG9TdHJpbmcoMTApO1xufVxuXG5cbnZhciBtb250aHMgPSBbJ0phbicsICdGZWInLCAnTWFyJywgJ0FwcicsICdNYXknLCAnSnVuJywgJ0p1bCcsICdBdWcnLCAnU2VwJyxcbiAgICAgICAgICAgICAgJ09jdCcsICdOb3YnLCAnRGVjJ107XG5cbi8vIDI2IEZlYiAxNjoxOTozNFxuZnVuY3Rpb24gdGltZXN0YW1wKCkge1xuICB2YXIgZCA9IG5ldyBEYXRlKCk7XG4gIHZhciB0aW1lID0gW3BhZChkLmdldEhvdXJzKCkpLFxuICAgICAgICAgICAgICBwYWQoZC5nZXRNaW51dGVzKCkpLFxuICAgICAgICAgICAgICBwYWQoZC5nZXRTZWNvbmRzKCkpXS5qb2luKCc6Jyk7XG4gIHJldHVybiBbZC5nZXREYXRlKCksIG1vbnRoc1tkLmdldE1vbnRoKCldLCB0aW1lXS5qb2luKCcgJyk7XG59XG5cblxuLy8gbG9nIGlzIGp1c3QgYSB0aGluIHdyYXBwZXIgdG8gY29uc29sZS5sb2cgdGhhdCBwcmVwZW5kcyBhIHRpbWVzdGFtcFxuZXhwb3J0cy5sb2cgPSBmdW5jdGlvbigpIHtcbiAgY29uc29sZS5sb2coJyVzIC0gJXMnLCB0aW1lc3RhbXAoKSwgZXhwb3J0cy5mb3JtYXQuYXBwbHkoZXhwb3J0cywgYXJndW1lbnRzKSk7XG59O1xuXG5cbi8qKlxuICogSW5oZXJpdCB0aGUgcHJvdG90eXBlIG1ldGhvZHMgZnJvbSBvbmUgY29uc3RydWN0b3IgaW50byBhbm90aGVyLlxuICpcbiAqIFRoZSBGdW5jdGlvbi5wcm90b3R5cGUuaW5oZXJpdHMgZnJvbSBsYW5nLmpzIHJld3JpdHRlbiBhcyBhIHN0YW5kYWxvbmVcbiAqIGZ1bmN0aW9uIChub3Qgb24gRnVuY3Rpb24ucHJvdG90eXBlKS4gTk9URTogSWYgdGhpcyBmaWxlIGlzIHRvIGJlIGxvYWRlZFxuICogZHVyaW5nIGJvb3RzdHJhcHBpbmcgdGhpcyBmdW5jdGlvbiBuZWVkcyB0byBiZSByZXdyaXR0ZW4gdXNpbmcgc29tZSBuYXRpdmVcbiAqIGZ1bmN0aW9ucyBhcyBwcm90b3R5cGUgc2V0dXAgdXNpbmcgbm9ybWFsIEphdmFTY3JpcHQgZG9lcyBub3Qgd29yayBhc1xuICogZXhwZWN0ZWQgZHVyaW5nIGJvb3RzdHJhcHBpbmcgKHNlZSBtaXJyb3IuanMgaW4gcjExNDkwMykuXG4gKlxuICogQHBhcmFtIHtmdW5jdGlvbn0gY3RvciBDb25zdHJ1Y3RvciBmdW5jdGlvbiB3aGljaCBuZWVkcyB0byBpbmhlcml0IHRoZVxuICogICAgIHByb3RvdHlwZS5cbiAqIEBwYXJhbSB7ZnVuY3Rpb259IHN1cGVyQ3RvciBDb25zdHJ1Y3RvciBmdW5jdGlvbiB0byBpbmhlcml0IHByb3RvdHlwZSBmcm9tLlxuICovXG5leHBvcnRzLmluaGVyaXRzID0gZnVuY3Rpb24oY3Rvciwgc3VwZXJDdG9yKSB7XG4gIGN0b3Iuc3VwZXJfID0gc3VwZXJDdG9yO1xuICBjdG9yLnByb3RvdHlwZSA9IHNoaW1zLmNyZWF0ZShzdXBlckN0b3IucHJvdG90eXBlLCB7XG4gICAgY29uc3RydWN0b3I6IHtcbiAgICAgIHZhbHVlOiBjdG9yLFxuICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH1cbiAgfSk7XG59O1xuXG5leHBvcnRzLl9leHRlbmQgPSBmdW5jdGlvbihvcmlnaW4sIGFkZCkge1xuICAvLyBEb24ndCBkbyBhbnl0aGluZyBpZiBhZGQgaXNuJ3QgYW4gb2JqZWN0XG4gIGlmICghYWRkIHx8ICFpc09iamVjdChhZGQpKSByZXR1cm4gb3JpZ2luO1xuXG4gIHZhciBrZXlzID0gc2hpbXMua2V5cyhhZGQpO1xuICB2YXIgaSA9IGtleXMubGVuZ3RoO1xuICB3aGlsZSAoaS0tKSB7XG4gICAgb3JpZ2luW2tleXNbaV1dID0gYWRkW2tleXNbaV1dO1xuICB9XG4gIHJldHVybiBvcmlnaW47XG59O1xuXG5mdW5jdGlvbiBoYXNPd25Qcm9wZXJ0eShvYmosIHByb3ApIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApO1xufVxuIl19
;