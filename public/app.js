;(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var domready = require('domready')
  , Page = require('./customers/page')

function run(){
  var container = document.getElementById('container')

  // Routing goes here
  // Create a page around the current route
  // and detach when we change to a new page
  var subContainer = document.createElement('div')
  var page = new Page(subContainer)
  container.appendChild(subContainer)
}


domready(run)


},{"./customers/page":3,"domready":8}],2:[function(require,module,exports){
var mustache = require('mustache')
  , Delegate = require('dom-delegate')
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
    alert('Clicked ' + dope.dataset(row).customer)
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

},{"dom-delegate":6,"dope":9,"fs":16,"mustache":11,"underscore":12}],3:[function(require,module,exports){
var testdata = require('../testdata')
  , Dropdown = require('../dropdown')
  , CustomerList = require('./customerlist')

var Page = function(element) {
  this.element = element
  this.banks = new Dropdown('banks', this.element.getElementsByClassName('bank-container')[0], testdata.banks)
  this.customers = new CustomerList(this.element.getElementsByClassName('customer-container')[0], testdata.customers)
  this.banks.on('changed', this.onBankChanged.bind(this))
}

Page.prototype = {
  detach: function() {
    this.banks.detach()
  },
  onBankChanged: function(newBank) {
    this.customers.filterByBank(newBank)
  }
}

module.exports = Page

},{"../dropdown":4,"../testdata":13,"./customerlist":2}],4:[function(require,module,exports){
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

},{"domify":7,"events":15,"knockout":10,"underscore":12}],5:[function(require,module,exports){
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

},{}],6:[function(require,module,exports){
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

},{"./delegate":5}],7:[function(require,module,exports){

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

},{}],8:[function(require,module,exports){
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

},{}],9:[function(require,module,exports){
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
},{}],10:[function(require,module,exports){
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

},{}],11:[function(require,module,exports){
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

},{}],12:[function(require,module,exports){
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

},{}],13:[function(require,module,exports){
module.exports = {
  banks: [ "spv", "fana", "lloyds" ],
  customers: [
    { bank: "spv", name: "bob" },
    { bank: "fana", name: "alice" },
    { bank: "lloyds", name: "craig" },
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

},{}],14:[function(require,module,exports){


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

},{}],15:[function(require,module,exports){
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
},{"util":17}],16:[function(require,module,exports){

// not implemented
// The reason for having an empty file and not throwing is to allow
// untraditional implementation of this module.

},{}],17:[function(require,module,exports){
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

},{"_shims":14}]},{},[1])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvaG9tZS9yb2Jhc2h0b24vc3JjL2ZyZW5kZS9hcHAuanMiLCIvaG9tZS9yb2Jhc2h0b24vc3JjL2ZyZW5kZS9jdXN0b21lcnMvY3VzdG9tZXJsaXN0LmpzIiwiL2hvbWUvcm9iYXNodG9uL3NyYy9mcmVuZGUvY3VzdG9tZXJzL3BhZ2UuanMiLCIvaG9tZS9yb2Jhc2h0b24vc3JjL2ZyZW5kZS9kcm9wZG93bi9pbmRleC5qcyIsIi9ob21lL3JvYmFzaHRvbi9zcmMvZnJlbmRlL25vZGVfbW9kdWxlcy9kb20tZGVsZWdhdGUvbGliL2RlbGVnYXRlLmpzIiwiL2hvbWUvcm9iYXNodG9uL3NyYy9mcmVuZGUvbm9kZV9tb2R1bGVzL2RvbS1kZWxlZ2F0ZS9saWIvaW5kZXguanMiLCIvaG9tZS9yb2Jhc2h0b24vc3JjL2ZyZW5kZS9ub2RlX21vZHVsZXMvZG9taWZ5L2luZGV4LmpzIiwiL2hvbWUvcm9iYXNodG9uL3NyYy9mcmVuZGUvbm9kZV9tb2R1bGVzL2RvbXJlYWR5L3JlYWR5LmpzIiwiL2hvbWUvcm9iYXNodG9uL3NyYy9mcmVuZGUvbm9kZV9tb2R1bGVzL2RvcGUvZG9wZS5qcyIsIi9ob21lL3JvYmFzaHRvbi9zcmMvZnJlbmRlL25vZGVfbW9kdWxlcy9rbm9ja291dC9idWlsZC9vdXRwdXQva25vY2tvdXQtbGF0ZXN0LmRlYnVnLmpzIiwiL2hvbWUvcm9iYXNodG9uL3NyYy9mcmVuZGUvbm9kZV9tb2R1bGVzL211c3RhY2hlL211c3RhY2hlLmpzIiwiL2hvbWUvcm9iYXNodG9uL3NyYy9mcmVuZGUvbm9kZV9tb2R1bGVzL3VuZGVyc2NvcmUvdW5kZXJzY29yZS5qcyIsIi9ob21lL3JvYmFzaHRvbi9zcmMvZnJlbmRlL3Rlc3RkYXRhLmpzIiwiL3Vzci9sb2NhbC9saWIvbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLWJ1aWx0aW5zL2J1aWx0aW4vX3NoaW1zLmpzIiwiL3Vzci9sb2NhbC9saWIvbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLWJ1aWx0aW5zL2J1aWx0aW4vZXZlbnRzLmpzIiwiL3Vzci9sb2NhbC9saWIvbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLWJ1aWx0aW5zL2J1aWx0aW4vZnMuanMiLCIvdXNyL2xvY2FsL2xpYi9ub2RlX21vZHVsZXMvd2F0Y2hpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItYnVpbHRpbnMvYnVpbHRpbi91dGlsLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RhQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuYUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1bEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbG1CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzV2Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeE5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOlsidmFyIGRvbXJlYWR5ID0gcmVxdWlyZSgnZG9tcmVhZHknKVxuICAsIFBhZ2UgPSByZXF1aXJlKCcuL2N1c3RvbWVycy9wYWdlJylcblxuZnVuY3Rpb24gcnVuKCl7XG4gIHZhciBjb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY29udGFpbmVyJylcblxuICAvLyBSb3V0aW5nIGdvZXMgaGVyZVxuICAvLyBDcmVhdGUgYSBwYWdlIGFyb3VuZCB0aGUgY3VycmVudCByb3V0ZVxuICAvLyBhbmQgZGV0YWNoIHdoZW4gd2UgY2hhbmdlIHRvIGEgbmV3IHBhZ2VcbiAgdmFyIHN1YkNvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG4gIHZhciBwYWdlID0gbmV3IFBhZ2Uoc3ViQ29udGFpbmVyKVxuICBjb250YWluZXIuYXBwZW5kQ2hpbGQoc3ViQ29udGFpbmVyKVxufVxuXG5cbmRvbXJlYWR5KHJ1bilcblxuIiwidmFyIG11c3RhY2hlID0gcmVxdWlyZSgnbXVzdGFjaGUnKVxuICAsIERlbGVnYXRlID0gcmVxdWlyZSgnZG9tLWRlbGVnYXRlJylcbiAgLCBkb3BlID0gcmVxdWlyZSgnZG9wZScpXG4gICwgXyA9IHJlcXVpcmUoJ3VuZGVyc2NvcmUnKVxuICAsIGZzID0gcmVxdWlyZSgnZnMnKVxuXG5mdW5jdGlvbiBDdXN0b21lckxpc3QoZWxlbWVudCwgY3VzdG9tZXJzKSB7XG4gIHRoaXMuZWxlbWVudCA9IGVsZW1lbnRcbiAgdGhpcy50ZW1wbGF0ZSA9IFwiICA8dGFibGU+XFxuICAgIHt7I2FjdGl2ZWN1c3RvbWVyc319XFxuICAgICAgPHRyIGNsYXNzPVxcXCJjdXN0b21lclxcXCIgZGF0YS1jdXN0b21lcj1cXFwie3tuYW1lfX1cXFwiPjx0ZD57e25hbWV9fTwvdGQ+PHRkPnt7YmFua319PC90ZD48L3RyPlxcbiAgICB7ey9hY3RpdmVjdXN0b21lcnN9fVxcbiAgPC90YWJsZT5cXG5cXG5cIlxuICB0aGlzLmN1c3RvbWVycyA9IGN1c3RvbWVyc1xuICB0aGlzLmFjdGl2ZWN1c3RvbWVycyA9IGN1c3RvbWVyc1xuICB0aGlzLnJlbmRlcigpXG4gIHRoaXMuZGVsZWdhdGUgPSBuZXcgRGVsZWdhdGUodGhpcy5lbGVtZW50KVxuICB0aGlzLmRlbGVnYXRlLm9uKCdjbGljaycsICcuY3VzdG9tZXInLCB0aGlzLm9uQ3VzdG9tZXJDbGlja2VkLmJpbmQodGhpcykpXG59XG5cbkN1c3RvbWVyTGlzdC5wcm90b3R5cGUgPSB7XG4gIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5lbGVtZW50LmlubmVySFRNTCA9IG11c3RhY2hlLnJlbmRlcih0aGlzLnRlbXBsYXRlLCB0aGlzKVxuICB9LFxuICBvbkN1c3RvbWVyQ2xpY2tlZDogZnVuY3Rpb24oZSwgcm93KSB7XG4gICAgYWxlcnQoJ0NsaWNrZWQgJyArIGRvcGUuZGF0YXNldChyb3cpLmN1c3RvbWVyKVxuICB9LFxuICBmaWx0ZXJCeUJhbms6IGZ1bmN0aW9uKGJhbmspIHtcbiAgICBpZihiYW5rKSB7XG4gICAgICB0aGlzLmFjdGl2ZWN1c3RvbWVycyA9IF8odGhpcy5jdXN0b21lcnMpLmZpbHRlcihmdW5jdGlvbihpKSB7IHJldHVybiBpLmJhbmsgPT09IGJhbmt9KVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHRoaXMuYWN0aXZlY3VzdG9tZXJzID0gdGhpcy5jdXN0b21lcnNcbiAgICB9XG4gICAgdGhpcy5yZW5kZXIoKVxuICB9LFxuICBkZXRhY2g6IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuZGVsZWdhdGUuZGVzdHJveSgpXG4gIH1cbn1cblxuXG5tb2R1bGUuZXhwb3J0cyA9IEN1c3RvbWVyTGlzdFxuIiwidmFyIHRlc3RkYXRhID0gcmVxdWlyZSgnLi4vdGVzdGRhdGEnKVxuICAsIERyb3Bkb3duID0gcmVxdWlyZSgnLi4vZHJvcGRvd24nKVxuICAsIEN1c3RvbWVyTGlzdCA9IHJlcXVpcmUoJy4vY3VzdG9tZXJsaXN0JylcblxudmFyIFBhZ2UgPSBmdW5jdGlvbihlbGVtZW50KSB7XG4gIHRoaXMuZWxlbWVudCA9IGVsZW1lbnRcbiAgdGhpcy5iYW5rcyA9IG5ldyBEcm9wZG93bignYmFua3MnLCB0aGlzLmVsZW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgnYmFuay1jb250YWluZXInKVswXSwgdGVzdGRhdGEuYmFua3MpXG4gIHRoaXMuY3VzdG9tZXJzID0gbmV3IEN1c3RvbWVyTGlzdCh0aGlzLmVsZW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgnY3VzdG9tZXItY29udGFpbmVyJylbMF0sIHRlc3RkYXRhLmN1c3RvbWVycylcbiAgdGhpcy5iYW5rcy5vbignY2hhbmdlZCcsIHRoaXMub25CYW5rQ2hhbmdlZC5iaW5kKHRoaXMpKVxufVxuXG5QYWdlLnByb3RvdHlwZSA9IHtcbiAgZGV0YWNoOiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmJhbmtzLmRldGFjaCgpXG4gIH0sXG4gIG9uQmFua0NoYW5nZWQ6IGZ1bmN0aW9uKG5ld0JhbmspIHtcbiAgICB0aGlzLmN1c3RvbWVycy5maWx0ZXJCeUJhbmsobmV3QmFuaylcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFBhZ2VcbiIsInZhciBrbyA9IHJlcXVpcmUoJ2tub2Nrb3V0JylcbiAgLCBkb21pZnkgPSByZXF1aXJlKCdkb21pZnknKVxuICAsIF8gPSByZXF1aXJlKCd1bmRlcnNjb3JlJylcbiAgLCBFdmVudEVtaXR0ZXIgPSByZXF1aXJlKCdldmVudHMnKS5FdmVudEVtaXR0ZXJcblxuZnVuY3Rpb24gRHJvcGRvd24obmFtZSwgZWxlbWVudCwgZGF0YSkge1xuICBFdmVudEVtaXR0ZXIuY2FsbCh0aGlzKVxuXG4gIHRoaXMuZGF0YSA9IGRhdGFcbiAgdGhpcy5lbGVtZW50ID0gZWxlbWVudFxuICB0aGlzLm5hbWUgPSBuYW1lXG5cbiAgLy8gR0FTUCAtIHdlIGNhbiB1c2UgS25vY2tvdXQgaWYgd2Ugd2FudCB0b1xuICAvLyBKdXN0IGtlZXAgaXQgaW50ZXJuYWwgdG8gdGhlIHByZXNlbnRlclxuICB0aGlzLnZhbHVlcyA9IGtvLm9ic2VydmFibGVBcnJheSh0aGlzLmRhdGEpXG4gIHRoaXMuc2VsZWN0ZWRWYWx1ZSA9IGtvLm9ic2VydmFibGUoKVxuICB0aGlzLnJlbmRlcigpXG4gIGtvLmFwcGx5QmluZGluZ3ModGhpcywgdGhpcy5lbGVtZW50KVxuICB0aGlzLnNlbGVjdGVkVmFsdWUuc3Vic2NyaWJlKHRoaXMub25TZWxlY3RlZFZhbHVlQ2hhbmdlZC5iaW5kKHRoaXMpKVxufVxuXG5Ecm9wZG93bi5wcm90b3R5cGUgPSB7XG4gIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5lbGVtZW50LmlubmVySFRNTCA9IFwiXCJcbiAgICB2YXIgaHRtbCA9ICc8c2VsZWN0IG5hbWU9XCInICsgdGhpcy5uYW1lICsgJ1wiIGRhdGEtYmluZD1cIm9wdGlvbnM6IHZhbHVlcywgdmFsdWU6IHNlbGVjdGVkVmFsdWVcIj48L3NlbGVjdD4nXG4gICAgdGhpcy5lbGVtZW50LmFwcGVuZENoaWxkKGRvbWlmeShodG1sKSlcbiAgfSxcbiAgb25TZWxlY3RlZFZhbHVlQ2hhbmdlZDogZnVuY3Rpb24obmV3VmFsdWUpIHtcbiAgICB0aGlzLmVtaXQoJ2NoYW5nZWQnLCBuZXdWYWx1ZSlcbiAgfSxcbiAgZGV0YWNoOiBmdW5jdGlvbigpIHtcbiAgICBrby5jbGVhbk5vZGUodGhpcy5lbGVtZW50KVxuICB9XG59XG5fLmV4dGVuZChEcm9wZG93bi5wcm90b3R5cGUsIEV2ZW50RW1pdHRlci5wcm90b3R5cGUpXG5cbm1vZHVsZS5leHBvcnRzID0gRHJvcGRvd25cbiIsIi8qanNoaW50IGJyb3dzZXI6dHJ1ZSwgbm9kZTp0cnVlKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IERlbGVnYXRlO1xuXG4vKipcbiAqIERPTSBldmVudCBkZWxlZ2F0b3JcbiAqXG4gKiBUaGUgZGVsZWdhdG9yIHdpbGwgbGlzdGVuXG4gKiBmb3IgZXZlbnRzIHRoYXQgYnViYmxlIHVwXG4gKiB0byB0aGUgcm9vdCBub2RlLlxuICpcbiAqIEBjb25zdHJ1Y3RvclxuICogQHBhcmFtIHtOb2RlfHN0cmluZ30gW3Jvb3RdIFRoZSByb290IG5vZGUgb3IgYSBzZWxlY3RvciBzdHJpbmcgbWF0Y2hpbmcgdGhlIHJvb3Qgbm9kZVxuICovXG5mdW5jdGlvbiBEZWxlZ2F0ZShyb290KSB7XG4gIGlmIChyb290KSB7XG4gICAgdGhpcy5yb290KHJvb3QpO1xuICB9XG5cbiAgLyoqXG4gICAqIE1haW50YWluIGEgbWFwIG9mIGxpc3RlbmVyXG4gICAqIGxpc3RzLCBrZXllZCBieSBldmVudCBuYW1lLlxuICAgKlxuICAgKiBAdHlwZSBPYmplY3RcbiAgICovXG4gIHRoaXMubGlzdGVuZXJNYXAgPSB7fTtcblxuICAvKiogQHR5cGUgZnVuY3Rpb24oKSAqL1xuICB0aGlzLmhhbmRsZSA9IERlbGVnYXRlLnByb3RvdHlwZS5oYW5kbGUuYmluZCh0aGlzKTtcbn1cblxuLyoqXG4gKiBAcHJvdGVjdGVkXG4gKiBAdHlwZSA/Ym9vbGVhblxuICovXG5EZWxlZ2F0ZS50YWdzQ2FzZVNlbnNpdGl2ZSA9IG51bGw7XG5cbi8qKlxuICogU3RhcnQgbGlzdGVuaW5nIGZvciBldmVudHNcbiAqIG9uIHRoZSBwcm92aWRlZCBET00gZWxlbWVudFxuICpcbiAqIEBwYXJhbSAge05vZGV8c3RyaW5nfSBbcm9vdF0gVGhlIHJvb3Qgbm9kZSBvciBhIHNlbGVjdG9yIHN0cmluZyBtYXRjaGluZyB0aGUgcm9vdCBub2RlXG4gKiBAcmV0dXJucyB7RGVsZWdhdGV9IFRoaXMgbWV0aG9kIGlzIGNoYWluYWJsZVxuICovXG5EZWxlZ2F0ZS5wcm90b3R5cGUucm9vdCA9IGZ1bmN0aW9uKHJvb3QpIHtcbiAgdmFyIGxpc3RlbmVyTWFwID0gdGhpcy5saXN0ZW5lck1hcDtcbiAgdmFyIGV2ZW50VHlwZTtcblxuICBpZiAodHlwZW9mIHJvb3QgPT09ICdzdHJpbmcnKSB7XG4gICAgcm9vdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3Iocm9vdCk7XG4gIH1cblxuICAvLyBSZW1vdmUgbWFzdGVyIGV2ZW50IGxpc3RlbmVyc1xuICBpZiAodGhpcy5yb290RWxlbWVudCkge1xuICAgIGZvciAoZXZlbnRUeXBlIGluIGxpc3RlbmVyTWFwKSB7XG4gICAgICBpZiAobGlzdGVuZXJNYXAuaGFzT3duUHJvcGVydHkoZXZlbnRUeXBlKSkge1xuICAgICAgICB0aGlzLnJvb3RFbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnRUeXBlLCB0aGlzLmhhbmRsZSwgdGhpcy5jYXB0dXJlRm9yVHlwZShldmVudFR5cGUpKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBJZiBubyByb290IG9yIHJvb3QgaXMgbm90XG4gIC8vIGEgZG9tIG5vZGUsIHRoZW4gcmVtb3ZlIGludGVybmFsXG4gIC8vIHJvb3QgcmVmZXJlbmNlIGFuZCBleGl0IGhlcmVcbiAgaWYgKCFyb290IHx8ICFyb290LmFkZEV2ZW50TGlzdGVuZXIpIHtcbiAgICBpZiAodGhpcy5yb290RWxlbWVudCkge1xuICAgICAgZGVsZXRlIHRoaXMucm9vdEVsZW1lbnQ7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFRoZSByb290IG5vZGUgYXQgd2hpY2hcbiAgICogbGlzdGVuZXJzIGFyZSBhdHRhY2hlZC5cbiAgICpcbiAgICogQHR5cGUgTm9kZVxuICAgKi9cbiAgdGhpcy5yb290RWxlbWVudCA9IHJvb3Q7XG5cbiAgLy8gU2V0IHVwIG1hc3RlciBldmVudCBsaXN0ZW5lcnNcbiAgZm9yIChldmVudFR5cGUgaW4gbGlzdGVuZXJNYXApIHtcbiAgICBpZiAobGlzdGVuZXJNYXAuaGFzT3duUHJvcGVydHkoZXZlbnRUeXBlKSkge1xuICAgICAgdGhpcy5yb290RWxlbWVudC5hZGRFdmVudExpc3RlbmVyKGV2ZW50VHlwZSwgdGhpcy5oYW5kbGUsIHRoaXMuY2FwdHVyZUZvclR5cGUoZXZlbnRUeXBlKSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBldmVudFR5cGVcbiAqIEByZXR1cm5zIGJvb2xlYW5cbiAqL1xuRGVsZWdhdGUucHJvdG90eXBlLmNhcHR1cmVGb3JUeXBlID0gZnVuY3Rpb24oZXZlbnRUeXBlKSB7XG4gIHJldHVybiBldmVudFR5cGUgPT09ICdlcnJvcic7XG59O1xuXG4vKipcbiAqIEF0dGFjaCBhIGhhbmRsZXIgdG8gb25lXG4gKiBldmVudCBmb3IgYWxsIGVsZW1lbnRzXG4gKiB0aGF0IG1hdGNoIHRoZSBzZWxlY3RvcixcbiAqIG5vdyBvciBpbiB0aGUgZnV0dXJlXG4gKlxuICogVGhlIGhhbmRsZXIgZnVuY3Rpb24gcmVjZWl2ZXNcbiAqIHRocmVlIGFyZ3VtZW50czogdGhlIERPTSBldmVudFxuICogb2JqZWN0LCB0aGUgbm9kZSB0aGF0IG1hdGNoZWRcbiAqIHRoZSBzZWxlY3RvciB3aGlsZSB0aGUgZXZlbnRcbiAqIHdhcyBidWJibGluZyBhbmQgYSByZWZlcmVuY2VcbiAqIHRvIGl0c2VsZi4gV2l0aGluIHRoZSBoYW5kbGVyLFxuICogJ3RoaXMnIGlzIGVxdWFsIHRvIHRoZSBzZWNvbmRcbiAqIGFyZ3VtZW50LlxuICpcbiAqIFRoZSBub2RlIHRoYXQgYWN0dWFsbHkgcmVjZWl2ZWRcbiAqIHRoZSBldmVudCBjYW4gYmUgYWNjZXNzZWQgdmlhXG4gKiAnZXZlbnQudGFyZ2V0Jy5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gZXZlbnRUeXBlIExpc3RlbiBmb3IgdGhlc2UgZXZlbnRzIChpbiBhIHNwYWNlLXNlcGFyYXRlZCBsaXN0KVxuICogQHBhcmFtIHtzdHJpbmd8dW5kZWZpbmVkfSBzZWxlY3RvciBPbmx5IGhhbmRsZSBldmVudHMgb24gZWxlbWVudHMgbWF0Y2hpbmcgdGhpcyBzZWxlY3RvciwgaWYgdW5kZWZpbmVkIG1hdGNoIHJvb3QgZWxlbWVudFxuICogQHBhcmFtIHtmdW5jdGlvbigpfSBoYW5kbGVyIEhhbmRsZXIgZnVuY3Rpb24gLSBldmVudCBkYXRhIHBhc3NlZCBoZXJlIHdpbGwgYmUgaW4gZXZlbnQuZGF0YVxuICogQHBhcmFtIHtPYmplY3R9IFtldmVudERhdGFdIERhdGEgdG8gcGFzcyBpbiBldmVudC5kYXRhXG4gKiBAcmV0dXJucyB7RGVsZWdhdGV9IFRoaXMgbWV0aG9kIGlzIGNoYWluYWJsZVxuICovXG5EZWxlZ2F0ZS5wcm90b3R5cGUub24gPSBmdW5jdGlvbihldmVudFR5cGUsIHNlbGVjdG9yLCBoYW5kbGVyLCBldmVudERhdGEpIHtcbiAgdmFyIHJvb3QsIGxpc3RlbmVyTWFwLCBtYXRjaGVyLCBtYXRjaGVyUGFyYW0sIHNlbGYgPSB0aGlzO1xuXG4gIGlmICghZXZlbnRUeXBlKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignSW52YWxpZCBldmVudCB0eXBlOiAnICsgZXZlbnRUeXBlKTtcbiAgfVxuXG4gIC8vIGhhbmRsZXIgY2FuIGJlIHBhc3NlZCBhc1xuICAvLyB0aGUgc2Vjb25kIG9yIHRoaXJkIGFyZ3VtZW50XG4gIGlmICh0eXBlb2Ygc2VsZWN0b3IgPT09ICdmdW5jdGlvbicpIHtcbiAgICBoYW5kbGVyID0gc2VsZWN0b3I7XG4gICAgc2VsZWN0b3IgPSBudWxsO1xuICAgIGV2ZW50RGF0YSA9IGhhbmRsZXI7XG4gIH1cblxuICAvLyBOb3JtYWxpc2UgdW5kZWZpbmVkIGV2ZW50RGF0YSB0byBudWxsXG4gIGlmIChldmVudERhdGEgPT09IHVuZGVmaW5lZCkge1xuICAgIGV2ZW50RGF0YSA9IG51bGw7XG4gIH1cblxuICBpZiAodHlwZW9mIGhhbmRsZXIgIT09ICdmdW5jdGlvbicpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdIYW5kbGVyIG11c3QgYmUgYSB0eXBlIG9mIEZ1bmN0aW9uJyk7XG4gIH1cblxuICByb290ID0gdGhpcy5yb290RWxlbWVudDtcbiAgbGlzdGVuZXJNYXAgPSB0aGlzLmxpc3RlbmVyTWFwO1xuXG4gIC8vIEFkZCBtYXN0ZXIgaGFuZGxlciBmb3IgdHlwZSBpZiBub3QgY3JlYXRlZCB5ZXRcbiAgaWYgKCFsaXN0ZW5lck1hcFtldmVudFR5cGVdKSB7XG4gICAgaWYgKHJvb3QpIHtcbiAgICAgIHJvb3QuYWRkRXZlbnRMaXN0ZW5lcihldmVudFR5cGUsIHRoaXMuaGFuZGxlLCB0aGlzLmNhcHR1cmVGb3JUeXBlKGV2ZW50VHlwZSkpO1xuICAgIH1cbiAgICBsaXN0ZW5lck1hcFtldmVudFR5cGVdID0gW107XG4gIH1cblxuICBpZiAoIXNlbGVjdG9yKSB7XG4gICAgbWF0Y2hlclBhcmFtID0gbnVsbDtcblxuICAgIC8vIENPTVBMRVggLSBtYXRjaGVzUm9vdCBuZWVkcyB0byBoYXZlIGFjY2VzcyB0b1xuICAgIC8vIHRoaXMucm9vdEVsZW1lbnQsIHNvIGJpbmQgdGhlIGZ1bmN0aW9uIHRvIHRoaXMuXG4gICAgbWF0Y2hlciA9IHRoaXMubWF0Y2hlc1Jvb3QuYmluZCh0aGlzKTtcblxuICAvLyBDb21waWxlIGEgbWF0Y2hlciBmb3IgdGhlIGdpdmVuIHNlbGVjdG9yXG4gIH0gZWxzZSBpZiAoL15bYS16XSskL2kudGVzdChzZWxlY3RvcikpIHtcblxuICAgIC8vIExhemlseSBjaGVjayB3aGV0aGVyIHRhZyBuYW1lcyBhcmUgY2FzZSBzZW5zaXRpdmUgKGFzIGluIFhNTCBvciBYSFRNTCBkb2N1bWVudHMpLlxuICAgIGlmIChEZWxlZ2F0ZS50YWdzQ2FzZVNlbnNpdGl2ZSA9PT0gbnVsbCkge1xuICAgICAgRGVsZWdhdGUudGFnc0Nhc2VTZW5zaXRpdmUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpJykudGFnTmFtZSA9PT0gJ2knO1xuICAgIH1cblxuICAgIGlmICghRGVsZWdhdGUudGFnc0Nhc2VTZW5zaXRpdmUpIHtcbiAgICAgIG1hdGNoZXJQYXJhbSA9IHNlbGVjdG9yLnRvVXBwZXJDYXNlKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG1hdGNoZXJQYXJhbSA9IHNlbGVjdG9yO1xuICAgIH1cblxuICAgIG1hdGNoZXIgPSB0aGlzLm1hdGNoZXNUYWc7XG4gIH0gZWxzZSBpZiAoL14jW2EtejAtOVxcLV9dKyQvaS50ZXN0KHNlbGVjdG9yKSkge1xuICAgIG1hdGNoZXJQYXJhbSA9IHNlbGVjdG9yLnNsaWNlKDEpO1xuICAgIG1hdGNoZXIgPSB0aGlzLm1hdGNoZXNJZDtcbiAgfSBlbHNlIHtcbiAgICBtYXRjaGVyUGFyYW0gPSBzZWxlY3RvcjtcbiAgICBtYXRjaGVyID0gdGhpcy5tYXRjaGVzO1xuICB9XG5cbiAgLy8gQWRkIHRvIHRoZSBsaXN0IG9mIGxpc3RlbmVyc1xuICBsaXN0ZW5lck1hcFtldmVudFR5cGVdLnB1c2goe1xuICAgIHNlbGVjdG9yOiBzZWxlY3RvcixcbiAgICBldmVudERhdGE6IGV2ZW50RGF0YSxcbiAgICBoYW5kbGVyOiBoYW5kbGVyLFxuICAgIG1hdGNoZXI6IG1hdGNoZXIsXG4gICAgbWF0Y2hlclBhcmFtOiBtYXRjaGVyUGFyYW1cbiAgfSk7XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFJlbW92ZSBhbiBldmVudCBoYW5kbGVyXG4gKiBmb3IgZWxlbWVudHMgdGhhdCBtYXRjaFxuICogdGhlIHNlbGVjdG9yLCBmb3JldmVyXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IFtldmVudFR5cGVdIFJlbW92ZSBoYW5kbGVycyBmb3IgZXZlbnRzIG1hdGNoaW5nIHRoaXMgdHlwZSwgY29uc2lkZXJpbmcgdGhlIG90aGVyIHBhcmFtZXRlcnNcbiAqIEBwYXJhbSB7c3RyaW5nfSBbc2VsZWN0b3JdIElmIHRoaXMgcGFyYW1ldGVyIGlzIG9taXR0ZWQsIG9ubHkgaGFuZGxlcnMgd2hpY2ggbWF0Y2ggdGhlIG90aGVyIHR3byB3aWxsIGJlIHJlbW92ZWRcbiAqIEBwYXJhbSB7ZnVuY3Rpb24oKX0gW2hhbmRsZXJdIElmIHRoaXMgcGFyYW1ldGVyIGlzIG9taXR0ZWQsIG9ubHkgaGFuZGxlcnMgd2hpY2ggbWF0Y2ggdGhlIHByZXZpb3VzIHR3byB3aWxsIGJlIHJlbW92ZWRcbiAqIEByZXR1cm5zIHtEZWxlZ2F0ZX0gVGhpcyBtZXRob2QgaXMgY2hhaW5hYmxlXG4gKi9cbkRlbGVnYXRlLnByb3RvdHlwZS5vZmYgPSBmdW5jdGlvbihldmVudFR5cGUsIHNlbGVjdG9yLCBoYW5kbGVyKSB7XG4gIHZhciBpLCBsaXN0ZW5lciwgbGlzdGVuZXJNYXAsIGxpc3RlbmVyTGlzdCwgc2luZ2xlRXZlbnRUeXBlLCBzZWxmID0gdGhpcztcblxuICAvLyBIYW5kbGVyIGNhbiBiZSBwYXNzZWQgYXNcbiAgLy8gdGhlIHNlY29uZCBvciB0aGlyZCBhcmd1bWVudFxuICBpZiAodHlwZW9mIHNlbGVjdG9yID09PSAnZnVuY3Rpb24nKSB7XG4gICAgaGFuZGxlciA9IHNlbGVjdG9yO1xuICAgIHNlbGVjdG9yID0gbnVsbDtcbiAgfVxuXG4gIGxpc3RlbmVyTWFwID0gdGhpcy5saXN0ZW5lck1hcDtcbiAgaWYgKCFldmVudFR5cGUpIHtcbiAgICBmb3IgKHNpbmdsZUV2ZW50VHlwZSBpbiBsaXN0ZW5lck1hcCkge1xuICAgICAgaWYgKGxpc3RlbmVyTWFwLmhhc093blByb3BlcnR5KHNpbmdsZUV2ZW50VHlwZSkpIHtcbiAgICAgICAgdGhpcy5vZmYoc2luZ2xlRXZlbnRUeXBlLCBzZWxlY3RvciwgaGFuZGxlcik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBsaXN0ZW5lckxpc3QgPSBsaXN0ZW5lck1hcFtldmVudFR5cGVdO1xuICBpZiAoIWxpc3RlbmVyTGlzdCB8fCAhbGlzdGVuZXJMaXN0Lmxlbmd0aCkge1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gUmVtb3ZlIG9ubHkgcGFyYW1ldGVyIG1hdGNoZXNcbiAgLy8gaWYgc3BlY2lmaWVkXG4gIGZvciAoaSA9IGxpc3RlbmVyTGlzdC5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgIGxpc3RlbmVyID0gbGlzdGVuZXJMaXN0W2ldO1xuXG4gICAgaWYgKCghc2VsZWN0b3IgfHwgc2VsZWN0b3IgPT09IGxpc3RlbmVyLnNlbGVjdG9yKSAmJiAoIWhhbmRsZXIgfHwgaGFuZGxlciA9PT0gbGlzdGVuZXIuaGFuZGxlcikpIHtcbiAgICAgIGxpc3RlbmVyTGlzdC5zcGxpY2UoaSwgMSk7XG4gICAgfVxuICB9XG5cbiAgLy8gQWxsIGxpc3RlbmVycyByZW1vdmVkXG4gIGlmICghbGlzdGVuZXJMaXN0Lmxlbmd0aCkge1xuICAgIGRlbGV0ZSBsaXN0ZW5lck1hcFtldmVudFR5cGVdO1xuXG4gICAgLy8gUmVtb3ZlIHRoZSBtYWluIGhhbmRsZXJcbiAgICBpZiAodGhpcy5yb290RWxlbWVudCkge1xuICAgICAgdGhpcy5yb290RWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKGV2ZW50VHlwZSwgdGhpcy5oYW5kbGUsIHRoaXMuY2FwdHVyZUZvclR5cGUoZXZlbnRUeXBlKSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5cbi8qKlxuICogSGFuZGxlIGFuIGFyYml0cmFyeSBldmVudC5cbiAqXG4gKiBAcGFyYW0ge0V2ZW50fSBldmVudFxuICovXG5EZWxlZ2F0ZS5wcm90b3R5cGUuaGFuZGxlID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgdmFyIGksIGwsIHJvb3QsIGxpc3RlbmVyLCByZXR1cm5lZCwgbGlzdGVuZXJMaXN0LCB0YXJnZXQsIC8qKiBAY29uc3QgKi8gRVZFTlRJR05PUkUgPSAnZnRMYWJzRGVsZWdhdGVJZ25vcmUnO1xuXG4gIGlmIChldmVudFtFVkVOVElHTk9SRV0gPT09IHRydWUpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICB0YXJnZXQgPSBldmVudC50YXJnZXQ7XG4gIGlmICh0YXJnZXQubm9kZVR5cGUgPT09IE5vZGUuVEVYVF9OT0RFKSB7XG4gICAgdGFyZ2V0ID0gdGFyZ2V0LnBhcmVudE5vZGU7XG4gIH1cblxuICByb290ID0gdGhpcy5yb290RWxlbWVudDtcbiAgbGlzdGVuZXJMaXN0ID0gdGhpcy5saXN0ZW5lck1hcFtldmVudC50eXBlXTtcblxuICAvLyBOZWVkIHRvIGNvbnRpbnVvdXNseSBjaGVja1xuICAvLyB0aGF0IHRoZSBzcGVjaWZpYyBsaXN0IGlzXG4gIC8vIHN0aWxsIHBvcHVsYXRlZCBpbiBjYXNlIG9uZVxuICAvLyBvZiB0aGUgY2FsbGJhY2tzIGFjdHVhbGx5XG4gIC8vIGNhdXNlcyB0aGUgbGlzdCB0byBiZSBkZXN0cm95ZWQuXG4gIGwgPSBsaXN0ZW5lckxpc3QubGVuZ3RoO1xuICB3aGlsZSAodGFyZ2V0ICYmIGwpIHtcbiAgICBmb3IgKGkgPSAwOyBpIDwgbDsgaSsrKSB7XG4gICAgICBsaXN0ZW5lciA9IGxpc3RlbmVyTGlzdFtpXTtcblxuICAgICAgLy8gQmFpbCBmcm9tIHRoaXMgbG9vcCBpZlxuICAgICAgLy8gdGhlIGxlbmd0aCBjaGFuZ2VkIGFuZFxuICAgICAgLy8gbm8gbW9yZSBsaXN0ZW5lcnMgYXJlXG4gICAgICAvLyBkZWZpbmVkIGJldHdlZW4gaSBhbmQgbC5cbiAgICAgIGlmICghbGlzdGVuZXIpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIC8vIENoZWNrIGZvciBtYXRjaCBhbmQgZmlyZVxuICAgICAgLy8gdGhlIGV2ZW50IGlmIHRoZXJlJ3Mgb25lXG4gICAgICAvL1xuICAgICAgLy8gVE9ETzpNQ0c6MjAxMjAxMTc6IE5lZWQgYSB3YXlcbiAgICAgIC8vIHRvIGNoZWNrIGlmIGV2ZW50I3N0b3BJbW1lZGlhdGVQcm9nYWdhdGlvblxuICAgICAgLy8gd2FzIGNhbGxlZC4gSWYgc28sIGJyZWFrIGJvdGggbG9vcHMuXG4gICAgICBpZiAobGlzdGVuZXIubWF0Y2hlci5jYWxsKHRhcmdldCwgbGlzdGVuZXIubWF0Y2hlclBhcmFtLCB0YXJnZXQpKSB7XG4gICAgICAgIHJldHVybmVkID0gdGhpcy5maXJlKGV2ZW50LCB0YXJnZXQsIGxpc3RlbmVyKTtcbiAgICAgIH1cblxuICAgICAgLy8gU3RvcCBwcm9wYWdhdGlvbiB0byBzdWJzZXF1ZW50XG4gICAgICAvLyBjYWxsYmFja3MgaWYgdGhlIGNhbGxiYWNrIHJldHVybmVkXG4gICAgICAvLyBmYWxzZVxuICAgICAgaWYgKHJldHVybmVkID09PSBmYWxzZSkge1xuICAgICAgICBldmVudFtFVkVOVElHTk9SRV0gPSB0cnVlO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gVE9ETzpNQ0c6MjAxMjAxMTc6IE5lZWQgYSB3YXkgdG9cbiAgICAvLyBjaGVjayBpZiBldmVudCNzdG9wUHJvZ2FnYXRpb25cbiAgICAvLyB3YXMgY2FsbGVkLiBJZiBzbywgYnJlYWsgbG9vcGluZ1xuICAgIC8vIHRocm91Z2ggdGhlIERPTS4gU3RvcCBpZiB0aGVcbiAgICAvLyBkZWxlZ2F0aW9uIHJvb3QgaGFzIGJlZW4gcmVhY2hlZFxuICAgIGlmICh0YXJnZXQgPT09IHJvb3QpIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIGwgPSBsaXN0ZW5lckxpc3QubGVuZ3RoO1xuICAgIHRhcmdldCA9IHRhcmdldC5wYXJlbnRFbGVtZW50O1xuICB9XG59O1xuXG4vKipcbiAqIEZpcmUgYSBsaXN0ZW5lciBvbiBhIHRhcmdldC5cbiAqXG4gKiBAcGFyYW0ge0V2ZW50fSBldmVudFxuICogQHBhcmFtIHtOb2RlfSB0YXJnZXRcbiAqIEBwYXJhbSB7T2JqZWN0fSBsaXN0ZW5lclxuICogQHJldHVybnMge2Jvb2xlYW59XG4gKi9cbkRlbGVnYXRlLnByb3RvdHlwZS5maXJlID0gZnVuY3Rpb24oZXZlbnQsIHRhcmdldCwgbGlzdGVuZXIpIHtcbiAgdmFyIHJldHVybmVkLCBvbGREYXRhO1xuXG4gIGlmIChsaXN0ZW5lci5ldmVudERhdGEgIT09IG51bGwpIHtcbiAgICBvbGREYXRhID0gZXZlbnQuZGF0YTtcbiAgICBldmVudC5kYXRhID0gbGlzdGVuZXIuZXZlbnREYXRhO1xuICAgIHJldHVybmVkID0gbGlzdGVuZXIuaGFuZGxlci5jYWxsKHRhcmdldCwgZXZlbnQsIHRhcmdldCk7XG4gICAgZXZlbnQuZGF0YSA9IG9sZERhdGE7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuZWQgPSBsaXN0ZW5lci5oYW5kbGVyLmNhbGwodGFyZ2V0LCBldmVudCwgdGFyZ2V0KTtcbiAgfVxuXG4gIHJldHVybiByZXR1cm5lZDtcbn07XG5cbi8qKlxuICogQ2hlY2sgd2hldGhlciBhbiBlbGVtZW50XG4gKiBtYXRjaGVzIGEgZ2VuZXJpYyBzZWxlY3Rvci5cbiAqXG4gKiBAdHlwZSBmdW5jdGlvbigpXG4gKiBAcGFyYW0ge3N0cmluZ30gc2VsZWN0b3IgQSBDU1Mgc2VsZWN0b3JcbiAqL1xuRGVsZWdhdGUucHJvdG90eXBlLm1hdGNoZXMgPSAoZnVuY3Rpb24oZWwpIHtcbiAgaWYgKCFlbCkgcmV0dXJuO1xuICB2YXIgcCA9IGVsLnByb3RvdHlwZTtcbiAgcmV0dXJuIChwLm1hdGNoZXNTZWxlY3RvciB8fCBwLndlYmtpdE1hdGNoZXNTZWxlY3RvciB8fCBwLm1vek1hdGNoZXNTZWxlY3RvciB8fCBwLm1zTWF0Y2hlc1NlbGVjdG9yIHx8IHAub01hdGNoZXNTZWxlY3Rvcik7XG59KEhUTUxFbGVtZW50KSk7XG5cbi8qKlxuICogQ2hlY2sgd2hldGhlciBhbiBlbGVtZW50XG4gKiBtYXRjaGVzIGEgdGFnIHNlbGVjdG9yLlxuICpcbiAqIFRhZ3MgYXJlIE5PVCBjYXNlLXNlbnNpdGl2ZSxcbiAqIGV4Y2VwdCBpbiBYTUwgKGFuZCBYTUwtYmFzZWRcbiAqIGxhbmd1YWdlcyBzdWNoIGFzIFhIVE1MKS5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gdGFnTmFtZSBUaGUgdGFnIG5hbWUgdG8gdGVzdCBhZ2FpbnN0XG4gKiBAcGFyYW0ge0VsZW1lbnR9IGVsZW1lbnQgVGhlIGVsZW1lbnQgdG8gdGVzdCB3aXRoXG4gKiBAcmV0dXJucyBib29sZWFuXG4gKi9cbkRlbGVnYXRlLnByb3RvdHlwZS5tYXRjaGVzVGFnID0gZnVuY3Rpb24odGFnTmFtZSwgZWxlbWVudCkge1xuICByZXR1cm4gdGFnTmFtZSA9PT0gZWxlbWVudC50YWdOYW1lO1xufTtcblxuLyoqXG4gKiBDaGVjayB3aGV0aGVyIGFuIGVsZW1lbnRcbiAqIG1hdGNoZXMgdGhlIHJvb3QuXG4gKlxuICogQHBhcmFtIHs/U3RyaW5nfSBzZWxlY3RvciBJbiB0aGlzIGNhc2UgdGhpcyBpcyBhbHdheXMgcGFzc2VkIHRocm91Z2ggYXMgbnVsbCBhbmQgbm90IHVzZWRcbiAqIEBwYXJhbSB7RWxlbWVudH0gZWxlbWVudCBUaGUgZWxlbWVudCB0byB0ZXN0IHdpdGhcbiAqIEByZXR1cm5zIGJvb2xlYW5cbiAqL1xuRGVsZWdhdGUucHJvdG90eXBlLm1hdGNoZXNSb290ID0gZnVuY3Rpb24oc2VsZWN0b3IsIGVsZW1lbnQpIHtcbiAgcmV0dXJuIHRoaXMucm9vdEVsZW1lbnQgPT09IGVsZW1lbnQ7XG59O1xuXG4vKipcbiAqIENoZWNrIHdoZXRoZXIgdGhlIElEIG9mXG4gKiB0aGUgZWxlbWVudCBpbiAndGhpcydcbiAqIG1hdGNoZXMgdGhlIGdpdmVuIElELlxuICpcbiAqIElEcyBhcmUgY2FzZS1zZW5zaXRpdmUuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IGlkIFRoZSBJRCB0byB0ZXN0IGFnYWluc3RcbiAqIEBwYXJhbSB7RWxlbWVudH0gZWxlbWVudCBUaGUgZWxlbWVudCB0byB0ZXN0IHdpdGhcbiAqIEByZXR1cm5zIGJvb2xlYW5cbiAqL1xuRGVsZWdhdGUucHJvdG90eXBlLm1hdGNoZXNJZCA9IGZ1bmN0aW9uKGlkLCBlbGVtZW50KSB7XG4gIHJldHVybiBpZCA9PT0gZWxlbWVudC5pZDtcbn07XG5cbi8qKlxuICogU2hvcnQgaGFuZCBmb3Igb2ZmKClcbiAqIGFuZCByb290KCksIGllIGJvdGhcbiAqIHdpdGggbm8gcGFyYW1ldGVyc1xuICpcbiAqIEByZXR1cm4gdm9pZFxuICovXG5EZWxlZ2F0ZS5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLm9mZigpO1xuICB0aGlzLnJvb3QoKTtcbn07XG4iLCIvKmpzaGludCBicm93c2VyOnRydWUsIG5vZGU6dHJ1ZSovXG5cbid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBAcHJlc2VydmUgQ3JlYXRlIGFuZCBtYW5hZ2UgYSBET00gZXZlbnQgZGVsZWdhdG9yLlxuICpcbiAqIEB2ZXJzaW9uIDAuMy4wXG4gKiBAY29kaW5nc3RhbmRhcmQgZnRsYWJzLWpzdjJcbiAqIEBjb3B5cmlnaHQgVGhlIEZpbmFuY2lhbCBUaW1lcyBMaW1pdGVkIFtBbGwgUmlnaHRzIFJlc2VydmVkXVxuICogQGxpY2Vuc2UgTUlUIExpY2Vuc2UgKHNlZSBMSUNFTlNFLnR4dClcbiAqL1xudmFyIERlbGVnYXRlID0gcmVxdWlyZSgnLi9kZWxlZ2F0ZScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHJvb3QpIHtcbiAgcmV0dXJuIG5ldyBEZWxlZ2F0ZShyb290KTtcbn07XG5cbm1vZHVsZS5leHBvcnRzLkRlbGVnYXRlID0gRGVsZWdhdGU7XG4iLCJcbi8qKlxuICogRXhwb3NlIGBwYXJzZWAuXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBwYXJzZTtcblxuLyoqXG4gKiBXcmFwIG1hcCBmcm9tIGpxdWVyeS5cbiAqL1xuXG52YXIgbWFwID0ge1xuICBvcHRpb246IFsxLCAnPHNlbGVjdCBtdWx0aXBsZT1cIm11bHRpcGxlXCI+JywgJzwvc2VsZWN0PiddLFxuICBvcHRncm91cDogWzEsICc8c2VsZWN0IG11bHRpcGxlPVwibXVsdGlwbGVcIj4nLCAnPC9zZWxlY3Q+J10sXG4gIGxlZ2VuZDogWzEsICc8ZmllbGRzZXQ+JywgJzwvZmllbGRzZXQ+J10sXG4gIHRoZWFkOiBbMSwgJzx0YWJsZT4nLCAnPC90YWJsZT4nXSxcbiAgdGJvZHk6IFsxLCAnPHRhYmxlPicsICc8L3RhYmxlPiddLFxuICB0Zm9vdDogWzEsICc8dGFibGU+JywgJzwvdGFibGU+J10sXG4gIGNvbGdyb3VwOiBbMSwgJzx0YWJsZT4nLCAnPC90YWJsZT4nXSxcbiAgY2FwdGlvbjogWzEsICc8dGFibGU+JywgJzwvdGFibGU+J10sXG4gIHRyOiBbMiwgJzx0YWJsZT48dGJvZHk+JywgJzwvdGJvZHk+PC90YWJsZT4nXSxcbiAgdGQ6IFszLCAnPHRhYmxlPjx0Ym9keT48dHI+JywgJzwvdHI+PC90Ym9keT48L3RhYmxlPiddLFxuICB0aDogWzMsICc8dGFibGU+PHRib2R5Pjx0cj4nLCAnPC90cj48L3Rib2R5PjwvdGFibGU+J10sXG4gIGNvbDogWzIsICc8dGFibGU+PHRib2R5PjwvdGJvZHk+PGNvbGdyb3VwPicsICc8L2NvbGdyb3VwPjwvdGFibGU+J10sXG4gIF9kZWZhdWx0OiBbMCwgJycsICcnXVxufTtcblxuLyoqXG4gKiBQYXJzZSBgaHRtbGAgYW5kIHJldHVybiB0aGUgY2hpbGRyZW4uXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGh0bWxcbiAqIEByZXR1cm4ge0FycmF5fVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gcGFyc2UoaHRtbCkge1xuICBpZiAoJ3N0cmluZycgIT0gdHlwZW9mIGh0bWwpIHRocm93IG5ldyBUeXBlRXJyb3IoJ1N0cmluZyBleHBlY3RlZCcpO1xuXG4gIC8vIHRhZyBuYW1lXG4gIHZhciBtID0gLzwoW1xcdzpdKykvLmV4ZWMoaHRtbCk7XG4gIGlmICghbSkgdGhyb3cgbmV3IEVycm9yKCdObyBlbGVtZW50cyB3ZXJlIGdlbmVyYXRlZC4nKTtcbiAgdmFyIHRhZyA9IG1bMV07XG5cbiAgLy8gYm9keSBzdXBwb3J0XG4gIGlmICh0YWcgPT0gJ2JvZHknKSB7XG4gICAgdmFyIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaHRtbCcpO1xuICAgIGVsLmlubmVySFRNTCA9IGh0bWw7XG4gICAgcmV0dXJuIGVsLnJlbW92ZUNoaWxkKGVsLmxhc3RDaGlsZCk7XG4gIH1cblxuICAvLyB3cmFwIG1hcFxuICB2YXIgd3JhcCA9IG1hcFt0YWddIHx8IG1hcC5fZGVmYXVsdDtcbiAgdmFyIGRlcHRoID0gd3JhcFswXTtcbiAgdmFyIHByZWZpeCA9IHdyYXBbMV07XG4gIHZhciBzdWZmaXggPSB3cmFwWzJdO1xuICB2YXIgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgZWwuaW5uZXJIVE1MID0gcHJlZml4ICsgaHRtbCArIHN1ZmZpeDtcbiAgd2hpbGUgKGRlcHRoLS0pIGVsID0gZWwubGFzdENoaWxkO1xuXG4gIHZhciBlbHMgPSBlbC5jaGlsZHJlbjtcbiAgaWYgKDEgPT0gZWxzLmxlbmd0aCkge1xuICAgIHJldHVybiBlbC5yZW1vdmVDaGlsZChlbHNbMF0pO1xuICB9XG5cbiAgdmFyIGZyYWdtZW50ID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xuICB3aGlsZSAoZWxzLmxlbmd0aCkge1xuICAgIGZyYWdtZW50LmFwcGVuZENoaWxkKGVsLnJlbW92ZUNoaWxkKGVsc1swXSkpO1xuICB9XG5cbiAgcmV0dXJuIGZyYWdtZW50O1xufVxuIiwiLyohXG4gICogZG9tcmVhZHkgKGMpIER1c3RpbiBEaWF6IDIwMTIgLSBMaWNlbnNlIE1JVFxuICAqL1xuIWZ1bmN0aW9uIChuYW1lLCBkZWZpbml0aW9uKSB7XG4gIGlmICh0eXBlb2YgbW9kdWxlICE9ICd1bmRlZmluZWQnKSBtb2R1bGUuZXhwb3J0cyA9IGRlZmluaXRpb24oKVxuICBlbHNlIGlmICh0eXBlb2YgZGVmaW5lID09ICdmdW5jdGlvbicgJiYgdHlwZW9mIGRlZmluZS5hbWQgPT0gJ29iamVjdCcpIGRlZmluZShkZWZpbml0aW9uKVxuICBlbHNlIHRoaXNbbmFtZV0gPSBkZWZpbml0aW9uKClcbn0oJ2RvbXJlYWR5JywgZnVuY3Rpb24gKHJlYWR5KSB7XG5cbiAgdmFyIGZucyA9IFtdLCBmbiwgZiA9IGZhbHNlXG4gICAgLCBkb2MgPSBkb2N1bWVudFxuICAgICwgdGVzdEVsID0gZG9jLmRvY3VtZW50RWxlbWVudFxuICAgICwgaGFjayA9IHRlc3RFbC5kb1Njcm9sbFxuICAgICwgZG9tQ29udGVudExvYWRlZCA9ICdET01Db250ZW50TG9hZGVkJ1xuICAgICwgYWRkRXZlbnRMaXN0ZW5lciA9ICdhZGRFdmVudExpc3RlbmVyJ1xuICAgICwgb25yZWFkeXN0YXRlY2hhbmdlID0gJ29ucmVhZHlzdGF0ZWNoYW5nZSdcbiAgICAsIHJlYWR5U3RhdGUgPSAncmVhZHlTdGF0ZSdcbiAgICAsIGxvYWRlZFJneCA9IGhhY2sgPyAvXmxvYWRlZHxeYy8gOiAvXmxvYWRlZHxjL1xuICAgICwgbG9hZGVkID0gbG9hZGVkUmd4LnRlc3QoZG9jW3JlYWR5U3RhdGVdKVxuXG4gIGZ1bmN0aW9uIGZsdXNoKGYpIHtcbiAgICBsb2FkZWQgPSAxXG4gICAgd2hpbGUgKGYgPSBmbnMuc2hpZnQoKSkgZigpXG4gIH1cblxuICBkb2NbYWRkRXZlbnRMaXN0ZW5lcl0gJiYgZG9jW2FkZEV2ZW50TGlzdGVuZXJdKGRvbUNvbnRlbnRMb2FkZWQsIGZuID0gZnVuY3Rpb24gKCkge1xuICAgIGRvYy5yZW1vdmVFdmVudExpc3RlbmVyKGRvbUNvbnRlbnRMb2FkZWQsIGZuLCBmKVxuICAgIGZsdXNoKClcbiAgfSwgZilcblxuXG4gIGhhY2sgJiYgZG9jLmF0dGFjaEV2ZW50KG9ucmVhZHlzdGF0ZWNoYW5nZSwgZm4gPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKC9eYy8udGVzdChkb2NbcmVhZHlTdGF0ZV0pKSB7XG4gICAgICBkb2MuZGV0YWNoRXZlbnQob25yZWFkeXN0YXRlY2hhbmdlLCBmbilcbiAgICAgIGZsdXNoKClcbiAgICB9XG4gIH0pXG5cbiAgcmV0dXJuIChyZWFkeSA9IGhhY2sgP1xuICAgIGZ1bmN0aW9uIChmbikge1xuICAgICAgc2VsZiAhPSB0b3AgP1xuICAgICAgICBsb2FkZWQgPyBmbigpIDogZm5zLnB1c2goZm4pIDpcbiAgICAgICAgZnVuY3Rpb24gKCkge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICB0ZXN0RWwuZG9TY3JvbGwoJ2xlZnQnKVxuICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkgeyByZWFkeShmbikgfSwgNTApXG4gICAgICAgICAgfVxuICAgICAgICAgIGZuKClcbiAgICAgICAgfSgpXG4gICAgfSA6XG4gICAgZnVuY3Rpb24gKGZuKSB7XG4gICAgICBsb2FkZWQgPyBmbigpIDogZm5zLnB1c2goZm4pXG4gICAgfSlcbn0pXG4iLCIvKiFcclxuICogZG9wZSAgICAgICAgIEhUTUwgYXR0cmlidXRlcy9kYXRhc2V0IG1vZHVsZVxyXG4gKiBAbGluayAgICAgICAgaHR0cDovL2dpdGh1Yi5jb20vcnlhbnZlL2RvcGVcclxuICogQGxpY2Vuc2UgICAgIE1JVFxyXG4gKiBAY29weXJpZ2h0ICAgMjAxMiBSeWFuIFZhbiBFdHRlblxyXG4gKiBAdmVyc2lvbiAgICAgMi4yLjFcclxuICovXHJcblxyXG4vKmpzaGludCBleHByOnRydWUsIHN1Yjp0cnVlLCBzdXBlcm5ldzp0cnVlLCBkZWJ1Zzp0cnVlLCBub2RlOnRydWUsIGJvc3M6dHJ1ZSwgZGV2ZWw6dHJ1ZSwgZXZpbDp0cnVlLCBcclxuICBsYXhjb21tYTp0cnVlLCBlcW51bGw6dHJ1ZSwgdW5kZWY6dHJ1ZSwgdW51c2VkOnRydWUsIGJyb3dzZXI6dHJ1ZSwganF1ZXJ5OnRydWUsIG1heGVycjoxMDAgKi9cclxuXHJcbihmdW5jdGlvbihyb290LCBuYW1lLCBtYWtlKSB7XHJcbiAgICB0eXBlb2YgbW9kdWxlICE9ICd1bmRlZmluZWQnICYmIG1vZHVsZVsnZXhwb3J0cyddID8gbW9kdWxlWydleHBvcnRzJ10gPSBtYWtlKCkgOiByb290W25hbWVdID0gbWFrZSgpO1xyXG59KHRoaXMsICdkb3BlJywgZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgLy8gZGV2ZWxvcGVycy5nb29nbGUuY29tL2Nsb3N1cmUvY29tcGlsZXIvZG9jcy9hcGktdHV0b3JpYWwzXHJcbiAgICAvLyBkZXZlbG9wZXJzLmdvb2dsZS5jb20vY2xvc3VyZS9jb21waWxlci9kb2NzL2pzLWZvci1jb21waWxlclxyXG5cclxuICAgIHZhciBkb2MgPSBkb2N1bWVudFxyXG4gICAgICAsIHhwb3J0cyA9IHt9XHJcbiAgICAgICwgZWZmaW5zID0geHBvcnRzWydmbiddID0ge31cclxuICAgICAgLCBvd25zID0geHBvcnRzLmhhc093blByb3BlcnR5XHJcbiAgICAgICwgRE1TID0gdHlwZW9mIERPTVN0cmluZ01hcCAhPSAndW5kZWZpbmVkJ1xyXG4gICAgICAsIHBhcnNlSlNPTiA9IHR5cGVvZiBKU09OICE9ICd1bmRlZmluZWQnICYmIEpTT04ucGFyc2VcclxuICAgICAgLCBxdWVyeU1ldGhvZCA9ICdxdWVyeVNlbGVjdG9yQWxsJyBcclxuICAgICAgLCBRU0EgPSAhIWRvY1txdWVyeU1ldGhvZF0gfHwgIShxdWVyeU1ldGhvZCA9ICdnZXRFbGVtZW50c0J5VGFnTmFtZScpXHJcbiAgICAgICwgcXVlcnlFbmdpbmUgPSBmdW5jdGlvbihzLCByb290KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBzID8gKHJvb3QgfHwgZG9jKVtxdWVyeU1ldGhvZF0ocykgOiBbXTsgXHJcbiAgICAgICAgfVxyXG4gICAgICAsIGNhbWVscyA9IC8oW2Etel0pKFtBLVpdKS9nICAgICAgICAgICAgLy8gbG93ZXJjYXNlIG5leHQgdG8gdXBwZXJjYXNlXHJcbiAgICAgICwgZGFzaEI0ID0gLy0oLikvZyAgICAgICAgICAgICAgICAgICAgICAvLyBmaW5kcyBjaGFycyBhZnRlciBoeXBoZW5zXHJcbiAgICAgICwgY3N2U3N2ID0gL1xccypbXFxzXFwsXStcXHMqLyAgICAgICAgICAgICAgLy8gc3BsaXR0ZXIgZm9yIGNvbW1hICpvciogc3BhY2Utc2VwYXJhdGVkIHZhbHVlc1xyXG4gICAgICAsIGNsZWFuQXR0ciA9IC9eW1xcW1xcc10rfFxccyt8W1xcXVxcc10rJC9nICAvLyByZXBsYWNlIHdoaXRlc3BhY2UsIHRyaW0gW10gYnJhY2tldHNcclxuICAgICAgLCBjbGVhblByZSA9IC9eW1xcW1xcc10/KGRhdGEtKT98XFxzK3xbXFxdXFxzXT8kL2cgLy8gcmVwbGFjZSB3aGl0ZXNwYWNlLCB0cmltIFtdIGJyYWNrZXRzLCB0cmltIHByZWZpeFxyXG4gICAgICAsIGVzY0RvdHMgPSAvXFxcXCpcXC4vZyAgICAgICAgICAgICAgICAgICAgLy8gZmluZCBwZXJpb2RzIHcvIGFuZCB3L28gcHJlY2VkaW5nIGJhY2tzbGFzaGVzXHJcbiAgICAgICwgc3N2ID0gL1xccysvXHJcbiAgICAgICwgdHJpbW1lciA9IC9eXFxzK3xcXHMrJC9cclxuICAgICAgLCB0cmltID0gJycudHJpbSA/IGZ1bmN0aW9uKHMpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG51bGwgPT0gcyA/ICcnIDogcy50cmltKCk7IFxyXG4gICAgICAgIH0gOiBmdW5jdGlvbihzKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBudWxsID09IHMgPyAnJyA6IHMucmVwbGFjZSh0cmltbWVyLCAnJyk7IFxyXG4gICAgICAgIH07XHJcbiAgICBcclxuICAgIC8qKlxyXG4gICAgICogQHJldHVybiAge3N0cmluZ31cclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gY2FtZWxIYW5kbGVyKGFsbCwgbGV0dGVyKSB7IFxyXG4gICAgICAgIHJldHVybiBsZXR0ZXIudG9VcHBlckNhc2UoKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIENvbnZlcnQgICdkYXRhLXB1bHAtZmljdGlvbicgdG8gJ3B1bHBGaWN0aW9uJy4gTm9uLXNjYWxhcnMgcmV0dXJuIGFuXHJcbiAgICAgKiBlbXB0eSBzdHJpbmcuIG51bWJlcnxib29sZWFuIGNvZXJjZXMgdG8gc3RyaW5nLiAob3Bwb3NpdGU6IGRhdGF0aXplKCkpXHJcbiAgICAgKiBAcGFyYW0gICB7c3RyaW5nfG51bWJlcnxib29sZWFufCp9ICBzXHJcbiAgICAgKiBAcmV0dXJuICB7c3RyaW5nfVxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBjYW1lbGl6ZShzKSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBzICE9ICdzdHJpbmcnKVxyXG4gICAgICAgICAgICByZXR1cm4gdHlwZW9mIHMgPT0gJ251bWJlcicgfHwgdHlwZW9mIHMgPT0gJ2Jvb2xlYW4nID8gJycgKyBzIDogJyc7IFxyXG4gICAgICAgIC8vIFJlbW92ZSBkYXRhLSBwcmVmaXggYW5kIGNvbnZlcnQgcmVtYWluaW5nIGRhc2hlZCBzdHJpbmcgdG8gY2FtZWxDYXNlOlxyXG4gICAgICAgIHJldHVybiBzLnJlcGxhY2UoY2xlYW5QcmUsICcnKS5yZXBsYWNlKGRhc2hCNCwgY2FtZWxIYW5kbGVyKTsgLy8gLWEgdG8gQVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ29udmVydCAgJ3B1bHBGaWN0aW9uJyB0byAnZGF0YS1wdWxwLWZpY3Rpb24nIE9SIDQ3IHRvICdkYXRhLTQ3J1xyXG4gICAgICogSW52YWxpZCB0eXBlcyByZXR1cm4gYW4gZW1wdHkgc3RyaW5nLiAob3Bwb3NpdGU6IGNhbWVsaXplKCkpXHJcbiAgICAgKiBAcGFyYW0gICB7c3RyaW5nfG51bWJlcnwqfSAgc1xyXG4gICAgICogQHJldHVybiAge3N0cmluZ31cclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gZGF0YXRpemUocykge1xyXG4gICAgICAgIGlmICh0eXBlb2YgcyA9PSAnc3RyaW5nJykgcyA9IHMucmVwbGFjZShjbGVhblByZSwgJyQxJykucmVwbGFjZShjYW1lbHMsICckMS0kMicpOyAvLyBhQSB0byBhLUFcclxuICAgICAgICBlbHNlIHMgPSB0eXBlb2YgcyA9PSAnbnVtYmVyJyAgPyAnJyArIHMgOiAnJztcclxuICAgICAgICByZXR1cm4gcyA/ICgnZGF0YS0nICsgcy50b0xvd2VyQ2FzZSgpKSA6IHM7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDb252ZXJ0IGEgc3RyaW5naWZpZWQgcHJpbWl0aXZlIGludG8gaXRzIGNvcnJlY3QgdHlwZS5cclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfCp9ICBzXHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIHBhcnNlKHMpIHtcclxuICAgICAgICB2YXIgbjsgLy8gdW5kZWZpbmVkLCBvciBiZWNvbWVzIG51bWJlclxyXG4gICAgICAgIHJldHVybiB0eXBlb2YgcyAhPSAnc3RyaW5nJyB8fCAhcyA/IHNcclxuICAgICAgICAgICAgOiAnZmFsc2UnID09PSBzID8gZmFsc2VcclxuICAgICAgICAgICAgOiAndHJ1ZScgPT09IHMgPyB0cnVlXHJcbiAgICAgICAgICAgIDogJ251bGwnID09PSBzID8gbnVsbFxyXG4gICAgICAgICAgICA6ICd1bmRlZmluZWQnID09PSBzIHx8IChuID0gKCtzKSkgfHwgMCA9PT0gbiB8fCAnTmFOJyA9PT0gcyA/IG5cclxuICAgICAgICAgICAgOiBzO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQHBhcmFtICAge09iamVjdHxBcnJheXwqfSAgbGlzdFxyXG4gICAgICogQHBhcmFtICAge0Z1bmN0aW9ufSAgICAgICAgZm4gICAgIFxyXG4gICAgICogQHBhcmFtICAgeyhPYmplY3R8Kik9fSAgICAgc2NvcGVcclxuICAgICAqIEBwYXJhbSAgIHtib29sZWFuPX0gICAgICAgIGNvbXBhY3QgXHJcbiAgICAgKiBAcmV0dXJuICB7QXJyYXl9XHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIG1hcChsaXN0LCBmbiwgc2NvcGUsIGNvbXBhY3QpIHtcclxuICAgICAgICB2YXIgbCwgaSA9IDAsIHYsIHUgPSAwLCByZXQgPSBbXTtcclxuICAgICAgICBpZiAobGlzdCA9PSBudWxsKSByZXR1cm4gcmV0O1xyXG4gICAgICAgIGNvbXBhY3QgPSB0cnVlID09PSBjb21wYWN0O1xyXG4gICAgICAgIGZvciAobCA9IGxpc3QubGVuZ3RoOyBpIDwgbDspIHtcclxuICAgICAgICAgICAgdiA9IGZuLmNhbGwoc2NvcGUsIGxpc3RbaV0sIGkrKywgbGlzdCk7XHJcbiAgICAgICAgICAgIGlmICh2IHx8ICFjb21wYWN0KSByZXRbdSsrXSA9IHY7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiByZXQ7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8qKiBcclxuICAgICAqIHNwZWNpYWwtY2FzZSBET00tbm9kZSBpdGVyYXRvciBvcHRpbWl6ZWQgZm9yIGludGVybmFsIHVzZVxyXG4gICAgICogQHBhcmFtIHtPYmplY3R8QXJyYXl9ICBvYlxyXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gICAgICBmblxyXG4gICAgICogQHBhcmFtIHsqPX0gICAgICAgICAgICBwYXJhbVxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBlYWNoTm9kZShvYiwgZm4sIHBhcmFtKSB7XHJcbiAgICAgICAgZm9yICh2YXIgbCA9IG9iLmxlbmd0aCwgaSA9IDA7IGkgPCBsOyBpKyspXHJcbiAgICAgICAgICAgIG9iW2ldICYmIG9iW2ldLm5vZGVUeXBlICYmIGZuKG9iW2ldLCBwYXJhbSk7XHJcbiAgICAgICAgcmV0dXJuIG9iO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogaW50ZXJuYWwtdXNlIGZ1bmN0aW9uIHRvIGl0ZXJhdGUgYSBub2RlJ3MgYXR0cmlidXRlc1xyXG4gICAgICogQHBhcmFtIHtPYmplY3R9ICAgICAgICBlbFxyXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gICAgICBmblxyXG4gICAgICogQHBhcmFtIHsoYm9vbGVhbnwqKT19ICBleHBcclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gZWFjaEF0dHIoZWwsIGZuLCBleHApIHtcclxuICAgICAgICB2YXIgdGVzdCwgbiwgYSwgaSwgbDtcclxuICAgICAgICBpZiAoIWVsLmF0dHJpYnV0ZXMpIHJldHVybjtcclxuICAgICAgICB0ZXN0ID0gdHlwZW9mIGV4cCA9PSAnYm9vbGVhbicgPyAvXmRhdGEtLyA6IHRlc3Q7XHJcbiAgICAgICAgZm9yIChpID0gMCwgbCA9IGVsLmF0dHJpYnV0ZXMubGVuZ3RoOyBpIDwgbDspIHtcclxuICAgICAgICAgICAgaWYgKGEgPSBlbC5hdHRyaWJ1dGVzW2krK10pIHtcclxuICAgICAgICAgICAgICAgIG4gPSAnJyArIGEubmFtZTtcclxuICAgICAgICAgICAgICAgIHRlc3QgJiYgdGVzdC50ZXN0KG4pICE9PSBleHAgfHwgbnVsbCA9PSBhLnZhbHVlIHx8IGZuLmNhbGwoZWwsIGEudmFsdWUsIG4sIGEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogR2V0IG9iamVjdCBjb250YWluaW5nIGFuIGVsZW1lbnQncyBkYXRhIGF0dHJzLlxyXG4gICAgICogQHBhcmFtICB7Tm9kZX0gIGVsXHJcbiAgICAgKiBAcmV0dXJuIHtET01TdHJpbmdNYXB8T2JqZWN0fHVuZGVmaW5lZH1cclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gZ2V0RGF0YXNldChlbCkge1xyXG4gICAgICAgIHZhciBvYjtcclxuICAgICAgICBpZiAoIWVsIHx8IDEgIT09IGVsLm5vZGVUeXBlKSByZXR1cm47ICAvLyB1bmRlZmluZWRcclxuICAgICAgICBpZiAob2IgPSBETVMgJiYgZWwuZGF0YXNldCkgcmV0dXJuIG9iOyAvLyBuYXRpdmVcclxuICAgICAgICBvYiA9IHt9OyAvLyBGYWxsYmFjayBwbGFpbiBvYmplY3QgY2Fubm90IG11dGF0ZSB0aGUgZGF0YXNldCB2aWEgcmVmZXJlbmNlLlxyXG4gICAgICAgIGVhY2hBdHRyKGVsLCBmdW5jdGlvbih2LCBrKSB7XHJcbiAgICAgICAgICAgIG9iW2NhbWVsaXplKGspXSA9ICcnICsgdjtcclxuICAgICAgICB9LCB0cnVlKTtcclxuICAgICAgICByZXR1cm4gb2I7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAcGFyYW0gIHtOb2RlfSAgICAgZWxcclxuICAgICAqIEBwYXJhbSAge09iamVjdD19ICBvYlxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiByZXNldERhdGFzZXQoZWwsIG9iKSB7XHJcbiAgICAgICAgaWYgKCFlbCkgcmV0dXJuO1xyXG4gICAgICAgIHZhciBuLCBjdXJyID0gZWwuZGF0YXNldDtcclxuICAgICAgICBpZiAoY3VyciAmJiBETVMpIHtcclxuICAgICAgICAgICAgaWYgKGN1cnIgPT09IG9iKSByZXR1cm47XHJcbiAgICAgICAgICAgIGZvciAobiBpbiBjdXJyKSBkZWxldGUgY3VycltuXTtcclxuICAgICAgICB9XHJcbiAgICAgICAgb2IgJiYgZGF0YXNldChlbCwgb2IpO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvKipcclxuICAgICAqIEBwYXJhbSAge05vZGV9ICAgICAgZWxcclxuICAgICAqIEBwYXJhbSAge09iamVjdH0gICAgb2JcclxuICAgICAqIEBwYXJhbSAge0Z1bmN0aW9ufSAgZm5cclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gc2V0VmlhT2JqZWN0KGVsLCBvYiwgZm4pIHtcclxuICAgICAgICBmb3IgKHZhciBuIGluIG9iKVxyXG4gICAgICAgICAgICBvd25zLmNhbGwob2IsIG4pICYmIGZuKGVsLCBuLCBvYltuXSk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8qKlxyXG4gICAgICogQHBhcmFtICB7T2JqZWN0fEFycmF5fEZ1bmN0aW9ufSAgZWxcclxuICAgICAqIEBwYXJhbSAgeyhzdHJpbmd8T2JqZWN0fCopPX0gICAgIGtcclxuICAgICAqIEBwYXJhbSAgeyo9fSAgICAgICAgICAgICAgICAgICAgIHZcclxuICAgICAqLyAgICBcclxuICAgIGZ1bmN0aW9uIGF0dHIoZWwsIGssIHYpIHtcclxuICAgICAgICBlbCA9IGVsLm5vZGVUeXBlID8gZWwgOiBlbFswXTtcclxuICAgICAgICBpZiAoIWVsIHx8ICFlbC5zZXRBdHRyaWJ1dGUpIHJldHVybjtcclxuICAgICAgICBrID0gdHlwZW9mIGsgPT0gJ2Z1bmN0aW9uJyA/IGsuY2FsbChlbCkgOiBrO1xyXG4gICAgICAgIGlmICghaykgcmV0dXJuO1xyXG4gICAgICAgIGlmICh0eXBlb2YgayA9PSAnb2JqZWN0Jykge1xyXG4gICAgICAgICAgICAvLyBTRVQtbXVsdGlcclxuICAgICAgICAgICAgc2V0VmlhT2JqZWN0KGVsLCBrLCBhdHRyKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBpZiAodm9pZCAwID09PSB2KSB7XHJcbiAgICAgICAgICAgICAgICAvLyBHRVRcclxuICAgICAgICAgICAgICAgIGsgPSBlbC5nZXRBdHRyaWJ1dGUoayk7IC8vIHJlcHVycG9zZVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGwgPT0gayA/IHYgOiAnJyArIGs7IC8vIG5vcm1hbGl6ZVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIFNFVFxyXG4gICAgICAgICAgICB2ID0gdHlwZW9mIHYgPT0gJ2Z1bmN0aW9uJyA/IHYuY2FsbChlbCkgOiB2O1xyXG4gICAgICAgICAgICB2ID0gJycgKyB2OyAvLyBub3JtYWxpemUgaW5wdXRzXHJcbiAgICAgICAgICAgIGVsLnNldEF0dHJpYnV0ZShrLCB2KTtcclxuICAgICAgICAgICAgcmV0dXJuIHY7IC8vIHRoZSBjdXJyIHZhbHVlXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvKipcclxuICAgICAqIEBwYXJhbSAge09iamVjdHxBcnJheXxGdW5jdGlvbn0gIGVsXHJcbiAgICAgKiBAcGFyYW0gIHsoc3RyaW5nfE9iamVjdHwqKT19ICAgICBrXHJcbiAgICAgKiBAcGFyYW0gIHsqPX0gICAgICAgICAgICAgICAgICAgICB2XHJcbiAgICAgKi8gICAgXHJcbiAgICBmdW5jdGlvbiBkYXRhc2V0KGVsLCBrLCB2KSB7XHJcbiAgICAgICAgdmFyIGV4YWN0LCBrRnVuID0gdHlwZW9mIGsgPT0gJ2Z1bmN0aW9uJztcclxuICAgICAgICBlbCA9IGVsLm5vZGVUeXBlID8gZWwgOiBlbFswXTtcclxuICAgICAgICBpZiAoIWVsIHx8ICFlbC5zZXRBdHRyaWJ1dGUpIHJldHVybjtcclxuICAgICAgICBpZiAodm9pZCAwID09PSBrICYmIHYgPT09IGspIHJldHVybiBnZXREYXRhc2V0KGVsKTtcclxuICAgICAgICBrID0ga0Z1biA/IGsuY2FsbChlbCkgOiBrO1xyXG5cclxuICAgICAgICBpZiAodHlwZW9mIGsgPT0gJ29iamVjdCcgJiYgKGtGdW4gfHwgIShleGFjdCA9IHZvaWQgMCA9PT0gdiAmJiBkYXRhdGl6ZShrWzBdKSkpKSB7XHJcbiAgICAgICAgICAgIC8vIFNFVC1tdWx0aVxyXG4gICAgICAgICAgICBrRnVuICYmIGRlbGV0ZXMoZWwpO1xyXG4gICAgICAgICAgICBrICYmIHNldFZpYU9iamVjdChlbCwgaywgZGF0YXNldCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgayA9IGV4YWN0IHx8IGRhdGF0aXplKGspO1xyXG4gICAgICAgICAgICBpZiAoIWspIHJldHVybjtcclxuICAgICAgICAgICAgaWYgKHZvaWQgMCA9PT0gdikge1xyXG4gICAgICAgICAgICAgICAgLy8gR0VUXHJcbiAgICAgICAgICAgICAgICBrID0gZWwuZ2V0QXR0cmlidXRlKGspOyAvLyByZXB1cnBvc2VcclxuICAgICAgICAgICAgICAgIHJldHVybiBudWxsID09IGsgPyB2IDogZXhhY3QgPyBwYXJzZShrKSA6ICcnICsgazsgLy8gbm9ybWFsaXplXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gU0VUXHJcbiAgICAgICAgICAgIHYgPSB0eXBlb2YgdiA9PSAnZnVuY3Rpb24nID8gdi5jYWxsKGVsKSA6IHY7XHJcbiAgICAgICAgICAgIHYgPSAnJyArIHY7IC8vIG5vcm1hbGl6ZSBpbnB1dHNcclxuICAgICAgICAgICAgZWwuc2V0QXR0cmlidXRlKGssIHYpO1xyXG4gICAgICAgICAgICByZXR1cm4gdjsgLy8gY3VycmVudCB2YWx1ZVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEBwYXJhbSAge05vZGV9ICAgICAgICAgICAgICAgICAgIGVsXHJcbiAgICAgKiBAcGFyYW0gIHsoQXJyYXl8c3RyaW5nfG51bWJlcik9fSBrZXlzXHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIGRlbGV0ZXMoZWwsIGtleXMpIHtcclxuICAgICAgICB2YXIgaywgaSA9IDA7XHJcbiAgICAgICAgZWwgPSBlbC5ub2RlVHlwZSA/IGVsIDogZWxbMF07XHJcbiAgICAgICAgaWYgKCFlbCB8fCAhZWwucmVtb3ZlQXR0cmlidXRlKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgaWYgKHZvaWQgMCA9PT0ga2V5cykge1xyXG4gICAgICAgICAgICByZXNldERhdGFzZXQoZWwpOyBcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBrZXlzID0gdHlwZW9mIGtleXMgPT0gJ3N0cmluZycgPyBrZXlzLnNwbGl0KHNzdikgOiBbXS5jb25jYXQoa2V5cyk7XHJcbiAgICAgICAgICAgIHdoaWxlIChpIDwga2V5cy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgIGsgPSBkYXRhdGl6ZShrZXlzW2krK10pO1xyXG4gICAgICAgICAgICAgICAgayAmJiBlbC5yZW1vdmVBdHRyaWJ1dGUoayk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8qKlxyXG4gICAgICogQHBhcmFtICB7Tm9kZX0gICAgICAgICAgICAgICAgZWxcclxuICAgICAqIEBwYXJhbSAge0FycmF5fHN0cmluZ3xudW1iZXJ9IGtleXNcclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gcmVtb3ZlQXR0cihlbCwga2V5cykge1xyXG4gICAgICAgIHZhciBpID0gMDtcclxuICAgICAgICBlbCA9IGVsLm5vZGVUeXBlID8gZWwgOiBlbFswXTtcclxuICAgICAgICBpZiAoZWwgJiYgZWwucmVtb3ZlQXR0cmlidXRlKSB7XHJcbiAgICAgICAgICAgIGZvciAoa2V5cyA9IHR5cGVvZiBrZXlzID09ICdzdHJpbmcnID8ga2V5cy5zcGxpdChzc3YpIDogW10uY29uY2F0KGtleXMpOyBpIDwga2V5cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAga2V5c1tpXSAmJiBlbC5yZW1vdmVBdHRyaWJ1dGUoa2V5c1tpXSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDb252ZXJ0IGxpc3Qgb2YgYXR0ciBuYW1lcyBvciBkYXRhLSBrZXlzIGludG8gYSBzZWxlY3Rvci5cclxuICAgICAqIEBwYXJhbSAgIHtBcnJheXxzdHJpbmd8bnVtYmVyfCp9ICBsaXN0XHJcbiAgICAgKiBAcGFyYW0gICB7Ym9vbGVhbj19ICAgICAgICAgICAgICAgcHJlZml4XHJcbiAgICAgKiBAcGFyYW0gICB7Ym9vbGVhbj19ICAgICAgICAgICAgICAgam9pblxyXG4gICAgICogQHJldHVybiAge3N0cmluZ3xBcnJheX1cclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gdG9BdHRyU2VsZWN0b3IobGlzdCwgcHJlZml4LCBqb2luKSB7XHJcbiAgICAgICAgdmFyIGwsIHMsIGkgPSAwLCBqID0gMCwgZW1wID0gJycsIGFyciA9IFtdO1xyXG4gICAgICAgIHByZWZpeCA9IHRydWUgPT09IHByZWZpeDtcclxuICAgICAgICBsaXN0ID0gdHlwZW9mIGxpc3QgPT0gJ3N0cmluZycgPyBsaXN0LnNwbGl0KGNzdlNzdikgOiB0eXBlb2YgbGlzdCA9PSAnbnVtYmVyJyA/ICcnICsgbGlzdCA6IGxpc3Q7XHJcbiAgICAgICAgZm9yIChsID0gbGlzdC5sZW5ndGg7IGkgPCBsOykge1xyXG4gICAgICAgICAgICBzID0gbGlzdFtpKytdO1xyXG4gICAgICAgICAgICBzID0gcHJlZml4ID8gZGF0YXRpemUocykgOiBzLnJlcGxhY2UoY2xlYW5BdHRyLCBlbXApO1xyXG4gICAgICAgICAgICBzICYmIChhcnJbaisrXSA9IHMpO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBFc2NhcGUgcGVyaW9kcyB0byBhbGxvdyBhdHRzIGxpa2UgYFtkYXRhLXRoZS53aF9vXWBcclxuICAgICAgICAvLyBAbGluayBhcGkuanF1ZXJ5LmNvbS9jYXRlZ29yeS9zZWxlY3RvcnMvXHJcbiAgICAgICAgLy8gQGxpbmsgc3RhY2tvdmVyZmxvdy5jb20vcS8xMzI4MzY5OS83NzAxMjdcclxuICAgICAgICByZXR1cm4gZmFsc2UgPT09IGpvaW4gPyBhcnIgOiBqID8gJ1snICsgYXJyLmpvaW4oJ10sWycpLnJlcGxhY2UoZXNjRG90cywgJ1xcXFxcXFxcLicpICsgJ10nIDogZW1wO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogR2V0IGVsZW1lbnRzIG1hdGNoZWQgYnkgYSBkYXRhIGtleS5cclxuICAgICAqIEBwYXJhbSAgIHtBcnJheXxzdHJpbmd9ICBsaXN0ICAgYXJyYXkgb3IgQ1NWIG9yIFNTViBkYXRhIGtleXNcclxuICAgICAqIEByZXR1cm4gIHtBcnJheXwqfVxyXG4gICAgICovICAgICBcclxuICAgIHhwb3J0c1sncXVlcnlEYXRhJ10gPSBRU0EgPyBmdW5jdGlvbihsaXN0LCByb290KSB7XHJcbiAgICAgICAgLy8gTW9kZXJuIGJyb3dzZXJzLCBJRTgrXHJcbiAgICAgICAgcmV0dXJuIGZhbHNlID09PSByb290ID8gdG9BdHRyU2VsZWN0b3IobGlzdCwgdHJ1ZSwgcm9vdCkgOiBxdWVyeUVuZ2luZSh0b0F0dHJTZWxlY3RvcihsaXN0LCB0cnVlKSwgcm9vdCk7XHJcbiAgICB9IDogZnVuY3Rpb24obGlzdCwgcm9vdCkge1xyXG4gICAgICAgIC8vID09IEZBTExCQUNLID09XHJcbiAgICAgICAgbGlzdCA9IHRvQXR0clNlbGVjdG9yKGxpc3QsIHRydWUsIGZhbHNlKTtcclxuICAgICAgICByZXR1cm4gZmFsc2UgPT09IHJvb3QgPyBsaXN0IDogcXVlcnlBdHRyRmFsbGJhY2sobGlzdCwgcm9vdCk7IFxyXG4gICAgfTtcclxuICAgIFxyXG4gICAgLyoqXHJcbiAgICAgKiBHZXQgZWxlbWVudHMgbWF0Y2hlZCBieSBhbiBhdHRyaWJ1dGUgbmFtZS5cclxuICAgICAqIEBwYXJhbSAgIHtBcnJheXxzdHJpbmd9ICBsaXN0ICAgYXJyYXkgb3IgQ1NWIG9yIFNTViBkYXRhIGtleXNcclxuICAgICAqIEByZXR1cm4gIHtBcnJheXwqfVxyXG4gICAgICovICAgICBcclxuICAgIHhwb3J0c1sncXVlcnlBdHRyJ10gPSBRU0EgPyBmdW5jdGlvbihsaXN0LCByb290KSB7XHJcbiAgICAgICAgLy8gTW9kZXJuIGJyb3dzZXJzLCBJRTgrXHJcbiAgICAgICAgcmV0dXJuIGZhbHNlID09PSByb290ID8gdG9BdHRyU2VsZWN0b3IobGlzdCwgcm9vdCwgcm9vdCkgOiBxdWVyeUVuZ2luZSh0b0F0dHJTZWxlY3RvcihsaXN0KSwgcm9vdCk7XHJcbiAgICB9IDogZnVuY3Rpb24obGlzdCwgcm9vdCkge1xyXG4gICAgICAgIC8vID09IEZBTExCQUNLID09XHJcbiAgICAgICAgbGlzdCA9IHRvQXR0clNlbGVjdG9yKGxpc3QsIGZhbHNlLCBmYWxzZSk7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlID09PSByb290ID8gbGlzdCA6IHF1ZXJ5QXR0ckZhbGxiYWNrKGxpc3QsIHJvb3QpOyBcclxuICAgIH07XHJcbiAgICBcclxuICAgIC8qKlxyXG4gICAgICogQHBhcmFtIHtBcnJheXxzdHJpbmd9ICBsaXN0ICAgaXMgYW4gYXJyYXkgb2YgYXR0cmlidXRlIG5hbWVzICh3L28gYnJhY2tzKVxyXG4gICAgICogQHBhcmFtIHtPYmplY3Q9fSAgICAgICByb290XHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIHF1ZXJ5QXR0ckZhbGxiYWNrKGxpc3QsIHJvb3QpIHtcclxuICAgICAgICB2YXIgaiwgaSwgZSwgZWxzLCBsID0gbGlzdC5sZW5ndGgsIHJldCA9IFtdLCB1ID0gMDtcclxuICAgICAgICBpZiAoIWwpIHJldHVybiByZXQ7XHJcbiAgICAgICAgZWxzID0gcXVlcnlFbmdpbmUoJyonLCByb290KTtcclxuICAgICAgICBmb3IgKGogPSAwOyAoZSA9IGVsc1tqXSk7IGorKykge1xyXG4gICAgICAgICAgICBpID0gbDsgLy8gcmVzZXQgaSBmb3IgZWFjaCBvdXRlciBpdGVyYXRpb25cclxuICAgICAgICAgICAgd2hpbGUgKGktLSkgey8vIGVhY2ggYXR0ciBuYW1lXHJcbiAgICAgICAgICAgICAgICBpZiAoYXR0cihlLCBsaXN0W2ldKSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0W3UrK10gPSBlOyAvLyBnaGV0dG8gcHVzaFxyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrOyAvLyBwcmV2ZW50IHB1c2hpbmcgc2FtZSBlbGVtIHR3aWNlXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHJldDtcclxuICAgIH1cclxuICAgIFxyXG4gICAgLy8gRXhwb3NlIHJlbWFpbmluZyB0b3AtbGV2ZWwgbWV0aG9kczpcclxuICAgIHhwb3J0c1snbWFwJ10gPSBtYXA7XHJcbiAgICB4cG9ydHNbJ3BhcnNlJ10gPSBwYXJzZTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEBwYXJhbSAge3N0cmluZ3wqfSAgc1xyXG4gICAgICogQHNpbmNlICAyLjEuMFxyXG4gICAgICovXHJcbiAgICB4cG9ydHNbJ3BhcnNlSlNPTiddID0gZnVuY3Rpb24ocykge1xyXG4gICAgICAgIHMgPSBwYXJzZShzKTtcclxuICAgICAgICBpZiAodHlwZW9mIHMgPT0gJ3N0cmluZycpIHtcclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgIHMgPSBwYXJzZUpTT04odHJpbShzKSk7XHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHt9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBzO1xyXG4gICAgfTtcclxuXHJcbiAgICB4cG9ydHNbJ3RyaW0nXSA9IHRyaW07XHJcbiAgICB4cG9ydHNbJ3FzYSddID0gcXVlcnlFbmdpbmU7XHJcbiAgICB4cG9ydHNbJ2F0dHInXSA9IGF0dHI7XHJcbiAgICB4cG9ydHNbJ3JlbW92ZUF0dHInXSA9IHJlbW92ZUF0dHI7XHJcbiAgICB4cG9ydHNbJ2RhdGFzZXQnXSA9IGRhdGFzZXQ7XHJcbiAgICB4cG9ydHNbJ2RlbGV0ZXMnXSA9IGRlbGV0ZXM7XHJcbiAgICB4cG9ydHNbJ2NhbWVsaXplJ10gPSBjYW1lbGl6ZTtcclxuICAgIHhwb3J0c1snZGF0YXRpemUnXSA9IGRhdGF0aXplO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogQHRoaXMgICAge09iamVjdHxBcnJheX1cclxuICAgICAqIEBwYXJhbSAgIHsqPX0gICBrXHJcbiAgICAgKiBAcGFyYW0gICB7Kj19ICAgdlxyXG4gICAgICovXHJcbiAgICBlZmZpbnNbJ2RhdGFzZXQnXSA9IGZ1bmN0aW9uKGssIHYpIHtcclxuICAgICAgICB2YXIga011bHRpID0gdHlwZW9mIGsgPT0gJ29iamVjdCcgPyAhKHZvaWQgMCA9PT0gdiAmJiBkYXRhdGl6ZShrWzBdKSkgOiB0eXBlb2YgayA9PSAnZnVuY3Rpb24nO1xyXG4gICAgICAgIGlmICh2b2lkIDAgPT09IHYgJiYgIWtNdWx0aSlcclxuICAgICAgICAgICAgcmV0dXJuIGRhdGFzZXQodGhpc1swXSwgayk7IC8vIEdFVFxyXG4gICAgICAgIHJldHVybiAoayA9IGtNdWx0aSA/IGsgOiBkYXRhdGl6ZShrKSkgPyBlYWNoTm9kZSh0aGlzLCBmdW5jdGlvbihlLCB4KSB7XHJcbiAgICAgICAgICAgIHggPSB0eXBlb2YgdiA9PSAnZnVuY3Rpb24nID8gdi5jYWxsKGUpIDogdjtcclxuICAgICAgICAgICAga011bHRpID8gZGF0YXNldChlLCBrLCB4KSA6IGUuc2V0QXR0cmlidXRlKGssICcnICsgeCk7IFxyXG4gICAgICAgIH0pIDogdm9pZCAwID09PSB2ID8gdiA6IHRoaXM7XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogQHRoaXMgICAge09iamVjdHxBcnJheX1cclxuICAgICAqIEBwYXJhbSAgIHsqPX0gICBrXHJcbiAgICAgKiBAcGFyYW0gICB7Kj19ICAgdlxyXG4gICAgICovICAgIFxyXG4gICAgZWZmaW5zWydhdHRyJ10gPSBmdW5jdGlvbihrLCB2KSB7XHJcbiAgICAgICAgdmFyIGtNdWx0aSA9IHR5cGVvZiBrID09ICdvYmplY3QnIHx8IHR5cGVvZiBrID09ICdmdW5jdGlvbic7XHJcbiAgICAgICAgaWYgKHZvaWQgMCA9PT0gdiAmJiAha011bHRpKVxyXG4gICAgICAgICAgICByZXR1cm4gYXR0cih0aGlzWzBdLCBrKTsgLy8gR0VUXHJcbiAgICAgICAgcmV0dXJuIGsgPyBlYWNoTm9kZSh0aGlzLCBmdW5jdGlvbihlLCB4KSB7XHJcbiAgICAgICAgICAgIHggPSB0eXBlb2YgdiA9PSAnZnVuY3Rpb24nID8gdi5jYWxsKGUpIDogdjtcclxuICAgICAgICAgICAga011bHRpID8gYXR0cihlLCBrLCB4KSA6IGUuc2V0QXR0cmlidXRlKGssICcnICsgeCk7IFxyXG4gICAgICAgIH0pIDogKHZvaWQgMCA9PT0gdiA/IHYgOiB0aGlzKTtcclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZW1vdmUgZGF0YS0gYXR0cnMgZm9yIGVhY2ggZWxlbWVudCBpbiBhIGNvbGxlY3Rpb24uXHJcbiAgICAgKiBAdGhpcyAge09iamVjdHxBcnJheX1cclxuICAgICAqIEBwYXJhbSB7QXJyYXl8c3RyaW5nfSAga2V5cyAgb25lIG9yIG1vcmUgU1NWIG9yIENTViBkYXRhIGF0dHIga2V5cyBvciBuYW1lc1xyXG4gICAgICovXHJcbiAgICBlZmZpbnNbJ2RlbGV0ZXMnXSA9IGZ1bmN0aW9uKGtleXMpIHtcclxuICAgICAgICBpZiAodm9pZCAwID09PSBrZXlzKVxyXG4gICAgICAgICAgICByZXR1cm4gZWFjaE5vZGUodGhpcywgcmVzZXREYXRhc2V0KTtcclxuICAgICAgICBrZXlzID0gdHlwZW9mIGtleXMgPT0gJ3N0cmluZycgPyBrZXlzLnNwbGl0KHNzdikgOiBbXS5jb25jYXQoa2V5cyk7XHJcbiAgICAgICAgcmV0dXJuIGVhY2hOb2RlKHRoaXMsIHJlbW92ZUF0dHIsIG1hcChrZXlzLCBkYXRhdGl6ZSkpO1xyXG4gICAgfTtcclxuICAgIFxyXG4gICAgLyoqXHJcbiAgICAgKiBSZW1vdmUgYXR0cmJ1dGVzIGZvciBlYWNoIGVsZW1lbnQgaW4gYSBjb2xsZWN0aW9uLlxyXG4gICAgICogQHRoaXMgIHtPYmplY3R8QXJyYXl9XHJcbiAgICAgKiBAcGFyYW0ge0FycmF5fHN0cmluZ30gIGtleXMgIG9uZSBvciBtb3JlIFNTViBvciBDU1YgYXR0ciBuYW1lc1xyXG4gICAgICovXHJcbiAgICBlZmZpbnNbJ3JlbW92ZUF0dHInXSA9IGZ1bmN0aW9uKGtleXMpIHtcclxuICAgICAgICByZXR1cm4gZWFjaE5vZGUodGhpcywgcmVtb3ZlQXR0ciwga2V5cyk7XHJcbiAgICB9O1xyXG5cclxuICAgIHJldHVybiB4cG9ydHM7XHJcbn0pKTsiLCIvLyBLbm9ja291dCBKYXZhU2NyaXB0IGxpYnJhcnkgdjIuMy4wXG4vLyAoYykgU3RldmVuIFNhbmRlcnNvbiAtIGh0dHA6Ly9rbm9ja291dGpzLmNvbS9cbi8vIExpY2Vuc2U6IE1JVCAoaHR0cDovL3d3dy5vcGVuc291cmNlLm9yZy9saWNlbnNlcy9taXQtbGljZW5zZS5waHApXG5cbihmdW5jdGlvbigpe1xudmFyIERFQlVHPXRydWU7XG4oZnVuY3Rpb24odW5kZWZpbmVkKXtcbiAgICAvLyAoMCwgZXZhbCkoJ3RoaXMnKSBpcyBhIHJvYnVzdCB3YXkgb2YgZ2V0dGluZyBhIHJlZmVyZW5jZSB0byB0aGUgZ2xvYmFsIG9iamVjdFxuICAgIC8vIEZvciBkZXRhaWxzLCBzZWUgaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8xNDExOTk4OC9yZXR1cm4tdGhpcy0wLWV2YWx0aGlzLzE0MTIwMDIzIzE0MTIwMDIzXG4gICAgdmFyIHdpbmRvdyA9IHRoaXMgfHwgKDAsIGV2YWwpKCd0aGlzJyksXG4gICAgICAgIGRvY3VtZW50ID0gd2luZG93Wydkb2N1bWVudCddLFxuICAgICAgICBuYXZpZ2F0b3IgPSB3aW5kb3dbJ25hdmlnYXRvciddLFxuICAgICAgICBqUXVlcnkgPSB3aW5kb3dbXCJqUXVlcnlcIl0sXG4gICAgICAgIEpTT04gPSB3aW5kb3dbXCJKU09OXCJdO1xuKGZ1bmN0aW9uKGZhY3RvcnkpIHtcbiAgICAvLyBTdXBwb3J0IHRocmVlIG1vZHVsZSBsb2FkaW5nIHNjZW5hcmlvc1xuICAgIGlmICh0eXBlb2YgcmVxdWlyZSA9PT0gJ2Z1bmN0aW9uJyAmJiB0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIG1vZHVsZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgLy8gWzFdIENvbW1vbkpTL05vZGUuanNcbiAgICAgICAgdmFyIHRhcmdldCA9IG1vZHVsZVsnZXhwb3J0cyddIHx8IGV4cG9ydHM7IC8vIG1vZHVsZS5leHBvcnRzIGlzIGZvciBOb2RlLmpzXG4gICAgICAgIGZhY3RvcnkodGFyZ2V0KTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lWydhbWQnXSkge1xuICAgICAgICAvLyBbMl0gQU1EIGFub255bW91cyBtb2R1bGVcbiAgICAgICAgZGVmaW5lKFsnZXhwb3J0cyddLCBmYWN0b3J5KTtcbiAgICB9IGVsc2Uge1xuICAgICAgICAvLyBbM10gTm8gbW9kdWxlIGxvYWRlciAocGxhaW4gPHNjcmlwdD4gdGFnKSAtIHB1dCBkaXJlY3RseSBpbiBnbG9iYWwgbmFtZXNwYWNlXG4gICAgICAgIGZhY3Rvcnkod2luZG93WydrbyddID0ge30pO1xuICAgIH1cbn0oZnVuY3Rpb24oa29FeHBvcnRzKXtcbi8vIEludGVybmFsbHksIGFsbCBLTyBvYmplY3RzIGFyZSBhdHRhY2hlZCB0byBrb0V4cG9ydHMgKGV2ZW4gdGhlIG5vbi1leHBvcnRlZCBvbmVzIHdob3NlIG5hbWVzIHdpbGwgYmUgbWluaWZpZWQgYnkgdGhlIGNsb3N1cmUgY29tcGlsZXIpLlxuLy8gSW4gdGhlIGZ1dHVyZSwgdGhlIGZvbGxvd2luZyBcImtvXCIgdmFyaWFibGUgbWF5IGJlIG1hZGUgZGlzdGluY3QgZnJvbSBcImtvRXhwb3J0c1wiIHNvIHRoYXQgcHJpdmF0ZSBvYmplY3RzIGFyZSBub3QgZXh0ZXJuYWxseSByZWFjaGFibGUuXG52YXIga28gPSB0eXBlb2Yga29FeHBvcnRzICE9PSAndW5kZWZpbmVkJyA/IGtvRXhwb3J0cyA6IHt9O1xuLy8gR29vZ2xlIENsb3N1cmUgQ29tcGlsZXIgaGVscGVycyAodXNlZCBvbmx5IHRvIG1ha2UgdGhlIG1pbmlmaWVkIGZpbGUgc21hbGxlcilcbmtvLmV4cG9ydFN5bWJvbCA9IGZ1bmN0aW9uKGtvUGF0aCwgb2JqZWN0KSB7XG5cdHZhciB0b2tlbnMgPSBrb1BhdGguc3BsaXQoXCIuXCIpO1xuXG5cdC8vIEluIHRoZSBmdXR1cmUsIFwia29cIiBtYXkgYmVjb21lIGRpc3RpbmN0IGZyb20gXCJrb0V4cG9ydHNcIiAoc28gdGhhdCBub24tZXhwb3J0ZWQgb2JqZWN0cyBhcmUgbm90IHJlYWNoYWJsZSlcblx0Ly8gQXQgdGhhdCBwb2ludCwgXCJ0YXJnZXRcIiB3b3VsZCBiZSBzZXQgdG86ICh0eXBlb2Yga29FeHBvcnRzICE9PSBcInVuZGVmaW5lZFwiID8ga29FeHBvcnRzIDoga28pXG5cdHZhciB0YXJnZXQgPSBrbztcblxuXHRmb3IgKHZhciBpID0gMDsgaSA8IHRva2Vucy5sZW5ndGggLSAxOyBpKyspXG5cdFx0dGFyZ2V0ID0gdGFyZ2V0W3Rva2Vuc1tpXV07XG5cdHRhcmdldFt0b2tlbnNbdG9rZW5zLmxlbmd0aCAtIDFdXSA9IG9iamVjdDtcbn07XG5rby5leHBvcnRQcm9wZXJ0eSA9IGZ1bmN0aW9uKG93bmVyLCBwdWJsaWNOYW1lLCBvYmplY3QpIHtcbiAgb3duZXJbcHVibGljTmFtZV0gPSBvYmplY3Q7XG59O1xua28udmVyc2lvbiA9IFwiMi4zLjBcIjtcblxua28uZXhwb3J0U3ltYm9sKCd2ZXJzaW9uJywga28udmVyc2lvbik7XG5rby51dGlscyA9IChmdW5jdGlvbiAoKSB7XG4gICAgdmFyIG9iamVjdEZvckVhY2ggPSBmdW5jdGlvbihvYmosIGFjdGlvbikge1xuICAgICAgICBmb3IgKHZhciBwcm9wIGluIG9iaikge1xuICAgICAgICAgICAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShwcm9wKSkge1xuICAgICAgICAgICAgICAgIGFjdGlvbihwcm9wLCBvYmpbcHJvcF0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8vIFJlcHJlc2VudCB0aGUga25vd24gZXZlbnQgdHlwZXMgaW4gYSBjb21wYWN0IHdheSwgdGhlbiBhdCBydW50aW1lIHRyYW5zZm9ybSBpdCBpbnRvIGEgaGFzaCB3aXRoIGV2ZW50IG5hbWUgYXMga2V5IChmb3IgZmFzdCBsb29rdXApXG4gICAgdmFyIGtub3duRXZlbnRzID0ge30sIGtub3duRXZlbnRUeXBlc0J5RXZlbnROYW1lID0ge307XG4gICAgdmFyIGtleUV2ZW50VHlwZU5hbWUgPSAobmF2aWdhdG9yICYmIC9GaXJlZm94XFwvMi9pLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCkpID8gJ0tleWJvYXJkRXZlbnQnIDogJ1VJRXZlbnRzJztcbiAgICBrbm93bkV2ZW50c1trZXlFdmVudFR5cGVOYW1lXSA9IFsna2V5dXAnLCAna2V5ZG93bicsICdrZXlwcmVzcyddO1xuICAgIGtub3duRXZlbnRzWydNb3VzZUV2ZW50cyddID0gWydjbGljaycsICdkYmxjbGljaycsICdtb3VzZWRvd24nLCAnbW91c2V1cCcsICdtb3VzZW1vdmUnLCAnbW91c2VvdmVyJywgJ21vdXNlb3V0JywgJ21vdXNlZW50ZXInLCAnbW91c2VsZWF2ZSddO1xuICAgIG9iamVjdEZvckVhY2goa25vd25FdmVudHMsIGZ1bmN0aW9uKGV2ZW50VHlwZSwga25vd25FdmVudHNGb3JUeXBlKSB7XG4gICAgICAgIGlmIChrbm93bkV2ZW50c0ZvclR5cGUubGVuZ3RoKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgaiA9IGtub3duRXZlbnRzRm9yVHlwZS5sZW5ndGg7IGkgPCBqOyBpKyspXG4gICAgICAgICAgICAgICAga25vd25FdmVudFR5cGVzQnlFdmVudE5hbWVba25vd25FdmVudHNGb3JUeXBlW2ldXSA9IGV2ZW50VHlwZTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHZhciBldmVudHNUaGF0TXVzdEJlUmVnaXN0ZXJlZFVzaW5nQXR0YWNoRXZlbnQgPSB7ICdwcm9wZXJ0eWNoYW5nZSc6IHRydWUgfTsgLy8gV29ya2Fyb3VuZCBmb3IgYW4gSUU5IGlzc3VlIC0gaHR0cHM6Ly9naXRodWIuY29tL1N0ZXZlU2FuZGVyc29uL2tub2Nrb3V0L2lzc3Vlcy80MDZcblxuICAgIC8vIERldGVjdCBJRSB2ZXJzaW9ucyBmb3IgYnVnIHdvcmthcm91bmRzICh1c2VzIElFIGNvbmRpdGlvbmFscywgbm90IFVBIHN0cmluZywgZm9yIHJvYnVzdG5lc3MpXG4gICAgLy8gTm90ZSB0aGF0LCBzaW5jZSBJRSAxMCBkb2VzIG5vdCBzdXBwb3J0IGNvbmRpdGlvbmFsIGNvbW1lbnRzLCB0aGUgZm9sbG93aW5nIGxvZ2ljIG9ubHkgZGV0ZWN0cyBJRSA8IDEwLlxuICAgIC8vIEN1cnJlbnRseSB0aGlzIGlzIGJ5IGRlc2lnbiwgc2luY2UgSUUgMTArIGJlaGF2ZXMgY29ycmVjdGx5IHdoZW4gdHJlYXRlZCBhcyBhIHN0YW5kYXJkIGJyb3dzZXIuXG4gICAgLy8gSWYgdGhlcmUgaXMgYSBmdXR1cmUgbmVlZCB0byBkZXRlY3Qgc3BlY2lmaWMgdmVyc2lvbnMgb2YgSUUxMCssIHdlIHdpbGwgYW1lbmQgdGhpcy5cbiAgICB2YXIgaWVWZXJzaW9uID0gZG9jdW1lbnQgJiYgKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgdmVyc2lvbiA9IDMsIGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpLCBpRWxlbXMgPSBkaXYuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2knKTtcblxuICAgICAgICAvLyBLZWVwIGNvbnN0cnVjdGluZyBjb25kaXRpb25hbCBIVE1MIGJsb2NrcyB1bnRpbCB3ZSBoaXQgb25lIHRoYXQgcmVzb2x2ZXMgdG8gYW4gZW1wdHkgZnJhZ21lbnRcbiAgICAgICAgd2hpbGUgKFxuICAgICAgICAgICAgZGl2LmlubmVySFRNTCA9ICc8IS0tW2lmIGd0IElFICcgKyAoKyt2ZXJzaW9uKSArICddPjxpPjwvaT48IVtlbmRpZl0tLT4nLFxuICAgICAgICAgICAgaUVsZW1zWzBdXG4gICAgICAgICkge31cbiAgICAgICAgcmV0dXJuIHZlcnNpb24gPiA0ID8gdmVyc2lvbiA6IHVuZGVmaW5lZDtcbiAgICB9KCkpO1xuICAgIHZhciBpc0llNiA9IGllVmVyc2lvbiA9PT0gNixcbiAgICAgICAgaXNJZTcgPSBpZVZlcnNpb24gPT09IDc7XG5cbiAgICBmdW5jdGlvbiBpc0NsaWNrT25DaGVja2FibGVFbGVtZW50KGVsZW1lbnQsIGV2ZW50VHlwZSkge1xuICAgICAgICBpZiAoKGtvLnV0aWxzLnRhZ05hbWVMb3dlcihlbGVtZW50KSAhPT0gXCJpbnB1dFwiKSB8fCAhZWxlbWVudC50eXBlKSByZXR1cm4gZmFsc2U7XG4gICAgICAgIGlmIChldmVudFR5cGUudG9Mb3dlckNhc2UoKSAhPSBcImNsaWNrXCIpIHJldHVybiBmYWxzZTtcbiAgICAgICAgdmFyIGlucHV0VHlwZSA9IGVsZW1lbnQudHlwZTtcbiAgICAgICAgcmV0dXJuIChpbnB1dFR5cGUgPT0gXCJjaGVja2JveFwiKSB8fCAoaW5wdXRUeXBlID09IFwicmFkaW9cIik7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgZmllbGRzSW5jbHVkZWRXaXRoSnNvblBvc3Q6IFsnYXV0aGVudGljaXR5X3Rva2VuJywgL15fX1JlcXVlc3RWZXJpZmljYXRpb25Ub2tlbihfLiopPyQvXSxcblxuICAgICAgICBhcnJheUZvckVhY2g6IGZ1bmN0aW9uIChhcnJheSwgYWN0aW9uKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgaiA9IGFycmF5Lmxlbmd0aDsgaSA8IGo7IGkrKylcbiAgICAgICAgICAgICAgICBhY3Rpb24oYXJyYXlbaV0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIGFycmF5SW5kZXhPZjogZnVuY3Rpb24gKGFycmF5LCBpdGVtKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIEFycmF5LnByb3RvdHlwZS5pbmRleE9mID09IFwiZnVuY3Rpb25cIilcbiAgICAgICAgICAgICAgICByZXR1cm4gQXJyYXkucHJvdG90eXBlLmluZGV4T2YuY2FsbChhcnJheSwgaXRlbSk7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgaiA9IGFycmF5Lmxlbmd0aDsgaSA8IGo7IGkrKylcbiAgICAgICAgICAgICAgICBpZiAoYXJyYXlbaV0gPT09IGl0ZW0pXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBpO1xuICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICB9LFxuXG4gICAgICAgIGFycmF5Rmlyc3Q6IGZ1bmN0aW9uIChhcnJheSwgcHJlZGljYXRlLCBwcmVkaWNhdGVPd25lcikge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGogPSBhcnJheS5sZW5ndGg7IGkgPCBqOyBpKyspXG4gICAgICAgICAgICAgICAgaWYgKHByZWRpY2F0ZS5jYWxsKHByZWRpY2F0ZU93bmVyLCBhcnJheVtpXSkpXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBhcnJheVtpXTtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9LFxuXG4gICAgICAgIGFycmF5UmVtb3ZlSXRlbTogZnVuY3Rpb24gKGFycmF5LCBpdGVtVG9SZW1vdmUpIHtcbiAgICAgICAgICAgIHZhciBpbmRleCA9IGtvLnV0aWxzLmFycmF5SW5kZXhPZihhcnJheSwgaXRlbVRvUmVtb3ZlKTtcbiAgICAgICAgICAgIGlmIChpbmRleCA+PSAwKVxuICAgICAgICAgICAgICAgIGFycmF5LnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgYXJyYXlHZXREaXN0aW5jdFZhbHVlczogZnVuY3Rpb24gKGFycmF5KSB7XG4gICAgICAgICAgICBhcnJheSA9IGFycmF5IHx8IFtdO1xuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IFtdO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGogPSBhcnJheS5sZW5ndGg7IGkgPCBqOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAoa28udXRpbHMuYXJyYXlJbmRleE9mKHJlc3VsdCwgYXJyYXlbaV0pIDwgMClcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goYXJyYXlbaV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfSxcblxuICAgICAgICBhcnJheU1hcDogZnVuY3Rpb24gKGFycmF5LCBtYXBwaW5nKSB7XG4gICAgICAgICAgICBhcnJheSA9IGFycmF5IHx8IFtdO1xuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IFtdO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGogPSBhcnJheS5sZW5ndGg7IGkgPCBqOyBpKyspXG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2gobWFwcGluZyhhcnJheVtpXSkpO1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfSxcblxuICAgICAgICBhcnJheUZpbHRlcjogZnVuY3Rpb24gKGFycmF5LCBwcmVkaWNhdGUpIHtcbiAgICAgICAgICAgIGFycmF5ID0gYXJyYXkgfHwgW107XG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gW107XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgaiA9IGFycmF5Lmxlbmd0aDsgaSA8IGo7IGkrKylcbiAgICAgICAgICAgICAgICBpZiAocHJlZGljYXRlKGFycmF5W2ldKSlcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goYXJyYXlbaV0pO1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfSxcblxuICAgICAgICBhcnJheVB1c2hBbGw6IGZ1bmN0aW9uIChhcnJheSwgdmFsdWVzVG9QdXNoKSB7XG4gICAgICAgICAgICBpZiAodmFsdWVzVG9QdXNoIGluc3RhbmNlb2YgQXJyYXkpXG4gICAgICAgICAgICAgICAgYXJyYXkucHVzaC5hcHBseShhcnJheSwgdmFsdWVzVG9QdXNoKTtcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgaiA9IHZhbHVlc1RvUHVzaC5sZW5ndGg7IGkgPCBqOyBpKyspXG4gICAgICAgICAgICAgICAgICAgIGFycmF5LnB1c2godmFsdWVzVG9QdXNoW2ldKTtcbiAgICAgICAgICAgIHJldHVybiBhcnJheTtcbiAgICAgICAgfSxcblxuICAgICAgICBhZGRPclJlbW92ZUl0ZW06IGZ1bmN0aW9uKGFycmF5LCB2YWx1ZSwgaW5jbHVkZWQpIHtcbiAgICAgICAgICAgIHZhciBleGlzdGluZ0VudHJ5SW5kZXggPSBhcnJheS5pbmRleE9mID8gYXJyYXkuaW5kZXhPZih2YWx1ZSkgOiBrby51dGlscy5hcnJheUluZGV4T2YoYXJyYXksIHZhbHVlKTtcbiAgICAgICAgICAgIGlmIChleGlzdGluZ0VudHJ5SW5kZXggPCAwKSB7XG4gICAgICAgICAgICAgICAgaWYgKGluY2x1ZGVkKVxuICAgICAgICAgICAgICAgICAgICBhcnJheS5wdXNoKHZhbHVlKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKCFpbmNsdWRlZClcbiAgICAgICAgICAgICAgICAgICAgYXJyYXkuc3BsaWNlKGV4aXN0aW5nRW50cnlJbmRleCwgMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgZXh0ZW5kOiBmdW5jdGlvbiAodGFyZ2V0LCBzb3VyY2UpIHtcbiAgICAgICAgICAgIGlmIChzb3VyY2UpIHtcbiAgICAgICAgICAgICAgICBmb3IodmFyIHByb3AgaW4gc291cmNlKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmKHNvdXJjZS5oYXNPd25Qcm9wZXJ0eShwcm9wKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0W3Byb3BdID0gc291cmNlW3Byb3BdO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRhcmdldDtcbiAgICAgICAgfSxcblxuICAgICAgICBvYmplY3RGb3JFYWNoOiBvYmplY3RGb3JFYWNoLFxuXG4gICAgICAgIGVtcHR5RG9tTm9kZTogZnVuY3Rpb24gKGRvbU5vZGUpIHtcbiAgICAgICAgICAgIHdoaWxlIChkb21Ob2RlLmZpcnN0Q2hpbGQpIHtcbiAgICAgICAgICAgICAgICBrby5yZW1vdmVOb2RlKGRvbU5vZGUuZmlyc3RDaGlsZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgbW92ZUNsZWFuZWROb2Rlc1RvQ29udGFpbmVyRWxlbWVudDogZnVuY3Rpb24obm9kZXMpIHtcbiAgICAgICAgICAgIC8vIEVuc3VyZSBpdCdzIGEgcmVhbCBhcnJheSwgYXMgd2UncmUgYWJvdXQgdG8gcmVwYXJlbnQgdGhlIG5vZGVzIGFuZFxuICAgICAgICAgICAgLy8gd2UgZG9uJ3Qgd2FudCB0aGUgdW5kZXJseWluZyBjb2xsZWN0aW9uIHRvIGNoYW5nZSB3aGlsZSB3ZSdyZSBkb2luZyB0aGF0LlxuICAgICAgICAgICAgdmFyIG5vZGVzQXJyYXkgPSBrby51dGlscy5tYWtlQXJyYXkobm9kZXMpO1xuXG4gICAgICAgICAgICB2YXIgY29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgaiA9IG5vZGVzQXJyYXkubGVuZ3RoOyBpIDwgajsgaSsrKSB7XG4gICAgICAgICAgICAgICAgY29udGFpbmVyLmFwcGVuZENoaWxkKGtvLmNsZWFuTm9kZShub2Rlc0FycmF5W2ldKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gY29udGFpbmVyO1xuICAgICAgICB9LFxuXG4gICAgICAgIGNsb25lTm9kZXM6IGZ1bmN0aW9uIChub2Rlc0FycmF5LCBzaG91bGRDbGVhbk5vZGVzKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgaiA9IG5vZGVzQXJyYXkubGVuZ3RoLCBuZXdOb2Rlc0FycmF5ID0gW107IGkgPCBqOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgY2xvbmVkTm9kZSA9IG5vZGVzQXJyYXlbaV0uY2xvbmVOb2RlKHRydWUpO1xuICAgICAgICAgICAgICAgIG5ld05vZGVzQXJyYXkucHVzaChzaG91bGRDbGVhbk5vZGVzID8ga28uY2xlYW5Ob2RlKGNsb25lZE5vZGUpIDogY2xvbmVkTm9kZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbmV3Tm9kZXNBcnJheTtcbiAgICAgICAgfSxcblxuICAgICAgICBzZXREb21Ob2RlQ2hpbGRyZW46IGZ1bmN0aW9uIChkb21Ob2RlLCBjaGlsZE5vZGVzKSB7XG4gICAgICAgICAgICBrby51dGlscy5lbXB0eURvbU5vZGUoZG9tTm9kZSk7XG4gICAgICAgICAgICBpZiAoY2hpbGROb2Rlcykge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBqID0gY2hpbGROb2Rlcy5sZW5ndGg7IGkgPCBqOyBpKyspXG4gICAgICAgICAgICAgICAgICAgIGRvbU5vZGUuYXBwZW5kQ2hpbGQoY2hpbGROb2Rlc1tpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgcmVwbGFjZURvbU5vZGVzOiBmdW5jdGlvbiAobm9kZVRvUmVwbGFjZU9yTm9kZUFycmF5LCBuZXdOb2Rlc0FycmF5KSB7XG4gICAgICAgICAgICB2YXIgbm9kZXNUb1JlcGxhY2VBcnJheSA9IG5vZGVUb1JlcGxhY2VPck5vZGVBcnJheS5ub2RlVHlwZSA/IFtub2RlVG9SZXBsYWNlT3JOb2RlQXJyYXldIDogbm9kZVRvUmVwbGFjZU9yTm9kZUFycmF5O1xuICAgICAgICAgICAgaWYgKG5vZGVzVG9SZXBsYWNlQXJyYXkubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIHZhciBpbnNlcnRpb25Qb2ludCA9IG5vZGVzVG9SZXBsYWNlQXJyYXlbMF07XG4gICAgICAgICAgICAgICAgdmFyIHBhcmVudCA9IGluc2VydGlvblBvaW50LnBhcmVudE5vZGU7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGogPSBuZXdOb2Rlc0FycmF5Lmxlbmd0aDsgaSA8IGo7IGkrKylcbiAgICAgICAgICAgICAgICAgICAgcGFyZW50Lmluc2VydEJlZm9yZShuZXdOb2Rlc0FycmF5W2ldLCBpbnNlcnRpb25Qb2ludCk7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGogPSBub2Rlc1RvUmVwbGFjZUFycmF5Lmxlbmd0aDsgaSA8IGo7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBrby5yZW1vdmVOb2RlKG5vZGVzVG9SZXBsYWNlQXJyYXlbaV0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBzZXRPcHRpb25Ob2RlU2VsZWN0aW9uU3RhdGU6IGZ1bmN0aW9uIChvcHRpb25Ob2RlLCBpc1NlbGVjdGVkKSB7XG4gICAgICAgICAgICAvLyBJRTYgc29tZXRpbWVzIHRocm93cyBcInVua25vd24gZXJyb3JcIiBpZiB5b3UgdHJ5IHRvIHdyaXRlIHRvIC5zZWxlY3RlZCBkaXJlY3RseSwgd2hlcmVhcyBGaXJlZm94IHN0cnVnZ2xlcyB3aXRoIHNldEF0dHJpYnV0ZS4gUGljayBvbmUgYmFzZWQgb24gYnJvd3Nlci5cbiAgICAgICAgICAgIGlmIChpZVZlcnNpb24gPCA3KVxuICAgICAgICAgICAgICAgIG9wdGlvbk5vZGUuc2V0QXR0cmlidXRlKFwic2VsZWN0ZWRcIiwgaXNTZWxlY3RlZCk7XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgb3B0aW9uTm9kZS5zZWxlY3RlZCA9IGlzU2VsZWN0ZWQ7XG4gICAgICAgIH0sXG5cbiAgICAgICAgc3RyaW5nVHJpbTogZnVuY3Rpb24gKHN0cmluZykge1xuICAgICAgICAgICAgcmV0dXJuIHN0cmluZyA9PT0gbnVsbCB8fCBzdHJpbmcgPT09IHVuZGVmaW5lZCA/ICcnIDpcbiAgICAgICAgICAgICAgICBzdHJpbmcudHJpbSA/XG4gICAgICAgICAgICAgICAgICAgIHN0cmluZy50cmltKCkgOlxuICAgICAgICAgICAgICAgICAgICBzdHJpbmcudG9TdHJpbmcoKS5yZXBsYWNlKC9eW1xcc1xceGEwXSt8W1xcc1xceGEwXSskL2csICcnKTtcbiAgICAgICAgfSxcblxuICAgICAgICBzdHJpbmdUb2tlbml6ZTogZnVuY3Rpb24gKHN0cmluZywgZGVsaW1pdGVyKSB7XG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gW107XG4gICAgICAgICAgICB2YXIgdG9rZW5zID0gKHN0cmluZyB8fCBcIlwiKS5zcGxpdChkZWxpbWl0ZXIpO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGogPSB0b2tlbnMubGVuZ3RoOyBpIDwgajsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIHRyaW1tZWQgPSBrby51dGlscy5zdHJpbmdUcmltKHRva2Vuc1tpXSk7XG4gICAgICAgICAgICAgICAgaWYgKHRyaW1tZWQgIT09IFwiXCIpXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKHRyaW1tZWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfSxcblxuICAgICAgICBzdHJpbmdTdGFydHNXaXRoOiBmdW5jdGlvbiAoc3RyaW5nLCBzdGFydHNXaXRoKSB7XG4gICAgICAgICAgICBzdHJpbmcgPSBzdHJpbmcgfHwgXCJcIjtcbiAgICAgICAgICAgIGlmIChzdGFydHNXaXRoLmxlbmd0aCA+IHN0cmluZy5sZW5ndGgpXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgcmV0dXJuIHN0cmluZy5zdWJzdHJpbmcoMCwgc3RhcnRzV2l0aC5sZW5ndGgpID09PSBzdGFydHNXaXRoO1xuICAgICAgICB9LFxuXG4gICAgICAgIGRvbU5vZGVJc0NvbnRhaW5lZEJ5OiBmdW5jdGlvbiAobm9kZSwgY29udGFpbmVkQnlOb2RlKSB7XG4gICAgICAgICAgICBpZiAoY29udGFpbmVkQnlOb2RlLmNvbXBhcmVEb2N1bWVudFBvc2l0aW9uKVxuICAgICAgICAgICAgICAgIHJldHVybiAoY29udGFpbmVkQnlOb2RlLmNvbXBhcmVEb2N1bWVudFBvc2l0aW9uKG5vZGUpICYgMTYpID09IDE2O1xuICAgICAgICAgICAgd2hpbGUgKG5vZGUgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGlmIChub2RlID09IGNvbnRhaW5lZEJ5Tm9kZSlcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgbm9kZSA9IG5vZGUucGFyZW50Tm9kZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSxcblxuICAgICAgICBkb21Ob2RlSXNBdHRhY2hlZFRvRG9jdW1lbnQ6IGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICAgICAgICByZXR1cm4ga28udXRpbHMuZG9tTm9kZUlzQ29udGFpbmVkQnkobm9kZSwgbm9kZS5vd25lckRvY3VtZW50KTtcbiAgICAgICAgfSxcblxuICAgICAgICBhbnlEb21Ob2RlSXNBdHRhY2hlZFRvRG9jdW1lbnQ6IGZ1bmN0aW9uKG5vZGVzKSB7XG4gICAgICAgICAgICByZXR1cm4gISFrby51dGlscy5hcnJheUZpcnN0KG5vZGVzLCBrby51dGlscy5kb21Ob2RlSXNBdHRhY2hlZFRvRG9jdW1lbnQpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHRhZ05hbWVMb3dlcjogZnVuY3Rpb24oZWxlbWVudCkge1xuICAgICAgICAgICAgLy8gRm9yIEhUTUwgZWxlbWVudHMsIHRhZ05hbWUgd2lsbCBhbHdheXMgYmUgdXBwZXIgY2FzZTsgZm9yIFhIVE1MIGVsZW1lbnRzLCBpdCdsbCBiZSBsb3dlciBjYXNlLlxuICAgICAgICAgICAgLy8gUG9zc2libGUgZnV0dXJlIG9wdGltaXphdGlvbjogSWYgd2Uga25vdyBpdCdzIGFuIGVsZW1lbnQgZnJvbSBhbiBYSFRNTCBkb2N1bWVudCAobm90IEhUTUwpLFxuICAgICAgICAgICAgLy8gd2UgZG9uJ3QgbmVlZCB0byBkbyB0aGUgLnRvTG93ZXJDYXNlKCkgYXMgaXQgd2lsbCBhbHdheXMgYmUgbG93ZXIgY2FzZSBhbnl3YXkuXG4gICAgICAgICAgICByZXR1cm4gZWxlbWVudCAmJiBlbGVtZW50LnRhZ05hbWUgJiYgZWxlbWVudC50YWdOYW1lLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgcmVnaXN0ZXJFdmVudEhhbmRsZXI6IGZ1bmN0aW9uIChlbGVtZW50LCBldmVudFR5cGUsIGhhbmRsZXIpIHtcbiAgICAgICAgICAgIHZhciBtdXN0VXNlQXR0YWNoRXZlbnQgPSBpZVZlcnNpb24gJiYgZXZlbnRzVGhhdE11c3RCZVJlZ2lzdGVyZWRVc2luZ0F0dGFjaEV2ZW50W2V2ZW50VHlwZV07XG4gICAgICAgICAgICBpZiAoIW11c3RVc2VBdHRhY2hFdmVudCAmJiB0eXBlb2YgalF1ZXJ5ICE9IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICAgICAgICBpZiAoaXNDbGlja09uQ2hlY2thYmxlRWxlbWVudChlbGVtZW50LCBldmVudFR5cGUpKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEZvciBjbGljayBldmVudHMgb24gY2hlY2tib3hlcywgalF1ZXJ5IGludGVyZmVyZXMgd2l0aCB0aGUgZXZlbnQgaGFuZGxpbmcgaW4gYW4gYXdrd2FyZCB3YXk6XG4gICAgICAgICAgICAgICAgICAgIC8vIGl0IHRvZ2dsZXMgdGhlIGVsZW1lbnQgY2hlY2tlZCBzdGF0ZSAqYWZ0ZXIqIHRoZSBjbGljayBldmVudCBoYW5kbGVycyBydW4sIHdoZXJlYXMgbmF0aXZlXG4gICAgICAgICAgICAgICAgICAgIC8vIGNsaWNrIGV2ZW50cyB0b2dnbGUgdGhlIGNoZWNrZWQgc3RhdGUgKmJlZm9yZSogdGhlIGV2ZW50IGhhbmRsZXIuXG4gICAgICAgICAgICAgICAgICAgIC8vIEZpeCB0aGlzIGJ5IGludGVjZXB0aW5nIHRoZSBoYW5kbGVyIGFuZCBhcHBseWluZyB0aGUgY29ycmVjdCBjaGVja2VkbmVzcyBiZWZvcmUgaXQgcnVucy5cbiAgICAgICAgICAgICAgICAgICAgdmFyIG9yaWdpbmFsSGFuZGxlciA9IGhhbmRsZXI7XG4gICAgICAgICAgICAgICAgICAgIGhhbmRsZXIgPSBmdW5jdGlvbihldmVudCwgZXZlbnREYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgalF1ZXJ5U3VwcGxpZWRDaGVja2VkU3RhdGUgPSB0aGlzLmNoZWNrZWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXZlbnREYXRhKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY2hlY2tlZCA9IGV2ZW50RGF0YS5jaGVja2VkU3RhdGVCZWZvcmVFdmVudCAhPT0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG9yaWdpbmFsSGFuZGxlci5jYWxsKHRoaXMsIGV2ZW50KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY2hlY2tlZCA9IGpRdWVyeVN1cHBsaWVkQ2hlY2tlZFN0YXRlOyAvLyBSZXN0b3JlIHRoZSBzdGF0ZSBqUXVlcnkgYXBwbGllZFxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBqUXVlcnkoZWxlbWVudClbJ2JpbmQnXShldmVudFR5cGUsIGhhbmRsZXIpO1xuICAgICAgICAgICAgfSBlbHNlIGlmICghbXVzdFVzZUF0dGFjaEV2ZW50ICYmIHR5cGVvZiBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIgPT0gXCJmdW5jdGlvblwiKVxuICAgICAgICAgICAgICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihldmVudFR5cGUsIGhhbmRsZXIsIGZhbHNlKTtcbiAgICAgICAgICAgIGVsc2UgaWYgKHR5cGVvZiBlbGVtZW50LmF0dGFjaEV2ZW50ICE9IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICAgICAgICB2YXIgYXR0YWNoRXZlbnRIYW5kbGVyID0gZnVuY3Rpb24gKGV2ZW50KSB7IGhhbmRsZXIuY2FsbChlbGVtZW50LCBldmVudCk7IH0sXG4gICAgICAgICAgICAgICAgICAgIGF0dGFjaEV2ZW50TmFtZSA9IFwib25cIiArIGV2ZW50VHlwZTtcbiAgICAgICAgICAgICAgICBlbGVtZW50LmF0dGFjaEV2ZW50KGF0dGFjaEV2ZW50TmFtZSwgYXR0YWNoRXZlbnRIYW5kbGVyKTtcblxuICAgICAgICAgICAgICAgIC8vIElFIGRvZXMgbm90IGRpc3Bvc2UgYXR0YWNoRXZlbnQgaGFuZGxlcnMgYXV0b21hdGljYWxseSAodW5saWtlIHdpdGggYWRkRXZlbnRMaXN0ZW5lcilcbiAgICAgICAgICAgICAgICAvLyBzbyB0byBhdm9pZCBsZWFrcywgd2UgaGF2ZSB0byByZW1vdmUgdGhlbSBtYW51YWxseS4gU2VlIGJ1ZyAjODU2XG4gICAgICAgICAgICAgICAga28udXRpbHMuZG9tTm9kZURpc3Bvc2FsLmFkZERpc3Bvc2VDYWxsYmFjayhlbGVtZW50LCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5kZXRhY2hFdmVudChhdHRhY2hFdmVudE5hbWUsIGF0dGFjaEV2ZW50SGFuZGxlcik7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGVsc2VcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJCcm93c2VyIGRvZXNuJ3Qgc3VwcG9ydCBhZGRFdmVudExpc3RlbmVyIG9yIGF0dGFjaEV2ZW50XCIpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHRyaWdnZXJFdmVudDogZnVuY3Rpb24gKGVsZW1lbnQsIGV2ZW50VHlwZSkge1xuICAgICAgICAgICAgaWYgKCEoZWxlbWVudCAmJiBlbGVtZW50Lm5vZGVUeXBlKSlcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJlbGVtZW50IG11c3QgYmUgYSBET00gbm9kZSB3aGVuIGNhbGxpbmcgdHJpZ2dlckV2ZW50XCIpO1xuXG4gICAgICAgICAgICBpZiAodHlwZW9mIGpRdWVyeSAhPSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgICAgICAgdmFyIGV2ZW50RGF0YSA9IFtdO1xuICAgICAgICAgICAgICAgIGlmIChpc0NsaWNrT25DaGVja2FibGVFbGVtZW50KGVsZW1lbnQsIGV2ZW50VHlwZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gV29yayBhcm91bmQgdGhlIGpRdWVyeSBcImNsaWNrIGV2ZW50cyBvbiBjaGVja2JveGVzXCIgaXNzdWUgZGVzY3JpYmVkIGFib3ZlIGJ5IHN0b3JpbmcgdGhlIG9yaWdpbmFsIGNoZWNrZWQgc3RhdGUgYmVmb3JlIHRyaWdnZXJpbmcgdGhlIGhhbmRsZXJcbiAgICAgICAgICAgICAgICAgICAgZXZlbnREYXRhLnB1c2goeyBjaGVja2VkU3RhdGVCZWZvcmVFdmVudDogZWxlbWVudC5jaGVja2VkIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBqUXVlcnkoZWxlbWVudClbJ3RyaWdnZXInXShldmVudFR5cGUsIGV2ZW50RGF0YSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBkb2N1bWVudC5jcmVhdGVFdmVudCA9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGVsZW1lbnQuZGlzcGF0Y2hFdmVudCA9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGV2ZW50Q2F0ZWdvcnkgPSBrbm93bkV2ZW50VHlwZXNCeUV2ZW50TmFtZVtldmVudFR5cGVdIHx8IFwiSFRNTEV2ZW50c1wiO1xuICAgICAgICAgICAgICAgICAgICB2YXIgZXZlbnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudChldmVudENhdGVnb3J5KTtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQuaW5pdEV2ZW50KGV2ZW50VHlwZSwgdHJ1ZSwgdHJ1ZSwgd2luZG93LCAwLCAwLCAwLCAwLCAwLCBmYWxzZSwgZmFsc2UsIGZhbHNlLCBmYWxzZSwgMCwgZWxlbWVudCk7XG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnQuZGlzcGF0Y2hFdmVudChldmVudCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVGhlIHN1cHBsaWVkIGVsZW1lbnQgZG9lc24ndCBzdXBwb3J0IGRpc3BhdGNoRXZlbnRcIik7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBlbGVtZW50LmZpcmVFdmVudCAhPSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgICAgICAgLy8gVW5saWtlIG90aGVyIGJyb3dzZXJzLCBJRSBkb2Vzbid0IGNoYW5nZSB0aGUgY2hlY2tlZCBzdGF0ZSBvZiBjaGVja2JveGVzL3JhZGlvYnV0dG9ucyB3aGVuIHlvdSB0cmlnZ2VyIHRoZWlyIFwiY2xpY2tcIiBldmVudFxuICAgICAgICAgICAgICAgIC8vIHNvIHRvIG1ha2UgaXQgY29uc2lzdGVudCwgd2UnbGwgZG8gaXQgbWFudWFsbHkgaGVyZVxuICAgICAgICAgICAgICAgIGlmIChpc0NsaWNrT25DaGVja2FibGVFbGVtZW50KGVsZW1lbnQsIGV2ZW50VHlwZSkpXG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnQuY2hlY2tlZCA9IGVsZW1lbnQuY2hlY2tlZCAhPT0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBlbGVtZW50LmZpcmVFdmVudChcIm9uXCIgKyBldmVudFR5cGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkJyb3dzZXIgZG9lc24ndCBzdXBwb3J0IHRyaWdnZXJpbmcgZXZlbnRzXCIpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHVud3JhcE9ic2VydmFibGU6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgcmV0dXJuIGtvLmlzT2JzZXJ2YWJsZSh2YWx1ZSkgPyB2YWx1ZSgpIDogdmFsdWU7XG4gICAgICAgIH0sXG5cbiAgICAgICAgcGVla09ic2VydmFibGU6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgcmV0dXJuIGtvLmlzT2JzZXJ2YWJsZSh2YWx1ZSkgPyB2YWx1ZS5wZWVrKCkgOiB2YWx1ZTtcbiAgICAgICAgfSxcblxuICAgICAgICB0b2dnbGVEb21Ob2RlQ3NzQ2xhc3M6IGZ1bmN0aW9uIChub2RlLCBjbGFzc05hbWVzLCBzaG91bGRIYXZlQ2xhc3MpIHtcbiAgICAgICAgICAgIGlmIChjbGFzc05hbWVzKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNzc0NsYXNzTmFtZVJlZ2V4ID0gL1xcUysvZyxcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudENsYXNzTmFtZXMgPSBub2RlLmNsYXNzTmFtZS5tYXRjaChjc3NDbGFzc05hbWVSZWdleCkgfHwgW107XG4gICAgICAgICAgICAgICAga28udXRpbHMuYXJyYXlGb3JFYWNoKGNsYXNzTmFtZXMubWF0Y2goY3NzQ2xhc3NOYW1lUmVnZXgpLCBmdW5jdGlvbihjbGFzc05hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAga28udXRpbHMuYWRkT3JSZW1vdmVJdGVtKGN1cnJlbnRDbGFzc05hbWVzLCBjbGFzc05hbWUsIHNob3VsZEhhdmVDbGFzcyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgbm9kZS5jbGFzc05hbWUgPSBjdXJyZW50Q2xhc3NOYW1lcy5qb2luKFwiIFwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBzZXRUZXh0Q29udGVudDogZnVuY3Rpb24oZWxlbWVudCwgdGV4dENvbnRlbnQpIHtcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IGtvLnV0aWxzLnVud3JhcE9ic2VydmFibGUodGV4dENvbnRlbnQpO1xuICAgICAgICAgICAgaWYgKCh2YWx1ZSA9PT0gbnVsbCkgfHwgKHZhbHVlID09PSB1bmRlZmluZWQpKVxuICAgICAgICAgICAgICAgIHZhbHVlID0gXCJcIjtcblxuICAgICAgICAgICAgLy8gV2UgbmVlZCB0aGVyZSB0byBiZSBleGFjdGx5IG9uZSBjaGlsZDogYSB0ZXh0IG5vZGUuXG4gICAgICAgICAgICAvLyBJZiB0aGVyZSBhcmUgbm8gY2hpbGRyZW4sIG1vcmUgdGhhbiBvbmUsIG9yIGlmIGl0J3Mgbm90IGEgdGV4dCBub2RlLFxuICAgICAgICAgICAgLy8gd2UnbGwgY2xlYXIgZXZlcnl0aGluZyBhbmQgY3JlYXRlIGEgc2luZ2xlIHRleHQgbm9kZS5cbiAgICAgICAgICAgIHZhciBpbm5lclRleHROb2RlID0ga28udmlydHVhbEVsZW1lbnRzLmZpcnN0Q2hpbGQoZWxlbWVudCk7XG4gICAgICAgICAgICBpZiAoIWlubmVyVGV4dE5vZGUgfHwgaW5uZXJUZXh0Tm9kZS5ub2RlVHlwZSAhPSAzIHx8IGtvLnZpcnR1YWxFbGVtZW50cy5uZXh0U2libGluZyhpbm5lclRleHROb2RlKSkge1xuICAgICAgICAgICAgICAgIGtvLnZpcnR1YWxFbGVtZW50cy5zZXREb21Ob2RlQ2hpbGRyZW4oZWxlbWVudCwgW2RvY3VtZW50LmNyZWF0ZVRleHROb2RlKHZhbHVlKV0pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpbm5lclRleHROb2RlLmRhdGEgPSB2YWx1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAga28udXRpbHMuZm9yY2VSZWZyZXNoKGVsZW1lbnQpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHNldEVsZW1lbnROYW1lOiBmdW5jdGlvbihlbGVtZW50LCBuYW1lKSB7XG4gICAgICAgICAgICBlbGVtZW50Lm5hbWUgPSBuYW1lO1xuXG4gICAgICAgICAgICAvLyBXb3JrYXJvdW5kIElFIDYvNyBpc3N1ZVxuICAgICAgICAgICAgLy8gLSBodHRwczovL2dpdGh1Yi5jb20vU3RldmVTYW5kZXJzb24va25vY2tvdXQvaXNzdWVzLzE5N1xuICAgICAgICAgICAgLy8gLSBodHRwOi8vd3d3Lm1hdHRzNDExLmNvbS9wb3N0L3NldHRpbmdfdGhlX25hbWVfYXR0cmlidXRlX2luX2llX2RvbS9cbiAgICAgICAgICAgIGlmIChpZVZlcnNpb24gPD0gNykge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnQubWVyZ2VBdHRyaWJ1dGVzKGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCI8aW5wdXQgbmFtZT0nXCIgKyBlbGVtZW50Lm5hbWUgKyBcIicvPlwiKSwgZmFsc2UpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjYXRjaChlKSB7fSAvLyBGb3IgSUU5IHdpdGggZG9jIG1vZGUgXCJJRTkgU3RhbmRhcmRzXCIgYW5kIGJyb3dzZXIgbW9kZSBcIklFOSBDb21wYXRpYmlsaXR5IFZpZXdcIlxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIGZvcmNlUmVmcmVzaDogZnVuY3Rpb24obm9kZSkge1xuICAgICAgICAgICAgLy8gV29ya2Fyb3VuZCBmb3IgYW4gSUU5IHJlbmRlcmluZyBidWcgLSBodHRwczovL2dpdGh1Yi5jb20vU3RldmVTYW5kZXJzb24va25vY2tvdXQvaXNzdWVzLzIwOVxuICAgICAgICAgICAgaWYgKGllVmVyc2lvbiA+PSA5KSB7XG4gICAgICAgICAgICAgICAgLy8gRm9yIHRleHQgbm9kZXMgYW5kIGNvbW1lbnQgbm9kZXMgKG1vc3QgbGlrZWx5IHZpcnR1YWwgZWxlbWVudHMpLCB3ZSB3aWxsIGhhdmUgdG8gcmVmcmVzaCB0aGUgY29udGFpbmVyXG4gICAgICAgICAgICAgICAgdmFyIGVsZW0gPSBub2RlLm5vZGVUeXBlID09IDEgPyBub2RlIDogbm9kZS5wYXJlbnROb2RlO1xuICAgICAgICAgICAgICAgIGlmIChlbGVtLnN0eWxlKVxuICAgICAgICAgICAgICAgICAgICBlbGVtLnN0eWxlLnpvb20gPSBlbGVtLnN0eWxlLnpvb207XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgZW5zdXJlU2VsZWN0RWxlbWVudElzUmVuZGVyZWRDb3JyZWN0bHk6IGZ1bmN0aW9uKHNlbGVjdEVsZW1lbnQpIHtcbiAgICAgICAgICAgIC8vIFdvcmthcm91bmQgZm9yIElFOSByZW5kZXJpbmcgYnVnIC0gaXQgZG9lc24ndCByZWxpYWJseSBkaXNwbGF5IGFsbCB0aGUgdGV4dCBpbiBkeW5hbWljYWxseS1hZGRlZCBzZWxlY3QgYm94ZXMgdW5sZXNzIHlvdSBmb3JjZSBpdCB0byByZS1yZW5kZXIgYnkgdXBkYXRpbmcgdGhlIHdpZHRoLlxuICAgICAgICAgICAgLy8gKFNlZSBodHRwczovL2dpdGh1Yi5jb20vU3RldmVTYW5kZXJzb24va25vY2tvdXQvaXNzdWVzLzMxMiwgaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy81OTA4NDk0L3NlbGVjdC1vbmx5LXNob3dzLWZpcnN0LWNoYXItb2Ytc2VsZWN0ZWQtb3B0aW9uKVxuICAgICAgICAgICAgLy8gQWxzbyBmaXhlcyBJRTcgYW5kIElFOCBidWcgdGhhdCBjYXVzZXMgc2VsZWN0cyB0byBiZSB6ZXJvIHdpZHRoIGlmIGVuY2xvc2VkIGJ5ICdpZicgb3IgJ3dpdGgnLiAoU2VlIGlzc3VlICM4MzkpXG4gICAgICAgICAgICBpZiAoaWVWZXJzaW9uKSB7XG4gICAgICAgICAgICAgICAgdmFyIG9yaWdpbmFsV2lkdGggPSBzZWxlY3RFbGVtZW50LnN0eWxlLndpZHRoO1xuICAgICAgICAgICAgICAgIHNlbGVjdEVsZW1lbnQuc3R5bGUud2lkdGggPSAwO1xuICAgICAgICAgICAgICAgIHNlbGVjdEVsZW1lbnQuc3R5bGUud2lkdGggPSBvcmlnaW5hbFdpZHRoO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIHJhbmdlOiBmdW5jdGlvbiAobWluLCBtYXgpIHtcbiAgICAgICAgICAgIG1pbiA9IGtvLnV0aWxzLnVud3JhcE9ic2VydmFibGUobWluKTtcbiAgICAgICAgICAgIG1heCA9IGtvLnV0aWxzLnVud3JhcE9ic2VydmFibGUobWF4KTtcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSBbXTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSBtaW47IGkgPD0gbWF4OyBpKyspXG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goaSk7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9LFxuXG4gICAgICAgIG1ha2VBcnJheTogZnVuY3Rpb24oYXJyYXlMaWtlT2JqZWN0KSB7XG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gW107XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgaiA9IGFycmF5TGlrZU9iamVjdC5sZW5ndGg7IGkgPCBqOyBpKyspIHtcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaChhcnJheUxpa2VPYmplY3RbaV0pO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH0sXG5cbiAgICAgICAgaXNJZTYgOiBpc0llNixcbiAgICAgICAgaXNJZTcgOiBpc0llNyxcbiAgICAgICAgaWVWZXJzaW9uIDogaWVWZXJzaW9uLFxuXG4gICAgICAgIGdldEZvcm1GaWVsZHM6IGZ1bmN0aW9uKGZvcm0sIGZpZWxkTmFtZSkge1xuICAgICAgICAgICAgdmFyIGZpZWxkcyA9IGtvLnV0aWxzLm1ha2VBcnJheShmb3JtLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiaW5wdXRcIikpLmNvbmNhdChrby51dGlscy5tYWtlQXJyYXkoZm9ybS5nZXRFbGVtZW50c0J5VGFnTmFtZShcInRleHRhcmVhXCIpKSk7XG4gICAgICAgICAgICB2YXIgaXNNYXRjaGluZ0ZpZWxkID0gKHR5cGVvZiBmaWVsZE5hbWUgPT0gJ3N0cmluZycpXG4gICAgICAgICAgICAgICAgPyBmdW5jdGlvbihmaWVsZCkgeyByZXR1cm4gZmllbGQubmFtZSA9PT0gZmllbGROYW1lIH1cbiAgICAgICAgICAgICAgICA6IGZ1bmN0aW9uKGZpZWxkKSB7IHJldHVybiBmaWVsZE5hbWUudGVzdChmaWVsZC5uYW1lKSB9OyAvLyBUcmVhdCBmaWVsZE5hbWUgYXMgcmVnZXggb3Igb2JqZWN0IGNvbnRhaW5pbmcgcHJlZGljYXRlXG4gICAgICAgICAgICB2YXIgbWF0Y2hlcyA9IFtdO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IGZpZWxkcy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICAgICAgICAgIGlmIChpc01hdGNoaW5nRmllbGQoZmllbGRzW2ldKSlcbiAgICAgICAgICAgICAgICAgICAgbWF0Y2hlcy5wdXNoKGZpZWxkc1tpXSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcmV0dXJuIG1hdGNoZXM7XG4gICAgICAgIH0sXG5cbiAgICAgICAgcGFyc2VKc29uOiBmdW5jdGlvbiAoanNvblN0cmluZykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBqc29uU3RyaW5nID09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgICAgICBqc29uU3RyaW5nID0ga28udXRpbHMuc3RyaW5nVHJpbShqc29uU3RyaW5nKTtcbiAgICAgICAgICAgICAgICBpZiAoanNvblN0cmluZykge1xuICAgICAgICAgICAgICAgICAgICBpZiAoSlNPTiAmJiBKU09OLnBhcnNlKSAvLyBVc2UgbmF0aXZlIHBhcnNpbmcgd2hlcmUgYXZhaWxhYmxlXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gSlNPTi5wYXJzZShqc29uU3RyaW5nKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIChuZXcgRnVuY3Rpb24oXCJyZXR1cm4gXCIgKyBqc29uU3RyaW5nKSkoKTsgLy8gRmFsbGJhY2sgb24gbGVzcyBzYWZlIHBhcnNpbmcgZm9yIG9sZGVyIGJyb3dzZXJzXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH0sXG5cbiAgICAgICAgc3RyaW5naWZ5SnNvbjogZnVuY3Rpb24gKGRhdGEsIHJlcGxhY2VyLCBzcGFjZSkgeyAgIC8vIHJlcGxhY2VyIGFuZCBzcGFjZSBhcmUgb3B0aW9uYWxcbiAgICAgICAgICAgIGlmICghSlNPTiB8fCAhSlNPTi5zdHJpbmdpZnkpXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgSlNPTi5zdHJpbmdpZnkoKS4gU29tZSBicm93c2VycyAoZS5nLiwgSUUgPCA4KSBkb24ndCBzdXBwb3J0IGl0IG5hdGl2ZWx5LCBidXQgeW91IGNhbiBvdmVyY29tZSB0aGlzIGJ5IGFkZGluZyBhIHNjcmlwdCByZWZlcmVuY2UgdG8ganNvbjIuanMsIGRvd25sb2FkYWJsZSBmcm9tIGh0dHA6Ly93d3cuanNvbi5vcmcvanNvbjIuanNcIik7XG4gICAgICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoa28udXRpbHMudW53cmFwT2JzZXJ2YWJsZShkYXRhKSwgcmVwbGFjZXIsIHNwYWNlKTtcbiAgICAgICAgfSxcblxuICAgICAgICBwb3N0SnNvbjogZnVuY3Rpb24gKHVybE9yRm9ybSwgZGF0YSwgb3B0aW9ucykge1xuICAgICAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgICAgICAgICB2YXIgcGFyYW1zID0gb3B0aW9uc1sncGFyYW1zJ10gfHwge307XG4gICAgICAgICAgICB2YXIgaW5jbHVkZUZpZWxkcyA9IG9wdGlvbnNbJ2luY2x1ZGVGaWVsZHMnXSB8fCB0aGlzLmZpZWxkc0luY2x1ZGVkV2l0aEpzb25Qb3N0O1xuICAgICAgICAgICAgdmFyIHVybCA9IHVybE9yRm9ybTtcblxuICAgICAgICAgICAgLy8gSWYgd2Ugd2VyZSBnaXZlbiBhIGZvcm0sIHVzZSBpdHMgJ2FjdGlvbicgVVJMIGFuZCBwaWNrIG91dCBhbnkgcmVxdWVzdGVkIGZpZWxkIHZhbHVlc1xuICAgICAgICAgICAgaWYoKHR5cGVvZiB1cmxPckZvcm0gPT0gJ29iamVjdCcpICYmIChrby51dGlscy50YWdOYW1lTG93ZXIodXJsT3JGb3JtKSA9PT0gXCJmb3JtXCIpKSB7XG4gICAgICAgICAgICAgICAgdmFyIG9yaWdpbmFsRm9ybSA9IHVybE9yRm9ybTtcbiAgICAgICAgICAgICAgICB1cmwgPSBvcmlnaW5hbEZvcm0uYWN0aW9uO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSBpbmNsdWRlRmllbGRzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBmaWVsZHMgPSBrby51dGlscy5nZXRGb3JtRmllbGRzKG9yaWdpbmFsRm9ybSwgaW5jbHVkZUZpZWxkc1tpXSk7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSBmaWVsZHMubGVuZ3RoIC0gMTsgaiA+PSAwOyBqLS0pXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXJhbXNbZmllbGRzW2pdLm5hbWVdID0gZmllbGRzW2pdLnZhbHVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZGF0YSA9IGtvLnV0aWxzLnVud3JhcE9ic2VydmFibGUoZGF0YSk7XG4gICAgICAgICAgICB2YXIgZm9ybSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJmb3JtXCIpO1xuICAgICAgICAgICAgZm9ybS5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgICAgICAgICBmb3JtLmFjdGlvbiA9IHVybDtcbiAgICAgICAgICAgIGZvcm0ubWV0aG9kID0gXCJwb3N0XCI7XG4gICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gZGF0YSkge1xuICAgICAgICAgICAgICAgIC8vIFNpbmNlICdkYXRhJyB0aGlzIGlzIGEgbW9kZWwgb2JqZWN0LCB3ZSBpbmNsdWRlIGFsbCBwcm9wZXJ0aWVzIGluY2x1ZGluZyB0aG9zZSBpbmhlcml0ZWQgZnJvbSBpdHMgcHJvdG90eXBlXG4gICAgICAgICAgICAgICAgdmFyIGlucHV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImlucHV0XCIpO1xuICAgICAgICAgICAgICAgIGlucHV0Lm5hbWUgPSBrZXk7XG4gICAgICAgICAgICAgICAgaW5wdXQudmFsdWUgPSBrby51dGlscy5zdHJpbmdpZnlKc29uKGtvLnV0aWxzLnVud3JhcE9ic2VydmFibGUoZGF0YVtrZXldKSk7XG4gICAgICAgICAgICAgICAgZm9ybS5hcHBlbmRDaGlsZChpbnB1dCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBvYmplY3RGb3JFYWNoKHBhcmFtcywgZnVuY3Rpb24oa2V5LCB2YWx1ZSkge1xuICAgICAgICAgICAgICAgIHZhciBpbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJpbnB1dFwiKTtcbiAgICAgICAgICAgICAgICBpbnB1dC5uYW1lID0ga2V5O1xuICAgICAgICAgICAgICAgIGlucHV0LnZhbHVlID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgZm9ybS5hcHBlbmRDaGlsZChpbnB1dCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoZm9ybSk7XG4gICAgICAgICAgICBvcHRpb25zWydzdWJtaXR0ZXInXSA/IG9wdGlvbnNbJ3N1Ym1pdHRlciddKGZvcm0pIDogZm9ybS5zdWJtaXQoKTtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkgeyBmb3JtLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoZm9ybSk7IH0sIDApO1xuICAgICAgICB9XG4gICAgfVxufSgpKTtcblxua28uZXhwb3J0U3ltYm9sKCd1dGlscycsIGtvLnV0aWxzKTtcbmtvLmV4cG9ydFN5bWJvbCgndXRpbHMuYXJyYXlGb3JFYWNoJywga28udXRpbHMuYXJyYXlGb3JFYWNoKTtcbmtvLmV4cG9ydFN5bWJvbCgndXRpbHMuYXJyYXlGaXJzdCcsIGtvLnV0aWxzLmFycmF5Rmlyc3QpO1xua28uZXhwb3J0U3ltYm9sKCd1dGlscy5hcnJheUZpbHRlcicsIGtvLnV0aWxzLmFycmF5RmlsdGVyKTtcbmtvLmV4cG9ydFN5bWJvbCgndXRpbHMuYXJyYXlHZXREaXN0aW5jdFZhbHVlcycsIGtvLnV0aWxzLmFycmF5R2V0RGlzdGluY3RWYWx1ZXMpO1xua28uZXhwb3J0U3ltYm9sKCd1dGlscy5hcnJheUluZGV4T2YnLCBrby51dGlscy5hcnJheUluZGV4T2YpO1xua28uZXhwb3J0U3ltYm9sKCd1dGlscy5hcnJheU1hcCcsIGtvLnV0aWxzLmFycmF5TWFwKTtcbmtvLmV4cG9ydFN5bWJvbCgndXRpbHMuYXJyYXlQdXNoQWxsJywga28udXRpbHMuYXJyYXlQdXNoQWxsKTtcbmtvLmV4cG9ydFN5bWJvbCgndXRpbHMuYXJyYXlSZW1vdmVJdGVtJywga28udXRpbHMuYXJyYXlSZW1vdmVJdGVtKTtcbmtvLmV4cG9ydFN5bWJvbCgndXRpbHMuZXh0ZW5kJywga28udXRpbHMuZXh0ZW5kKTtcbmtvLmV4cG9ydFN5bWJvbCgndXRpbHMuZmllbGRzSW5jbHVkZWRXaXRoSnNvblBvc3QnLCBrby51dGlscy5maWVsZHNJbmNsdWRlZFdpdGhKc29uUG9zdCk7XG5rby5leHBvcnRTeW1ib2woJ3V0aWxzLmdldEZvcm1GaWVsZHMnLCBrby51dGlscy5nZXRGb3JtRmllbGRzKTtcbmtvLmV4cG9ydFN5bWJvbCgndXRpbHMucGVla09ic2VydmFibGUnLCBrby51dGlscy5wZWVrT2JzZXJ2YWJsZSk7XG5rby5leHBvcnRTeW1ib2woJ3V0aWxzLnBvc3RKc29uJywga28udXRpbHMucG9zdEpzb24pO1xua28uZXhwb3J0U3ltYm9sKCd1dGlscy5wYXJzZUpzb24nLCBrby51dGlscy5wYXJzZUpzb24pO1xua28uZXhwb3J0U3ltYm9sKCd1dGlscy5yZWdpc3RlckV2ZW50SGFuZGxlcicsIGtvLnV0aWxzLnJlZ2lzdGVyRXZlbnRIYW5kbGVyKTtcbmtvLmV4cG9ydFN5bWJvbCgndXRpbHMuc3RyaW5naWZ5SnNvbicsIGtvLnV0aWxzLnN0cmluZ2lmeUpzb24pO1xua28uZXhwb3J0U3ltYm9sKCd1dGlscy5yYW5nZScsIGtvLnV0aWxzLnJhbmdlKTtcbmtvLmV4cG9ydFN5bWJvbCgndXRpbHMudG9nZ2xlRG9tTm9kZUNzc0NsYXNzJywga28udXRpbHMudG9nZ2xlRG9tTm9kZUNzc0NsYXNzKTtcbmtvLmV4cG9ydFN5bWJvbCgndXRpbHMudHJpZ2dlckV2ZW50Jywga28udXRpbHMudHJpZ2dlckV2ZW50KTtcbmtvLmV4cG9ydFN5bWJvbCgndXRpbHMudW53cmFwT2JzZXJ2YWJsZScsIGtvLnV0aWxzLnVud3JhcE9ic2VydmFibGUpO1xua28uZXhwb3J0U3ltYm9sKCd1dGlscy5vYmplY3RGb3JFYWNoJywga28udXRpbHMub2JqZWN0Rm9yRWFjaCk7XG5rby5leHBvcnRTeW1ib2woJ3V0aWxzLmFkZE9yUmVtb3ZlSXRlbScsIGtvLnV0aWxzLmFkZE9yUmVtb3ZlSXRlbSk7XG5rby5leHBvcnRTeW1ib2woJ3Vud3JhcCcsIGtvLnV0aWxzLnVud3JhcE9ic2VydmFibGUpOyAvLyBDb252ZW5pZW50IHNob3J0aGFuZCwgYmVjYXVzZSB0aGlzIGlzIHVzZWQgc28gY29tbW9ubHlcblxuaWYgKCFGdW5jdGlvbi5wcm90b3R5cGVbJ2JpbmQnXSkge1xuICAgIC8vIEZ1bmN0aW9uLnByb3RvdHlwZS5iaW5kIGlzIGEgc3RhbmRhcmQgcGFydCBvZiBFQ01BU2NyaXB0IDV0aCBFZGl0aW9uIChEZWNlbWJlciAyMDA5LCBodHRwOi8vd3d3LmVjbWEtaW50ZXJuYXRpb25hbC5vcmcvcHVibGljYXRpb25zL2ZpbGVzL0VDTUEtU1QvRUNNQS0yNjIucGRmKVxuICAgIC8vIEluIGNhc2UgdGhlIGJyb3dzZXIgZG9lc24ndCBpbXBsZW1lbnQgaXQgbmF0aXZlbHksIHByb3ZpZGUgYSBKYXZhU2NyaXB0IGltcGxlbWVudGF0aW9uLiBUaGlzIGltcGxlbWVudGF0aW9uIGlzIGJhc2VkIG9uIHRoZSBvbmUgaW4gcHJvdG90eXBlLmpzXG4gICAgRnVuY3Rpb24ucHJvdG90eXBlWydiaW5kJ10gPSBmdW5jdGlvbiAob2JqZWN0KSB7XG4gICAgICAgIHZhciBvcmlnaW5hbEZ1bmN0aW9uID0gdGhpcywgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cyksIG9iamVjdCA9IGFyZ3Muc2hpZnQoKTtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBvcmlnaW5hbEZ1bmN0aW9uLmFwcGx5KG9iamVjdCwgYXJncy5jb25jYXQoQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKSkpO1xuICAgICAgICB9O1xuICAgIH07XG59XG5cbmtvLnV0aWxzLmRvbURhdGEgPSBuZXcgKGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgdW5pcXVlSWQgPSAwO1xuICAgIHZhciBkYXRhU3RvcmVLZXlFeHBhbmRvUHJvcGVydHlOYW1lID0gXCJfX2tvX19cIiArIChuZXcgRGF0ZSkuZ2V0VGltZSgpO1xuICAgIHZhciBkYXRhU3RvcmUgPSB7fTtcbiAgICByZXR1cm4ge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uIChub2RlLCBrZXkpIHtcbiAgICAgICAgICAgIHZhciBhbGxEYXRhRm9yTm9kZSA9IGtvLnV0aWxzLmRvbURhdGEuZ2V0QWxsKG5vZGUsIGZhbHNlKTtcbiAgICAgICAgICAgIHJldHVybiBhbGxEYXRhRm9yTm9kZSA9PT0gdW5kZWZpbmVkID8gdW5kZWZpbmVkIDogYWxsRGF0YUZvck5vZGVba2V5XTtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiAobm9kZSwga2V5LCB2YWx1ZSkge1xuICAgICAgICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAvLyBNYWtlIHN1cmUgd2UgZG9uJ3QgYWN0dWFsbHkgY3JlYXRlIGEgbmV3IGRvbURhdGEga2V5IGlmIHdlIGFyZSBhY3R1YWxseSBkZWxldGluZyBhIHZhbHVlXG4gICAgICAgICAgICAgICAgaWYgKGtvLnV0aWxzLmRvbURhdGEuZ2V0QWxsKG5vZGUsIGZhbHNlKSA9PT0gdW5kZWZpbmVkKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgYWxsRGF0YUZvck5vZGUgPSBrby51dGlscy5kb21EYXRhLmdldEFsbChub2RlLCB0cnVlKTtcbiAgICAgICAgICAgIGFsbERhdGFGb3JOb2RlW2tleV0gPSB2YWx1ZTtcbiAgICAgICAgfSxcbiAgICAgICAgZ2V0QWxsOiBmdW5jdGlvbiAobm9kZSwgY3JlYXRlSWZOb3RGb3VuZCkge1xuICAgICAgICAgICAgdmFyIGRhdGFTdG9yZUtleSA9IG5vZGVbZGF0YVN0b3JlS2V5RXhwYW5kb1Byb3BlcnR5TmFtZV07XG4gICAgICAgICAgICB2YXIgaGFzRXhpc3RpbmdEYXRhU3RvcmUgPSBkYXRhU3RvcmVLZXkgJiYgKGRhdGFTdG9yZUtleSAhPT0gXCJudWxsXCIpICYmIGRhdGFTdG9yZVtkYXRhU3RvcmVLZXldO1xuICAgICAgICAgICAgaWYgKCFoYXNFeGlzdGluZ0RhdGFTdG9yZSkge1xuICAgICAgICAgICAgICAgIGlmICghY3JlYXRlSWZOb3RGb3VuZClcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICBkYXRhU3RvcmVLZXkgPSBub2RlW2RhdGFTdG9yZUtleUV4cGFuZG9Qcm9wZXJ0eU5hbWVdID0gXCJrb1wiICsgdW5pcXVlSWQrKztcbiAgICAgICAgICAgICAgICBkYXRhU3RvcmVbZGF0YVN0b3JlS2V5XSA9IHt9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGRhdGFTdG9yZVtkYXRhU3RvcmVLZXldO1xuICAgICAgICB9LFxuICAgICAgICBjbGVhcjogZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAgICAgICAgIHZhciBkYXRhU3RvcmVLZXkgPSBub2RlW2RhdGFTdG9yZUtleUV4cGFuZG9Qcm9wZXJ0eU5hbWVdO1xuICAgICAgICAgICAgaWYgKGRhdGFTdG9yZUtleSkge1xuICAgICAgICAgICAgICAgIGRlbGV0ZSBkYXRhU3RvcmVbZGF0YVN0b3JlS2V5XTtcbiAgICAgICAgICAgICAgICBub2RlW2RhdGFTdG9yZUtleUV4cGFuZG9Qcm9wZXJ0eU5hbWVdID0gbnVsbDtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTsgLy8gRXhwb3NpbmcgXCJkaWQgY2xlYW5cIiBmbGFnIHB1cmVseSBzbyBzcGVjcyBjYW4gaW5mZXIgd2hldGhlciB0aGluZ3MgaGF2ZSBiZWVuIGNsZWFuZWQgdXAgYXMgaW50ZW5kZWRcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cbn0pKCk7XG5cbmtvLmV4cG9ydFN5bWJvbCgndXRpbHMuZG9tRGF0YScsIGtvLnV0aWxzLmRvbURhdGEpO1xua28uZXhwb3J0U3ltYm9sKCd1dGlscy5kb21EYXRhLmNsZWFyJywga28udXRpbHMuZG9tRGF0YS5jbGVhcik7IC8vIEV4cG9ydGluZyBvbmx5IHNvIHNwZWNzIGNhbiBjbGVhciB1cCBhZnRlciB0aGVtc2VsdmVzIGZ1bGx5XG5cbmtvLnV0aWxzLmRvbU5vZGVEaXNwb3NhbCA9IG5ldyAoZnVuY3Rpb24gKCkge1xuICAgIHZhciBkb21EYXRhS2V5ID0gXCJfX2tvX2RvbU5vZGVEaXNwb3NhbF9fXCIgKyAobmV3IERhdGUpLmdldFRpbWUoKTtcbiAgICB2YXIgY2xlYW5hYmxlTm9kZVR5cGVzID0geyAxOiB0cnVlLCA4OiB0cnVlLCA5OiB0cnVlIH07ICAgICAgIC8vIEVsZW1lbnQsIENvbW1lbnQsIERvY3VtZW50XG4gICAgdmFyIGNsZWFuYWJsZU5vZGVUeXBlc1dpdGhEZXNjZW5kYW50cyA9IHsgMTogdHJ1ZSwgOTogdHJ1ZSB9OyAvLyBFbGVtZW50LCBEb2N1bWVudFxuXG4gICAgZnVuY3Rpb24gZ2V0RGlzcG9zZUNhbGxiYWNrc0NvbGxlY3Rpb24obm9kZSwgY3JlYXRlSWZOb3RGb3VuZCkge1xuICAgICAgICB2YXIgYWxsRGlzcG9zZUNhbGxiYWNrcyA9IGtvLnV0aWxzLmRvbURhdGEuZ2V0KG5vZGUsIGRvbURhdGFLZXkpO1xuICAgICAgICBpZiAoKGFsbERpc3Bvc2VDYWxsYmFja3MgPT09IHVuZGVmaW5lZCkgJiYgY3JlYXRlSWZOb3RGb3VuZCkge1xuICAgICAgICAgICAgYWxsRGlzcG9zZUNhbGxiYWNrcyA9IFtdO1xuICAgICAgICAgICAga28udXRpbHMuZG9tRGF0YS5zZXQobm9kZSwgZG9tRGF0YUtleSwgYWxsRGlzcG9zZUNhbGxiYWNrcyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGFsbERpc3Bvc2VDYWxsYmFja3M7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGRlc3Ryb3lDYWxsYmFja3NDb2xsZWN0aW9uKG5vZGUpIHtcbiAgICAgICAga28udXRpbHMuZG9tRGF0YS5zZXQobm9kZSwgZG9tRGF0YUtleSwgdW5kZWZpbmVkKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjbGVhblNpbmdsZU5vZGUobm9kZSkge1xuICAgICAgICAvLyBSdW4gYWxsIHRoZSBkaXNwb3NlIGNhbGxiYWNrc1xuICAgICAgICB2YXIgY2FsbGJhY2tzID0gZ2V0RGlzcG9zZUNhbGxiYWNrc0NvbGxlY3Rpb24obm9kZSwgZmFsc2UpO1xuICAgICAgICBpZiAoY2FsbGJhY2tzKSB7XG4gICAgICAgICAgICBjYWxsYmFja3MgPSBjYWxsYmFja3Muc2xpY2UoMCk7IC8vIENsb25lLCBhcyB0aGUgYXJyYXkgbWF5IGJlIG1vZGlmaWVkIGR1cmluZyBpdGVyYXRpb24gKHR5cGljYWxseSwgY2FsbGJhY2tzIHdpbGwgcmVtb3ZlIHRoZW1zZWx2ZXMpXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNhbGxiYWNrcy5sZW5ndGg7IGkrKylcbiAgICAgICAgICAgICAgICBjYWxsYmFja3NbaV0obm9kZSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBBbHNvIGVyYXNlIHRoZSBET00gZGF0YVxuICAgICAgICBrby51dGlscy5kb21EYXRhLmNsZWFyKG5vZGUpO1xuXG4gICAgICAgIC8vIFNwZWNpYWwgc3VwcG9ydCBmb3IgalF1ZXJ5IGhlcmUgYmVjYXVzZSBpdCdzIHNvIGNvbW1vbmx5IHVzZWQuXG4gICAgICAgIC8vIE1hbnkgalF1ZXJ5IHBsdWdpbnMgKGluY2x1ZGluZyBqcXVlcnkudG1wbCkgc3RvcmUgZGF0YSB1c2luZyBqUXVlcnkncyBlcXVpdmFsZW50IG9mIGRvbURhdGFcbiAgICAgICAgLy8gc28gbm90aWZ5IGl0IHRvIHRlYXIgZG93biBhbnkgcmVzb3VyY2VzIGFzc29jaWF0ZWQgd2l0aCB0aGUgbm9kZSAmIGRlc2NlbmRhbnRzIGhlcmUuXG4gICAgICAgIGlmICgodHlwZW9mIGpRdWVyeSA9PSBcImZ1bmN0aW9uXCIpICYmICh0eXBlb2YgalF1ZXJ5WydjbGVhbkRhdGEnXSA9PSBcImZ1bmN0aW9uXCIpKVxuICAgICAgICAgICAgalF1ZXJ5WydjbGVhbkRhdGEnXShbbm9kZV0pO1xuXG4gICAgICAgIC8vIEFsc28gY2xlYXIgYW55IGltbWVkaWF0ZS1jaGlsZCBjb21tZW50IG5vZGVzLCBhcyB0aGVzZSB3b3VsZG4ndCBoYXZlIGJlZW4gZm91bmQgYnlcbiAgICAgICAgLy8gbm9kZS5nZXRFbGVtZW50c0J5VGFnTmFtZShcIipcIikgaW4gY2xlYW5Ob2RlKCkgKGNvbW1lbnQgbm9kZXMgYXJlbid0IGVsZW1lbnRzKVxuICAgICAgICBpZiAoY2xlYW5hYmxlTm9kZVR5cGVzV2l0aERlc2NlbmRhbnRzW25vZGUubm9kZVR5cGVdKVxuICAgICAgICAgICAgY2xlYW5JbW1lZGlhdGVDb21tZW50VHlwZUNoaWxkcmVuKG5vZGUpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNsZWFuSW1tZWRpYXRlQ29tbWVudFR5cGVDaGlsZHJlbihub2RlV2l0aENoaWxkcmVuKSB7XG4gICAgICAgIHZhciBjaGlsZCwgbmV4dENoaWxkID0gbm9kZVdpdGhDaGlsZHJlbi5maXJzdENoaWxkO1xuICAgICAgICB3aGlsZSAoY2hpbGQgPSBuZXh0Q2hpbGQpIHtcbiAgICAgICAgICAgIG5leHRDaGlsZCA9IGNoaWxkLm5leHRTaWJsaW5nO1xuICAgICAgICAgICAgaWYgKGNoaWxkLm5vZGVUeXBlID09PSA4KVxuICAgICAgICAgICAgICAgIGNsZWFuU2luZ2xlTm9kZShjaGlsZCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBhZGREaXNwb3NlQ2FsbGJhY2sgOiBmdW5jdGlvbihub2RlLCBjYWxsYmFjaykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBjYWxsYmFjayAhPSBcImZ1bmN0aW9uXCIpXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ2FsbGJhY2sgbXVzdCBiZSBhIGZ1bmN0aW9uXCIpO1xuICAgICAgICAgICAgZ2V0RGlzcG9zZUNhbGxiYWNrc0NvbGxlY3Rpb24obm9kZSwgdHJ1ZSkucHVzaChjYWxsYmFjayk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgcmVtb3ZlRGlzcG9zZUNhbGxiYWNrIDogZnVuY3Rpb24obm9kZSwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgIHZhciBjYWxsYmFja3NDb2xsZWN0aW9uID0gZ2V0RGlzcG9zZUNhbGxiYWNrc0NvbGxlY3Rpb24obm9kZSwgZmFsc2UpO1xuICAgICAgICAgICAgaWYgKGNhbGxiYWNrc0NvbGxlY3Rpb24pIHtcbiAgICAgICAgICAgICAgICBrby51dGlscy5hcnJheVJlbW92ZUl0ZW0oY2FsbGJhY2tzQ29sbGVjdGlvbiwgY2FsbGJhY2spO1xuICAgICAgICAgICAgICAgIGlmIChjYWxsYmFja3NDb2xsZWN0aW9uLmxlbmd0aCA9PSAwKVxuICAgICAgICAgICAgICAgICAgICBkZXN0cm95Q2FsbGJhY2tzQ29sbGVjdGlvbihub2RlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBjbGVhbk5vZGUgOiBmdW5jdGlvbihub2RlKSB7XG4gICAgICAgICAgICAvLyBGaXJzdCBjbGVhbiB0aGlzIG5vZGUsIHdoZXJlIGFwcGxpY2FibGVcbiAgICAgICAgICAgIGlmIChjbGVhbmFibGVOb2RlVHlwZXNbbm9kZS5ub2RlVHlwZV0pIHtcbiAgICAgICAgICAgICAgICBjbGVhblNpbmdsZU5vZGUobm9kZSk7XG5cbiAgICAgICAgICAgICAgICAvLyAuLi4gdGhlbiBpdHMgZGVzY2VuZGFudHMsIHdoZXJlIGFwcGxpY2FibGVcbiAgICAgICAgICAgICAgICBpZiAoY2xlYW5hYmxlTm9kZVR5cGVzV2l0aERlc2NlbmRhbnRzW25vZGUubm9kZVR5cGVdKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIENsb25lIHRoZSBkZXNjZW5kYW50cyBsaXN0IGluIGNhc2UgaXQgY2hhbmdlcyBkdXJpbmcgaXRlcmF0aW9uXG4gICAgICAgICAgICAgICAgICAgIHZhciBkZXNjZW5kYW50cyA9IFtdO1xuICAgICAgICAgICAgICAgICAgICBrby51dGlscy5hcnJheVB1c2hBbGwoZGVzY2VuZGFudHMsIG5vZGUuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCIqXCIpKTtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGogPSBkZXNjZW5kYW50cy5sZW5ndGg7IGkgPCBqOyBpKyspXG4gICAgICAgICAgICAgICAgICAgICAgICBjbGVhblNpbmdsZU5vZGUoZGVzY2VuZGFudHNbaV0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBub2RlO1xuICAgICAgICB9LFxuXG4gICAgICAgIHJlbW92ZU5vZGUgOiBmdW5jdGlvbihub2RlKSB7XG4gICAgICAgICAgICBrby5jbGVhbk5vZGUobm9kZSk7XG4gICAgICAgICAgICBpZiAobm9kZS5wYXJlbnROb2RlKVxuICAgICAgICAgICAgICAgIG5vZGUucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChub2RlKTtcbiAgICAgICAgfVxuICAgIH1cbn0pKCk7XG5rby5jbGVhbk5vZGUgPSBrby51dGlscy5kb21Ob2RlRGlzcG9zYWwuY2xlYW5Ob2RlOyAvLyBTaG9ydGhhbmQgbmFtZSBmb3IgY29udmVuaWVuY2VcbmtvLnJlbW92ZU5vZGUgPSBrby51dGlscy5kb21Ob2RlRGlzcG9zYWwucmVtb3ZlTm9kZTsgLy8gU2hvcnRoYW5kIG5hbWUgZm9yIGNvbnZlbmllbmNlXG5rby5leHBvcnRTeW1ib2woJ2NsZWFuTm9kZScsIGtvLmNsZWFuTm9kZSk7XG5rby5leHBvcnRTeW1ib2woJ3JlbW92ZU5vZGUnLCBrby5yZW1vdmVOb2RlKTtcbmtvLmV4cG9ydFN5bWJvbCgndXRpbHMuZG9tTm9kZURpc3Bvc2FsJywga28udXRpbHMuZG9tTm9kZURpc3Bvc2FsKTtcbmtvLmV4cG9ydFN5bWJvbCgndXRpbHMuZG9tTm9kZURpc3Bvc2FsLmFkZERpc3Bvc2VDYWxsYmFjaycsIGtvLnV0aWxzLmRvbU5vZGVEaXNwb3NhbC5hZGREaXNwb3NlQ2FsbGJhY2spO1xua28uZXhwb3J0U3ltYm9sKCd1dGlscy5kb21Ob2RlRGlzcG9zYWwucmVtb3ZlRGlzcG9zZUNhbGxiYWNrJywga28udXRpbHMuZG9tTm9kZURpc3Bvc2FsLnJlbW92ZURpc3Bvc2VDYWxsYmFjayk7XG4oZnVuY3Rpb24gKCkge1xuICAgIHZhciBsZWFkaW5nQ29tbWVudFJlZ2V4ID0gL14oXFxzKik8IS0tKC4qPyktLT4vO1xuXG4gICAgZnVuY3Rpb24gc2ltcGxlSHRtbFBhcnNlKGh0bWwpIHtcbiAgICAgICAgLy8gQmFzZWQgb24galF1ZXJ5J3MgXCJjbGVhblwiIGZ1bmN0aW9uLCBidXQgb25seSBhY2NvdW50aW5nIGZvciB0YWJsZS1yZWxhdGVkIGVsZW1lbnRzLlxuICAgICAgICAvLyBJZiB5b3UgaGF2ZSByZWZlcmVuY2VkIGpRdWVyeSwgdGhpcyB3b24ndCBiZSB1c2VkIGFueXdheSAtIEtPIHdpbGwgdXNlIGpRdWVyeSdzIFwiY2xlYW5cIiBmdW5jdGlvbiBkaXJlY3RseVxuXG4gICAgICAgIC8vIE5vdGUgdGhhdCB0aGVyZSdzIHN0aWxsIGFuIGlzc3VlIGluIElFIDwgOSB3aGVyZWJ5IGl0IHdpbGwgZGlzY2FyZCBjb21tZW50IG5vZGVzIHRoYXQgYXJlIHRoZSBmaXJzdCBjaGlsZCBvZlxuICAgICAgICAvLyBhIGRlc2NlbmRhbnQgbm9kZS4gRm9yIGV4YW1wbGU6IFwiPGRpdj48IS0tIG15Y29tbWVudCAtLT5hYmM8L2Rpdj5cIiB3aWxsIGdldCBwYXJzZWQgYXMgXCI8ZGl2PmFiYzwvZGl2PlwiXG4gICAgICAgIC8vIFRoaXMgd29uJ3QgYWZmZWN0IGFueW9uZSB3aG8gaGFzIHJlZmVyZW5jZWQgalF1ZXJ5LCBhbmQgdGhlcmUncyBhbHdheXMgdGhlIHdvcmthcm91bmQgb2YgaW5zZXJ0aW5nIGEgZHVtbXkgbm9kZVxuICAgICAgICAvLyAocG9zc2libHkgYSB0ZXh0IG5vZGUpIGluIGZyb250IG9mIHRoZSBjb21tZW50LiBTbywgS08gZG9lcyBub3QgYXR0ZW1wdCB0byB3b3JrYXJvdW5kIHRoaXMgSUUgaXNzdWUgYXV0b21hdGljYWxseSBhdCBwcmVzZW50LlxuXG4gICAgICAgIC8vIFRyaW0gd2hpdGVzcGFjZSwgb3RoZXJ3aXNlIGluZGV4T2Ygd29uJ3Qgd29yayBhcyBleHBlY3RlZFxuICAgICAgICB2YXIgdGFncyA9IGtvLnV0aWxzLnN0cmluZ1RyaW0oaHRtbCkudG9Mb3dlckNhc2UoKSwgZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcblxuICAgICAgICAvLyBGaW5kcyB0aGUgZmlyc3QgbWF0Y2ggZnJvbSB0aGUgbGVmdCBjb2x1bW4sIGFuZCByZXR1cm5zIHRoZSBjb3JyZXNwb25kaW5nIFwid3JhcFwiIGRhdGEgZnJvbSB0aGUgcmlnaHQgY29sdW1uXG4gICAgICAgIHZhciB3cmFwID0gdGFncy5tYXRjaCgvXjwodGhlYWR8dGJvZHl8dGZvb3QpLykgICAgICAgICAgICAgICYmIFsxLCBcIjx0YWJsZT5cIiwgXCI8L3RhYmxlPlwiXSB8fFxuICAgICAgICAgICAgICAgICAgICF0YWdzLmluZGV4T2YoXCI8dHJcIikgICAgICAgICAgICAgICAgICAgICAgICAgICAgICYmIFsyLCBcIjx0YWJsZT48dGJvZHk+XCIsIFwiPC90Ym9keT48L3RhYmxlPlwiXSB8fFxuICAgICAgICAgICAgICAgICAgICghdGFncy5pbmRleE9mKFwiPHRkXCIpIHx8ICF0YWdzLmluZGV4T2YoXCI8dGhcIikpICAgJiYgWzMsIFwiPHRhYmxlPjx0Ym9keT48dHI+XCIsIFwiPC90cj48L3Rib2R5PjwvdGFibGU+XCJdIHx8XG4gICAgICAgICAgICAgICAgICAgLyogYW55dGhpbmcgZWxzZSAqLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFswLCBcIlwiLCBcIlwiXTtcblxuICAgICAgICAvLyBHbyB0byBodG1sIGFuZCBiYWNrLCB0aGVuIHBlZWwgb2ZmIGV4dHJhIHdyYXBwZXJzXG4gICAgICAgIC8vIE5vdGUgdGhhdCB3ZSBhbHdheXMgcHJlZml4IHdpdGggc29tZSBkdW1teSB0ZXh0LCBiZWNhdXNlIG90aGVyd2lzZSwgSUU8OSB3aWxsIHN0cmlwIG91dCBsZWFkaW5nIGNvbW1lbnQgbm9kZXMgaW4gZGVzY2VuZGFudHMuIFRvdGFsIG1hZG5lc3MuXG4gICAgICAgIHZhciBtYXJrdXAgPSBcImlnbm9yZWQ8ZGl2PlwiICsgd3JhcFsxXSArIGh0bWwgKyB3cmFwWzJdICsgXCI8L2Rpdj5cIjtcbiAgICAgICAgaWYgKHR5cGVvZiB3aW5kb3dbJ2lubmVyU2hpdiddID09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgZGl2LmFwcGVuZENoaWxkKHdpbmRvd1snaW5uZXJTaGl2J10obWFya3VwKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBkaXYuaW5uZXJIVE1MID0gbWFya3VwO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gTW92ZSB0byB0aGUgcmlnaHQgZGVwdGhcbiAgICAgICAgd2hpbGUgKHdyYXBbMF0tLSlcbiAgICAgICAgICAgIGRpdiA9IGRpdi5sYXN0Q2hpbGQ7XG5cbiAgICAgICAgcmV0dXJuIGtvLnV0aWxzLm1ha2VBcnJheShkaXYubGFzdENoaWxkLmNoaWxkTm9kZXMpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGpRdWVyeUh0bWxQYXJzZShodG1sKSB7XG4gICAgICAgIC8vIGpRdWVyeSdzIFwicGFyc2VIVE1MXCIgZnVuY3Rpb24gd2FzIGludHJvZHVjZWQgaW4galF1ZXJ5IDEuOC4wIGFuZCBpcyBhIGRvY3VtZW50ZWQgcHVibGljIEFQSS5cbiAgICAgICAgaWYgKGpRdWVyeVsncGFyc2VIVE1MJ10pIHtcbiAgICAgICAgICAgIHJldHVybiBqUXVlcnlbJ3BhcnNlSFRNTCddKGh0bWwpIHx8IFtdOyAvLyBFbnN1cmUgd2UgYWx3YXlzIHJldHVybiBhbiBhcnJheSBhbmQgbmV2ZXIgbnVsbFxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gRm9yIGpRdWVyeSA8IDEuOC4wLCB3ZSBmYWxsIGJhY2sgb24gdGhlIHVuZG9jdW1lbnRlZCBpbnRlcm5hbCBcImNsZWFuXCIgZnVuY3Rpb24uXG4gICAgICAgICAgICB2YXIgZWxlbXMgPSBqUXVlcnlbJ2NsZWFuJ10oW2h0bWxdKTtcblxuICAgICAgICAgICAgLy8gQXMgb2YgalF1ZXJ5IDEuNy4xLCBqUXVlcnkgcGFyc2VzIHRoZSBIVE1MIGJ5IGFwcGVuZGluZyBpdCB0byBzb21lIGR1bW15IHBhcmVudCBub2RlcyBoZWxkIGluIGFuIGluLW1lbW9yeSBkb2N1bWVudCBmcmFnbWVudC5cbiAgICAgICAgICAgIC8vIFVuZm9ydHVuYXRlbHksIGl0IG5ldmVyIGNsZWFycyB0aGUgZHVtbXkgcGFyZW50IG5vZGVzIGZyb20gdGhlIGRvY3VtZW50IGZyYWdtZW50LCBzbyBpdCBsZWFrcyBtZW1vcnkgb3ZlciB0aW1lLlxuICAgICAgICAgICAgLy8gRml4IHRoaXMgYnkgZmluZGluZyB0aGUgdG9wLW1vc3QgZHVtbXkgcGFyZW50IGVsZW1lbnQsIGFuZCBkZXRhY2hpbmcgaXQgZnJvbSBpdHMgb3duZXIgZnJhZ21lbnQuXG4gICAgICAgICAgICBpZiAoZWxlbXMgJiYgZWxlbXNbMF0pIHtcbiAgICAgICAgICAgICAgICAvLyBGaW5kIHRoZSB0b3AtbW9zdCBwYXJlbnQgZWxlbWVudCB0aGF0J3MgYSBkaXJlY3QgY2hpbGQgb2YgYSBkb2N1bWVudCBmcmFnbWVudFxuICAgICAgICAgICAgICAgIHZhciBlbGVtID0gZWxlbXNbMF07XG4gICAgICAgICAgICAgICAgd2hpbGUgKGVsZW0ucGFyZW50Tm9kZSAmJiBlbGVtLnBhcmVudE5vZGUubm9kZVR5cGUgIT09IDExIC8qIGkuZS4sIERvY3VtZW50RnJhZ21lbnQgKi8pXG4gICAgICAgICAgICAgICAgICAgIGVsZW0gPSBlbGVtLnBhcmVudE5vZGU7XG4gICAgICAgICAgICAgICAgLy8gLi4uIHRoZW4gZGV0YWNoIGl0XG4gICAgICAgICAgICAgICAgaWYgKGVsZW0ucGFyZW50Tm9kZSlcbiAgICAgICAgICAgICAgICAgICAgZWxlbS5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGVsZW0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gZWxlbXM7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBrby51dGlscy5wYXJzZUh0bWxGcmFnbWVudCA9IGZ1bmN0aW9uKGh0bWwpIHtcbiAgICAgICAgcmV0dXJuIHR5cGVvZiBqUXVlcnkgIT0gJ3VuZGVmaW5lZCcgPyBqUXVlcnlIdG1sUGFyc2UoaHRtbCkgICAvLyBBcyBiZWxvdywgYmVuZWZpdCBmcm9tIGpRdWVyeSdzIG9wdGltaXNhdGlvbnMgd2hlcmUgcG9zc2libGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBzaW1wbGVIdG1sUGFyc2UoaHRtbCk7ICAvLyAuLi4gb3RoZXJ3aXNlLCB0aGlzIHNpbXBsZSBsb2dpYyB3aWxsIGRvIGluIG1vc3QgY29tbW9uIGNhc2VzLlxuICAgIH07XG5cbiAgICBrby51dGlscy5zZXRIdG1sID0gZnVuY3Rpb24obm9kZSwgaHRtbCkge1xuICAgICAgICBrby51dGlscy5lbXB0eURvbU5vZGUobm9kZSk7XG5cbiAgICAgICAgLy8gVGhlcmUncyBubyBsZWdpdGltYXRlIHJlYXNvbiB0byBkaXNwbGF5IGEgc3RyaW5naWZpZWQgb2JzZXJ2YWJsZSB3aXRob3V0IHVud3JhcHBpbmcgaXQsIHNvIHdlJ2xsIHVud3JhcCBpdFxuICAgICAgICBodG1sID0ga28udXRpbHMudW53cmFwT2JzZXJ2YWJsZShodG1sKTtcblxuICAgICAgICBpZiAoKGh0bWwgIT09IG51bGwpICYmIChodG1sICE9PSB1bmRlZmluZWQpKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGh0bWwgIT0gJ3N0cmluZycpXG4gICAgICAgICAgICAgICAgaHRtbCA9IGh0bWwudG9TdHJpbmcoKTtcblxuICAgICAgICAgICAgLy8galF1ZXJ5IGNvbnRhaW5zIGEgbG90IG9mIHNvcGhpc3RpY2F0ZWQgY29kZSB0byBwYXJzZSBhcmJpdHJhcnkgSFRNTCBmcmFnbWVudHMsXG4gICAgICAgICAgICAvLyBmb3IgZXhhbXBsZSA8dHI+IGVsZW1lbnRzIHdoaWNoIGFyZSBub3Qgbm9ybWFsbHkgYWxsb3dlZCB0byBleGlzdCBvbiB0aGVpciBvd24uXG4gICAgICAgICAgICAvLyBJZiB5b3UndmUgcmVmZXJlbmNlZCBqUXVlcnkgd2UnbGwgdXNlIHRoYXQgcmF0aGVyIHRoYW4gZHVwbGljYXRpbmcgaXRzIGNvZGUuXG4gICAgICAgICAgICBpZiAodHlwZW9mIGpRdWVyeSAhPSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIGpRdWVyeShub2RlKVsnaHRtbCddKGh0bWwpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyAuLi4gb3RoZXJ3aXNlLCB1c2UgS08ncyBvd24gcGFyc2luZyBsb2dpYy5cbiAgICAgICAgICAgICAgICB2YXIgcGFyc2VkTm9kZXMgPSBrby51dGlscy5wYXJzZUh0bWxGcmFnbWVudChodG1sKTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBhcnNlZE5vZGVzLmxlbmd0aDsgaSsrKVxuICAgICAgICAgICAgICAgICAgICBub2RlLmFwcGVuZENoaWxkKHBhcnNlZE5vZGVzW2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG59KSgpO1xuXG5rby5leHBvcnRTeW1ib2woJ3V0aWxzLnBhcnNlSHRtbEZyYWdtZW50Jywga28udXRpbHMucGFyc2VIdG1sRnJhZ21lbnQpO1xua28uZXhwb3J0U3ltYm9sKCd1dGlscy5zZXRIdG1sJywga28udXRpbHMuc2V0SHRtbCk7XG5cbmtvLm1lbW9pemF0aW9uID0gKGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgbWVtb3MgPSB7fTtcblxuICAgIGZ1bmN0aW9uIHJhbmRvbU1heDhIZXhDaGFycygpIHtcbiAgICAgICAgcmV0dXJuICgoKDEgKyBNYXRoLnJhbmRvbSgpKSAqIDB4MTAwMDAwMDAwKSB8IDApLnRvU3RyaW5nKDE2KS5zdWJzdHJpbmcoMSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGdlbmVyYXRlUmFuZG9tSWQoKSB7XG4gICAgICAgIHJldHVybiByYW5kb21NYXg4SGV4Q2hhcnMoKSArIHJhbmRvbU1heDhIZXhDaGFycygpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBmaW5kTWVtb05vZGVzKHJvb3ROb2RlLCBhcHBlbmRUb0FycmF5KSB7XG4gICAgICAgIGlmICghcm9vdE5vZGUpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGlmIChyb290Tm9kZS5ub2RlVHlwZSA9PSA4KSB7XG4gICAgICAgICAgICB2YXIgbWVtb0lkID0ga28ubWVtb2l6YXRpb24ucGFyc2VNZW1vVGV4dChyb290Tm9kZS5ub2RlVmFsdWUpO1xuICAgICAgICAgICAgaWYgKG1lbW9JZCAhPSBudWxsKVxuICAgICAgICAgICAgICAgIGFwcGVuZFRvQXJyYXkucHVzaCh7IGRvbU5vZGU6IHJvb3ROb2RlLCBtZW1vSWQ6IG1lbW9JZCB9KTtcbiAgICAgICAgfSBlbHNlIGlmIChyb290Tm9kZS5ub2RlVHlwZSA9PSAxKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgY2hpbGROb2RlcyA9IHJvb3ROb2RlLmNoaWxkTm9kZXMsIGogPSBjaGlsZE5vZGVzLmxlbmd0aDsgaSA8IGo7IGkrKylcbiAgICAgICAgICAgICAgICBmaW5kTWVtb05vZGVzKGNoaWxkTm9kZXNbaV0sIGFwcGVuZFRvQXJyYXkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgbWVtb2l6ZTogZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGNhbGxiYWNrICE9IFwiZnVuY3Rpb25cIilcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJZb3UgY2FuIG9ubHkgcGFzcyBhIGZ1bmN0aW9uIHRvIGtvLm1lbW9pemF0aW9uLm1lbW9pemUoKVwiKTtcbiAgICAgICAgICAgIHZhciBtZW1vSWQgPSBnZW5lcmF0ZVJhbmRvbUlkKCk7XG4gICAgICAgICAgICBtZW1vc1ttZW1vSWRdID0gY2FsbGJhY2s7XG4gICAgICAgICAgICByZXR1cm4gXCI8IS0tW2tvX21lbW86XCIgKyBtZW1vSWQgKyBcIl0tLT5cIjtcbiAgICAgICAgfSxcblxuICAgICAgICB1bm1lbW9pemU6IGZ1bmN0aW9uIChtZW1vSWQsIGNhbGxiYWNrUGFyYW1zKSB7XG4gICAgICAgICAgICB2YXIgY2FsbGJhY2sgPSBtZW1vc1ttZW1vSWRdO1xuICAgICAgICAgICAgaWYgKGNhbGxiYWNrID09PSB1bmRlZmluZWQpXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ291bGRuJ3QgZmluZCBhbnkgbWVtbyB3aXRoIElEIFwiICsgbWVtb0lkICsgXCIuIFBlcmhhcHMgaXQncyBhbHJlYWR5IGJlZW4gdW5tZW1vaXplZC5cIik7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrLmFwcGx5KG51bGwsIGNhbGxiYWNrUGFyYW1zIHx8IFtdKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZpbmFsbHkgeyBkZWxldGUgbWVtb3NbbWVtb0lkXTsgfVxuICAgICAgICB9LFxuXG4gICAgICAgIHVubWVtb2l6ZURvbU5vZGVBbmREZXNjZW5kYW50czogZnVuY3Rpb24gKGRvbU5vZGUsIGV4dHJhQ2FsbGJhY2tQYXJhbXNBcnJheSkge1xuICAgICAgICAgICAgdmFyIG1lbW9zID0gW107XG4gICAgICAgICAgICBmaW5kTWVtb05vZGVzKGRvbU5vZGUsIG1lbW9zKTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBqID0gbWVtb3MubGVuZ3RoOyBpIDwgajsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIG5vZGUgPSBtZW1vc1tpXS5kb21Ob2RlO1xuICAgICAgICAgICAgICAgIHZhciBjb21iaW5lZFBhcmFtcyA9IFtub2RlXTtcbiAgICAgICAgICAgICAgICBpZiAoZXh0cmFDYWxsYmFja1BhcmFtc0FycmF5KVxuICAgICAgICAgICAgICAgICAgICBrby51dGlscy5hcnJheVB1c2hBbGwoY29tYmluZWRQYXJhbXMsIGV4dHJhQ2FsbGJhY2tQYXJhbXNBcnJheSk7XG4gICAgICAgICAgICAgICAga28ubWVtb2l6YXRpb24udW5tZW1vaXplKG1lbW9zW2ldLm1lbW9JZCwgY29tYmluZWRQYXJhbXMpO1xuICAgICAgICAgICAgICAgIG5vZGUubm9kZVZhbHVlID0gXCJcIjsgLy8gTmV1dGVyIHRoaXMgbm9kZSBzbyB3ZSBkb24ndCB0cnkgdG8gdW5tZW1vaXplIGl0IGFnYWluXG4gICAgICAgICAgICAgICAgaWYgKG5vZGUucGFyZW50Tm9kZSlcbiAgICAgICAgICAgICAgICAgICAgbm9kZS5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKG5vZGUpOyAvLyBJZiBwb3NzaWJsZSwgZXJhc2UgaXQgdG90YWxseSAobm90IGFsd2F5cyBwb3NzaWJsZSAtIHNvbWVvbmUgZWxzZSBtaWdodCBqdXN0IGhvbGQgYSByZWZlcmVuY2UgdG8gaXQgdGhlbiBjYWxsIHVubWVtb2l6ZURvbU5vZGVBbmREZXNjZW5kYW50cyBhZ2FpbilcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBwYXJzZU1lbW9UZXh0OiBmdW5jdGlvbiAobWVtb1RleHQpIHtcbiAgICAgICAgICAgIHZhciBtYXRjaCA9IG1lbW9UZXh0Lm1hdGNoKC9eXFxba29fbWVtb1xcOiguKj8pXFxdJC8pO1xuICAgICAgICAgICAgcmV0dXJuIG1hdGNoID8gbWF0Y2hbMV0gOiBudWxsO1xuICAgICAgICB9XG4gICAgfTtcbn0pKCk7XG5cbmtvLmV4cG9ydFN5bWJvbCgnbWVtb2l6YXRpb24nLCBrby5tZW1vaXphdGlvbik7XG5rby5leHBvcnRTeW1ib2woJ21lbW9pemF0aW9uLm1lbW9pemUnLCBrby5tZW1vaXphdGlvbi5tZW1vaXplKTtcbmtvLmV4cG9ydFN5bWJvbCgnbWVtb2l6YXRpb24udW5tZW1vaXplJywga28ubWVtb2l6YXRpb24udW5tZW1vaXplKTtcbmtvLmV4cG9ydFN5bWJvbCgnbWVtb2l6YXRpb24ucGFyc2VNZW1vVGV4dCcsIGtvLm1lbW9pemF0aW9uLnBhcnNlTWVtb1RleHQpO1xua28uZXhwb3J0U3ltYm9sKCdtZW1vaXphdGlvbi51bm1lbW9pemVEb21Ob2RlQW5kRGVzY2VuZGFudHMnLCBrby5tZW1vaXphdGlvbi51bm1lbW9pemVEb21Ob2RlQW5kRGVzY2VuZGFudHMpO1xua28uZXh0ZW5kZXJzID0ge1xuICAgICd0aHJvdHRsZSc6IGZ1bmN0aW9uKHRhcmdldCwgdGltZW91dCkge1xuICAgICAgICAvLyBUaHJvdHRsaW5nIG1lYW5zIHR3byB0aGluZ3M6XG5cbiAgICAgICAgLy8gKDEpIEZvciBkZXBlbmRlbnQgb2JzZXJ2YWJsZXMsIHdlIHRocm90dGxlICpldmFsdWF0aW9ucyogc28gdGhhdCwgbm8gbWF0dGVyIGhvdyBmYXN0IGl0cyBkZXBlbmRlbmNpZXNcbiAgICAgICAgLy8gICAgIG5vdGlmeSB1cGRhdGVzLCB0aGUgdGFyZ2V0IGRvZXNuJ3QgcmUtZXZhbHVhdGUgKGFuZCBoZW5jZSBkb2Vzbid0IG5vdGlmeSkgZmFzdGVyIHRoYW4gYSBjZXJ0YWluIHJhdGVcbiAgICAgICAgdGFyZ2V0Wyd0aHJvdHRsZUV2YWx1YXRpb24nXSA9IHRpbWVvdXQ7XG5cbiAgICAgICAgLy8gKDIpIEZvciB3cml0YWJsZSB0YXJnZXRzIChvYnNlcnZhYmxlcywgb3Igd3JpdGFibGUgZGVwZW5kZW50IG9ic2VydmFibGVzKSwgd2UgdGhyb3R0bGUgKndyaXRlcypcbiAgICAgICAgLy8gICAgIHNvIHRoZSB0YXJnZXQgY2Fubm90IGNoYW5nZSB2YWx1ZSBzeW5jaHJvbm91c2x5IG9yIGZhc3RlciB0aGFuIGEgY2VydGFpbiByYXRlXG4gICAgICAgIHZhciB3cml0ZVRpbWVvdXRJbnN0YW5jZSA9IG51bGw7XG4gICAgICAgIHJldHVybiBrby5kZXBlbmRlbnRPYnNlcnZhYmxlKHtcbiAgICAgICAgICAgICdyZWFkJzogdGFyZ2V0LFxuICAgICAgICAgICAgJ3dyaXRlJzogZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQod3JpdGVUaW1lb3V0SW5zdGFuY2UpO1xuICAgICAgICAgICAgICAgIHdyaXRlVGltZW91dEluc3RhbmNlID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0KHZhbHVlKTtcbiAgICAgICAgICAgICAgICB9LCB0aW1lb3V0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgICdub3RpZnknOiBmdW5jdGlvbih0YXJnZXQsIG5vdGlmeVdoZW4pIHtcbiAgICAgICAgdGFyZ2V0W1wiZXF1YWxpdHlDb21wYXJlclwiXSA9IG5vdGlmeVdoZW4gPT0gXCJhbHdheXNcIlxuICAgICAgICAgICAgPyBmdW5jdGlvbigpIHsgcmV0dXJuIGZhbHNlIH0gLy8gVHJlYXQgYWxsIHZhbHVlcyBhcyBub3QgZXF1YWxcbiAgICAgICAgICAgIDoga28ub2JzZXJ2YWJsZVtcImZuXCJdW1wiZXF1YWxpdHlDb21wYXJlclwiXTtcbiAgICAgICAgcmV0dXJuIHRhcmdldDtcbiAgICB9XG59O1xuXG5mdW5jdGlvbiBhcHBseUV4dGVuZGVycyhyZXF1ZXN0ZWRFeHRlbmRlcnMpIHtcbiAgICB2YXIgdGFyZ2V0ID0gdGhpcztcbiAgICBpZiAocmVxdWVzdGVkRXh0ZW5kZXJzKSB7XG4gICAgICAgIGtvLnV0aWxzLm9iamVjdEZvckVhY2gocmVxdWVzdGVkRXh0ZW5kZXJzLCBmdW5jdGlvbihrZXksIHZhbHVlKSB7XG4gICAgICAgICAgICB2YXIgZXh0ZW5kZXJIYW5kbGVyID0ga28uZXh0ZW5kZXJzW2tleV07XG4gICAgICAgICAgICBpZiAodHlwZW9mIGV4dGVuZGVySGFuZGxlciA9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgdGFyZ2V0ID0gZXh0ZW5kZXJIYW5kbGVyKHRhcmdldCwgdmFsdWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIHRhcmdldDtcbn1cblxua28uZXhwb3J0U3ltYm9sKCdleHRlbmRlcnMnLCBrby5leHRlbmRlcnMpO1xuXG5rby5zdWJzY3JpcHRpb24gPSBmdW5jdGlvbiAodGFyZ2V0LCBjYWxsYmFjaywgZGlzcG9zZUNhbGxiYWNrKSB7XG4gICAgdGhpcy50YXJnZXQgPSB0YXJnZXQ7XG4gICAgdGhpcy5jYWxsYmFjayA9IGNhbGxiYWNrO1xuICAgIHRoaXMuZGlzcG9zZUNhbGxiYWNrID0gZGlzcG9zZUNhbGxiYWNrO1xuICAgIGtvLmV4cG9ydFByb3BlcnR5KHRoaXMsICdkaXNwb3NlJywgdGhpcy5kaXNwb3NlKTtcbn07XG5rby5zdWJzY3JpcHRpb24ucHJvdG90eXBlLmRpc3Bvc2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5pc0Rpc3Bvc2VkID0gdHJ1ZTtcbiAgICB0aGlzLmRpc3Bvc2VDYWxsYmFjaygpO1xufTtcblxua28uc3Vic2NyaWJhYmxlID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuX3N1YnNjcmlwdGlvbnMgPSB7fTtcblxuICAgIGtvLnV0aWxzLmV4dGVuZCh0aGlzLCBrby5zdWJzY3JpYmFibGVbJ2ZuJ10pO1xuICAgIGtvLmV4cG9ydFByb3BlcnR5KHRoaXMsICdzdWJzY3JpYmUnLCB0aGlzLnN1YnNjcmliZSk7XG4gICAga28uZXhwb3J0UHJvcGVydHkodGhpcywgJ2V4dGVuZCcsIHRoaXMuZXh0ZW5kKTtcbiAgICBrby5leHBvcnRQcm9wZXJ0eSh0aGlzLCAnZ2V0U3Vic2NyaXB0aW9uc0NvdW50JywgdGhpcy5nZXRTdWJzY3JpcHRpb25zQ291bnQpO1xufVxuXG52YXIgZGVmYXVsdEV2ZW50ID0gXCJjaGFuZ2VcIjtcblxua28uc3Vic2NyaWJhYmxlWydmbiddID0ge1xuICAgIHN1YnNjcmliZTogZnVuY3Rpb24gKGNhbGxiYWNrLCBjYWxsYmFja1RhcmdldCwgZXZlbnQpIHtcbiAgICAgICAgZXZlbnQgPSBldmVudCB8fCBkZWZhdWx0RXZlbnQ7XG4gICAgICAgIHZhciBib3VuZENhbGxiYWNrID0gY2FsbGJhY2tUYXJnZXQgPyBjYWxsYmFjay5iaW5kKGNhbGxiYWNrVGFyZ2V0KSA6IGNhbGxiYWNrO1xuXG4gICAgICAgIHZhciBzdWJzY3JpcHRpb24gPSBuZXcga28uc3Vic2NyaXB0aW9uKHRoaXMsIGJvdW5kQ2FsbGJhY2ssIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGtvLnV0aWxzLmFycmF5UmVtb3ZlSXRlbSh0aGlzLl9zdWJzY3JpcHRpb25zW2V2ZW50XSwgc3Vic2NyaXB0aW9uKTtcbiAgICAgICAgfS5iaW5kKHRoaXMpKTtcblxuICAgICAgICBpZiAoIXRoaXMuX3N1YnNjcmlwdGlvbnNbZXZlbnRdKVxuICAgICAgICAgICAgdGhpcy5fc3Vic2NyaXB0aW9uc1tldmVudF0gPSBbXTtcbiAgICAgICAgdGhpcy5fc3Vic2NyaXB0aW9uc1tldmVudF0ucHVzaChzdWJzY3JpcHRpb24pO1xuICAgICAgICByZXR1cm4gc3Vic2NyaXB0aW9uO1xuICAgIH0sXG5cbiAgICBcIm5vdGlmeVN1YnNjcmliZXJzXCI6IGZ1bmN0aW9uICh2YWx1ZVRvTm90aWZ5LCBldmVudCkge1xuICAgICAgICBldmVudCA9IGV2ZW50IHx8IGRlZmF1bHRFdmVudDtcbiAgICAgICAgaWYgKHRoaXMuX3N1YnNjcmlwdGlvbnNbZXZlbnRdKSB7XG4gICAgICAgICAgICBrby5kZXBlbmRlbmN5RGV0ZWN0aW9uLmlnbm9yZShmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBrby51dGlscy5hcnJheUZvckVhY2godGhpcy5fc3Vic2NyaXB0aW9uc1tldmVudF0uc2xpY2UoMCksIGZ1bmN0aW9uIChzdWJzY3JpcHRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gSW4gY2FzZSBhIHN1YnNjcmlwdGlvbiB3YXMgZGlzcG9zZWQgZHVyaW5nIHRoZSBhcnJheUZvckVhY2ggY3ljbGUsIGNoZWNrXG4gICAgICAgICAgICAgICAgICAgIC8vIGZvciBpc0Rpc3Bvc2VkIG9uIGVhY2ggc3Vic2NyaXB0aW9uIGJlZm9yZSBpbnZva2luZyBpdHMgY2FsbGJhY2tcbiAgICAgICAgICAgICAgICAgICAgaWYgKHN1YnNjcmlwdGlvbiAmJiAoc3Vic2NyaXB0aW9uLmlzRGlzcG9zZWQgIT09IHRydWUpKVxuICAgICAgICAgICAgICAgICAgICAgICAgc3Vic2NyaXB0aW9uLmNhbGxiYWNrKHZhbHVlVG9Ob3RpZnkpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgZ2V0U3Vic2NyaXB0aW9uc0NvdW50OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciB0b3RhbCA9IDA7XG4gICAgICAgIGtvLnV0aWxzLm9iamVjdEZvckVhY2godGhpcy5fc3Vic2NyaXB0aW9ucywgZnVuY3Rpb24oZXZlbnROYW1lLCBzdWJzY3JpcHRpb25zKSB7XG4gICAgICAgICAgICB0b3RhbCArPSBzdWJzY3JpcHRpb25zLmxlbmd0aDtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB0b3RhbDtcbiAgICB9LFxuXG4gICAgZXh0ZW5kOiBhcHBseUV4dGVuZGVyc1xufTtcblxuXG5rby5pc1N1YnNjcmliYWJsZSA9IGZ1bmN0aW9uIChpbnN0YW5jZSkge1xuICAgIHJldHVybiBpbnN0YW5jZSAhPSBudWxsICYmIHR5cGVvZiBpbnN0YW5jZS5zdWJzY3JpYmUgPT0gXCJmdW5jdGlvblwiICYmIHR5cGVvZiBpbnN0YW5jZVtcIm5vdGlmeVN1YnNjcmliZXJzXCJdID09IFwiZnVuY3Rpb25cIjtcbn07XG5cbmtvLmV4cG9ydFN5bWJvbCgnc3Vic2NyaWJhYmxlJywga28uc3Vic2NyaWJhYmxlKTtcbmtvLmV4cG9ydFN5bWJvbCgnaXNTdWJzY3JpYmFibGUnLCBrby5pc1N1YnNjcmliYWJsZSk7XG5cbmtvLmRlcGVuZGVuY3lEZXRlY3Rpb24gPSAoZnVuY3Rpb24gKCkge1xuICAgIHZhciBfZnJhbWVzID0gW107XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBiZWdpbjogZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBfZnJhbWVzLnB1c2goeyBjYWxsYmFjazogY2FsbGJhY2ssIGRpc3RpbmN0RGVwZW5kZW5jaWVzOltdIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIGVuZDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgX2ZyYW1lcy5wb3AoKTtcbiAgICAgICAgfSxcblxuICAgICAgICByZWdpc3RlckRlcGVuZGVuY3k6IGZ1bmN0aW9uIChzdWJzY3JpYmFibGUpIHtcbiAgICAgICAgICAgIGlmICgha28uaXNTdWJzY3JpYmFibGUoc3Vic2NyaWJhYmxlKSlcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJPbmx5IHN1YnNjcmliYWJsZSB0aGluZ3MgY2FuIGFjdCBhcyBkZXBlbmRlbmNpZXNcIik7XG4gICAgICAgICAgICBpZiAoX2ZyYW1lcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgdmFyIHRvcEZyYW1lID0gX2ZyYW1lc1tfZnJhbWVzLmxlbmd0aCAtIDFdO1xuICAgICAgICAgICAgICAgIGlmICghdG9wRnJhbWUgfHwga28udXRpbHMuYXJyYXlJbmRleE9mKHRvcEZyYW1lLmRpc3RpbmN0RGVwZW5kZW5jaWVzLCBzdWJzY3JpYmFibGUpID49IDApXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB0b3BGcmFtZS5kaXN0aW5jdERlcGVuZGVuY2llcy5wdXNoKHN1YnNjcmliYWJsZSk7XG4gICAgICAgICAgICAgICAgdG9wRnJhbWUuY2FsbGJhY2soc3Vic2NyaWJhYmxlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBpZ25vcmU6IGZ1bmN0aW9uKGNhbGxiYWNrLCBjYWxsYmFja1RhcmdldCwgY2FsbGJhY2tBcmdzKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIF9mcmFtZXMucHVzaChudWxsKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2suYXBwbHkoY2FsbGJhY2tUYXJnZXQsIGNhbGxiYWNrQXJncyB8fCBbXSk7XG4gICAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgICAgIF9mcmFtZXMucG9wKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xufSkoKTtcbnZhciBwcmltaXRpdmVUeXBlcyA9IHsgJ3VuZGVmaW5lZCc6dHJ1ZSwgJ2Jvb2xlYW4nOnRydWUsICdudW1iZXInOnRydWUsICdzdHJpbmcnOnRydWUgfTtcblxua28ub2JzZXJ2YWJsZSA9IGZ1bmN0aW9uIChpbml0aWFsVmFsdWUpIHtcbiAgICB2YXIgX2xhdGVzdFZhbHVlID0gaW5pdGlhbFZhbHVlO1xuXG4gICAgZnVuY3Rpb24gb2JzZXJ2YWJsZSgpIHtcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAvLyBXcml0ZVxuXG4gICAgICAgICAgICAvLyBJZ25vcmUgd3JpdGVzIGlmIHRoZSB2YWx1ZSBoYXNuJ3QgY2hhbmdlZFxuICAgICAgICAgICAgaWYgKCghb2JzZXJ2YWJsZVsnZXF1YWxpdHlDb21wYXJlciddKSB8fCAhb2JzZXJ2YWJsZVsnZXF1YWxpdHlDb21wYXJlciddKF9sYXRlc3RWYWx1ZSwgYXJndW1lbnRzWzBdKSkge1xuICAgICAgICAgICAgICAgIG9ic2VydmFibGUudmFsdWVXaWxsTXV0YXRlKCk7XG4gICAgICAgICAgICAgICAgX2xhdGVzdFZhbHVlID0gYXJndW1lbnRzWzBdO1xuICAgICAgICAgICAgICAgIGlmIChERUJVRykgb2JzZXJ2YWJsZS5fbGF0ZXN0VmFsdWUgPSBfbGF0ZXN0VmFsdWU7XG4gICAgICAgICAgICAgICAgb2JzZXJ2YWJsZS52YWx1ZUhhc011dGF0ZWQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0aGlzOyAvLyBQZXJtaXRzIGNoYWluZWQgYXNzaWdubWVudHNcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIC8vIFJlYWRcbiAgICAgICAgICAgIGtvLmRlcGVuZGVuY3lEZXRlY3Rpb24ucmVnaXN0ZXJEZXBlbmRlbmN5KG9ic2VydmFibGUpOyAvLyBUaGUgY2FsbGVyIG9ubHkgbmVlZHMgdG8gYmUgbm90aWZpZWQgb2YgY2hhbmdlcyBpZiB0aGV5IGRpZCBhIFwicmVhZFwiIG9wZXJhdGlvblxuICAgICAgICAgICAgcmV0dXJuIF9sYXRlc3RWYWx1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAoREVCVUcpIG9ic2VydmFibGUuX2xhdGVzdFZhbHVlID0gX2xhdGVzdFZhbHVlO1xuICAgIGtvLnN1YnNjcmliYWJsZS5jYWxsKG9ic2VydmFibGUpO1xuICAgIG9ic2VydmFibGUucGVlayA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gX2xhdGVzdFZhbHVlIH07XG4gICAgb2JzZXJ2YWJsZS52YWx1ZUhhc011dGF0ZWQgPSBmdW5jdGlvbiAoKSB7IG9ic2VydmFibGVbXCJub3RpZnlTdWJzY3JpYmVyc1wiXShfbGF0ZXN0VmFsdWUpOyB9XG4gICAgb2JzZXJ2YWJsZS52YWx1ZVdpbGxNdXRhdGUgPSBmdW5jdGlvbiAoKSB7IG9ic2VydmFibGVbXCJub3RpZnlTdWJzY3JpYmVyc1wiXShfbGF0ZXN0VmFsdWUsIFwiYmVmb3JlQ2hhbmdlXCIpOyB9XG4gICAga28udXRpbHMuZXh0ZW5kKG9ic2VydmFibGUsIGtvLm9ic2VydmFibGVbJ2ZuJ10pO1xuXG4gICAga28uZXhwb3J0UHJvcGVydHkob2JzZXJ2YWJsZSwgJ3BlZWsnLCBvYnNlcnZhYmxlLnBlZWspO1xuICAgIGtvLmV4cG9ydFByb3BlcnR5KG9ic2VydmFibGUsIFwidmFsdWVIYXNNdXRhdGVkXCIsIG9ic2VydmFibGUudmFsdWVIYXNNdXRhdGVkKTtcbiAgICBrby5leHBvcnRQcm9wZXJ0eShvYnNlcnZhYmxlLCBcInZhbHVlV2lsbE11dGF0ZVwiLCBvYnNlcnZhYmxlLnZhbHVlV2lsbE11dGF0ZSk7XG5cbiAgICByZXR1cm4gb2JzZXJ2YWJsZTtcbn1cblxua28ub2JzZXJ2YWJsZVsnZm4nXSA9IHtcbiAgICBcImVxdWFsaXR5Q29tcGFyZXJcIjogZnVuY3Rpb24gdmFsdWVzQXJlUHJpbWl0aXZlQW5kRXF1YWwoYSwgYikge1xuICAgICAgICB2YXIgb2xkVmFsdWVJc1ByaW1pdGl2ZSA9IChhID09PSBudWxsKSB8fCAodHlwZW9mKGEpIGluIHByaW1pdGl2ZVR5cGVzKTtcbiAgICAgICAgcmV0dXJuIG9sZFZhbHVlSXNQcmltaXRpdmUgPyAoYSA9PT0gYikgOiBmYWxzZTtcbiAgICB9XG59O1xuXG52YXIgcHJvdG9Qcm9wZXJ0eSA9IGtvLm9ic2VydmFibGUucHJvdG9Qcm9wZXJ0eSA9IFwiX19rb19wcm90b19fXCI7XG5rby5vYnNlcnZhYmxlWydmbiddW3Byb3RvUHJvcGVydHldID0ga28ub2JzZXJ2YWJsZTtcblxua28uaGFzUHJvdG90eXBlID0gZnVuY3Rpb24oaW5zdGFuY2UsIHByb3RvdHlwZSkge1xuICAgIGlmICgoaW5zdGFuY2UgPT09IG51bGwpIHx8IChpbnN0YW5jZSA9PT0gdW5kZWZpbmVkKSB8fCAoaW5zdGFuY2VbcHJvdG9Qcm9wZXJ0eV0gPT09IHVuZGVmaW5lZCkpIHJldHVybiBmYWxzZTtcbiAgICBpZiAoaW5zdGFuY2VbcHJvdG9Qcm9wZXJ0eV0gPT09IHByb3RvdHlwZSkgcmV0dXJuIHRydWU7XG4gICAgcmV0dXJuIGtvLmhhc1Byb3RvdHlwZShpbnN0YW5jZVtwcm90b1Byb3BlcnR5XSwgcHJvdG90eXBlKTsgLy8gV2FsayB0aGUgcHJvdG90eXBlIGNoYWluXG59O1xuXG5rby5pc09ic2VydmFibGUgPSBmdW5jdGlvbiAoaW5zdGFuY2UpIHtcbiAgICByZXR1cm4ga28uaGFzUHJvdG90eXBlKGluc3RhbmNlLCBrby5vYnNlcnZhYmxlKTtcbn1cbmtvLmlzV3JpdGVhYmxlT2JzZXJ2YWJsZSA9IGZ1bmN0aW9uIChpbnN0YW5jZSkge1xuICAgIC8vIE9ic2VydmFibGVcbiAgICBpZiAoKHR5cGVvZiBpbnN0YW5jZSA9PSBcImZ1bmN0aW9uXCIpICYmIGluc3RhbmNlW3Byb3RvUHJvcGVydHldID09PSBrby5vYnNlcnZhYmxlKVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAvLyBXcml0ZWFibGUgZGVwZW5kZW50IG9ic2VydmFibGVcbiAgICBpZiAoKHR5cGVvZiBpbnN0YW5jZSA9PSBcImZ1bmN0aW9uXCIpICYmIChpbnN0YW5jZVtwcm90b1Byb3BlcnR5XSA9PT0ga28uZGVwZW5kZW50T2JzZXJ2YWJsZSkgJiYgKGluc3RhbmNlLmhhc1dyaXRlRnVuY3Rpb24pKVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAvLyBBbnl0aGluZyBlbHNlXG4gICAgcmV0dXJuIGZhbHNlO1xufVxuXG5cbmtvLmV4cG9ydFN5bWJvbCgnb2JzZXJ2YWJsZScsIGtvLm9ic2VydmFibGUpO1xua28uZXhwb3J0U3ltYm9sKCdpc09ic2VydmFibGUnLCBrby5pc09ic2VydmFibGUpO1xua28uZXhwb3J0U3ltYm9sKCdpc1dyaXRlYWJsZU9ic2VydmFibGUnLCBrby5pc1dyaXRlYWJsZU9ic2VydmFibGUpO1xua28ub2JzZXJ2YWJsZUFycmF5ID0gZnVuY3Rpb24gKGluaXRpYWxWYWx1ZXMpIHtcbiAgICBpbml0aWFsVmFsdWVzID0gaW5pdGlhbFZhbHVlcyB8fCBbXTtcblxuICAgIGlmICh0eXBlb2YgaW5pdGlhbFZhbHVlcyAhPSAnb2JqZWN0JyB8fCAhKCdsZW5ndGgnIGluIGluaXRpYWxWYWx1ZXMpKVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJUaGUgYXJndW1lbnQgcGFzc2VkIHdoZW4gaW5pdGlhbGl6aW5nIGFuIG9ic2VydmFibGUgYXJyYXkgbXVzdCBiZSBhbiBhcnJheSwgb3IgbnVsbCwgb3IgdW5kZWZpbmVkLlwiKTtcblxuICAgIHZhciByZXN1bHQgPSBrby5vYnNlcnZhYmxlKGluaXRpYWxWYWx1ZXMpO1xuICAgIGtvLnV0aWxzLmV4dGVuZChyZXN1bHQsIGtvLm9ic2VydmFibGVBcnJheVsnZm4nXSk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbn07XG5cbmtvLm9ic2VydmFibGVBcnJheVsnZm4nXSA9IHtcbiAgICAncmVtb3ZlJzogZnVuY3Rpb24gKHZhbHVlT3JQcmVkaWNhdGUpIHtcbiAgICAgICAgdmFyIHVuZGVybHlpbmdBcnJheSA9IHRoaXMucGVlaygpO1xuICAgICAgICB2YXIgcmVtb3ZlZFZhbHVlcyA9IFtdO1xuICAgICAgICB2YXIgcHJlZGljYXRlID0gdHlwZW9mIHZhbHVlT3JQcmVkaWNhdGUgPT0gXCJmdW5jdGlvblwiID8gdmFsdWVPclByZWRpY2F0ZSA6IGZ1bmN0aW9uICh2YWx1ZSkgeyByZXR1cm4gdmFsdWUgPT09IHZhbHVlT3JQcmVkaWNhdGU7IH07XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdW5kZXJseWluZ0FycmF5Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgdmFsdWUgPSB1bmRlcmx5aW5nQXJyYXlbaV07XG4gICAgICAgICAgICBpZiAocHJlZGljYXRlKHZhbHVlKSkge1xuICAgICAgICAgICAgICAgIGlmIChyZW1vdmVkVmFsdWVzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnZhbHVlV2lsbE11dGF0ZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZW1vdmVkVmFsdWVzLnB1c2godmFsdWUpO1xuICAgICAgICAgICAgICAgIHVuZGVybHlpbmdBcnJheS5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICAgICAgaS0tO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChyZW1vdmVkVmFsdWVzLmxlbmd0aCkge1xuICAgICAgICAgICAgdGhpcy52YWx1ZUhhc011dGF0ZWQoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVtb3ZlZFZhbHVlcztcbiAgICB9LFxuXG4gICAgJ3JlbW92ZUFsbCc6IGZ1bmN0aW9uIChhcnJheU9mVmFsdWVzKSB7XG4gICAgICAgIC8vIElmIHlvdSBwYXNzZWQgemVybyBhcmdzLCB3ZSByZW1vdmUgZXZlcnl0aGluZ1xuICAgICAgICBpZiAoYXJyYXlPZlZhbHVlcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB2YXIgdW5kZXJseWluZ0FycmF5ID0gdGhpcy5wZWVrKCk7XG4gICAgICAgICAgICB2YXIgYWxsVmFsdWVzID0gdW5kZXJseWluZ0FycmF5LnNsaWNlKDApO1xuICAgICAgICAgICAgdGhpcy52YWx1ZVdpbGxNdXRhdGUoKTtcbiAgICAgICAgICAgIHVuZGVybHlpbmdBcnJheS5zcGxpY2UoMCwgdW5kZXJseWluZ0FycmF5Lmxlbmd0aCk7XG4gICAgICAgICAgICB0aGlzLnZhbHVlSGFzTXV0YXRlZCgpO1xuICAgICAgICAgICAgcmV0dXJuIGFsbFZhbHVlcztcbiAgICAgICAgfVxuICAgICAgICAvLyBJZiB5b3UgcGFzc2VkIGFuIGFyZywgd2UgaW50ZXJwcmV0IGl0IGFzIGFuIGFycmF5IG9mIGVudHJpZXMgdG8gcmVtb3ZlXG4gICAgICAgIGlmICghYXJyYXlPZlZhbHVlcylcbiAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgcmV0dXJuIHRoaXNbJ3JlbW92ZSddKGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgcmV0dXJuIGtvLnV0aWxzLmFycmF5SW5kZXhPZihhcnJheU9mVmFsdWVzLCB2YWx1ZSkgPj0gMDtcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgICdkZXN0cm95JzogZnVuY3Rpb24gKHZhbHVlT3JQcmVkaWNhdGUpIHtcbiAgICAgICAgdmFyIHVuZGVybHlpbmdBcnJheSA9IHRoaXMucGVlaygpO1xuICAgICAgICB2YXIgcHJlZGljYXRlID0gdHlwZW9mIHZhbHVlT3JQcmVkaWNhdGUgPT0gXCJmdW5jdGlvblwiID8gdmFsdWVPclByZWRpY2F0ZSA6IGZ1bmN0aW9uICh2YWx1ZSkgeyByZXR1cm4gdmFsdWUgPT09IHZhbHVlT3JQcmVkaWNhdGU7IH07XG4gICAgICAgIHRoaXMudmFsdWVXaWxsTXV0YXRlKCk7XG4gICAgICAgIGZvciAodmFyIGkgPSB1bmRlcmx5aW5nQXJyYXkubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IHVuZGVybHlpbmdBcnJheVtpXTtcbiAgICAgICAgICAgIGlmIChwcmVkaWNhdGUodmFsdWUpKVxuICAgICAgICAgICAgICAgIHVuZGVybHlpbmdBcnJheVtpXVtcIl9kZXN0cm95XCJdID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnZhbHVlSGFzTXV0YXRlZCgpO1xuICAgIH0sXG5cbiAgICAnZGVzdHJveUFsbCc6IGZ1bmN0aW9uIChhcnJheU9mVmFsdWVzKSB7XG4gICAgICAgIC8vIElmIHlvdSBwYXNzZWQgemVybyBhcmdzLCB3ZSBkZXN0cm95IGV2ZXJ5dGhpbmdcbiAgICAgICAgaWYgKGFycmF5T2ZWYWx1ZXMgPT09IHVuZGVmaW5lZClcbiAgICAgICAgICAgIHJldHVybiB0aGlzWydkZXN0cm95J10oZnVuY3Rpb24oKSB7IHJldHVybiB0cnVlIH0pO1xuXG4gICAgICAgIC8vIElmIHlvdSBwYXNzZWQgYW4gYXJnLCB3ZSBpbnRlcnByZXQgaXQgYXMgYW4gYXJyYXkgb2YgZW50cmllcyB0byBkZXN0cm95XG4gICAgICAgIGlmICghYXJyYXlPZlZhbHVlcylcbiAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgcmV0dXJuIHRoaXNbJ2Rlc3Ryb3knXShmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIHJldHVybiBrby51dGlscy5hcnJheUluZGV4T2YoYXJyYXlPZlZhbHVlcywgdmFsdWUpID49IDA7XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAnaW5kZXhPZic6IGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgIHZhciB1bmRlcmx5aW5nQXJyYXkgPSB0aGlzKCk7XG4gICAgICAgIHJldHVybiBrby51dGlscy5hcnJheUluZGV4T2YodW5kZXJseWluZ0FycmF5LCBpdGVtKTtcbiAgICB9LFxuXG4gICAgJ3JlcGxhY2UnOiBmdW5jdGlvbihvbGRJdGVtLCBuZXdJdGVtKSB7XG4gICAgICAgIHZhciBpbmRleCA9IHRoaXNbJ2luZGV4T2YnXShvbGRJdGVtKTtcbiAgICAgICAgaWYgKGluZGV4ID49IDApIHtcbiAgICAgICAgICAgIHRoaXMudmFsdWVXaWxsTXV0YXRlKCk7XG4gICAgICAgICAgICB0aGlzLnBlZWsoKVtpbmRleF0gPSBuZXdJdGVtO1xuICAgICAgICAgICAgdGhpcy52YWx1ZUhhc011dGF0ZWQoKTtcbiAgICAgICAgfVxuICAgIH1cbn07XG5cbi8vIFBvcHVsYXRlIGtvLm9ic2VydmFibGVBcnJheS5mbiB3aXRoIHJlYWQvd3JpdGUgZnVuY3Rpb25zIGZyb20gbmF0aXZlIGFycmF5c1xuLy8gSW1wb3J0YW50OiBEbyBub3QgYWRkIGFueSBhZGRpdGlvbmFsIGZ1bmN0aW9ucyBoZXJlIHRoYXQgbWF5IHJlYXNvbmFibHkgYmUgdXNlZCB0byAqcmVhZCogZGF0YSBmcm9tIHRoZSBhcnJheVxuLy8gYmVjYXVzZSB3ZSdsbCBldmFsIHRoZW0gd2l0aG91dCBjYXVzaW5nIHN1YnNjcmlwdGlvbnMsIHNvIGtvLmNvbXB1dGVkIG91dHB1dCBjb3VsZCBlbmQgdXAgZ2V0dGluZyBzdGFsZVxua28udXRpbHMuYXJyYXlGb3JFYWNoKFtcInBvcFwiLCBcInB1c2hcIiwgXCJyZXZlcnNlXCIsIFwic2hpZnRcIiwgXCJzb3J0XCIsIFwic3BsaWNlXCIsIFwidW5zaGlmdFwiXSwgZnVuY3Rpb24gKG1ldGhvZE5hbWUpIHtcbiAgICBrby5vYnNlcnZhYmxlQXJyYXlbJ2ZuJ11bbWV0aG9kTmFtZV0gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIC8vIFVzZSBcInBlZWtcIiB0byBhdm9pZCBjcmVhdGluZyBhIHN1YnNjcmlwdGlvbiBpbiBhbnkgY29tcHV0ZWQgdGhhdCB3ZSdyZSBleGVjdXRpbmcgaW4gdGhlIGNvbnRleHQgb2ZcbiAgICAgICAgLy8gKGZvciBjb25zaXN0ZW5jeSB3aXRoIG11dGF0aW5nIHJlZ3VsYXIgb2JzZXJ2YWJsZXMpXG4gICAgICAgIHZhciB1bmRlcmx5aW5nQXJyYXkgPSB0aGlzLnBlZWsoKTtcbiAgICAgICAgdGhpcy52YWx1ZVdpbGxNdXRhdGUoKTtcbiAgICAgICAgdmFyIG1ldGhvZENhbGxSZXN1bHQgPSB1bmRlcmx5aW5nQXJyYXlbbWV0aG9kTmFtZV0uYXBwbHkodW5kZXJseWluZ0FycmF5LCBhcmd1bWVudHMpO1xuICAgICAgICB0aGlzLnZhbHVlSGFzTXV0YXRlZCgpO1xuICAgICAgICByZXR1cm4gbWV0aG9kQ2FsbFJlc3VsdDtcbiAgICB9O1xufSk7XG5cbi8vIFBvcHVsYXRlIGtvLm9ic2VydmFibGVBcnJheS5mbiB3aXRoIHJlYWQtb25seSBmdW5jdGlvbnMgZnJvbSBuYXRpdmUgYXJyYXlzXG5rby51dGlscy5hcnJheUZvckVhY2goW1wic2xpY2VcIl0sIGZ1bmN0aW9uIChtZXRob2ROYW1lKSB7XG4gICAga28ub2JzZXJ2YWJsZUFycmF5WydmbiddW21ldGhvZE5hbWVdID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgdW5kZXJseWluZ0FycmF5ID0gdGhpcygpO1xuICAgICAgICByZXR1cm4gdW5kZXJseWluZ0FycmF5W21ldGhvZE5hbWVdLmFwcGx5KHVuZGVybHlpbmdBcnJheSwgYXJndW1lbnRzKTtcbiAgICB9O1xufSk7XG5cbmtvLmV4cG9ydFN5bWJvbCgnb2JzZXJ2YWJsZUFycmF5Jywga28ub2JzZXJ2YWJsZUFycmF5KTtcbmtvLmRlcGVuZGVudE9ic2VydmFibGUgPSBmdW5jdGlvbiAoZXZhbHVhdG9yRnVuY3Rpb25Pck9wdGlvbnMsIGV2YWx1YXRvckZ1bmN0aW9uVGFyZ2V0LCBvcHRpb25zKSB7XG4gICAgdmFyIF9sYXRlc3RWYWx1ZSxcbiAgICAgICAgX2hhc0JlZW5FdmFsdWF0ZWQgPSBmYWxzZSxcbiAgICAgICAgX2lzQmVpbmdFdmFsdWF0ZWQgPSBmYWxzZSxcbiAgICAgICAgcmVhZEZ1bmN0aW9uID0gZXZhbHVhdG9yRnVuY3Rpb25Pck9wdGlvbnM7XG5cbiAgICBpZiAocmVhZEZ1bmN0aW9uICYmIHR5cGVvZiByZWFkRnVuY3Rpb24gPT0gXCJvYmplY3RcIikge1xuICAgICAgICAvLyBTaW5nbGUtcGFyYW1ldGVyIHN5bnRheCAtIGV2ZXJ5dGhpbmcgaXMgb24gdGhpcyBcIm9wdGlvbnNcIiBwYXJhbVxuICAgICAgICBvcHRpb25zID0gcmVhZEZ1bmN0aW9uO1xuICAgICAgICByZWFkRnVuY3Rpb24gPSBvcHRpb25zW1wicmVhZFwiXTtcbiAgICB9IGVsc2Uge1xuICAgICAgICAvLyBNdWx0aS1wYXJhbWV0ZXIgc3ludGF4IC0gY29uc3RydWN0IHRoZSBvcHRpb25zIGFjY29yZGluZyB0byB0aGUgcGFyYW1zIHBhc3NlZFxuICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICAgICAgaWYgKCFyZWFkRnVuY3Rpb24pXG4gICAgICAgICAgICByZWFkRnVuY3Rpb24gPSBvcHRpb25zW1wicmVhZFwiXTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiByZWFkRnVuY3Rpb24gIT0gXCJmdW5jdGlvblwiKVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJQYXNzIGEgZnVuY3Rpb24gdGhhdCByZXR1cm5zIHRoZSB2YWx1ZSBvZiB0aGUga28uY29tcHV0ZWRcIik7XG5cbiAgICBmdW5jdGlvbiBhZGRTdWJzY3JpcHRpb25Ub0RlcGVuZGVuY3koc3Vic2NyaWJhYmxlKSB7XG4gICAgICAgIF9zdWJzY3JpcHRpb25zVG9EZXBlbmRlbmNpZXMucHVzaChzdWJzY3JpYmFibGUuc3Vic2NyaWJlKGV2YWx1YXRlUG9zc2libHlBc3luYykpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGRpc3Bvc2VBbGxTdWJzY3JpcHRpb25zVG9EZXBlbmRlbmNpZXMoKSB7XG4gICAgICAgIGtvLnV0aWxzLmFycmF5Rm9yRWFjaChfc3Vic2NyaXB0aW9uc1RvRGVwZW5kZW5jaWVzLCBmdW5jdGlvbiAoc3Vic2NyaXB0aW9uKSB7XG4gICAgICAgICAgICBzdWJzY3JpcHRpb24uZGlzcG9zZSgpO1xuICAgICAgICB9KTtcbiAgICAgICAgX3N1YnNjcmlwdGlvbnNUb0RlcGVuZGVuY2llcyA9IFtdO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGV2YWx1YXRlUG9zc2libHlBc3luYygpIHtcbiAgICAgICAgdmFyIHRocm90dGxlRXZhbHVhdGlvblRpbWVvdXQgPSBkZXBlbmRlbnRPYnNlcnZhYmxlWyd0aHJvdHRsZUV2YWx1YXRpb24nXTtcbiAgICAgICAgaWYgKHRocm90dGxlRXZhbHVhdGlvblRpbWVvdXQgJiYgdGhyb3R0bGVFdmFsdWF0aW9uVGltZW91dCA+PSAwKSB7XG4gICAgICAgICAgICBjbGVhclRpbWVvdXQoZXZhbHVhdGlvblRpbWVvdXRJbnN0YW5jZSk7XG4gICAgICAgICAgICBldmFsdWF0aW9uVGltZW91dEluc3RhbmNlID0gc2V0VGltZW91dChldmFsdWF0ZUltbWVkaWF0ZSwgdGhyb3R0bGVFdmFsdWF0aW9uVGltZW91dCk7XG4gICAgICAgIH0gZWxzZVxuICAgICAgICAgICAgZXZhbHVhdGVJbW1lZGlhdGUoKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBldmFsdWF0ZUltbWVkaWF0ZSgpIHtcbiAgICAgICAgaWYgKF9pc0JlaW5nRXZhbHVhdGVkKSB7XG4gICAgICAgICAgICAvLyBJZiB0aGUgZXZhbHVhdGlvbiBvZiBhIGtvLmNvbXB1dGVkIGNhdXNlcyBzaWRlIGVmZmVjdHMsIGl0J3MgcG9zc2libGUgdGhhdCBpdCB3aWxsIHRyaWdnZXIgaXRzIG93biByZS1ldmFsdWF0aW9uLlxuICAgICAgICAgICAgLy8gVGhpcyBpcyBub3QgZGVzaXJhYmxlIChpdCdzIGhhcmQgZm9yIGEgZGV2ZWxvcGVyIHRvIHJlYWxpc2UgYSBjaGFpbiBvZiBkZXBlbmRlbmNpZXMgbWlnaHQgY2F1c2UgdGhpcywgYW5kIHRoZXkgYWxtb3N0XG4gICAgICAgICAgICAvLyBjZXJ0YWlubHkgZGlkbid0IGludGVuZCBpbmZpbml0ZSByZS1ldmFsdWF0aW9ucykuIFNvLCBmb3IgcHJlZGljdGFiaWxpdHksIHdlIHNpbXBseSBwcmV2ZW50IGtvLmNvbXB1dGVkcyBmcm9tIGNhdXNpbmdcbiAgICAgICAgICAgIC8vIHRoZWlyIG93biByZS1ldmFsdWF0aW9uLiBGdXJ0aGVyIGRpc2N1c3Npb24gYXQgaHR0cHM6Ly9naXRodWIuY29tL1N0ZXZlU2FuZGVyc29uL2tub2Nrb3V0L3B1bGwvMzg3XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBEb24ndCBkaXNwb3NlIG9uIGZpcnN0IGV2YWx1YXRpb24sIGJlY2F1c2UgdGhlIFwiZGlzcG9zZVdoZW5cIiBjYWxsYmFjayBtaWdodFxuICAgICAgICAvLyBlLmcuLCBkaXNwb3NlIHdoZW4gdGhlIGFzc29jaWF0ZWQgRE9NIGVsZW1lbnQgaXNuJ3QgaW4gdGhlIGRvYywgYW5kIGl0J3Mgbm90XG4gICAgICAgIC8vIGdvaW5nIHRvIGJlIGluIHRoZSBkb2MgdW50aWwgKmFmdGVyKiB0aGUgZmlyc3QgZXZhbHVhdGlvblxuICAgICAgICBpZiAoX2hhc0JlZW5FdmFsdWF0ZWQgJiYgZGlzcG9zZVdoZW4oKSkge1xuICAgICAgICAgICAgZGlzcG9zZSgpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgX2lzQmVpbmdFdmFsdWF0ZWQgPSB0cnVlO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gSW5pdGlhbGx5LCB3ZSBhc3N1bWUgdGhhdCBub25lIG9mIHRoZSBzdWJzY3JpcHRpb25zIGFyZSBzdGlsbCBiZWluZyB1c2VkIChpLmUuLCBhbGwgYXJlIGNhbmRpZGF0ZXMgZm9yIGRpc3Bvc2FsKS5cbiAgICAgICAgICAgIC8vIFRoZW4sIGR1cmluZyBldmFsdWF0aW9uLCB3ZSBjcm9zcyBvZmYgYW55IHRoYXQgYXJlIGluIGZhY3Qgc3RpbGwgYmVpbmcgdXNlZC5cbiAgICAgICAgICAgIHZhciBkaXNwb3NhbENhbmRpZGF0ZXMgPSBrby51dGlscy5hcnJheU1hcChfc3Vic2NyaXB0aW9uc1RvRGVwZW5kZW5jaWVzLCBmdW5jdGlvbihpdGVtKSB7cmV0dXJuIGl0ZW0udGFyZ2V0O30pO1xuXG4gICAgICAgICAgICBrby5kZXBlbmRlbmN5RGV0ZWN0aW9uLmJlZ2luKGZ1bmN0aW9uKHN1YnNjcmliYWJsZSkge1xuICAgICAgICAgICAgICAgIHZhciBpbk9sZDtcbiAgICAgICAgICAgICAgICBpZiAoKGluT2xkID0ga28udXRpbHMuYXJyYXlJbmRleE9mKGRpc3Bvc2FsQ2FuZGlkYXRlcywgc3Vic2NyaWJhYmxlKSkgPj0gMClcbiAgICAgICAgICAgICAgICAgICAgZGlzcG9zYWxDYW5kaWRhdGVzW2luT2xkXSA9IHVuZGVmaW5lZDsgLy8gRG9uJ3Qgd2FudCB0byBkaXNwb3NlIHRoaXMgc3Vic2NyaXB0aW9uLCBhcyBpdCdzIHN0aWxsIGJlaW5nIHVzZWRcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIGFkZFN1YnNjcmlwdGlvblRvRGVwZW5kZW5jeShzdWJzY3JpYmFibGUpOyAvLyBCcmFuZCBuZXcgc3Vic2NyaXB0aW9uIC0gYWRkIGl0XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgdmFyIG5ld1ZhbHVlID0gcmVhZEZ1bmN0aW9uLmNhbGwoZXZhbHVhdG9yRnVuY3Rpb25UYXJnZXQpO1xuXG4gICAgICAgICAgICAvLyBGb3IgZWFjaCBzdWJzY3JpcHRpb24gbm8gbG9uZ2VyIGJlaW5nIHVzZWQsIHJlbW92ZSBpdCBmcm9tIHRoZSBhY3RpdmUgc3Vic2NyaXB0aW9ucyBsaXN0IGFuZCBkaXNwb3NlIGl0XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gZGlzcG9zYWxDYW5kaWRhdGVzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICAgICAgaWYgKGRpc3Bvc2FsQ2FuZGlkYXRlc1tpXSlcbiAgICAgICAgICAgICAgICAgICAgX3N1YnNjcmlwdGlvbnNUb0RlcGVuZGVuY2llcy5zcGxpY2UoaSwgMSlbMF0uZGlzcG9zZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgX2hhc0JlZW5FdmFsdWF0ZWQgPSB0cnVlO1xuXG4gICAgICAgICAgICBkZXBlbmRlbnRPYnNlcnZhYmxlW1wibm90aWZ5U3Vic2NyaWJlcnNcIl0oX2xhdGVzdFZhbHVlLCBcImJlZm9yZUNoYW5nZVwiKTtcblxuICAgICAgICAgICAgX2xhdGVzdFZhbHVlID0gbmV3VmFsdWU7XG4gICAgICAgICAgICBpZiAoREVCVUcpIGRlcGVuZGVudE9ic2VydmFibGUuX2xhdGVzdFZhbHVlID0gX2xhdGVzdFZhbHVlO1xuICAgICAgICAgICAgZGVwZW5kZW50T2JzZXJ2YWJsZVtcIm5vdGlmeVN1YnNjcmliZXJzXCJdKF9sYXRlc3RWYWx1ZSk7XG5cbiAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgIGtvLmRlcGVuZGVuY3lEZXRlY3Rpb24uZW5kKCk7XG4gICAgICAgICAgICBfaXNCZWluZ0V2YWx1YXRlZCA9IGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFfc3Vic2NyaXB0aW9uc1RvRGVwZW5kZW5jaWVzLmxlbmd0aClcbiAgICAgICAgICAgIGRpc3Bvc2UoKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBkZXBlbmRlbnRPYnNlcnZhYmxlKCkge1xuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygd3JpdGVGdW5jdGlvbiA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgLy8gV3JpdGluZyBhIHZhbHVlXG4gICAgICAgICAgICAgICAgd3JpdGVGdW5jdGlvbi5hcHBseShldmFsdWF0b3JGdW5jdGlvblRhcmdldCwgYXJndW1lbnRzKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IHdyaXRlIGEgdmFsdWUgdG8gYSBrby5jb21wdXRlZCB1bmxlc3MgeW91IHNwZWNpZnkgYSAnd3JpdGUnIG9wdGlvbi4gSWYgeW91IHdpc2ggdG8gcmVhZCB0aGUgY3VycmVudCB2YWx1ZSwgZG9uJ3QgcGFzcyBhbnkgcGFyYW1ldGVycy5cIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdGhpczsgLy8gUGVybWl0cyBjaGFpbmVkIGFzc2lnbm1lbnRzXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBSZWFkaW5nIHRoZSB2YWx1ZVxuICAgICAgICAgICAgaWYgKCFfaGFzQmVlbkV2YWx1YXRlZClcbiAgICAgICAgICAgICAgICBldmFsdWF0ZUltbWVkaWF0ZSgpO1xuICAgICAgICAgICAga28uZGVwZW5kZW5jeURldGVjdGlvbi5yZWdpc3RlckRlcGVuZGVuY3koZGVwZW5kZW50T2JzZXJ2YWJsZSk7XG4gICAgICAgICAgICByZXR1cm4gX2xhdGVzdFZhbHVlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGVlaygpIHtcbiAgICAgICAgaWYgKCFfaGFzQmVlbkV2YWx1YXRlZClcbiAgICAgICAgICAgIGV2YWx1YXRlSW1tZWRpYXRlKCk7XG4gICAgICAgIHJldHVybiBfbGF0ZXN0VmFsdWU7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaXNBY3RpdmUoKSB7XG4gICAgICAgIHJldHVybiAhX2hhc0JlZW5FdmFsdWF0ZWQgfHwgX3N1YnNjcmlwdGlvbnNUb0RlcGVuZGVuY2llcy5sZW5ndGggPiAwO1xuICAgIH1cblxuICAgIC8vIEJ5IGhlcmUsIFwib3B0aW9uc1wiIGlzIGFsd2F5cyBub24tbnVsbFxuICAgIHZhciB3cml0ZUZ1bmN0aW9uID0gb3B0aW9uc1tcIndyaXRlXCJdLFxuICAgICAgICBkaXNwb3NlV2hlbk5vZGVJc1JlbW92ZWQgPSBvcHRpb25zW1wiZGlzcG9zZVdoZW5Ob2RlSXNSZW1vdmVkXCJdIHx8IG9wdGlvbnMuZGlzcG9zZVdoZW5Ob2RlSXNSZW1vdmVkIHx8IG51bGwsXG4gICAgICAgIGRpc3Bvc2VXaGVuID0gb3B0aW9uc1tcImRpc3Bvc2VXaGVuXCJdIHx8IG9wdGlvbnMuZGlzcG9zZVdoZW4gfHwgZnVuY3Rpb24oKSB7IHJldHVybiBmYWxzZTsgfSxcbiAgICAgICAgZGlzcG9zZSA9IGRpc3Bvc2VBbGxTdWJzY3JpcHRpb25zVG9EZXBlbmRlbmNpZXMsXG4gICAgICAgIF9zdWJzY3JpcHRpb25zVG9EZXBlbmRlbmNpZXMgPSBbXSxcbiAgICAgICAgZXZhbHVhdGlvblRpbWVvdXRJbnN0YW5jZSA9IG51bGw7XG5cbiAgICBpZiAoIWV2YWx1YXRvckZ1bmN0aW9uVGFyZ2V0KVxuICAgICAgICBldmFsdWF0b3JGdW5jdGlvblRhcmdldCA9IG9wdGlvbnNbXCJvd25lclwiXTtcblxuICAgIGRlcGVuZGVudE9ic2VydmFibGUucGVlayA9IHBlZWs7XG4gICAgZGVwZW5kZW50T2JzZXJ2YWJsZS5nZXREZXBlbmRlbmNpZXNDb3VudCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIF9zdWJzY3JpcHRpb25zVG9EZXBlbmRlbmNpZXMubGVuZ3RoOyB9O1xuICAgIGRlcGVuZGVudE9ic2VydmFibGUuaGFzV3JpdGVGdW5jdGlvbiA9IHR5cGVvZiBvcHRpb25zW1wid3JpdGVcIl0gPT09IFwiZnVuY3Rpb25cIjtcbiAgICBkZXBlbmRlbnRPYnNlcnZhYmxlLmRpc3Bvc2UgPSBmdW5jdGlvbiAoKSB7IGRpc3Bvc2UoKTsgfTtcbiAgICBkZXBlbmRlbnRPYnNlcnZhYmxlLmlzQWN0aXZlID0gaXNBY3RpdmU7XG5cbiAgICBrby5zdWJzY3JpYmFibGUuY2FsbChkZXBlbmRlbnRPYnNlcnZhYmxlKTtcbiAgICBrby51dGlscy5leHRlbmQoZGVwZW5kZW50T2JzZXJ2YWJsZSwga28uZGVwZW5kZW50T2JzZXJ2YWJsZVsnZm4nXSk7XG5cbiAgICBrby5leHBvcnRQcm9wZXJ0eShkZXBlbmRlbnRPYnNlcnZhYmxlLCAncGVlaycsIGRlcGVuZGVudE9ic2VydmFibGUucGVlayk7XG4gICAga28uZXhwb3J0UHJvcGVydHkoZGVwZW5kZW50T2JzZXJ2YWJsZSwgJ2Rpc3Bvc2UnLCBkZXBlbmRlbnRPYnNlcnZhYmxlLmRpc3Bvc2UpO1xuICAgIGtvLmV4cG9ydFByb3BlcnR5KGRlcGVuZGVudE9ic2VydmFibGUsICdpc0FjdGl2ZScsIGRlcGVuZGVudE9ic2VydmFibGUuaXNBY3RpdmUpO1xuICAgIGtvLmV4cG9ydFByb3BlcnR5KGRlcGVuZGVudE9ic2VydmFibGUsICdnZXREZXBlbmRlbmNpZXNDb3VudCcsIGRlcGVuZGVudE9ic2VydmFibGUuZ2V0RGVwZW5kZW5jaWVzQ291bnQpO1xuXG4gICAgLy8gRXZhbHVhdGUsIHVubGVzcyBkZWZlckV2YWx1YXRpb24gaXMgdHJ1ZVxuICAgIGlmIChvcHRpb25zWydkZWZlckV2YWx1YXRpb24nXSAhPT0gdHJ1ZSlcbiAgICAgICAgZXZhbHVhdGVJbW1lZGlhdGUoKTtcblxuICAgIC8vIEJ1aWxkIFwiZGlzcG9zZVdoZW5Ob2RlSXNSZW1vdmVkXCIgYW5kIFwiZGlzcG9zZVdoZW5Ob2RlSXNSZW1vdmVkQ2FsbGJhY2tcIiBvcHRpb24gdmFsdWVzLlxuICAgIC8vIEJ1dCBza2lwIGlmIGlzQWN0aXZlIGlzIGZhbHNlICh0aGVyZSB3aWxsIG5ldmVyIGJlIGFueSBkZXBlbmRlbmNpZXMgdG8gZGlzcG9zZSkuXG4gICAgLy8gKE5vdGU6IFwiZGlzcG9zZVdoZW5Ob2RlSXNSZW1vdmVkXCIgb3B0aW9uIGJvdGggcHJvYWN0aXZlbHkgZGlzcG9zZXMgYXMgc29vbiBhcyB0aGUgbm9kZSBpcyByZW1vdmVkIHVzaW5nIGtvLnJlbW92ZU5vZGUoKSxcbiAgICAvLyBwbHVzIGFkZHMgYSBcImRpc3Bvc2VXaGVuXCIgY2FsbGJhY2sgdGhhdCwgb24gZWFjaCBldmFsdWF0aW9uLCBkaXNwb3NlcyBpZiB0aGUgbm9kZSB3YXMgcmVtb3ZlZCBieSBzb21lIG90aGVyIG1lYW5zLilcbiAgICBpZiAoZGlzcG9zZVdoZW5Ob2RlSXNSZW1vdmVkICYmIGlzQWN0aXZlKCkpIHtcbiAgICAgICAgZGlzcG9zZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAga28udXRpbHMuZG9tTm9kZURpc3Bvc2FsLnJlbW92ZURpc3Bvc2VDYWxsYmFjayhkaXNwb3NlV2hlbk5vZGVJc1JlbW92ZWQsIGRpc3Bvc2UpO1xuICAgICAgICAgICAgZGlzcG9zZUFsbFN1YnNjcmlwdGlvbnNUb0RlcGVuZGVuY2llcygpO1xuICAgICAgICB9O1xuICAgICAgICBrby51dGlscy5kb21Ob2RlRGlzcG9zYWwuYWRkRGlzcG9zZUNhbGxiYWNrKGRpc3Bvc2VXaGVuTm9kZUlzUmVtb3ZlZCwgZGlzcG9zZSk7XG4gICAgICAgIHZhciBleGlzdGluZ0Rpc3Bvc2VXaGVuRnVuY3Rpb24gPSBkaXNwb3NlV2hlbjtcbiAgICAgICAgZGlzcG9zZVdoZW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gIWtvLnV0aWxzLmRvbU5vZGVJc0F0dGFjaGVkVG9Eb2N1bWVudChkaXNwb3NlV2hlbk5vZGVJc1JlbW92ZWQpIHx8IGV4aXN0aW5nRGlzcG9zZVdoZW5GdW5jdGlvbigpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGRlcGVuZGVudE9ic2VydmFibGU7XG59O1xuXG5rby5pc0NvbXB1dGVkID0gZnVuY3Rpb24oaW5zdGFuY2UpIHtcbiAgICByZXR1cm4ga28uaGFzUHJvdG90eXBlKGluc3RhbmNlLCBrby5kZXBlbmRlbnRPYnNlcnZhYmxlKTtcbn07XG5cbnZhciBwcm90b1Byb3AgPSBrby5vYnNlcnZhYmxlLnByb3RvUHJvcGVydHk7IC8vID09IFwiX19rb19wcm90b19fXCJcbmtvLmRlcGVuZGVudE9ic2VydmFibGVbcHJvdG9Qcm9wXSA9IGtvLm9ic2VydmFibGU7XG5cbmtvLmRlcGVuZGVudE9ic2VydmFibGVbJ2ZuJ10gPSB7fTtcbmtvLmRlcGVuZGVudE9ic2VydmFibGVbJ2ZuJ11bcHJvdG9Qcm9wXSA9IGtvLmRlcGVuZGVudE9ic2VydmFibGU7XG5cbmtvLmV4cG9ydFN5bWJvbCgnZGVwZW5kZW50T2JzZXJ2YWJsZScsIGtvLmRlcGVuZGVudE9ic2VydmFibGUpO1xua28uZXhwb3J0U3ltYm9sKCdjb21wdXRlZCcsIGtvLmRlcGVuZGVudE9ic2VydmFibGUpOyAvLyBNYWtlIFwia28uY29tcHV0ZWRcIiBhbiBhbGlhcyBmb3IgXCJrby5kZXBlbmRlbnRPYnNlcnZhYmxlXCJcbmtvLmV4cG9ydFN5bWJvbCgnaXNDb21wdXRlZCcsIGtvLmlzQ29tcHV0ZWQpO1xuXG4oZnVuY3Rpb24oKSB7XG4gICAgdmFyIG1heE5lc3RlZE9ic2VydmFibGVEZXB0aCA9IDEwOyAvLyBFc2NhcGUgdGhlICh1bmxpa2VseSkgcGF0aGFsb2dpY2FsIGNhc2Ugd2hlcmUgYW4gb2JzZXJ2YWJsZSdzIGN1cnJlbnQgdmFsdWUgaXMgaXRzZWxmIChvciBzaW1pbGFyIHJlZmVyZW5jZSBjeWNsZSlcblxuICAgIGtvLnRvSlMgPSBmdW5jdGlvbihyb290T2JqZWN0KSB7XG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09IDApXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJXaGVuIGNhbGxpbmcga28udG9KUywgcGFzcyB0aGUgb2JqZWN0IHlvdSB3YW50IHRvIGNvbnZlcnQuXCIpO1xuXG4gICAgICAgIC8vIFdlIGp1c3QgdW53cmFwIGV2ZXJ5dGhpbmcgYXQgZXZlcnkgbGV2ZWwgaW4gdGhlIG9iamVjdCBncmFwaFxuICAgICAgICByZXR1cm4gbWFwSnNPYmplY3RHcmFwaChyb290T2JqZWN0LCBmdW5jdGlvbih2YWx1ZVRvTWFwKSB7XG4gICAgICAgICAgICAvLyBMb29wIGJlY2F1c2UgYW4gb2JzZXJ2YWJsZSdzIHZhbHVlIG1pZ2h0IGluIHR1cm4gYmUgYW5vdGhlciBvYnNlcnZhYmxlIHdyYXBwZXJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBrby5pc09ic2VydmFibGUodmFsdWVUb01hcCkgJiYgKGkgPCBtYXhOZXN0ZWRPYnNlcnZhYmxlRGVwdGgpOyBpKyspXG4gICAgICAgICAgICAgICAgdmFsdWVUb01hcCA9IHZhbHVlVG9NYXAoKTtcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZVRvTWFwO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAga28udG9KU09OID0gZnVuY3Rpb24ocm9vdE9iamVjdCwgcmVwbGFjZXIsIHNwYWNlKSB7ICAgICAvLyByZXBsYWNlciBhbmQgc3BhY2UgYXJlIG9wdGlvbmFsXG4gICAgICAgIHZhciBwbGFpbkphdmFTY3JpcHRPYmplY3QgPSBrby50b0pTKHJvb3RPYmplY3QpO1xuICAgICAgICByZXR1cm4ga28udXRpbHMuc3RyaW5naWZ5SnNvbihwbGFpbkphdmFTY3JpcHRPYmplY3QsIHJlcGxhY2VyLCBzcGFjZSk7XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIG1hcEpzT2JqZWN0R3JhcGgocm9vdE9iamVjdCwgbWFwSW5wdXRDYWxsYmFjaywgdmlzaXRlZE9iamVjdHMpIHtcbiAgICAgICAgdmlzaXRlZE9iamVjdHMgPSB2aXNpdGVkT2JqZWN0cyB8fCBuZXcgb2JqZWN0TG9va3VwKCk7XG5cbiAgICAgICAgcm9vdE9iamVjdCA9IG1hcElucHV0Q2FsbGJhY2socm9vdE9iamVjdCk7XG4gICAgICAgIHZhciBjYW5IYXZlUHJvcGVydGllcyA9ICh0eXBlb2Ygcm9vdE9iamVjdCA9PSBcIm9iamVjdFwiKSAmJiAocm9vdE9iamVjdCAhPT0gbnVsbCkgJiYgKHJvb3RPYmplY3QgIT09IHVuZGVmaW5lZCkgJiYgKCEocm9vdE9iamVjdCBpbnN0YW5jZW9mIERhdGUpKSAmJiAoIShyb290T2JqZWN0IGluc3RhbmNlb2YgU3RyaW5nKSkgJiYgKCEocm9vdE9iamVjdCBpbnN0YW5jZW9mIE51bWJlcikpICYmICghKHJvb3RPYmplY3QgaW5zdGFuY2VvZiBCb29sZWFuKSk7XG4gICAgICAgIGlmICghY2FuSGF2ZVByb3BlcnRpZXMpXG4gICAgICAgICAgICByZXR1cm4gcm9vdE9iamVjdDtcblxuICAgICAgICB2YXIgb3V0cHV0UHJvcGVydGllcyA9IHJvb3RPYmplY3QgaW5zdGFuY2VvZiBBcnJheSA/IFtdIDoge307XG4gICAgICAgIHZpc2l0ZWRPYmplY3RzLnNhdmUocm9vdE9iamVjdCwgb3V0cHV0UHJvcGVydGllcyk7XG5cbiAgICAgICAgdmlzaXRQcm9wZXJ0aWVzT3JBcnJheUVudHJpZXMocm9vdE9iamVjdCwgZnVuY3Rpb24oaW5kZXhlcikge1xuICAgICAgICAgICAgdmFyIHByb3BlcnR5VmFsdWUgPSBtYXBJbnB1dENhbGxiYWNrKHJvb3RPYmplY3RbaW5kZXhlcl0pO1xuXG4gICAgICAgICAgICBzd2l0Y2ggKHR5cGVvZiBwcm9wZXJ0eVZhbHVlKSB7XG4gICAgICAgICAgICAgICAgY2FzZSBcImJvb2xlYW5cIjpcbiAgICAgICAgICAgICAgICBjYXNlIFwibnVtYmVyXCI6XG4gICAgICAgICAgICAgICAgY2FzZSBcInN0cmluZ1wiOlxuICAgICAgICAgICAgICAgIGNhc2UgXCJmdW5jdGlvblwiOlxuICAgICAgICAgICAgICAgICAgICBvdXRwdXRQcm9wZXJ0aWVzW2luZGV4ZXJdID0gcHJvcGVydHlWYWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcIm9iamVjdFwiOlxuICAgICAgICAgICAgICAgIGNhc2UgXCJ1bmRlZmluZWRcIjpcbiAgICAgICAgICAgICAgICAgICAgdmFyIHByZXZpb3VzbHlNYXBwZWRWYWx1ZSA9IHZpc2l0ZWRPYmplY3RzLmdldChwcm9wZXJ0eVZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgb3V0cHV0UHJvcGVydGllc1tpbmRleGVyXSA9IChwcmV2aW91c2x5TWFwcGVkVmFsdWUgIT09IHVuZGVmaW5lZClcbiAgICAgICAgICAgICAgICAgICAgICAgID8gcHJldmlvdXNseU1hcHBlZFZhbHVlXG4gICAgICAgICAgICAgICAgICAgICAgICA6IG1hcEpzT2JqZWN0R3JhcGgocHJvcGVydHlWYWx1ZSwgbWFwSW5wdXRDYWxsYmFjaywgdmlzaXRlZE9iamVjdHMpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIG91dHB1dFByb3BlcnRpZXM7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdmlzaXRQcm9wZXJ0aWVzT3JBcnJheUVudHJpZXMocm9vdE9iamVjdCwgdmlzaXRvckNhbGxiYWNrKSB7XG4gICAgICAgIGlmIChyb290T2JqZWN0IGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcm9vdE9iamVjdC5sZW5ndGg7IGkrKylcbiAgICAgICAgICAgICAgICB2aXNpdG9yQ2FsbGJhY2soaSk7XG5cbiAgICAgICAgICAgIC8vIEZvciBhcnJheXMsIGFsc28gcmVzcGVjdCB0b0pTT04gcHJvcGVydHkgZm9yIGN1c3RvbSBtYXBwaW5ncyAoZml4ZXMgIzI3OClcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygcm9vdE9iamVjdFsndG9KU09OJ10gPT0gJ2Z1bmN0aW9uJylcbiAgICAgICAgICAgICAgICB2aXNpdG9yQ2FsbGJhY2soJ3RvSlNPTicpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZm9yICh2YXIgcHJvcGVydHlOYW1lIGluIHJvb3RPYmplY3QpIHtcbiAgICAgICAgICAgICAgICB2aXNpdG9yQ2FsbGJhY2socHJvcGVydHlOYW1lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBmdW5jdGlvbiBvYmplY3RMb29rdXAoKSB7XG4gICAgICAgIHRoaXMua2V5cyA9IFtdO1xuICAgICAgICB0aGlzLnZhbHVlcyA9IFtdO1xuICAgIH07XG5cbiAgICBvYmplY3RMb29rdXAucHJvdG90eXBlID0ge1xuICAgICAgICBjb25zdHJ1Y3Rvcjogb2JqZWN0TG9va3VwLFxuICAgICAgICBzYXZlOiBmdW5jdGlvbihrZXksIHZhbHVlKSB7XG4gICAgICAgICAgICB2YXIgZXhpc3RpbmdJbmRleCA9IGtvLnV0aWxzLmFycmF5SW5kZXhPZih0aGlzLmtleXMsIGtleSk7XG4gICAgICAgICAgICBpZiAoZXhpc3RpbmdJbmRleCA+PSAwKVxuICAgICAgICAgICAgICAgIHRoaXMudmFsdWVzW2V4aXN0aW5nSW5kZXhdID0gdmFsdWU7XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLmtleXMucHVzaChrZXkpO1xuICAgICAgICAgICAgICAgIHRoaXMudmFsdWVzLnB1c2godmFsdWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBnZXQ6IGZ1bmN0aW9uKGtleSkge1xuICAgICAgICAgICAgdmFyIGV4aXN0aW5nSW5kZXggPSBrby51dGlscy5hcnJheUluZGV4T2YodGhpcy5rZXlzLCBrZXkpO1xuICAgICAgICAgICAgcmV0dXJuIChleGlzdGluZ0luZGV4ID49IDApID8gdGhpcy52YWx1ZXNbZXhpc3RpbmdJbmRleF0gOiB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICB9O1xufSkoKTtcblxua28uZXhwb3J0U3ltYm9sKCd0b0pTJywga28udG9KUyk7XG5rby5leHBvcnRTeW1ib2woJ3RvSlNPTicsIGtvLnRvSlNPTik7XG4oZnVuY3Rpb24gKCkge1xuICAgIHZhciBoYXNEb21EYXRhRXhwYW5kb1Byb3BlcnR5ID0gJ19fa29fX2hhc0RvbURhdGFPcHRpb25WYWx1ZV9fJztcblxuICAgIC8vIE5vcm1hbGx5LCBTRUxFQ1QgZWxlbWVudHMgYW5kIHRoZWlyIE9QVElPTnMgY2FuIG9ubHkgdGFrZSB2YWx1ZSBvZiB0eXBlICdzdHJpbmcnIChiZWNhdXNlIHRoZSB2YWx1ZXNcbiAgICAvLyBhcmUgc3RvcmVkIG9uIERPTSBhdHRyaWJ1dGVzKS4ga28uc2VsZWN0RXh0ZW5zaW9ucyBwcm92aWRlcyBhIHdheSBmb3IgU0VMRUNUcy9PUFRJT05zIHRvIGhhdmUgdmFsdWVzXG4gICAgLy8gdGhhdCBhcmUgYXJiaXRyYXJ5IG9iamVjdHMuIFRoaXMgaXMgdmVyeSBjb252ZW5pZW50IHdoZW4gaW1wbGVtZW50aW5nIHRoaW5ncyBsaWtlIGNhc2NhZGluZyBkcm9wZG93bnMuXG4gICAga28uc2VsZWN0RXh0ZW5zaW9ucyA9IHtcbiAgICAgICAgcmVhZFZhbHVlIDogZnVuY3Rpb24oZWxlbWVudCkge1xuICAgICAgICAgICAgc3dpdGNoIChrby51dGlscy50YWdOYW1lTG93ZXIoZWxlbWVudCkpIHtcbiAgICAgICAgICAgICAgICBjYXNlICdvcHRpb24nOlxuICAgICAgICAgICAgICAgICAgICBpZiAoZWxlbWVudFtoYXNEb21EYXRhRXhwYW5kb1Byb3BlcnR5XSA9PT0gdHJ1ZSlcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBrby51dGlscy5kb21EYXRhLmdldChlbGVtZW50LCBrby5iaW5kaW5nSGFuZGxlcnMub3B0aW9ucy5vcHRpb25WYWx1ZURvbURhdGFLZXkpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4ga28udXRpbHMuaWVWZXJzaW9uIDw9IDdcbiAgICAgICAgICAgICAgICAgICAgICAgID8gKGVsZW1lbnQuZ2V0QXR0cmlidXRlTm9kZSgndmFsdWUnKSAmJiBlbGVtZW50LmdldEF0dHJpYnV0ZU5vZGUoJ3ZhbHVlJykuc3BlY2lmaWVkID8gZWxlbWVudC52YWx1ZSA6IGVsZW1lbnQudGV4dClcbiAgICAgICAgICAgICAgICAgICAgICAgIDogZWxlbWVudC52YWx1ZTtcbiAgICAgICAgICAgICAgICBjYXNlICdzZWxlY3QnOlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZWxlbWVudC5zZWxlY3RlZEluZGV4ID49IDAgPyBrby5zZWxlY3RFeHRlbnNpb25zLnJlYWRWYWx1ZShlbGVtZW50Lm9wdGlvbnNbZWxlbWVudC5zZWxlY3RlZEluZGV4XSkgOiB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGVsZW1lbnQudmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgd3JpdGVWYWx1ZTogZnVuY3Rpb24oZWxlbWVudCwgdmFsdWUpIHtcbiAgICAgICAgICAgIHN3aXRjaCAoa28udXRpbHMudGFnTmFtZUxvd2VyKGVsZW1lbnQpKSB7XG4gICAgICAgICAgICAgICAgY2FzZSAnb3B0aW9uJzpcbiAgICAgICAgICAgICAgICAgICAgc3dpdGNoKHR5cGVvZiB2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcInN0cmluZ1wiOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtvLnV0aWxzLmRvbURhdGEuc2V0KGVsZW1lbnQsIGtvLmJpbmRpbmdIYW5kbGVycy5vcHRpb25zLm9wdGlvblZhbHVlRG9tRGF0YUtleSwgdW5kZWZpbmVkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaGFzRG9tRGF0YUV4cGFuZG9Qcm9wZXJ0eSBpbiBlbGVtZW50KSB7IC8vIElFIDw9IDggdGhyb3dzIGVycm9ycyBpZiB5b3UgZGVsZXRlIG5vbi1leGlzdGVudCBwcm9wZXJ0aWVzIGZyb20gYSBET00gbm9kZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgZWxlbWVudFtoYXNEb21EYXRhRXhwYW5kb1Byb3BlcnR5XTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudC52YWx1ZSA9IHZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBTdG9yZSBhcmJpdHJhcnkgb2JqZWN0IHVzaW5nIERvbURhdGFcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBrby51dGlscy5kb21EYXRhLnNldChlbGVtZW50LCBrby5iaW5kaW5nSGFuZGxlcnMub3B0aW9ucy5vcHRpb25WYWx1ZURvbURhdGFLZXksIHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50W2hhc0RvbURhdGFFeHBhbmRvUHJvcGVydHldID0gdHJ1ZTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFNwZWNpYWwgdHJlYXRtZW50IG9mIG51bWJlcnMgaXMganVzdCBmb3IgYmFja3dhcmQgY29tcGF0aWJpbGl0eS4gS08gMS4yLjEgd3JvdGUgbnVtZXJpY2FsIHZhbHVlcyB0byBlbGVtZW50LnZhbHVlLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnQudmFsdWUgPSB0eXBlb2YgdmFsdWUgPT09IFwibnVtYmVyXCIgPyB2YWx1ZSA6IFwiXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAnc2VsZWN0JzpcbiAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlID09PSBcIlwiKVxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkKVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5zZWxlY3RlZEluZGV4ID0gLTE7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSBlbGVtZW50Lm9wdGlvbnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChrby5zZWxlY3RFeHRlbnNpb25zLnJlYWRWYWx1ZShlbGVtZW50Lm9wdGlvbnNbaV0pID09IHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5zZWxlY3RlZEluZGV4ID0gaTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAvLyBmb3IgZHJvcC1kb3duIHNlbGVjdCwgZW5zdXJlIGZpcnN0IGlzIHNlbGVjdGVkXG4gICAgICAgICAgICAgICAgICAgIGlmICghKGVsZW1lbnQuc2l6ZSA+IDEpICYmIGVsZW1lbnQuc2VsZWN0ZWRJbmRleCA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnQuc2VsZWN0ZWRJbmRleCA9IDA7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgaWYgKCh2YWx1ZSA9PT0gbnVsbCkgfHwgKHZhbHVlID09PSB1bmRlZmluZWQpKVxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSBcIlwiO1xuICAgICAgICAgICAgICAgICAgICBlbGVtZW50LnZhbHVlID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbn0pKCk7XG5cbmtvLmV4cG9ydFN5bWJvbCgnc2VsZWN0RXh0ZW5zaW9ucycsIGtvLnNlbGVjdEV4dGVuc2lvbnMpO1xua28uZXhwb3J0U3ltYm9sKCdzZWxlY3RFeHRlbnNpb25zLnJlYWRWYWx1ZScsIGtvLnNlbGVjdEV4dGVuc2lvbnMucmVhZFZhbHVlKTtcbmtvLmV4cG9ydFN5bWJvbCgnc2VsZWN0RXh0ZW5zaW9ucy53cml0ZVZhbHVlJywga28uc2VsZWN0RXh0ZW5zaW9ucy53cml0ZVZhbHVlKTtcbmtvLmV4cHJlc3Npb25SZXdyaXRpbmcgPSAoZnVuY3Rpb24gKCkge1xuICAgIHZhciByZXN0b3JlQ2FwdHVyZWRUb2tlbnNSZWdleCA9IC9cXEBrb190b2tlbl8oXFxkKylcXEAvZztcbiAgICB2YXIgamF2YVNjcmlwdFJlc2VydmVkV29yZHMgPSBbXCJ0cnVlXCIsIFwiZmFsc2VcIiwgXCJudWxsXCIsIFwidW5kZWZpbmVkXCJdO1xuXG4gICAgLy8gTWF0Y2hlcyBzb21ldGhpbmcgdGhhdCBjYW4gYmUgYXNzaWduZWQgdG8tLWVpdGhlciBhbiBpc29sYXRlZCBpZGVudGlmaWVyIG9yIHNvbWV0aGluZyBlbmRpbmcgd2l0aCBhIHByb3BlcnR5IGFjY2Vzc29yXG4gICAgLy8gVGhpcyBpcyBkZXNpZ25lZCB0byBiZSBzaW1wbGUgYW5kIGF2b2lkIGZhbHNlIG5lZ2F0aXZlcywgYnV0IGNvdWxkIHByb2R1Y2UgZmFsc2UgcG9zaXRpdmVzIChlLmcuLCBhK2IuYykuXG4gICAgdmFyIGphdmFTY3JpcHRBc3NpZ25tZW50VGFyZ2V0ID0gL14oPzpbJF9hLXpdWyRcXHddKnwoLispKFxcLlxccypbJF9hLXpdWyRcXHddKnxcXFsuK1xcXSkpJC9pO1xuXG4gICAgZnVuY3Rpb24gcmVzdG9yZVRva2VucyhzdHJpbmcsIHRva2Vucykge1xuICAgICAgICB2YXIgcHJldlZhbHVlID0gbnVsbDtcbiAgICAgICAgd2hpbGUgKHN0cmluZyAhPSBwcmV2VmFsdWUpIHsgLy8gS2VlcCByZXN0b3JpbmcgdG9rZW5zIHVudGlsIGl0IG5vIGxvbmdlciBtYWtlcyBhIGRpZmZlcmVuY2UgKHRoZXkgbWF5IGJlIG5lc3RlZClcbiAgICAgICAgICAgIHByZXZWYWx1ZSA9IHN0cmluZztcbiAgICAgICAgICAgIHN0cmluZyA9IHN0cmluZy5yZXBsYWNlKHJlc3RvcmVDYXB0dXJlZFRva2Vuc1JlZ2V4LCBmdW5jdGlvbiAobWF0Y2gsIHRva2VuSW5kZXgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdG9rZW5zW3Rva2VuSW5kZXhdO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHN0cmluZztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXRXcml0ZWFibGVWYWx1ZShleHByZXNzaW9uKSB7XG4gICAgICAgIGlmIChrby51dGlscy5hcnJheUluZGV4T2YoamF2YVNjcmlwdFJlc2VydmVkV29yZHMsIGtvLnV0aWxzLnN0cmluZ1RyaW0oZXhwcmVzc2lvbikudG9Mb3dlckNhc2UoKSkgPj0gMClcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgdmFyIG1hdGNoID0gZXhwcmVzc2lvbi5tYXRjaChqYXZhU2NyaXB0QXNzaWdubWVudFRhcmdldCk7XG4gICAgICAgIHJldHVybiBtYXRjaCA9PT0gbnVsbCA/IGZhbHNlIDogbWF0Y2hbMV0gPyAoJ09iamVjdCgnICsgbWF0Y2hbMV0gKyAnKScgKyBtYXRjaFsyXSkgOiBleHByZXNzaW9uO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGVuc3VyZVF1b3RlZChrZXkpIHtcbiAgICAgICAgdmFyIHRyaW1tZWRLZXkgPSBrby51dGlscy5zdHJpbmdUcmltKGtleSk7XG4gICAgICAgIHN3aXRjaCAodHJpbW1lZEtleS5sZW5ndGggJiYgdHJpbW1lZEtleS5jaGFyQXQoMCkpIHtcbiAgICAgICAgICAgIGNhc2UgXCInXCI6XG4gICAgICAgICAgICBjYXNlICdcIic6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGtleTtcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgcmV0dXJuIFwiJ1wiICsgdHJpbW1lZEtleSArIFwiJ1wiO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgYmluZGluZ1Jld3JpdGVWYWxpZGF0b3JzOiBbXSxcblxuICAgICAgICBwYXJzZU9iamVjdExpdGVyYWw6IGZ1bmN0aW9uKG9iamVjdExpdGVyYWxTdHJpbmcpIHtcbiAgICAgICAgICAgIC8vIEEgZnVsbCB0b2tlbmlzZXIrbGV4ZXIgd291bGQgYWRkIHRvbyBtdWNoIHdlaWdodCB0byB0aGlzIGxpYnJhcnksIHNvIGhlcmUncyBhIHNpbXBsZSBwYXJzZXJcbiAgICAgICAgICAgIC8vIHRoYXQgaXMgc3VmZmljaWVudCBqdXN0IHRvIHNwbGl0IGFuIG9iamVjdCBsaXRlcmFsIHN0cmluZyBpbnRvIGEgc2V0IG9mIHRvcC1sZXZlbCBrZXktdmFsdWUgcGFpcnNcblxuICAgICAgICAgICAgdmFyIHN0ciA9IGtvLnV0aWxzLnN0cmluZ1RyaW0ob2JqZWN0TGl0ZXJhbFN0cmluZyk7XG4gICAgICAgICAgICBpZiAoc3RyLmxlbmd0aCA8IDMpXG4gICAgICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICAgICAgaWYgKHN0ci5jaGFyQXQoMCkgPT09IFwie1wiKS8vIElnbm9yZSBhbnkgYnJhY2VzIHN1cnJvdW5kaW5nIHRoZSB3aG9sZSBvYmplY3QgbGl0ZXJhbFxuICAgICAgICAgICAgICAgIHN0ciA9IHN0ci5zdWJzdHJpbmcoMSwgc3RyLmxlbmd0aCAtIDEpO1xuXG4gICAgICAgICAgICAvLyBQdWxsIG91dCBhbnkgc3RyaW5nIGxpdGVyYWxzIGFuZCByZWdleCBsaXRlcmFsc1xuICAgICAgICAgICAgdmFyIHRva2VucyA9IFtdO1xuICAgICAgICAgICAgdmFyIHRva2VuU3RhcnQgPSBudWxsLCB0b2tlbkVuZENoYXI7XG4gICAgICAgICAgICBmb3IgKHZhciBwb3NpdGlvbiA9IDA7IHBvc2l0aW9uIDwgc3RyLmxlbmd0aDsgcG9zaXRpb24rKykge1xuICAgICAgICAgICAgICAgIHZhciBjID0gc3RyLmNoYXJBdChwb3NpdGlvbik7XG4gICAgICAgICAgICAgICAgaWYgKHRva2VuU3RhcnQgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgc3dpdGNoIChjKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdcIic6XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwiJ1wiOlxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcIi9cIjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b2tlblN0YXJ0ID0gcG9zaXRpb247XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdG9rZW5FbmRDaGFyID0gYztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoKGMgPT0gdG9rZW5FbmRDaGFyKSAmJiAoc3RyLmNoYXJBdChwb3NpdGlvbiAtIDEpICE9PSBcIlxcXFxcIikpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRva2VuID0gc3RyLnN1YnN0cmluZyh0b2tlblN0YXJ0LCBwb3NpdGlvbiArIDEpO1xuICAgICAgICAgICAgICAgICAgICB0b2tlbnMucHVzaCh0b2tlbik7XG4gICAgICAgICAgICAgICAgICAgIHZhciByZXBsYWNlbWVudCA9IFwiQGtvX3Rva2VuX1wiICsgKHRva2Vucy5sZW5ndGggLSAxKSArIFwiQFwiO1xuICAgICAgICAgICAgICAgICAgICBzdHIgPSBzdHIuc3Vic3RyaW5nKDAsIHRva2VuU3RhcnQpICsgcmVwbGFjZW1lbnQgKyBzdHIuc3Vic3RyaW5nKHBvc2l0aW9uICsgMSk7XG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uIC09ICh0b2tlbi5sZW5ndGggLSByZXBsYWNlbWVudC5sZW5ndGgpO1xuICAgICAgICAgICAgICAgICAgICB0b2tlblN0YXJ0ID0gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIE5leHQgcHVsbCBvdXQgYmFsYW5jZWQgcGFyZW4sIGJyYWNlLCBhbmQgYnJhY2tldCBibG9ja3NcbiAgICAgICAgICAgIHRva2VuU3RhcnQgPSBudWxsO1xuICAgICAgICAgICAgdG9rZW5FbmRDaGFyID0gbnVsbDtcbiAgICAgICAgICAgIHZhciB0b2tlbkRlcHRoID0gMCwgdG9rZW5TdGFydENoYXIgPSBudWxsO1xuICAgICAgICAgICAgZm9yICh2YXIgcG9zaXRpb24gPSAwOyBwb3NpdGlvbiA8IHN0ci5sZW5ndGg7IHBvc2l0aW9uKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgYyA9IHN0ci5jaGFyQXQocG9zaXRpb24pO1xuICAgICAgICAgICAgICAgIGlmICh0b2tlblN0YXJ0ID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIHN3aXRjaCAoYykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcIntcIjogdG9rZW5TdGFydCA9IHBvc2l0aW9uOyB0b2tlblN0YXJ0Q2hhciA9IGM7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdG9rZW5FbmRDaGFyID0gXCJ9XCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwiKFwiOiB0b2tlblN0YXJ0ID0gcG9zaXRpb247IHRva2VuU3RhcnRDaGFyID0gYztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b2tlbkVuZENoYXIgPSBcIilcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJbXCI6IHRva2VuU3RhcnQgPSBwb3NpdGlvbjsgdG9rZW5TdGFydENoYXIgPSBjO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRva2VuRW5kQ2hhciA9IFwiXVwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGMgPT09IHRva2VuU3RhcnRDaGFyKVxuICAgICAgICAgICAgICAgICAgICB0b2tlbkRlcHRoKys7XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoYyA9PT0gdG9rZW5FbmRDaGFyKSB7XG4gICAgICAgICAgICAgICAgICAgIHRva2VuRGVwdGgtLTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRva2VuRGVwdGggPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0b2tlbiA9IHN0ci5zdWJzdHJpbmcodG9rZW5TdGFydCwgcG9zaXRpb24gKyAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRva2Vucy5wdXNoKHRva2VuKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciByZXBsYWNlbWVudCA9IFwiQGtvX3Rva2VuX1wiICsgKHRva2Vucy5sZW5ndGggLSAxKSArIFwiQFwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RyID0gc3RyLnN1YnN0cmluZygwLCB0b2tlblN0YXJ0KSArIHJlcGxhY2VtZW50ICsgc3RyLnN1YnN0cmluZyhwb3NpdGlvbiArIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcG9zaXRpb24gLT0gKHRva2VuLmxlbmd0aCAtIHJlcGxhY2VtZW50Lmxlbmd0aCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0b2tlblN0YXJ0ID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gTm93IHdlIGNhbiBzYWZlbHkgc3BsaXQgb24gY29tbWFzIHRvIGdldCB0aGUga2V5L3ZhbHVlIHBhaXJzXG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gW107XG4gICAgICAgICAgICB2YXIga2V5VmFsdWVQYWlycyA9IHN0ci5zcGxpdChcIixcIik7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgaiA9IGtleVZhbHVlUGFpcnMubGVuZ3RoOyBpIDwgajsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIHBhaXIgPSBrZXlWYWx1ZVBhaXJzW2ldO1xuICAgICAgICAgICAgICAgIHZhciBjb2xvblBvcyA9IHBhaXIuaW5kZXhPZihcIjpcIik7XG4gICAgICAgICAgICAgICAgaWYgKChjb2xvblBvcyA+IDApICYmIChjb2xvblBvcyA8IHBhaXIubGVuZ3RoIC0gMSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGtleSA9IHBhaXIuc3Vic3RyaW5nKDAsIGNvbG9uUG9zKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHZhbHVlID0gcGFpci5zdWJzdHJpbmcoY29sb25Qb3MgKyAxKTtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goeyAna2V5JzogcmVzdG9yZVRva2VucyhrZXksIHRva2VucyksICd2YWx1ZSc6IHJlc3RvcmVUb2tlbnModmFsdWUsIHRva2VucykgfSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goeyAndW5rbm93bic6IHJlc3RvcmVUb2tlbnMocGFpciwgdG9rZW5zKSB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9LFxuXG4gICAgICAgIHByZVByb2Nlc3NCaW5kaW5nczogZnVuY3Rpb24gKG9iamVjdExpdGVyYWxTdHJpbmdPcktleVZhbHVlQXJyYXkpIHtcbiAgICAgICAgICAgIHZhciBrZXlWYWx1ZUFycmF5ID0gdHlwZW9mIG9iamVjdExpdGVyYWxTdHJpbmdPcktleVZhbHVlQXJyYXkgPT09IFwic3RyaW5nXCJcbiAgICAgICAgICAgICAgICA/IGtvLmV4cHJlc3Npb25SZXdyaXRpbmcucGFyc2VPYmplY3RMaXRlcmFsKG9iamVjdExpdGVyYWxTdHJpbmdPcktleVZhbHVlQXJyYXkpXG4gICAgICAgICAgICAgICAgOiBvYmplY3RMaXRlcmFsU3RyaW5nT3JLZXlWYWx1ZUFycmF5O1xuICAgICAgICAgICAgdmFyIHJlc3VsdFN0cmluZ3MgPSBbXSwgcHJvcGVydHlBY2Nlc3NvclJlc3VsdFN0cmluZ3MgPSBbXTtcblxuICAgICAgICAgICAgdmFyIGtleVZhbHVlRW50cnk7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsga2V5VmFsdWVFbnRyeSA9IGtleVZhbHVlQXJyYXlbaV07IGkrKykge1xuICAgICAgICAgICAgICAgIGlmIChyZXN1bHRTdHJpbmdzLmxlbmd0aCA+IDApXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdFN0cmluZ3MucHVzaChcIixcIik7XG5cbiAgICAgICAgICAgICAgICBpZiAoa2V5VmFsdWVFbnRyeVsna2V5J10pIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHF1b3RlZEtleSA9IGVuc3VyZVF1b3RlZChrZXlWYWx1ZUVudHJ5WydrZXknXSksIHZhbCA9IGtleVZhbHVlRW50cnlbJ3ZhbHVlJ107XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdFN0cmluZ3MucHVzaChxdW90ZWRLZXkpO1xuICAgICAgICAgICAgICAgICAgICByZXN1bHRTdHJpbmdzLnB1c2goXCI6XCIpO1xuICAgICAgICAgICAgICAgICAgICByZXN1bHRTdHJpbmdzLnB1c2godmFsKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAodmFsID0gZ2V0V3JpdGVhYmxlVmFsdWUoa28udXRpbHMuc3RyaW5nVHJpbSh2YWwpKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHByb3BlcnR5QWNjZXNzb3JSZXN1bHRTdHJpbmdzLmxlbmd0aCA+IDApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydHlBY2Nlc3NvclJlc3VsdFN0cmluZ3MucHVzaChcIiwgXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydHlBY2Nlc3NvclJlc3VsdFN0cmluZ3MucHVzaChxdW90ZWRLZXkgKyBcIiA6IGZ1bmN0aW9uKF9fa29fdmFsdWUpIHsgXCIgKyB2YWwgKyBcIiA9IF9fa29fdmFsdWU7IH1cIik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGtleVZhbHVlRW50cnlbJ3Vua25vd24nXSkge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHRTdHJpbmdzLnB1c2goa2V5VmFsdWVFbnRyeVsndW5rbm93biddKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBjb21iaW5lZFJlc3VsdCA9IHJlc3VsdFN0cmluZ3Muam9pbihcIlwiKTtcbiAgICAgICAgICAgIGlmIChwcm9wZXJ0eUFjY2Vzc29yUmVzdWx0U3RyaW5ncy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgdmFyIGFsbFByb3BlcnR5QWNjZXNzb3JzID0gcHJvcGVydHlBY2Nlc3NvclJlc3VsdFN0cmluZ3Muam9pbihcIlwiKTtcbiAgICAgICAgICAgICAgICBjb21iaW5lZFJlc3VsdCA9IGNvbWJpbmVkUmVzdWx0ICsgXCIsICdfa29fcHJvcGVydHlfd3JpdGVycycgOiB7IFwiICsgYWxsUHJvcGVydHlBY2Nlc3NvcnMgKyBcIiB9IFwiO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gY29tYmluZWRSZXN1bHQ7XG4gICAgICAgIH0sXG5cbiAgICAgICAga2V5VmFsdWVBcnJheUNvbnRhaW5zS2V5OiBmdW5jdGlvbihrZXlWYWx1ZUFycmF5LCBrZXkpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwga2V5VmFsdWVBcnJheS5sZW5ndGg7IGkrKylcbiAgICAgICAgICAgICAgICBpZiAoa28udXRpbHMuc3RyaW5nVHJpbShrZXlWYWx1ZUFycmF5W2ldWydrZXknXSkgPT0ga2V5KVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSxcblxuICAgICAgICAvLyBJbnRlcm5hbCwgcHJpdmF0ZSBLTyB1dGlsaXR5IGZvciB1cGRhdGluZyBtb2RlbCBwcm9wZXJ0aWVzIGZyb20gd2l0aGluIGJpbmRpbmdzXG4gICAgICAgIC8vIHByb3BlcnR5OiAgICAgICAgICAgIElmIHRoZSBwcm9wZXJ0eSBiZWluZyB1cGRhdGVkIGlzIChvciBtaWdodCBiZSkgYW4gb2JzZXJ2YWJsZSwgcGFzcyBpdCBoZXJlXG4gICAgICAgIC8vICAgICAgICAgICAgICAgICAgICAgIElmIGl0IHR1cm5zIG91dCB0byBiZSBhIHdyaXRhYmxlIG9ic2VydmFibGUsIGl0IHdpbGwgYmUgd3JpdHRlbiB0byBkaXJlY3RseVxuICAgICAgICAvLyBhbGxCaW5kaW5nc0FjY2Vzc29yOiBBbGwgYmluZGluZ3MgaW4gdGhlIGN1cnJlbnQgZXhlY3V0aW9uIGNvbnRleHQuXG4gICAgICAgIC8vICAgICAgICAgICAgICAgICAgICAgIFRoaXMgd2lsbCBiZSBzZWFyY2hlZCBmb3IgYSAnX2tvX3Byb3BlcnR5X3dyaXRlcnMnIHByb3BlcnR5IGluIGNhc2UgeW91J3JlIHdyaXRpbmcgdG8gYSBub24tb2JzZXJ2YWJsZVxuICAgICAgICAvLyBrZXk6ICAgICAgICAgICAgICAgICBUaGUga2V5IGlkZW50aWZ5aW5nIHRoZSBwcm9wZXJ0eSB0byBiZSB3cml0dGVuLiBFeGFtcGxlOiBmb3IgeyBoYXNGb2N1czogbXlWYWx1ZSB9LCB3cml0ZSB0byAnbXlWYWx1ZScgYnkgc3BlY2lmeWluZyB0aGUga2V5ICdoYXNGb2N1cydcbiAgICAgICAgLy8gdmFsdWU6ICAgICAgICAgICAgICAgVGhlIHZhbHVlIHRvIGJlIHdyaXR0ZW5cbiAgICAgICAgLy8gY2hlY2tJZkRpZmZlcmVudDogICAgSWYgdHJ1ZSwgYW5kIGlmIHRoZSBwcm9wZXJ0eSBiZWluZyB3cml0dGVuIGlzIGEgd3JpdGFibGUgb2JzZXJ2YWJsZSwgdGhlIHZhbHVlIHdpbGwgb25seSBiZSB3cml0dGVuIGlmXG4gICAgICAgIC8vICAgICAgICAgICAgICAgICAgICAgIGl0IGlzICE9PSBleGlzdGluZyB2YWx1ZSBvbiB0aGF0IHdyaXRhYmxlIG9ic2VydmFibGVcbiAgICAgICAgd3JpdGVWYWx1ZVRvUHJvcGVydHk6IGZ1bmN0aW9uKHByb3BlcnR5LCBhbGxCaW5kaW5nc0FjY2Vzc29yLCBrZXksIHZhbHVlLCBjaGVja0lmRGlmZmVyZW50KSB7XG4gICAgICAgICAgICBpZiAoIXByb3BlcnR5IHx8ICFrby5pc09ic2VydmFibGUocHJvcGVydHkpKSB7XG4gICAgICAgICAgICAgICAgdmFyIHByb3BXcml0ZXJzID0gYWxsQmluZGluZ3NBY2Nlc3NvcigpWydfa29fcHJvcGVydHlfd3JpdGVycyddO1xuICAgICAgICAgICAgICAgIGlmIChwcm9wV3JpdGVycyAmJiBwcm9wV3JpdGVyc1trZXldKVxuICAgICAgICAgICAgICAgICAgICBwcm9wV3JpdGVyc1trZXldKHZhbHVlKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoa28uaXNXcml0ZWFibGVPYnNlcnZhYmxlKHByb3BlcnR5KSAmJiAoIWNoZWNrSWZEaWZmZXJlbnQgfHwgcHJvcGVydHkucGVlaygpICE9PSB2YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICBwcm9wZXJ0eSh2YWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xufSkoKTtcblxua28uZXhwb3J0U3ltYm9sKCdleHByZXNzaW9uUmV3cml0aW5nJywga28uZXhwcmVzc2lvblJld3JpdGluZyk7XG5rby5leHBvcnRTeW1ib2woJ2V4cHJlc3Npb25SZXdyaXRpbmcuYmluZGluZ1Jld3JpdGVWYWxpZGF0b3JzJywga28uZXhwcmVzc2lvblJld3JpdGluZy5iaW5kaW5nUmV3cml0ZVZhbGlkYXRvcnMpO1xua28uZXhwb3J0U3ltYm9sKCdleHByZXNzaW9uUmV3cml0aW5nLnBhcnNlT2JqZWN0TGl0ZXJhbCcsIGtvLmV4cHJlc3Npb25SZXdyaXRpbmcucGFyc2VPYmplY3RMaXRlcmFsKTtcbmtvLmV4cG9ydFN5bWJvbCgnZXhwcmVzc2lvblJld3JpdGluZy5wcmVQcm9jZXNzQmluZGluZ3MnLCBrby5leHByZXNzaW9uUmV3cml0aW5nLnByZVByb2Nlc3NCaW5kaW5ncyk7XG5cbi8vIEZvciBiYWNrd2FyZCBjb21wYXRpYmlsaXR5LCBkZWZpbmUgdGhlIGZvbGxvd2luZyBhbGlhc2VzLiAoUHJldmlvdXNseSwgdGhlc2UgZnVuY3Rpb24gbmFtZXMgd2VyZSBtaXNsZWFkaW5nIGJlY2F1c2Vcbi8vIHRoZXkgcmVmZXJyZWQgdG8gSlNPTiBzcGVjaWZpY2FsbHksIGV2ZW4gdGhvdWdoIHRoZXkgYWN0dWFsbHkgd29yayB3aXRoIGFyYml0cmFyeSBKYXZhU2NyaXB0IG9iamVjdCBsaXRlcmFsIGV4cHJlc3Npb25zLilcbmtvLmV4cG9ydFN5bWJvbCgnanNvbkV4cHJlc3Npb25SZXdyaXRpbmcnLCBrby5leHByZXNzaW9uUmV3cml0aW5nKTtcbmtvLmV4cG9ydFN5bWJvbCgnanNvbkV4cHJlc3Npb25SZXdyaXRpbmcuaW5zZXJ0UHJvcGVydHlBY2Nlc3NvcnNJbnRvSnNvbicsIGtvLmV4cHJlc3Npb25SZXdyaXRpbmcucHJlUHJvY2Vzc0JpbmRpbmdzKTsoZnVuY3Rpb24oKSB7XG4gICAgLy8gXCJWaXJ0dWFsIGVsZW1lbnRzXCIgaXMgYW4gYWJzdHJhY3Rpb24gb24gdG9wIG9mIHRoZSB1c3VhbCBET00gQVBJIHdoaWNoIHVuZGVyc3RhbmRzIHRoZSBub3Rpb24gdGhhdCBjb21tZW50IG5vZGVzXG4gICAgLy8gbWF5IGJlIHVzZWQgdG8gcmVwcmVzZW50IGhpZXJhcmNoeSAoaW4gYWRkaXRpb24gdG8gdGhlIERPTSdzIG5hdHVyYWwgaGllcmFyY2h5KS5cbiAgICAvLyBJZiB5b3UgY2FsbCB0aGUgRE9NLW1hbmlwdWxhdGluZyBmdW5jdGlvbnMgb24ga28udmlydHVhbEVsZW1lbnRzLCB5b3Ugd2lsbCBiZSBhYmxlIHRvIHJlYWQgYW5kIHdyaXRlIHRoZSBzdGF0ZVxuICAgIC8vIG9mIHRoYXQgdmlydHVhbCBoaWVyYXJjaHlcbiAgICAvL1xuICAgIC8vIFRoZSBwb2ludCBvZiBhbGwgdGhpcyBpcyB0byBzdXBwb3J0IGNvbnRhaW5lcmxlc3MgdGVtcGxhdGVzIChlLmcuLCA8IS0tIGtvIGZvcmVhY2g6c29tZUNvbGxlY3Rpb24gLS0+YmxhaDwhLS0gL2tvIC0tPilcbiAgICAvLyB3aXRob3V0IGhhdmluZyB0byBzY2F0dGVyIHNwZWNpYWwgY2FzZXMgYWxsIG92ZXIgdGhlIGJpbmRpbmcgYW5kIHRlbXBsYXRpbmcgY29kZS5cblxuICAgIC8vIElFIDkgY2Fubm90IHJlbGlhYmx5IHJlYWQgdGhlIFwibm9kZVZhbHVlXCIgcHJvcGVydHkgb2YgYSBjb21tZW50IG5vZGUgKHNlZSBodHRwczovL2dpdGh1Yi5jb20vU3RldmVTYW5kZXJzb24va25vY2tvdXQvaXNzdWVzLzE4NilcbiAgICAvLyBidXQgaXQgZG9lcyBnaXZlIHRoZW0gYSBub25zdGFuZGFyZCBhbHRlcm5hdGl2ZSBwcm9wZXJ0eSBjYWxsZWQgXCJ0ZXh0XCIgdGhhdCBpdCBjYW4gcmVhZCByZWxpYWJseS4gT3RoZXIgYnJvd3NlcnMgZG9uJ3QgaGF2ZSB0aGF0IHByb3BlcnR5LlxuICAgIC8vIFNvLCB1c2Ugbm9kZS50ZXh0IHdoZXJlIGF2YWlsYWJsZSwgYW5kIG5vZGUubm9kZVZhbHVlIGVsc2V3aGVyZVxuICAgIHZhciBjb21tZW50Tm9kZXNIYXZlVGV4dFByb3BlcnR5ID0gZG9jdW1lbnQgJiYgZG9jdW1lbnQuY3JlYXRlQ29tbWVudChcInRlc3RcIikudGV4dCA9PT0gXCI8IS0tdGVzdC0tPlwiO1xuXG4gICAgdmFyIHN0YXJ0Q29tbWVudFJlZ2V4ID0gY29tbWVudE5vZGVzSGF2ZVRleHRQcm9wZXJ0eSA/IC9ePCEtLVxccyprbyg/OlxccysoLitcXHMqXFw6W1xcc1xcU10qKSk/XFxzKi0tPiQvIDogL15cXHMqa28oPzpcXHMrKC4rXFxzKlxcOltcXHNcXFNdKikpP1xccyokLztcbiAgICB2YXIgZW5kQ29tbWVudFJlZ2V4ID0gICBjb21tZW50Tm9kZXNIYXZlVGV4dFByb3BlcnR5ID8gL148IS0tXFxzKlxcL2tvXFxzKi0tPiQvIDogL15cXHMqXFwva29cXHMqJC87XG4gICAgdmFyIGh0bWxUYWdzV2l0aE9wdGlvbmFsbHlDbG9zaW5nQ2hpbGRyZW4gPSB7ICd1bCc6IHRydWUsICdvbCc6IHRydWUgfTtcblxuICAgIGZ1bmN0aW9uIGlzU3RhcnRDb21tZW50KG5vZGUpIHtcbiAgICAgICAgcmV0dXJuIChub2RlLm5vZGVUeXBlID09IDgpICYmIChjb21tZW50Tm9kZXNIYXZlVGV4dFByb3BlcnR5ID8gbm9kZS50ZXh0IDogbm9kZS5ub2RlVmFsdWUpLm1hdGNoKHN0YXJ0Q29tbWVudFJlZ2V4KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpc0VuZENvbW1lbnQobm9kZSkge1xuICAgICAgICByZXR1cm4gKG5vZGUubm9kZVR5cGUgPT0gOCkgJiYgKGNvbW1lbnROb2Rlc0hhdmVUZXh0UHJvcGVydHkgPyBub2RlLnRleHQgOiBub2RlLm5vZGVWYWx1ZSkubWF0Y2goZW5kQ29tbWVudFJlZ2V4KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXRWaXJ0dWFsQ2hpbGRyZW4oc3RhcnRDb21tZW50LCBhbGxvd1VuYmFsYW5jZWQpIHtcbiAgICAgICAgdmFyIGN1cnJlbnROb2RlID0gc3RhcnRDb21tZW50O1xuICAgICAgICB2YXIgZGVwdGggPSAxO1xuICAgICAgICB2YXIgY2hpbGRyZW4gPSBbXTtcbiAgICAgICAgd2hpbGUgKGN1cnJlbnROb2RlID0gY3VycmVudE5vZGUubmV4dFNpYmxpbmcpIHtcbiAgICAgICAgICAgIGlmIChpc0VuZENvbW1lbnQoY3VycmVudE5vZGUpKSB7XG4gICAgICAgICAgICAgICAgZGVwdGgtLTtcbiAgICAgICAgICAgICAgICBpZiAoZGVwdGggPT09IDApXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjaGlsZHJlbjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY2hpbGRyZW4ucHVzaChjdXJyZW50Tm9kZSk7XG5cbiAgICAgICAgICAgIGlmIChpc1N0YXJ0Q29tbWVudChjdXJyZW50Tm9kZSkpXG4gICAgICAgICAgICAgICAgZGVwdGgrKztcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWFsbG93VW5iYWxhbmNlZClcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIGNsb3NpbmcgY29tbWVudCB0YWcgdG8gbWF0Y2g6IFwiICsgc3RhcnRDb21tZW50Lm5vZGVWYWx1ZSk7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldE1hdGNoaW5nRW5kQ29tbWVudChzdGFydENvbW1lbnQsIGFsbG93VW5iYWxhbmNlZCkge1xuICAgICAgICB2YXIgYWxsVmlydHVhbENoaWxkcmVuID0gZ2V0VmlydHVhbENoaWxkcmVuKHN0YXJ0Q29tbWVudCwgYWxsb3dVbmJhbGFuY2VkKTtcbiAgICAgICAgaWYgKGFsbFZpcnR1YWxDaGlsZHJlbikge1xuICAgICAgICAgICAgaWYgKGFsbFZpcnR1YWxDaGlsZHJlbi5sZW5ndGggPiAwKVxuICAgICAgICAgICAgICAgIHJldHVybiBhbGxWaXJ0dWFsQ2hpbGRyZW5bYWxsVmlydHVhbENoaWxkcmVuLmxlbmd0aCAtIDFdLm5leHRTaWJsaW5nO1xuICAgICAgICAgICAgcmV0dXJuIHN0YXJ0Q29tbWVudC5uZXh0U2libGluZztcbiAgICAgICAgfSBlbHNlXG4gICAgICAgICAgICByZXR1cm4gbnVsbDsgLy8gTXVzdCBoYXZlIG5vIG1hdGNoaW5nIGVuZCBjb21tZW50LCBhbmQgYWxsb3dVbmJhbGFuY2VkIGlzIHRydWVcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXRVbmJhbGFuY2VkQ2hpbGRUYWdzKG5vZGUpIHtcbiAgICAgICAgLy8gZS5nLiwgZnJvbSA8ZGl2Pk9LPC9kaXY+PCEtLSBrbyBibGFoIC0tPjxzcGFuPkFub3RoZXI8L3NwYW4+LCByZXR1cm5zOiA8IS0tIGtvIGJsYWggLS0+PHNwYW4+QW5vdGhlcjwvc3Bhbj5cbiAgICAgICAgLy8gICAgICAgZnJvbSA8ZGl2Pk9LPC9kaXY+PCEtLSAva28gLS0+PCEtLSAva28gLS0+LCAgICAgICAgICAgICByZXR1cm5zOiA8IS0tIC9rbyAtLT48IS0tIC9rbyAtLT5cbiAgICAgICAgdmFyIGNoaWxkTm9kZSA9IG5vZGUuZmlyc3RDaGlsZCwgY2FwdHVyZVJlbWFpbmluZyA9IG51bGw7XG4gICAgICAgIGlmIChjaGlsZE5vZGUpIHtcbiAgICAgICAgICAgIGRvIHtcbiAgICAgICAgICAgICAgICBpZiAoY2FwdHVyZVJlbWFpbmluZykgICAgICAgICAgICAgICAgICAgLy8gV2UgYWxyZWFkeSBoaXQgYW4gdW5iYWxhbmNlZCBub2RlIGFuZCBhcmUgbm93IGp1c3Qgc2Nvb3BpbmcgdXAgYWxsIHN1YnNlcXVlbnQgbm9kZXNcbiAgICAgICAgICAgICAgICAgICAgY2FwdHVyZVJlbWFpbmluZy5wdXNoKGNoaWxkTm9kZSk7XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoaXNTdGFydENvbW1lbnQoY2hpbGROb2RlKSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgbWF0Y2hpbmdFbmRDb21tZW50ID0gZ2V0TWF0Y2hpbmdFbmRDb21tZW50KGNoaWxkTm9kZSwgLyogYWxsb3dVbmJhbGFuY2VkOiAqLyB0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG1hdGNoaW5nRW5kQ29tbWVudCkgICAgICAgICAgICAgLy8gSXQncyBhIGJhbGFuY2VkIHRhZywgc28gc2tpcCBpbW1lZGlhdGVseSB0byB0aGUgZW5kIG9mIHRoaXMgdmlydHVhbCBzZXRcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkTm9kZSA9IG1hdGNoaW5nRW5kQ29tbWVudDtcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgY2FwdHVyZVJlbWFpbmluZyA9IFtjaGlsZE5vZGVdOyAvLyBJdCdzIHVuYmFsYW5jZWQsIHNvIHN0YXJ0IGNhcHR1cmluZyBmcm9tIHRoaXMgcG9pbnRcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGlzRW5kQ29tbWVudChjaGlsZE5vZGUpKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhcHR1cmVSZW1haW5pbmcgPSBbY2hpbGROb2RlXTsgICAgIC8vIEl0J3MgdW5iYWxhbmNlZCAoaWYgaXQgd2Fzbid0LCB3ZSdkIGhhdmUgc2tpcHBlZCBvdmVyIGl0IGFscmVhZHkpLCBzbyBzdGFydCBjYXB0dXJpbmdcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IHdoaWxlIChjaGlsZE5vZGUgPSBjaGlsZE5vZGUubmV4dFNpYmxpbmcpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjYXB0dXJlUmVtYWluaW5nO1xuICAgIH1cblxuICAgIGtvLnZpcnR1YWxFbGVtZW50cyA9IHtcbiAgICAgICAgYWxsb3dlZEJpbmRpbmdzOiB7fSxcblxuICAgICAgICBjaGlsZE5vZGVzOiBmdW5jdGlvbihub2RlKSB7XG4gICAgICAgICAgICByZXR1cm4gaXNTdGFydENvbW1lbnQobm9kZSkgPyBnZXRWaXJ0dWFsQ2hpbGRyZW4obm9kZSkgOiBub2RlLmNoaWxkTm9kZXM7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZW1wdHlOb2RlOiBmdW5jdGlvbihub2RlKSB7XG4gICAgICAgICAgICBpZiAoIWlzU3RhcnRDb21tZW50KG5vZGUpKVxuICAgICAgICAgICAgICAgIGtvLnV0aWxzLmVtcHR5RG9tTm9kZShub2RlKTtcbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHZhciB2aXJ0dWFsQ2hpbGRyZW4gPSBrby52aXJ0dWFsRWxlbWVudHMuY2hpbGROb2Rlcyhub2RlKTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgaiA9IHZpcnR1YWxDaGlsZHJlbi5sZW5ndGg7IGkgPCBqOyBpKyspXG4gICAgICAgICAgICAgICAgICAgIGtvLnJlbW92ZU5vZGUodmlydHVhbENoaWxkcmVuW2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBzZXREb21Ob2RlQ2hpbGRyZW46IGZ1bmN0aW9uKG5vZGUsIGNoaWxkTm9kZXMpIHtcbiAgICAgICAgICAgIGlmICghaXNTdGFydENvbW1lbnQobm9kZSkpXG4gICAgICAgICAgICAgICAga28udXRpbHMuc2V0RG9tTm9kZUNoaWxkcmVuKG5vZGUsIGNoaWxkTm9kZXMpO1xuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAga28udmlydHVhbEVsZW1lbnRzLmVtcHR5Tm9kZShub2RlKTtcbiAgICAgICAgICAgICAgICB2YXIgZW5kQ29tbWVudE5vZGUgPSBub2RlLm5leHRTaWJsaW5nOyAvLyBNdXN0IGJlIHRoZSBuZXh0IHNpYmxpbmcsIGFzIHdlIGp1c3QgZW1wdGllZCB0aGUgY2hpbGRyZW5cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgaiA9IGNoaWxkTm9kZXMubGVuZ3RoOyBpIDwgajsgaSsrKVxuICAgICAgICAgICAgICAgICAgICBlbmRDb21tZW50Tm9kZS5wYXJlbnROb2RlLmluc2VydEJlZm9yZShjaGlsZE5vZGVzW2ldLCBlbmRDb21tZW50Tm9kZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgcHJlcGVuZDogZnVuY3Rpb24oY29udGFpbmVyTm9kZSwgbm9kZVRvUHJlcGVuZCkge1xuICAgICAgICAgICAgaWYgKCFpc1N0YXJ0Q29tbWVudChjb250YWluZXJOb2RlKSkge1xuICAgICAgICAgICAgICAgIGlmIChjb250YWluZXJOb2RlLmZpcnN0Q2hpbGQpXG4gICAgICAgICAgICAgICAgICAgIGNvbnRhaW5lck5vZGUuaW5zZXJ0QmVmb3JlKG5vZGVUb1ByZXBlbmQsIGNvbnRhaW5lck5vZGUuZmlyc3RDaGlsZCk7XG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBjb250YWluZXJOb2RlLmFwcGVuZENoaWxkKG5vZGVUb1ByZXBlbmQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBTdGFydCBjb21tZW50cyBtdXN0IGFsd2F5cyBoYXZlIGEgcGFyZW50IGFuZCBhdCBsZWFzdCBvbmUgZm9sbG93aW5nIHNpYmxpbmcgKHRoZSBlbmQgY29tbWVudClcbiAgICAgICAgICAgICAgICBjb250YWluZXJOb2RlLnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKG5vZGVUb1ByZXBlbmQsIGNvbnRhaW5lck5vZGUubmV4dFNpYmxpbmcpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIGluc2VydEFmdGVyOiBmdW5jdGlvbihjb250YWluZXJOb2RlLCBub2RlVG9JbnNlcnQsIGluc2VydEFmdGVyTm9kZSkge1xuICAgICAgICAgICAgaWYgKCFpbnNlcnRBZnRlck5vZGUpIHtcbiAgICAgICAgICAgICAgICBrby52aXJ0dWFsRWxlbWVudHMucHJlcGVuZChjb250YWluZXJOb2RlLCBub2RlVG9JbnNlcnQpO1xuICAgICAgICAgICAgfSBlbHNlIGlmICghaXNTdGFydENvbW1lbnQoY29udGFpbmVyTm9kZSkpIHtcbiAgICAgICAgICAgICAgICAvLyBJbnNlcnQgYWZ0ZXIgaW5zZXJ0aW9uIHBvaW50XG4gICAgICAgICAgICAgICAgaWYgKGluc2VydEFmdGVyTm9kZS5uZXh0U2libGluZylcbiAgICAgICAgICAgICAgICAgICAgY29udGFpbmVyTm9kZS5pbnNlcnRCZWZvcmUobm9kZVRvSW5zZXJ0LCBpbnNlcnRBZnRlck5vZGUubmV4dFNpYmxpbmcpO1xuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgY29udGFpbmVyTm9kZS5hcHBlbmRDaGlsZChub2RlVG9JbnNlcnQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBDaGlsZHJlbiBvZiBzdGFydCBjb21tZW50cyBtdXN0IGFsd2F5cyBoYXZlIGEgcGFyZW50IGFuZCBhdCBsZWFzdCBvbmUgZm9sbG93aW5nIHNpYmxpbmcgKHRoZSBlbmQgY29tbWVudClcbiAgICAgICAgICAgICAgICBjb250YWluZXJOb2RlLnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKG5vZGVUb0luc2VydCwgaW5zZXJ0QWZ0ZXJOb2RlLm5leHRTaWJsaW5nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBmaXJzdENoaWxkOiBmdW5jdGlvbihub2RlKSB7XG4gICAgICAgICAgICBpZiAoIWlzU3RhcnRDb21tZW50KG5vZGUpKVxuICAgICAgICAgICAgICAgIHJldHVybiBub2RlLmZpcnN0Q2hpbGQ7XG4gICAgICAgICAgICBpZiAoIW5vZGUubmV4dFNpYmxpbmcgfHwgaXNFbmRDb21tZW50KG5vZGUubmV4dFNpYmxpbmcpKVxuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgcmV0dXJuIG5vZGUubmV4dFNpYmxpbmc7XG4gICAgICAgIH0sXG5cbiAgICAgICAgbmV4dFNpYmxpbmc6IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgICAgICAgIGlmIChpc1N0YXJ0Q29tbWVudChub2RlKSlcbiAgICAgICAgICAgICAgICBub2RlID0gZ2V0TWF0Y2hpbmdFbmRDb21tZW50KG5vZGUpO1xuICAgICAgICAgICAgaWYgKG5vZGUubmV4dFNpYmxpbmcgJiYgaXNFbmRDb21tZW50KG5vZGUubmV4dFNpYmxpbmcpKVxuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgcmV0dXJuIG5vZGUubmV4dFNpYmxpbmc7XG4gICAgICAgIH0sXG5cbiAgICAgICAgdmlydHVhbE5vZGVCaW5kaW5nVmFsdWU6IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgICAgICAgIHZhciByZWdleE1hdGNoID0gaXNTdGFydENvbW1lbnQobm9kZSk7XG4gICAgICAgICAgICByZXR1cm4gcmVnZXhNYXRjaCA/IHJlZ2V4TWF0Y2hbMV0gOiBudWxsO1xuICAgICAgICB9LFxuXG4gICAgICAgIG5vcm1hbGlzZVZpcnR1YWxFbGVtZW50RG9tU3RydWN0dXJlOiBmdW5jdGlvbihlbGVtZW50VmVyaWZpZWQpIHtcbiAgICAgICAgICAgIC8vIFdvcmthcm91bmQgZm9yIGh0dHBzOi8vZ2l0aHViLmNvbS9TdGV2ZVNhbmRlcnNvbi9rbm9ja291dC9pc3N1ZXMvMTU1XG4gICAgICAgICAgICAvLyAoSUUgPD0gOCBvciBJRSA5IHF1aXJrcyBtb2RlIHBhcnNlcyB5b3VyIEhUTUwgd2VpcmRseSwgdHJlYXRpbmcgY2xvc2luZyA8L2xpPiB0YWdzIGFzIGlmIHRoZXkgZG9uJ3QgZXhpc3QsIHRoZXJlYnkgbW92aW5nIGNvbW1lbnQgbm9kZXNcbiAgICAgICAgICAgIC8vIHRoYXQgYXJlIGRpcmVjdCBkZXNjZW5kYW50cyBvZiA8dWw+IGludG8gdGhlIHByZWNlZGluZyA8bGk+KVxuICAgICAgICAgICAgaWYgKCFodG1sVGFnc1dpdGhPcHRpb25hbGx5Q2xvc2luZ0NoaWxkcmVuW2tvLnV0aWxzLnRhZ05hbWVMb3dlcihlbGVtZW50VmVyaWZpZWQpXSlcbiAgICAgICAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgICAgIC8vIFNjYW4gaW1tZWRpYXRlIGNoaWxkcmVuIHRvIHNlZSBpZiB0aGV5IGNvbnRhaW4gdW5iYWxhbmNlZCBjb21tZW50IHRhZ3MuIElmIHRoZXkgZG8sIHRob3NlIGNvbW1lbnQgdGFnc1xuICAgICAgICAgICAgLy8gbXVzdCBiZSBpbnRlbmRlZCB0byBhcHBlYXIgKmFmdGVyKiB0aGF0IGNoaWxkLCBzbyBtb3ZlIHRoZW0gdGhlcmUuXG4gICAgICAgICAgICB2YXIgY2hpbGROb2RlID0gZWxlbWVudFZlcmlmaWVkLmZpcnN0Q2hpbGQ7XG4gICAgICAgICAgICBpZiAoY2hpbGROb2RlKSB7XG4gICAgICAgICAgICAgICAgZG8ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoY2hpbGROb2RlLm5vZGVUeXBlID09PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdW5iYWxhbmNlZFRhZ3MgPSBnZXRVbmJhbGFuY2VkQ2hpbGRUYWdzKGNoaWxkTm9kZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodW5iYWxhbmNlZFRhZ3MpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBGaXggdXAgdGhlIERPTSBieSBtb3ZpbmcgdGhlIHVuYmFsYW5jZWQgdGFncyB0byB3aGVyZSB0aGV5IG1vc3QgbGlrZWx5IHdlcmUgaW50ZW5kZWQgdG8gYmUgcGxhY2VkIC0gKmFmdGVyKiB0aGUgY2hpbGRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgbm9kZVRvSW5zZXJ0QmVmb3JlID0gY2hpbGROb2RlLm5leHRTaWJsaW5nO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdW5iYWxhbmNlZFRhZ3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG5vZGVUb0luc2VydEJlZm9yZSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnRWZXJpZmllZC5pbnNlcnRCZWZvcmUodW5iYWxhbmNlZFRhZ3NbaV0sIG5vZGVUb0luc2VydEJlZm9yZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnRWZXJpZmllZC5hcHBlbmRDaGlsZCh1bmJhbGFuY2VkVGFnc1tpXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSB3aGlsZSAoY2hpbGROb2RlID0gY2hpbGROb2RlLm5leHRTaWJsaW5nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG59KSgpO1xua28uZXhwb3J0U3ltYm9sKCd2aXJ0dWFsRWxlbWVudHMnLCBrby52aXJ0dWFsRWxlbWVudHMpO1xua28uZXhwb3J0U3ltYm9sKCd2aXJ0dWFsRWxlbWVudHMuYWxsb3dlZEJpbmRpbmdzJywga28udmlydHVhbEVsZW1lbnRzLmFsbG93ZWRCaW5kaW5ncyk7XG5rby5leHBvcnRTeW1ib2woJ3ZpcnR1YWxFbGVtZW50cy5lbXB0eU5vZGUnLCBrby52aXJ0dWFsRWxlbWVudHMuZW1wdHlOb2RlKTtcbi8va28uZXhwb3J0U3ltYm9sKCd2aXJ0dWFsRWxlbWVudHMuZmlyc3RDaGlsZCcsIGtvLnZpcnR1YWxFbGVtZW50cy5maXJzdENoaWxkKTsgICAgIC8vIGZpcnN0Q2hpbGQgaXMgbm90IG1pbmlmaWVkXG5rby5leHBvcnRTeW1ib2woJ3ZpcnR1YWxFbGVtZW50cy5pbnNlcnRBZnRlcicsIGtvLnZpcnR1YWxFbGVtZW50cy5pbnNlcnRBZnRlcik7XG4vL2tvLmV4cG9ydFN5bWJvbCgndmlydHVhbEVsZW1lbnRzLm5leHRTaWJsaW5nJywga28udmlydHVhbEVsZW1lbnRzLm5leHRTaWJsaW5nKTsgICAvLyBuZXh0U2libGluZyBpcyBub3QgbWluaWZpZWRcbmtvLmV4cG9ydFN5bWJvbCgndmlydHVhbEVsZW1lbnRzLnByZXBlbmQnLCBrby52aXJ0dWFsRWxlbWVudHMucHJlcGVuZCk7XG5rby5leHBvcnRTeW1ib2woJ3ZpcnR1YWxFbGVtZW50cy5zZXREb21Ob2RlQ2hpbGRyZW4nLCBrby52aXJ0dWFsRWxlbWVudHMuc2V0RG9tTm9kZUNoaWxkcmVuKTtcbihmdW5jdGlvbigpIHtcbiAgICB2YXIgZGVmYXVsdEJpbmRpbmdBdHRyaWJ1dGVOYW1lID0gXCJkYXRhLWJpbmRcIjtcblxuICAgIGtvLmJpbmRpbmdQcm92aWRlciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLmJpbmRpbmdDYWNoZSA9IHt9O1xuICAgIH07XG5cbiAgICBrby51dGlscy5leHRlbmQoa28uYmluZGluZ1Byb3ZpZGVyLnByb3RvdHlwZSwge1xuICAgICAgICAnbm9kZUhhc0JpbmRpbmdzJzogZnVuY3Rpb24obm9kZSkge1xuICAgICAgICAgICAgc3dpdGNoIChub2RlLm5vZGVUeXBlKSB7XG4gICAgICAgICAgICAgICAgY2FzZSAxOiByZXR1cm4gbm9kZS5nZXRBdHRyaWJ1dGUoZGVmYXVsdEJpbmRpbmdBdHRyaWJ1dGVOYW1lKSAhPSBudWxsOyAgIC8vIEVsZW1lbnRcbiAgICAgICAgICAgICAgICBjYXNlIDg6IHJldHVybiBrby52aXJ0dWFsRWxlbWVudHMudmlydHVhbE5vZGVCaW5kaW5nVmFsdWUobm9kZSkgIT0gbnVsbDsgLy8gQ29tbWVudCBub2RlXG4gICAgICAgICAgICAgICAgZGVmYXVsdDogcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgICdnZXRCaW5kaW5ncyc6IGZ1bmN0aW9uKG5vZGUsIGJpbmRpbmdDb250ZXh0KSB7XG4gICAgICAgICAgICB2YXIgYmluZGluZ3NTdHJpbmcgPSB0aGlzWydnZXRCaW5kaW5nc1N0cmluZyddKG5vZGUsIGJpbmRpbmdDb250ZXh0KTtcbiAgICAgICAgICAgIHJldHVybiBiaW5kaW5nc1N0cmluZyA/IHRoaXNbJ3BhcnNlQmluZGluZ3NTdHJpbmcnXShiaW5kaW5nc1N0cmluZywgYmluZGluZ0NvbnRleHQsIG5vZGUpIDogbnVsbDtcbiAgICAgICAgfSxcblxuICAgICAgICAvLyBUaGUgZm9sbG93aW5nIGZ1bmN0aW9uIGlzIG9ubHkgdXNlZCBpbnRlcm5hbGx5IGJ5IHRoaXMgZGVmYXVsdCBwcm92aWRlci5cbiAgICAgICAgLy8gSXQncyBub3QgcGFydCBvZiB0aGUgaW50ZXJmYWNlIGRlZmluaXRpb24gZm9yIGEgZ2VuZXJhbCBiaW5kaW5nIHByb3ZpZGVyLlxuICAgICAgICAnZ2V0QmluZGluZ3NTdHJpbmcnOiBmdW5jdGlvbihub2RlLCBiaW5kaW5nQ29udGV4dCkge1xuICAgICAgICAgICAgc3dpdGNoIChub2RlLm5vZGVUeXBlKSB7XG4gICAgICAgICAgICAgICAgY2FzZSAxOiByZXR1cm4gbm9kZS5nZXRBdHRyaWJ1dGUoZGVmYXVsdEJpbmRpbmdBdHRyaWJ1dGVOYW1lKTsgICAvLyBFbGVtZW50XG4gICAgICAgICAgICAgICAgY2FzZSA4OiByZXR1cm4ga28udmlydHVhbEVsZW1lbnRzLnZpcnR1YWxOb2RlQmluZGluZ1ZhbHVlKG5vZGUpOyAvLyBDb21tZW50IG5vZGVcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICAvLyBUaGUgZm9sbG93aW5nIGZ1bmN0aW9uIGlzIG9ubHkgdXNlZCBpbnRlcm5hbGx5IGJ5IHRoaXMgZGVmYXVsdCBwcm92aWRlci5cbiAgICAgICAgLy8gSXQncyBub3QgcGFydCBvZiB0aGUgaW50ZXJmYWNlIGRlZmluaXRpb24gZm9yIGEgZ2VuZXJhbCBiaW5kaW5nIHByb3ZpZGVyLlxuICAgICAgICAncGFyc2VCaW5kaW5nc1N0cmluZyc6IGZ1bmN0aW9uKGJpbmRpbmdzU3RyaW5nLCBiaW5kaW5nQ29udGV4dCwgbm9kZSkge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICB2YXIgYmluZGluZ0Z1bmN0aW9uID0gY3JlYXRlQmluZGluZ3NTdHJpbmdFdmFsdWF0b3JWaWFDYWNoZShiaW5kaW5nc1N0cmluZywgdGhpcy5iaW5kaW5nQ2FjaGUpO1xuICAgICAgICAgICAgICAgIHJldHVybiBiaW5kaW5nRnVuY3Rpb24oYmluZGluZ0NvbnRleHQsIG5vZGUpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgICAgICAgICAgICBleC5tZXNzYWdlID0gXCJVbmFibGUgdG8gcGFyc2UgYmluZGluZ3MuXFxuQmluZGluZ3MgdmFsdWU6IFwiICsgYmluZGluZ3NTdHJpbmcgKyBcIlxcbk1lc3NhZ2U6IFwiICsgZXgubWVzc2FnZTtcbiAgICAgICAgICAgICAgICB0aHJvdyBleDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAga28uYmluZGluZ1Byb3ZpZGVyWydpbnN0YW5jZSddID0gbmV3IGtvLmJpbmRpbmdQcm92aWRlcigpO1xuXG4gICAgZnVuY3Rpb24gY3JlYXRlQmluZGluZ3NTdHJpbmdFdmFsdWF0b3JWaWFDYWNoZShiaW5kaW5nc1N0cmluZywgY2FjaGUpIHtcbiAgICAgICAgdmFyIGNhY2hlS2V5ID0gYmluZGluZ3NTdHJpbmc7XG4gICAgICAgIHJldHVybiBjYWNoZVtjYWNoZUtleV1cbiAgICAgICAgICAgIHx8IChjYWNoZVtjYWNoZUtleV0gPSBjcmVhdGVCaW5kaW5nc1N0cmluZ0V2YWx1YXRvcihiaW5kaW5nc1N0cmluZykpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNyZWF0ZUJpbmRpbmdzU3RyaW5nRXZhbHVhdG9yKGJpbmRpbmdzU3RyaW5nKSB7XG4gICAgICAgIC8vIEJ1aWxkIHRoZSBzb3VyY2UgZm9yIGEgZnVuY3Rpb24gdGhhdCBldmFsdWF0ZXMgXCJleHByZXNzaW9uXCJcbiAgICAgICAgLy8gRm9yIGVhY2ggc2NvcGUgdmFyaWFibGUsIGFkZCBhbiBleHRyYSBsZXZlbCBvZiBcIndpdGhcIiBuZXN0aW5nXG4gICAgICAgIC8vIEV4YW1wbGUgcmVzdWx0OiB3aXRoKHNjMSkgeyB3aXRoKHNjMCkgeyByZXR1cm4gKGV4cHJlc3Npb24pIH0gfVxuICAgICAgICB2YXIgcmV3cml0dGVuQmluZGluZ3MgPSBrby5leHByZXNzaW9uUmV3cml0aW5nLnByZVByb2Nlc3NCaW5kaW5ncyhiaW5kaW5nc1N0cmluZyksXG4gICAgICAgICAgICBmdW5jdGlvbkJvZHkgPSBcIndpdGgoJGNvbnRleHQpe3dpdGgoJGRhdGF8fHt9KXtyZXR1cm57XCIgKyByZXdyaXR0ZW5CaW5kaW5ncyArIFwifX19XCI7XG4gICAgICAgIHJldHVybiBuZXcgRnVuY3Rpb24oXCIkY29udGV4dFwiLCBcIiRlbGVtZW50XCIsIGZ1bmN0aW9uQm9keSk7XG4gICAgfVxufSkoKTtcblxua28uZXhwb3J0U3ltYm9sKCdiaW5kaW5nUHJvdmlkZXInLCBrby5iaW5kaW5nUHJvdmlkZXIpO1xuKGZ1bmN0aW9uICgpIHtcbiAgICBrby5iaW5kaW5nSGFuZGxlcnMgPSB7fTtcblxuICAgIGtvLmJpbmRpbmdDb250ZXh0ID0gZnVuY3Rpb24oZGF0YUl0ZW0sIHBhcmVudEJpbmRpbmdDb250ZXh0LCBkYXRhSXRlbUFsaWFzKSB7XG4gICAgICAgIGlmIChwYXJlbnRCaW5kaW5nQ29udGV4dCkge1xuICAgICAgICAgICAga28udXRpbHMuZXh0ZW5kKHRoaXMsIHBhcmVudEJpbmRpbmdDb250ZXh0KTsgLy8gSW5oZXJpdCAkcm9vdCBhbmQgYW55IGN1c3RvbSBwcm9wZXJ0aWVzXG4gICAgICAgICAgICB0aGlzWyckcGFyZW50Q29udGV4dCddID0gcGFyZW50QmluZGluZ0NvbnRleHQ7XG4gICAgICAgICAgICB0aGlzWyckcGFyZW50J10gPSBwYXJlbnRCaW5kaW5nQ29udGV4dFsnJGRhdGEnXTtcbiAgICAgICAgICAgIHRoaXNbJyRwYXJlbnRzJ10gPSAocGFyZW50QmluZGluZ0NvbnRleHRbJyRwYXJlbnRzJ10gfHwgW10pLnNsaWNlKDApO1xuICAgICAgICAgICAgdGhpc1snJHBhcmVudHMnXS51bnNoaWZ0KHRoaXNbJyRwYXJlbnQnXSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzWyckcGFyZW50cyddID0gW107XG4gICAgICAgICAgICB0aGlzWyckcm9vdCddID0gZGF0YUl0ZW07XG4gICAgICAgICAgICAvLyBFeHBvcnQgJ2tvJyBpbiB0aGUgYmluZGluZyBjb250ZXh0IHNvIGl0IHdpbGwgYmUgYXZhaWxhYmxlIGluIGJpbmRpbmdzIGFuZCB0ZW1wbGF0ZXNcbiAgICAgICAgICAgIC8vIGV2ZW4gaWYgJ2tvJyBpc24ndCBleHBvcnRlZCBhcyBhIGdsb2JhbCwgc3VjaCBhcyB3aGVuIHVzaW5nIGFuIEFNRCBsb2FkZXIuXG4gICAgICAgICAgICAvLyBTZWUgaHR0cHM6Ly9naXRodWIuY29tL1N0ZXZlU2FuZGVyc29uL2tub2Nrb3V0L2lzc3Vlcy80OTBcbiAgICAgICAgICAgIHRoaXNbJ2tvJ10gPSBrbztcbiAgICAgICAgfVxuICAgICAgICB0aGlzWyckZGF0YSddID0gZGF0YUl0ZW07XG4gICAgICAgIGlmIChkYXRhSXRlbUFsaWFzKVxuICAgICAgICAgICAgdGhpc1tkYXRhSXRlbUFsaWFzXSA9IGRhdGFJdGVtO1xuICAgIH1cbiAgICBrby5iaW5kaW5nQ29udGV4dC5wcm90b3R5cGVbJ2NyZWF0ZUNoaWxkQ29udGV4dCddID0gZnVuY3Rpb24gKGRhdGFJdGVtLCBkYXRhSXRlbUFsaWFzKSB7XG4gICAgICAgIHJldHVybiBuZXcga28uYmluZGluZ0NvbnRleHQoZGF0YUl0ZW0sIHRoaXMsIGRhdGFJdGVtQWxpYXMpO1xuICAgIH07XG4gICAga28uYmluZGluZ0NvbnRleHQucHJvdG90eXBlWydleHRlbmQnXSA9IGZ1bmN0aW9uKHByb3BlcnRpZXMpIHtcbiAgICAgICAgdmFyIGNsb25lID0ga28udXRpbHMuZXh0ZW5kKG5ldyBrby5iaW5kaW5nQ29udGV4dCgpLCB0aGlzKTtcbiAgICAgICAgcmV0dXJuIGtvLnV0aWxzLmV4dGVuZChjbG9uZSwgcHJvcGVydGllcyk7XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIHZhbGlkYXRlVGhhdEJpbmRpbmdJc0FsbG93ZWRGb3JWaXJ0dWFsRWxlbWVudHMoYmluZGluZ05hbWUpIHtcbiAgICAgICAgdmFyIHZhbGlkYXRvciA9IGtvLnZpcnR1YWxFbGVtZW50cy5hbGxvd2VkQmluZGluZ3NbYmluZGluZ05hbWVdO1xuICAgICAgICBpZiAoIXZhbGlkYXRvcilcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlRoZSBiaW5kaW5nICdcIiArIGJpbmRpbmdOYW1lICsgXCInIGNhbm5vdCBiZSB1c2VkIHdpdGggdmlydHVhbCBlbGVtZW50c1wiKVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGFwcGx5QmluZGluZ3NUb0Rlc2NlbmRhbnRzSW50ZXJuYWwgKHZpZXdNb2RlbCwgZWxlbWVudE9yVmlydHVhbEVsZW1lbnQsIGJpbmRpbmdDb250ZXh0c01heURpZmZlckZyb21Eb21QYXJlbnRFbGVtZW50KSB7XG4gICAgICAgIHZhciBjdXJyZW50Q2hpbGQsIG5leHRJblF1ZXVlID0ga28udmlydHVhbEVsZW1lbnRzLmZpcnN0Q2hpbGQoZWxlbWVudE9yVmlydHVhbEVsZW1lbnQpO1xuICAgICAgICB3aGlsZSAoY3VycmVudENoaWxkID0gbmV4dEluUXVldWUpIHtcbiAgICAgICAgICAgIC8vIEtlZXAgYSByZWNvcmQgb2YgdGhlIG5leHQgY2hpbGQgKmJlZm9yZSogYXBwbHlpbmcgYmluZGluZ3MsIGluIGNhc2UgdGhlIGJpbmRpbmcgcmVtb3ZlcyB0aGUgY3VycmVudCBjaGlsZCBmcm9tIGl0cyBwb3NpdGlvblxuICAgICAgICAgICAgbmV4dEluUXVldWUgPSBrby52aXJ0dWFsRWxlbWVudHMubmV4dFNpYmxpbmcoY3VycmVudENoaWxkKTtcbiAgICAgICAgICAgIGFwcGx5QmluZGluZ3NUb05vZGVBbmREZXNjZW5kYW50c0ludGVybmFsKHZpZXdNb2RlbCwgY3VycmVudENoaWxkLCBiaW5kaW5nQ29udGV4dHNNYXlEaWZmZXJGcm9tRG9tUGFyZW50RWxlbWVudCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBhcHBseUJpbmRpbmdzVG9Ob2RlQW5kRGVzY2VuZGFudHNJbnRlcm5hbCAodmlld01vZGVsLCBub2RlVmVyaWZpZWQsIGJpbmRpbmdDb250ZXh0TWF5RGlmZmVyRnJvbURvbVBhcmVudEVsZW1lbnQpIHtcbiAgICAgICAgdmFyIHNob3VsZEJpbmREZXNjZW5kYW50cyA9IHRydWU7XG5cbiAgICAgICAgLy8gUGVyZiBvcHRpbWlzYXRpb246IEFwcGx5IGJpbmRpbmdzIG9ubHkgaWYuLi5cbiAgICAgICAgLy8gKDEpIFdlIG5lZWQgdG8gc3RvcmUgdGhlIGJpbmRpbmcgY29udGV4dCBvbiB0aGlzIG5vZGUgKGJlY2F1c2UgaXQgbWF5IGRpZmZlciBmcm9tIHRoZSBET00gcGFyZW50IG5vZGUncyBiaW5kaW5nIGNvbnRleHQpXG4gICAgICAgIC8vICAgICBOb3RlIHRoYXQgd2UgY2FuJ3Qgc3RvcmUgYmluZGluZyBjb250ZXh0cyBvbiBub24tZWxlbWVudHMgKGUuZy4sIHRleHQgbm9kZXMpLCBhcyBJRSBkb2Vzbid0IGFsbG93IGV4cGFuZG8gcHJvcGVydGllcyBmb3IgdGhvc2VcbiAgICAgICAgLy8gKDIpIEl0IG1pZ2h0IGhhdmUgYmluZGluZ3MgKGUuZy4sIGl0IGhhcyBhIGRhdGEtYmluZCBhdHRyaWJ1dGUsIG9yIGl0J3MgYSBtYXJrZXIgZm9yIGEgY29udGFpbmVybGVzcyB0ZW1wbGF0ZSlcbiAgICAgICAgdmFyIGlzRWxlbWVudCA9IChub2RlVmVyaWZpZWQubm9kZVR5cGUgPT09IDEpO1xuICAgICAgICBpZiAoaXNFbGVtZW50KSAvLyBXb3JrYXJvdW5kIElFIDw9IDggSFRNTCBwYXJzaW5nIHdlaXJkbmVzc1xuICAgICAgICAgICAga28udmlydHVhbEVsZW1lbnRzLm5vcm1hbGlzZVZpcnR1YWxFbGVtZW50RG9tU3RydWN0dXJlKG5vZGVWZXJpZmllZCk7XG5cbiAgICAgICAgdmFyIHNob3VsZEFwcGx5QmluZGluZ3MgPSAoaXNFbGVtZW50ICYmIGJpbmRpbmdDb250ZXh0TWF5RGlmZmVyRnJvbURvbVBhcmVudEVsZW1lbnQpICAgICAgICAgICAgIC8vIENhc2UgKDEpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfHwga28uYmluZGluZ1Byb3ZpZGVyWydpbnN0YW5jZSddWydub2RlSGFzQmluZGluZ3MnXShub2RlVmVyaWZpZWQpOyAgICAgICAvLyBDYXNlICgyKVxuICAgICAgICBpZiAoc2hvdWxkQXBwbHlCaW5kaW5ncylcbiAgICAgICAgICAgIHNob3VsZEJpbmREZXNjZW5kYW50cyA9IGFwcGx5QmluZGluZ3NUb05vZGVJbnRlcm5hbChub2RlVmVyaWZpZWQsIG51bGwsIHZpZXdNb2RlbCwgYmluZGluZ0NvbnRleHRNYXlEaWZmZXJGcm9tRG9tUGFyZW50RWxlbWVudCkuc2hvdWxkQmluZERlc2NlbmRhbnRzO1xuXG4gICAgICAgIGlmIChzaG91bGRCaW5kRGVzY2VuZGFudHMpIHtcbiAgICAgICAgICAgIC8vIFdlJ3JlIHJlY3Vyc2luZyBhdXRvbWF0aWNhbGx5IGludG8gKHJlYWwgb3IgdmlydHVhbCkgY2hpbGQgbm9kZXMgd2l0aG91dCBjaGFuZ2luZyBiaW5kaW5nIGNvbnRleHRzLiBTbyxcbiAgICAgICAgICAgIC8vICAqIEZvciBjaGlsZHJlbiBvZiBhICpyZWFsKiBlbGVtZW50LCB0aGUgYmluZGluZyBjb250ZXh0IGlzIGNlcnRhaW5seSB0aGUgc2FtZSBhcyBvbiB0aGVpciBET00gLnBhcmVudE5vZGUsXG4gICAgICAgICAgICAvLyAgICBoZW5jZSBiaW5kaW5nQ29udGV4dHNNYXlEaWZmZXJGcm9tRG9tUGFyZW50RWxlbWVudCBpcyBmYWxzZVxuICAgICAgICAgICAgLy8gICogRm9yIGNoaWxkcmVuIG9mIGEgKnZpcnR1YWwqIGVsZW1lbnQsIHdlIGNhbid0IGJlIHN1cmUuIEV2YWx1YXRpbmcgLnBhcmVudE5vZGUgb24gdGhvc2UgY2hpbGRyZW4gbWF5XG4gICAgICAgICAgICAvLyAgICBza2lwIG92ZXIgYW55IG51bWJlciBvZiBpbnRlcm1lZGlhdGUgdmlydHVhbCBlbGVtZW50cywgYW55IG9mIHdoaWNoIG1pZ2h0IGRlZmluZSBhIGN1c3RvbSBiaW5kaW5nIGNvbnRleHQsXG4gICAgICAgICAgICAvLyAgICBoZW5jZSBiaW5kaW5nQ29udGV4dHNNYXlEaWZmZXJGcm9tRG9tUGFyZW50RWxlbWVudCBpcyB0cnVlXG4gICAgICAgICAgICBhcHBseUJpbmRpbmdzVG9EZXNjZW5kYW50c0ludGVybmFsKHZpZXdNb2RlbCwgbm9kZVZlcmlmaWVkLCAvKiBiaW5kaW5nQ29udGV4dHNNYXlEaWZmZXJGcm9tRG9tUGFyZW50RWxlbWVudDogKi8gIWlzRWxlbWVudCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgYm91bmRFbGVtZW50RG9tRGF0YUtleSA9ICdfX2tvX2JvdW5kRWxlbWVudCc7XG4gICAgZnVuY3Rpb24gYXBwbHlCaW5kaW5nc1RvTm9kZUludGVybmFsIChub2RlLCBiaW5kaW5ncywgdmlld01vZGVsT3JCaW5kaW5nQ29udGV4dCwgYmluZGluZ0NvbnRleHRNYXlEaWZmZXJGcm9tRG9tUGFyZW50RWxlbWVudCkge1xuICAgICAgICAvLyBOZWVkIHRvIGJlIHN1cmUgdGhhdCBpbml0cyBhcmUgb25seSBydW4gb25jZSwgYW5kIHVwZGF0ZXMgbmV2ZXIgcnVuIHVudGlsIGFsbCB0aGUgaW5pdHMgaGF2ZSBiZWVuIHJ1blxuICAgICAgICB2YXIgaW5pdFBoYXNlID0gMDsgLy8gMCA9IGJlZm9yZSBhbGwgaW5pdHMsIDEgPSBkdXJpbmcgaW5pdHMsIDIgPSBhZnRlciBhbGwgaW5pdHNcblxuICAgICAgICAvLyBFYWNoIHRpbWUgdGhlIGRlcGVuZGVudE9ic2VydmFibGUgaXMgZXZhbHVhdGVkIChhZnRlciBkYXRhIGNoYW5nZXMpLFxuICAgICAgICAvLyB0aGUgYmluZGluZyBhdHRyaWJ1dGUgaXMgcmVwYXJzZWQgc28gdGhhdCBpdCBjYW4gcGljayBvdXQgdGhlIGNvcnJlY3RcbiAgICAgICAgLy8gbW9kZWwgcHJvcGVydGllcyBpbiB0aGUgY29udGV4dCBvZiB0aGUgY2hhbmdlZCBkYXRhLlxuICAgICAgICAvLyBET00gZXZlbnQgY2FsbGJhY2tzIG5lZWQgdG8gYmUgYWJsZSB0byBhY2Nlc3MgdGhpcyBjaGFuZ2VkIGRhdGEsXG4gICAgICAgIC8vIHNvIHdlIG5lZWQgYSBzaW5nbGUgcGFyc2VkQmluZGluZ3MgdmFyaWFibGUgKHNoYXJlZCBieSBhbGwgY2FsbGJhY2tzXG4gICAgICAgIC8vIGFzc29jaWF0ZWQgd2l0aCB0aGlzIG5vZGUncyBiaW5kaW5ncykgdGhhdCBhbGwgdGhlIGNsb3N1cmVzIGNhbiBhY2Nlc3MuXG4gICAgICAgIHZhciBwYXJzZWRCaW5kaW5ncztcbiAgICAgICAgZnVuY3Rpb24gbWFrZVZhbHVlQWNjZXNzb3IoYmluZGluZ0tleSkge1xuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHsgcmV0dXJuIHBhcnNlZEJpbmRpbmdzW2JpbmRpbmdLZXldIH1cbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiBwYXJzZWRCaW5kaW5nc0FjY2Vzc29yKCkge1xuICAgICAgICAgICAgcmV0dXJuIHBhcnNlZEJpbmRpbmdzO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGJpbmRpbmdIYW5kbGVyVGhhdENvbnRyb2xzRGVzY2VuZGFudEJpbmRpbmdzO1xuXG4gICAgICAgIC8vIFByZXZlbnQgbXVsdGlwbGUgYXBwbHlCaW5kaW5ncyBjYWxscyBmb3IgdGhlIHNhbWUgbm9kZSwgZXhjZXB0IHdoZW4gYSBiaW5kaW5nIHZhbHVlIGlzIHNwZWNpZmllZFxuICAgICAgICB2YXIgYWxyZWFkeUJvdW5kID0ga28udXRpbHMuZG9tRGF0YS5nZXQobm9kZSwgYm91bmRFbGVtZW50RG9tRGF0YUtleSk7XG4gICAgICAgIGlmICghYmluZGluZ3MpIHtcbiAgICAgICAgICAgIGlmIChhbHJlYWR5Qm91bmQpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcihcIllvdSBjYW5ub3QgYXBwbHkgYmluZGluZ3MgbXVsdGlwbGUgdGltZXMgdG8gdGhlIHNhbWUgZWxlbWVudC5cIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBrby51dGlscy5kb21EYXRhLnNldChub2RlLCBib3VuZEVsZW1lbnREb21EYXRhS2V5LCB0cnVlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGtvLmRlcGVuZGVudE9ic2VydmFibGUoXG4gICAgICAgICAgICBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgLy8gRW5zdXJlIHdlIGhhdmUgYSBub25udWxsIGJpbmRpbmcgY29udGV4dCB0byB3b3JrIHdpdGhcbiAgICAgICAgICAgICAgICB2YXIgYmluZGluZ0NvbnRleHRJbnN0YW5jZSA9IHZpZXdNb2RlbE9yQmluZGluZ0NvbnRleHQgJiYgKHZpZXdNb2RlbE9yQmluZGluZ0NvbnRleHQgaW5zdGFuY2VvZiBrby5iaW5kaW5nQ29udGV4dClcbiAgICAgICAgICAgICAgICAgICAgPyB2aWV3TW9kZWxPckJpbmRpbmdDb250ZXh0XG4gICAgICAgICAgICAgICAgICAgIDogbmV3IGtvLmJpbmRpbmdDb250ZXh0KGtvLnV0aWxzLnVud3JhcE9ic2VydmFibGUodmlld01vZGVsT3JCaW5kaW5nQ29udGV4dCkpO1xuICAgICAgICAgICAgICAgIHZhciB2aWV3TW9kZWwgPSBiaW5kaW5nQ29udGV4dEluc3RhbmNlWyckZGF0YSddO1xuXG4gICAgICAgICAgICAgICAgLy8gT3B0aW1pemF0aW9uOiBEb24ndCBzdG9yZSB0aGUgYmluZGluZyBjb250ZXh0IG9uIHRoaXMgbm9kZSBpZiBpdCdzIGRlZmluaXRlbHkgdGhlIHNhbWUgYXMgb24gbm9kZS5wYXJlbnROb2RlLCBiZWNhdXNlXG4gICAgICAgICAgICAgICAgLy8gd2UgY2FuIGVhc2lseSByZWNvdmVyIGl0IGp1c3QgYnkgc2Nhbm5pbmcgdXAgdGhlIG5vZGUncyBhbmNlc3RvcnMgaW4gdGhlIERPTVxuICAgICAgICAgICAgICAgIC8vIChub3RlOiBoZXJlLCBwYXJlbnQgbm9kZSBtZWFucyBcInJlYWwgRE9NIHBhcmVudFwiIG5vdCBcInZpcnR1YWwgcGFyZW50XCIsIGFzIHRoZXJlJ3Mgbm8gTygxKSB3YXkgdG8gZmluZCB0aGUgdmlydHVhbCBwYXJlbnQpXG4gICAgICAgICAgICAgICAgaWYgKCFhbHJlYWR5Qm91bmQgJiYgYmluZGluZ0NvbnRleHRNYXlEaWZmZXJGcm9tRG9tUGFyZW50RWxlbWVudClcbiAgICAgICAgICAgICAgICAgICAga28uc3RvcmVkQmluZGluZ0NvbnRleHRGb3JOb2RlKG5vZGUsIGJpbmRpbmdDb250ZXh0SW5zdGFuY2UpO1xuXG4gICAgICAgICAgICAgICAgLy8gVXNlIGV2YWx1YXRlZEJpbmRpbmdzIGlmIGdpdmVuLCBvdGhlcndpc2UgZmFsbCBiYWNrIG9uIGFza2luZyB0aGUgYmluZGluZ3MgcHJvdmlkZXIgdG8gZ2l2ZSB1cyBzb21lIGJpbmRpbmdzXG4gICAgICAgICAgICAgICAgdmFyIGV2YWx1YXRlZEJpbmRpbmdzID0gKHR5cGVvZiBiaW5kaW5ncyA9PSBcImZ1bmN0aW9uXCIpID8gYmluZGluZ3MoYmluZGluZ0NvbnRleHRJbnN0YW5jZSwgbm9kZSkgOiBiaW5kaW5ncztcbiAgICAgICAgICAgICAgICBwYXJzZWRCaW5kaW5ncyA9IGV2YWx1YXRlZEJpbmRpbmdzIHx8IGtvLmJpbmRpbmdQcm92aWRlclsnaW5zdGFuY2UnXVsnZ2V0QmluZGluZ3MnXShub2RlLCBiaW5kaW5nQ29udGV4dEluc3RhbmNlKTtcblxuICAgICAgICAgICAgICAgIGlmIChwYXJzZWRCaW5kaW5ncykge1xuICAgICAgICAgICAgICAgICAgICAvLyBGaXJzdCBydW4gYWxsIHRoZSBpbml0cywgc28gYmluZGluZ3MgY2FuIHJlZ2lzdGVyIGZvciBub3RpZmljYXRpb24gb24gY2hhbmdlc1xuICAgICAgICAgICAgICAgICAgICBpZiAoaW5pdFBoYXNlID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbml0UGhhc2UgPSAxO1xuICAgICAgICAgICAgICAgICAgICAgICAga28udXRpbHMub2JqZWN0Rm9yRWFjaChwYXJzZWRCaW5kaW5ncywgZnVuY3Rpb24oYmluZGluZ0tleSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBiaW5kaW5nID0ga28uYmluZGluZ0hhbmRsZXJzW2JpbmRpbmdLZXldO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChiaW5kaW5nICYmIG5vZGUubm9kZVR5cGUgPT09IDgpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbGlkYXRlVGhhdEJpbmRpbmdJc0FsbG93ZWRGb3JWaXJ0dWFsRWxlbWVudHMoYmluZGluZ0tleSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoYmluZGluZyAmJiB0eXBlb2YgYmluZGluZ1tcImluaXRcIl0gPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBoYW5kbGVySW5pdEZuID0gYmluZGluZ1tcImluaXRcIl07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBpbml0UmVzdWx0ID0gaGFuZGxlckluaXRGbihub2RlLCBtYWtlVmFsdWVBY2Nlc3NvcihiaW5kaW5nS2V5KSwgcGFyc2VkQmluZGluZ3NBY2Nlc3Nvciwgdmlld01vZGVsLCBiaW5kaW5nQ29udGV4dEluc3RhbmNlKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBJZiB0aGlzIGJpbmRpbmcgaGFuZGxlciBjbGFpbXMgdG8gY29udHJvbCBkZXNjZW5kYW50IGJpbmRpbmdzLCBtYWtlIGEgbm90ZSBvZiB0aGlzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpbml0UmVzdWx0ICYmIGluaXRSZXN1bHRbJ2NvbnRyb2xzRGVzY2VuZGFudEJpbmRpbmdzJ10pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChiaW5kaW5nSGFuZGxlclRoYXRDb250cm9sc0Rlc2NlbmRhbnRCaW5kaW5ncyAhPT0gdW5kZWZpbmVkKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIk11bHRpcGxlIGJpbmRpbmdzIChcIiArIGJpbmRpbmdIYW5kbGVyVGhhdENvbnRyb2xzRGVzY2VuZGFudEJpbmRpbmdzICsgXCIgYW5kIFwiICsgYmluZGluZ0tleSArIFwiKSBhcmUgdHJ5aW5nIHRvIGNvbnRyb2wgZGVzY2VuZGFudCBiaW5kaW5ncyBvZiB0aGUgc2FtZSBlbGVtZW50LiBZb3UgY2Fubm90IHVzZSB0aGVzZSBiaW5kaW5ncyB0b2dldGhlciBvbiB0aGUgc2FtZSBlbGVtZW50LlwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJpbmRpbmdIYW5kbGVyVGhhdENvbnRyb2xzRGVzY2VuZGFudEJpbmRpbmdzID0gYmluZGluZ0tleTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5pdFBoYXNlID0gMjtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIC8vIC4uLiB0aGVuIHJ1biBhbGwgdGhlIHVwZGF0ZXMsIHdoaWNoIG1pZ2h0IHRyaWdnZXIgY2hhbmdlcyBldmVuIG9uIHRoZSBmaXJzdCBldmFsdWF0aW9uXG4gICAgICAgICAgICAgICAgICAgIGlmIChpbml0UGhhc2UgPT09IDIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGtvLnV0aWxzLm9iamVjdEZvckVhY2gocGFyc2VkQmluZGluZ3MsIGZ1bmN0aW9uKGJpbmRpbmdLZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgYmluZGluZyA9IGtvLmJpbmRpbmdIYW5kbGVyc1tiaW5kaW5nS2V5XTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoYmluZGluZyAmJiB0eXBlb2YgYmluZGluZ1tcInVwZGF0ZVwiXSA9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGhhbmRsZXJVcGRhdGVGbiA9IGJpbmRpbmdbXCJ1cGRhdGVcIl07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhhbmRsZXJVcGRhdGVGbihub2RlLCBtYWtlVmFsdWVBY2Nlc3NvcihiaW5kaW5nS2V5KSwgcGFyc2VkQmluZGluZ3NBY2Nlc3Nvciwgdmlld01vZGVsLCBiaW5kaW5nQ29udGV4dEluc3RhbmNlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBudWxsLFxuICAgICAgICAgICAgeyBkaXNwb3NlV2hlbk5vZGVJc1JlbW92ZWQgOiBub2RlIH1cbiAgICAgICAgKTtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc2hvdWxkQmluZERlc2NlbmRhbnRzOiBiaW5kaW5nSGFuZGxlclRoYXRDb250cm9sc0Rlc2NlbmRhbnRCaW5kaW5ncyA9PT0gdW5kZWZpbmVkXG4gICAgICAgIH07XG4gICAgfTtcblxuICAgIHZhciBzdG9yZWRCaW5kaW5nQ29udGV4dERvbURhdGFLZXkgPSBcIl9fa29fYmluZGluZ0NvbnRleHRfX1wiO1xuICAgIGtvLnN0b3JlZEJpbmRpbmdDb250ZXh0Rm9yTm9kZSA9IGZ1bmN0aW9uIChub2RlLCBiaW5kaW5nQ29udGV4dCkge1xuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PSAyKVxuICAgICAgICAgICAga28udXRpbHMuZG9tRGF0YS5zZXQobm9kZSwgc3RvcmVkQmluZGluZ0NvbnRleHREb21EYXRhS2V5LCBiaW5kaW5nQ29udGV4dCk7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHJldHVybiBrby51dGlscy5kb21EYXRhLmdldChub2RlLCBzdG9yZWRCaW5kaW5nQ29udGV4dERvbURhdGFLZXkpO1xuICAgIH1cblxuICAgIGtvLmFwcGx5QmluZGluZ3NUb05vZGUgPSBmdW5jdGlvbiAobm9kZSwgYmluZGluZ3MsIHZpZXdNb2RlbCkge1xuICAgICAgICBpZiAobm9kZS5ub2RlVHlwZSA9PT0gMSkgLy8gSWYgaXQncyBhbiBlbGVtZW50LCB3b3JrYXJvdW5kIElFIDw9IDggSFRNTCBwYXJzaW5nIHdlaXJkbmVzc1xuICAgICAgICAgICAga28udmlydHVhbEVsZW1lbnRzLm5vcm1hbGlzZVZpcnR1YWxFbGVtZW50RG9tU3RydWN0dXJlKG5vZGUpO1xuICAgICAgICByZXR1cm4gYXBwbHlCaW5kaW5nc1RvTm9kZUludGVybmFsKG5vZGUsIGJpbmRpbmdzLCB2aWV3TW9kZWwsIHRydWUpO1xuICAgIH07XG5cbiAgICBrby5hcHBseUJpbmRpbmdzVG9EZXNjZW5kYW50cyA9IGZ1bmN0aW9uKHZpZXdNb2RlbCwgcm9vdE5vZGUpIHtcbiAgICAgICAgaWYgKHJvb3ROb2RlLm5vZGVUeXBlID09PSAxIHx8IHJvb3ROb2RlLm5vZGVUeXBlID09PSA4KVxuICAgICAgICAgICAgYXBwbHlCaW5kaW5nc1RvRGVzY2VuZGFudHNJbnRlcm5hbCh2aWV3TW9kZWwsIHJvb3ROb2RlLCB0cnVlKTtcbiAgICB9O1xuXG4gICAga28uYXBwbHlCaW5kaW5ncyA9IGZ1bmN0aW9uICh2aWV3TW9kZWwsIHJvb3ROb2RlKSB7XG4gICAgICAgIGlmIChyb290Tm9kZSAmJiAocm9vdE5vZGUubm9kZVR5cGUgIT09IDEpICYmIChyb290Tm9kZS5ub2RlVHlwZSAhPT0gOCkpXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJrby5hcHBseUJpbmRpbmdzOiBmaXJzdCBwYXJhbWV0ZXIgc2hvdWxkIGJlIHlvdXIgdmlldyBtb2RlbDsgc2Vjb25kIHBhcmFtZXRlciBzaG91bGQgYmUgYSBET00gbm9kZVwiKTtcbiAgICAgICAgcm9vdE5vZGUgPSByb290Tm9kZSB8fCB3aW5kb3cuZG9jdW1lbnQuYm9keTsgLy8gTWFrZSBcInJvb3ROb2RlXCIgcGFyYW1ldGVyIG9wdGlvbmFsXG5cbiAgICAgICAgYXBwbHlCaW5kaW5nc1RvTm9kZUFuZERlc2NlbmRhbnRzSW50ZXJuYWwodmlld01vZGVsLCByb290Tm9kZSwgdHJ1ZSk7XG4gICAgfTtcblxuICAgIC8vIFJldHJpZXZpbmcgYmluZGluZyBjb250ZXh0IGZyb20gYXJiaXRyYXJ5IG5vZGVzXG4gICAga28uY29udGV4dEZvciA9IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgICAgLy8gV2UgY2FuIG9ubHkgZG8gc29tZXRoaW5nIG1lYW5pbmdmdWwgZm9yIGVsZW1lbnRzIGFuZCBjb21tZW50IG5vZGVzIChpbiBwYXJ0aWN1bGFyLCBub3QgdGV4dCBub2RlcywgYXMgSUUgY2FuJ3Qgc3RvcmUgZG9tZGF0YSBmb3IgdGhlbSlcbiAgICAgICAgc3dpdGNoIChub2RlLm5vZGVUeXBlKSB7XG4gICAgICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgICBjYXNlIDg6XG4gICAgICAgICAgICAgICAgdmFyIGNvbnRleHQgPSBrby5zdG9yZWRCaW5kaW5nQ29udGV4dEZvck5vZGUobm9kZSk7XG4gICAgICAgICAgICAgICAgaWYgKGNvbnRleHQpIHJldHVybiBjb250ZXh0O1xuICAgICAgICAgICAgICAgIGlmIChub2RlLnBhcmVudE5vZGUpIHJldHVybiBrby5jb250ZXh0Rm9yKG5vZGUucGFyZW50Tm9kZSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9O1xuICAgIGtvLmRhdGFGb3IgPSBmdW5jdGlvbihub2RlKSB7XG4gICAgICAgIHZhciBjb250ZXh0ID0ga28uY29udGV4dEZvcihub2RlKTtcbiAgICAgICAgcmV0dXJuIGNvbnRleHQgPyBjb250ZXh0WyckZGF0YSddIDogdW5kZWZpbmVkO1xuICAgIH07XG5cbiAgICBrby5leHBvcnRTeW1ib2woJ2JpbmRpbmdIYW5kbGVycycsIGtvLmJpbmRpbmdIYW5kbGVycyk7XG4gICAga28uZXhwb3J0U3ltYm9sKCdhcHBseUJpbmRpbmdzJywga28uYXBwbHlCaW5kaW5ncyk7XG4gICAga28uZXhwb3J0U3ltYm9sKCdhcHBseUJpbmRpbmdzVG9EZXNjZW5kYW50cycsIGtvLmFwcGx5QmluZGluZ3NUb0Rlc2NlbmRhbnRzKTtcbiAgICBrby5leHBvcnRTeW1ib2woJ2FwcGx5QmluZGluZ3NUb05vZGUnLCBrby5hcHBseUJpbmRpbmdzVG9Ob2RlKTtcbiAgICBrby5leHBvcnRTeW1ib2woJ2NvbnRleHRGb3InLCBrby5jb250ZXh0Rm9yKTtcbiAgICBrby5leHBvcnRTeW1ib2woJ2RhdGFGb3InLCBrby5kYXRhRm9yKTtcbn0pKCk7XG52YXIgYXR0ckh0bWxUb0phdmFzY3JpcHRNYXAgPSB7ICdjbGFzcyc6ICdjbGFzc05hbWUnLCAnZm9yJzogJ2h0bWxGb3InIH07XG5rby5iaW5kaW5nSGFuZGxlcnNbJ2F0dHInXSA9IHtcbiAgICAndXBkYXRlJzogZnVuY3Rpb24oZWxlbWVudCwgdmFsdWVBY2Nlc3NvciwgYWxsQmluZGluZ3NBY2Nlc3Nvcikge1xuICAgICAgICB2YXIgdmFsdWUgPSBrby51dGlscy51bndyYXBPYnNlcnZhYmxlKHZhbHVlQWNjZXNzb3IoKSkgfHwge307XG4gICAgICAgIGtvLnV0aWxzLm9iamVjdEZvckVhY2godmFsdWUsIGZ1bmN0aW9uKGF0dHJOYW1lLCBhdHRyVmFsdWUpIHtcbiAgICAgICAgICAgIGF0dHJWYWx1ZSA9IGtvLnV0aWxzLnVud3JhcE9ic2VydmFibGUoYXR0clZhbHVlKTtcblxuICAgICAgICAgICAgLy8gVG8gY292ZXIgY2FzZXMgbGlrZSBcImF0dHI6IHsgY2hlY2tlZDpzb21lUHJvcCB9XCIsIHdlIHdhbnQgdG8gcmVtb3ZlIHRoZSBhdHRyaWJ1dGUgZW50aXJlbHlcbiAgICAgICAgICAgIC8vIHdoZW4gc29tZVByb3AgaXMgYSBcIm5vIHZhbHVlXCItbGlrZSB2YWx1ZSAoc3RyaWN0bHkgbnVsbCwgZmFsc2UsIG9yIHVuZGVmaW5lZClcbiAgICAgICAgICAgIC8vIChiZWNhdXNlIHRoZSBhYnNlbmNlIG9mIHRoZSBcImNoZWNrZWRcIiBhdHRyIGlzIGhvdyB0byBtYXJrIGFuIGVsZW1lbnQgYXMgbm90IGNoZWNrZWQsIGV0Yy4pXG4gICAgICAgICAgICB2YXIgdG9SZW1vdmUgPSAoYXR0clZhbHVlID09PSBmYWxzZSkgfHwgKGF0dHJWYWx1ZSA9PT0gbnVsbCkgfHwgKGF0dHJWYWx1ZSA9PT0gdW5kZWZpbmVkKTtcbiAgICAgICAgICAgIGlmICh0b1JlbW92ZSlcbiAgICAgICAgICAgICAgICBlbGVtZW50LnJlbW92ZUF0dHJpYnV0ZShhdHRyTmFtZSk7XG5cbiAgICAgICAgICAgIC8vIEluIElFIDw9IDcgYW5kIElFOCBRdWlya3MgTW9kZSwgeW91IGhhdmUgdG8gdXNlIHRoZSBKYXZhc2NyaXB0IHByb3BlcnR5IG5hbWUgaW5zdGVhZCBvZiB0aGVcbiAgICAgICAgICAgIC8vIEhUTUwgYXR0cmlidXRlIG5hbWUgZm9yIGNlcnRhaW4gYXR0cmlidXRlcy4gSUU4IFN0YW5kYXJkcyBNb2RlIHN1cHBvcnRzIHRoZSBjb3JyZWN0IGJlaGF2aW9yLFxuICAgICAgICAgICAgLy8gYnV0IGluc3RlYWQgb2YgZmlndXJpbmcgb3V0IHRoZSBtb2RlLCB3ZSdsbCBqdXN0IHNldCB0aGUgYXR0cmlidXRlIHRocm91Z2ggdGhlIEphdmFzY3JpcHRcbiAgICAgICAgICAgIC8vIHByb3BlcnR5IGZvciBJRSA8PSA4LlxuICAgICAgICAgICAgaWYgKGtvLnV0aWxzLmllVmVyc2lvbiA8PSA4ICYmIGF0dHJOYW1lIGluIGF0dHJIdG1sVG9KYXZhc2NyaXB0TWFwKSB7XG4gICAgICAgICAgICAgICAgYXR0ck5hbWUgPSBhdHRySHRtbFRvSmF2YXNjcmlwdE1hcFthdHRyTmFtZV07XG4gICAgICAgICAgICAgICAgaWYgKHRvUmVtb3ZlKVxuICAgICAgICAgICAgICAgICAgICBlbGVtZW50LnJlbW92ZUF0dHJpYnV0ZShhdHRyTmFtZSk7XG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBlbGVtZW50W2F0dHJOYW1lXSA9IGF0dHJWYWx1ZTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoIXRvUmVtb3ZlKSB7XG4gICAgICAgICAgICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoYXR0ck5hbWUsIGF0dHJWYWx1ZS50b1N0cmluZygpKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gVHJlYXQgXCJuYW1lXCIgc3BlY2lhbGx5IC0gYWx0aG91Z2ggeW91IGNhbiB0aGluayBvZiBpdCBhcyBhbiBhdHRyaWJ1dGUsIGl0IGFsc28gbmVlZHNcbiAgICAgICAgICAgIC8vIHNwZWNpYWwgaGFuZGxpbmcgb24gb2xkZXIgdmVyc2lvbnMgb2YgSUUgKGh0dHBzOi8vZ2l0aHViLmNvbS9TdGV2ZVNhbmRlcnNvbi9rbm9ja291dC9wdWxsLzMzMylcbiAgICAgICAgICAgIC8vIERlbGliZXJhdGVseSBiZWluZyBjYXNlLXNlbnNpdGl2ZSBoZXJlIGJlY2F1c2UgWEhUTUwgd291bGQgcmVnYXJkIFwiTmFtZVwiIGFzIGEgZGlmZmVyZW50IHRoaW5nXG4gICAgICAgICAgICAvLyBlbnRpcmVseSwgYW5kIHRoZXJlJ3Mgbm8gc3Ryb25nIHJlYXNvbiB0byBhbGxvdyBmb3Igc3VjaCBjYXNpbmcgaW4gSFRNTC5cbiAgICAgICAgICAgIGlmIChhdHRyTmFtZSA9PT0gXCJuYW1lXCIpIHtcbiAgICAgICAgICAgICAgICBrby51dGlscy5zZXRFbGVtZW50TmFtZShlbGVtZW50LCB0b1JlbW92ZSA/IFwiXCIgOiBhdHRyVmFsdWUudG9TdHJpbmcoKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbn07XG5rby5iaW5kaW5nSGFuZGxlcnNbJ2NoZWNrZWQnXSA9IHtcbiAgICAnaW5pdCc6IGZ1bmN0aW9uIChlbGVtZW50LCB2YWx1ZUFjY2Vzc29yLCBhbGxCaW5kaW5nc0FjY2Vzc29yKSB7XG4gICAgICAgIHZhciB1cGRhdGVIYW5kbGVyID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgdmFsdWVUb1dyaXRlO1xuICAgICAgICAgICAgaWYgKGVsZW1lbnQudHlwZSA9PSBcImNoZWNrYm94XCIpIHtcbiAgICAgICAgICAgICAgICB2YWx1ZVRvV3JpdGUgPSBlbGVtZW50LmNoZWNrZWQ7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKChlbGVtZW50LnR5cGUgPT0gXCJyYWRpb1wiKSAmJiAoZWxlbWVudC5jaGVja2VkKSkge1xuICAgICAgICAgICAgICAgIHZhbHVlVG9Xcml0ZSA9IGVsZW1lbnQudmFsdWU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybjsgLy8gXCJjaGVja2VkXCIgYmluZGluZyBvbmx5IHJlc3BvbmRzIHRvIGNoZWNrYm94ZXMgYW5kIHNlbGVjdGVkIHJhZGlvIGJ1dHRvbnNcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIG1vZGVsVmFsdWUgPSB2YWx1ZUFjY2Vzc29yKCksIHVud3JhcHBlZFZhbHVlID0ga28udXRpbHMudW53cmFwT2JzZXJ2YWJsZShtb2RlbFZhbHVlKTtcbiAgICAgICAgICAgIGlmICgoZWxlbWVudC50eXBlID09IFwiY2hlY2tib3hcIikgJiYgKHVud3JhcHBlZFZhbHVlIGluc3RhbmNlb2YgQXJyYXkpKSB7XG4gICAgICAgICAgICAgICAgLy8gRm9yIGNoZWNrYm94ZXMgYm91bmQgdG8gYW4gYXJyYXksIHdlIGFkZC9yZW1vdmUgdGhlIGNoZWNrYm94IHZhbHVlIHRvIHRoYXQgYXJyYXlcbiAgICAgICAgICAgICAgICAvLyBUaGlzIHdvcmtzIGZvciBib3RoIG9ic2VydmFibGUgYW5kIG5vbi1vYnNlcnZhYmxlIGFycmF5c1xuICAgICAgICAgICAgICAgIGtvLnV0aWxzLmFkZE9yUmVtb3ZlSXRlbShtb2RlbFZhbHVlLCBlbGVtZW50LnZhbHVlLCBlbGVtZW50LmNoZWNrZWQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBrby5leHByZXNzaW9uUmV3cml0aW5nLndyaXRlVmFsdWVUb1Byb3BlcnR5KG1vZGVsVmFsdWUsIGFsbEJpbmRpbmdzQWNjZXNzb3IsICdjaGVja2VkJywgdmFsdWVUb1dyaXRlLCB0cnVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAga28udXRpbHMucmVnaXN0ZXJFdmVudEhhbmRsZXIoZWxlbWVudCwgXCJjbGlja1wiLCB1cGRhdGVIYW5kbGVyKTtcblxuICAgICAgICAvLyBJRSA2IHdvbid0IGFsbG93IHJhZGlvIGJ1dHRvbnMgdG8gYmUgc2VsZWN0ZWQgdW5sZXNzIHRoZXkgaGF2ZSBhIG5hbWVcbiAgICAgICAgaWYgKChlbGVtZW50LnR5cGUgPT0gXCJyYWRpb1wiKSAmJiAhZWxlbWVudC5uYW1lKVxuICAgICAgICAgICAga28uYmluZGluZ0hhbmRsZXJzWyd1bmlxdWVOYW1lJ11bJ2luaXQnXShlbGVtZW50LCBmdW5jdGlvbigpIHsgcmV0dXJuIHRydWUgfSk7XG4gICAgfSxcbiAgICAndXBkYXRlJzogZnVuY3Rpb24gKGVsZW1lbnQsIHZhbHVlQWNjZXNzb3IpIHtcbiAgICAgICAgdmFyIHZhbHVlID0ga28udXRpbHMudW53cmFwT2JzZXJ2YWJsZSh2YWx1ZUFjY2Vzc29yKCkpO1xuXG4gICAgICAgIGlmIChlbGVtZW50LnR5cGUgPT0gXCJjaGVja2JveFwiKSB7XG4gICAgICAgICAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBBcnJheSkge1xuICAgICAgICAgICAgICAgIC8vIFdoZW4gYm91bmQgdG8gYW4gYXJyYXksIHRoZSBjaGVja2JveCBiZWluZyBjaGVja2VkIHJlcHJlc2VudHMgaXRzIHZhbHVlIGJlaW5nIHByZXNlbnQgaW4gdGhhdCBhcnJheVxuICAgICAgICAgICAgICAgIGVsZW1lbnQuY2hlY2tlZCA9IGtvLnV0aWxzLmFycmF5SW5kZXhPZih2YWx1ZSwgZWxlbWVudC52YWx1ZSkgPj0gMDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gV2hlbiBib3VuZCB0byBhbnkgb3RoZXIgdmFsdWUgKG5vdCBhbiBhcnJheSksIHRoZSBjaGVja2JveCBiZWluZyBjaGVja2VkIHJlcHJlc2VudHMgdGhlIHZhbHVlIGJlaW5nIHRydWVpc2hcbiAgICAgICAgICAgICAgICBlbGVtZW50LmNoZWNrZWQgPSB2YWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChlbGVtZW50LnR5cGUgPT0gXCJyYWRpb1wiKSB7XG4gICAgICAgICAgICBlbGVtZW50LmNoZWNrZWQgPSAoZWxlbWVudC52YWx1ZSA9PSB2YWx1ZSk7XG4gICAgICAgIH1cbiAgICB9XG59O1xudmFyIGNsYXNzZXNXcml0dGVuQnlCaW5kaW5nS2V5ID0gJ19fa29fX2Nzc1ZhbHVlJztcbmtvLmJpbmRpbmdIYW5kbGVyc1snY3NzJ10gPSB7XG4gICAgJ3VwZGF0ZSc6IGZ1bmN0aW9uIChlbGVtZW50LCB2YWx1ZUFjY2Vzc29yKSB7XG4gICAgICAgIHZhciB2YWx1ZSA9IGtvLnV0aWxzLnVud3JhcE9ic2VydmFibGUodmFsdWVBY2Nlc3NvcigpKTtcbiAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PSBcIm9iamVjdFwiKSB7XG4gICAgICAgICAgICBrby51dGlscy5vYmplY3RGb3JFYWNoKHZhbHVlLCBmdW5jdGlvbihjbGFzc05hbWUsIHNob3VsZEhhdmVDbGFzcykge1xuICAgICAgICAgICAgICAgIHNob3VsZEhhdmVDbGFzcyA9IGtvLnV0aWxzLnVud3JhcE9ic2VydmFibGUoc2hvdWxkSGF2ZUNsYXNzKTtcbiAgICAgICAgICAgICAgICBrby51dGlscy50b2dnbGVEb21Ob2RlQ3NzQ2xhc3MoZWxlbWVudCwgY2xhc3NOYW1lLCBzaG91bGRIYXZlQ2xhc3MpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YWx1ZSA9IFN0cmluZyh2YWx1ZSB8fCAnJyk7IC8vIE1ha2Ugc3VyZSB3ZSBkb24ndCB0cnkgdG8gc3RvcmUgb3Igc2V0IGEgbm9uLXN0cmluZyB2YWx1ZVxuICAgICAgICAgICAga28udXRpbHMudG9nZ2xlRG9tTm9kZUNzc0NsYXNzKGVsZW1lbnQsIGVsZW1lbnRbY2xhc3Nlc1dyaXR0ZW5CeUJpbmRpbmdLZXldLCBmYWxzZSk7XG4gICAgICAgICAgICBlbGVtZW50W2NsYXNzZXNXcml0dGVuQnlCaW5kaW5nS2V5XSA9IHZhbHVlO1xuICAgICAgICAgICAga28udXRpbHMudG9nZ2xlRG9tTm9kZUNzc0NsYXNzKGVsZW1lbnQsIHZhbHVlLCB0cnVlKTtcbiAgICAgICAgfVxuICAgIH1cbn07XG5rby5iaW5kaW5nSGFuZGxlcnNbJ2VuYWJsZSddID0ge1xuICAgICd1cGRhdGUnOiBmdW5jdGlvbiAoZWxlbWVudCwgdmFsdWVBY2Nlc3Nvcikge1xuICAgICAgICB2YXIgdmFsdWUgPSBrby51dGlscy51bndyYXBPYnNlcnZhYmxlKHZhbHVlQWNjZXNzb3IoKSk7XG4gICAgICAgIGlmICh2YWx1ZSAmJiBlbGVtZW50LmRpc2FibGVkKVxuICAgICAgICAgICAgZWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUoXCJkaXNhYmxlZFwiKTtcbiAgICAgICAgZWxzZSBpZiAoKCF2YWx1ZSkgJiYgKCFlbGVtZW50LmRpc2FibGVkKSlcbiAgICAgICAgICAgIGVsZW1lbnQuZGlzYWJsZWQgPSB0cnVlO1xuICAgIH1cbn07XG5cbmtvLmJpbmRpbmdIYW5kbGVyc1snZGlzYWJsZSddID0ge1xuICAgICd1cGRhdGUnOiBmdW5jdGlvbiAoZWxlbWVudCwgdmFsdWVBY2Nlc3Nvcikge1xuICAgICAgICBrby5iaW5kaW5nSGFuZGxlcnNbJ2VuYWJsZSddWyd1cGRhdGUnXShlbGVtZW50LCBmdW5jdGlvbigpIHsgcmV0dXJuICFrby51dGlscy51bndyYXBPYnNlcnZhYmxlKHZhbHVlQWNjZXNzb3IoKSkgfSk7XG4gICAgfVxufTtcbi8vIEZvciBjZXJ0YWluIGNvbW1vbiBldmVudHMgKGN1cnJlbnRseSBqdXN0ICdjbGljaycpLCBhbGxvdyBhIHNpbXBsaWZpZWQgZGF0YS1iaW5kaW5nIHN5bnRheFxuLy8gZS5nLiBjbGljazpoYW5kbGVyIGluc3RlYWQgb2YgdGhlIHVzdWFsIGZ1bGwtbGVuZ3RoIGV2ZW50OntjbGljazpoYW5kbGVyfVxuZnVuY3Rpb24gbWFrZUV2ZW50SGFuZGxlclNob3J0Y3V0KGV2ZW50TmFtZSkge1xuICAgIGtvLmJpbmRpbmdIYW5kbGVyc1tldmVudE5hbWVdID0ge1xuICAgICAgICAnaW5pdCc6IGZ1bmN0aW9uKGVsZW1lbnQsIHZhbHVlQWNjZXNzb3IsIGFsbEJpbmRpbmdzQWNjZXNzb3IsIHZpZXdNb2RlbCkge1xuICAgICAgICAgICAgdmFyIG5ld1ZhbHVlQWNjZXNzb3IgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IHt9O1xuICAgICAgICAgICAgICAgIHJlc3VsdFtldmVudE5hbWVdID0gdmFsdWVBY2Nlc3NvcigpO1xuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcmV0dXJuIGtvLmJpbmRpbmdIYW5kbGVyc1snZXZlbnQnXVsnaW5pdCddLmNhbGwodGhpcywgZWxlbWVudCwgbmV3VmFsdWVBY2Nlc3NvciwgYWxsQmluZGluZ3NBY2Nlc3Nvciwgdmlld01vZGVsKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxua28uYmluZGluZ0hhbmRsZXJzWydldmVudCddID0ge1xuICAgICdpbml0JyA6IGZ1bmN0aW9uIChlbGVtZW50LCB2YWx1ZUFjY2Vzc29yLCBhbGxCaW5kaW5nc0FjY2Vzc29yLCB2aWV3TW9kZWwpIHtcbiAgICAgICAgdmFyIGV2ZW50c1RvSGFuZGxlID0gdmFsdWVBY2Nlc3NvcigpIHx8IHt9O1xuICAgICAgICBrby51dGlscy5vYmplY3RGb3JFYWNoKGV2ZW50c1RvSGFuZGxlLCBmdW5jdGlvbihldmVudE5hbWUpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZXZlbnROYW1lID09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgICAgICBrby51dGlscy5yZWdpc3RlckV2ZW50SGFuZGxlcihlbGVtZW50LCBldmVudE5hbWUsIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgaGFuZGxlclJldHVyblZhbHVlO1xuICAgICAgICAgICAgICAgICAgICB2YXIgaGFuZGxlckZ1bmN0aW9uID0gdmFsdWVBY2Nlc3NvcigpW2V2ZW50TmFtZV07XG4gICAgICAgICAgICAgICAgICAgIGlmICghaGFuZGxlckZ1bmN0aW9uKVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB2YXIgYWxsQmluZGluZ3MgPSBhbGxCaW5kaW5nc0FjY2Vzc29yKCk7XG5cbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRha2UgYWxsIHRoZSBldmVudCBhcmdzLCBhbmQgcHJlZml4IHdpdGggdGhlIHZpZXdtb2RlbFxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGFyZ3NGb3JIYW5kbGVyID0ga28udXRpbHMubWFrZUFycmF5KGFyZ3VtZW50cyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBhcmdzRm9ySGFuZGxlci51bnNoaWZ0KHZpZXdNb2RlbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBoYW5kbGVyUmV0dXJuVmFsdWUgPSBoYW5kbGVyRnVuY3Rpb24uYXBwbHkodmlld01vZGVsLCBhcmdzRm9ySGFuZGxlcik7XG4gICAgICAgICAgICAgICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaGFuZGxlclJldHVyblZhbHVlICE9PSB0cnVlKSB7IC8vIE5vcm1hbGx5IHdlIHdhbnQgdG8gcHJldmVudCBkZWZhdWx0IGFjdGlvbi4gRGV2ZWxvcGVyIGNhbiBvdmVycmlkZSB0aGlzIGJlIGV4cGxpY2l0bHkgcmV0dXJuaW5nIHRydWUuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGV2ZW50LnByZXZlbnREZWZhdWx0KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnQucmV0dXJuVmFsdWUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHZhciBidWJibGUgPSBhbGxCaW5kaW5nc1tldmVudE5hbWUgKyAnQnViYmxlJ10gIT09IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWJ1YmJsZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnQuY2FuY2VsQnViYmxlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChldmVudC5zdG9wUHJvcGFnYXRpb24pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxufTtcbi8vIFwiZm9yZWFjaDogc29tZUV4cHJlc3Npb25cIiBpcyBlcXVpdmFsZW50IHRvIFwidGVtcGxhdGU6IHsgZm9yZWFjaDogc29tZUV4cHJlc3Npb24gfVwiXG4vLyBcImZvcmVhY2g6IHsgZGF0YTogc29tZUV4cHJlc3Npb24sIGFmdGVyQWRkOiBteWZuIH1cIiBpcyBlcXVpdmFsZW50IHRvIFwidGVtcGxhdGU6IHsgZm9yZWFjaDogc29tZUV4cHJlc3Npb24sIGFmdGVyQWRkOiBteWZuIH1cIlxua28uYmluZGluZ0hhbmRsZXJzWydmb3JlYWNoJ10gPSB7XG4gICAgbWFrZVRlbXBsYXRlVmFsdWVBY2Nlc3NvcjogZnVuY3Rpb24odmFsdWVBY2Nlc3Nvcikge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgbW9kZWxWYWx1ZSA9IHZhbHVlQWNjZXNzb3IoKSxcbiAgICAgICAgICAgICAgICB1bndyYXBwZWRWYWx1ZSA9IGtvLnV0aWxzLnBlZWtPYnNlcnZhYmxlKG1vZGVsVmFsdWUpOyAgICAvLyBVbndyYXAgd2l0aG91dCBzZXR0aW5nIGEgZGVwZW5kZW5jeSBoZXJlXG5cbiAgICAgICAgICAgIC8vIElmIHVud3JhcHBlZFZhbHVlIGlzIHRoZSBhcnJheSwgcGFzcyBpbiB0aGUgd3JhcHBlZCB2YWx1ZSBvbiBpdHMgb3duXG4gICAgICAgICAgICAvLyBUaGUgdmFsdWUgd2lsbCBiZSB1bndyYXBwZWQgYW5kIHRyYWNrZWQgd2l0aGluIHRoZSB0ZW1wbGF0ZSBiaW5kaW5nXG4gICAgICAgICAgICAvLyAoU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9TdGV2ZVNhbmRlcnNvbi9rbm9ja291dC9pc3N1ZXMvNTIzKVxuICAgICAgICAgICAgaWYgKCghdW53cmFwcGVkVmFsdWUpIHx8IHR5cGVvZiB1bndyYXBwZWRWYWx1ZS5sZW5ndGggPT0gXCJudW1iZXJcIilcbiAgICAgICAgICAgICAgICByZXR1cm4geyAnZm9yZWFjaCc6IG1vZGVsVmFsdWUsICd0ZW1wbGF0ZUVuZ2luZSc6IGtvLm5hdGl2ZVRlbXBsYXRlRW5naW5lLmluc3RhbmNlIH07XG5cbiAgICAgICAgICAgIC8vIElmIHVud3JhcHBlZFZhbHVlLmRhdGEgaXMgdGhlIGFycmF5LCBwcmVzZXJ2ZSBhbGwgcmVsZXZhbnQgb3B0aW9ucyBhbmQgdW53cmFwIGFnYWluIHZhbHVlIHNvIHdlIGdldCB1cGRhdGVzXG4gICAgICAgICAgICBrby51dGlscy51bndyYXBPYnNlcnZhYmxlKG1vZGVsVmFsdWUpO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAnZm9yZWFjaCc6IHVud3JhcHBlZFZhbHVlWydkYXRhJ10sXG4gICAgICAgICAgICAgICAgJ2FzJzogdW53cmFwcGVkVmFsdWVbJ2FzJ10sXG4gICAgICAgICAgICAgICAgJ2luY2x1ZGVEZXN0cm95ZWQnOiB1bndyYXBwZWRWYWx1ZVsnaW5jbHVkZURlc3Ryb3llZCddLFxuICAgICAgICAgICAgICAgICdhZnRlckFkZCc6IHVud3JhcHBlZFZhbHVlWydhZnRlckFkZCddLFxuICAgICAgICAgICAgICAgICdiZWZvcmVSZW1vdmUnOiB1bndyYXBwZWRWYWx1ZVsnYmVmb3JlUmVtb3ZlJ10sXG4gICAgICAgICAgICAgICAgJ2FmdGVyUmVuZGVyJzogdW53cmFwcGVkVmFsdWVbJ2FmdGVyUmVuZGVyJ10sXG4gICAgICAgICAgICAgICAgJ2JlZm9yZU1vdmUnOiB1bndyYXBwZWRWYWx1ZVsnYmVmb3JlTW92ZSddLFxuICAgICAgICAgICAgICAgICdhZnRlck1vdmUnOiB1bndyYXBwZWRWYWx1ZVsnYWZ0ZXJNb3ZlJ10sXG4gICAgICAgICAgICAgICAgJ3RlbXBsYXRlRW5naW5lJzoga28ubmF0aXZlVGVtcGxhdGVFbmdpbmUuaW5zdGFuY2VcbiAgICAgICAgICAgIH07XG4gICAgICAgIH07XG4gICAgfSxcbiAgICAnaW5pdCc6IGZ1bmN0aW9uKGVsZW1lbnQsIHZhbHVlQWNjZXNzb3IsIGFsbEJpbmRpbmdzQWNjZXNzb3IsIHZpZXdNb2RlbCwgYmluZGluZ0NvbnRleHQpIHtcbiAgICAgICAgcmV0dXJuIGtvLmJpbmRpbmdIYW5kbGVyc1sndGVtcGxhdGUnXVsnaW5pdCddKGVsZW1lbnQsIGtvLmJpbmRpbmdIYW5kbGVyc1snZm9yZWFjaCddLm1ha2VUZW1wbGF0ZVZhbHVlQWNjZXNzb3IodmFsdWVBY2Nlc3NvcikpO1xuICAgIH0sXG4gICAgJ3VwZGF0ZSc6IGZ1bmN0aW9uKGVsZW1lbnQsIHZhbHVlQWNjZXNzb3IsIGFsbEJpbmRpbmdzQWNjZXNzb3IsIHZpZXdNb2RlbCwgYmluZGluZ0NvbnRleHQpIHtcbiAgICAgICAgcmV0dXJuIGtvLmJpbmRpbmdIYW5kbGVyc1sndGVtcGxhdGUnXVsndXBkYXRlJ10oZWxlbWVudCwga28uYmluZGluZ0hhbmRsZXJzWydmb3JlYWNoJ10ubWFrZVRlbXBsYXRlVmFsdWVBY2Nlc3Nvcih2YWx1ZUFjY2Vzc29yKSwgYWxsQmluZGluZ3NBY2Nlc3Nvciwgdmlld01vZGVsLCBiaW5kaW5nQ29udGV4dCk7XG4gICAgfVxufTtcbmtvLmV4cHJlc3Npb25SZXdyaXRpbmcuYmluZGluZ1Jld3JpdGVWYWxpZGF0b3JzWydmb3JlYWNoJ10gPSBmYWxzZTsgLy8gQ2FuJ3QgcmV3cml0ZSBjb250cm9sIGZsb3cgYmluZGluZ3NcbmtvLnZpcnR1YWxFbGVtZW50cy5hbGxvd2VkQmluZGluZ3NbJ2ZvcmVhY2gnXSA9IHRydWU7XG52YXIgaGFzZm9jdXNVcGRhdGluZ1Byb3BlcnR5ID0gJ19fa29faGFzZm9jdXNVcGRhdGluZyc7XG52YXIgaGFzZm9jdXNMYXN0VmFsdWUgPSAnX19rb19oYXNmb2N1c0xhc3RWYWx1ZSc7XG5rby5iaW5kaW5nSGFuZGxlcnNbJ2hhc2ZvY3VzJ10gPSB7XG4gICAgJ2luaXQnOiBmdW5jdGlvbihlbGVtZW50LCB2YWx1ZUFjY2Vzc29yLCBhbGxCaW5kaW5nc0FjY2Vzc29yKSB7XG4gICAgICAgIHZhciBoYW5kbGVFbGVtZW50Rm9jdXNDaGFuZ2UgPSBmdW5jdGlvbihpc0ZvY3VzZWQpIHtcbiAgICAgICAgICAgIC8vIFdoZXJlIHBvc3NpYmxlLCBpZ25vcmUgd2hpY2ggZXZlbnQgd2FzIHJhaXNlZCBhbmQgZGV0ZXJtaW5lIGZvY3VzIHN0YXRlIHVzaW5nIGFjdGl2ZUVsZW1lbnQsXG4gICAgICAgICAgICAvLyBhcyB0aGlzIGF2b2lkcyBwaGFudG9tIGZvY3VzL2JsdXIgZXZlbnRzIHJhaXNlZCB3aGVuIGNoYW5naW5nIHRhYnMgaW4gbW9kZXJuIGJyb3dzZXJzLlxuICAgICAgICAgICAgLy8gSG93ZXZlciwgbm90IGFsbCBLTy10YXJnZXRlZCBicm93c2VycyAoRmlyZWZveCAyKSBzdXBwb3J0IGFjdGl2ZUVsZW1lbnQuIEZvciB0aG9zZSBicm93c2VycyxcbiAgICAgICAgICAgIC8vIHByZXZlbnQgYSBsb3NzIG9mIGZvY3VzIHdoZW4gY2hhbmdpbmcgdGFicy93aW5kb3dzIGJ5IHNldHRpbmcgYSBmbGFnIHRoYXQgcHJldmVudHMgaGFzZm9jdXNcbiAgICAgICAgICAgIC8vIGZyb20gY2FsbGluZyAnYmx1cigpJyBvbiB0aGUgZWxlbWVudCB3aGVuIGl0IGxvc2VzIGZvY3VzLlxuICAgICAgICAgICAgLy8gRGlzY3Vzc2lvbiBhdCBodHRwczovL2dpdGh1Yi5jb20vU3RldmVTYW5kZXJzb24va25vY2tvdXQvcHVsbC8zNTJcbiAgICAgICAgICAgIGVsZW1lbnRbaGFzZm9jdXNVcGRhdGluZ1Byb3BlcnR5XSA9IHRydWU7XG4gICAgICAgICAgICB2YXIgb3duZXJEb2MgPSBlbGVtZW50Lm93bmVyRG9jdW1lbnQ7XG4gICAgICAgICAgICBpZiAoXCJhY3RpdmVFbGVtZW50XCIgaW4gb3duZXJEb2MpIHtcbiAgICAgICAgICAgICAgICB2YXIgYWN0aXZlO1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGFjdGl2ZSA9IG93bmVyRG9jLmFjdGl2ZUVsZW1lbnQ7XG4gICAgICAgICAgICAgICAgfSBjYXRjaChlKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIElFOSB0aHJvd3MgaWYgeW91IGFjY2VzcyBhY3RpdmVFbGVtZW50IGR1cmluZyBwYWdlIGxvYWQgKHNlZSBpc3N1ZSAjNzAzKVxuICAgICAgICAgICAgICAgICAgICBhY3RpdmUgPSBvd25lckRvYy5ib2R5O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpc0ZvY3VzZWQgPSAoYWN0aXZlID09PSBlbGVtZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBtb2RlbFZhbHVlID0gdmFsdWVBY2Nlc3NvcigpO1xuICAgICAgICAgICAga28uZXhwcmVzc2lvblJld3JpdGluZy53cml0ZVZhbHVlVG9Qcm9wZXJ0eShtb2RlbFZhbHVlLCBhbGxCaW5kaW5nc0FjY2Vzc29yLCAnaGFzZm9jdXMnLCBpc0ZvY3VzZWQsIHRydWUpO1xuXG4gICAgICAgICAgICAvL2NhY2hlIHRoZSBsYXRlc3QgdmFsdWUsIHNvIHdlIGNhbiBhdm9pZCB1bm5lY2Vzc2FyaWx5IGNhbGxpbmcgZm9jdXMvYmx1ciBpbiB0aGUgdXBkYXRlIGZ1bmN0aW9uXG4gICAgICAgICAgICBlbGVtZW50W2hhc2ZvY3VzTGFzdFZhbHVlXSA9IGlzRm9jdXNlZDtcbiAgICAgICAgICAgIGVsZW1lbnRbaGFzZm9jdXNVcGRhdGluZ1Byb3BlcnR5XSA9IGZhbHNlO1xuICAgICAgICB9O1xuICAgICAgICB2YXIgaGFuZGxlRWxlbWVudEZvY3VzSW4gPSBoYW5kbGVFbGVtZW50Rm9jdXNDaGFuZ2UuYmluZChudWxsLCB0cnVlKTtcbiAgICAgICAgdmFyIGhhbmRsZUVsZW1lbnRGb2N1c091dCA9IGhhbmRsZUVsZW1lbnRGb2N1c0NoYW5nZS5iaW5kKG51bGwsIGZhbHNlKTtcblxuICAgICAgICBrby51dGlscy5yZWdpc3RlckV2ZW50SGFuZGxlcihlbGVtZW50LCBcImZvY3VzXCIsIGhhbmRsZUVsZW1lbnRGb2N1c0luKTtcbiAgICAgICAga28udXRpbHMucmVnaXN0ZXJFdmVudEhhbmRsZXIoZWxlbWVudCwgXCJmb2N1c2luXCIsIGhhbmRsZUVsZW1lbnRGb2N1c0luKTsgLy8gRm9yIElFXG4gICAgICAgIGtvLnV0aWxzLnJlZ2lzdGVyRXZlbnRIYW5kbGVyKGVsZW1lbnQsIFwiYmx1clwiLCAgaGFuZGxlRWxlbWVudEZvY3VzT3V0KTtcbiAgICAgICAga28udXRpbHMucmVnaXN0ZXJFdmVudEhhbmRsZXIoZWxlbWVudCwgXCJmb2N1c291dFwiLCAgaGFuZGxlRWxlbWVudEZvY3VzT3V0KTsgLy8gRm9yIElFXG4gICAgfSxcbiAgICAndXBkYXRlJzogZnVuY3Rpb24oZWxlbWVudCwgdmFsdWVBY2Nlc3Nvcikge1xuICAgICAgICB2YXIgdmFsdWUgPSAhIWtvLnV0aWxzLnVud3JhcE9ic2VydmFibGUodmFsdWVBY2Nlc3NvcigpKTsgLy9mb3JjZSBib29sZWFuIHRvIGNvbXBhcmUgd2l0aCBsYXN0IHZhbHVlXG4gICAgICAgIGlmICghZWxlbWVudFtoYXNmb2N1c1VwZGF0aW5nUHJvcGVydHldICYmIGVsZW1lbnRbaGFzZm9jdXNMYXN0VmFsdWVdICE9PSB2YWx1ZSkge1xuICAgICAgICAgICAgdmFsdWUgPyBlbGVtZW50LmZvY3VzKCkgOiBlbGVtZW50LmJsdXIoKTtcbiAgICAgICAgICAgIGtvLmRlcGVuZGVuY3lEZXRlY3Rpb24uaWdub3JlKGtvLnV0aWxzLnRyaWdnZXJFdmVudCwgbnVsbCwgW2VsZW1lbnQsIHZhbHVlID8gXCJmb2N1c2luXCIgOiBcImZvY3Vzb3V0XCJdKTsgLy8gRm9yIElFLCB3aGljaCBkb2Vzbid0IHJlbGlhYmx5IGZpcmUgXCJmb2N1c1wiIG9yIFwiYmx1clwiIGV2ZW50cyBzeW5jaHJvbm91c2x5XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5rby5iaW5kaW5nSGFuZGxlcnNbJ2hhc0ZvY3VzJ10gPSBrby5iaW5kaW5nSGFuZGxlcnNbJ2hhc2ZvY3VzJ107IC8vIE1ha2UgXCJoYXNGb2N1c1wiIGFuIGFsaWFzXG5rby5iaW5kaW5nSGFuZGxlcnNbJ2h0bWwnXSA9IHtcbiAgICAnaW5pdCc6IGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyBQcmV2ZW50IGJpbmRpbmcgb24gdGhlIGR5bmFtaWNhbGx5LWluamVjdGVkIEhUTUwgKGFzIGRldmVsb3BlcnMgYXJlIHVubGlrZWx5IHRvIGV4cGVjdCB0aGF0LCBhbmQgaXQgaGFzIHNlY3VyaXR5IGltcGxpY2F0aW9ucylcbiAgICAgICAgcmV0dXJuIHsgJ2NvbnRyb2xzRGVzY2VuZGFudEJpbmRpbmdzJzogdHJ1ZSB9O1xuICAgIH0sXG4gICAgJ3VwZGF0ZSc6IGZ1bmN0aW9uIChlbGVtZW50LCB2YWx1ZUFjY2Vzc29yKSB7XG4gICAgICAgIC8vIHNldEh0bWwgd2lsbCB1bndyYXAgdGhlIHZhbHVlIGlmIG5lZWRlZFxuICAgICAgICBrby51dGlscy5zZXRIdG1sKGVsZW1lbnQsIHZhbHVlQWNjZXNzb3IoKSk7XG4gICAgfVxufTtcbnZhciB3aXRoSWZEb21EYXRhS2V5ID0gJ19fa29fd2l0aElmQmluZGluZ0RhdGEnO1xuLy8gTWFrZXMgYSBiaW5kaW5nIGxpa2Ugd2l0aCBvciBpZlxuZnVuY3Rpb24gbWFrZVdpdGhJZkJpbmRpbmcoYmluZGluZ0tleSwgaXNXaXRoLCBpc05vdCwgbWFrZUNvbnRleHRDYWxsYmFjaykge1xuICAgIGtvLmJpbmRpbmdIYW5kbGVyc1tiaW5kaW5nS2V5XSA9IHtcbiAgICAgICAgJ2luaXQnOiBmdW5jdGlvbihlbGVtZW50LCB2YWx1ZUFjY2Vzc29yLCBhbGxCaW5kaW5nc0FjY2Vzc29yLCB2aWV3TW9kZWwsIGJpbmRpbmdDb250ZXh0KSB7XG4gICAgICAgICAgICBrby51dGlscy5kb21EYXRhLnNldChlbGVtZW50LCB3aXRoSWZEb21EYXRhS2V5LCB7fSk7XG4gICAgICAgICAgICByZXR1cm4geyAnY29udHJvbHNEZXNjZW5kYW50QmluZGluZ3MnOiB0cnVlIH07XG4gICAgICAgIH0sXG4gICAgICAgICd1cGRhdGUnOiBmdW5jdGlvbihlbGVtZW50LCB2YWx1ZUFjY2Vzc29yLCBhbGxCaW5kaW5nc0FjY2Vzc29yLCB2aWV3TW9kZWwsIGJpbmRpbmdDb250ZXh0KSB7XG4gICAgICAgICAgICB2YXIgd2l0aElmRGF0YSA9IGtvLnV0aWxzLmRvbURhdGEuZ2V0KGVsZW1lbnQsIHdpdGhJZkRvbURhdGFLZXkpLFxuICAgICAgICAgICAgICAgIGRhdGFWYWx1ZSA9IGtvLnV0aWxzLnVud3JhcE9ic2VydmFibGUodmFsdWVBY2Nlc3NvcigpKSxcbiAgICAgICAgICAgICAgICBzaG91bGREaXNwbGF5ID0gIWlzTm90ICE9PSAhZGF0YVZhbHVlLCAvLyBlcXVpdmFsZW50IHRvIGlzTm90ID8gIWRhdGFWYWx1ZSA6ICEhZGF0YVZhbHVlXG4gICAgICAgICAgICAgICAgaXNGaXJzdFJlbmRlciA9ICF3aXRoSWZEYXRhLnNhdmVkTm9kZXMsXG4gICAgICAgICAgICAgICAgbmVlZHNSZWZyZXNoID0gaXNGaXJzdFJlbmRlciB8fCBpc1dpdGggfHwgKHNob3VsZERpc3BsYXkgIT09IHdpdGhJZkRhdGEuZGlkRGlzcGxheU9uTGFzdFVwZGF0ZSk7XG5cbiAgICAgICAgICAgIGlmIChuZWVkc1JlZnJlc2gpIHtcbiAgICAgICAgICAgICAgICBpZiAoaXNGaXJzdFJlbmRlcikge1xuICAgICAgICAgICAgICAgICAgICB3aXRoSWZEYXRhLnNhdmVkTm9kZXMgPSBrby51dGlscy5jbG9uZU5vZGVzKGtvLnZpcnR1YWxFbGVtZW50cy5jaGlsZE5vZGVzKGVsZW1lbnQpLCB0cnVlIC8qIHNob3VsZENsZWFuTm9kZXMgKi8pO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChzaG91bGREaXNwbGF5KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghaXNGaXJzdFJlbmRlcikge1xuICAgICAgICAgICAgICAgICAgICAgICAga28udmlydHVhbEVsZW1lbnRzLnNldERvbU5vZGVDaGlsZHJlbihlbGVtZW50LCBrby51dGlscy5jbG9uZU5vZGVzKHdpdGhJZkRhdGEuc2F2ZWROb2RlcykpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGtvLmFwcGx5QmluZGluZ3NUb0Rlc2NlbmRhbnRzKG1ha2VDb250ZXh0Q2FsbGJhY2sgPyBtYWtlQ29udGV4dENhbGxiYWNrKGJpbmRpbmdDb250ZXh0LCBkYXRhVmFsdWUpIDogYmluZGluZ0NvbnRleHQsIGVsZW1lbnQpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGtvLnZpcnR1YWxFbGVtZW50cy5lbXB0eU5vZGUoZWxlbWVudCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgd2l0aElmRGF0YS5kaWREaXNwbGF5T25MYXN0VXBkYXRlID0gc2hvdWxkRGlzcGxheTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG4gICAga28uZXhwcmVzc2lvblJld3JpdGluZy5iaW5kaW5nUmV3cml0ZVZhbGlkYXRvcnNbYmluZGluZ0tleV0gPSBmYWxzZTsgLy8gQ2FuJ3QgcmV3cml0ZSBjb250cm9sIGZsb3cgYmluZGluZ3NcbiAgICBrby52aXJ0dWFsRWxlbWVudHMuYWxsb3dlZEJpbmRpbmdzW2JpbmRpbmdLZXldID0gdHJ1ZTtcbn1cblxuLy8gQ29uc3RydWN0IHRoZSBhY3R1YWwgYmluZGluZyBoYW5kbGVyc1xubWFrZVdpdGhJZkJpbmRpbmcoJ2lmJyk7XG5tYWtlV2l0aElmQmluZGluZygnaWZub3QnLCBmYWxzZSAvKiBpc1dpdGggKi8sIHRydWUgLyogaXNOb3QgKi8pO1xubWFrZVdpdGhJZkJpbmRpbmcoJ3dpdGgnLCB0cnVlIC8qIGlzV2l0aCAqLywgZmFsc2UgLyogaXNOb3QgKi8sXG4gICAgZnVuY3Rpb24oYmluZGluZ0NvbnRleHQsIGRhdGFWYWx1ZSkge1xuICAgICAgICByZXR1cm4gYmluZGluZ0NvbnRleHRbJ2NyZWF0ZUNoaWxkQ29udGV4dCddKGRhdGFWYWx1ZSk7XG4gICAgfVxuKTtcbmZ1bmN0aW9uIGVuc3VyZURyb3Bkb3duU2VsZWN0aW9uSXNDb25zaXN0ZW50V2l0aE1vZGVsVmFsdWUoZWxlbWVudCwgbW9kZWxWYWx1ZSwgcHJlZmVyTW9kZWxWYWx1ZSkge1xuICAgIGlmIChwcmVmZXJNb2RlbFZhbHVlKSB7XG4gICAgICAgIGlmIChtb2RlbFZhbHVlICE9PSBrby5zZWxlY3RFeHRlbnNpb25zLnJlYWRWYWx1ZShlbGVtZW50KSlcbiAgICAgICAgICAgIGtvLnNlbGVjdEV4dGVuc2lvbnMud3JpdGVWYWx1ZShlbGVtZW50LCBtb2RlbFZhbHVlKTtcbiAgICB9XG5cbiAgICAvLyBObyBtYXR0ZXIgd2hpY2ggZGlyZWN0aW9uIHdlJ3JlIHN5bmNpbmcgaW4sIHdlIHdhbnQgdGhlIGVuZCByZXN1bHQgdG8gYmUgZXF1YWxpdHkgYmV0d2VlbiBkcm9wZG93biB2YWx1ZSBhbmQgbW9kZWwgdmFsdWUuXG4gICAgLy8gSWYgdGhleSBhcmVuJ3QgZXF1YWwsIGVpdGhlciB3ZSBwcmVmZXIgdGhlIGRyb3Bkb3duIHZhbHVlLCBvciB0aGUgbW9kZWwgdmFsdWUgY291bGRuJ3QgYmUgcmVwcmVzZW50ZWQsIHNvIGVpdGhlciB3YXksXG4gICAgLy8gY2hhbmdlIHRoZSBtb2RlbCB2YWx1ZSB0byBtYXRjaCB0aGUgZHJvcGRvd24uXG4gICAgaWYgKG1vZGVsVmFsdWUgIT09IGtvLnNlbGVjdEV4dGVuc2lvbnMucmVhZFZhbHVlKGVsZW1lbnQpKVxuICAgICAgICBrby5kZXBlbmRlbmN5RGV0ZWN0aW9uLmlnbm9yZShrby51dGlscy50cmlnZ2VyRXZlbnQsIG51bGwsIFtlbGVtZW50LCBcImNoYW5nZVwiXSk7XG59O1xuXG5rby5iaW5kaW5nSGFuZGxlcnNbJ29wdGlvbnMnXSA9IHtcbiAgICAnaW5pdCc6IGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgICAgICAgaWYgKGtvLnV0aWxzLnRhZ05hbWVMb3dlcihlbGVtZW50KSAhPT0gXCJzZWxlY3RcIilcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIm9wdGlvbnMgYmluZGluZyBhcHBsaWVzIG9ubHkgdG8gU0VMRUNUIGVsZW1lbnRzXCIpO1xuXG4gICAgICAgIC8vIFJlbW92ZSBhbGwgZXhpc3RpbmcgPG9wdGlvbj5zLlxuICAgICAgICB3aGlsZSAoZWxlbWVudC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBlbGVtZW50LnJlbW92ZSgwKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEVuc3VyZXMgdGhhdCB0aGUgYmluZGluZyBwcm9jZXNzb3IgZG9lc24ndCB0cnkgdG8gYmluZCB0aGUgb3B0aW9uc1xuICAgICAgICByZXR1cm4geyAnY29udHJvbHNEZXNjZW5kYW50QmluZGluZ3MnOiB0cnVlIH07XG4gICAgfSxcbiAgICAndXBkYXRlJzogZnVuY3Rpb24gKGVsZW1lbnQsIHZhbHVlQWNjZXNzb3IsIGFsbEJpbmRpbmdzQWNjZXNzb3IpIHtcbiAgICAgICAgdmFyIHNlbGVjdFdhc1ByZXZpb3VzbHlFbXB0eSA9IGVsZW1lbnQubGVuZ3RoID09IDA7XG4gICAgICAgIHZhciBwcmV2aW91c1Njcm9sbFRvcCA9ICghc2VsZWN0V2FzUHJldmlvdXNseUVtcHR5ICYmIGVsZW1lbnQubXVsdGlwbGUpID8gZWxlbWVudC5zY3JvbGxUb3AgOiBudWxsO1xuXG4gICAgICAgIHZhciB1bndyYXBwZWRBcnJheSA9IGtvLnV0aWxzLnVud3JhcE9ic2VydmFibGUodmFsdWVBY2Nlc3NvcigpKTtcbiAgICAgICAgdmFyIGFsbEJpbmRpbmdzID0gYWxsQmluZGluZ3NBY2Nlc3NvcigpO1xuICAgICAgICB2YXIgaW5jbHVkZURlc3Ryb3llZCA9IGFsbEJpbmRpbmdzWydvcHRpb25zSW5jbHVkZURlc3Ryb3llZCddO1xuICAgICAgICB2YXIgY2FwdGlvblBsYWNlaG9sZGVyID0ge307XG4gICAgICAgIHZhciBjYXB0aW9uVmFsdWU7XG4gICAgICAgIHZhciBwcmV2aW91c1NlbGVjdGVkVmFsdWVzO1xuICAgICAgICBpZiAoZWxlbWVudC5tdWx0aXBsZSkge1xuICAgICAgICAgICAgcHJldmlvdXNTZWxlY3RlZFZhbHVlcyA9IGtvLnV0aWxzLmFycmF5TWFwKGVsZW1lbnQuc2VsZWN0ZWRPcHRpb25zIHx8IGtvLnV0aWxzLmFycmF5RmlsdGVyKGVsZW1lbnQuY2hpbGROb2RlcywgZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5vZGUudGFnTmFtZSAmJiAoa28udXRpbHMudGFnTmFtZUxvd2VyKG5vZGUpID09PSBcIm9wdGlvblwiKSAmJiBub2RlLnNlbGVjdGVkO1xuICAgICAgICAgICAgICAgIH0pLCBmdW5jdGlvbiAobm9kZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4ga28uc2VsZWN0RXh0ZW5zaW9ucy5yZWFkVmFsdWUobm9kZSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSBpZiAoZWxlbWVudC5zZWxlY3RlZEluZGV4ID49IDApIHtcbiAgICAgICAgICAgIHByZXZpb3VzU2VsZWN0ZWRWYWx1ZXMgPSBbIGtvLnNlbGVjdEV4dGVuc2lvbnMucmVhZFZhbHVlKGVsZW1lbnQub3B0aW9uc1tlbGVtZW50LnNlbGVjdGVkSW5kZXhdKSBdO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHVud3JhcHBlZEFycmF5KSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHVud3JhcHBlZEFycmF5Lmxlbmd0aCA9PSBcInVuZGVmaW5lZFwiKSAvLyBDb2VyY2Ugc2luZ2xlIHZhbHVlIGludG8gYXJyYXlcbiAgICAgICAgICAgICAgICB1bndyYXBwZWRBcnJheSA9IFt1bndyYXBwZWRBcnJheV07XG5cbiAgICAgICAgICAgIC8vIEZpbHRlciBvdXQgYW55IGVudHJpZXMgbWFya2VkIGFzIGRlc3Ryb3llZFxuICAgICAgICAgICAgdmFyIGZpbHRlcmVkQXJyYXkgPSBrby51dGlscy5hcnJheUZpbHRlcih1bndyYXBwZWRBcnJheSwgZnVuY3Rpb24oaXRlbSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBpbmNsdWRlRGVzdHJveWVkIHx8IGl0ZW0gPT09IHVuZGVmaW5lZCB8fCBpdGVtID09PSBudWxsIHx8ICFrby51dGlscy51bndyYXBPYnNlcnZhYmxlKGl0ZW1bJ19kZXN0cm95J10pO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIC8vIElmIGNhcHRpb24gaXMgaW5jbHVkZWQsIGFkZCBpdCB0byB0aGUgYXJyYXlcbiAgICAgICAgICAgIGlmICgnb3B0aW9uc0NhcHRpb24nIGluIGFsbEJpbmRpbmdzKSB7XG4gICAgICAgICAgICAgICAgY2FwdGlvblZhbHVlID0ga28udXRpbHMudW53cmFwT2JzZXJ2YWJsZShhbGxCaW5kaW5nc1snb3B0aW9uc0NhcHRpb24nXSk7XG4gICAgICAgICAgICAgICAgLy8gSWYgY2FwdGlvbiB2YWx1ZSBpcyBudWxsIG9yIHVuZGVmaW5lZCwgZG9uJ3Qgc2hvdyBhIGNhcHRpb25cbiAgICAgICAgICAgICAgICBpZiAoY2FwdGlvblZhbHVlICE9PSBudWxsICYmIGNhcHRpb25WYWx1ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIGZpbHRlcmVkQXJyYXkudW5zaGlmdChjYXB0aW9uUGxhY2Vob2xkZXIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIElmIGEgZmFsc3kgdmFsdWUgaXMgcHJvdmlkZWQgKGUuZy4gbnVsbCksIHdlJ2xsIHNpbXBseSBlbXB0eSB0aGUgc2VsZWN0IGVsZW1lbnRcbiAgICAgICAgICAgIHVud3JhcHBlZEFycmF5ID0gW107XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBhcHBseVRvT2JqZWN0KG9iamVjdCwgcHJlZGljYXRlLCBkZWZhdWx0VmFsdWUpIHtcbiAgICAgICAgICAgIHZhciBwcmVkaWNhdGVUeXBlID0gdHlwZW9mIHByZWRpY2F0ZTtcbiAgICAgICAgICAgIGlmIChwcmVkaWNhdGVUeXBlID09IFwiZnVuY3Rpb25cIikgICAgLy8gR2l2ZW4gYSBmdW5jdGlvbjsgcnVuIGl0IGFnYWluc3QgdGhlIGRhdGEgdmFsdWVcbiAgICAgICAgICAgICAgICByZXR1cm4gcHJlZGljYXRlKG9iamVjdCk7XG4gICAgICAgICAgICBlbHNlIGlmIChwcmVkaWNhdGVUeXBlID09IFwic3RyaW5nXCIpIC8vIEdpdmVuIGEgc3RyaW5nOyB0cmVhdCBpdCBhcyBhIHByb3BlcnR5IG5hbWUgb24gdGhlIGRhdGEgdmFsdWVcbiAgICAgICAgICAgICAgICByZXR1cm4gb2JqZWN0W3ByZWRpY2F0ZV07XG4gICAgICAgICAgICBlbHNlICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBHaXZlbiBubyBvcHRpb25zVGV4dCBhcmc7IHVzZSB0aGUgZGF0YSB2YWx1ZSBpdHNlbGZcbiAgICAgICAgICAgICAgICByZXR1cm4gZGVmYXVsdFZhbHVlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVGhlIGZvbGxvd2luZyBmdW5jdGlvbnMgY2FuIHJ1biBhdCB0d28gZGlmZmVyZW50IHRpbWVzOlxuICAgICAgICAvLyBUaGUgZmlyc3QgaXMgd2hlbiB0aGUgd2hvbGUgYXJyYXkgaXMgYmVpbmcgdXBkYXRlZCBkaXJlY3RseSBmcm9tIHRoaXMgYmluZGluZyBoYW5kbGVyLlxuICAgICAgICAvLyBUaGUgc2Vjb25kIGlzIHdoZW4gYW4gb2JzZXJ2YWJsZSB2YWx1ZSBmb3IgYSBzcGVjaWZpYyBhcnJheSBlbnRyeSBpcyB1cGRhdGVkLlxuICAgICAgICAvLyBvbGRPcHRpb25zIHdpbGwgYmUgZW1wdHkgaW4gdGhlIGZpcnN0IGNhc2UsIGJ1dCB3aWxsIGJlIGZpbGxlZCB3aXRoIHRoZSBwcmV2aW91c2x5IGdlbmVyYXRlZCBvcHRpb24gaW4gdGhlIHNlY29uZC5cbiAgICAgICAgZnVuY3Rpb24gb3B0aW9uRm9yQXJyYXlJdGVtKGFycmF5RW50cnksIGluZGV4LCBvbGRPcHRpb25zKSB7XG4gICAgICAgICAgICBpZiAob2xkT3B0aW9ucy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBwcmV2aW91c1NlbGVjdGVkVmFsdWVzID0gb2xkT3B0aW9uc1swXS5zZWxlY3RlZCAmJiBbIGtvLnNlbGVjdEV4dGVuc2lvbnMucmVhZFZhbHVlKG9sZE9wdGlvbnNbMF0pIF07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgb3B0aW9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcIm9wdGlvblwiKTtcbiAgICAgICAgICAgIGlmIChhcnJheUVudHJ5ID09PSBjYXB0aW9uUGxhY2Vob2xkZXIpIHtcbiAgICAgICAgICAgICAgICBrby51dGlscy5zZXRIdG1sKG9wdGlvbiwgY2FwdGlvblZhbHVlKTtcbiAgICAgICAgICAgICAgICBrby5zZWxlY3RFeHRlbnNpb25zLndyaXRlVmFsdWUob3B0aW9uLCB1bmRlZmluZWQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBBcHBseSBhIHZhbHVlIHRvIHRoZSBvcHRpb24gZWxlbWVudFxuICAgICAgICAgICAgICAgIHZhciBvcHRpb25WYWx1ZSA9IGFwcGx5VG9PYmplY3QoYXJyYXlFbnRyeSwgYWxsQmluZGluZ3NbJ29wdGlvbnNWYWx1ZSddLCBhcnJheUVudHJ5KTtcbiAgICAgICAgICAgICAgICBrby5zZWxlY3RFeHRlbnNpb25zLndyaXRlVmFsdWUob3B0aW9uLCBrby51dGlscy51bndyYXBPYnNlcnZhYmxlKG9wdGlvblZhbHVlKSk7XG5cbiAgICAgICAgICAgICAgICAvLyBBcHBseSBzb21lIHRleHQgdG8gdGhlIG9wdGlvbiBlbGVtZW50XG4gICAgICAgICAgICAgICAgdmFyIG9wdGlvblRleHQgPSBhcHBseVRvT2JqZWN0KGFycmF5RW50cnksIGFsbEJpbmRpbmdzWydvcHRpb25zVGV4dCddLCBvcHRpb25WYWx1ZSk7XG4gICAgICAgICAgICAgICAga28udXRpbHMuc2V0VGV4dENvbnRlbnQob3B0aW9uLCBvcHRpb25UZXh0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBbb3B0aW9uXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIHNldFNlbGVjdGlvbkNhbGxiYWNrKGFycmF5RW50cnksIG5ld09wdGlvbnMpIHtcbiAgICAgICAgICAgIC8vIElFNiBkb2Vzbid0IGxpa2UgdXMgdG8gYXNzaWduIHNlbGVjdGlvbiB0byBPUFRJT04gbm9kZXMgYmVmb3JlIHRoZXkncmUgYWRkZWQgdG8gdGhlIGRvY3VtZW50LlxuICAgICAgICAgICAgLy8gVGhhdCdzIHdoeSB3ZSBmaXJzdCBhZGRlZCB0aGVtIHdpdGhvdXQgc2VsZWN0aW9uLiBOb3cgaXQncyB0aW1lIHRvIHNldCB0aGUgc2VsZWN0aW9uLlxuICAgICAgICAgICAgaWYgKHByZXZpb3VzU2VsZWN0ZWRWYWx1ZXMpIHtcbiAgICAgICAgICAgICAgICB2YXIgaXNTZWxlY3RlZCA9IGtvLnV0aWxzLmFycmF5SW5kZXhPZihwcmV2aW91c1NlbGVjdGVkVmFsdWVzLCBrby5zZWxlY3RFeHRlbnNpb25zLnJlYWRWYWx1ZShuZXdPcHRpb25zWzBdKSkgPj0gMDtcbiAgICAgICAgICAgICAgICBrby51dGlscy5zZXRPcHRpb25Ob2RlU2VsZWN0aW9uU3RhdGUobmV3T3B0aW9uc1swXSwgaXNTZWxlY3RlZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgY2FsbGJhY2sgPSBzZXRTZWxlY3Rpb25DYWxsYmFjaztcbiAgICAgICAgaWYgKGFsbEJpbmRpbmdzWydvcHRpb25zQWZ0ZXJSZW5kZXInXSkge1xuICAgICAgICAgICAgY2FsbGJhY2sgPSBmdW5jdGlvbihhcnJheUVudHJ5LCBuZXdPcHRpb25zKSB7XG4gICAgICAgICAgICAgICAgc2V0U2VsZWN0aW9uQ2FsbGJhY2soYXJyYXlFbnRyeSwgbmV3T3B0aW9ucyk7XG4gICAgICAgICAgICAgICAga28uZGVwZW5kZW5jeURldGVjdGlvbi5pZ25vcmUoYWxsQmluZGluZ3NbJ29wdGlvbnNBZnRlclJlbmRlciddLCBudWxsLCBbbmV3T3B0aW9uc1swXSwgYXJyYXlFbnRyeSAhPT0gY2FwdGlvblBsYWNlaG9sZGVyID8gYXJyYXlFbnRyeSA6IHVuZGVmaW5lZF0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAga28udXRpbHMuc2V0RG9tTm9kZUNoaWxkcmVuRnJvbUFycmF5TWFwcGluZyhlbGVtZW50LCBmaWx0ZXJlZEFycmF5LCBvcHRpb25Gb3JBcnJheUl0ZW0sIG51bGwsIGNhbGxiYWNrKTtcblxuICAgICAgICAvLyBDbGVhciBwcmV2aW91c1NlbGVjdGVkVmFsdWVzIHNvIHRoYXQgZnV0dXJlIHVwZGF0ZXMgdG8gaW5kaXZpZHVhbCBvYmplY3RzIGRvbid0IGdldCBzdGFsZSBkYXRhXG4gICAgICAgIHByZXZpb3VzU2VsZWN0ZWRWYWx1ZXMgPSBudWxsO1xuXG4gICAgICAgIGlmIChzZWxlY3RXYXNQcmV2aW91c2x5RW1wdHkgJiYgKCd2YWx1ZScgaW4gYWxsQmluZGluZ3MpKSB7XG4gICAgICAgICAgICAvLyBFbnN1cmUgY29uc2lzdGVuY3kgYmV0d2VlbiBtb2RlbCB2YWx1ZSBhbmQgc2VsZWN0ZWQgb3B0aW9uLlxuICAgICAgICAgICAgLy8gSWYgdGhlIGRyb3Bkb3duIGlzIGJlaW5nIHBvcHVsYXRlZCBmb3IgdGhlIGZpcnN0IHRpbWUgaGVyZSAob3Igd2FzIG90aGVyd2lzZSBwcmV2aW91c2x5IGVtcHR5KSxcbiAgICAgICAgICAgIC8vIHRoZSBkcm9wZG93biBzZWxlY3Rpb24gc3RhdGUgaXMgbWVhbmluZ2xlc3MsIHNvIHdlIHByZXNlcnZlIHRoZSBtb2RlbCB2YWx1ZS5cbiAgICAgICAgICAgIGVuc3VyZURyb3Bkb3duU2VsZWN0aW9uSXNDb25zaXN0ZW50V2l0aE1vZGVsVmFsdWUoZWxlbWVudCwga28udXRpbHMucGVla09ic2VydmFibGUoYWxsQmluZGluZ3NbJ3ZhbHVlJ10pLCAvKiBwcmVmZXJNb2RlbFZhbHVlICovIHRydWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gV29ya2Fyb3VuZCBmb3IgSUUgYnVnXG4gICAgICAgIGtvLnV0aWxzLmVuc3VyZVNlbGVjdEVsZW1lbnRJc1JlbmRlcmVkQ29ycmVjdGx5KGVsZW1lbnQpO1xuXG4gICAgICAgIGlmIChwcmV2aW91c1Njcm9sbFRvcCAmJiBNYXRoLmFicyhwcmV2aW91c1Njcm9sbFRvcCAtIGVsZW1lbnQuc2Nyb2xsVG9wKSA+IDIwKVxuICAgICAgICAgICAgZWxlbWVudC5zY3JvbGxUb3AgPSBwcmV2aW91c1Njcm9sbFRvcDtcbiAgICB9XG59O1xua28uYmluZGluZ0hhbmRsZXJzWydvcHRpb25zJ10ub3B0aW9uVmFsdWVEb21EYXRhS2V5ID0gJ19fa28ub3B0aW9uVmFsdWVEb21EYXRhX18nO1xua28uYmluZGluZ0hhbmRsZXJzWydzZWxlY3RlZE9wdGlvbnMnXSA9IHtcbiAgICAnaW5pdCc6IGZ1bmN0aW9uIChlbGVtZW50LCB2YWx1ZUFjY2Vzc29yLCBhbGxCaW5kaW5nc0FjY2Vzc29yKSB7XG4gICAgICAgIGtvLnV0aWxzLnJlZ2lzdGVyRXZlbnRIYW5kbGVyKGVsZW1lbnQsIFwiY2hhbmdlXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IHZhbHVlQWNjZXNzb3IoKSwgdmFsdWVUb1dyaXRlID0gW107XG4gICAgICAgICAgICBrby51dGlscy5hcnJheUZvckVhY2goZWxlbWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZShcIm9wdGlvblwiKSwgZnVuY3Rpb24obm9kZSkge1xuICAgICAgICAgICAgICAgIGlmIChub2RlLnNlbGVjdGVkKVxuICAgICAgICAgICAgICAgICAgICB2YWx1ZVRvV3JpdGUucHVzaChrby5zZWxlY3RFeHRlbnNpb25zLnJlYWRWYWx1ZShub2RlKSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGtvLmV4cHJlc3Npb25SZXdyaXRpbmcud3JpdGVWYWx1ZVRvUHJvcGVydHkodmFsdWUsIGFsbEJpbmRpbmdzQWNjZXNzb3IsICdzZWxlY3RlZE9wdGlvbnMnLCB2YWx1ZVRvV3JpdGUpO1xuICAgICAgICB9KTtcbiAgICB9LFxuICAgICd1cGRhdGUnOiBmdW5jdGlvbiAoZWxlbWVudCwgdmFsdWVBY2Nlc3Nvcikge1xuICAgICAgICBpZiAoa28udXRpbHMudGFnTmFtZUxvd2VyKGVsZW1lbnQpICE9IFwic2VsZWN0XCIpXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJ2YWx1ZXMgYmluZGluZyBhcHBsaWVzIG9ubHkgdG8gU0VMRUNUIGVsZW1lbnRzXCIpO1xuXG4gICAgICAgIHZhciBuZXdWYWx1ZSA9IGtvLnV0aWxzLnVud3JhcE9ic2VydmFibGUodmFsdWVBY2Nlc3NvcigpKTtcbiAgICAgICAgaWYgKG5ld1ZhbHVlICYmIHR5cGVvZiBuZXdWYWx1ZS5sZW5ndGggPT0gXCJudW1iZXJcIikge1xuICAgICAgICAgICAga28udXRpbHMuYXJyYXlGb3JFYWNoKGVsZW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJvcHRpb25cIiksIGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgICAgICAgICAgICB2YXIgaXNTZWxlY3RlZCA9IGtvLnV0aWxzLmFycmF5SW5kZXhPZihuZXdWYWx1ZSwga28uc2VsZWN0RXh0ZW5zaW9ucy5yZWFkVmFsdWUobm9kZSkpID49IDA7XG4gICAgICAgICAgICAgICAga28udXRpbHMuc2V0T3B0aW9uTm9kZVNlbGVjdGlvblN0YXRlKG5vZGUsIGlzU2VsZWN0ZWQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG59O1xua28uYmluZGluZ0hhbmRsZXJzWydzdHlsZSddID0ge1xuICAgICd1cGRhdGUnOiBmdW5jdGlvbiAoZWxlbWVudCwgdmFsdWVBY2Nlc3Nvcikge1xuICAgICAgICB2YXIgdmFsdWUgPSBrby51dGlscy51bndyYXBPYnNlcnZhYmxlKHZhbHVlQWNjZXNzb3IoKSB8fCB7fSk7XG4gICAgICAgIGtvLnV0aWxzLm9iamVjdEZvckVhY2godmFsdWUsIGZ1bmN0aW9uKHN0eWxlTmFtZSwgc3R5bGVWYWx1ZSkge1xuICAgICAgICAgICAgc3R5bGVWYWx1ZSA9IGtvLnV0aWxzLnVud3JhcE9ic2VydmFibGUoc3R5bGVWYWx1ZSk7XG4gICAgICAgICAgICBlbGVtZW50LnN0eWxlW3N0eWxlTmFtZV0gPSBzdHlsZVZhbHVlIHx8IFwiXCI7IC8vIEVtcHR5IHN0cmluZyByZW1vdmVzIHRoZSB2YWx1ZSwgd2hlcmVhcyBudWxsL3VuZGVmaW5lZCBoYXZlIG5vIGVmZmVjdFxuICAgICAgICB9KTtcbiAgICB9XG59O1xua28uYmluZGluZ0hhbmRsZXJzWydzdWJtaXQnXSA9IHtcbiAgICAnaW5pdCc6IGZ1bmN0aW9uIChlbGVtZW50LCB2YWx1ZUFjY2Vzc29yLCBhbGxCaW5kaW5nc0FjY2Vzc29yLCB2aWV3TW9kZWwpIHtcbiAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZUFjY2Vzc29yKCkgIT0gXCJmdW5jdGlvblwiKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVGhlIHZhbHVlIGZvciBhIHN1Ym1pdCBiaW5kaW5nIG11c3QgYmUgYSBmdW5jdGlvblwiKTtcbiAgICAgICAga28udXRpbHMucmVnaXN0ZXJFdmVudEhhbmRsZXIoZWxlbWVudCwgXCJzdWJtaXRcIiwgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgICB2YXIgaGFuZGxlclJldHVyblZhbHVlO1xuICAgICAgICAgICAgdmFyIHZhbHVlID0gdmFsdWVBY2Nlc3NvcigpO1xuICAgICAgICAgICAgdHJ5IHsgaGFuZGxlclJldHVyblZhbHVlID0gdmFsdWUuY2FsbCh2aWV3TW9kZWwsIGVsZW1lbnQpOyB9XG4gICAgICAgICAgICBmaW5hbGx5IHtcbiAgICAgICAgICAgICAgICBpZiAoaGFuZGxlclJldHVyblZhbHVlICE9PSB0cnVlKSB7IC8vIE5vcm1hbGx5IHdlIHdhbnQgdG8gcHJldmVudCBkZWZhdWx0IGFjdGlvbi4gRGV2ZWxvcGVyIGNhbiBvdmVycmlkZSB0aGlzIGJlIGV4cGxpY2l0bHkgcmV0dXJuaW5nIHRydWUuXG4gICAgICAgICAgICAgICAgICAgIGlmIChldmVudC5wcmV2ZW50RGVmYXVsdClcbiAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50LnJldHVyblZhbHVlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG59O1xua28uYmluZGluZ0hhbmRsZXJzWyd0ZXh0J10gPSB7XG4gICAgJ3VwZGF0ZSc6IGZ1bmN0aW9uIChlbGVtZW50LCB2YWx1ZUFjY2Vzc29yKSB7XG4gICAgICAgIGtvLnV0aWxzLnNldFRleHRDb250ZW50KGVsZW1lbnQsIHZhbHVlQWNjZXNzb3IoKSk7XG4gICAgfVxufTtcbmtvLnZpcnR1YWxFbGVtZW50cy5hbGxvd2VkQmluZGluZ3NbJ3RleHQnXSA9IHRydWU7XG5rby5iaW5kaW5nSGFuZGxlcnNbJ3VuaXF1ZU5hbWUnXSA9IHtcbiAgICAnaW5pdCc6IGZ1bmN0aW9uIChlbGVtZW50LCB2YWx1ZUFjY2Vzc29yKSB7XG4gICAgICAgIGlmICh2YWx1ZUFjY2Vzc29yKCkpIHtcbiAgICAgICAgICAgIHZhciBuYW1lID0gXCJrb191bmlxdWVfXCIgKyAoKytrby5iaW5kaW5nSGFuZGxlcnNbJ3VuaXF1ZU5hbWUnXS5jdXJyZW50SW5kZXgpO1xuICAgICAgICAgICAga28udXRpbHMuc2V0RWxlbWVudE5hbWUoZWxlbWVudCwgbmFtZSk7XG4gICAgICAgIH1cbiAgICB9XG59O1xua28uYmluZGluZ0hhbmRsZXJzWyd1bmlxdWVOYW1lJ10uY3VycmVudEluZGV4ID0gMDtcbmtvLmJpbmRpbmdIYW5kbGVyc1sndmFsdWUnXSA9IHtcbiAgICAnaW5pdCc6IGZ1bmN0aW9uIChlbGVtZW50LCB2YWx1ZUFjY2Vzc29yLCBhbGxCaW5kaW5nc0FjY2Vzc29yKSB7XG4gICAgICAgIC8vIEFsd2F5cyBjYXRjaCBcImNoYW5nZVwiIGV2ZW50OyBwb3NzaWJseSBvdGhlciBldmVudHMgdG9vIGlmIGFza2VkXG4gICAgICAgIHZhciBldmVudHNUb0NhdGNoID0gW1wiY2hhbmdlXCJdO1xuICAgICAgICB2YXIgcmVxdWVzdGVkRXZlbnRzVG9DYXRjaCA9IGFsbEJpbmRpbmdzQWNjZXNzb3IoKVtcInZhbHVlVXBkYXRlXCJdO1xuICAgICAgICB2YXIgcHJvcGVydHlDaGFuZ2VkRmlyZWQgPSBmYWxzZTtcbiAgICAgICAgaWYgKHJlcXVlc3RlZEV2ZW50c1RvQ2F0Y2gpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgcmVxdWVzdGVkRXZlbnRzVG9DYXRjaCA9PSBcInN0cmluZ1wiKSAvLyBBbGxvdyBib3RoIGluZGl2aWR1YWwgZXZlbnQgbmFtZXMsIGFuZCBhcnJheXMgb2YgZXZlbnQgbmFtZXNcbiAgICAgICAgICAgICAgICByZXF1ZXN0ZWRFdmVudHNUb0NhdGNoID0gW3JlcXVlc3RlZEV2ZW50c1RvQ2F0Y2hdO1xuICAgICAgICAgICAga28udXRpbHMuYXJyYXlQdXNoQWxsKGV2ZW50c1RvQ2F0Y2gsIHJlcXVlc3RlZEV2ZW50c1RvQ2F0Y2gpO1xuICAgICAgICAgICAgZXZlbnRzVG9DYXRjaCA9IGtvLnV0aWxzLmFycmF5R2V0RGlzdGluY3RWYWx1ZXMoZXZlbnRzVG9DYXRjaCk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgdmFsdWVVcGRhdGVIYW5kbGVyID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBwcm9wZXJ0eUNoYW5nZWRGaXJlZCA9IGZhbHNlO1xuICAgICAgICAgICAgdmFyIG1vZGVsVmFsdWUgPSB2YWx1ZUFjY2Vzc29yKCk7XG4gICAgICAgICAgICB2YXIgZWxlbWVudFZhbHVlID0ga28uc2VsZWN0RXh0ZW5zaW9ucy5yZWFkVmFsdWUoZWxlbWVudCk7XG4gICAgICAgICAgICBrby5leHByZXNzaW9uUmV3cml0aW5nLndyaXRlVmFsdWVUb1Byb3BlcnR5KG1vZGVsVmFsdWUsIGFsbEJpbmRpbmdzQWNjZXNzb3IsICd2YWx1ZScsIGVsZW1lbnRWYWx1ZSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBXb3JrYXJvdW5kIGZvciBodHRwczovL2dpdGh1Yi5jb20vU3RldmVTYW5kZXJzb24va25vY2tvdXQvaXNzdWVzLzEyMlxuICAgICAgICAvLyBJRSBkb2Vzbid0IGZpcmUgXCJjaGFuZ2VcIiBldmVudHMgb24gdGV4dGJveGVzIGlmIHRoZSB1c2VyIHNlbGVjdHMgYSB2YWx1ZSBmcm9tIGl0cyBhdXRvY29tcGxldGUgbGlzdFxuICAgICAgICB2YXIgaWVBdXRvQ29tcGxldGVIYWNrTmVlZGVkID0ga28udXRpbHMuaWVWZXJzaW9uICYmIGVsZW1lbnQudGFnTmFtZS50b0xvd2VyQ2FzZSgpID09IFwiaW5wdXRcIiAmJiBlbGVtZW50LnR5cGUgPT0gXCJ0ZXh0XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICYmIGVsZW1lbnQuYXV0b2NvbXBsZXRlICE9IFwib2ZmXCIgJiYgKCFlbGVtZW50LmZvcm0gfHwgZWxlbWVudC5mb3JtLmF1dG9jb21wbGV0ZSAhPSBcIm9mZlwiKTtcbiAgICAgICAgaWYgKGllQXV0b0NvbXBsZXRlSGFja05lZWRlZCAmJiBrby51dGlscy5hcnJheUluZGV4T2YoZXZlbnRzVG9DYXRjaCwgXCJwcm9wZXJ0eWNoYW5nZVwiKSA9PSAtMSkge1xuICAgICAgICAgICAga28udXRpbHMucmVnaXN0ZXJFdmVudEhhbmRsZXIoZWxlbWVudCwgXCJwcm9wZXJ0eWNoYW5nZVwiLCBmdW5jdGlvbiAoKSB7IHByb3BlcnR5Q2hhbmdlZEZpcmVkID0gdHJ1ZSB9KTtcbiAgICAgICAgICAgIGtvLnV0aWxzLnJlZ2lzdGVyRXZlbnRIYW5kbGVyKGVsZW1lbnQsIFwiYmx1clwiLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBpZiAocHJvcGVydHlDaGFuZ2VkRmlyZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWVVcGRhdGVIYW5kbGVyKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBrby51dGlscy5hcnJheUZvckVhY2goZXZlbnRzVG9DYXRjaCwgZnVuY3Rpb24oZXZlbnROYW1lKSB7XG4gICAgICAgICAgICAvLyBUaGUgc3ludGF4IFwiYWZ0ZXI8ZXZlbnRuYW1lPlwiIG1lYW5zIFwicnVuIHRoZSBoYW5kbGVyIGFzeW5jaHJvbm91c2x5IGFmdGVyIHRoZSBldmVudFwiXG4gICAgICAgICAgICAvLyBUaGlzIGlzIHVzZWZ1bCwgZm9yIGV4YW1wbGUsIHRvIGNhdGNoIFwia2V5ZG93blwiIGV2ZW50cyBhZnRlciB0aGUgYnJvd3NlciBoYXMgdXBkYXRlZCB0aGUgY29udHJvbFxuICAgICAgICAgICAgLy8gKG90aGVyd2lzZSwga28uc2VsZWN0RXh0ZW5zaW9ucy5yZWFkVmFsdWUodGhpcykgd2lsbCByZWNlaXZlIHRoZSBjb250cm9sJ3MgdmFsdWUgKmJlZm9yZSogdGhlIGtleSBldmVudClcbiAgICAgICAgICAgIHZhciBoYW5kbGVyID0gdmFsdWVVcGRhdGVIYW5kbGVyO1xuICAgICAgICAgICAgaWYgKGtvLnV0aWxzLnN0cmluZ1N0YXJ0c1dpdGgoZXZlbnROYW1lLCBcImFmdGVyXCIpKSB7XG4gICAgICAgICAgICAgICAgaGFuZGxlciA9IGZ1bmN0aW9uKCkgeyBzZXRUaW1lb3V0KHZhbHVlVXBkYXRlSGFuZGxlciwgMCkgfTtcbiAgICAgICAgICAgICAgICBldmVudE5hbWUgPSBldmVudE5hbWUuc3Vic3RyaW5nKFwiYWZ0ZXJcIi5sZW5ndGgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAga28udXRpbHMucmVnaXN0ZXJFdmVudEhhbmRsZXIoZWxlbWVudCwgZXZlbnROYW1lLCBoYW5kbGVyKTtcbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICAndXBkYXRlJzogZnVuY3Rpb24gKGVsZW1lbnQsIHZhbHVlQWNjZXNzb3IpIHtcbiAgICAgICAgdmFyIHZhbHVlSXNTZWxlY3RPcHRpb24gPSBrby51dGlscy50YWdOYW1lTG93ZXIoZWxlbWVudCkgPT09IFwic2VsZWN0XCI7XG4gICAgICAgIHZhciBuZXdWYWx1ZSA9IGtvLnV0aWxzLnVud3JhcE9ic2VydmFibGUodmFsdWVBY2Nlc3NvcigpKTtcbiAgICAgICAgdmFyIGVsZW1lbnRWYWx1ZSA9IGtvLnNlbGVjdEV4dGVuc2lvbnMucmVhZFZhbHVlKGVsZW1lbnQpO1xuICAgICAgICB2YXIgdmFsdWVIYXNDaGFuZ2VkID0gKG5ld1ZhbHVlICE9PSBlbGVtZW50VmFsdWUpO1xuXG4gICAgICAgIGlmICh2YWx1ZUhhc0NoYW5nZWQpIHtcbiAgICAgICAgICAgIHZhciBhcHBseVZhbHVlQWN0aW9uID0gZnVuY3Rpb24gKCkgeyBrby5zZWxlY3RFeHRlbnNpb25zLndyaXRlVmFsdWUoZWxlbWVudCwgbmV3VmFsdWUpOyB9O1xuICAgICAgICAgICAgYXBwbHlWYWx1ZUFjdGlvbigpO1xuXG4gICAgICAgICAgICAvLyBXb3JrYXJvdW5kIGZvciBJRTYgYnVnOiBJdCB3b24ndCByZWxpYWJseSBhcHBseSB2YWx1ZXMgdG8gU0VMRUNUIG5vZGVzIGR1cmluZyB0aGUgc2FtZSBleGVjdXRpb24gdGhyZWFkXG4gICAgICAgICAgICAvLyByaWdodCBhZnRlciB5b3UndmUgY2hhbmdlZCB0aGUgc2V0IG9mIE9QVElPTiBub2RlcyBvbiBpdC4gU28gZm9yIHRoYXQgbm9kZSB0eXBlLCB3ZSdsbCBzY2hlZHVsZSBhIHNlY29uZCB0aHJlYWRcbiAgICAgICAgICAgIC8vIHRvIGFwcGx5IHRoZSB2YWx1ZSBhcyB3ZWxsLlxuICAgICAgICAgICAgdmFyIGFsc29BcHBseUFzeW5jaHJvbm91c2x5ID0gdmFsdWVJc1NlbGVjdE9wdGlvbjtcbiAgICAgICAgICAgIGlmIChhbHNvQXBwbHlBc3luY2hyb25vdXNseSlcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGFwcGx5VmFsdWVBY3Rpb24sIDApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSWYgeW91IHRyeSB0byBzZXQgYSBtb2RlbCB2YWx1ZSB0aGF0IGNhbid0IGJlIHJlcHJlc2VudGVkIGluIGFuIGFscmVhZHktcG9wdWxhdGVkIGRyb3Bkb3duLCByZWplY3QgdGhhdCBjaGFuZ2UsXG4gICAgICAgIC8vIGJlY2F1c2UgeW91J3JlIG5vdCBhbGxvd2VkIHRvIGhhdmUgYSBtb2RlbCB2YWx1ZSB0aGF0IGRpc2FncmVlcyB3aXRoIGEgdmlzaWJsZSBVSSBzZWxlY3Rpb24uXG4gICAgICAgIGlmICh2YWx1ZUlzU2VsZWN0T3B0aW9uICYmIChlbGVtZW50Lmxlbmd0aCA+IDApKVxuICAgICAgICAgICAgZW5zdXJlRHJvcGRvd25TZWxlY3Rpb25Jc0NvbnNpc3RlbnRXaXRoTW9kZWxWYWx1ZShlbGVtZW50LCBuZXdWYWx1ZSwgLyogcHJlZmVyTW9kZWxWYWx1ZSAqLyBmYWxzZSk7XG4gICAgfVxufTtcbmtvLmJpbmRpbmdIYW5kbGVyc1sndmlzaWJsZSddID0ge1xuICAgICd1cGRhdGUnOiBmdW5jdGlvbiAoZWxlbWVudCwgdmFsdWVBY2Nlc3Nvcikge1xuICAgICAgICB2YXIgdmFsdWUgPSBrby51dGlscy51bndyYXBPYnNlcnZhYmxlKHZhbHVlQWNjZXNzb3IoKSk7XG4gICAgICAgIHZhciBpc0N1cnJlbnRseVZpc2libGUgPSAhKGVsZW1lbnQuc3R5bGUuZGlzcGxheSA9PSBcIm5vbmVcIik7XG4gICAgICAgIGlmICh2YWx1ZSAmJiAhaXNDdXJyZW50bHlWaXNpYmxlKVxuICAgICAgICAgICAgZWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gXCJcIjtcbiAgICAgICAgZWxzZSBpZiAoKCF2YWx1ZSkgJiYgaXNDdXJyZW50bHlWaXNpYmxlKVxuICAgICAgICAgICAgZWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgfVxufTtcbi8vICdjbGljaycgaXMganVzdCBhIHNob3J0aGFuZCBmb3IgdGhlIHVzdWFsIGZ1bGwtbGVuZ3RoIGV2ZW50OntjbGljazpoYW5kbGVyfVxubWFrZUV2ZW50SGFuZGxlclNob3J0Y3V0KCdjbGljaycpO1xuLy8gSWYgeW91IHdhbnQgdG8gbWFrZSBhIGN1c3RvbSB0ZW1wbGF0ZSBlbmdpbmUsXG4vL1xuLy8gWzFdIEluaGVyaXQgZnJvbSB0aGlzIGNsYXNzIChsaWtlIGtvLm5hdGl2ZVRlbXBsYXRlRW5naW5lIGRvZXMpXG4vLyBbMl0gT3ZlcnJpZGUgJ3JlbmRlclRlbXBsYXRlU291cmNlJywgc3VwcGx5aW5nIGEgZnVuY3Rpb24gd2l0aCB0aGlzIHNpZ25hdHVyZTpcbi8vXG4vLyAgICAgICAgZnVuY3Rpb24gKHRlbXBsYXRlU291cmNlLCBiaW5kaW5nQ29udGV4dCwgb3B0aW9ucykge1xuLy8gICAgICAgICAgICAvLyAtIHRlbXBsYXRlU291cmNlLnRleHQoKSBpcyB0aGUgdGV4dCBvZiB0aGUgdGVtcGxhdGUgeW91IHNob3VsZCByZW5kZXJcbi8vICAgICAgICAgICAgLy8gLSBiaW5kaW5nQ29udGV4dC4kZGF0YSBpcyB0aGUgZGF0YSB5b3Ugc2hvdWxkIHBhc3MgaW50byB0aGUgdGVtcGxhdGVcbi8vICAgICAgICAgICAgLy8gICAtIHlvdSBtaWdodCBhbHNvIHdhbnQgdG8gbWFrZSBiaW5kaW5nQ29udGV4dC4kcGFyZW50LCBiaW5kaW5nQ29udGV4dC4kcGFyZW50cyxcbi8vICAgICAgICAgICAgLy8gICAgIGFuZCBiaW5kaW5nQ29udGV4dC4kcm9vdCBhdmFpbGFibGUgaW4gdGhlIHRlbXBsYXRlIHRvb1xuLy8gICAgICAgICAgICAvLyAtIG9wdGlvbnMgZ2l2ZXMgeW91IGFjY2VzcyB0byBhbnkgb3RoZXIgcHJvcGVydGllcyBzZXQgb24gXCJkYXRhLWJpbmQ6IHsgdGVtcGxhdGU6IG9wdGlvbnMgfVwiXG4vLyAgICAgICAgICAgIC8vXG4vLyAgICAgICAgICAgIC8vIFJldHVybiB2YWx1ZTogYW4gYXJyYXkgb2YgRE9NIG5vZGVzXG4vLyAgICAgICAgfVxuLy9cbi8vIFszXSBPdmVycmlkZSAnY3JlYXRlSmF2YVNjcmlwdEV2YWx1YXRvckJsb2NrJywgc3VwcGx5aW5nIGEgZnVuY3Rpb24gd2l0aCB0aGlzIHNpZ25hdHVyZTpcbi8vXG4vLyAgICAgICAgZnVuY3Rpb24gKHNjcmlwdCkge1xuLy8gICAgICAgICAgICAvLyBSZXR1cm4gdmFsdWU6IFdoYXRldmVyIHN5bnRheCBtZWFucyBcIkV2YWx1YXRlIHRoZSBKYXZhU2NyaXB0IHN0YXRlbWVudCAnc2NyaXB0JyBhbmQgb3V0cHV0IHRoZSByZXN1bHRcIlxuLy8gICAgICAgICAgICAvLyAgICAgICAgICAgICAgIEZvciBleGFtcGxlLCB0aGUganF1ZXJ5LnRtcGwgdGVtcGxhdGUgZW5naW5lIGNvbnZlcnRzICdzb21lU2NyaXB0JyB0byAnJHsgc29tZVNjcmlwdCB9J1xuLy8gICAgICAgIH1cbi8vXG4vLyAgICAgVGhpcyBpcyBvbmx5IG5lY2Vzc2FyeSBpZiB5b3Ugd2FudCB0byBhbGxvdyBkYXRhLWJpbmQgYXR0cmlidXRlcyB0byByZWZlcmVuY2UgYXJiaXRyYXJ5IHRlbXBsYXRlIHZhcmlhYmxlcy5cbi8vICAgICBJZiB5b3UgZG9uJ3Qgd2FudCB0byBhbGxvdyB0aGF0LCB5b3UgY2FuIHNldCB0aGUgcHJvcGVydHkgJ2FsbG93VGVtcGxhdGVSZXdyaXRpbmcnIHRvIGZhbHNlIChsaWtlIGtvLm5hdGl2ZVRlbXBsYXRlRW5naW5lIGRvZXMpXG4vLyAgICAgYW5kIHRoZW4geW91IGRvbid0IG5lZWQgdG8gb3ZlcnJpZGUgJ2NyZWF0ZUphdmFTY3JpcHRFdmFsdWF0b3JCbG9jaycuXG5cbmtvLnRlbXBsYXRlRW5naW5lID0gZnVuY3Rpb24gKCkgeyB9O1xuXG5rby50ZW1wbGF0ZUVuZ2luZS5wcm90b3R5cGVbJ3JlbmRlclRlbXBsYXRlU291cmNlJ10gPSBmdW5jdGlvbiAodGVtcGxhdGVTb3VyY2UsIGJpbmRpbmdDb250ZXh0LCBvcHRpb25zKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiT3ZlcnJpZGUgcmVuZGVyVGVtcGxhdGVTb3VyY2VcIik7XG59O1xuXG5rby50ZW1wbGF0ZUVuZ2luZS5wcm90b3R5cGVbJ2NyZWF0ZUphdmFTY3JpcHRFdmFsdWF0b3JCbG9jayddID0gZnVuY3Rpb24gKHNjcmlwdCkge1xuICAgIHRocm93IG5ldyBFcnJvcihcIk92ZXJyaWRlIGNyZWF0ZUphdmFTY3JpcHRFdmFsdWF0b3JCbG9ja1wiKTtcbn07XG5cbmtvLnRlbXBsYXRlRW5naW5lLnByb3RvdHlwZVsnbWFrZVRlbXBsYXRlU291cmNlJ10gPSBmdW5jdGlvbih0ZW1wbGF0ZSwgdGVtcGxhdGVEb2N1bWVudCkge1xuICAgIC8vIE5hbWVkIHRlbXBsYXRlXG4gICAgaWYgKHR5cGVvZiB0ZW1wbGF0ZSA9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgIHRlbXBsYXRlRG9jdW1lbnQgPSB0ZW1wbGF0ZURvY3VtZW50IHx8IGRvY3VtZW50O1xuICAgICAgICB2YXIgZWxlbSA9IHRlbXBsYXRlRG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQodGVtcGxhdGUpO1xuICAgICAgICBpZiAoIWVsZW0pXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCB0ZW1wbGF0ZSB3aXRoIElEIFwiICsgdGVtcGxhdGUpO1xuICAgICAgICByZXR1cm4gbmV3IGtvLnRlbXBsYXRlU291cmNlcy5kb21FbGVtZW50KGVsZW0pO1xuICAgIH0gZWxzZSBpZiAoKHRlbXBsYXRlLm5vZGVUeXBlID09IDEpIHx8ICh0ZW1wbGF0ZS5ub2RlVHlwZSA9PSA4KSkge1xuICAgICAgICAvLyBBbm9ueW1vdXMgdGVtcGxhdGVcbiAgICAgICAgcmV0dXJuIG5ldyBrby50ZW1wbGF0ZVNvdXJjZXMuYW5vbnltb3VzVGVtcGxhdGUodGVtcGxhdGUpO1xuICAgIH0gZWxzZVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJVbmtub3duIHRlbXBsYXRlIHR5cGU6IFwiICsgdGVtcGxhdGUpO1xufTtcblxua28udGVtcGxhdGVFbmdpbmUucHJvdG90eXBlWydyZW5kZXJUZW1wbGF0ZSddID0gZnVuY3Rpb24gKHRlbXBsYXRlLCBiaW5kaW5nQ29udGV4dCwgb3B0aW9ucywgdGVtcGxhdGVEb2N1bWVudCkge1xuICAgIHZhciB0ZW1wbGF0ZVNvdXJjZSA9IHRoaXNbJ21ha2VUZW1wbGF0ZVNvdXJjZSddKHRlbXBsYXRlLCB0ZW1wbGF0ZURvY3VtZW50KTtcbiAgICByZXR1cm4gdGhpc1sncmVuZGVyVGVtcGxhdGVTb3VyY2UnXSh0ZW1wbGF0ZVNvdXJjZSwgYmluZGluZ0NvbnRleHQsIG9wdGlvbnMpO1xufTtcblxua28udGVtcGxhdGVFbmdpbmUucHJvdG90eXBlWydpc1RlbXBsYXRlUmV3cml0dGVuJ10gPSBmdW5jdGlvbiAodGVtcGxhdGUsIHRlbXBsYXRlRG9jdW1lbnQpIHtcbiAgICAvLyBTa2lwIHJld3JpdGluZyBpZiByZXF1ZXN0ZWRcbiAgICBpZiAodGhpc1snYWxsb3dUZW1wbGF0ZVJld3JpdGluZyddID09PSBmYWxzZSlcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgcmV0dXJuIHRoaXNbJ21ha2VUZW1wbGF0ZVNvdXJjZSddKHRlbXBsYXRlLCB0ZW1wbGF0ZURvY3VtZW50KVsnZGF0YSddKFwiaXNSZXdyaXR0ZW5cIik7XG59O1xuXG5rby50ZW1wbGF0ZUVuZ2luZS5wcm90b3R5cGVbJ3Jld3JpdGVUZW1wbGF0ZSddID0gZnVuY3Rpb24gKHRlbXBsYXRlLCByZXdyaXRlckNhbGxiYWNrLCB0ZW1wbGF0ZURvY3VtZW50KSB7XG4gICAgdmFyIHRlbXBsYXRlU291cmNlID0gdGhpc1snbWFrZVRlbXBsYXRlU291cmNlJ10odGVtcGxhdGUsIHRlbXBsYXRlRG9jdW1lbnQpO1xuICAgIHZhciByZXdyaXR0ZW4gPSByZXdyaXRlckNhbGxiYWNrKHRlbXBsYXRlU291cmNlWyd0ZXh0J10oKSk7XG4gICAgdGVtcGxhdGVTb3VyY2VbJ3RleHQnXShyZXdyaXR0ZW4pO1xuICAgIHRlbXBsYXRlU291cmNlWydkYXRhJ10oXCJpc1Jld3JpdHRlblwiLCB0cnVlKTtcbn07XG5cbmtvLmV4cG9ydFN5bWJvbCgndGVtcGxhdGVFbmdpbmUnLCBrby50ZW1wbGF0ZUVuZ2luZSk7XG5cbmtvLnRlbXBsYXRlUmV3cml0aW5nID0gKGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgbWVtb2l6ZURhdGFCaW5kaW5nQXR0cmlidXRlU3ludGF4UmVnZXggPSAvKDwoW2Etel0rXFxkKikoPzpcXHMrKD8hZGF0YS1iaW5kXFxzKj1cXHMqKVthLXowLTlcXC1dKyg/Oj0oPzpcXFwiW15cXFwiXSpcXFwifFxcJ1teXFwnXSpcXCcpKT8pKlxccyspZGF0YS1iaW5kXFxzKj1cXHMqKFtcIiddKShbXFxzXFxTXSo/KVxcMy9naTtcbiAgICB2YXIgbWVtb2l6ZVZpcnR1YWxDb250YWluZXJCaW5kaW5nU3ludGF4UmVnZXggPSAvPCEtLVxccyprb1xcYlxccyooW1xcc1xcU10qPylcXHMqLS0+L2c7XG5cbiAgICBmdW5jdGlvbiB2YWxpZGF0ZURhdGFCaW5kVmFsdWVzRm9yUmV3cml0aW5nKGtleVZhbHVlQXJyYXkpIHtcbiAgICAgICAgdmFyIGFsbFZhbGlkYXRvcnMgPSBrby5leHByZXNzaW9uUmV3cml0aW5nLmJpbmRpbmdSZXdyaXRlVmFsaWRhdG9ycztcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBrZXlWYWx1ZUFycmF5Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIga2V5ID0ga2V5VmFsdWVBcnJheVtpXVsna2V5J107XG4gICAgICAgICAgICBpZiAoYWxsVmFsaWRhdG9ycy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICAgICAgdmFyIHZhbGlkYXRvciA9IGFsbFZhbGlkYXRvcnNba2V5XTtcblxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdmFsaWRhdG9yID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHBvc3NpYmxlRXJyb3JNZXNzYWdlID0gdmFsaWRhdG9yKGtleVZhbHVlQXJyYXlbaV1bJ3ZhbHVlJ10pO1xuICAgICAgICAgICAgICAgICAgICBpZiAocG9zc2libGVFcnJvck1lc3NhZ2UpXG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IocG9zc2libGVFcnJvck1lc3NhZ2UpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIXZhbGlkYXRvcikge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJUaGlzIHRlbXBsYXRlIGVuZ2luZSBkb2VzIG5vdCBzdXBwb3J0IHRoZSAnXCIgKyBrZXkgKyBcIicgYmluZGluZyB3aXRoaW4gaXRzIHRlbXBsYXRlc1wiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjb25zdHJ1Y3RNZW1vaXplZFRhZ1JlcGxhY2VtZW50KGRhdGFCaW5kQXR0cmlidXRlVmFsdWUsIHRhZ1RvUmV0YWluLCBub2RlTmFtZSwgdGVtcGxhdGVFbmdpbmUpIHtcbiAgICAgICAgdmFyIGRhdGFCaW5kS2V5VmFsdWVBcnJheSA9IGtvLmV4cHJlc3Npb25SZXdyaXRpbmcucGFyc2VPYmplY3RMaXRlcmFsKGRhdGFCaW5kQXR0cmlidXRlVmFsdWUpO1xuICAgICAgICB2YWxpZGF0ZURhdGFCaW5kVmFsdWVzRm9yUmV3cml0aW5nKGRhdGFCaW5kS2V5VmFsdWVBcnJheSk7XG4gICAgICAgIHZhciByZXdyaXR0ZW5EYXRhQmluZEF0dHJpYnV0ZVZhbHVlID0ga28uZXhwcmVzc2lvblJld3JpdGluZy5wcmVQcm9jZXNzQmluZGluZ3MoZGF0YUJpbmRLZXlWYWx1ZUFycmF5KTtcblxuICAgICAgICAvLyBGb3Igbm8gb2J2aW91cyByZWFzb24sIE9wZXJhIGZhaWxzIHRvIGV2YWx1YXRlIHJld3JpdHRlbkRhdGFCaW5kQXR0cmlidXRlVmFsdWUgdW5sZXNzIGl0J3Mgd3JhcHBlZCBpbiBhbiBhZGRpdGlvbmFsXG4gICAgICAgIC8vIGFub255bW91cyBmdW5jdGlvbiwgZXZlbiB0aG91Z2ggT3BlcmEncyBidWlsdC1pbiBkZWJ1Z2dlciBjYW4gZXZhbHVhdGUgaXQgYW55d2F5LiBObyBvdGhlciBicm93c2VyIHJlcXVpcmVzIHRoaXNcbiAgICAgICAgLy8gZXh0cmEgaW5kaXJlY3Rpb24uXG4gICAgICAgIHZhciBhcHBseUJpbmRpbmdzVG9OZXh0U2libGluZ1NjcmlwdCA9XG4gICAgICAgICAgICBcImtvLl9fdHJfYW1idG5zKGZ1bmN0aW9uKCRjb250ZXh0LCRlbGVtZW50KXtyZXR1cm4oZnVuY3Rpb24oKXtyZXR1cm57IFwiICsgcmV3cml0dGVuRGF0YUJpbmRBdHRyaWJ1dGVWYWx1ZSArIFwiIH0gfSkoKX0sJ1wiICsgbm9kZU5hbWUudG9Mb3dlckNhc2UoKSArIFwiJylcIjtcbiAgICAgICAgcmV0dXJuIHRlbXBsYXRlRW5naW5lWydjcmVhdGVKYXZhU2NyaXB0RXZhbHVhdG9yQmxvY2snXShhcHBseUJpbmRpbmdzVG9OZXh0U2libGluZ1NjcmlwdCkgKyB0YWdUb1JldGFpbjtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBlbnN1cmVUZW1wbGF0ZUlzUmV3cml0dGVuOiBmdW5jdGlvbiAodGVtcGxhdGUsIHRlbXBsYXRlRW5naW5lLCB0ZW1wbGF0ZURvY3VtZW50KSB7XG4gICAgICAgICAgICBpZiAoIXRlbXBsYXRlRW5naW5lWydpc1RlbXBsYXRlUmV3cml0dGVuJ10odGVtcGxhdGUsIHRlbXBsYXRlRG9jdW1lbnQpKVxuICAgICAgICAgICAgICAgIHRlbXBsYXRlRW5naW5lWydyZXdyaXRlVGVtcGxhdGUnXSh0ZW1wbGF0ZSwgZnVuY3Rpb24gKGh0bWxTdHJpbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGtvLnRlbXBsYXRlUmV3cml0aW5nLm1lbW9pemVCaW5kaW5nQXR0cmlidXRlU3ludGF4KGh0bWxTdHJpbmcsIHRlbXBsYXRlRW5naW5lKTtcbiAgICAgICAgICAgICAgICB9LCB0ZW1wbGF0ZURvY3VtZW50KTtcbiAgICAgICAgfSxcblxuICAgICAgICBtZW1vaXplQmluZGluZ0F0dHJpYnV0ZVN5bnRheDogZnVuY3Rpb24gKGh0bWxTdHJpbmcsIHRlbXBsYXRlRW5naW5lKSB7XG4gICAgICAgICAgICByZXR1cm4gaHRtbFN0cmluZy5yZXBsYWNlKG1lbW9pemVEYXRhQmluZGluZ0F0dHJpYnV0ZVN5bnRheFJlZ2V4LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnN0cnVjdE1lbW9pemVkVGFnUmVwbGFjZW1lbnQoLyogZGF0YUJpbmRBdHRyaWJ1dGVWYWx1ZTogKi8gYXJndW1lbnRzWzRdLCAvKiB0YWdUb1JldGFpbjogKi8gYXJndW1lbnRzWzFdLCAvKiBub2RlTmFtZTogKi8gYXJndW1lbnRzWzJdLCB0ZW1wbGF0ZUVuZ2luZSk7XG4gICAgICAgICAgICB9KS5yZXBsYWNlKG1lbW9pemVWaXJ0dWFsQ29udGFpbmVyQmluZGluZ1N5bnRheFJlZ2V4LCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY29uc3RydWN0TWVtb2l6ZWRUYWdSZXBsYWNlbWVudCgvKiBkYXRhQmluZEF0dHJpYnV0ZVZhbHVlOiAqLyBhcmd1bWVudHNbMV0sIC8qIHRhZ1RvUmV0YWluOiAqLyBcIjwhLS0ga28gLS0+XCIsIC8qIG5vZGVOYW1lOiAqLyBcIiNjb21tZW50XCIsIHRlbXBsYXRlRW5naW5lKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIGFwcGx5TWVtb2l6ZWRCaW5kaW5nc1RvTmV4dFNpYmxpbmc6IGZ1bmN0aW9uIChiaW5kaW5ncywgbm9kZU5hbWUpIHtcbiAgICAgICAgICAgIHJldHVybiBrby5tZW1vaXphdGlvbi5tZW1vaXplKGZ1bmN0aW9uIChkb21Ob2RlLCBiaW5kaW5nQ29udGV4dCkge1xuICAgICAgICAgICAgICAgIHZhciBub2RlVG9CaW5kID0gZG9tTm9kZS5uZXh0U2libGluZztcbiAgICAgICAgICAgICAgICBpZiAobm9kZVRvQmluZCAmJiBub2RlVG9CaW5kLm5vZGVOYW1lLnRvTG93ZXJDYXNlKCkgPT09IG5vZGVOYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIGtvLmFwcGx5QmluZGluZ3NUb05vZGUobm9kZVRvQmluZCwgYmluZGluZ3MsIGJpbmRpbmdDb250ZXh0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cbn0pKCk7XG5cblxuLy8gRXhwb3J0ZWQgb25seSBiZWNhdXNlIGl0IGhhcyB0byBiZSByZWZlcmVuY2VkIGJ5IHN0cmluZyBsb29rdXAgZnJvbSB3aXRoaW4gcmV3cml0dGVuIHRlbXBsYXRlXG5rby5leHBvcnRTeW1ib2woJ19fdHJfYW1idG5zJywga28udGVtcGxhdGVSZXdyaXRpbmcuYXBwbHlNZW1vaXplZEJpbmRpbmdzVG9OZXh0U2libGluZyk7XG4oZnVuY3Rpb24oKSB7XG4gICAgLy8gQSB0ZW1wbGF0ZSBzb3VyY2UgcmVwcmVzZW50cyBhIHJlYWQvd3JpdGUgd2F5IG9mIGFjY2Vzc2luZyBhIHRlbXBsYXRlLiBUaGlzIGlzIHRvIGVsaW1pbmF0ZSB0aGUgbmVlZCBmb3IgdGVtcGxhdGUgbG9hZGluZy9zYXZpbmdcbiAgICAvLyBsb2dpYyB0byBiZSBkdXBsaWNhdGVkIGluIGV2ZXJ5IHRlbXBsYXRlIGVuZ2luZSAoYW5kIG1lYW5zIHRoZXkgY2FuIGFsbCB3b3JrIHdpdGggYW5vbnltb3VzIHRlbXBsYXRlcywgZXRjLilcbiAgICAvL1xuICAgIC8vIFR3byBhcmUgcHJvdmlkZWQgYnkgZGVmYXVsdDpcbiAgICAvLyAgMS4ga28udGVtcGxhdGVTb3VyY2VzLmRvbUVsZW1lbnQgICAgICAgLSByZWFkcy93cml0ZXMgdGhlIHRleHQgY29udGVudCBvZiBhbiBhcmJpdHJhcnkgRE9NIGVsZW1lbnRcbiAgICAvLyAgMi4ga28udGVtcGxhdGVTb3VyY2VzLmFub255bW91c0VsZW1lbnQgLSB1c2VzIGtvLnV0aWxzLmRvbURhdGEgdG8gcmVhZC93cml0ZSB0ZXh0ICphc3NvY2lhdGVkKiB3aXRoIHRoZSBET00gZWxlbWVudCwgYnV0XG4gICAgLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2l0aG91dCByZWFkaW5nL3dyaXRpbmcgdGhlIGFjdHVhbCBlbGVtZW50IHRleHQgY29udGVudCwgc2luY2UgaXQgd2lsbCBiZSBvdmVyd3JpdHRlblxuICAgIC8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpdGggdGhlIHJlbmRlcmVkIHRlbXBsYXRlIG91dHB1dC5cbiAgICAvLyBZb3UgY2FuIGltcGxlbWVudCB5b3VyIG93biB0ZW1wbGF0ZSBzb3VyY2UgaWYgeW91IHdhbnQgdG8gZmV0Y2gvc3RvcmUgdGVtcGxhdGVzIHNvbWV3aGVyZSBvdGhlciB0aGFuIGluIERPTSBlbGVtZW50cy5cbiAgICAvLyBUZW1wbGF0ZSBzb3VyY2VzIG5lZWQgdG8gaGF2ZSB0aGUgZm9sbG93aW5nIGZ1bmN0aW9uczpcbiAgICAvLyAgIHRleHQoKSBcdFx0XHQtIHJldHVybnMgdGhlIHRlbXBsYXRlIHRleHQgZnJvbSB5b3VyIHN0b3JhZ2UgbG9jYXRpb25cbiAgICAvLyAgIHRleHQodmFsdWUpXHRcdC0gd3JpdGVzIHRoZSBzdXBwbGllZCB0ZW1wbGF0ZSB0ZXh0IHRvIHlvdXIgc3RvcmFnZSBsb2NhdGlvblxuICAgIC8vICAgZGF0YShrZXkpXHRcdFx0LSByZWFkcyB2YWx1ZXMgc3RvcmVkIHVzaW5nIGRhdGEoa2V5LCB2YWx1ZSkgLSBzZWUgYmVsb3dcbiAgICAvLyAgIGRhdGEoa2V5LCB2YWx1ZSlcdC0gYXNzb2NpYXRlcyBcInZhbHVlXCIgd2l0aCB0aGlzIHRlbXBsYXRlIGFuZCB0aGUga2V5IFwia2V5XCIuIElzIHVzZWQgdG8gc3RvcmUgaW5mb3JtYXRpb24gbGlrZSBcImlzUmV3cml0dGVuXCIuXG4gICAgLy9cbiAgICAvLyBPcHRpb25hbGx5LCB0ZW1wbGF0ZSBzb3VyY2VzIGNhbiBhbHNvIGhhdmUgdGhlIGZvbGxvd2luZyBmdW5jdGlvbnM6XG4gICAgLy8gICBub2RlcygpICAgICAgICAgICAgLSByZXR1cm5zIGEgRE9NIGVsZW1lbnQgY29udGFpbmluZyB0aGUgbm9kZXMgb2YgdGhpcyB0ZW1wbGF0ZSwgd2hlcmUgYXZhaWxhYmxlXG4gICAgLy8gICBub2Rlcyh2YWx1ZSkgICAgICAgLSB3cml0ZXMgdGhlIGdpdmVuIERPTSBlbGVtZW50IHRvIHlvdXIgc3RvcmFnZSBsb2NhdGlvblxuICAgIC8vIElmIGEgRE9NIGVsZW1lbnQgaXMgYXZhaWxhYmxlIGZvciBhIGdpdmVuIHRlbXBsYXRlIHNvdXJjZSwgdGVtcGxhdGUgZW5naW5lcyBhcmUgZW5jb3VyYWdlZCB0byB1c2UgaXQgaW4gcHJlZmVyZW5jZSBvdmVyIHRleHQoKVxuICAgIC8vIGZvciBpbXByb3ZlZCBzcGVlZC4gSG93ZXZlciwgYWxsIHRlbXBsYXRlU291cmNlcyBtdXN0IHN1cHBseSB0ZXh0KCkgZXZlbiBpZiB0aGV5IGRvbid0IHN1cHBseSBub2RlcygpLlxuICAgIC8vXG4gICAgLy8gT25jZSB5b3UndmUgaW1wbGVtZW50ZWQgYSB0ZW1wbGF0ZVNvdXJjZSwgbWFrZSB5b3VyIHRlbXBsYXRlIGVuZ2luZSB1c2UgaXQgYnkgc3ViY2xhc3Npbmcgd2hhdGV2ZXIgdGVtcGxhdGUgZW5naW5lIHlvdSB3ZXJlXG4gICAgLy8gdXNpbmcgYW5kIG92ZXJyaWRpbmcgXCJtYWtlVGVtcGxhdGVTb3VyY2VcIiB0byByZXR1cm4gYW4gaW5zdGFuY2Ugb2YgeW91ciBjdXN0b20gdGVtcGxhdGUgc291cmNlLlxuXG4gICAga28udGVtcGxhdGVTb3VyY2VzID0ge307XG5cbiAgICAvLyAtLS0tIGtvLnRlbXBsYXRlU291cmNlcy5kb21FbGVtZW50IC0tLS0tXG5cbiAgICBrby50ZW1wbGF0ZVNvdXJjZXMuZG9tRWxlbWVudCA9IGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgICAgICAgdGhpcy5kb21FbGVtZW50ID0gZWxlbWVudDtcbiAgICB9XG5cbiAgICBrby50ZW1wbGF0ZVNvdXJjZXMuZG9tRWxlbWVudC5wcm90b3R5cGVbJ3RleHQnXSA9IGZ1bmN0aW9uKC8qIHZhbHVlVG9Xcml0ZSAqLykge1xuICAgICAgICB2YXIgdGFnTmFtZUxvd2VyID0ga28udXRpbHMudGFnTmFtZUxvd2VyKHRoaXMuZG9tRWxlbWVudCksXG4gICAgICAgICAgICBlbGVtQ29udGVudHNQcm9wZXJ0eSA9IHRhZ05hbWVMb3dlciA9PT0gXCJzY3JpcHRcIiA/IFwidGV4dFwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IHRhZ05hbWVMb3dlciA9PT0gXCJ0ZXh0YXJlYVwiID8gXCJ2YWx1ZVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IFwiaW5uZXJIVE1MXCI7XG5cbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZG9tRWxlbWVudFtlbGVtQ29udGVudHNQcm9wZXJ0eV07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YXIgdmFsdWVUb1dyaXRlID0gYXJndW1lbnRzWzBdO1xuICAgICAgICAgICAgaWYgKGVsZW1Db250ZW50c1Byb3BlcnR5ID09PSBcImlubmVySFRNTFwiKVxuICAgICAgICAgICAgICAgIGtvLnV0aWxzLnNldEh0bWwodGhpcy5kb21FbGVtZW50LCB2YWx1ZVRvV3JpdGUpO1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHRoaXMuZG9tRWxlbWVudFtlbGVtQ29udGVudHNQcm9wZXJ0eV0gPSB2YWx1ZVRvV3JpdGU7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAga28udGVtcGxhdGVTb3VyY2VzLmRvbUVsZW1lbnQucHJvdG90eXBlWydkYXRhJ10gPSBmdW5jdGlvbihrZXkgLyosIHZhbHVlVG9Xcml0ZSAqLykge1xuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgcmV0dXJuIGtvLnV0aWxzLmRvbURhdGEuZ2V0KHRoaXMuZG9tRWxlbWVudCwgXCJ0ZW1wbGF0ZVNvdXJjZURhdGFfXCIgKyBrZXkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAga28udXRpbHMuZG9tRGF0YS5zZXQodGhpcy5kb21FbGVtZW50LCBcInRlbXBsYXRlU291cmNlRGF0YV9cIiArIGtleSwgYXJndW1lbnRzWzFdKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvLyAtLS0tIGtvLnRlbXBsYXRlU291cmNlcy5hbm9ueW1vdXNUZW1wbGF0ZSAtLS0tLVxuICAgIC8vIEFub255bW91cyB0ZW1wbGF0ZXMgYXJlIG5vcm1hbGx5IHNhdmVkL3JldHJpZXZlZCBhcyBET00gbm9kZXMgdGhyb3VnaCBcIm5vZGVzXCIuXG4gICAgLy8gRm9yIGNvbXBhdGliaWxpdHksIHlvdSBjYW4gYWxzbyByZWFkIFwidGV4dFwiOyBpdCB3aWxsIGJlIHNlcmlhbGl6ZWQgZnJvbSB0aGUgbm9kZXMgb24gZGVtYW5kLlxuICAgIC8vIFdyaXRpbmcgdG8gXCJ0ZXh0XCIgaXMgc3RpbGwgc3VwcG9ydGVkLCBidXQgdGhlbiB0aGUgdGVtcGxhdGUgZGF0YSB3aWxsIG5vdCBiZSBhdmFpbGFibGUgYXMgRE9NIG5vZGVzLlxuXG4gICAgdmFyIGFub255bW91c1RlbXBsYXRlc0RvbURhdGFLZXkgPSBcIl9fa29fYW5vbl90ZW1wbGF0ZV9fXCI7XG4gICAga28udGVtcGxhdGVTb3VyY2VzLmFub255bW91c1RlbXBsYXRlID0gZnVuY3Rpb24oZWxlbWVudCkge1xuICAgICAgICB0aGlzLmRvbUVsZW1lbnQgPSBlbGVtZW50O1xuICAgIH1cbiAgICBrby50ZW1wbGF0ZVNvdXJjZXMuYW5vbnltb3VzVGVtcGxhdGUucHJvdG90eXBlID0gbmV3IGtvLnRlbXBsYXRlU291cmNlcy5kb21FbGVtZW50KCk7XG4gICAga28udGVtcGxhdGVTb3VyY2VzLmFub255bW91c1RlbXBsYXRlLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IGtvLnRlbXBsYXRlU291cmNlcy5hbm9ueW1vdXNUZW1wbGF0ZTtcbiAgICBrby50ZW1wbGF0ZVNvdXJjZXMuYW5vbnltb3VzVGVtcGxhdGUucHJvdG90eXBlWyd0ZXh0J10gPSBmdW5jdGlvbigvKiB2YWx1ZVRvV3JpdGUgKi8pIHtcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT0gMCkge1xuICAgICAgICAgICAgdmFyIHRlbXBsYXRlRGF0YSA9IGtvLnV0aWxzLmRvbURhdGEuZ2V0KHRoaXMuZG9tRWxlbWVudCwgYW5vbnltb3VzVGVtcGxhdGVzRG9tRGF0YUtleSkgfHwge307XG4gICAgICAgICAgICBpZiAodGVtcGxhdGVEYXRhLnRleHREYXRhID09PSB1bmRlZmluZWQgJiYgdGVtcGxhdGVEYXRhLmNvbnRhaW5lckRhdGEpXG4gICAgICAgICAgICAgICAgdGVtcGxhdGVEYXRhLnRleHREYXRhID0gdGVtcGxhdGVEYXRhLmNvbnRhaW5lckRhdGEuaW5uZXJIVE1MO1xuICAgICAgICAgICAgcmV0dXJuIHRlbXBsYXRlRGF0YS50ZXh0RGF0YTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhciB2YWx1ZVRvV3JpdGUgPSBhcmd1bWVudHNbMF07XG4gICAgICAgICAgICBrby51dGlscy5kb21EYXRhLnNldCh0aGlzLmRvbUVsZW1lbnQsIGFub255bW91c1RlbXBsYXRlc0RvbURhdGFLZXksIHt0ZXh0RGF0YTogdmFsdWVUb1dyaXRlfSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIGtvLnRlbXBsYXRlU291cmNlcy5kb21FbGVtZW50LnByb3RvdHlwZVsnbm9kZXMnXSA9IGZ1bmN0aW9uKC8qIHZhbHVlVG9Xcml0ZSAqLykge1xuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PSAwKSB7XG4gICAgICAgICAgICB2YXIgdGVtcGxhdGVEYXRhID0ga28udXRpbHMuZG9tRGF0YS5nZXQodGhpcy5kb21FbGVtZW50LCBhbm9ueW1vdXNUZW1wbGF0ZXNEb21EYXRhS2V5KSB8fCB7fTtcbiAgICAgICAgICAgIHJldHVybiB0ZW1wbGF0ZURhdGEuY29udGFpbmVyRGF0YTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhciB2YWx1ZVRvV3JpdGUgPSBhcmd1bWVudHNbMF07XG4gICAgICAgICAgICBrby51dGlscy5kb21EYXRhLnNldCh0aGlzLmRvbUVsZW1lbnQsIGFub255bW91c1RlbXBsYXRlc0RvbURhdGFLZXksIHtjb250YWluZXJEYXRhOiB2YWx1ZVRvV3JpdGV9KTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBrby5leHBvcnRTeW1ib2woJ3RlbXBsYXRlU291cmNlcycsIGtvLnRlbXBsYXRlU291cmNlcyk7XG4gICAga28uZXhwb3J0U3ltYm9sKCd0ZW1wbGF0ZVNvdXJjZXMuZG9tRWxlbWVudCcsIGtvLnRlbXBsYXRlU291cmNlcy5kb21FbGVtZW50KTtcbiAgICBrby5leHBvcnRTeW1ib2woJ3RlbXBsYXRlU291cmNlcy5hbm9ueW1vdXNUZW1wbGF0ZScsIGtvLnRlbXBsYXRlU291cmNlcy5hbm9ueW1vdXNUZW1wbGF0ZSk7XG59KSgpO1xuKGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgX3RlbXBsYXRlRW5naW5lO1xuICAgIGtvLnNldFRlbXBsYXRlRW5naW5lID0gZnVuY3Rpb24gKHRlbXBsYXRlRW5naW5lKSB7XG4gICAgICAgIGlmICgodGVtcGxhdGVFbmdpbmUgIT0gdW5kZWZpbmVkKSAmJiAhKHRlbXBsYXRlRW5naW5lIGluc3RhbmNlb2Yga28udGVtcGxhdGVFbmdpbmUpKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwidGVtcGxhdGVFbmdpbmUgbXVzdCBpbmhlcml0IGZyb20ga28udGVtcGxhdGVFbmdpbmVcIik7XG4gICAgICAgIF90ZW1wbGF0ZUVuZ2luZSA9IHRlbXBsYXRlRW5naW5lO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGludm9rZUZvckVhY2hOb2RlT3JDb21tZW50SW5Db250aW51b3VzUmFuZ2UoZmlyc3ROb2RlLCBsYXN0Tm9kZSwgYWN0aW9uKSB7XG4gICAgICAgIHZhciBub2RlLCBuZXh0SW5RdWV1ZSA9IGZpcnN0Tm9kZSwgZmlyc3RPdXRPZlJhbmdlTm9kZSA9IGtvLnZpcnR1YWxFbGVtZW50cy5uZXh0U2libGluZyhsYXN0Tm9kZSk7XG4gICAgICAgIHdoaWxlIChuZXh0SW5RdWV1ZSAmJiAoKG5vZGUgPSBuZXh0SW5RdWV1ZSkgIT09IGZpcnN0T3V0T2ZSYW5nZU5vZGUpKSB7XG4gICAgICAgICAgICBuZXh0SW5RdWV1ZSA9IGtvLnZpcnR1YWxFbGVtZW50cy5uZXh0U2libGluZyhub2RlKTtcbiAgICAgICAgICAgIGlmIChub2RlLm5vZGVUeXBlID09PSAxIHx8IG5vZGUubm9kZVR5cGUgPT09IDgpXG4gICAgICAgICAgICAgICAgYWN0aW9uKG5vZGUpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gYWN0aXZhdGVCaW5kaW5nc09uQ29udGludW91c05vZGVBcnJheShjb250aW51b3VzTm9kZUFycmF5LCBiaW5kaW5nQ29udGV4dCkge1xuICAgICAgICAvLyBUbyBiZSB1c2VkIG9uIGFueSBub2RlcyB0aGF0IGhhdmUgYmVlbiByZW5kZXJlZCBieSBhIHRlbXBsYXRlIGFuZCBoYXZlIGJlZW4gaW5zZXJ0ZWQgaW50byBzb21lIHBhcmVudCBlbGVtZW50XG4gICAgICAgIC8vIFdhbGtzIHRocm91Z2ggY29udGludW91c05vZGVBcnJheSAod2hpY2ggKm11c3QqIGJlIGNvbnRpbnVvdXMsIGkuZS4sIGFuIHVuaW50ZXJydXB0ZWQgc2VxdWVuY2Ugb2Ygc2libGluZyBub2RlcywgYmVjYXVzZVxuICAgICAgICAvLyB0aGUgYWxnb3JpdGhtIGZvciB3YWxraW5nIHRoZW0gcmVsaWVzIG9uIHRoaXMpLCBhbmQgZm9yIGVhY2ggdG9wLWxldmVsIGl0ZW0gaW4gdGhlIHZpcnR1YWwtZWxlbWVudCBzZW5zZSxcbiAgICAgICAgLy8gKDEpIERvZXMgYSByZWd1bGFyIFwiYXBwbHlCaW5kaW5nc1wiIHRvIGFzc29jaWF0ZSBiaW5kaW5nQ29udGV4dCB3aXRoIHRoaXMgbm9kZSBhbmQgdG8gYWN0aXZhdGUgYW55IG5vbi1tZW1vaXplZCBiaW5kaW5nc1xuICAgICAgICAvLyAoMikgVW5tZW1vaXplcyBhbnkgbWVtb3MgaW4gdGhlIERPTSBzdWJ0cmVlIChlLmcuLCB0byBhY3RpdmF0ZSBiaW5kaW5ncyB0aGF0IGhhZCBiZWVuIG1lbW9pemVkIGR1cmluZyB0ZW1wbGF0ZSByZXdyaXRpbmcpXG5cbiAgICAgICAgaWYgKGNvbnRpbnVvdXNOb2RlQXJyYXkubGVuZ3RoKSB7XG4gICAgICAgICAgICB2YXIgZmlyc3ROb2RlID0gY29udGludW91c05vZGVBcnJheVswXSwgbGFzdE5vZGUgPSBjb250aW51b3VzTm9kZUFycmF5W2NvbnRpbnVvdXNOb2RlQXJyYXkubGVuZ3RoIC0gMV07XG5cbiAgICAgICAgICAgIC8vIE5lZWQgdG8gYXBwbHlCaW5kaW5ncyAqYmVmb3JlKiB1bm1lbW96aWF0aW9uLCBiZWNhdXNlIHVubWVtb2l6YXRpb24gbWlnaHQgaW50cm9kdWNlIGV4dHJhIG5vZGVzICh0aGF0IHdlIGRvbid0IHdhbnQgdG8gcmUtYmluZClcbiAgICAgICAgICAgIC8vIHdoZXJlYXMgYSByZWd1bGFyIGFwcGx5QmluZGluZ3Mgd29uJ3QgaW50cm9kdWNlIG5ldyBtZW1vaXplZCBub2Rlc1xuICAgICAgICAgICAgaW52b2tlRm9yRWFjaE5vZGVPckNvbW1lbnRJbkNvbnRpbnVvdXNSYW5nZShmaXJzdE5vZGUsIGxhc3ROb2RlLCBmdW5jdGlvbihub2RlKSB7XG4gICAgICAgICAgICAgICAga28uYXBwbHlCaW5kaW5ncyhiaW5kaW5nQ29udGV4dCwgbm9kZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGludm9rZUZvckVhY2hOb2RlT3JDb21tZW50SW5Db250aW51b3VzUmFuZ2UoZmlyc3ROb2RlLCBsYXN0Tm9kZSwgZnVuY3Rpb24obm9kZSkge1xuICAgICAgICAgICAgICAgIGtvLm1lbW9pemF0aW9uLnVubWVtb2l6ZURvbU5vZGVBbmREZXNjZW5kYW50cyhub2RlLCBbYmluZGluZ0NvbnRleHRdKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0Rmlyc3ROb2RlRnJvbVBvc3NpYmxlQXJyYXkobm9kZU9yTm9kZUFycmF5KSB7XG4gICAgICAgIHJldHVybiBub2RlT3JOb2RlQXJyYXkubm9kZVR5cGUgPyBub2RlT3JOb2RlQXJyYXlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IG5vZGVPck5vZGVBcnJheS5sZW5ndGggPiAwID8gbm9kZU9yTm9kZUFycmF5WzBdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBudWxsO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGV4ZWN1dGVUZW1wbGF0ZSh0YXJnZXROb2RlT3JOb2RlQXJyYXksIHJlbmRlck1vZGUsIHRlbXBsYXRlLCBiaW5kaW5nQ29udGV4dCwgb3B0aW9ucykge1xuICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICAgICAgdmFyIGZpcnN0VGFyZ2V0Tm9kZSA9IHRhcmdldE5vZGVPck5vZGVBcnJheSAmJiBnZXRGaXJzdE5vZGVGcm9tUG9zc2libGVBcnJheSh0YXJnZXROb2RlT3JOb2RlQXJyYXkpO1xuICAgICAgICB2YXIgdGVtcGxhdGVEb2N1bWVudCA9IGZpcnN0VGFyZ2V0Tm9kZSAmJiBmaXJzdFRhcmdldE5vZGUub3duZXJEb2N1bWVudDtcbiAgICAgICAgdmFyIHRlbXBsYXRlRW5naW5lVG9Vc2UgPSAob3B0aW9uc1sndGVtcGxhdGVFbmdpbmUnXSB8fCBfdGVtcGxhdGVFbmdpbmUpO1xuICAgICAgICBrby50ZW1wbGF0ZVJld3JpdGluZy5lbnN1cmVUZW1wbGF0ZUlzUmV3cml0dGVuKHRlbXBsYXRlLCB0ZW1wbGF0ZUVuZ2luZVRvVXNlLCB0ZW1wbGF0ZURvY3VtZW50KTtcbiAgICAgICAgdmFyIHJlbmRlcmVkTm9kZXNBcnJheSA9IHRlbXBsYXRlRW5naW5lVG9Vc2VbJ3JlbmRlclRlbXBsYXRlJ10odGVtcGxhdGUsIGJpbmRpbmdDb250ZXh0LCBvcHRpb25zLCB0ZW1wbGF0ZURvY3VtZW50KTtcblxuICAgICAgICAvLyBMb29zZWx5IGNoZWNrIHJlc3VsdCBpcyBhbiBhcnJheSBvZiBET00gbm9kZXNcbiAgICAgICAgaWYgKCh0eXBlb2YgcmVuZGVyZWROb2Rlc0FycmF5Lmxlbmd0aCAhPSBcIm51bWJlclwiKSB8fCAocmVuZGVyZWROb2Rlc0FycmF5Lmxlbmd0aCA+IDAgJiYgdHlwZW9mIHJlbmRlcmVkTm9kZXNBcnJheVswXS5ub2RlVHlwZSAhPSBcIm51bWJlclwiKSlcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlRlbXBsYXRlIGVuZ2luZSBtdXN0IHJldHVybiBhbiBhcnJheSBvZiBET00gbm9kZXNcIik7XG5cbiAgICAgICAgdmFyIGhhdmVBZGRlZE5vZGVzVG9QYXJlbnQgPSBmYWxzZTtcbiAgICAgICAgc3dpdGNoIChyZW5kZXJNb2RlKSB7XG4gICAgICAgICAgICBjYXNlIFwicmVwbGFjZUNoaWxkcmVuXCI6XG4gICAgICAgICAgICAgICAga28udmlydHVhbEVsZW1lbnRzLnNldERvbU5vZGVDaGlsZHJlbih0YXJnZXROb2RlT3JOb2RlQXJyYXksIHJlbmRlcmVkTm9kZXNBcnJheSk7XG4gICAgICAgICAgICAgICAgaGF2ZUFkZGVkTm9kZXNUb1BhcmVudCA9IHRydWU7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwicmVwbGFjZU5vZGVcIjpcbiAgICAgICAgICAgICAgICBrby51dGlscy5yZXBsYWNlRG9tTm9kZXModGFyZ2V0Tm9kZU9yTm9kZUFycmF5LCByZW5kZXJlZE5vZGVzQXJyYXkpO1xuICAgICAgICAgICAgICAgIGhhdmVBZGRlZE5vZGVzVG9QYXJlbnQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcImlnbm9yZVRhcmdldE5vZGVcIjogYnJlYWs7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlVua25vd24gcmVuZGVyTW9kZTogXCIgKyByZW5kZXJNb2RlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChoYXZlQWRkZWROb2Rlc1RvUGFyZW50KSB7XG4gICAgICAgICAgICBhY3RpdmF0ZUJpbmRpbmdzT25Db250aW51b3VzTm9kZUFycmF5KHJlbmRlcmVkTm9kZXNBcnJheSwgYmluZGluZ0NvbnRleHQpO1xuICAgICAgICAgICAgaWYgKG9wdGlvbnNbJ2FmdGVyUmVuZGVyJ10pXG4gICAgICAgICAgICAgICAga28uZGVwZW5kZW5jeURldGVjdGlvbi5pZ25vcmUob3B0aW9uc1snYWZ0ZXJSZW5kZXInXSwgbnVsbCwgW3JlbmRlcmVkTm9kZXNBcnJheSwgYmluZGluZ0NvbnRleHRbJyRkYXRhJ11dKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZW5kZXJlZE5vZGVzQXJyYXk7XG4gICAgfVxuXG4gICAga28ucmVuZGVyVGVtcGxhdGUgPSBmdW5jdGlvbiAodGVtcGxhdGUsIGRhdGFPckJpbmRpbmdDb250ZXh0LCBvcHRpb25zLCB0YXJnZXROb2RlT3JOb2RlQXJyYXksIHJlbmRlck1vZGUpIHtcbiAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgICAgIGlmICgob3B0aW9uc1sndGVtcGxhdGVFbmdpbmUnXSB8fCBfdGVtcGxhdGVFbmdpbmUpID09IHVuZGVmaW5lZClcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlNldCBhIHRlbXBsYXRlIGVuZ2luZSBiZWZvcmUgY2FsbGluZyByZW5kZXJUZW1wbGF0ZVwiKTtcbiAgICAgICAgcmVuZGVyTW9kZSA9IHJlbmRlck1vZGUgfHwgXCJyZXBsYWNlQ2hpbGRyZW5cIjtcblxuICAgICAgICBpZiAodGFyZ2V0Tm9kZU9yTm9kZUFycmF5KSB7XG4gICAgICAgICAgICB2YXIgZmlyc3RUYXJnZXROb2RlID0gZ2V0Rmlyc3ROb2RlRnJvbVBvc3NpYmxlQXJyYXkodGFyZ2V0Tm9kZU9yTm9kZUFycmF5KTtcblxuICAgICAgICAgICAgdmFyIHdoZW5Ub0Rpc3Bvc2UgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAoIWZpcnN0VGFyZ2V0Tm9kZSkgfHwgIWtvLnV0aWxzLmRvbU5vZGVJc0F0dGFjaGVkVG9Eb2N1bWVudChmaXJzdFRhcmdldE5vZGUpOyB9OyAvLyBQYXNzaXZlIGRpc3Bvc2FsIChvbiBuZXh0IGV2YWx1YXRpb24pXG4gICAgICAgICAgICB2YXIgYWN0aXZlbHlEaXNwb3NlV2hlbk5vZGVJc1JlbW92ZWQgPSAoZmlyc3RUYXJnZXROb2RlICYmIHJlbmRlck1vZGUgPT0gXCJyZXBsYWNlTm9kZVwiKSA/IGZpcnN0VGFyZ2V0Tm9kZS5wYXJlbnROb2RlIDogZmlyc3RUYXJnZXROb2RlO1xuXG4gICAgICAgICAgICByZXR1cm4ga28uZGVwZW5kZW50T2JzZXJ2YWJsZSggLy8gU28gdGhlIERPTSBpcyBhdXRvbWF0aWNhbGx5IHVwZGF0ZWQgd2hlbiBhbnkgZGVwZW5kZW5jeSBjaGFuZ2VzXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBFbnN1cmUgd2UndmUgZ290IGEgcHJvcGVyIGJpbmRpbmcgY29udGV4dCB0byB3b3JrIHdpdGhcbiAgICAgICAgICAgICAgICAgICAgdmFyIGJpbmRpbmdDb250ZXh0ID0gKGRhdGFPckJpbmRpbmdDb250ZXh0ICYmIChkYXRhT3JCaW5kaW5nQ29udGV4dCBpbnN0YW5jZW9mIGtvLmJpbmRpbmdDb250ZXh0KSlcbiAgICAgICAgICAgICAgICAgICAgICAgID8gZGF0YU9yQmluZGluZ0NvbnRleHRcbiAgICAgICAgICAgICAgICAgICAgICAgIDogbmV3IGtvLmJpbmRpbmdDb250ZXh0KGtvLnV0aWxzLnVud3JhcE9ic2VydmFibGUoZGF0YU9yQmluZGluZ0NvbnRleHQpKTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBTdXBwb3J0IHNlbGVjdGluZyB0ZW1wbGF0ZSBhcyBhIGZ1bmN0aW9uIG9mIHRoZSBkYXRhIGJlaW5nIHJlbmRlcmVkXG4gICAgICAgICAgICAgICAgICAgIHZhciB0ZW1wbGF0ZU5hbWUgPSB0eXBlb2YodGVtcGxhdGUpID09ICdmdW5jdGlvbicgPyB0ZW1wbGF0ZShiaW5kaW5nQ29udGV4dFsnJGRhdGEnXSwgYmluZGluZ0NvbnRleHQpIDogdGVtcGxhdGU7XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIHJlbmRlcmVkTm9kZXNBcnJheSA9IGV4ZWN1dGVUZW1wbGF0ZSh0YXJnZXROb2RlT3JOb2RlQXJyYXksIHJlbmRlck1vZGUsIHRlbXBsYXRlTmFtZSwgYmluZGluZ0NvbnRleHQsIG9wdGlvbnMpO1xuICAgICAgICAgICAgICAgICAgICBpZiAocmVuZGVyTW9kZSA9PSBcInJlcGxhY2VOb2RlXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldE5vZGVPck5vZGVBcnJheSA9IHJlbmRlcmVkTm9kZXNBcnJheTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpcnN0VGFyZ2V0Tm9kZSA9IGdldEZpcnN0Tm9kZUZyb21Qb3NzaWJsZUFycmF5KHRhcmdldE5vZGVPck5vZGVBcnJheSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIG51bGwsXG4gICAgICAgICAgICAgICAgeyBkaXNwb3NlV2hlbjogd2hlblRvRGlzcG9zZSwgZGlzcG9zZVdoZW5Ob2RlSXNSZW1vdmVkOiBhY3RpdmVseURpc3Bvc2VXaGVuTm9kZUlzUmVtb3ZlZCB9XG4gICAgICAgICAgICApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gV2UgZG9uJ3QgeWV0IGhhdmUgYSBET00gbm9kZSB0byBldmFsdWF0ZSwgc28gdXNlIGEgbWVtbyBhbmQgcmVuZGVyIHRoZSB0ZW1wbGF0ZSBsYXRlciB3aGVuIHRoZXJlIGlzIGEgRE9NIG5vZGVcbiAgICAgICAgICAgIHJldHVybiBrby5tZW1vaXphdGlvbi5tZW1vaXplKGZ1bmN0aW9uIChkb21Ob2RlKSB7XG4gICAgICAgICAgICAgICAga28ucmVuZGVyVGVtcGxhdGUodGVtcGxhdGUsIGRhdGFPckJpbmRpbmdDb250ZXh0LCBvcHRpb25zLCBkb21Ob2RlLCBcInJlcGxhY2VOb2RlXCIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAga28ucmVuZGVyVGVtcGxhdGVGb3JFYWNoID0gZnVuY3Rpb24gKHRlbXBsYXRlLCBhcnJheU9yT2JzZXJ2YWJsZUFycmF5LCBvcHRpb25zLCB0YXJnZXROb2RlLCBwYXJlbnRCaW5kaW5nQ29udGV4dCkge1xuICAgICAgICAvLyBTaW5jZSBzZXREb21Ob2RlQ2hpbGRyZW5Gcm9tQXJyYXlNYXBwaW5nIGFsd2F5cyBjYWxscyBleGVjdXRlVGVtcGxhdGVGb3JBcnJheUl0ZW0gYW5kIHRoZW5cbiAgICAgICAgLy8gYWN0aXZhdGVCaW5kaW5nc0NhbGxiYWNrIGZvciBhZGRlZCBpdGVtcywgd2UgY2FuIHN0b3JlIHRoZSBiaW5kaW5nIGNvbnRleHQgaW4gdGhlIGZvcm1lciB0byB1c2UgaW4gdGhlIGxhdHRlci5cbiAgICAgICAgdmFyIGFycmF5SXRlbUNvbnRleHQ7XG5cbiAgICAgICAgLy8gVGhpcyB3aWxsIGJlIGNhbGxlZCBieSBzZXREb21Ob2RlQ2hpbGRyZW5Gcm9tQXJyYXlNYXBwaW5nIHRvIGdldCB0aGUgbm9kZXMgdG8gYWRkIHRvIHRhcmdldE5vZGVcbiAgICAgICAgdmFyIGV4ZWN1dGVUZW1wbGF0ZUZvckFycmF5SXRlbSA9IGZ1bmN0aW9uIChhcnJheVZhbHVlLCBpbmRleCkge1xuICAgICAgICAgICAgLy8gU3VwcG9ydCBzZWxlY3RpbmcgdGVtcGxhdGUgYXMgYSBmdW5jdGlvbiBvZiB0aGUgZGF0YSBiZWluZyByZW5kZXJlZFxuICAgICAgICAgICAgYXJyYXlJdGVtQ29udGV4dCA9IHBhcmVudEJpbmRpbmdDb250ZXh0WydjcmVhdGVDaGlsZENvbnRleHQnXShrby51dGlscy51bndyYXBPYnNlcnZhYmxlKGFycmF5VmFsdWUpLCBvcHRpb25zWydhcyddKTtcbiAgICAgICAgICAgIGFycmF5SXRlbUNvbnRleHRbJyRpbmRleCddID0gaW5kZXg7XG4gICAgICAgICAgICB2YXIgdGVtcGxhdGVOYW1lID0gdHlwZW9mKHRlbXBsYXRlKSA9PSAnZnVuY3Rpb24nID8gdGVtcGxhdGUoYXJyYXlWYWx1ZSwgYXJyYXlJdGVtQ29udGV4dCkgOiB0ZW1wbGF0ZTtcbiAgICAgICAgICAgIHJldHVybiBleGVjdXRlVGVtcGxhdGUobnVsbCwgXCJpZ25vcmVUYXJnZXROb2RlXCIsIHRlbXBsYXRlTmFtZSwgYXJyYXlJdGVtQ29udGV4dCwgb3B0aW9ucyk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBUaGlzIHdpbGwgYmUgY2FsbGVkIHdoZW5ldmVyIHNldERvbU5vZGVDaGlsZHJlbkZyb21BcnJheU1hcHBpbmcgaGFzIGFkZGVkIG5vZGVzIHRvIHRhcmdldE5vZGVcbiAgICAgICAgdmFyIGFjdGl2YXRlQmluZGluZ3NDYWxsYmFjayA9IGZ1bmN0aW9uKGFycmF5VmFsdWUsIGFkZGVkTm9kZXNBcnJheSwgaW5kZXgpIHtcbiAgICAgICAgICAgIGFjdGl2YXRlQmluZGluZ3NPbkNvbnRpbnVvdXNOb2RlQXJyYXkoYWRkZWROb2Rlc0FycmF5LCBhcnJheUl0ZW1Db250ZXh0KTtcbiAgICAgICAgICAgIGlmIChvcHRpb25zWydhZnRlclJlbmRlciddKVxuICAgICAgICAgICAgICAgIG9wdGlvbnNbJ2FmdGVyUmVuZGVyJ10oYWRkZWROb2Rlc0FycmF5LCBhcnJheVZhbHVlKTtcbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4ga28uZGVwZW5kZW50T2JzZXJ2YWJsZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgdW53cmFwcGVkQXJyYXkgPSBrby51dGlscy51bndyYXBPYnNlcnZhYmxlKGFycmF5T3JPYnNlcnZhYmxlQXJyYXkpIHx8IFtdO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiB1bndyYXBwZWRBcnJheS5sZW5ndGggPT0gXCJ1bmRlZmluZWRcIikgLy8gQ29lcmNlIHNpbmdsZSB2YWx1ZSBpbnRvIGFycmF5XG4gICAgICAgICAgICAgICAgdW53cmFwcGVkQXJyYXkgPSBbdW53cmFwcGVkQXJyYXldO1xuXG4gICAgICAgICAgICAvLyBGaWx0ZXIgb3V0IGFueSBlbnRyaWVzIG1hcmtlZCBhcyBkZXN0cm95ZWRcbiAgICAgICAgICAgIHZhciBmaWx0ZXJlZEFycmF5ID0ga28udXRpbHMuYXJyYXlGaWx0ZXIodW53cmFwcGVkQXJyYXksIGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gb3B0aW9uc1snaW5jbHVkZURlc3Ryb3llZCddIHx8IGl0ZW0gPT09IHVuZGVmaW5lZCB8fCBpdGVtID09PSBudWxsIHx8ICFrby51dGlscy51bndyYXBPYnNlcnZhYmxlKGl0ZW1bJ19kZXN0cm95J10pO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIC8vIENhbGwgc2V0RG9tTm9kZUNoaWxkcmVuRnJvbUFycmF5TWFwcGluZywgaWdub3JpbmcgYW55IG9ic2VydmFibGVzIHVud3JhcHBlZCB3aXRoaW4gKG1vc3QgbGlrZWx5IGZyb20gYSBjYWxsYmFjayBmdW5jdGlvbikuXG4gICAgICAgICAgICAvLyBJZiB0aGUgYXJyYXkgaXRlbXMgYXJlIG9ic2VydmFibGVzLCB0aG91Z2gsIHRoZXkgd2lsbCBiZSB1bndyYXBwZWQgaW4gZXhlY3V0ZVRlbXBsYXRlRm9yQXJyYXlJdGVtIGFuZCBtYW5hZ2VkIHdpdGhpbiBzZXREb21Ob2RlQ2hpbGRyZW5Gcm9tQXJyYXlNYXBwaW5nLlxuICAgICAgICAgICAga28uZGVwZW5kZW5jeURldGVjdGlvbi5pZ25vcmUoa28udXRpbHMuc2V0RG9tTm9kZUNoaWxkcmVuRnJvbUFycmF5TWFwcGluZywgbnVsbCwgW3RhcmdldE5vZGUsIGZpbHRlcmVkQXJyYXksIGV4ZWN1dGVUZW1wbGF0ZUZvckFycmF5SXRlbSwgb3B0aW9ucywgYWN0aXZhdGVCaW5kaW5nc0NhbGxiYWNrXSk7XG5cbiAgICAgICAgfSwgbnVsbCwgeyBkaXNwb3NlV2hlbk5vZGVJc1JlbW92ZWQ6IHRhcmdldE5vZGUgfSk7XG4gICAgfTtcblxuICAgIHZhciB0ZW1wbGF0ZUNvbXB1dGVkRG9tRGF0YUtleSA9ICdfX2tvX190ZW1wbGF0ZUNvbXB1dGVkRG9tRGF0YUtleV9fJztcbiAgICBmdW5jdGlvbiBkaXNwb3NlT2xkQ29tcHV0ZWRBbmRTdG9yZU5ld09uZShlbGVtZW50LCBuZXdDb21wdXRlZCkge1xuICAgICAgICB2YXIgb2xkQ29tcHV0ZWQgPSBrby51dGlscy5kb21EYXRhLmdldChlbGVtZW50LCB0ZW1wbGF0ZUNvbXB1dGVkRG9tRGF0YUtleSk7XG4gICAgICAgIGlmIChvbGRDb21wdXRlZCAmJiAodHlwZW9mKG9sZENvbXB1dGVkLmRpc3Bvc2UpID09ICdmdW5jdGlvbicpKVxuICAgICAgICAgICAgb2xkQ29tcHV0ZWQuZGlzcG9zZSgpO1xuICAgICAgICBrby51dGlscy5kb21EYXRhLnNldChlbGVtZW50LCB0ZW1wbGF0ZUNvbXB1dGVkRG9tRGF0YUtleSwgKG5ld0NvbXB1dGVkICYmIG5ld0NvbXB1dGVkLmlzQWN0aXZlKCkpID8gbmV3Q29tcHV0ZWQgOiB1bmRlZmluZWQpO1xuICAgIH1cblxuICAgIGtvLmJpbmRpbmdIYW5kbGVyc1sndGVtcGxhdGUnXSA9IHtcbiAgICAgICAgJ2luaXQnOiBmdW5jdGlvbihlbGVtZW50LCB2YWx1ZUFjY2Vzc29yKSB7XG4gICAgICAgICAgICAvLyBTdXBwb3J0IGFub255bW91cyB0ZW1wbGF0ZXNcbiAgICAgICAgICAgIHZhciBiaW5kaW5nVmFsdWUgPSBrby51dGlscy51bndyYXBPYnNlcnZhYmxlKHZhbHVlQWNjZXNzb3IoKSk7XG4gICAgICAgICAgICBpZiAoKHR5cGVvZiBiaW5kaW5nVmFsdWUgIT0gXCJzdHJpbmdcIikgJiYgKCFiaW5kaW5nVmFsdWVbJ25hbWUnXSkgJiYgKGVsZW1lbnQubm9kZVR5cGUgPT0gMSB8fCBlbGVtZW50Lm5vZGVUeXBlID09IDgpKSB7XG4gICAgICAgICAgICAgICAgLy8gSXQncyBhbiBhbm9ueW1vdXMgdGVtcGxhdGUgLSBzdG9yZSB0aGUgZWxlbWVudCBjb250ZW50cywgdGhlbiBjbGVhciB0aGUgZWxlbWVudFxuICAgICAgICAgICAgICAgIHZhciB0ZW1wbGF0ZU5vZGVzID0gZWxlbWVudC5ub2RlVHlwZSA9PSAxID8gZWxlbWVudC5jaGlsZE5vZGVzIDoga28udmlydHVhbEVsZW1lbnRzLmNoaWxkTm9kZXMoZWxlbWVudCksXG4gICAgICAgICAgICAgICAgICAgIGNvbnRhaW5lciA9IGtvLnV0aWxzLm1vdmVDbGVhbmVkTm9kZXNUb0NvbnRhaW5lckVsZW1lbnQodGVtcGxhdGVOb2Rlcyk7IC8vIFRoaXMgYWxzbyByZW1vdmVzIHRoZSBub2RlcyBmcm9tIHRoZWlyIGN1cnJlbnQgcGFyZW50XG4gICAgICAgICAgICAgICAgbmV3IGtvLnRlbXBsYXRlU291cmNlcy5hbm9ueW1vdXNUZW1wbGF0ZShlbGVtZW50KVsnbm9kZXMnXShjb250YWluZXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHsgJ2NvbnRyb2xzRGVzY2VuZGFudEJpbmRpbmdzJzogdHJ1ZSB9O1xuICAgICAgICB9LFxuICAgICAgICAndXBkYXRlJzogZnVuY3Rpb24gKGVsZW1lbnQsIHZhbHVlQWNjZXNzb3IsIGFsbEJpbmRpbmdzQWNjZXNzb3IsIHZpZXdNb2RlbCwgYmluZGluZ0NvbnRleHQpIHtcbiAgICAgICAgICAgIHZhciB0ZW1wbGF0ZU5hbWUgPSBrby51dGlscy51bndyYXBPYnNlcnZhYmxlKHZhbHVlQWNjZXNzb3IoKSksXG4gICAgICAgICAgICAgICAgb3B0aW9ucyA9IHt9LFxuICAgICAgICAgICAgICAgIHNob3VsZERpc3BsYXkgPSB0cnVlLFxuICAgICAgICAgICAgICAgIGRhdGFWYWx1ZSxcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZUNvbXB1dGVkID0gbnVsbDtcblxuICAgICAgICAgICAgaWYgKHR5cGVvZiB0ZW1wbGF0ZU5hbWUgIT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgICAgIG9wdGlvbnMgPSB0ZW1wbGF0ZU5hbWU7XG4gICAgICAgICAgICAgICAgdGVtcGxhdGVOYW1lID0ga28udXRpbHMudW53cmFwT2JzZXJ2YWJsZShvcHRpb25zWyduYW1lJ10pO1xuXG4gICAgICAgICAgICAgICAgLy8gU3VwcG9ydCBcImlmXCIvXCJpZm5vdFwiIGNvbmRpdGlvbnNcbiAgICAgICAgICAgICAgICBpZiAoJ2lmJyBpbiBvcHRpb25zKVxuICAgICAgICAgICAgICAgICAgICBzaG91bGREaXNwbGF5ID0ga28udXRpbHMudW53cmFwT2JzZXJ2YWJsZShvcHRpb25zWydpZiddKTtcbiAgICAgICAgICAgICAgICBpZiAoc2hvdWxkRGlzcGxheSAmJiAnaWZub3QnIGluIG9wdGlvbnMpXG4gICAgICAgICAgICAgICAgICAgIHNob3VsZERpc3BsYXkgPSAha28udXRpbHMudW53cmFwT2JzZXJ2YWJsZShvcHRpb25zWydpZm5vdCddKTtcblxuICAgICAgICAgICAgICAgIGRhdGFWYWx1ZSA9IGtvLnV0aWxzLnVud3JhcE9ic2VydmFibGUob3B0aW9uc1snZGF0YSddKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCdmb3JlYWNoJyBpbiBvcHRpb25zKSB7XG4gICAgICAgICAgICAgICAgLy8gUmVuZGVyIG9uY2UgZm9yIGVhY2ggZGF0YSBwb2ludCAodHJlYXRpbmcgZGF0YSBzZXQgYXMgZW1wdHkgaWYgc2hvdWxkRGlzcGxheT09ZmFsc2UpXG4gICAgICAgICAgICAgICAgdmFyIGRhdGFBcnJheSA9IChzaG91bGREaXNwbGF5ICYmIG9wdGlvbnNbJ2ZvcmVhY2gnXSkgfHwgW107XG4gICAgICAgICAgICAgICAgdGVtcGxhdGVDb21wdXRlZCA9IGtvLnJlbmRlclRlbXBsYXRlRm9yRWFjaCh0ZW1wbGF0ZU5hbWUgfHwgZWxlbWVudCwgZGF0YUFycmF5LCBvcHRpb25zLCBlbGVtZW50LCBiaW5kaW5nQ29udGV4dCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKCFzaG91bGREaXNwbGF5KSB7XG4gICAgICAgICAgICAgICAga28udmlydHVhbEVsZW1lbnRzLmVtcHR5Tm9kZShlbGVtZW50KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gUmVuZGVyIG9uY2UgZm9yIHRoaXMgc2luZ2xlIGRhdGEgcG9pbnQgKG9yIHVzZSB0aGUgdmlld01vZGVsIGlmIG5vIGRhdGEgd2FzIHByb3ZpZGVkKVxuICAgICAgICAgICAgICAgIHZhciBpbm5lckJpbmRpbmdDb250ZXh0ID0gKCdkYXRhJyBpbiBvcHRpb25zKSA/XG4gICAgICAgICAgICAgICAgICAgIGJpbmRpbmdDb250ZXh0WydjcmVhdGVDaGlsZENvbnRleHQnXShkYXRhVmFsdWUsIG9wdGlvbnNbJ2FzJ10pIDogIC8vIEdpdmVuIGFuIGV4cGxpdGl0ICdkYXRhJyB2YWx1ZSwgd2UgY3JlYXRlIGEgY2hpbGQgYmluZGluZyBjb250ZXh0IGZvciBpdFxuICAgICAgICAgICAgICAgICAgICBiaW5kaW5nQ29udGV4dDsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEdpdmVuIG5vIGV4cGxpY2l0ICdkYXRhJyB2YWx1ZSwgd2UgcmV0YWluIHRoZSBzYW1lIGJpbmRpbmcgY29udGV4dFxuICAgICAgICAgICAgICAgIHRlbXBsYXRlQ29tcHV0ZWQgPSBrby5yZW5kZXJUZW1wbGF0ZSh0ZW1wbGF0ZU5hbWUgfHwgZWxlbWVudCwgaW5uZXJCaW5kaW5nQ29udGV4dCwgb3B0aW9ucywgZWxlbWVudCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIEl0IG9ubHkgbWFrZXMgc2Vuc2UgdG8gaGF2ZSBhIHNpbmdsZSB0ZW1wbGF0ZSBjb21wdXRlZCBwZXIgZWxlbWVudCAob3RoZXJ3aXNlIHdoaWNoIG9uZSBzaG91bGQgaGF2ZSBpdHMgb3V0cHV0IGRpc3BsYXllZD8pXG4gICAgICAgICAgICBkaXNwb3NlT2xkQ29tcHV0ZWRBbmRTdG9yZU5ld09uZShlbGVtZW50LCB0ZW1wbGF0ZUNvbXB1dGVkKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvLyBBbm9ueW1vdXMgdGVtcGxhdGVzIGNhbid0IGJlIHJld3JpdHRlbi4gR2l2ZSBhIG5pY2UgZXJyb3IgbWVzc2FnZSBpZiB5b3UgdHJ5IHRvIGRvIGl0LlxuICAgIGtvLmV4cHJlc3Npb25SZXdyaXRpbmcuYmluZGluZ1Jld3JpdGVWYWxpZGF0b3JzWyd0ZW1wbGF0ZSddID0gZnVuY3Rpb24oYmluZGluZ1ZhbHVlKSB7XG4gICAgICAgIHZhciBwYXJzZWRCaW5kaW5nVmFsdWUgPSBrby5leHByZXNzaW9uUmV3cml0aW5nLnBhcnNlT2JqZWN0TGl0ZXJhbChiaW5kaW5nVmFsdWUpO1xuXG4gICAgICAgIGlmICgocGFyc2VkQmluZGluZ1ZhbHVlLmxlbmd0aCA9PSAxKSAmJiBwYXJzZWRCaW5kaW5nVmFsdWVbMF1bJ3Vua25vd24nXSlcbiAgICAgICAgICAgIHJldHVybiBudWxsOyAvLyBJdCBsb29rcyBsaWtlIGEgc3RyaW5nIGxpdGVyYWwsIG5vdCBhbiBvYmplY3QgbGl0ZXJhbCwgc28gdHJlYXQgaXQgYXMgYSBuYW1lZCB0ZW1wbGF0ZSAod2hpY2ggaXMgYWxsb3dlZCBmb3IgcmV3cml0aW5nKVxuXG4gICAgICAgIGlmIChrby5leHByZXNzaW9uUmV3cml0aW5nLmtleVZhbHVlQXJyYXlDb250YWluc0tleShwYXJzZWRCaW5kaW5nVmFsdWUsIFwibmFtZVwiKSlcbiAgICAgICAgICAgIHJldHVybiBudWxsOyAvLyBOYW1lZCB0ZW1wbGF0ZXMgY2FuIGJlIHJld3JpdHRlbiwgc28gcmV0dXJuIFwibm8gZXJyb3JcIlxuICAgICAgICByZXR1cm4gXCJUaGlzIHRlbXBsYXRlIGVuZ2luZSBkb2VzIG5vdCBzdXBwb3J0IGFub255bW91cyB0ZW1wbGF0ZXMgbmVzdGVkIHdpdGhpbiBpdHMgdGVtcGxhdGVzXCI7XG4gICAgfTtcblxuICAgIGtvLnZpcnR1YWxFbGVtZW50cy5hbGxvd2VkQmluZGluZ3NbJ3RlbXBsYXRlJ10gPSB0cnVlO1xufSkoKTtcblxua28uZXhwb3J0U3ltYm9sKCdzZXRUZW1wbGF0ZUVuZ2luZScsIGtvLnNldFRlbXBsYXRlRW5naW5lKTtcbmtvLmV4cG9ydFN5bWJvbCgncmVuZGVyVGVtcGxhdGUnLCBrby5yZW5kZXJUZW1wbGF0ZSk7XG5cbmtvLnV0aWxzLmNvbXBhcmVBcnJheXMgPSAoZnVuY3Rpb24gKCkge1xuICAgIHZhciBzdGF0dXNOb3RJbk9sZCA9ICdhZGRlZCcsIHN0YXR1c05vdEluTmV3ID0gJ2RlbGV0ZWQnO1xuXG4gICAgLy8gU2ltcGxlIGNhbGN1bGF0aW9uIGJhc2VkIG9uIExldmVuc2h0ZWluIGRpc3RhbmNlLlxuICAgIGZ1bmN0aW9uIGNvbXBhcmVBcnJheXMob2xkQXJyYXksIG5ld0FycmF5LCBkb250TGltaXRNb3Zlcykge1xuICAgICAgICBvbGRBcnJheSA9IG9sZEFycmF5IHx8IFtdO1xuICAgICAgICBuZXdBcnJheSA9IG5ld0FycmF5IHx8IFtdO1xuXG4gICAgICAgIGlmIChvbGRBcnJheS5sZW5ndGggPD0gbmV3QXJyYXkubGVuZ3RoKVxuICAgICAgICAgICAgcmV0dXJuIGNvbXBhcmVTbWFsbEFycmF5VG9CaWdBcnJheShvbGRBcnJheSwgbmV3QXJyYXksIHN0YXR1c05vdEluT2xkLCBzdGF0dXNOb3RJbk5ldywgZG9udExpbWl0TW92ZXMpO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICByZXR1cm4gY29tcGFyZVNtYWxsQXJyYXlUb0JpZ0FycmF5KG5ld0FycmF5LCBvbGRBcnJheSwgc3RhdHVzTm90SW5OZXcsIHN0YXR1c05vdEluT2xkLCBkb250TGltaXRNb3Zlcyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY29tcGFyZVNtYWxsQXJyYXlUb0JpZ0FycmF5KHNtbEFycmF5LCBiaWdBcnJheSwgc3RhdHVzTm90SW5TbWwsIHN0YXR1c05vdEluQmlnLCBkb250TGltaXRNb3Zlcykge1xuICAgICAgICB2YXIgbXlNaW4gPSBNYXRoLm1pbixcbiAgICAgICAgICAgIG15TWF4ID0gTWF0aC5tYXgsXG4gICAgICAgICAgICBlZGl0RGlzdGFuY2VNYXRyaXggPSBbXSxcbiAgICAgICAgICAgIHNtbEluZGV4LCBzbWxJbmRleE1heCA9IHNtbEFycmF5Lmxlbmd0aCxcbiAgICAgICAgICAgIGJpZ0luZGV4LCBiaWdJbmRleE1heCA9IGJpZ0FycmF5Lmxlbmd0aCxcbiAgICAgICAgICAgIGNvbXBhcmVSYW5nZSA9IChiaWdJbmRleE1heCAtIHNtbEluZGV4TWF4KSB8fCAxLFxuICAgICAgICAgICAgbWF4RGlzdGFuY2UgPSBzbWxJbmRleE1heCArIGJpZ0luZGV4TWF4ICsgMSxcbiAgICAgICAgICAgIHRoaXNSb3csIGxhc3RSb3csXG4gICAgICAgICAgICBiaWdJbmRleE1heEZvclJvdywgYmlnSW5kZXhNaW5Gb3JSb3c7XG5cbiAgICAgICAgZm9yIChzbWxJbmRleCA9IDA7IHNtbEluZGV4IDw9IHNtbEluZGV4TWF4OyBzbWxJbmRleCsrKSB7XG4gICAgICAgICAgICBsYXN0Um93ID0gdGhpc1JvdztcbiAgICAgICAgICAgIGVkaXREaXN0YW5jZU1hdHJpeC5wdXNoKHRoaXNSb3cgPSBbXSk7XG4gICAgICAgICAgICBiaWdJbmRleE1heEZvclJvdyA9IG15TWluKGJpZ0luZGV4TWF4LCBzbWxJbmRleCArIGNvbXBhcmVSYW5nZSk7XG4gICAgICAgICAgICBiaWdJbmRleE1pbkZvclJvdyA9IG15TWF4KDAsIHNtbEluZGV4IC0gMSk7XG4gICAgICAgICAgICBmb3IgKGJpZ0luZGV4ID0gYmlnSW5kZXhNaW5Gb3JSb3c7IGJpZ0luZGV4IDw9IGJpZ0luZGV4TWF4Rm9yUm93OyBiaWdJbmRleCsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFiaWdJbmRleClcbiAgICAgICAgICAgICAgICAgICAgdGhpc1Jvd1tiaWdJbmRleF0gPSBzbWxJbmRleCArIDE7XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoIXNtbEluZGV4KSAgLy8gVG9wIHJvdyAtIHRyYW5zZm9ybSBlbXB0eSBhcnJheSBpbnRvIG5ldyBhcnJheSB2aWEgYWRkaXRpb25zXG4gICAgICAgICAgICAgICAgICAgIHRoaXNSb3dbYmlnSW5kZXhdID0gYmlnSW5kZXggKyAxO1xuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHNtbEFycmF5W3NtbEluZGV4IC0gMV0gPT09IGJpZ0FycmF5W2JpZ0luZGV4IC0gMV0pXG4gICAgICAgICAgICAgICAgICAgIHRoaXNSb3dbYmlnSW5kZXhdID0gbGFzdFJvd1tiaWdJbmRleCAtIDFdOyAgICAgICAgICAgICAgICAgIC8vIGNvcHkgdmFsdWUgKG5vIGVkaXQpXG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBub3J0aERpc3RhbmNlID0gbGFzdFJvd1tiaWdJbmRleF0gfHwgbWF4RGlzdGFuY2U7ICAgICAgIC8vIG5vdCBpbiBiaWcgKGRlbGV0aW9uKVxuICAgICAgICAgICAgICAgICAgICB2YXIgd2VzdERpc3RhbmNlID0gdGhpc1Jvd1tiaWdJbmRleCAtIDFdIHx8IG1heERpc3RhbmNlOyAgICAvLyBub3QgaW4gc21hbGwgKGFkZGl0aW9uKVxuICAgICAgICAgICAgICAgICAgICB0aGlzUm93W2JpZ0luZGV4XSA9IG15TWluKG5vcnRoRGlzdGFuY2UsIHdlc3REaXN0YW5jZSkgKyAxO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBlZGl0U2NyaXB0ID0gW10sIG1lTWludXNPbmUsIG5vdEluU21sID0gW10sIG5vdEluQmlnID0gW107XG4gICAgICAgIGZvciAoc21sSW5kZXggPSBzbWxJbmRleE1heCwgYmlnSW5kZXggPSBiaWdJbmRleE1heDsgc21sSW5kZXggfHwgYmlnSW5kZXg7KSB7XG4gICAgICAgICAgICBtZU1pbnVzT25lID0gZWRpdERpc3RhbmNlTWF0cml4W3NtbEluZGV4XVtiaWdJbmRleF0gLSAxO1xuICAgICAgICAgICAgaWYgKGJpZ0luZGV4ICYmIG1lTWludXNPbmUgPT09IGVkaXREaXN0YW5jZU1hdHJpeFtzbWxJbmRleF1bYmlnSW5kZXgtMV0pIHtcbiAgICAgICAgICAgICAgICBub3RJblNtbC5wdXNoKGVkaXRTY3JpcHRbZWRpdFNjcmlwdC5sZW5ndGhdID0geyAgICAgLy8gYWRkZWRcbiAgICAgICAgICAgICAgICAgICAgJ3N0YXR1cyc6IHN0YXR1c05vdEluU21sLFxuICAgICAgICAgICAgICAgICAgICAndmFsdWUnOiBiaWdBcnJheVstLWJpZ0luZGV4XSxcbiAgICAgICAgICAgICAgICAgICAgJ2luZGV4JzogYmlnSW5kZXggfSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHNtbEluZGV4ICYmIG1lTWludXNPbmUgPT09IGVkaXREaXN0YW5jZU1hdHJpeFtzbWxJbmRleCAtIDFdW2JpZ0luZGV4XSkge1xuICAgICAgICAgICAgICAgIG5vdEluQmlnLnB1c2goZWRpdFNjcmlwdFtlZGl0U2NyaXB0Lmxlbmd0aF0gPSB7ICAgICAvLyBkZWxldGVkXG4gICAgICAgICAgICAgICAgICAgICdzdGF0dXMnOiBzdGF0dXNOb3RJbkJpZyxcbiAgICAgICAgICAgICAgICAgICAgJ3ZhbHVlJzogc21sQXJyYXlbLS1zbWxJbmRleF0sXG4gICAgICAgICAgICAgICAgICAgICdpbmRleCc6IHNtbEluZGV4IH0pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBlZGl0U2NyaXB0LnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAnc3RhdHVzJzogXCJyZXRhaW5lZFwiLFxuICAgICAgICAgICAgICAgICAgICAndmFsdWUnOiBiaWdBcnJheVstLWJpZ0luZGV4XSB9KTtcbiAgICAgICAgICAgICAgICAtLXNtbEluZGV4O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG5vdEluU21sLmxlbmd0aCAmJiBub3RJbkJpZy5sZW5ndGgpIHtcbiAgICAgICAgICAgIC8vIFNldCBhIGxpbWl0IG9uIHRoZSBudW1iZXIgb2YgY29uc2VjdXRpdmUgbm9uLW1hdGNoaW5nIGNvbXBhcmlzb25zOyBoYXZpbmcgaXQgYSBtdWx0aXBsZSBvZlxuICAgICAgICAgICAgLy8gc21sSW5kZXhNYXgga2VlcHMgdGhlIHRpbWUgY29tcGxleGl0eSBvZiB0aGlzIGFsZ29yaXRobSBsaW5lYXIuXG4gICAgICAgICAgICB2YXIgbGltaXRGYWlsZWRDb21wYXJlcyA9IHNtbEluZGV4TWF4ICogMTAsIGZhaWxlZENvbXBhcmVzLFxuICAgICAgICAgICAgICAgIGEsIGQsIG5vdEluU21sSXRlbSwgbm90SW5CaWdJdGVtO1xuICAgICAgICAgICAgLy8gR28gdGhyb3VnaCB0aGUgaXRlbXMgdGhhdCBoYXZlIGJlZW4gYWRkZWQgYW5kIGRlbGV0ZWQgYW5kIHRyeSB0byBmaW5kIG1hdGNoZXMgYmV0d2VlbiB0aGVtLlxuICAgICAgICAgICAgZm9yIChmYWlsZWRDb21wYXJlcyA9IGEgPSAwOyAoZG9udExpbWl0TW92ZXMgfHwgZmFpbGVkQ29tcGFyZXMgPCBsaW1pdEZhaWxlZENvbXBhcmVzKSAmJiAobm90SW5TbWxJdGVtID0gbm90SW5TbWxbYV0pOyBhKyspIHtcbiAgICAgICAgICAgICAgICBmb3IgKGQgPSAwOyBub3RJbkJpZ0l0ZW0gPSBub3RJbkJpZ1tkXTsgZCsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChub3RJblNtbEl0ZW1bJ3ZhbHVlJ10gPT09IG5vdEluQmlnSXRlbVsndmFsdWUnXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbm90SW5TbWxJdGVtWydtb3ZlZCddID0gbm90SW5CaWdJdGVtWydpbmRleCddO1xuICAgICAgICAgICAgICAgICAgICAgICAgbm90SW5CaWdJdGVtWydtb3ZlZCddID0gbm90SW5TbWxJdGVtWydpbmRleCddO1xuICAgICAgICAgICAgICAgICAgICAgICAgbm90SW5CaWcuc3BsaWNlKGQsMSk7ICAgICAgIC8vIFRoaXMgaXRlbSBpcyBtYXJrZWQgYXMgbW92ZWQ7IHNvIHJlbW92ZSBpdCBmcm9tIG5vdEluQmlnIGxpc3RcbiAgICAgICAgICAgICAgICAgICAgICAgIGZhaWxlZENvbXBhcmVzID0gZCA9IDA7ICAgICAvLyBSZXNldCBmYWlsZWQgY29tcGFyZXMgY291bnQgYmVjYXVzZSB3ZSdyZSBjaGVja2luZyBmb3IgY29uc2VjdXRpdmUgZmFpbHVyZXNcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGZhaWxlZENvbXBhcmVzICs9IGQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGVkaXRTY3JpcHQucmV2ZXJzZSgpO1xuICAgIH1cblxuICAgIHJldHVybiBjb21wYXJlQXJyYXlzO1xufSkoKTtcblxua28uZXhwb3J0U3ltYm9sKCd1dGlscy5jb21wYXJlQXJyYXlzJywga28udXRpbHMuY29tcGFyZUFycmF5cyk7XG5cbihmdW5jdGlvbiAoKSB7XG4gICAgLy8gT2JqZWN0aXZlOlxuICAgIC8vICogR2l2ZW4gYW4gaW5wdXQgYXJyYXksIGEgY29udGFpbmVyIERPTSBub2RlLCBhbmQgYSBmdW5jdGlvbiBmcm9tIGFycmF5IGVsZW1lbnRzIHRvIGFycmF5cyBvZiBET00gbm9kZXMsXG4gICAgLy8gICBtYXAgdGhlIGFycmF5IGVsZW1lbnRzIHRvIGFycmF5cyBvZiBET00gbm9kZXMsIGNvbmNhdGVuYXRlIHRvZ2V0aGVyIGFsbCB0aGVzZSBhcnJheXMsIGFuZCB1c2UgdGhlbSB0byBwb3B1bGF0ZSB0aGUgY29udGFpbmVyIERPTSBub2RlXG4gICAgLy8gKiBOZXh0IHRpbWUgd2UncmUgZ2l2ZW4gdGhlIHNhbWUgY29tYmluYXRpb24gb2YgdGhpbmdzICh3aXRoIHRoZSBhcnJheSBwb3NzaWJseSBoYXZpbmcgbXV0YXRlZCksIHVwZGF0ZSB0aGUgY29udGFpbmVyIERPTSBub2RlXG4gICAgLy8gICBzbyB0aGF0IGl0cyBjaGlsZHJlbiBpcyBhZ2FpbiB0aGUgY29uY2F0ZW5hdGlvbiBvZiB0aGUgbWFwcGluZ3Mgb2YgdGhlIGFycmF5IGVsZW1lbnRzLCBidXQgZG9uJ3QgcmUtbWFwIGFueSBhcnJheSBlbGVtZW50cyB0aGF0IHdlXG4gICAgLy8gICBwcmV2aW91c2x5IG1hcHBlZCAtIHJldGFpbiB0aG9zZSBub2RlcywgYW5kIGp1c3QgaW5zZXJ0L2RlbGV0ZSBvdGhlciBvbmVzXG5cbiAgICAvLyBcImNhbGxiYWNrQWZ0ZXJBZGRpbmdOb2Rlc1wiIHdpbGwgYmUgaW52b2tlZCBhZnRlciBhbnkgXCJtYXBwaW5nXCItZ2VuZXJhdGVkIG5vZGVzIGFyZSBpbnNlcnRlZCBpbnRvIHRoZSBjb250YWluZXIgbm9kZVxuICAgIC8vIFlvdSBjYW4gdXNlIHRoaXMsIGZvciBleGFtcGxlLCB0byBhY3RpdmF0ZSBiaW5kaW5ncyBvbiB0aG9zZSBub2Rlcy5cblxuICAgIGZ1bmN0aW9uIGZpeFVwTm9kZXNUb0JlTW92ZWRPclJlbW92ZWQoY29udGlndW91c05vZGVBcnJheSkge1xuICAgICAgICAvLyBCZWZvcmUgbW92aW5nLCBkZWxldGluZywgb3IgcmVwbGFjaW5nIGEgc2V0IG9mIG5vZGVzIHRoYXQgd2VyZSBwcmV2aW91c2x5IG91dHB1dHRlZCBieSB0aGUgXCJtYXBcIiBmdW5jdGlvbiwgd2UgaGF2ZSB0byByZWNvbmNpbGVcbiAgICAgICAgLy8gdGhlbSBhZ2FpbnN0IHdoYXQgaXMgaW4gdGhlIERPTSByaWdodCBub3cuIEl0IG1heSBiZSB0aGF0IHNvbWUgb2YgdGhlIG5vZGVzIGhhdmUgYWxyZWFkeSBiZWVuIHJlbW92ZWQgZnJvbSB0aGUgZG9jdW1lbnQsXG4gICAgICAgIC8vIG9yIHRoYXQgbmV3IG5vZGVzIG1pZ2h0IGhhdmUgYmVlbiBpbnNlcnRlZCBpbiB0aGUgbWlkZGxlLCBmb3IgZXhhbXBsZSBieSBhIGJpbmRpbmcuIEFsc28sIHRoZXJlIG1heSBwcmV2aW91c2x5IGhhdmUgYmVlblxuICAgICAgICAvLyBsZWFkaW5nIGNvbW1lbnQgbm9kZXMgKGNyZWF0ZWQgYnkgcmV3cml0dGVuIHN0cmluZy1iYXNlZCB0ZW1wbGF0ZXMpIHRoYXQgaGF2ZSBzaW5jZSBiZWVuIHJlbW92ZWQgZHVyaW5nIGJpbmRpbmcuXG4gICAgICAgIC8vIFNvLCB0aGlzIGZ1bmN0aW9uIHRyYW5zbGF0ZXMgdGhlIG9sZCBcIm1hcFwiIG91dHB1dCBhcnJheSBpbnRvIGl0cyBiZXN0IGd1ZXNzIG9mIHdoYXQgc2V0IG9mIGN1cnJlbnQgRE9NIG5vZGVzIHNob3VsZCBiZSByZW1vdmVkLlxuICAgICAgICAvL1xuICAgICAgICAvLyBSdWxlczpcbiAgICAgICAgLy8gICBbQV0gQW55IGxlYWRpbmcgbm9kZXMgdGhhdCBhcmVuJ3QgaW4gdGhlIGRvY3VtZW50IGFueSBtb3JlIHNob3VsZCBiZSBpZ25vcmVkXG4gICAgICAgIC8vICAgICAgIFRoZXNlIG1vc3QgbGlrZWx5IGNvcnJlc3BvbmQgdG8gbWVtb2l6YXRpb24gbm9kZXMgdGhhdCB3ZXJlIGFscmVhZHkgcmVtb3ZlZCBkdXJpbmcgYmluZGluZ1xuICAgICAgICAvLyAgICAgICBTZWUgaHR0cHM6Ly9naXRodWIuY29tL1N0ZXZlU2FuZGVyc29uL2tub2Nrb3V0L3B1bGwvNDQwXG4gICAgICAgIC8vICAgW0JdIFdlIHdhbnQgdG8gb3V0cHV0IGEgY29udGlndW91cyBzZXJpZXMgb2Ygbm9kZXMgdGhhdCBhcmUgc3RpbGwgaW4gdGhlIGRvY3VtZW50LiBTbywgaWdub3JlIGFueSBub2RlcyB0aGF0XG4gICAgICAgIC8vICAgICAgIGhhdmUgYWxyZWFkeSBiZWVuIHJlbW92ZWQsIGFuZCBpbmNsdWRlIGFueSBub2RlcyB0aGF0IGhhdmUgYmVlbiBpbnNlcnRlZCBhbW9uZyB0aGUgcHJldmlvdXMgY29sbGVjdGlvblxuXG4gICAgICAgIC8vIFJ1bGUgW0FdXG4gICAgICAgIHdoaWxlIChjb250aWd1b3VzTm9kZUFycmF5Lmxlbmd0aCAmJiAha28udXRpbHMuZG9tTm9kZUlzQXR0YWNoZWRUb0RvY3VtZW50KGNvbnRpZ3VvdXNOb2RlQXJyYXlbMF0pKVxuICAgICAgICAgICAgY29udGlndW91c05vZGVBcnJheS5zcGxpY2UoMCwgMSk7XG5cbiAgICAgICAgLy8gUnVsZSBbQl1cbiAgICAgICAgaWYgKGNvbnRpZ3VvdXNOb2RlQXJyYXkubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgLy8gQnVpbGQgdXAgdGhlIGFjdHVhbCBuZXcgY29udGlndW91cyBub2RlIHNldFxuICAgICAgICAgICAgdmFyIGN1cnJlbnQgPSBjb250aWd1b3VzTm9kZUFycmF5WzBdLCBsYXN0ID0gY29udGlndW91c05vZGVBcnJheVtjb250aWd1b3VzTm9kZUFycmF5Lmxlbmd0aCAtIDFdLCBuZXdDb250aWd1b3VzU2V0ID0gW2N1cnJlbnRdO1xuICAgICAgICAgICAgd2hpbGUgKGN1cnJlbnQgIT09IGxhc3QpIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50ID0gY3VycmVudC5uZXh0U2libGluZztcbiAgICAgICAgICAgICAgICBpZiAoIWN1cnJlbnQpIC8vIFdvbid0IGhhcHBlbiwgZXhjZXB0IGlmIHRoZSBkZXZlbG9wZXIgaGFzIG1hbnVhbGx5IHJlbW92ZWQgc29tZSBET00gZWxlbWVudHMgKHRoZW4gd2UncmUgaW4gYW4gdW5kZWZpbmVkIHNjZW5hcmlvKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgbmV3Q29udGlndW91c1NldC5wdXNoKGN1cnJlbnQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyAuLi4gdGhlbiBtdXRhdGUgdGhlIGlucHV0IGFycmF5IHRvIG1hdGNoIHRoaXMuXG4gICAgICAgICAgICAvLyAoVGhlIGZvbGxvd2luZyBsaW5lIHJlcGxhY2VzIHRoZSBjb250ZW50cyBvZiBjb250aWd1b3VzTm9kZUFycmF5IHdpdGggbmV3Q29udGlndW91c1NldClcbiAgICAgICAgICAgIEFycmF5LnByb3RvdHlwZS5zcGxpY2UuYXBwbHkoY29udGlndW91c05vZGVBcnJheSwgWzAsIGNvbnRpZ3VvdXNOb2RlQXJyYXkubGVuZ3RoXS5jb25jYXQobmV3Q29udGlndW91c1NldCkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjb250aWd1b3VzTm9kZUFycmF5O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1hcE5vZGVBbmRSZWZyZXNoV2hlbkNoYW5nZWQoY29udGFpbmVyTm9kZSwgbWFwcGluZywgdmFsdWVUb01hcCwgY2FsbGJhY2tBZnRlckFkZGluZ05vZGVzLCBpbmRleCkge1xuICAgICAgICAvLyBNYXAgdGhpcyBhcnJheSB2YWx1ZSBpbnNpZGUgYSBkZXBlbmRlbnRPYnNlcnZhYmxlIHNvIHdlIHJlLW1hcCB3aGVuIGFueSBkZXBlbmRlbmN5IGNoYW5nZXNcbiAgICAgICAgdmFyIG1hcHBlZE5vZGVzID0gW107XG4gICAgICAgIHZhciBkZXBlbmRlbnRPYnNlcnZhYmxlID0ga28uZGVwZW5kZW50T2JzZXJ2YWJsZShmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBuZXdNYXBwZWROb2RlcyA9IG1hcHBpbmcodmFsdWVUb01hcCwgaW5kZXgsIGZpeFVwTm9kZXNUb0JlTW92ZWRPclJlbW92ZWQobWFwcGVkTm9kZXMpKSB8fCBbXTtcblxuICAgICAgICAgICAgLy8gT24gc3Vic2VxdWVudCBldmFsdWF0aW9ucywganVzdCByZXBsYWNlIHRoZSBwcmV2aW91c2x5LWluc2VydGVkIERPTSBub2Rlc1xuICAgICAgICAgICAgaWYgKG1hcHBlZE5vZGVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICBrby51dGlscy5yZXBsYWNlRG9tTm9kZXMobWFwcGVkTm9kZXMsIG5ld01hcHBlZE5vZGVzKTtcbiAgICAgICAgICAgICAgICBpZiAoY2FsbGJhY2tBZnRlckFkZGluZ05vZGVzKVxuICAgICAgICAgICAgICAgICAgICBrby5kZXBlbmRlbmN5RGV0ZWN0aW9uLmlnbm9yZShjYWxsYmFja0FmdGVyQWRkaW5nTm9kZXMsIG51bGwsIFt2YWx1ZVRvTWFwLCBuZXdNYXBwZWROb2RlcywgaW5kZXhdKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gUmVwbGFjZSB0aGUgY29udGVudHMgb2YgdGhlIG1hcHBlZE5vZGVzIGFycmF5LCB0aGVyZWJ5IHVwZGF0aW5nIHRoZSByZWNvcmRcbiAgICAgICAgICAgIC8vIG9mIHdoaWNoIG5vZGVzIHdvdWxkIGJlIGRlbGV0ZWQgaWYgdmFsdWVUb01hcCB3YXMgaXRzZWxmIGxhdGVyIHJlbW92ZWRcbiAgICAgICAgICAgIG1hcHBlZE5vZGVzLnNwbGljZSgwLCBtYXBwZWROb2Rlcy5sZW5ndGgpO1xuICAgICAgICAgICAga28udXRpbHMuYXJyYXlQdXNoQWxsKG1hcHBlZE5vZGVzLCBuZXdNYXBwZWROb2Rlcyk7XG4gICAgICAgIH0sIG51bGwsIHsgZGlzcG9zZVdoZW5Ob2RlSXNSZW1vdmVkOiBjb250YWluZXJOb2RlLCBkaXNwb3NlV2hlbjogZnVuY3Rpb24oKSB7IHJldHVybiAha28udXRpbHMuYW55RG9tTm9kZUlzQXR0YWNoZWRUb0RvY3VtZW50KG1hcHBlZE5vZGVzKTsgfSB9KTtcbiAgICAgICAgcmV0dXJuIHsgbWFwcGVkTm9kZXMgOiBtYXBwZWROb2RlcywgZGVwZW5kZW50T2JzZXJ2YWJsZSA6IChkZXBlbmRlbnRPYnNlcnZhYmxlLmlzQWN0aXZlKCkgPyBkZXBlbmRlbnRPYnNlcnZhYmxlIDogdW5kZWZpbmVkKSB9O1xuICAgIH1cblxuICAgIHZhciBsYXN0TWFwcGluZ1Jlc3VsdERvbURhdGFLZXkgPSBcInNldERvbU5vZGVDaGlsZHJlbkZyb21BcnJheU1hcHBpbmdfbGFzdE1hcHBpbmdSZXN1bHRcIjtcblxuICAgIGtvLnV0aWxzLnNldERvbU5vZGVDaGlsZHJlbkZyb21BcnJheU1hcHBpbmcgPSBmdW5jdGlvbiAoZG9tTm9kZSwgYXJyYXksIG1hcHBpbmcsIG9wdGlvbnMsIGNhbGxiYWNrQWZ0ZXJBZGRpbmdOb2Rlcykge1xuICAgICAgICAvLyBDb21wYXJlIHRoZSBwcm92aWRlZCBhcnJheSBhZ2FpbnN0IHRoZSBwcmV2aW91cyBvbmVcbiAgICAgICAgYXJyYXkgPSBhcnJheSB8fCBbXTtcbiAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgICAgIHZhciBpc0ZpcnN0RXhlY3V0aW9uID0ga28udXRpbHMuZG9tRGF0YS5nZXQoZG9tTm9kZSwgbGFzdE1hcHBpbmdSZXN1bHREb21EYXRhS2V5KSA9PT0gdW5kZWZpbmVkO1xuICAgICAgICB2YXIgbGFzdE1hcHBpbmdSZXN1bHQgPSBrby51dGlscy5kb21EYXRhLmdldChkb21Ob2RlLCBsYXN0TWFwcGluZ1Jlc3VsdERvbURhdGFLZXkpIHx8IFtdO1xuICAgICAgICB2YXIgbGFzdEFycmF5ID0ga28udXRpbHMuYXJyYXlNYXAobGFzdE1hcHBpbmdSZXN1bHQsIGZ1bmN0aW9uICh4KSB7IHJldHVybiB4LmFycmF5RW50cnk7IH0pO1xuICAgICAgICB2YXIgZWRpdFNjcmlwdCA9IGtvLnV0aWxzLmNvbXBhcmVBcnJheXMobGFzdEFycmF5LCBhcnJheSwgb3B0aW9uc1snZG9udExpbWl0TW92ZXMnXSk7XG5cbiAgICAgICAgLy8gQnVpbGQgdGhlIG5ldyBtYXBwaW5nIHJlc3VsdFxuICAgICAgICB2YXIgbmV3TWFwcGluZ1Jlc3VsdCA9IFtdO1xuICAgICAgICB2YXIgbGFzdE1hcHBpbmdSZXN1bHRJbmRleCA9IDA7XG4gICAgICAgIHZhciBuZXdNYXBwaW5nUmVzdWx0SW5kZXggPSAwO1xuXG4gICAgICAgIHZhciBub2Rlc1RvRGVsZXRlID0gW107XG4gICAgICAgIHZhciBpdGVtc1RvUHJvY2VzcyA9IFtdO1xuICAgICAgICB2YXIgaXRlbXNGb3JCZWZvcmVSZW1vdmVDYWxsYmFja3MgPSBbXTtcbiAgICAgICAgdmFyIGl0ZW1zRm9yTW92ZUNhbGxiYWNrcyA9IFtdO1xuICAgICAgICB2YXIgaXRlbXNGb3JBZnRlckFkZENhbGxiYWNrcyA9IFtdO1xuICAgICAgICB2YXIgbWFwRGF0YTtcblxuICAgICAgICBmdW5jdGlvbiBpdGVtTW92ZWRPclJldGFpbmVkKGVkaXRTY3JpcHRJbmRleCwgb2xkUG9zaXRpb24pIHtcbiAgICAgICAgICAgIG1hcERhdGEgPSBsYXN0TWFwcGluZ1Jlc3VsdFtvbGRQb3NpdGlvbl07XG4gICAgICAgICAgICBpZiAobmV3TWFwcGluZ1Jlc3VsdEluZGV4ICE9PSBvbGRQb3NpdGlvbilcbiAgICAgICAgICAgICAgICBpdGVtc0Zvck1vdmVDYWxsYmFja3NbZWRpdFNjcmlwdEluZGV4XSA9IG1hcERhdGE7XG4gICAgICAgICAgICAvLyBTaW5jZSB1cGRhdGluZyB0aGUgaW5kZXggbWlnaHQgY2hhbmdlIHRoZSBub2RlcywgZG8gc28gYmVmb3JlIGNhbGxpbmcgZml4VXBOb2Rlc1RvQmVNb3ZlZE9yUmVtb3ZlZFxuICAgICAgICAgICAgbWFwRGF0YS5pbmRleE9ic2VydmFibGUobmV3TWFwcGluZ1Jlc3VsdEluZGV4KyspO1xuICAgICAgICAgICAgZml4VXBOb2Rlc1RvQmVNb3ZlZE9yUmVtb3ZlZChtYXBEYXRhLm1hcHBlZE5vZGVzKTtcbiAgICAgICAgICAgIG5ld01hcHBpbmdSZXN1bHQucHVzaChtYXBEYXRhKTtcbiAgICAgICAgICAgIGl0ZW1zVG9Qcm9jZXNzLnB1c2gobWFwRGF0YSk7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBjYWxsQ2FsbGJhY2soY2FsbGJhY2ssIGl0ZW1zKSB7XG4gICAgICAgICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgbiA9IGl0ZW1zLmxlbmd0aDsgaSA8IG47IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBpZiAoaXRlbXNbaV0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGtvLnV0aWxzLmFycmF5Rm9yRWFjaChpdGVtc1tpXS5tYXBwZWROb2RlcywgZnVuY3Rpb24obm9kZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKG5vZGUsIGksIGl0ZW1zW2ldLmFycmF5RW50cnkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKHZhciBpID0gMCwgZWRpdFNjcmlwdEl0ZW0sIG1vdmVkSW5kZXg7IGVkaXRTY3JpcHRJdGVtID0gZWRpdFNjcmlwdFtpXTsgaSsrKSB7XG4gICAgICAgICAgICBtb3ZlZEluZGV4ID0gZWRpdFNjcmlwdEl0ZW1bJ21vdmVkJ107XG4gICAgICAgICAgICBzd2l0Y2ggKGVkaXRTY3JpcHRJdGVtWydzdGF0dXMnXSkge1xuICAgICAgICAgICAgICAgIGNhc2UgXCJkZWxldGVkXCI6XG4gICAgICAgICAgICAgICAgICAgIGlmIChtb3ZlZEluZGV4ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hcERhdGEgPSBsYXN0TWFwcGluZ1Jlc3VsdFtsYXN0TWFwcGluZ1Jlc3VsdEluZGV4XTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gU3RvcCB0cmFja2luZyBjaGFuZ2VzIHRvIHRoZSBtYXBwaW5nIGZvciB0aGVzZSBub2Rlc1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG1hcERhdGEuZGVwZW5kZW50T2JzZXJ2YWJsZSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXBEYXRhLmRlcGVuZGVudE9ic2VydmFibGUuZGlzcG9zZSgpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBRdWV1ZSB0aGVzZSBub2RlcyBmb3IgbGF0ZXIgcmVtb3ZhbFxuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZXNUb0RlbGV0ZS5wdXNoLmFwcGx5KG5vZGVzVG9EZWxldGUsIGZpeFVwTm9kZXNUb0JlTW92ZWRPclJlbW92ZWQobWFwRGF0YS5tYXBwZWROb2RlcykpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG9wdGlvbnNbJ2JlZm9yZVJlbW92ZSddKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbXNGb3JCZWZvcmVSZW1vdmVDYWxsYmFja3NbaV0gPSBtYXBEYXRhO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW1zVG9Qcm9jZXNzLnB1c2gobWFwRGF0YSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgbGFzdE1hcHBpbmdSZXN1bHRJbmRleCsrO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgIGNhc2UgXCJyZXRhaW5lZFwiOlxuICAgICAgICAgICAgICAgICAgICBpdGVtTW92ZWRPclJldGFpbmVkKGksIGxhc3RNYXBwaW5nUmVzdWx0SW5kZXgrKyk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgY2FzZSBcImFkZGVkXCI6XG4gICAgICAgICAgICAgICAgICAgIGlmIChtb3ZlZEluZGV4ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW1Nb3ZlZE9yUmV0YWluZWQoaSwgbW92ZWRJbmRleCk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtYXBEYXRhID0geyBhcnJheUVudHJ5OiBlZGl0U2NyaXB0SXRlbVsndmFsdWUnXSwgaW5kZXhPYnNlcnZhYmxlOiBrby5vYnNlcnZhYmxlKG5ld01hcHBpbmdSZXN1bHRJbmRleCsrKSB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgbmV3TWFwcGluZ1Jlc3VsdC5wdXNoKG1hcERhdGEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaXRlbXNUb1Byb2Nlc3MucHVzaChtYXBEYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghaXNGaXJzdEV4ZWN1dGlvbilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtc0ZvckFmdGVyQWRkQ2FsbGJhY2tzW2ldID0gbWFwRGF0YTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENhbGwgYmVmb3JlTW92ZSBmaXJzdCBiZWZvcmUgYW55IGNoYW5nZXMgaGF2ZSBiZWVuIG1hZGUgdG8gdGhlIERPTVxuICAgICAgICBjYWxsQ2FsbGJhY2sob3B0aW9uc1snYmVmb3JlTW92ZSddLCBpdGVtc0Zvck1vdmVDYWxsYmFja3MpO1xuXG4gICAgICAgIC8vIE5leHQgcmVtb3ZlIG5vZGVzIGZvciBkZWxldGVkIGl0ZW1zIChvciBqdXN0IGNsZWFuIGlmIHRoZXJlJ3MgYSBiZWZvcmVSZW1vdmUgY2FsbGJhY2spXG4gICAgICAgIGtvLnV0aWxzLmFycmF5Rm9yRWFjaChub2Rlc1RvRGVsZXRlLCBvcHRpb25zWydiZWZvcmVSZW1vdmUnXSA/IGtvLmNsZWFuTm9kZSA6IGtvLnJlbW92ZU5vZGUpO1xuXG4gICAgICAgIC8vIE5leHQgYWRkL3Jlb3JkZXIgdGhlIHJlbWFpbmluZyBpdGVtcyAod2lsbCBpbmNsdWRlIGRlbGV0ZWQgaXRlbXMgaWYgdGhlcmUncyBhIGJlZm9yZVJlbW92ZSBjYWxsYmFjaylcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIG5leHROb2RlID0ga28udmlydHVhbEVsZW1lbnRzLmZpcnN0Q2hpbGQoZG9tTm9kZSksIGxhc3ROb2RlLCBub2RlOyBtYXBEYXRhID0gaXRlbXNUb1Byb2Nlc3NbaV07IGkrKykge1xuICAgICAgICAgICAgLy8gR2V0IG5vZGVzIGZvciBuZXdseSBhZGRlZCBpdGVtc1xuICAgICAgICAgICAgaWYgKCFtYXBEYXRhLm1hcHBlZE5vZGVzKVxuICAgICAgICAgICAgICAgIGtvLnV0aWxzLmV4dGVuZChtYXBEYXRhLCBtYXBOb2RlQW5kUmVmcmVzaFdoZW5DaGFuZ2VkKGRvbU5vZGUsIG1hcHBpbmcsIG1hcERhdGEuYXJyYXlFbnRyeSwgY2FsbGJhY2tBZnRlckFkZGluZ05vZGVzLCBtYXBEYXRhLmluZGV4T2JzZXJ2YWJsZSkpO1xuXG4gICAgICAgICAgICAvLyBQdXQgbm9kZXMgaW4gdGhlIHJpZ2h0IHBsYWNlIGlmIHRoZXkgYXJlbid0IHRoZXJlIGFscmVhZHlcbiAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBub2RlID0gbWFwRGF0YS5tYXBwZWROb2Rlc1tqXTsgbmV4dE5vZGUgPSBub2RlLm5leHRTaWJsaW5nLCBsYXN0Tm9kZSA9IG5vZGUsIGorKykge1xuICAgICAgICAgICAgICAgIGlmIChub2RlICE9PSBuZXh0Tm9kZSlcbiAgICAgICAgICAgICAgICAgICAga28udmlydHVhbEVsZW1lbnRzLmluc2VydEFmdGVyKGRvbU5vZGUsIG5vZGUsIGxhc3ROb2RlKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gUnVuIHRoZSBjYWxsYmFja3MgZm9yIG5ld2x5IGFkZGVkIG5vZGVzIChmb3IgZXhhbXBsZSwgdG8gYXBwbHkgYmluZGluZ3MsIGV0Yy4pXG4gICAgICAgICAgICBpZiAoIW1hcERhdGEuaW5pdGlhbGl6ZWQgJiYgY2FsbGJhY2tBZnRlckFkZGluZ05vZGVzKSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2tBZnRlckFkZGluZ05vZGVzKG1hcERhdGEuYXJyYXlFbnRyeSwgbWFwRGF0YS5tYXBwZWROb2RlcywgbWFwRGF0YS5pbmRleE9ic2VydmFibGUpO1xuICAgICAgICAgICAgICAgIG1hcERhdGEuaW5pdGlhbGl6ZWQgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gSWYgdGhlcmUncyBhIGJlZm9yZVJlbW92ZSBjYWxsYmFjaywgY2FsbCBpdCBhZnRlciByZW9yZGVyaW5nLlxuICAgICAgICAvLyBOb3RlIHRoYXQgd2UgYXNzdW1lIHRoYXQgdGhlIGJlZm9yZVJlbW92ZSBjYWxsYmFjayB3aWxsIHVzdWFsbHkgYmUgdXNlZCB0byByZW1vdmUgdGhlIG5vZGVzIHVzaW5nXG4gICAgICAgIC8vIHNvbWUgc29ydCBvZiBhbmltYXRpb24sIHdoaWNoIGlzIHdoeSB3ZSBmaXJzdCByZW9yZGVyIHRoZSBub2RlcyB0aGF0IHdpbGwgYmUgcmVtb3ZlZC4gSWYgdGhlXG4gICAgICAgIC8vIGNhbGxiYWNrIGluc3RlYWQgcmVtb3ZlcyB0aGUgbm9kZXMgcmlnaHQgYXdheSwgaXQgd291bGQgYmUgbW9yZSBlZmZpY2llbnQgdG8gc2tpcCByZW9yZGVyaW5nIHRoZW0uXG4gICAgICAgIC8vIFBlcmhhcHMgd2UnbGwgbWFrZSB0aGF0IGNoYW5nZSBpbiB0aGUgZnV0dXJlIGlmIHRoaXMgc2NlbmFyaW8gYmVjb21lcyBtb3JlIGNvbW1vbi5cbiAgICAgICAgY2FsbENhbGxiYWNrKG9wdGlvbnNbJ2JlZm9yZVJlbW92ZSddLCBpdGVtc0ZvckJlZm9yZVJlbW92ZUNhbGxiYWNrcyk7XG5cbiAgICAgICAgLy8gRmluYWxseSBjYWxsIGFmdGVyTW92ZSBhbmQgYWZ0ZXJBZGQgY2FsbGJhY2tzXG4gICAgICAgIGNhbGxDYWxsYmFjayhvcHRpb25zWydhZnRlck1vdmUnXSwgaXRlbXNGb3JNb3ZlQ2FsbGJhY2tzKTtcbiAgICAgICAgY2FsbENhbGxiYWNrKG9wdGlvbnNbJ2FmdGVyQWRkJ10sIGl0ZW1zRm9yQWZ0ZXJBZGRDYWxsYmFja3MpO1xuXG4gICAgICAgIC8vIFN0b3JlIGEgY29weSBvZiB0aGUgYXJyYXkgaXRlbXMgd2UganVzdCBjb25zaWRlcmVkIHNvIHdlIGNhbiBkaWZmZXJlbmNlIGl0IG5leHQgdGltZVxuICAgICAgICBrby51dGlscy5kb21EYXRhLnNldChkb21Ob2RlLCBsYXN0TWFwcGluZ1Jlc3VsdERvbURhdGFLZXksIG5ld01hcHBpbmdSZXN1bHQpO1xuICAgIH1cbn0pKCk7XG5cbmtvLmV4cG9ydFN5bWJvbCgndXRpbHMuc2V0RG9tTm9kZUNoaWxkcmVuRnJvbUFycmF5TWFwcGluZycsIGtvLnV0aWxzLnNldERvbU5vZGVDaGlsZHJlbkZyb21BcnJheU1hcHBpbmcpO1xua28ubmF0aXZlVGVtcGxhdGVFbmdpbmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpc1snYWxsb3dUZW1wbGF0ZVJld3JpdGluZyddID0gZmFsc2U7XG59XG5cbmtvLm5hdGl2ZVRlbXBsYXRlRW5naW5lLnByb3RvdHlwZSA9IG5ldyBrby50ZW1wbGF0ZUVuZ2luZSgpO1xua28ubmF0aXZlVGVtcGxhdGVFbmdpbmUucHJvdG90eXBlLmNvbnN0cnVjdG9yID0ga28ubmF0aXZlVGVtcGxhdGVFbmdpbmU7XG5rby5uYXRpdmVUZW1wbGF0ZUVuZ2luZS5wcm90b3R5cGVbJ3JlbmRlclRlbXBsYXRlU291cmNlJ10gPSBmdW5jdGlvbiAodGVtcGxhdGVTb3VyY2UsIGJpbmRpbmdDb250ZXh0LCBvcHRpb25zKSB7XG4gICAgdmFyIHVzZU5vZGVzSWZBdmFpbGFibGUgPSAhKGtvLnV0aWxzLmllVmVyc2lvbiA8IDkpLCAvLyBJRTw5IGNsb25lTm9kZSBkb2Vzbid0IHdvcmsgcHJvcGVybHlcbiAgICAgICAgdGVtcGxhdGVOb2Rlc0Z1bmMgPSB1c2VOb2Rlc0lmQXZhaWxhYmxlID8gdGVtcGxhdGVTb3VyY2VbJ25vZGVzJ10gOiBudWxsLFxuICAgICAgICB0ZW1wbGF0ZU5vZGVzID0gdGVtcGxhdGVOb2Rlc0Z1bmMgPyB0ZW1wbGF0ZVNvdXJjZVsnbm9kZXMnXSgpIDogbnVsbDtcblxuICAgIGlmICh0ZW1wbGF0ZU5vZGVzKSB7XG4gICAgICAgIHJldHVybiBrby51dGlscy5tYWtlQXJyYXkodGVtcGxhdGVOb2Rlcy5jbG9uZU5vZGUodHJ1ZSkuY2hpbGROb2Rlcyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIHRlbXBsYXRlVGV4dCA9IHRlbXBsYXRlU291cmNlWyd0ZXh0J10oKTtcbiAgICAgICAgcmV0dXJuIGtvLnV0aWxzLnBhcnNlSHRtbEZyYWdtZW50KHRlbXBsYXRlVGV4dCk7XG4gICAgfVxufTtcblxua28ubmF0aXZlVGVtcGxhdGVFbmdpbmUuaW5zdGFuY2UgPSBuZXcga28ubmF0aXZlVGVtcGxhdGVFbmdpbmUoKTtcbmtvLnNldFRlbXBsYXRlRW5naW5lKGtvLm5hdGl2ZVRlbXBsYXRlRW5naW5lLmluc3RhbmNlKTtcblxua28uZXhwb3J0U3ltYm9sKCduYXRpdmVUZW1wbGF0ZUVuZ2luZScsIGtvLm5hdGl2ZVRlbXBsYXRlRW5naW5lKTtcbihmdW5jdGlvbigpIHtcbiAgICBrby5qcXVlcnlUbXBsVGVtcGxhdGVFbmdpbmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIC8vIERldGVjdCB3aGljaCB2ZXJzaW9uIG9mIGpxdWVyeS10bXBsIHlvdSdyZSB1c2luZy4gVW5mb3J0dW5hdGVseSBqcXVlcnktdG1wbFxuICAgICAgICAvLyBkb2Vzbid0IGV4cG9zZSBhIHZlcnNpb24gbnVtYmVyLCBzbyB3ZSBoYXZlIHRvIGluZmVyIGl0LlxuICAgICAgICAvLyBOb3RlIHRoYXQgYXMgb2YgS25vY2tvdXQgMS4zLCB3ZSBvbmx5IHN1cHBvcnQgalF1ZXJ5LnRtcGwgMS4wLjBwcmUgYW5kIGxhdGVyLFxuICAgICAgICAvLyB3aGljaCBLTyBpbnRlcm5hbGx5IHJlZmVycyB0byBhcyB2ZXJzaW9uIFwiMlwiLCBzbyBvbGRlciB2ZXJzaW9ucyBhcmUgbm8gbG9uZ2VyIGRldGVjdGVkLlxuICAgICAgICB2YXIgalF1ZXJ5VG1wbFZlcnNpb24gPSB0aGlzLmpRdWVyeVRtcGxWZXJzaW9uID0gKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaWYgKCh0eXBlb2YoalF1ZXJ5KSA9PSBcInVuZGVmaW5lZFwiKSB8fCAhKGpRdWVyeVsndG1wbCddKSlcbiAgICAgICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgICAgIC8vIFNpbmNlIGl0IGV4cG9zZXMgbm8gb2ZmaWNpYWwgdmVyc2lvbiBudW1iZXIsIHdlIHVzZSBvdXIgb3duIG51bWJlcmluZyBzeXN0ZW0uIFRvIGJlIHVwZGF0ZWQgYXMganF1ZXJ5LXRtcGwgZXZvbHZlcy5cbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgaWYgKGpRdWVyeVsndG1wbCddWyd0YWcnXVsndG1wbCddWydvcGVuJ10udG9TdHJpbmcoKS5pbmRleE9mKCdfXycpID49IDApIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gU2luY2UgMS4wLjBwcmUsIGN1c3RvbSB0YWdzIHNob3VsZCBhcHBlbmQgbWFya3VwIHRvIGFuIGFycmF5IGNhbGxlZCBcIl9fXCJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDI7IC8vIEZpbmFsIHZlcnNpb24gb2YganF1ZXJ5LnRtcGxcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGNhdGNoKGV4KSB7IC8qIEFwcGFyZW50bHkgbm90IHRoZSB2ZXJzaW9uIHdlIHdlcmUgbG9va2luZyBmb3IgKi8gfVxuXG4gICAgICAgICAgICByZXR1cm4gMTsgLy8gQW55IG9sZGVyIHZlcnNpb24gdGhhdCB3ZSBkb24ndCBzdXBwb3J0XG4gICAgICAgIH0pKCk7XG5cbiAgICAgICAgZnVuY3Rpb24gZW5zdXJlSGFzUmVmZXJlbmNlZEpRdWVyeVRlbXBsYXRlcygpIHtcbiAgICAgICAgICAgIGlmIChqUXVlcnlUbXBsVmVyc2lvbiA8IDIpXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiWW91ciB2ZXJzaW9uIG9mIGpRdWVyeS50bXBsIGlzIHRvbyBvbGQuIFBsZWFzZSB1cGdyYWRlIHRvIGpRdWVyeS50bXBsIDEuMC4wcHJlIG9yIGxhdGVyLlwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGV4ZWN1dGVUZW1wbGF0ZShjb21waWxlZFRlbXBsYXRlLCBkYXRhLCBqUXVlcnlUZW1wbGF0ZU9wdGlvbnMpIHtcbiAgICAgICAgICAgIHJldHVybiBqUXVlcnlbJ3RtcGwnXShjb21waWxlZFRlbXBsYXRlLCBkYXRhLCBqUXVlcnlUZW1wbGF0ZU9wdGlvbnMpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpc1sncmVuZGVyVGVtcGxhdGVTb3VyY2UnXSA9IGZ1bmN0aW9uKHRlbXBsYXRlU291cmNlLCBiaW5kaW5nQ29udGV4dCwgb3B0aW9ucykge1xuICAgICAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgICAgICAgICBlbnN1cmVIYXNSZWZlcmVuY2VkSlF1ZXJ5VGVtcGxhdGVzKCk7XG5cbiAgICAgICAgICAgIC8vIEVuc3VyZSB3ZSBoYXZlIHN0b3JlZCBhIHByZWNvbXBpbGVkIHZlcnNpb24gb2YgdGhpcyB0ZW1wbGF0ZSAoZG9uJ3Qgd2FudCB0byByZXBhcnNlIG9uIGV2ZXJ5IHJlbmRlcilcbiAgICAgICAgICAgIHZhciBwcmVjb21waWxlZCA9IHRlbXBsYXRlU291cmNlWydkYXRhJ10oJ3ByZWNvbXBpbGVkJyk7XG4gICAgICAgICAgICBpZiAoIXByZWNvbXBpbGVkKSB7XG4gICAgICAgICAgICAgICAgdmFyIHRlbXBsYXRlVGV4dCA9IHRlbXBsYXRlU291cmNlWyd0ZXh0J10oKSB8fCBcIlwiO1xuICAgICAgICAgICAgICAgIC8vIFdyYXAgaW4gXCJ3aXRoKCR3aGF0ZXZlci5rb0JpbmRpbmdDb250ZXh0KSB7IC4uLiB9XCJcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVRleHQgPSBcInt7a29fd2l0aCAkaXRlbS5rb0JpbmRpbmdDb250ZXh0fX1cIiArIHRlbXBsYXRlVGV4dCArIFwie3sva29fd2l0aH19XCI7XG5cbiAgICAgICAgICAgICAgICBwcmVjb21waWxlZCA9IGpRdWVyeVsndGVtcGxhdGUnXShudWxsLCB0ZW1wbGF0ZVRleHQpO1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlU291cmNlWydkYXRhJ10oJ3ByZWNvbXBpbGVkJywgcHJlY29tcGlsZWQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgZGF0YSA9IFtiaW5kaW5nQ29udGV4dFsnJGRhdGEnXV07IC8vIFByZXdyYXAgdGhlIGRhdGEgaW4gYW4gYXJyYXkgdG8gc3RvcCBqcXVlcnkudG1wbCBmcm9tIHRyeWluZyB0byB1bndyYXAgYW55IGFycmF5c1xuICAgICAgICAgICAgdmFyIGpRdWVyeVRlbXBsYXRlT3B0aW9ucyA9IGpRdWVyeVsnZXh0ZW5kJ10oeyAna29CaW5kaW5nQ29udGV4dCc6IGJpbmRpbmdDb250ZXh0IH0sIG9wdGlvbnNbJ3RlbXBsYXRlT3B0aW9ucyddKTtcblxuICAgICAgICAgICAgdmFyIHJlc3VsdE5vZGVzID0gZXhlY3V0ZVRlbXBsYXRlKHByZWNvbXBpbGVkLCBkYXRhLCBqUXVlcnlUZW1wbGF0ZU9wdGlvbnMpO1xuICAgICAgICAgICAgcmVzdWx0Tm9kZXNbJ2FwcGVuZFRvJ10oZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKSk7IC8vIFVzaW5nIFwiYXBwZW5kVG9cIiBmb3JjZXMgalF1ZXJ5L2pRdWVyeS50bXBsIHRvIHBlcmZvcm0gbmVjZXNzYXJ5IGNsZWFudXAgd29ya1xuXG4gICAgICAgICAgICBqUXVlcnlbJ2ZyYWdtZW50cyddID0ge307IC8vIENsZWFyIGpRdWVyeSdzIGZyYWdtZW50IGNhY2hlIHRvIGF2b2lkIGEgbWVtb3J5IGxlYWsgYWZ0ZXIgYSBsYXJnZSBudW1iZXIgb2YgdGVtcGxhdGUgcmVuZGVyc1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdE5vZGVzO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXNbJ2NyZWF0ZUphdmFTY3JpcHRFdmFsdWF0b3JCbG9jayddID0gZnVuY3Rpb24oc2NyaXB0KSB7XG4gICAgICAgICAgICByZXR1cm4gXCJ7e2tvX2NvZGUgKChmdW5jdGlvbigpIHsgcmV0dXJuIFwiICsgc2NyaXB0ICsgXCIgfSkoKSkgfX1cIjtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzWydhZGRUZW1wbGF0ZSddID0gZnVuY3Rpb24odGVtcGxhdGVOYW1lLCB0ZW1wbGF0ZU1hcmt1cCkge1xuICAgICAgICAgICAgZG9jdW1lbnQud3JpdGUoXCI8c2NyaXB0IHR5cGU9J3RleHQvaHRtbCcgaWQ9J1wiICsgdGVtcGxhdGVOYW1lICsgXCInPlwiICsgdGVtcGxhdGVNYXJrdXAgKyBcIjxcIiArIFwiL3NjcmlwdD5cIik7XG4gICAgICAgIH07XG5cbiAgICAgICAgaWYgKGpRdWVyeVRtcGxWZXJzaW9uID4gMCkge1xuICAgICAgICAgICAgalF1ZXJ5Wyd0bXBsJ11bJ3RhZyddWydrb19jb2RlJ10gPSB7XG4gICAgICAgICAgICAgICAgb3BlbjogXCJfXy5wdXNoKCQxIHx8ICcnKTtcIlxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGpRdWVyeVsndG1wbCddWyd0YWcnXVsna29fd2l0aCddID0ge1xuICAgICAgICAgICAgICAgIG9wZW46IFwid2l0aCgkMSkge1wiLFxuICAgICAgICAgICAgICAgIGNsb3NlOiBcIn0gXCJcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAga28uanF1ZXJ5VG1wbFRlbXBsYXRlRW5naW5lLnByb3RvdHlwZSA9IG5ldyBrby50ZW1wbGF0ZUVuZ2luZSgpO1xuICAgIGtvLmpxdWVyeVRtcGxUZW1wbGF0ZUVuZ2luZS5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBrby5qcXVlcnlUbXBsVGVtcGxhdGVFbmdpbmU7XG5cbiAgICAvLyBVc2UgdGhpcyBvbmUgYnkgZGVmYXVsdCAqb25seSBpZiBqcXVlcnkudG1wbCBpcyByZWZlcmVuY2VkKlxuICAgIHZhciBqcXVlcnlUbXBsVGVtcGxhdGVFbmdpbmVJbnN0YW5jZSA9IG5ldyBrby5qcXVlcnlUbXBsVGVtcGxhdGVFbmdpbmUoKTtcbiAgICBpZiAoanF1ZXJ5VG1wbFRlbXBsYXRlRW5naW5lSW5zdGFuY2UualF1ZXJ5VG1wbFZlcnNpb24gPiAwKVxuICAgICAgICBrby5zZXRUZW1wbGF0ZUVuZ2luZShqcXVlcnlUbXBsVGVtcGxhdGVFbmdpbmVJbnN0YW5jZSk7XG5cbiAgICBrby5leHBvcnRTeW1ib2woJ2pxdWVyeVRtcGxUZW1wbGF0ZUVuZ2luZScsIGtvLmpxdWVyeVRtcGxUZW1wbGF0ZUVuZ2luZSk7XG59KSgpO1xufSkpO1xufSgpKTtcbn0pKCk7XG4iLCIvKiFcbiAqIG11c3RhY2hlLmpzIC0gTG9naWMtbGVzcyB7e211c3RhY2hlfX0gdGVtcGxhdGVzIHdpdGggSmF2YVNjcmlwdFxuICogaHR0cDovL2dpdGh1Yi5jb20vamFubC9tdXN0YWNoZS5qc1xuICovXG5cbi8qZ2xvYmFsIGRlZmluZTogZmFsc2UqL1xuXG4oZnVuY3Rpb24gKHJvb3QsIGZhY3RvcnkpIHtcbiAgaWYgKHR5cGVvZiBleHBvcnRzID09PSBcIm9iamVjdFwiICYmIGV4cG9ydHMpIHtcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3Rvcnk7IC8vIENvbW1vbkpTXG4gIH0gZWxzZSBpZiAodHlwZW9mIGRlZmluZSA9PT0gXCJmdW5jdGlvblwiICYmIGRlZmluZS5hbWQpIHtcbiAgICBkZWZpbmUoZmFjdG9yeSk7IC8vIEFNRFxuICB9IGVsc2Uge1xuICAgIHJvb3QuTXVzdGFjaGUgPSBmYWN0b3J5OyAvLyA8c2NyaXB0PlxuICB9XG59KHRoaXMsIChmdW5jdGlvbiAoKSB7XG5cbiAgdmFyIGV4cG9ydHMgPSB7fTtcblxuICBleHBvcnRzLm5hbWUgPSBcIm11c3RhY2hlLmpzXCI7XG4gIGV4cG9ydHMudmVyc2lvbiA9IFwiMC43LjJcIjtcbiAgZXhwb3J0cy50YWdzID0gW1wie3tcIiwgXCJ9fVwiXTtcblxuICBleHBvcnRzLlNjYW5uZXIgPSBTY2FubmVyO1xuICBleHBvcnRzLkNvbnRleHQgPSBDb250ZXh0O1xuICBleHBvcnRzLldyaXRlciA9IFdyaXRlcjtcblxuICB2YXIgd2hpdGVSZSA9IC9cXHMqLztcbiAgdmFyIHNwYWNlUmUgPSAvXFxzKy87XG4gIHZhciBub25TcGFjZVJlID0gL1xcUy87XG4gIHZhciBlcVJlID0gL1xccyo9LztcbiAgdmFyIGN1cmx5UmUgPSAvXFxzKlxcfS87XG4gIHZhciB0YWdSZSA9IC8jfFxcXnxcXC98PnxcXHt8Jnw9fCEvO1xuXG4gIC8vIFdvcmthcm91bmQgZm9yIGh0dHBzOi8vaXNzdWVzLmFwYWNoZS5vcmcvamlyYS9icm93c2UvQ09VQ0hEQi01NzdcbiAgLy8gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9qYW5sL211c3RhY2hlLmpzL2lzc3Vlcy8xODlcbiAgZnVuY3Rpb24gdGVzdFJlKHJlLCBzdHJpbmcpIHtcbiAgICByZXR1cm4gUmVnRXhwLnByb3RvdHlwZS50ZXN0LmNhbGwocmUsIHN0cmluZyk7XG4gIH1cblxuICBmdW5jdGlvbiBpc1doaXRlc3BhY2Uoc3RyaW5nKSB7XG4gICAgcmV0dXJuICF0ZXN0UmUobm9uU3BhY2VSZSwgc3RyaW5nKTtcbiAgfVxuXG4gIHZhciBpc0FycmF5ID0gQXJyYXkuaXNBcnJheSB8fCBmdW5jdGlvbiAob2JqKSB7XG4gICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmopID09PSBcIltvYmplY3QgQXJyYXldXCI7XG4gIH07XG5cbiAgZnVuY3Rpb24gZXNjYXBlUmUoc3RyaW5nKSB7XG4gICAgcmV0dXJuIHN0cmluZy5yZXBsYWNlKC9bXFwtXFxbXFxde30oKSorPy4sXFxcXFxcXiR8I1xcc10vZywgXCJcXFxcJCZcIik7XG4gIH1cblxuICB2YXIgZW50aXR5TWFwID0ge1xuICAgIFwiJlwiOiBcIiZhbXA7XCIsXG4gICAgXCI8XCI6IFwiJmx0O1wiLFxuICAgIFwiPlwiOiBcIiZndDtcIixcbiAgICAnXCInOiAnJnF1b3Q7JyxcbiAgICBcIidcIjogJyYjMzk7JyxcbiAgICBcIi9cIjogJyYjeDJGOydcbiAgfTtcblxuICBmdW5jdGlvbiBlc2NhcGVIdG1sKHN0cmluZykge1xuICAgIHJldHVybiBTdHJpbmcoc3RyaW5nKS5yZXBsYWNlKC9bJjw+XCInXFwvXS9nLCBmdW5jdGlvbiAocykge1xuICAgICAgcmV0dXJuIGVudGl0eU1hcFtzXTtcbiAgICB9KTtcbiAgfVxuXG4gIC8vIEV4cG9ydCB0aGUgZXNjYXBpbmcgZnVuY3Rpb24gc28gdGhhdCB0aGUgdXNlciBtYXkgb3ZlcnJpZGUgaXQuXG4gIC8vIFNlZSBodHRwczovL2dpdGh1Yi5jb20vamFubC9tdXN0YWNoZS5qcy9pc3N1ZXMvMjQ0XG4gIGV4cG9ydHMuZXNjYXBlID0gZXNjYXBlSHRtbDtcblxuICBmdW5jdGlvbiBTY2FubmVyKHN0cmluZykge1xuICAgIHRoaXMuc3RyaW5nID0gc3RyaW5nO1xuICAgIHRoaXMudGFpbCA9IHN0cmluZztcbiAgICB0aGlzLnBvcyA9IDA7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBgdHJ1ZWAgaWYgdGhlIHRhaWwgaXMgZW1wdHkgKGVuZCBvZiBzdHJpbmcpLlxuICAgKi9cbiAgU2Nhbm5lci5wcm90b3R5cGUuZW9zID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLnRhaWwgPT09IFwiXCI7XG4gIH07XG5cbiAgLyoqXG4gICAqIFRyaWVzIHRvIG1hdGNoIHRoZSBnaXZlbiByZWd1bGFyIGV4cHJlc3Npb24gYXQgdGhlIGN1cnJlbnQgcG9zaXRpb24uXG4gICAqIFJldHVybnMgdGhlIG1hdGNoZWQgdGV4dCBpZiBpdCBjYW4gbWF0Y2gsIHRoZSBlbXB0eSBzdHJpbmcgb3RoZXJ3aXNlLlxuICAgKi9cbiAgU2Nhbm5lci5wcm90b3R5cGUuc2NhbiA9IGZ1bmN0aW9uIChyZSkge1xuICAgIHZhciBtYXRjaCA9IHRoaXMudGFpbC5tYXRjaChyZSk7XG5cbiAgICBpZiAobWF0Y2ggJiYgbWF0Y2guaW5kZXggPT09IDApIHtcbiAgICAgIHRoaXMudGFpbCA9IHRoaXMudGFpbC5zdWJzdHJpbmcobWF0Y2hbMF0ubGVuZ3RoKTtcbiAgICAgIHRoaXMucG9zICs9IG1hdGNoWzBdLmxlbmd0aDtcbiAgICAgIHJldHVybiBtYXRjaFswXTtcbiAgICB9XG5cbiAgICByZXR1cm4gXCJcIjtcbiAgfTtcblxuICAvKipcbiAgICogU2tpcHMgYWxsIHRleHQgdW50aWwgdGhlIGdpdmVuIHJlZ3VsYXIgZXhwcmVzc2lvbiBjYW4gYmUgbWF0Y2hlZC4gUmV0dXJuc1xuICAgKiB0aGUgc2tpcHBlZCBzdHJpbmcsIHdoaWNoIGlzIHRoZSBlbnRpcmUgdGFpbCBpZiBubyBtYXRjaCBjYW4gYmUgbWFkZS5cbiAgICovXG4gIFNjYW5uZXIucHJvdG90eXBlLnNjYW5VbnRpbCA9IGZ1bmN0aW9uIChyZSkge1xuICAgIHZhciBtYXRjaCwgcG9zID0gdGhpcy50YWlsLnNlYXJjaChyZSk7XG5cbiAgICBzd2l0Y2ggKHBvcykge1xuICAgIGNhc2UgLTE6XG4gICAgICBtYXRjaCA9IHRoaXMudGFpbDtcbiAgICAgIHRoaXMucG9zICs9IHRoaXMudGFpbC5sZW5ndGg7XG4gICAgICB0aGlzLnRhaWwgPSBcIlwiO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAwOlxuICAgICAgbWF0Y2ggPSBcIlwiO1xuICAgICAgYnJlYWs7XG4gICAgZGVmYXVsdDpcbiAgICAgIG1hdGNoID0gdGhpcy50YWlsLnN1YnN0cmluZygwLCBwb3MpO1xuICAgICAgdGhpcy50YWlsID0gdGhpcy50YWlsLnN1YnN0cmluZyhwb3MpO1xuICAgICAgdGhpcy5wb3MgKz0gcG9zO1xuICAgIH1cblxuICAgIHJldHVybiBtYXRjaDtcbiAgfTtcblxuICBmdW5jdGlvbiBDb250ZXh0KHZpZXcsIHBhcmVudCkge1xuICAgIHRoaXMudmlldyA9IHZpZXc7XG4gICAgdGhpcy5wYXJlbnQgPSBwYXJlbnQ7XG4gICAgdGhpcy5jbGVhckNhY2hlKCk7XG4gIH1cblxuICBDb250ZXh0Lm1ha2UgPSBmdW5jdGlvbiAodmlldykge1xuICAgIHJldHVybiAodmlldyBpbnN0YW5jZW9mIENvbnRleHQpID8gdmlldyA6IG5ldyBDb250ZXh0KHZpZXcpO1xuICB9O1xuXG4gIENvbnRleHQucHJvdG90eXBlLmNsZWFyQ2FjaGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5fY2FjaGUgPSB7fTtcbiAgfTtcblxuICBDb250ZXh0LnByb3RvdHlwZS5wdXNoID0gZnVuY3Rpb24gKHZpZXcpIHtcbiAgICByZXR1cm4gbmV3IENvbnRleHQodmlldywgdGhpcyk7XG4gIH07XG5cbiAgQ29udGV4dC5wcm90b3R5cGUubG9va3VwID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB2YXIgdmFsdWUgPSB0aGlzLl9jYWNoZVtuYW1lXTtcblxuICAgIGlmICghdmFsdWUpIHtcbiAgICAgIGlmIChuYW1lID09PSBcIi5cIikge1xuICAgICAgICB2YWx1ZSA9IHRoaXMudmlldztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBjb250ZXh0ID0gdGhpcztcblxuICAgICAgICB3aGlsZSAoY29udGV4dCkge1xuICAgICAgICAgIGlmIChuYW1lLmluZGV4T2YoXCIuXCIpID4gMCkge1xuICAgICAgICAgICAgdmFyIG5hbWVzID0gbmFtZS5zcGxpdChcIi5cIiksIGkgPSAwO1xuXG4gICAgICAgICAgICB2YWx1ZSA9IGNvbnRleHQudmlldztcblxuICAgICAgICAgICAgd2hpbGUgKHZhbHVlICYmIGkgPCBuYW1lcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZVtuYW1lc1tpKytdXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmFsdWUgPSBjb250ZXh0LnZpZXdbbmFtZV07XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKHZhbHVlICE9IG51bGwpIHtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnRleHQgPSBjb250ZXh0LnBhcmVudDtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB0aGlzLl9jYWNoZVtuYW1lXSA9IHZhbHVlO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2YgdmFsdWUgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgdmFsdWUgPSB2YWx1ZS5jYWxsKHRoaXMudmlldyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHZhbHVlO1xuICB9O1xuXG4gIGZ1bmN0aW9uIFdyaXRlcigpIHtcbiAgICB0aGlzLmNsZWFyQ2FjaGUoKTtcbiAgfVxuXG4gIFdyaXRlci5wcm90b3R5cGUuY2xlYXJDYWNoZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLl9jYWNoZSA9IHt9O1xuICAgIHRoaXMuX3BhcnRpYWxDYWNoZSA9IHt9O1xuICB9O1xuXG4gIFdyaXRlci5wcm90b3R5cGUuY29tcGlsZSA9IGZ1bmN0aW9uICh0ZW1wbGF0ZSwgdGFncykge1xuICAgIHZhciBmbiA9IHRoaXMuX2NhY2hlW3RlbXBsYXRlXTtcblxuICAgIGlmICghZm4pIHtcbiAgICAgIHZhciB0b2tlbnMgPSBleHBvcnRzLnBhcnNlKHRlbXBsYXRlLCB0YWdzKTtcbiAgICAgIGZuID0gdGhpcy5fY2FjaGVbdGVtcGxhdGVdID0gdGhpcy5jb21waWxlVG9rZW5zKHRva2VucywgdGVtcGxhdGUpO1xuICAgIH1cblxuICAgIHJldHVybiBmbjtcbiAgfTtcblxuICBXcml0ZXIucHJvdG90eXBlLmNvbXBpbGVQYXJ0aWFsID0gZnVuY3Rpb24gKG5hbWUsIHRlbXBsYXRlLCB0YWdzKSB7XG4gICAgdmFyIGZuID0gdGhpcy5jb21waWxlKHRlbXBsYXRlLCB0YWdzKTtcbiAgICB0aGlzLl9wYXJ0aWFsQ2FjaGVbbmFtZV0gPSBmbjtcbiAgICByZXR1cm4gZm47XG4gIH07XG5cbiAgV3JpdGVyLnByb3RvdHlwZS5jb21waWxlVG9rZW5zID0gZnVuY3Rpb24gKHRva2VucywgdGVtcGxhdGUpIHtcbiAgICB2YXIgZm4gPSBjb21waWxlVG9rZW5zKHRva2Vucyk7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2aWV3LCBwYXJ0aWFscykge1xuICAgICAgaWYgKHBhcnRpYWxzKSB7XG4gICAgICAgIGlmICh0eXBlb2YgcGFydGlhbHMgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgIHNlbGYuX2xvYWRQYXJ0aWFsID0gcGFydGlhbHM7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZm9yICh2YXIgbmFtZSBpbiBwYXJ0aWFscykge1xuICAgICAgICAgICAgc2VsZi5jb21waWxlUGFydGlhbChuYW1lLCBwYXJ0aWFsc1tuYW1lXSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBmbihzZWxmLCBDb250ZXh0Lm1ha2UodmlldyksIHRlbXBsYXRlKTtcbiAgICB9O1xuICB9O1xuXG4gIFdyaXRlci5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24gKHRlbXBsYXRlLCB2aWV3LCBwYXJ0aWFscykge1xuICAgIHJldHVybiB0aGlzLmNvbXBpbGUodGVtcGxhdGUpKHZpZXcsIHBhcnRpYWxzKTtcbiAgfTtcblxuICBXcml0ZXIucHJvdG90eXBlLl9zZWN0aW9uID0gZnVuY3Rpb24gKG5hbWUsIGNvbnRleHQsIHRleHQsIGNhbGxiYWNrKSB7XG4gICAgdmFyIHZhbHVlID0gY29udGV4dC5sb29rdXAobmFtZSk7XG5cbiAgICBzd2l0Y2ggKHR5cGVvZiB2YWx1ZSkge1xuICAgIGNhc2UgXCJvYmplY3RcIjpcbiAgICAgIGlmIChpc0FycmF5KHZhbHVlKSkge1xuICAgICAgICB2YXIgYnVmZmVyID0gXCJcIjtcblxuICAgICAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gdmFsdWUubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICAgICAgICBidWZmZXIgKz0gY2FsbGJhY2sodGhpcywgY29udGV4dC5wdXNoKHZhbHVlW2ldKSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gYnVmZmVyO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdmFsdWUgPyBjYWxsYmFjayh0aGlzLCBjb250ZXh0LnB1c2godmFsdWUpKSA6IFwiXCI7XG4gICAgY2FzZSBcImZ1bmN0aW9uXCI6XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICB2YXIgc2NvcGVkUmVuZGVyID0gZnVuY3Rpb24gKHRlbXBsYXRlKSB7XG4gICAgICAgIHJldHVybiBzZWxmLnJlbmRlcih0ZW1wbGF0ZSwgY29udGV4dCk7XG4gICAgICB9O1xuXG4gICAgICB2YXIgcmVzdWx0ID0gdmFsdWUuY2FsbChjb250ZXh0LnZpZXcsIHRleHQsIHNjb3BlZFJlbmRlcik7XG4gICAgICByZXR1cm4gcmVzdWx0ICE9IG51bGwgPyByZXN1bHQgOiBcIlwiO1xuICAgIGRlZmF1bHQ6XG4gICAgICBpZiAodmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrKHRoaXMsIGNvbnRleHQpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBcIlwiO1xuICB9O1xuXG4gIFdyaXRlci5wcm90b3R5cGUuX2ludmVydGVkID0gZnVuY3Rpb24gKG5hbWUsIGNvbnRleHQsIGNhbGxiYWNrKSB7XG4gICAgdmFyIHZhbHVlID0gY29udGV4dC5sb29rdXAobmFtZSk7XG5cbiAgICAvLyBVc2UgSmF2YVNjcmlwdCdzIGRlZmluaXRpb24gb2YgZmFsc3kuIEluY2x1ZGUgZW1wdHkgYXJyYXlzLlxuICAgIC8vIFNlZSBodHRwczovL2dpdGh1Yi5jb20vamFubC9tdXN0YWNoZS5qcy9pc3N1ZXMvMTg2XG4gICAgaWYgKCF2YWx1ZSB8fCAoaXNBcnJheSh2YWx1ZSkgJiYgdmFsdWUubGVuZ3RoID09PSAwKSkge1xuICAgICAgcmV0dXJuIGNhbGxiYWNrKHRoaXMsIGNvbnRleHQpO1xuICAgIH1cblxuICAgIHJldHVybiBcIlwiO1xuICB9O1xuXG4gIFdyaXRlci5wcm90b3R5cGUuX3BhcnRpYWwgPSBmdW5jdGlvbiAobmFtZSwgY29udGV4dCkge1xuICAgIGlmICghKG5hbWUgaW4gdGhpcy5fcGFydGlhbENhY2hlKSAmJiB0aGlzLl9sb2FkUGFydGlhbCkge1xuICAgICAgdGhpcy5jb21waWxlUGFydGlhbChuYW1lLCB0aGlzLl9sb2FkUGFydGlhbChuYW1lKSk7XG4gICAgfVxuXG4gICAgdmFyIGZuID0gdGhpcy5fcGFydGlhbENhY2hlW25hbWVdO1xuXG4gICAgcmV0dXJuIGZuID8gZm4oY29udGV4dCkgOiBcIlwiO1xuICB9O1xuXG4gIFdyaXRlci5wcm90b3R5cGUuX25hbWUgPSBmdW5jdGlvbiAobmFtZSwgY29udGV4dCkge1xuICAgIHZhciB2YWx1ZSA9IGNvbnRleHQubG9va3VwKG5hbWUpO1xuXG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICB2YWx1ZSA9IHZhbHVlLmNhbGwoY29udGV4dC52aWV3KTtcbiAgICB9XG5cbiAgICByZXR1cm4gKHZhbHVlID09IG51bGwpID8gXCJcIiA6IFN0cmluZyh2YWx1ZSk7XG4gIH07XG5cbiAgV3JpdGVyLnByb3RvdHlwZS5fZXNjYXBlZCA9IGZ1bmN0aW9uIChuYW1lLCBjb250ZXh0KSB7XG4gICAgcmV0dXJuIGV4cG9ydHMuZXNjYXBlKHRoaXMuX25hbWUobmFtZSwgY29udGV4dCkpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBMb3ctbGV2ZWwgZnVuY3Rpb24gdGhhdCBjb21waWxlcyB0aGUgZ2l2ZW4gYHRva2Vuc2AgaW50byBhIGZ1bmN0aW9uXG4gICAqIHRoYXQgYWNjZXB0cyB0aHJlZSBhcmd1bWVudHM6IGEgV3JpdGVyLCBhIENvbnRleHQsIGFuZCB0aGUgdGVtcGxhdGUuXG4gICAqL1xuICBmdW5jdGlvbiBjb21waWxlVG9rZW5zKHRva2Vucykge1xuICAgIHZhciBzdWJSZW5kZXJzID0ge307XG5cbiAgICBmdW5jdGlvbiBzdWJSZW5kZXIoaSwgdG9rZW5zLCB0ZW1wbGF0ZSkge1xuICAgICAgaWYgKCFzdWJSZW5kZXJzW2ldKSB7XG4gICAgICAgIHZhciBmbiA9IGNvbXBpbGVUb2tlbnModG9rZW5zKTtcbiAgICAgICAgc3ViUmVuZGVyc1tpXSA9IGZ1bmN0aW9uICh3cml0ZXIsIGNvbnRleHQpIHtcbiAgICAgICAgICByZXR1cm4gZm4od3JpdGVyLCBjb250ZXh0LCB0ZW1wbGF0ZSk7XG4gICAgICAgIH07XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBzdWJSZW5kZXJzW2ldO1xuICAgIH1cblxuICAgIHJldHVybiBmdW5jdGlvbiAod3JpdGVyLCBjb250ZXh0LCB0ZW1wbGF0ZSkge1xuICAgICAgdmFyIGJ1ZmZlciA9IFwiXCI7XG4gICAgICB2YXIgdG9rZW4sIHNlY3Rpb25UZXh0O1xuXG4gICAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gdG9rZW5zLmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XG4gICAgICAgIHRva2VuID0gdG9rZW5zW2ldO1xuXG4gICAgICAgIHN3aXRjaCAodG9rZW5bMF0pIHtcbiAgICAgICAgY2FzZSBcIiNcIjpcbiAgICAgICAgICBzZWN0aW9uVGV4dCA9IHRlbXBsYXRlLnNsaWNlKHRva2VuWzNdLCB0b2tlbls1XSk7XG4gICAgICAgICAgYnVmZmVyICs9IHdyaXRlci5fc2VjdGlvbih0b2tlblsxXSwgY29udGV4dCwgc2VjdGlvblRleHQsIHN1YlJlbmRlcihpLCB0b2tlbls0XSwgdGVtcGxhdGUpKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcIl5cIjpcbiAgICAgICAgICBidWZmZXIgKz0gd3JpdGVyLl9pbnZlcnRlZCh0b2tlblsxXSwgY29udGV4dCwgc3ViUmVuZGVyKGksIHRva2VuWzRdLCB0ZW1wbGF0ZSkpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwiPlwiOlxuICAgICAgICAgIGJ1ZmZlciArPSB3cml0ZXIuX3BhcnRpYWwodG9rZW5bMV0sIGNvbnRleHQpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwiJlwiOlxuICAgICAgICAgIGJ1ZmZlciArPSB3cml0ZXIuX25hbWUodG9rZW5bMV0sIGNvbnRleHQpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwibmFtZVwiOlxuICAgICAgICAgIGJ1ZmZlciArPSB3cml0ZXIuX2VzY2FwZWQodG9rZW5bMV0sIGNvbnRleHQpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwidGV4dFwiOlxuICAgICAgICAgIGJ1ZmZlciArPSB0b2tlblsxXTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gYnVmZmVyO1xuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogRm9ybXMgdGhlIGdpdmVuIGFycmF5IG9mIGB0b2tlbnNgIGludG8gYSBuZXN0ZWQgdHJlZSBzdHJ1Y3R1cmUgd2hlcmVcbiAgICogdG9rZW5zIHRoYXQgcmVwcmVzZW50IGEgc2VjdGlvbiBoYXZlIHR3byBhZGRpdGlvbmFsIGl0ZW1zOiAxKSBhbiBhcnJheSBvZlxuICAgKiBhbGwgdG9rZW5zIHRoYXQgYXBwZWFyIGluIHRoYXQgc2VjdGlvbiBhbmQgMikgdGhlIGluZGV4IGluIHRoZSBvcmlnaW5hbFxuICAgKiB0ZW1wbGF0ZSB0aGF0IHJlcHJlc2VudHMgdGhlIGVuZCBvZiB0aGF0IHNlY3Rpb24uXG4gICAqL1xuICBmdW5jdGlvbiBuZXN0VG9rZW5zKHRva2Vucykge1xuICAgIHZhciB0cmVlID0gW107XG4gICAgdmFyIGNvbGxlY3RvciA9IHRyZWU7XG4gICAgdmFyIHNlY3Rpb25zID0gW107XG5cbiAgICB2YXIgdG9rZW47XG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IHRva2Vucy5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICAgICAgdG9rZW4gPSB0b2tlbnNbaV07XG4gICAgICBzd2l0Y2ggKHRva2VuWzBdKSB7XG4gICAgICBjYXNlICcjJzpcbiAgICAgIGNhc2UgJ14nOlxuICAgICAgICBzZWN0aW9ucy5wdXNoKHRva2VuKTtcbiAgICAgICAgY29sbGVjdG9yLnB1c2godG9rZW4pO1xuICAgICAgICBjb2xsZWN0b3IgPSB0b2tlbls0XSA9IFtdO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJy8nOlxuICAgICAgICB2YXIgc2VjdGlvbiA9IHNlY3Rpb25zLnBvcCgpO1xuICAgICAgICBzZWN0aW9uWzVdID0gdG9rZW5bMl07XG4gICAgICAgIGNvbGxlY3RvciA9IHNlY3Rpb25zLmxlbmd0aCA+IDAgPyBzZWN0aW9uc1tzZWN0aW9ucy5sZW5ndGggLSAxXVs0XSA6IHRyZWU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgY29sbGVjdG9yLnB1c2godG9rZW4pO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0cmVlO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbWJpbmVzIHRoZSB2YWx1ZXMgb2YgY29uc2VjdXRpdmUgdGV4dCB0b2tlbnMgaW4gdGhlIGdpdmVuIGB0b2tlbnNgIGFycmF5XG4gICAqIHRvIGEgc2luZ2xlIHRva2VuLlxuICAgKi9cbiAgZnVuY3Rpb24gc3F1YXNoVG9rZW5zKHRva2Vucykge1xuICAgIHZhciBzcXVhc2hlZFRva2VucyA9IFtdO1xuXG4gICAgdmFyIHRva2VuLCBsYXN0VG9rZW47XG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IHRva2Vucy5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICAgICAgdG9rZW4gPSB0b2tlbnNbaV07XG4gICAgICBpZiAodG9rZW5bMF0gPT09ICd0ZXh0JyAmJiBsYXN0VG9rZW4gJiYgbGFzdFRva2VuWzBdID09PSAndGV4dCcpIHtcbiAgICAgICAgbGFzdFRva2VuWzFdICs9IHRva2VuWzFdO1xuICAgICAgICBsYXN0VG9rZW5bM10gPSB0b2tlblszXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxhc3RUb2tlbiA9IHRva2VuO1xuICAgICAgICBzcXVhc2hlZFRva2Vucy5wdXNoKHRva2VuKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gc3F1YXNoZWRUb2tlbnM7XG4gIH1cblxuICBmdW5jdGlvbiBlc2NhcGVUYWdzKHRhZ3MpIHtcbiAgICByZXR1cm4gW1xuICAgICAgbmV3IFJlZ0V4cChlc2NhcGVSZSh0YWdzWzBdKSArIFwiXFxcXHMqXCIpLFxuICAgICAgbmV3IFJlZ0V4cChcIlxcXFxzKlwiICsgZXNjYXBlUmUodGFnc1sxXSkpXG4gICAgXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBCcmVha3MgdXAgdGhlIGdpdmVuIGB0ZW1wbGF0ZWAgc3RyaW5nIGludG8gYSB0cmVlIG9mIHRva2VuIG9iamVjdHMuIElmXG4gICAqIGB0YWdzYCBpcyBnaXZlbiBoZXJlIGl0IG11c3QgYmUgYW4gYXJyYXkgd2l0aCB0d28gc3RyaW5nIHZhbHVlczogdGhlXG4gICAqIG9wZW5pbmcgYW5kIGNsb3NpbmcgdGFncyB1c2VkIGluIHRoZSB0ZW1wbGF0ZSAoZS5nLiBbXCI8JVwiLCBcIiU+XCJdKS4gT2ZcbiAgICogY291cnNlLCB0aGUgZGVmYXVsdCBpcyB0byB1c2UgbXVzdGFjaGVzIChpLmUuIE11c3RhY2hlLnRhZ3MpLlxuICAgKi9cbiAgZXhwb3J0cy5wYXJzZSA9IGZ1bmN0aW9uICh0ZW1wbGF0ZSwgdGFncykge1xuICAgIHRlbXBsYXRlID0gdGVtcGxhdGUgfHwgJyc7XG4gICAgdGFncyA9IHRhZ3MgfHwgZXhwb3J0cy50YWdzO1xuXG4gICAgaWYgKHR5cGVvZiB0YWdzID09PSAnc3RyaW5nJykgdGFncyA9IHRhZ3Muc3BsaXQoc3BhY2VSZSk7XG4gICAgaWYgKHRhZ3MubGVuZ3RoICE9PSAyKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgdGFnczogJyArIHRhZ3Muam9pbignLCAnKSk7XG4gICAgfVxuXG4gICAgdmFyIHRhZ1JlcyA9IGVzY2FwZVRhZ3ModGFncyk7XG4gICAgdmFyIHNjYW5uZXIgPSBuZXcgU2Nhbm5lcih0ZW1wbGF0ZSk7XG5cbiAgICB2YXIgc2VjdGlvbnMgPSBbXTsgICAgIC8vIFN0YWNrIHRvIGhvbGQgc2VjdGlvbiB0b2tlbnNcbiAgICB2YXIgdG9rZW5zID0gW107ICAgICAgIC8vIEJ1ZmZlciB0byBob2xkIHRoZSB0b2tlbnNcbiAgICB2YXIgc3BhY2VzID0gW107ICAgICAgIC8vIEluZGljZXMgb2Ygd2hpdGVzcGFjZSB0b2tlbnMgb24gdGhlIGN1cnJlbnQgbGluZVxuICAgIHZhciBoYXNUYWcgPSBmYWxzZTsgICAgLy8gSXMgdGhlcmUgYSB7e3RhZ319IG9uIHRoZSBjdXJyZW50IGxpbmU/XG4gICAgdmFyIG5vblNwYWNlID0gZmFsc2U7ICAvLyBJcyB0aGVyZSBhIG5vbi1zcGFjZSBjaGFyIG9uIHRoZSBjdXJyZW50IGxpbmU/XG5cbiAgICAvLyBTdHJpcHMgYWxsIHdoaXRlc3BhY2UgdG9rZW5zIGFycmF5IGZvciB0aGUgY3VycmVudCBsaW5lXG4gICAgLy8gaWYgdGhlcmUgd2FzIGEge3sjdGFnfX0gb24gaXQgYW5kIG90aGVyd2lzZSBvbmx5IHNwYWNlLlxuICAgIGZ1bmN0aW9uIHN0cmlwU3BhY2UoKSB7XG4gICAgICBpZiAoaGFzVGFnICYmICFub25TcGFjZSkge1xuICAgICAgICB3aGlsZSAoc3BhY2VzLmxlbmd0aCkge1xuICAgICAgICAgIHRva2Vucy5zcGxpY2Uoc3BhY2VzLnBvcCgpLCAxKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3BhY2VzID0gW107XG4gICAgICB9XG5cbiAgICAgIGhhc1RhZyA9IGZhbHNlO1xuICAgICAgbm9uU3BhY2UgPSBmYWxzZTtcbiAgICB9XG5cbiAgICB2YXIgc3RhcnQsIHR5cGUsIHZhbHVlLCBjaHI7XG4gICAgd2hpbGUgKCFzY2FubmVyLmVvcygpKSB7XG4gICAgICBzdGFydCA9IHNjYW5uZXIucG9zO1xuICAgICAgdmFsdWUgPSBzY2FubmVyLnNjYW5VbnRpbCh0YWdSZXNbMF0pO1xuXG4gICAgICBpZiAodmFsdWUpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IHZhbHVlLmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XG4gICAgICAgICAgY2hyID0gdmFsdWUuY2hhckF0KGkpO1xuXG4gICAgICAgICAgaWYgKGlzV2hpdGVzcGFjZShjaHIpKSB7XG4gICAgICAgICAgICBzcGFjZXMucHVzaCh0b2tlbnMubGVuZ3RoKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbm9uU3BhY2UgPSB0cnVlO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHRva2Vucy5wdXNoKFtcInRleHRcIiwgY2hyLCBzdGFydCwgc3RhcnQgKyAxXSk7XG4gICAgICAgICAgc3RhcnQgKz0gMTtcblxuICAgICAgICAgIGlmIChjaHIgPT09IFwiXFxuXCIpIHtcbiAgICAgICAgICAgIHN0cmlwU3BhY2UoKTsgLy8gQ2hlY2sgZm9yIHdoaXRlc3BhY2Ugb24gdGhlIGN1cnJlbnQgbGluZS5cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgc3RhcnQgPSBzY2FubmVyLnBvcztcblxuICAgICAgLy8gTWF0Y2ggdGhlIG9wZW5pbmcgdGFnLlxuICAgICAgaWYgKCFzY2FubmVyLnNjYW4odGFnUmVzWzBdKSkge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgaGFzVGFnID0gdHJ1ZTtcbiAgICAgIHR5cGUgPSBzY2FubmVyLnNjYW4odGFnUmUpIHx8IFwibmFtZVwiO1xuXG4gICAgICAvLyBTa2lwIGFueSB3aGl0ZXNwYWNlIGJldHdlZW4gdGFnIGFuZCB2YWx1ZS5cbiAgICAgIHNjYW5uZXIuc2Nhbih3aGl0ZVJlKTtcblxuICAgICAgLy8gRXh0cmFjdCB0aGUgdGFnIHZhbHVlLlxuICAgICAgaWYgKHR5cGUgPT09IFwiPVwiKSB7XG4gICAgICAgIHZhbHVlID0gc2Nhbm5lci5zY2FuVW50aWwoZXFSZSk7XG4gICAgICAgIHNjYW5uZXIuc2NhbihlcVJlKTtcbiAgICAgICAgc2Nhbm5lci5zY2FuVW50aWwodGFnUmVzWzFdKTtcbiAgICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gXCJ7XCIpIHtcbiAgICAgICAgdmFyIGNsb3NlUmUgPSBuZXcgUmVnRXhwKFwiXFxcXHMqXCIgKyBlc2NhcGVSZShcIn1cIiArIHRhZ3NbMV0pKTtcbiAgICAgICAgdmFsdWUgPSBzY2FubmVyLnNjYW5VbnRpbChjbG9zZVJlKTtcbiAgICAgICAgc2Nhbm5lci5zY2FuKGN1cmx5UmUpO1xuICAgICAgICBzY2FubmVyLnNjYW5VbnRpbCh0YWdSZXNbMV0pO1xuICAgICAgICB0eXBlID0gXCImXCI7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YWx1ZSA9IHNjYW5uZXIuc2NhblVudGlsKHRhZ1Jlc1sxXSk7XG4gICAgICB9XG5cbiAgICAgIC8vIE1hdGNoIHRoZSBjbG9zaW5nIHRhZy5cbiAgICAgIGlmICghc2Nhbm5lci5zY2FuKHRhZ1Jlc1sxXSkpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmNsb3NlZCB0YWcgYXQgJyArIHNjYW5uZXIucG9zKTtcbiAgICAgIH1cblxuICAgICAgLy8gQ2hlY2sgc2VjdGlvbiBuZXN0aW5nLlxuICAgICAgaWYgKHR5cGUgPT09ICcvJykge1xuICAgICAgICBpZiAoc2VjdGlvbnMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbm9wZW5lZCBzZWN0aW9uIFwiJyArIHZhbHVlICsgJ1wiIGF0ICcgKyBzdGFydCk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgc2VjdGlvbiA9IHNlY3Rpb25zLnBvcCgpO1xuXG4gICAgICAgIGlmIChzZWN0aW9uWzFdICE9PSB2YWx1ZSkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVW5jbG9zZWQgc2VjdGlvbiBcIicgKyBzZWN0aW9uWzFdICsgJ1wiIGF0ICcgKyBzdGFydCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgdmFyIHRva2VuID0gW3R5cGUsIHZhbHVlLCBzdGFydCwgc2Nhbm5lci5wb3NdO1xuICAgICAgdG9rZW5zLnB1c2godG9rZW4pO1xuXG4gICAgICBpZiAodHlwZSA9PT0gJyMnIHx8IHR5cGUgPT09ICdeJykge1xuICAgICAgICBzZWN0aW9ucy5wdXNoKHRva2VuKTtcbiAgICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gXCJuYW1lXCIgfHwgdHlwZSA9PT0gXCJ7XCIgfHwgdHlwZSA9PT0gXCImXCIpIHtcbiAgICAgICAgbm9uU3BhY2UgPSB0cnVlO1xuICAgICAgfSBlbHNlIGlmICh0eXBlID09PSBcIj1cIikge1xuICAgICAgICAvLyBTZXQgdGhlIHRhZ3MgZm9yIHRoZSBuZXh0IHRpbWUgYXJvdW5kLlxuICAgICAgICB0YWdzID0gdmFsdWUuc3BsaXQoc3BhY2VSZSk7XG5cbiAgICAgICAgaWYgKHRhZ3MubGVuZ3RoICE9PSAyKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIHRhZ3MgYXQgJyArIHN0YXJ0ICsgJzogJyArIHRhZ3Muam9pbignLCAnKSk7XG4gICAgICAgIH1cblxuICAgICAgICB0YWdSZXMgPSBlc2NhcGVUYWdzKHRhZ3MpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIE1ha2Ugc3VyZSB0aGVyZSBhcmUgbm8gb3BlbiBzZWN0aW9ucyB3aGVuIHdlJ3JlIGRvbmUuXG4gICAgdmFyIHNlY3Rpb24gPSBzZWN0aW9ucy5wb3AoKTtcbiAgICBpZiAoc2VjdGlvbikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmNsb3NlZCBzZWN0aW9uIFwiJyArIHNlY3Rpb25bMV0gKyAnXCIgYXQgJyArIHNjYW5uZXIucG9zKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmVzdFRva2VucyhzcXVhc2hUb2tlbnModG9rZW5zKSk7XG4gIH07XG5cbiAgLy8gVGhlIGhpZ2gtbGV2ZWwgY2xlYXJDYWNoZSwgY29tcGlsZSwgY29tcGlsZVBhcnRpYWwsIGFuZCByZW5kZXIgZnVuY3Rpb25zXG4gIC8vIHVzZSB0aGlzIGRlZmF1bHQgd3JpdGVyLlxuICB2YXIgX3dyaXRlciA9IG5ldyBXcml0ZXIoKTtcblxuICAvKipcbiAgICogQ2xlYXJzIGFsbCBjYWNoZWQgdGVtcGxhdGVzIGFuZCBwYXJ0aWFscyBpbiB0aGUgZGVmYXVsdCB3cml0ZXIuXG4gICAqL1xuICBleHBvcnRzLmNsZWFyQ2FjaGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIF93cml0ZXIuY2xlYXJDYWNoZSgpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBDb21waWxlcyB0aGUgZ2l2ZW4gYHRlbXBsYXRlYCB0byBhIHJldXNhYmxlIGZ1bmN0aW9uIHVzaW5nIHRoZSBkZWZhdWx0XG4gICAqIHdyaXRlci5cbiAgICovXG4gIGV4cG9ydHMuY29tcGlsZSA9IGZ1bmN0aW9uICh0ZW1wbGF0ZSwgdGFncykge1xuICAgIHJldHVybiBfd3JpdGVyLmNvbXBpbGUodGVtcGxhdGUsIHRhZ3MpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBDb21waWxlcyB0aGUgcGFydGlhbCB3aXRoIHRoZSBnaXZlbiBgbmFtZWAgYW5kIGB0ZW1wbGF0ZWAgdG8gYSByZXVzYWJsZVxuICAgKiBmdW5jdGlvbiB1c2luZyB0aGUgZGVmYXVsdCB3cml0ZXIuXG4gICAqL1xuICBleHBvcnRzLmNvbXBpbGVQYXJ0aWFsID0gZnVuY3Rpb24gKG5hbWUsIHRlbXBsYXRlLCB0YWdzKSB7XG4gICAgcmV0dXJuIF93cml0ZXIuY29tcGlsZVBhcnRpYWwobmFtZSwgdGVtcGxhdGUsIHRhZ3MpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBDb21waWxlcyB0aGUgZ2l2ZW4gYXJyYXkgb2YgdG9rZW5zICh0aGUgb3V0cHV0IG9mIGEgcGFyc2UpIHRvIGEgcmV1c2FibGVcbiAgICogZnVuY3Rpb24gdXNpbmcgdGhlIGRlZmF1bHQgd3JpdGVyLlxuICAgKi9cbiAgZXhwb3J0cy5jb21waWxlVG9rZW5zID0gZnVuY3Rpb24gKHRva2VucywgdGVtcGxhdGUpIHtcbiAgICByZXR1cm4gX3dyaXRlci5jb21waWxlVG9rZW5zKHRva2VucywgdGVtcGxhdGUpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBSZW5kZXJzIHRoZSBgdGVtcGxhdGVgIHdpdGggdGhlIGdpdmVuIGB2aWV3YCBhbmQgYHBhcnRpYWxzYCB1c2luZyB0aGVcbiAgICogZGVmYXVsdCB3cml0ZXIuXG4gICAqL1xuICBleHBvcnRzLnJlbmRlciA9IGZ1bmN0aW9uICh0ZW1wbGF0ZSwgdmlldywgcGFydGlhbHMpIHtcbiAgICByZXR1cm4gX3dyaXRlci5yZW5kZXIodGVtcGxhdGUsIHZpZXcsIHBhcnRpYWxzKTtcbiAgfTtcblxuICAvLyBUaGlzIGlzIGhlcmUgZm9yIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5IHdpdGggMC40LnguXG4gIGV4cG9ydHMudG9faHRtbCA9IGZ1bmN0aW9uICh0ZW1wbGF0ZSwgdmlldywgcGFydGlhbHMsIHNlbmQpIHtcbiAgICB2YXIgcmVzdWx0ID0gZXhwb3J0cy5yZW5kZXIodGVtcGxhdGUsIHZpZXcsIHBhcnRpYWxzKTtcblxuICAgIGlmICh0eXBlb2Ygc2VuZCA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICBzZW5kKHJlc3VsdCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuICB9O1xuXG4gIHJldHVybiBleHBvcnRzO1xuXG59KCkpKSk7XG4iLCIvLyAgICAgVW5kZXJzY29yZS5qcyAxLjUuMlxuLy8gICAgIGh0dHA6Ly91bmRlcnNjb3JlanMub3JnXG4vLyAgICAgKGMpIDIwMDktMjAxMyBKZXJlbXkgQXNoa2VuYXMsIERvY3VtZW50Q2xvdWQgYW5kIEludmVzdGlnYXRpdmUgUmVwb3J0ZXJzICYgRWRpdG9yc1xuLy8gICAgIFVuZGVyc2NvcmUgbWF5IGJlIGZyZWVseSBkaXN0cmlidXRlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2UuXG5cbihmdW5jdGlvbigpIHtcblxuICAvLyBCYXNlbGluZSBzZXR1cFxuICAvLyAtLS0tLS0tLS0tLS0tLVxuXG4gIC8vIEVzdGFibGlzaCB0aGUgcm9vdCBvYmplY3QsIGB3aW5kb3dgIGluIHRoZSBicm93c2VyLCBvciBgZXhwb3J0c2Agb24gdGhlIHNlcnZlci5cbiAgdmFyIHJvb3QgPSB0aGlzO1xuXG4gIC8vIFNhdmUgdGhlIHByZXZpb3VzIHZhbHVlIG9mIHRoZSBgX2AgdmFyaWFibGUuXG4gIHZhciBwcmV2aW91c1VuZGVyc2NvcmUgPSByb290Ll87XG5cbiAgLy8gRXN0YWJsaXNoIHRoZSBvYmplY3QgdGhhdCBnZXRzIHJldHVybmVkIHRvIGJyZWFrIG91dCBvZiBhIGxvb3AgaXRlcmF0aW9uLlxuICB2YXIgYnJlYWtlciA9IHt9O1xuXG4gIC8vIFNhdmUgYnl0ZXMgaW4gdGhlIG1pbmlmaWVkIChidXQgbm90IGd6aXBwZWQpIHZlcnNpb246XG4gIHZhciBBcnJheVByb3RvID0gQXJyYXkucHJvdG90eXBlLCBPYmpQcm90byA9IE9iamVjdC5wcm90b3R5cGUsIEZ1bmNQcm90byA9IEZ1bmN0aW9uLnByb3RvdHlwZTtcblxuICAvLyBDcmVhdGUgcXVpY2sgcmVmZXJlbmNlIHZhcmlhYmxlcyBmb3Igc3BlZWQgYWNjZXNzIHRvIGNvcmUgcHJvdG90eXBlcy5cbiAgdmFyXG4gICAgcHVzaCAgICAgICAgICAgICA9IEFycmF5UHJvdG8ucHVzaCxcbiAgICBzbGljZSAgICAgICAgICAgID0gQXJyYXlQcm90by5zbGljZSxcbiAgICBjb25jYXQgICAgICAgICAgID0gQXJyYXlQcm90by5jb25jYXQsXG4gICAgdG9TdHJpbmcgICAgICAgICA9IE9ialByb3RvLnRvU3RyaW5nLFxuICAgIGhhc093blByb3BlcnR5ICAgPSBPYmpQcm90by5oYXNPd25Qcm9wZXJ0eTtcblxuICAvLyBBbGwgKipFQ01BU2NyaXB0IDUqKiBuYXRpdmUgZnVuY3Rpb24gaW1wbGVtZW50YXRpb25zIHRoYXQgd2UgaG9wZSB0byB1c2VcbiAgLy8gYXJlIGRlY2xhcmVkIGhlcmUuXG4gIHZhclxuICAgIG5hdGl2ZUZvckVhY2ggICAgICA9IEFycmF5UHJvdG8uZm9yRWFjaCxcbiAgICBuYXRpdmVNYXAgICAgICAgICAgPSBBcnJheVByb3RvLm1hcCxcbiAgICBuYXRpdmVSZWR1Y2UgICAgICAgPSBBcnJheVByb3RvLnJlZHVjZSxcbiAgICBuYXRpdmVSZWR1Y2VSaWdodCAgPSBBcnJheVByb3RvLnJlZHVjZVJpZ2h0LFxuICAgIG5hdGl2ZUZpbHRlciAgICAgICA9IEFycmF5UHJvdG8uZmlsdGVyLFxuICAgIG5hdGl2ZUV2ZXJ5ICAgICAgICA9IEFycmF5UHJvdG8uZXZlcnksXG4gICAgbmF0aXZlU29tZSAgICAgICAgID0gQXJyYXlQcm90by5zb21lLFxuICAgIG5hdGl2ZUluZGV4T2YgICAgICA9IEFycmF5UHJvdG8uaW5kZXhPZixcbiAgICBuYXRpdmVMYXN0SW5kZXhPZiAgPSBBcnJheVByb3RvLmxhc3RJbmRleE9mLFxuICAgIG5hdGl2ZUlzQXJyYXkgICAgICA9IEFycmF5LmlzQXJyYXksXG4gICAgbmF0aXZlS2V5cyAgICAgICAgID0gT2JqZWN0LmtleXMsXG4gICAgbmF0aXZlQmluZCAgICAgICAgID0gRnVuY1Byb3RvLmJpbmQ7XG5cbiAgLy8gQ3JlYXRlIGEgc2FmZSByZWZlcmVuY2UgdG8gdGhlIFVuZGVyc2NvcmUgb2JqZWN0IGZvciB1c2UgYmVsb3cuXG4gIHZhciBfID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgaWYgKG9iaiBpbnN0YW5jZW9mIF8pIHJldHVybiBvYmo7XG4gICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIF8pKSByZXR1cm4gbmV3IF8ob2JqKTtcbiAgICB0aGlzLl93cmFwcGVkID0gb2JqO1xuICB9O1xuXG4gIC8vIEV4cG9ydCB0aGUgVW5kZXJzY29yZSBvYmplY3QgZm9yICoqTm9kZS5qcyoqLCB3aXRoXG4gIC8vIGJhY2t3YXJkcy1jb21wYXRpYmlsaXR5IGZvciB0aGUgb2xkIGByZXF1aXJlKClgIEFQSS4gSWYgd2UncmUgaW5cbiAgLy8gdGhlIGJyb3dzZXIsIGFkZCBgX2AgYXMgYSBnbG9iYWwgb2JqZWN0IHZpYSBhIHN0cmluZyBpZGVudGlmaWVyLFxuICAvLyBmb3IgQ2xvc3VyZSBDb21waWxlciBcImFkdmFuY2VkXCIgbW9kZS5cbiAgaWYgKHR5cGVvZiBleHBvcnRzICE9PSAndW5kZWZpbmVkJykge1xuICAgIGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xuICAgICAgZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gXztcbiAgICB9XG4gICAgZXhwb3J0cy5fID0gXztcbiAgfSBlbHNlIHtcbiAgICByb290Ll8gPSBfO1xuICB9XG5cbiAgLy8gQ3VycmVudCB2ZXJzaW9uLlxuICBfLlZFUlNJT04gPSAnMS41LjInO1xuXG4gIC8vIENvbGxlY3Rpb24gRnVuY3Rpb25zXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gVGhlIGNvcm5lcnN0b25lLCBhbiBgZWFjaGAgaW1wbGVtZW50YXRpb24sIGFrYSBgZm9yRWFjaGAuXG4gIC8vIEhhbmRsZXMgb2JqZWN0cyB3aXRoIHRoZSBidWlsdC1pbiBgZm9yRWFjaGAsIGFycmF5cywgYW5kIHJhdyBvYmplY3RzLlxuICAvLyBEZWxlZ2F0ZXMgdG8gKipFQ01BU2NyaXB0IDUqKidzIG5hdGl2ZSBgZm9yRWFjaGAgaWYgYXZhaWxhYmxlLlxuICB2YXIgZWFjaCA9IF8uZWFjaCA9IF8uZm9yRWFjaCA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0b3IsIGNvbnRleHQpIHtcbiAgICBpZiAob2JqID09IG51bGwpIHJldHVybjtcbiAgICBpZiAobmF0aXZlRm9yRWFjaCAmJiBvYmouZm9yRWFjaCA9PT0gbmF0aXZlRm9yRWFjaCkge1xuICAgICAgb2JqLmZvckVhY2goaXRlcmF0b3IsIGNvbnRleHQpO1xuICAgIH0gZWxzZSBpZiAob2JqLmxlbmd0aCA9PT0gK29iai5sZW5ndGgpIHtcbiAgICAgIGZvciAodmFyIGkgPSAwLCBsZW5ndGggPSBvYmoubGVuZ3RoOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgb2JqW2ldLCBpLCBvYmopID09PSBicmVha2VyKSByZXR1cm47XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBrZXlzID0gXy5rZXlzKG9iaik7XG4gICAgICBmb3IgKHZhciBpID0gMCwgbGVuZ3RoID0ga2V5cy5sZW5ndGg7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoaXRlcmF0b3IuY2FsbChjb250ZXh0LCBvYmpba2V5c1tpXV0sIGtleXNbaV0sIG9iaikgPT09IGJyZWFrZXIpIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgLy8gUmV0dXJuIHRoZSByZXN1bHRzIG9mIGFwcGx5aW5nIHRoZSBpdGVyYXRvciB0byBlYWNoIGVsZW1lbnQuXG4gIC8vIERlbGVnYXRlcyB0byAqKkVDTUFTY3JpcHQgNSoqJ3MgbmF0aXZlIGBtYXBgIGlmIGF2YWlsYWJsZS5cbiAgXy5tYXAgPSBfLmNvbGxlY3QgPSBmdW5jdGlvbihvYmosIGl0ZXJhdG9yLCBjb250ZXh0KSB7XG4gICAgdmFyIHJlc3VsdHMgPSBbXTtcbiAgICBpZiAob2JqID09IG51bGwpIHJldHVybiByZXN1bHRzO1xuICAgIGlmIChuYXRpdmVNYXAgJiYgb2JqLm1hcCA9PT0gbmF0aXZlTWFwKSByZXR1cm4gb2JqLm1hcChpdGVyYXRvciwgY29udGV4dCk7XG4gICAgZWFjaChvYmosIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCwgbGlzdCkge1xuICAgICAgcmVzdWx0cy5wdXNoKGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgdmFsdWUsIGluZGV4LCBsaXN0KSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3VsdHM7XG4gIH07XG5cbiAgdmFyIHJlZHVjZUVycm9yID0gJ1JlZHVjZSBvZiBlbXB0eSBhcnJheSB3aXRoIG5vIGluaXRpYWwgdmFsdWUnO1xuXG4gIC8vICoqUmVkdWNlKiogYnVpbGRzIHVwIGEgc2luZ2xlIHJlc3VsdCBmcm9tIGEgbGlzdCBvZiB2YWx1ZXMsIGFrYSBgaW5qZWN0YCxcbiAgLy8gb3IgYGZvbGRsYC4gRGVsZWdhdGVzIHRvICoqRUNNQVNjcmlwdCA1KioncyBuYXRpdmUgYHJlZHVjZWAgaWYgYXZhaWxhYmxlLlxuICBfLnJlZHVjZSA9IF8uZm9sZGwgPSBfLmluamVjdCA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0b3IsIG1lbW8sIGNvbnRleHQpIHtcbiAgICB2YXIgaW5pdGlhbCA9IGFyZ3VtZW50cy5sZW5ndGggPiAyO1xuICAgIGlmIChvYmogPT0gbnVsbCkgb2JqID0gW107XG4gICAgaWYgKG5hdGl2ZVJlZHVjZSAmJiBvYmoucmVkdWNlID09PSBuYXRpdmVSZWR1Y2UpIHtcbiAgICAgIGlmIChjb250ZXh0KSBpdGVyYXRvciA9IF8uYmluZChpdGVyYXRvciwgY29udGV4dCk7XG4gICAgICByZXR1cm4gaW5pdGlhbCA/IG9iai5yZWR1Y2UoaXRlcmF0b3IsIG1lbW8pIDogb2JqLnJlZHVjZShpdGVyYXRvcik7XG4gICAgfVxuICAgIGVhY2gob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGxpc3QpIHtcbiAgICAgIGlmICghaW5pdGlhbCkge1xuICAgICAgICBtZW1vID0gdmFsdWU7XG4gICAgICAgIGluaXRpYWwgPSB0cnVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbWVtbyA9IGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgbWVtbywgdmFsdWUsIGluZGV4LCBsaXN0KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBpZiAoIWluaXRpYWwpIHRocm93IG5ldyBUeXBlRXJyb3IocmVkdWNlRXJyb3IpO1xuICAgIHJldHVybiBtZW1vO1xuICB9O1xuXG4gIC8vIFRoZSByaWdodC1hc3NvY2lhdGl2ZSB2ZXJzaW9uIG9mIHJlZHVjZSwgYWxzbyBrbm93biBhcyBgZm9sZHJgLlxuICAvLyBEZWxlZ2F0ZXMgdG8gKipFQ01BU2NyaXB0IDUqKidzIG5hdGl2ZSBgcmVkdWNlUmlnaHRgIGlmIGF2YWlsYWJsZS5cbiAgXy5yZWR1Y2VSaWdodCA9IF8uZm9sZHIgPSBmdW5jdGlvbihvYmosIGl0ZXJhdG9yLCBtZW1vLCBjb250ZXh0KSB7XG4gICAgdmFyIGluaXRpYWwgPSBhcmd1bWVudHMubGVuZ3RoID4gMjtcbiAgICBpZiAob2JqID09IG51bGwpIG9iaiA9IFtdO1xuICAgIGlmIChuYXRpdmVSZWR1Y2VSaWdodCAmJiBvYmoucmVkdWNlUmlnaHQgPT09IG5hdGl2ZVJlZHVjZVJpZ2h0KSB7XG4gICAgICBpZiAoY29udGV4dCkgaXRlcmF0b3IgPSBfLmJpbmQoaXRlcmF0b3IsIGNvbnRleHQpO1xuICAgICAgcmV0dXJuIGluaXRpYWwgPyBvYmoucmVkdWNlUmlnaHQoaXRlcmF0b3IsIG1lbW8pIDogb2JqLnJlZHVjZVJpZ2h0KGl0ZXJhdG9yKTtcbiAgICB9XG4gICAgdmFyIGxlbmd0aCA9IG9iai5sZW5ndGg7XG4gICAgaWYgKGxlbmd0aCAhPT0gK2xlbmd0aCkge1xuICAgICAgdmFyIGtleXMgPSBfLmtleXMob2JqKTtcbiAgICAgIGxlbmd0aCA9IGtleXMubGVuZ3RoO1xuICAgIH1cbiAgICBlYWNoKG9iaiwgZnVuY3Rpb24odmFsdWUsIGluZGV4LCBsaXN0KSB7XG4gICAgICBpbmRleCA9IGtleXMgPyBrZXlzWy0tbGVuZ3RoXSA6IC0tbGVuZ3RoO1xuICAgICAgaWYgKCFpbml0aWFsKSB7XG4gICAgICAgIG1lbW8gPSBvYmpbaW5kZXhdO1xuICAgICAgICBpbml0aWFsID0gdHJ1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG1lbW8gPSBpdGVyYXRvci5jYWxsKGNvbnRleHQsIG1lbW8sIG9ialtpbmRleF0sIGluZGV4LCBsaXN0KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBpZiAoIWluaXRpYWwpIHRocm93IG5ldyBUeXBlRXJyb3IocmVkdWNlRXJyb3IpO1xuICAgIHJldHVybiBtZW1vO1xuICB9O1xuXG4gIC8vIFJldHVybiB0aGUgZmlyc3QgdmFsdWUgd2hpY2ggcGFzc2VzIGEgdHJ1dGggdGVzdC4gQWxpYXNlZCBhcyBgZGV0ZWN0YC5cbiAgXy5maW5kID0gXy5kZXRlY3QgPSBmdW5jdGlvbihvYmosIGl0ZXJhdG9yLCBjb250ZXh0KSB7XG4gICAgdmFyIHJlc3VsdDtcbiAgICBhbnkob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGxpc3QpIHtcbiAgICAgIGlmIChpdGVyYXRvci5jYWxsKGNvbnRleHQsIHZhbHVlLCBpbmRleCwgbGlzdCkpIHtcbiAgICAgICAgcmVzdWx0ID0gdmFsdWU7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG5cbiAgLy8gUmV0dXJuIGFsbCB0aGUgZWxlbWVudHMgdGhhdCBwYXNzIGEgdHJ1dGggdGVzdC5cbiAgLy8gRGVsZWdhdGVzIHRvICoqRUNNQVNjcmlwdCA1KioncyBuYXRpdmUgYGZpbHRlcmAgaWYgYXZhaWxhYmxlLlxuICAvLyBBbGlhc2VkIGFzIGBzZWxlY3RgLlxuICBfLmZpbHRlciA9IF8uc2VsZWN0ID0gZnVuY3Rpb24ob2JqLCBpdGVyYXRvciwgY29udGV4dCkge1xuICAgIHZhciByZXN1bHRzID0gW107XG4gICAgaWYgKG9iaiA9PSBudWxsKSByZXR1cm4gcmVzdWx0cztcbiAgICBpZiAobmF0aXZlRmlsdGVyICYmIG9iai5maWx0ZXIgPT09IG5hdGl2ZUZpbHRlcikgcmV0dXJuIG9iai5maWx0ZXIoaXRlcmF0b3IsIGNvbnRleHQpO1xuICAgIGVhY2gob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGxpc3QpIHtcbiAgICAgIGlmIChpdGVyYXRvci5jYWxsKGNvbnRleHQsIHZhbHVlLCBpbmRleCwgbGlzdCkpIHJlc3VsdHMucHVzaCh2YWx1ZSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3VsdHM7XG4gIH07XG5cbiAgLy8gUmV0dXJuIGFsbCB0aGUgZWxlbWVudHMgZm9yIHdoaWNoIGEgdHJ1dGggdGVzdCBmYWlscy5cbiAgXy5yZWplY3QgPSBmdW5jdGlvbihvYmosIGl0ZXJhdG9yLCBjb250ZXh0KSB7XG4gICAgcmV0dXJuIF8uZmlsdGVyKG9iaiwgZnVuY3Rpb24odmFsdWUsIGluZGV4LCBsaXN0KSB7XG4gICAgICByZXR1cm4gIWl0ZXJhdG9yLmNhbGwoY29udGV4dCwgdmFsdWUsIGluZGV4LCBsaXN0KTtcbiAgICB9LCBjb250ZXh0KTtcbiAgfTtcblxuICAvLyBEZXRlcm1pbmUgd2hldGhlciBhbGwgb2YgdGhlIGVsZW1lbnRzIG1hdGNoIGEgdHJ1dGggdGVzdC5cbiAgLy8gRGVsZWdhdGVzIHRvICoqRUNNQVNjcmlwdCA1KioncyBuYXRpdmUgYGV2ZXJ5YCBpZiBhdmFpbGFibGUuXG4gIC8vIEFsaWFzZWQgYXMgYGFsbGAuXG4gIF8uZXZlcnkgPSBfLmFsbCA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0b3IsIGNvbnRleHQpIHtcbiAgICBpdGVyYXRvciB8fCAoaXRlcmF0b3IgPSBfLmlkZW50aXR5KTtcbiAgICB2YXIgcmVzdWx0ID0gdHJ1ZTtcbiAgICBpZiAob2JqID09IG51bGwpIHJldHVybiByZXN1bHQ7XG4gICAgaWYgKG5hdGl2ZUV2ZXJ5ICYmIG9iai5ldmVyeSA9PT0gbmF0aXZlRXZlcnkpIHJldHVybiBvYmouZXZlcnkoaXRlcmF0b3IsIGNvbnRleHQpO1xuICAgIGVhY2gob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGxpc3QpIHtcbiAgICAgIGlmICghKHJlc3VsdCA9IHJlc3VsdCAmJiBpdGVyYXRvci5jYWxsKGNvbnRleHQsIHZhbHVlLCBpbmRleCwgbGlzdCkpKSByZXR1cm4gYnJlYWtlcjtcbiAgICB9KTtcbiAgICByZXR1cm4gISFyZXN1bHQ7XG4gIH07XG5cbiAgLy8gRGV0ZXJtaW5lIGlmIGF0IGxlYXN0IG9uZSBlbGVtZW50IGluIHRoZSBvYmplY3QgbWF0Y2hlcyBhIHRydXRoIHRlc3QuXG4gIC8vIERlbGVnYXRlcyB0byAqKkVDTUFTY3JpcHQgNSoqJ3MgbmF0aXZlIGBzb21lYCBpZiBhdmFpbGFibGUuXG4gIC8vIEFsaWFzZWQgYXMgYGFueWAuXG4gIHZhciBhbnkgPSBfLnNvbWUgPSBfLmFueSA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0b3IsIGNvbnRleHQpIHtcbiAgICBpdGVyYXRvciB8fCAoaXRlcmF0b3IgPSBfLmlkZW50aXR5KTtcbiAgICB2YXIgcmVzdWx0ID0gZmFsc2U7XG4gICAgaWYgKG9iaiA9PSBudWxsKSByZXR1cm4gcmVzdWx0O1xuICAgIGlmIChuYXRpdmVTb21lICYmIG9iai5zb21lID09PSBuYXRpdmVTb21lKSByZXR1cm4gb2JqLnNvbWUoaXRlcmF0b3IsIGNvbnRleHQpO1xuICAgIGVhY2gob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGxpc3QpIHtcbiAgICAgIGlmIChyZXN1bHQgfHwgKHJlc3VsdCA9IGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgdmFsdWUsIGluZGV4LCBsaXN0KSkpIHJldHVybiBicmVha2VyO1xuICAgIH0pO1xuICAgIHJldHVybiAhIXJlc3VsdDtcbiAgfTtcblxuICAvLyBEZXRlcm1pbmUgaWYgdGhlIGFycmF5IG9yIG9iamVjdCBjb250YWlucyBhIGdpdmVuIHZhbHVlICh1c2luZyBgPT09YCkuXG4gIC8vIEFsaWFzZWQgYXMgYGluY2x1ZGVgLlxuICBfLmNvbnRhaW5zID0gXy5pbmNsdWRlID0gZnVuY3Rpb24ob2JqLCB0YXJnZXQpIHtcbiAgICBpZiAob2JqID09IG51bGwpIHJldHVybiBmYWxzZTtcbiAgICBpZiAobmF0aXZlSW5kZXhPZiAmJiBvYmouaW5kZXhPZiA9PT0gbmF0aXZlSW5kZXhPZikgcmV0dXJuIG9iai5pbmRleE9mKHRhcmdldCkgIT0gLTE7XG4gICAgcmV0dXJuIGFueShvYmosIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICByZXR1cm4gdmFsdWUgPT09IHRhcmdldDtcbiAgICB9KTtcbiAgfTtcblxuICAvLyBJbnZva2UgYSBtZXRob2QgKHdpdGggYXJndW1lbnRzKSBvbiBldmVyeSBpdGVtIGluIGEgY29sbGVjdGlvbi5cbiAgXy5pbnZva2UgPSBmdW5jdGlvbihvYmosIG1ldGhvZCkge1xuICAgIHZhciBhcmdzID0gc2xpY2UuY2FsbChhcmd1bWVudHMsIDIpO1xuICAgIHZhciBpc0Z1bmMgPSBfLmlzRnVuY3Rpb24obWV0aG9kKTtcbiAgICByZXR1cm4gXy5tYXAob2JqLCBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgcmV0dXJuIChpc0Z1bmMgPyBtZXRob2QgOiB2YWx1ZVttZXRob2RdKS5hcHBseSh2YWx1ZSwgYXJncyk7XG4gICAgfSk7XG4gIH07XG5cbiAgLy8gQ29udmVuaWVuY2UgdmVyc2lvbiBvZiBhIGNvbW1vbiB1c2UgY2FzZSBvZiBgbWFwYDogZmV0Y2hpbmcgYSBwcm9wZXJ0eS5cbiAgXy5wbHVjayA9IGZ1bmN0aW9uKG9iaiwga2V5KSB7XG4gICAgcmV0dXJuIF8ubWFwKG9iaiwgZnVuY3Rpb24odmFsdWUpeyByZXR1cm4gdmFsdWVba2V5XTsgfSk7XG4gIH07XG5cbiAgLy8gQ29udmVuaWVuY2UgdmVyc2lvbiBvZiBhIGNvbW1vbiB1c2UgY2FzZSBvZiBgZmlsdGVyYDogc2VsZWN0aW5nIG9ubHkgb2JqZWN0c1xuICAvLyBjb250YWluaW5nIHNwZWNpZmljIGBrZXk6dmFsdWVgIHBhaXJzLlxuICBfLndoZXJlID0gZnVuY3Rpb24ob2JqLCBhdHRycywgZmlyc3QpIHtcbiAgICBpZiAoXy5pc0VtcHR5KGF0dHJzKSkgcmV0dXJuIGZpcnN0ID8gdm9pZCAwIDogW107XG4gICAgcmV0dXJuIF9bZmlyc3QgPyAnZmluZCcgOiAnZmlsdGVyJ10ob2JqLCBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgZm9yICh2YXIga2V5IGluIGF0dHJzKSB7XG4gICAgICAgIGlmIChhdHRyc1trZXldICE9PSB2YWx1ZVtrZXldKSByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9KTtcbiAgfTtcblxuICAvLyBDb252ZW5pZW5jZSB2ZXJzaW9uIG9mIGEgY29tbW9uIHVzZSBjYXNlIG9mIGBmaW5kYDogZ2V0dGluZyB0aGUgZmlyc3Qgb2JqZWN0XG4gIC8vIGNvbnRhaW5pbmcgc3BlY2lmaWMgYGtleTp2YWx1ZWAgcGFpcnMuXG4gIF8uZmluZFdoZXJlID0gZnVuY3Rpb24ob2JqLCBhdHRycykge1xuICAgIHJldHVybiBfLndoZXJlKG9iaiwgYXR0cnMsIHRydWUpO1xuICB9O1xuXG4gIC8vIFJldHVybiB0aGUgbWF4aW11bSBlbGVtZW50IG9yIChlbGVtZW50LWJhc2VkIGNvbXB1dGF0aW9uKS5cbiAgLy8gQ2FuJ3Qgb3B0aW1pemUgYXJyYXlzIG9mIGludGVnZXJzIGxvbmdlciB0aGFuIDY1LDUzNSBlbGVtZW50cy5cbiAgLy8gU2VlIFtXZWJLaXQgQnVnIDgwNzk3XShodHRwczovL2J1Z3Mud2Via2l0Lm9yZy9zaG93X2J1Zy5jZ2k/aWQ9ODA3OTcpXG4gIF8ubWF4ID0gZnVuY3Rpb24ob2JqLCBpdGVyYXRvciwgY29udGV4dCkge1xuICAgIGlmICghaXRlcmF0b3IgJiYgXy5pc0FycmF5KG9iaikgJiYgb2JqWzBdID09PSArb2JqWzBdICYmIG9iai5sZW5ndGggPCA2NTUzNSkge1xuICAgICAgcmV0dXJuIE1hdGgubWF4LmFwcGx5KE1hdGgsIG9iaik7XG4gICAgfVxuICAgIGlmICghaXRlcmF0b3IgJiYgXy5pc0VtcHR5KG9iaikpIHJldHVybiAtSW5maW5pdHk7XG4gICAgdmFyIHJlc3VsdCA9IHtjb21wdXRlZCA6IC1JbmZpbml0eSwgdmFsdWU6IC1JbmZpbml0eX07XG4gICAgZWFjaChvYmosIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCwgbGlzdCkge1xuICAgICAgdmFyIGNvbXB1dGVkID0gaXRlcmF0b3IgPyBpdGVyYXRvci5jYWxsKGNvbnRleHQsIHZhbHVlLCBpbmRleCwgbGlzdCkgOiB2YWx1ZTtcbiAgICAgIGNvbXB1dGVkID4gcmVzdWx0LmNvbXB1dGVkICYmIChyZXN1bHQgPSB7dmFsdWUgOiB2YWx1ZSwgY29tcHV0ZWQgOiBjb21wdXRlZH0pO1xuICAgIH0pO1xuICAgIHJldHVybiByZXN1bHQudmFsdWU7XG4gIH07XG5cbiAgLy8gUmV0dXJuIHRoZSBtaW5pbXVtIGVsZW1lbnQgKG9yIGVsZW1lbnQtYmFzZWQgY29tcHV0YXRpb24pLlxuICBfLm1pbiA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0b3IsIGNvbnRleHQpIHtcbiAgICBpZiAoIWl0ZXJhdG9yICYmIF8uaXNBcnJheShvYmopICYmIG9ialswXSA9PT0gK29ialswXSAmJiBvYmoubGVuZ3RoIDwgNjU1MzUpIHtcbiAgICAgIHJldHVybiBNYXRoLm1pbi5hcHBseShNYXRoLCBvYmopO1xuICAgIH1cbiAgICBpZiAoIWl0ZXJhdG9yICYmIF8uaXNFbXB0eShvYmopKSByZXR1cm4gSW5maW5pdHk7XG4gICAgdmFyIHJlc3VsdCA9IHtjb21wdXRlZCA6IEluZmluaXR5LCB2YWx1ZTogSW5maW5pdHl9O1xuICAgIGVhY2gob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGxpc3QpIHtcbiAgICAgIHZhciBjb21wdXRlZCA9IGl0ZXJhdG9yID8gaXRlcmF0b3IuY2FsbChjb250ZXh0LCB2YWx1ZSwgaW5kZXgsIGxpc3QpIDogdmFsdWU7XG4gICAgICBjb21wdXRlZCA8IHJlc3VsdC5jb21wdXRlZCAmJiAocmVzdWx0ID0ge3ZhbHVlIDogdmFsdWUsIGNvbXB1dGVkIDogY29tcHV0ZWR9KTtcbiAgICB9KTtcbiAgICByZXR1cm4gcmVzdWx0LnZhbHVlO1xuICB9O1xuXG4gIC8vIFNodWZmbGUgYW4gYXJyYXksIHVzaW5nIHRoZSBtb2Rlcm4gdmVyc2lvbiBvZiB0aGUgXG4gIC8vIFtGaXNoZXItWWF0ZXMgc2h1ZmZsZV0oaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9GaXNoZXLigJNZYXRlc19zaHVmZmxlKS5cbiAgXy5zaHVmZmxlID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIHJhbmQ7XG4gICAgdmFyIGluZGV4ID0gMDtcbiAgICB2YXIgc2h1ZmZsZWQgPSBbXTtcbiAgICBlYWNoKG9iaiwgZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgIHJhbmQgPSBfLnJhbmRvbShpbmRleCsrKTtcbiAgICAgIHNodWZmbGVkW2luZGV4IC0gMV0gPSBzaHVmZmxlZFtyYW5kXTtcbiAgICAgIHNodWZmbGVkW3JhbmRdID0gdmFsdWU7XG4gICAgfSk7XG4gICAgcmV0dXJuIHNodWZmbGVkO1xuICB9O1xuXG4gIC8vIFNhbXBsZSAqKm4qKiByYW5kb20gdmFsdWVzIGZyb20gYW4gYXJyYXkuXG4gIC8vIElmICoqbioqIGlzIG5vdCBzcGVjaWZpZWQsIHJldHVybnMgYSBzaW5nbGUgcmFuZG9tIGVsZW1lbnQgZnJvbSB0aGUgYXJyYXkuXG4gIC8vIFRoZSBpbnRlcm5hbCBgZ3VhcmRgIGFyZ3VtZW50IGFsbG93cyBpdCB0byB3b3JrIHdpdGggYG1hcGAuXG4gIF8uc2FtcGxlID0gZnVuY3Rpb24ob2JqLCBuLCBndWFyZCkge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoIDwgMiB8fCBndWFyZCkge1xuICAgICAgcmV0dXJuIG9ialtfLnJhbmRvbShvYmoubGVuZ3RoIC0gMSldO1xuICAgIH1cbiAgICByZXR1cm4gXy5zaHVmZmxlKG9iaikuc2xpY2UoMCwgTWF0aC5tYXgoMCwgbikpO1xuICB9O1xuXG4gIC8vIEFuIGludGVybmFsIGZ1bmN0aW9uIHRvIGdlbmVyYXRlIGxvb2t1cCBpdGVyYXRvcnMuXG4gIHZhciBsb29rdXBJdGVyYXRvciA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgcmV0dXJuIF8uaXNGdW5jdGlvbih2YWx1ZSkgPyB2YWx1ZSA6IGZ1bmN0aW9uKG9iail7IHJldHVybiBvYmpbdmFsdWVdOyB9O1xuICB9O1xuXG4gIC8vIFNvcnQgdGhlIG9iamVjdCdzIHZhbHVlcyBieSBhIGNyaXRlcmlvbiBwcm9kdWNlZCBieSBhbiBpdGVyYXRvci5cbiAgXy5zb3J0QnkgPSBmdW5jdGlvbihvYmosIHZhbHVlLCBjb250ZXh0KSB7XG4gICAgdmFyIGl0ZXJhdG9yID0gbG9va3VwSXRlcmF0b3IodmFsdWUpO1xuICAgIHJldHVybiBfLnBsdWNrKF8ubWFwKG9iaiwgZnVuY3Rpb24odmFsdWUsIGluZGV4LCBsaXN0KSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB2YWx1ZTogdmFsdWUsXG4gICAgICAgIGluZGV4OiBpbmRleCxcbiAgICAgICAgY3JpdGVyaWE6IGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgdmFsdWUsIGluZGV4LCBsaXN0KVxuICAgICAgfTtcbiAgICB9KS5zb3J0KGZ1bmN0aW9uKGxlZnQsIHJpZ2h0KSB7XG4gICAgICB2YXIgYSA9IGxlZnQuY3JpdGVyaWE7XG4gICAgICB2YXIgYiA9IHJpZ2h0LmNyaXRlcmlhO1xuICAgICAgaWYgKGEgIT09IGIpIHtcbiAgICAgICAgaWYgKGEgPiBiIHx8IGEgPT09IHZvaWQgMCkgcmV0dXJuIDE7XG4gICAgICAgIGlmIChhIDwgYiB8fCBiID09PSB2b2lkIDApIHJldHVybiAtMTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBsZWZ0LmluZGV4IC0gcmlnaHQuaW5kZXg7XG4gICAgfSksICd2YWx1ZScpO1xuICB9O1xuXG4gIC8vIEFuIGludGVybmFsIGZ1bmN0aW9uIHVzZWQgZm9yIGFnZ3JlZ2F0ZSBcImdyb3VwIGJ5XCIgb3BlcmF0aW9ucy5cbiAgdmFyIGdyb3VwID0gZnVuY3Rpb24oYmVoYXZpb3IpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24ob2JqLCB2YWx1ZSwgY29udGV4dCkge1xuICAgICAgdmFyIHJlc3VsdCA9IHt9O1xuICAgICAgdmFyIGl0ZXJhdG9yID0gdmFsdWUgPT0gbnVsbCA/IF8uaWRlbnRpdHkgOiBsb29rdXBJdGVyYXRvcih2YWx1ZSk7XG4gICAgICBlYWNoKG9iaiwgZnVuY3Rpb24odmFsdWUsIGluZGV4KSB7XG4gICAgICAgIHZhciBrZXkgPSBpdGVyYXRvci5jYWxsKGNvbnRleHQsIHZhbHVlLCBpbmRleCwgb2JqKTtcbiAgICAgICAgYmVoYXZpb3IocmVzdWx0LCBrZXksIHZhbHVlKTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9O1xuICB9O1xuXG4gIC8vIEdyb3VwcyB0aGUgb2JqZWN0J3MgdmFsdWVzIGJ5IGEgY3JpdGVyaW9uLiBQYXNzIGVpdGhlciBhIHN0cmluZyBhdHRyaWJ1dGVcbiAgLy8gdG8gZ3JvdXAgYnksIG9yIGEgZnVuY3Rpb24gdGhhdCByZXR1cm5zIHRoZSBjcml0ZXJpb24uXG4gIF8uZ3JvdXBCeSA9IGdyb3VwKGZ1bmN0aW9uKHJlc3VsdCwga2V5LCB2YWx1ZSkge1xuICAgIChfLmhhcyhyZXN1bHQsIGtleSkgPyByZXN1bHRba2V5XSA6IChyZXN1bHRba2V5XSA9IFtdKSkucHVzaCh2YWx1ZSk7XG4gIH0pO1xuXG4gIC8vIEluZGV4ZXMgdGhlIG9iamVjdCdzIHZhbHVlcyBieSBhIGNyaXRlcmlvbiwgc2ltaWxhciB0byBgZ3JvdXBCeWAsIGJ1dCBmb3JcbiAgLy8gd2hlbiB5b3Uga25vdyB0aGF0IHlvdXIgaW5kZXggdmFsdWVzIHdpbGwgYmUgdW5pcXVlLlxuICBfLmluZGV4QnkgPSBncm91cChmdW5jdGlvbihyZXN1bHQsIGtleSwgdmFsdWUpIHtcbiAgICByZXN1bHRba2V5XSA9IHZhbHVlO1xuICB9KTtcblxuICAvLyBDb3VudHMgaW5zdGFuY2VzIG9mIGFuIG9iamVjdCB0aGF0IGdyb3VwIGJ5IGEgY2VydGFpbiBjcml0ZXJpb24uIFBhc3NcbiAgLy8gZWl0aGVyIGEgc3RyaW5nIGF0dHJpYnV0ZSB0byBjb3VudCBieSwgb3IgYSBmdW5jdGlvbiB0aGF0IHJldHVybnMgdGhlXG4gIC8vIGNyaXRlcmlvbi5cbiAgXy5jb3VudEJ5ID0gZ3JvdXAoZnVuY3Rpb24ocmVzdWx0LCBrZXkpIHtcbiAgICBfLmhhcyhyZXN1bHQsIGtleSkgPyByZXN1bHRba2V5XSsrIDogcmVzdWx0W2tleV0gPSAxO1xuICB9KTtcblxuICAvLyBVc2UgYSBjb21wYXJhdG9yIGZ1bmN0aW9uIHRvIGZpZ3VyZSBvdXQgdGhlIHNtYWxsZXN0IGluZGV4IGF0IHdoaWNoXG4gIC8vIGFuIG9iamVjdCBzaG91bGQgYmUgaW5zZXJ0ZWQgc28gYXMgdG8gbWFpbnRhaW4gb3JkZXIuIFVzZXMgYmluYXJ5IHNlYXJjaC5cbiAgXy5zb3J0ZWRJbmRleCA9IGZ1bmN0aW9uKGFycmF5LCBvYmosIGl0ZXJhdG9yLCBjb250ZXh0KSB7XG4gICAgaXRlcmF0b3IgPSBpdGVyYXRvciA9PSBudWxsID8gXy5pZGVudGl0eSA6IGxvb2t1cEl0ZXJhdG9yKGl0ZXJhdG9yKTtcbiAgICB2YXIgdmFsdWUgPSBpdGVyYXRvci5jYWxsKGNvbnRleHQsIG9iaik7XG4gICAgdmFyIGxvdyA9IDAsIGhpZ2ggPSBhcnJheS5sZW5ndGg7XG4gICAgd2hpbGUgKGxvdyA8IGhpZ2gpIHtcbiAgICAgIHZhciBtaWQgPSAobG93ICsgaGlnaCkgPj4+IDE7XG4gICAgICBpdGVyYXRvci5jYWxsKGNvbnRleHQsIGFycmF5W21pZF0pIDwgdmFsdWUgPyBsb3cgPSBtaWQgKyAxIDogaGlnaCA9IG1pZDtcbiAgICB9XG4gICAgcmV0dXJuIGxvdztcbiAgfTtcblxuICAvLyBTYWZlbHkgY3JlYXRlIGEgcmVhbCwgbGl2ZSBhcnJheSBmcm9tIGFueXRoaW5nIGl0ZXJhYmxlLlxuICBfLnRvQXJyYXkgPSBmdW5jdGlvbihvYmopIHtcbiAgICBpZiAoIW9iaikgcmV0dXJuIFtdO1xuICAgIGlmIChfLmlzQXJyYXkob2JqKSkgcmV0dXJuIHNsaWNlLmNhbGwob2JqKTtcbiAgICBpZiAob2JqLmxlbmd0aCA9PT0gK29iai5sZW5ndGgpIHJldHVybiBfLm1hcChvYmosIF8uaWRlbnRpdHkpO1xuICAgIHJldHVybiBfLnZhbHVlcyhvYmopO1xuICB9O1xuXG4gIC8vIFJldHVybiB0aGUgbnVtYmVyIG9mIGVsZW1lbnRzIGluIGFuIG9iamVjdC5cbiAgXy5zaXplID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgaWYgKG9iaiA9PSBudWxsKSByZXR1cm4gMDtcbiAgICByZXR1cm4gKG9iai5sZW5ndGggPT09ICtvYmoubGVuZ3RoKSA/IG9iai5sZW5ndGggOiBfLmtleXMob2JqKS5sZW5ndGg7XG4gIH07XG5cbiAgLy8gQXJyYXkgRnVuY3Rpb25zXG4gIC8vIC0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIEdldCB0aGUgZmlyc3QgZWxlbWVudCBvZiBhbiBhcnJheS4gUGFzc2luZyAqKm4qKiB3aWxsIHJldHVybiB0aGUgZmlyc3QgTlxuICAvLyB2YWx1ZXMgaW4gdGhlIGFycmF5LiBBbGlhc2VkIGFzIGBoZWFkYCBhbmQgYHRha2VgLiBUaGUgKipndWFyZCoqIGNoZWNrXG4gIC8vIGFsbG93cyBpdCB0byB3b3JrIHdpdGggYF8ubWFwYC5cbiAgXy5maXJzdCA9IF8uaGVhZCA9IF8udGFrZSA9IGZ1bmN0aW9uKGFycmF5LCBuLCBndWFyZCkge1xuICAgIGlmIChhcnJheSA9PSBudWxsKSByZXR1cm4gdm9pZCAwO1xuICAgIHJldHVybiAobiA9PSBudWxsKSB8fCBndWFyZCA/IGFycmF5WzBdIDogc2xpY2UuY2FsbChhcnJheSwgMCwgbik7XG4gIH07XG5cbiAgLy8gUmV0dXJucyBldmVyeXRoaW5nIGJ1dCB0aGUgbGFzdCBlbnRyeSBvZiB0aGUgYXJyYXkuIEVzcGVjaWFsbHkgdXNlZnVsIG9uXG4gIC8vIHRoZSBhcmd1bWVudHMgb2JqZWN0LiBQYXNzaW5nICoqbioqIHdpbGwgcmV0dXJuIGFsbCB0aGUgdmFsdWVzIGluXG4gIC8vIHRoZSBhcnJheSwgZXhjbHVkaW5nIHRoZSBsYXN0IE4uIFRoZSAqKmd1YXJkKiogY2hlY2sgYWxsb3dzIGl0IHRvIHdvcmsgd2l0aFxuICAvLyBgXy5tYXBgLlxuICBfLmluaXRpYWwgPSBmdW5jdGlvbihhcnJheSwgbiwgZ3VhcmQpIHtcbiAgICByZXR1cm4gc2xpY2UuY2FsbChhcnJheSwgMCwgYXJyYXkubGVuZ3RoIC0gKChuID09IG51bGwpIHx8IGd1YXJkID8gMSA6IG4pKTtcbiAgfTtcblxuICAvLyBHZXQgdGhlIGxhc3QgZWxlbWVudCBvZiBhbiBhcnJheS4gUGFzc2luZyAqKm4qKiB3aWxsIHJldHVybiB0aGUgbGFzdCBOXG4gIC8vIHZhbHVlcyBpbiB0aGUgYXJyYXkuIFRoZSAqKmd1YXJkKiogY2hlY2sgYWxsb3dzIGl0IHRvIHdvcmsgd2l0aCBgXy5tYXBgLlxuICBfLmxhc3QgPSBmdW5jdGlvbihhcnJheSwgbiwgZ3VhcmQpIHtcbiAgICBpZiAoYXJyYXkgPT0gbnVsbCkgcmV0dXJuIHZvaWQgMDtcbiAgICBpZiAoKG4gPT0gbnVsbCkgfHwgZ3VhcmQpIHtcbiAgICAgIHJldHVybiBhcnJheVthcnJheS5sZW5ndGggLSAxXTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHNsaWNlLmNhbGwoYXJyYXksIE1hdGgubWF4KGFycmF5Lmxlbmd0aCAtIG4sIDApKTtcbiAgICB9XG4gIH07XG5cbiAgLy8gUmV0dXJucyBldmVyeXRoaW5nIGJ1dCB0aGUgZmlyc3QgZW50cnkgb2YgdGhlIGFycmF5LiBBbGlhc2VkIGFzIGB0YWlsYCBhbmQgYGRyb3BgLlxuICAvLyBFc3BlY2lhbGx5IHVzZWZ1bCBvbiB0aGUgYXJndW1lbnRzIG9iamVjdC4gUGFzc2luZyBhbiAqKm4qKiB3aWxsIHJldHVyblxuICAvLyB0aGUgcmVzdCBOIHZhbHVlcyBpbiB0aGUgYXJyYXkuIFRoZSAqKmd1YXJkKipcbiAgLy8gY2hlY2sgYWxsb3dzIGl0IHRvIHdvcmsgd2l0aCBgXy5tYXBgLlxuICBfLnJlc3QgPSBfLnRhaWwgPSBfLmRyb3AgPSBmdW5jdGlvbihhcnJheSwgbiwgZ3VhcmQpIHtcbiAgICByZXR1cm4gc2xpY2UuY2FsbChhcnJheSwgKG4gPT0gbnVsbCkgfHwgZ3VhcmQgPyAxIDogbik7XG4gIH07XG5cbiAgLy8gVHJpbSBvdXQgYWxsIGZhbHN5IHZhbHVlcyBmcm9tIGFuIGFycmF5LlxuICBfLmNvbXBhY3QgPSBmdW5jdGlvbihhcnJheSkge1xuICAgIHJldHVybiBfLmZpbHRlcihhcnJheSwgXy5pZGVudGl0eSk7XG4gIH07XG5cbiAgLy8gSW50ZXJuYWwgaW1wbGVtZW50YXRpb24gb2YgYSByZWN1cnNpdmUgYGZsYXR0ZW5gIGZ1bmN0aW9uLlxuICB2YXIgZmxhdHRlbiA9IGZ1bmN0aW9uKGlucHV0LCBzaGFsbG93LCBvdXRwdXQpIHtcbiAgICBpZiAoc2hhbGxvdyAmJiBfLmV2ZXJ5KGlucHV0LCBfLmlzQXJyYXkpKSB7XG4gICAgICByZXR1cm4gY29uY2F0LmFwcGx5KG91dHB1dCwgaW5wdXQpO1xuICAgIH1cbiAgICBlYWNoKGlucHV0LCBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgaWYgKF8uaXNBcnJheSh2YWx1ZSkgfHwgXy5pc0FyZ3VtZW50cyh2YWx1ZSkpIHtcbiAgICAgICAgc2hhbGxvdyA/IHB1c2guYXBwbHkob3V0cHV0LCB2YWx1ZSkgOiBmbGF0dGVuKHZhbHVlLCBzaGFsbG93LCBvdXRwdXQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgb3V0cHV0LnB1c2godmFsdWUpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBvdXRwdXQ7XG4gIH07XG5cbiAgLy8gRmxhdHRlbiBvdXQgYW4gYXJyYXksIGVpdGhlciByZWN1cnNpdmVseSAoYnkgZGVmYXVsdCksIG9yIGp1c3Qgb25lIGxldmVsLlxuICBfLmZsYXR0ZW4gPSBmdW5jdGlvbihhcnJheSwgc2hhbGxvdykge1xuICAgIHJldHVybiBmbGF0dGVuKGFycmF5LCBzaGFsbG93LCBbXSk7XG4gIH07XG5cbiAgLy8gUmV0dXJuIGEgdmVyc2lvbiBvZiB0aGUgYXJyYXkgdGhhdCBkb2VzIG5vdCBjb250YWluIHRoZSBzcGVjaWZpZWQgdmFsdWUocykuXG4gIF8ud2l0aG91dCA9IGZ1bmN0aW9uKGFycmF5KSB7XG4gICAgcmV0dXJuIF8uZGlmZmVyZW5jZShhcnJheSwgc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpKTtcbiAgfTtcblxuICAvLyBQcm9kdWNlIGEgZHVwbGljYXRlLWZyZWUgdmVyc2lvbiBvZiB0aGUgYXJyYXkuIElmIHRoZSBhcnJheSBoYXMgYWxyZWFkeVxuICAvLyBiZWVuIHNvcnRlZCwgeW91IGhhdmUgdGhlIG9wdGlvbiBvZiB1c2luZyBhIGZhc3RlciBhbGdvcml0aG0uXG4gIC8vIEFsaWFzZWQgYXMgYHVuaXF1ZWAuXG4gIF8udW5pcSA9IF8udW5pcXVlID0gZnVuY3Rpb24oYXJyYXksIGlzU29ydGVkLCBpdGVyYXRvciwgY29udGV4dCkge1xuICAgIGlmIChfLmlzRnVuY3Rpb24oaXNTb3J0ZWQpKSB7XG4gICAgICBjb250ZXh0ID0gaXRlcmF0b3I7XG4gICAgICBpdGVyYXRvciA9IGlzU29ydGVkO1xuICAgICAgaXNTb3J0ZWQgPSBmYWxzZTtcbiAgICB9XG4gICAgdmFyIGluaXRpYWwgPSBpdGVyYXRvciA/IF8ubWFwKGFycmF5LCBpdGVyYXRvciwgY29udGV4dCkgOiBhcnJheTtcbiAgICB2YXIgcmVzdWx0cyA9IFtdO1xuICAgIHZhciBzZWVuID0gW107XG4gICAgZWFjaChpbml0aWFsLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgpIHtcbiAgICAgIGlmIChpc1NvcnRlZCA/ICghaW5kZXggfHwgc2VlbltzZWVuLmxlbmd0aCAtIDFdICE9PSB2YWx1ZSkgOiAhXy5jb250YWlucyhzZWVuLCB2YWx1ZSkpIHtcbiAgICAgICAgc2Vlbi5wdXNoKHZhbHVlKTtcbiAgICAgICAgcmVzdWx0cy5wdXNoKGFycmF5W2luZGV4XSk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3VsdHM7XG4gIH07XG5cbiAgLy8gUHJvZHVjZSBhbiBhcnJheSB0aGF0IGNvbnRhaW5zIHRoZSB1bmlvbjogZWFjaCBkaXN0aW5jdCBlbGVtZW50IGZyb20gYWxsIG9mXG4gIC8vIHRoZSBwYXNzZWQtaW4gYXJyYXlzLlxuICBfLnVuaW9uID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIF8udW5pcShfLmZsYXR0ZW4oYXJndW1lbnRzLCB0cnVlKSk7XG4gIH07XG5cbiAgLy8gUHJvZHVjZSBhbiBhcnJheSB0aGF0IGNvbnRhaW5zIGV2ZXJ5IGl0ZW0gc2hhcmVkIGJldHdlZW4gYWxsIHRoZVxuICAvLyBwYXNzZWQtaW4gYXJyYXlzLlxuICBfLmludGVyc2VjdGlvbiA9IGZ1bmN0aW9uKGFycmF5KSB7XG4gICAgdmFyIHJlc3QgPSBzbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgcmV0dXJuIF8uZmlsdGVyKF8udW5pcShhcnJheSksIGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgIHJldHVybiBfLmV2ZXJ5KHJlc3QsIGZ1bmN0aW9uKG90aGVyKSB7XG4gICAgICAgIHJldHVybiBfLmluZGV4T2Yob3RoZXIsIGl0ZW0pID49IDA7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfTtcblxuICAvLyBUYWtlIHRoZSBkaWZmZXJlbmNlIGJldHdlZW4gb25lIGFycmF5IGFuZCBhIG51bWJlciBvZiBvdGhlciBhcnJheXMuXG4gIC8vIE9ubHkgdGhlIGVsZW1lbnRzIHByZXNlbnQgaW4ganVzdCB0aGUgZmlyc3QgYXJyYXkgd2lsbCByZW1haW4uXG4gIF8uZGlmZmVyZW5jZSA9IGZ1bmN0aW9uKGFycmF5KSB7XG4gICAgdmFyIHJlc3QgPSBjb25jYXQuYXBwbHkoQXJyYXlQcm90bywgc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpKTtcbiAgICByZXR1cm4gXy5maWx0ZXIoYXJyYXksIGZ1bmN0aW9uKHZhbHVlKXsgcmV0dXJuICFfLmNvbnRhaW5zKHJlc3QsIHZhbHVlKTsgfSk7XG4gIH07XG5cbiAgLy8gWmlwIHRvZ2V0aGVyIG11bHRpcGxlIGxpc3RzIGludG8gYSBzaW5nbGUgYXJyYXkgLS0gZWxlbWVudHMgdGhhdCBzaGFyZVxuICAvLyBhbiBpbmRleCBnbyB0b2dldGhlci5cbiAgXy56aXAgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgbGVuZ3RoID0gXy5tYXgoXy5wbHVjayhhcmd1bWVudHMsIFwibGVuZ3RoXCIpLmNvbmNhdCgwKSk7XG4gICAgdmFyIHJlc3VsdHMgPSBuZXcgQXJyYXkobGVuZ3RoKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICByZXN1bHRzW2ldID0gXy5wbHVjayhhcmd1bWVudHMsICcnICsgaSk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHRzO1xuICB9O1xuXG4gIC8vIENvbnZlcnRzIGxpc3RzIGludG8gb2JqZWN0cy4gUGFzcyBlaXRoZXIgYSBzaW5nbGUgYXJyYXkgb2YgYFtrZXksIHZhbHVlXWBcbiAgLy8gcGFpcnMsIG9yIHR3byBwYXJhbGxlbCBhcnJheXMgb2YgdGhlIHNhbWUgbGVuZ3RoIC0tIG9uZSBvZiBrZXlzLCBhbmQgb25lIG9mXG4gIC8vIHRoZSBjb3JyZXNwb25kaW5nIHZhbHVlcy5cbiAgXy5vYmplY3QgPSBmdW5jdGlvbihsaXN0LCB2YWx1ZXMpIHtcbiAgICBpZiAobGlzdCA9PSBudWxsKSByZXR1cm4ge307XG4gICAgdmFyIHJlc3VsdCA9IHt9O1xuICAgIGZvciAodmFyIGkgPSAwLCBsZW5ndGggPSBsaXN0Lmxlbmd0aDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAodmFsdWVzKSB7XG4gICAgICAgIHJlc3VsdFtsaXN0W2ldXSA9IHZhbHVlc1tpXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlc3VsdFtsaXN0W2ldWzBdXSA9IGxpc3RbaV1bMV07XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG5cbiAgLy8gSWYgdGhlIGJyb3dzZXIgZG9lc24ndCBzdXBwbHkgdXMgd2l0aCBpbmRleE9mIChJJ20gbG9va2luZyBhdCB5b3UsICoqTVNJRSoqKSxcbiAgLy8gd2UgbmVlZCB0aGlzIGZ1bmN0aW9uLiBSZXR1cm4gdGhlIHBvc2l0aW9uIG9mIHRoZSBmaXJzdCBvY2N1cnJlbmNlIG9mIGFuXG4gIC8vIGl0ZW0gaW4gYW4gYXJyYXksIG9yIC0xIGlmIHRoZSBpdGVtIGlzIG5vdCBpbmNsdWRlZCBpbiB0aGUgYXJyYXkuXG4gIC8vIERlbGVnYXRlcyB0byAqKkVDTUFTY3JpcHQgNSoqJ3MgbmF0aXZlIGBpbmRleE9mYCBpZiBhdmFpbGFibGUuXG4gIC8vIElmIHRoZSBhcnJheSBpcyBsYXJnZSBhbmQgYWxyZWFkeSBpbiBzb3J0IG9yZGVyLCBwYXNzIGB0cnVlYFxuICAvLyBmb3IgKippc1NvcnRlZCoqIHRvIHVzZSBiaW5hcnkgc2VhcmNoLlxuICBfLmluZGV4T2YgPSBmdW5jdGlvbihhcnJheSwgaXRlbSwgaXNTb3J0ZWQpIHtcbiAgICBpZiAoYXJyYXkgPT0gbnVsbCkgcmV0dXJuIC0xO1xuICAgIHZhciBpID0gMCwgbGVuZ3RoID0gYXJyYXkubGVuZ3RoO1xuICAgIGlmIChpc1NvcnRlZCkge1xuICAgICAgaWYgKHR5cGVvZiBpc1NvcnRlZCA9PSAnbnVtYmVyJykge1xuICAgICAgICBpID0gKGlzU29ydGVkIDwgMCA/IE1hdGgubWF4KDAsIGxlbmd0aCArIGlzU29ydGVkKSA6IGlzU29ydGVkKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGkgPSBfLnNvcnRlZEluZGV4KGFycmF5LCBpdGVtKTtcbiAgICAgICAgcmV0dXJuIGFycmF5W2ldID09PSBpdGVtID8gaSA6IC0xO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAobmF0aXZlSW5kZXhPZiAmJiBhcnJheS5pbmRleE9mID09PSBuYXRpdmVJbmRleE9mKSByZXR1cm4gYXJyYXkuaW5kZXhPZihpdGVtLCBpc1NvcnRlZCk7XG4gICAgZm9yICg7IGkgPCBsZW5ndGg7IGkrKykgaWYgKGFycmF5W2ldID09PSBpdGVtKSByZXR1cm4gaTtcbiAgICByZXR1cm4gLTE7XG4gIH07XG5cbiAgLy8gRGVsZWdhdGVzIHRvICoqRUNNQVNjcmlwdCA1KioncyBuYXRpdmUgYGxhc3RJbmRleE9mYCBpZiBhdmFpbGFibGUuXG4gIF8ubGFzdEluZGV4T2YgPSBmdW5jdGlvbihhcnJheSwgaXRlbSwgZnJvbSkge1xuICAgIGlmIChhcnJheSA9PSBudWxsKSByZXR1cm4gLTE7XG4gICAgdmFyIGhhc0luZGV4ID0gZnJvbSAhPSBudWxsO1xuICAgIGlmIChuYXRpdmVMYXN0SW5kZXhPZiAmJiBhcnJheS5sYXN0SW5kZXhPZiA9PT0gbmF0aXZlTGFzdEluZGV4T2YpIHtcbiAgICAgIHJldHVybiBoYXNJbmRleCA/IGFycmF5Lmxhc3RJbmRleE9mKGl0ZW0sIGZyb20pIDogYXJyYXkubGFzdEluZGV4T2YoaXRlbSk7XG4gICAgfVxuICAgIHZhciBpID0gKGhhc0luZGV4ID8gZnJvbSA6IGFycmF5Lmxlbmd0aCk7XG4gICAgd2hpbGUgKGktLSkgaWYgKGFycmF5W2ldID09PSBpdGVtKSByZXR1cm4gaTtcbiAgICByZXR1cm4gLTE7XG4gIH07XG5cbiAgLy8gR2VuZXJhdGUgYW4gaW50ZWdlciBBcnJheSBjb250YWluaW5nIGFuIGFyaXRobWV0aWMgcHJvZ3Jlc3Npb24uIEEgcG9ydCBvZlxuICAvLyB0aGUgbmF0aXZlIFB5dGhvbiBgcmFuZ2UoKWAgZnVuY3Rpb24uIFNlZVxuICAvLyBbdGhlIFB5dGhvbiBkb2N1bWVudGF0aW9uXShodHRwOi8vZG9jcy5weXRob24ub3JnL2xpYnJhcnkvZnVuY3Rpb25zLmh0bWwjcmFuZ2UpLlxuICBfLnJhbmdlID0gZnVuY3Rpb24oc3RhcnQsIHN0b3AsIHN0ZXApIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA8PSAxKSB7XG4gICAgICBzdG9wID0gc3RhcnQgfHwgMDtcbiAgICAgIHN0YXJ0ID0gMDtcbiAgICB9XG4gICAgc3RlcCA9IGFyZ3VtZW50c1syXSB8fCAxO1xuXG4gICAgdmFyIGxlbmd0aCA9IE1hdGgubWF4KE1hdGguY2VpbCgoc3RvcCAtIHN0YXJ0KSAvIHN0ZXApLCAwKTtcbiAgICB2YXIgaWR4ID0gMDtcbiAgICB2YXIgcmFuZ2UgPSBuZXcgQXJyYXkobGVuZ3RoKTtcblxuICAgIHdoaWxlKGlkeCA8IGxlbmd0aCkge1xuICAgICAgcmFuZ2VbaWR4KytdID0gc3RhcnQ7XG4gICAgICBzdGFydCArPSBzdGVwO1xuICAgIH1cblxuICAgIHJldHVybiByYW5nZTtcbiAgfTtcblxuICAvLyBGdW5jdGlvbiAoYWhlbSkgRnVuY3Rpb25zXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIFJldXNhYmxlIGNvbnN0cnVjdG9yIGZ1bmN0aW9uIGZvciBwcm90b3R5cGUgc2V0dGluZy5cbiAgdmFyIGN0b3IgPSBmdW5jdGlvbigpe307XG5cbiAgLy8gQ3JlYXRlIGEgZnVuY3Rpb24gYm91bmQgdG8gYSBnaXZlbiBvYmplY3QgKGFzc2lnbmluZyBgdGhpc2AsIGFuZCBhcmd1bWVudHMsXG4gIC8vIG9wdGlvbmFsbHkpLiBEZWxlZ2F0ZXMgdG8gKipFQ01BU2NyaXB0IDUqKidzIG5hdGl2ZSBgRnVuY3Rpb24uYmluZGAgaWZcbiAgLy8gYXZhaWxhYmxlLlxuICBfLmJpbmQgPSBmdW5jdGlvbihmdW5jLCBjb250ZXh0KSB7XG4gICAgdmFyIGFyZ3MsIGJvdW5kO1xuICAgIGlmIChuYXRpdmVCaW5kICYmIGZ1bmMuYmluZCA9PT0gbmF0aXZlQmluZCkgcmV0dXJuIG5hdGl2ZUJpbmQuYXBwbHkoZnVuYywgc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpKTtcbiAgICBpZiAoIV8uaXNGdW5jdGlvbihmdW5jKSkgdGhyb3cgbmV3IFR5cGVFcnJvcjtcbiAgICBhcmdzID0gc2xpY2UuY2FsbChhcmd1bWVudHMsIDIpO1xuICAgIHJldHVybiBib3VuZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIGJvdW5kKSkgcmV0dXJuIGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncy5jb25jYXQoc2xpY2UuY2FsbChhcmd1bWVudHMpKSk7XG4gICAgICBjdG9yLnByb3RvdHlwZSA9IGZ1bmMucHJvdG90eXBlO1xuICAgICAgdmFyIHNlbGYgPSBuZXcgY3RvcjtcbiAgICAgIGN0b3IucHJvdG90eXBlID0gbnVsbDtcbiAgICAgIHZhciByZXN1bHQgPSBmdW5jLmFwcGx5KHNlbGYsIGFyZ3MuY29uY2F0KHNsaWNlLmNhbGwoYXJndW1lbnRzKSkpO1xuICAgICAgaWYgKE9iamVjdChyZXN1bHQpID09PSByZXN1bHQpIHJldHVybiByZXN1bHQ7XG4gICAgICByZXR1cm4gc2VsZjtcbiAgICB9O1xuICB9O1xuXG4gIC8vIFBhcnRpYWxseSBhcHBseSBhIGZ1bmN0aW9uIGJ5IGNyZWF0aW5nIGEgdmVyc2lvbiB0aGF0IGhhcyBoYWQgc29tZSBvZiBpdHNcbiAgLy8gYXJndW1lbnRzIHByZS1maWxsZWQsIHdpdGhvdXQgY2hhbmdpbmcgaXRzIGR5bmFtaWMgYHRoaXNgIGNvbnRleHQuXG4gIF8ucGFydGlhbCA9IGZ1bmN0aW9uKGZ1bmMpIHtcbiAgICB2YXIgYXJncyA9IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gZnVuYy5hcHBseSh0aGlzLCBhcmdzLmNvbmNhdChzbGljZS5jYWxsKGFyZ3VtZW50cykpKTtcbiAgICB9O1xuICB9O1xuXG4gIC8vIEJpbmQgYWxsIG9mIGFuIG9iamVjdCdzIG1ldGhvZHMgdG8gdGhhdCBvYmplY3QuIFVzZWZ1bCBmb3IgZW5zdXJpbmcgdGhhdFxuICAvLyBhbGwgY2FsbGJhY2tzIGRlZmluZWQgb24gYW4gb2JqZWN0IGJlbG9uZyB0byBpdC5cbiAgXy5iaW5kQWxsID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIGZ1bmNzID0gc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgIGlmIChmdW5jcy5sZW5ndGggPT09IDApIHRocm93IG5ldyBFcnJvcihcImJpbmRBbGwgbXVzdCBiZSBwYXNzZWQgZnVuY3Rpb24gbmFtZXNcIik7XG4gICAgZWFjaChmdW5jcywgZnVuY3Rpb24oZikgeyBvYmpbZl0gPSBfLmJpbmQob2JqW2ZdLCBvYmopOyB9KTtcbiAgICByZXR1cm4gb2JqO1xuICB9O1xuXG4gIC8vIE1lbW9pemUgYW4gZXhwZW5zaXZlIGZ1bmN0aW9uIGJ5IHN0b3JpbmcgaXRzIHJlc3VsdHMuXG4gIF8ubWVtb2l6ZSA9IGZ1bmN0aW9uKGZ1bmMsIGhhc2hlcikge1xuICAgIHZhciBtZW1vID0ge307XG4gICAgaGFzaGVyIHx8IChoYXNoZXIgPSBfLmlkZW50aXR5KTtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIga2V5ID0gaGFzaGVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICByZXR1cm4gXy5oYXMobWVtbywga2V5KSA/IG1lbW9ba2V5XSA6IChtZW1vW2tleV0gPSBmdW5jLmFwcGx5KHRoaXMsIGFyZ3VtZW50cykpO1xuICAgIH07XG4gIH07XG5cbiAgLy8gRGVsYXlzIGEgZnVuY3Rpb24gZm9yIHRoZSBnaXZlbiBudW1iZXIgb2YgbWlsbGlzZWNvbmRzLCBhbmQgdGhlbiBjYWxsc1xuICAvLyBpdCB3aXRoIHRoZSBhcmd1bWVudHMgc3VwcGxpZWQuXG4gIF8uZGVsYXkgPSBmdW5jdGlvbihmdW5jLCB3YWl0KSB7XG4gICAgdmFyIGFyZ3MgPSBzbGljZS5jYWxsKGFyZ3VtZW50cywgMik7XG4gICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuY3Rpb24oKXsgcmV0dXJuIGZ1bmMuYXBwbHkobnVsbCwgYXJncyk7IH0sIHdhaXQpO1xuICB9O1xuXG4gIC8vIERlZmVycyBhIGZ1bmN0aW9uLCBzY2hlZHVsaW5nIGl0IHRvIHJ1biBhZnRlciB0aGUgY3VycmVudCBjYWxsIHN0YWNrIGhhc1xuICAvLyBjbGVhcmVkLlxuICBfLmRlZmVyID0gZnVuY3Rpb24oZnVuYykge1xuICAgIHJldHVybiBfLmRlbGF5LmFwcGx5KF8sIFtmdW5jLCAxXS5jb25jYXQoc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpKSk7XG4gIH07XG5cbiAgLy8gUmV0dXJucyBhIGZ1bmN0aW9uLCB0aGF0LCB3aGVuIGludm9rZWQsIHdpbGwgb25seSBiZSB0cmlnZ2VyZWQgYXQgbW9zdCBvbmNlXG4gIC8vIGR1cmluZyBhIGdpdmVuIHdpbmRvdyBvZiB0aW1lLiBOb3JtYWxseSwgdGhlIHRocm90dGxlZCBmdW5jdGlvbiB3aWxsIHJ1blxuICAvLyBhcyBtdWNoIGFzIGl0IGNhbiwgd2l0aG91dCBldmVyIGdvaW5nIG1vcmUgdGhhbiBvbmNlIHBlciBgd2FpdGAgZHVyYXRpb247XG4gIC8vIGJ1dCBpZiB5b3UnZCBsaWtlIHRvIGRpc2FibGUgdGhlIGV4ZWN1dGlvbiBvbiB0aGUgbGVhZGluZyBlZGdlLCBwYXNzXG4gIC8vIGB7bGVhZGluZzogZmFsc2V9YC4gVG8gZGlzYWJsZSBleGVjdXRpb24gb24gdGhlIHRyYWlsaW5nIGVkZ2UsIGRpdHRvLlxuICBfLnRocm90dGxlID0gZnVuY3Rpb24oZnVuYywgd2FpdCwgb3B0aW9ucykge1xuICAgIHZhciBjb250ZXh0LCBhcmdzLCByZXN1bHQ7XG4gICAgdmFyIHRpbWVvdXQgPSBudWxsO1xuICAgIHZhciBwcmV2aW91cyA9IDA7XG4gICAgb3B0aW9ucyB8fCAob3B0aW9ucyA9IHt9KTtcbiAgICB2YXIgbGF0ZXIgPSBmdW5jdGlvbigpIHtcbiAgICAgIHByZXZpb3VzID0gb3B0aW9ucy5sZWFkaW5nID09PSBmYWxzZSA/IDAgOiBuZXcgRGF0ZTtcbiAgICAgIHRpbWVvdXQgPSBudWxsO1xuICAgICAgcmVzdWx0ID0gZnVuYy5hcHBseShjb250ZXh0LCBhcmdzKTtcbiAgICB9O1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBub3cgPSBuZXcgRGF0ZTtcbiAgICAgIGlmICghcHJldmlvdXMgJiYgb3B0aW9ucy5sZWFkaW5nID09PSBmYWxzZSkgcHJldmlvdXMgPSBub3c7XG4gICAgICB2YXIgcmVtYWluaW5nID0gd2FpdCAtIChub3cgLSBwcmV2aW91cyk7XG4gICAgICBjb250ZXh0ID0gdGhpcztcbiAgICAgIGFyZ3MgPSBhcmd1bWVudHM7XG4gICAgICBpZiAocmVtYWluaW5nIDw9IDApIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuICAgICAgICB0aW1lb3V0ID0gbnVsbDtcbiAgICAgICAgcHJldmlvdXMgPSBub3c7XG4gICAgICAgIHJlc3VsdCA9IGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncyk7XG4gICAgICB9IGVsc2UgaWYgKCF0aW1lb3V0ICYmIG9wdGlvbnMudHJhaWxpbmcgIT09IGZhbHNlKSB7XG4gICAgICAgIHRpbWVvdXQgPSBzZXRUaW1lb3V0KGxhdGVyLCByZW1haW5pbmcpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9O1xuICB9O1xuXG4gIC8vIFJldHVybnMgYSBmdW5jdGlvbiwgdGhhdCwgYXMgbG9uZyBhcyBpdCBjb250aW51ZXMgdG8gYmUgaW52b2tlZCwgd2lsbCBub3RcbiAgLy8gYmUgdHJpZ2dlcmVkLiBUaGUgZnVuY3Rpb24gd2lsbCBiZSBjYWxsZWQgYWZ0ZXIgaXQgc3RvcHMgYmVpbmcgY2FsbGVkIGZvclxuICAvLyBOIG1pbGxpc2Vjb25kcy4gSWYgYGltbWVkaWF0ZWAgaXMgcGFzc2VkLCB0cmlnZ2VyIHRoZSBmdW5jdGlvbiBvbiB0aGVcbiAgLy8gbGVhZGluZyBlZGdlLCBpbnN0ZWFkIG9mIHRoZSB0cmFpbGluZy5cbiAgXy5kZWJvdW5jZSA9IGZ1bmN0aW9uKGZ1bmMsIHdhaXQsIGltbWVkaWF0ZSkge1xuICAgIHZhciB0aW1lb3V0LCBhcmdzLCBjb250ZXh0LCB0aW1lc3RhbXAsIHJlc3VsdDtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICBjb250ZXh0ID0gdGhpcztcbiAgICAgIGFyZ3MgPSBhcmd1bWVudHM7XG4gICAgICB0aW1lc3RhbXAgPSBuZXcgRGF0ZSgpO1xuICAgICAgdmFyIGxhdGVyID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBsYXN0ID0gKG5ldyBEYXRlKCkpIC0gdGltZXN0YW1wO1xuICAgICAgICBpZiAobGFzdCA8IHdhaXQpIHtcbiAgICAgICAgICB0aW1lb3V0ID0gc2V0VGltZW91dChsYXRlciwgd2FpdCAtIGxhc3QpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRpbWVvdXQgPSBudWxsO1xuICAgICAgICAgIGlmICghaW1tZWRpYXRlKSByZXN1bHQgPSBmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgICAgdmFyIGNhbGxOb3cgPSBpbW1lZGlhdGUgJiYgIXRpbWVvdXQ7XG4gICAgICBpZiAoIXRpbWVvdXQpIHtcbiAgICAgICAgdGltZW91dCA9IHNldFRpbWVvdXQobGF0ZXIsIHdhaXQpO1xuICAgICAgfVxuICAgICAgaWYgKGNhbGxOb3cpIHJlc3VsdCA9IGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncyk7XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH07XG4gIH07XG5cbiAgLy8gUmV0dXJucyBhIGZ1bmN0aW9uIHRoYXQgd2lsbCBiZSBleGVjdXRlZCBhdCBtb3N0IG9uZSB0aW1lLCBubyBtYXR0ZXIgaG93XG4gIC8vIG9mdGVuIHlvdSBjYWxsIGl0LiBVc2VmdWwgZm9yIGxhenkgaW5pdGlhbGl6YXRpb24uXG4gIF8ub25jZSA9IGZ1bmN0aW9uKGZ1bmMpIHtcbiAgICB2YXIgcmFuID0gZmFsc2UsIG1lbW87XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKHJhbikgcmV0dXJuIG1lbW87XG4gICAgICByYW4gPSB0cnVlO1xuICAgICAgbWVtbyA9IGZ1bmMuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgIGZ1bmMgPSBudWxsO1xuICAgICAgcmV0dXJuIG1lbW87XG4gICAgfTtcbiAgfTtcblxuICAvLyBSZXR1cm5zIHRoZSBmaXJzdCBmdW5jdGlvbiBwYXNzZWQgYXMgYW4gYXJndW1lbnQgdG8gdGhlIHNlY29uZCxcbiAgLy8gYWxsb3dpbmcgeW91IHRvIGFkanVzdCBhcmd1bWVudHMsIHJ1biBjb2RlIGJlZm9yZSBhbmQgYWZ0ZXIsIGFuZFxuICAvLyBjb25kaXRpb25hbGx5IGV4ZWN1dGUgdGhlIG9yaWdpbmFsIGZ1bmN0aW9uLlxuICBfLndyYXAgPSBmdW5jdGlvbihmdW5jLCB3cmFwcGVyKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGFyZ3MgPSBbZnVuY107XG4gICAgICBwdXNoLmFwcGx5KGFyZ3MsIGFyZ3VtZW50cyk7XG4gICAgICByZXR1cm4gd3JhcHBlci5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICB9O1xuICB9O1xuXG4gIC8vIFJldHVybnMgYSBmdW5jdGlvbiB0aGF0IGlzIHRoZSBjb21wb3NpdGlvbiBvZiBhIGxpc3Qgb2YgZnVuY3Rpb25zLCBlYWNoXG4gIC8vIGNvbnN1bWluZyB0aGUgcmV0dXJuIHZhbHVlIG9mIHRoZSBmdW5jdGlvbiB0aGF0IGZvbGxvd3MuXG4gIF8uY29tcG9zZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBmdW5jcyA9IGFyZ3VtZW50cztcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgYXJncyA9IGFyZ3VtZW50cztcbiAgICAgIGZvciAodmFyIGkgPSBmdW5jcy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICBhcmdzID0gW2Z1bmNzW2ldLmFwcGx5KHRoaXMsIGFyZ3MpXTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBhcmdzWzBdO1xuICAgIH07XG4gIH07XG5cbiAgLy8gUmV0dXJucyBhIGZ1bmN0aW9uIHRoYXQgd2lsbCBvbmx5IGJlIGV4ZWN1dGVkIGFmdGVyIGJlaW5nIGNhbGxlZCBOIHRpbWVzLlxuICBfLmFmdGVyID0gZnVuY3Rpb24odGltZXMsIGZ1bmMpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoLS10aW1lcyA8IDEpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmMuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgIH1cbiAgICB9O1xuICB9O1xuXG4gIC8vIE9iamVjdCBGdW5jdGlvbnNcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIFJldHJpZXZlIHRoZSBuYW1lcyBvZiBhbiBvYmplY3QncyBwcm9wZXJ0aWVzLlxuICAvLyBEZWxlZ2F0ZXMgdG8gKipFQ01BU2NyaXB0IDUqKidzIG5hdGl2ZSBgT2JqZWN0LmtleXNgXG4gIF8ua2V5cyA9IG5hdGl2ZUtleXMgfHwgZnVuY3Rpb24ob2JqKSB7XG4gICAgaWYgKG9iaiAhPT0gT2JqZWN0KG9iaikpIHRocm93IG5ldyBUeXBlRXJyb3IoJ0ludmFsaWQgb2JqZWN0Jyk7XG4gICAgdmFyIGtleXMgPSBbXTtcbiAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSBpZiAoXy5oYXMob2JqLCBrZXkpKSBrZXlzLnB1c2goa2V5KTtcbiAgICByZXR1cm4ga2V5cztcbiAgfTtcblxuICAvLyBSZXRyaWV2ZSB0aGUgdmFsdWVzIG9mIGFuIG9iamVjdCdzIHByb3BlcnRpZXMuXG4gIF8udmFsdWVzID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIGtleXMgPSBfLmtleXMob2JqKTtcbiAgICB2YXIgbGVuZ3RoID0ga2V5cy5sZW5ndGg7XG4gICAgdmFyIHZhbHVlcyA9IG5ldyBBcnJheShsZW5ndGgpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhbHVlc1tpXSA9IG9ialtrZXlzW2ldXTtcbiAgICB9XG4gICAgcmV0dXJuIHZhbHVlcztcbiAgfTtcblxuICAvLyBDb252ZXJ0IGFuIG9iamVjdCBpbnRvIGEgbGlzdCBvZiBgW2tleSwgdmFsdWVdYCBwYWlycy5cbiAgXy5wYWlycyA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHZhciBrZXlzID0gXy5rZXlzKG9iaik7XG4gICAgdmFyIGxlbmd0aCA9IGtleXMubGVuZ3RoO1xuICAgIHZhciBwYWlycyA9IG5ldyBBcnJheShsZW5ndGgpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIHBhaXJzW2ldID0gW2tleXNbaV0sIG9ialtrZXlzW2ldXV07XG4gICAgfVxuICAgIHJldHVybiBwYWlycztcbiAgfTtcblxuICAvLyBJbnZlcnQgdGhlIGtleXMgYW5kIHZhbHVlcyBvZiBhbiBvYmplY3QuIFRoZSB2YWx1ZXMgbXVzdCBiZSBzZXJpYWxpemFibGUuXG4gIF8uaW52ZXJ0ID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIHJlc3VsdCA9IHt9O1xuICAgIHZhciBrZXlzID0gXy5rZXlzKG9iaik7XG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbmd0aCA9IGtleXMubGVuZ3RoOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIHJlc3VsdFtvYmpba2V5c1tpXV1dID0ga2V5c1tpXTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcblxuICAvLyBSZXR1cm4gYSBzb3J0ZWQgbGlzdCBvZiB0aGUgZnVuY3Rpb24gbmFtZXMgYXZhaWxhYmxlIG9uIHRoZSBvYmplY3QuXG4gIC8vIEFsaWFzZWQgYXMgYG1ldGhvZHNgXG4gIF8uZnVuY3Rpb25zID0gXy5tZXRob2RzID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIG5hbWVzID0gW107XG4gICAgZm9yICh2YXIga2V5IGluIG9iaikge1xuICAgICAgaWYgKF8uaXNGdW5jdGlvbihvYmpba2V5XSkpIG5hbWVzLnB1c2goa2V5KTtcbiAgICB9XG4gICAgcmV0dXJuIG5hbWVzLnNvcnQoKTtcbiAgfTtcblxuICAvLyBFeHRlbmQgYSBnaXZlbiBvYmplY3Qgd2l0aCBhbGwgdGhlIHByb3BlcnRpZXMgaW4gcGFzc2VkLWluIG9iamVjdChzKS5cbiAgXy5leHRlbmQgPSBmdW5jdGlvbihvYmopIHtcbiAgICBlYWNoKHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSwgZnVuY3Rpb24oc291cmNlKSB7XG4gICAgICBpZiAoc291cmNlKSB7XG4gICAgICAgIGZvciAodmFyIHByb3AgaW4gc291cmNlKSB7XG4gICAgICAgICAgb2JqW3Byb3BdID0gc291cmNlW3Byb3BdO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIG9iajtcbiAgfTtcblxuICAvLyBSZXR1cm4gYSBjb3B5IG9mIHRoZSBvYmplY3Qgb25seSBjb250YWluaW5nIHRoZSB3aGl0ZWxpc3RlZCBwcm9wZXJ0aWVzLlxuICBfLnBpY2sgPSBmdW5jdGlvbihvYmopIHtcbiAgICB2YXIgY29weSA9IHt9O1xuICAgIHZhciBrZXlzID0gY29uY2F0LmFwcGx5KEFycmF5UHJvdG8sIHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSk7XG4gICAgZWFjaChrZXlzLCBmdW5jdGlvbihrZXkpIHtcbiAgICAgIGlmIChrZXkgaW4gb2JqKSBjb3B5W2tleV0gPSBvYmpba2V5XTtcbiAgICB9KTtcbiAgICByZXR1cm4gY29weTtcbiAgfTtcblxuICAgLy8gUmV0dXJuIGEgY29weSBvZiB0aGUgb2JqZWN0IHdpdGhvdXQgdGhlIGJsYWNrbGlzdGVkIHByb3BlcnRpZXMuXG4gIF8ub21pdCA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHZhciBjb3B5ID0ge307XG4gICAgdmFyIGtleXMgPSBjb25jYXQuYXBwbHkoQXJyYXlQcm90bywgc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpKTtcbiAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgICBpZiAoIV8uY29udGFpbnMoa2V5cywga2V5KSkgY29weVtrZXldID0gb2JqW2tleV07XG4gICAgfVxuICAgIHJldHVybiBjb3B5O1xuICB9O1xuXG4gIC8vIEZpbGwgaW4gYSBnaXZlbiBvYmplY3Qgd2l0aCBkZWZhdWx0IHByb3BlcnRpZXMuXG4gIF8uZGVmYXVsdHMgPSBmdW5jdGlvbihvYmopIHtcbiAgICBlYWNoKHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSwgZnVuY3Rpb24oc291cmNlKSB7XG4gICAgICBpZiAoc291cmNlKSB7XG4gICAgICAgIGZvciAodmFyIHByb3AgaW4gc291cmNlKSB7XG4gICAgICAgICAgaWYgKG9ialtwcm9wXSA9PT0gdm9pZCAwKSBvYmpbcHJvcF0gPSBzb3VyY2VbcHJvcF07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gb2JqO1xuICB9O1xuXG4gIC8vIENyZWF0ZSBhIChzaGFsbG93LWNsb25lZCkgZHVwbGljYXRlIG9mIGFuIG9iamVjdC5cbiAgXy5jbG9uZSA9IGZ1bmN0aW9uKG9iaikge1xuICAgIGlmICghXy5pc09iamVjdChvYmopKSByZXR1cm4gb2JqO1xuICAgIHJldHVybiBfLmlzQXJyYXkob2JqKSA/IG9iai5zbGljZSgpIDogXy5leHRlbmQoe30sIG9iaik7XG4gIH07XG5cbiAgLy8gSW52b2tlcyBpbnRlcmNlcHRvciB3aXRoIHRoZSBvYmosIGFuZCB0aGVuIHJldHVybnMgb2JqLlxuICAvLyBUaGUgcHJpbWFyeSBwdXJwb3NlIG9mIHRoaXMgbWV0aG9kIGlzIHRvIFwidGFwIGludG9cIiBhIG1ldGhvZCBjaGFpbiwgaW5cbiAgLy8gb3JkZXIgdG8gcGVyZm9ybSBvcGVyYXRpb25zIG9uIGludGVybWVkaWF0ZSByZXN1bHRzIHdpdGhpbiB0aGUgY2hhaW4uXG4gIF8udGFwID0gZnVuY3Rpb24ob2JqLCBpbnRlcmNlcHRvcikge1xuICAgIGludGVyY2VwdG9yKG9iaik7XG4gICAgcmV0dXJuIG9iajtcbiAgfTtcblxuICAvLyBJbnRlcm5hbCByZWN1cnNpdmUgY29tcGFyaXNvbiBmdW5jdGlvbiBmb3IgYGlzRXF1YWxgLlxuICB2YXIgZXEgPSBmdW5jdGlvbihhLCBiLCBhU3RhY2ssIGJTdGFjaykge1xuICAgIC8vIElkZW50aWNhbCBvYmplY3RzIGFyZSBlcXVhbC4gYDAgPT09IC0wYCwgYnV0IHRoZXkgYXJlbid0IGlkZW50aWNhbC5cbiAgICAvLyBTZWUgdGhlIFtIYXJtb255IGBlZ2FsYCBwcm9wb3NhbF0oaHR0cDovL3dpa2kuZWNtYXNjcmlwdC5vcmcvZG9rdS5waHA/aWQ9aGFybW9ueTplZ2FsKS5cbiAgICBpZiAoYSA9PT0gYikgcmV0dXJuIGEgIT09IDAgfHwgMSAvIGEgPT0gMSAvIGI7XG4gICAgLy8gQSBzdHJpY3QgY29tcGFyaXNvbiBpcyBuZWNlc3NhcnkgYmVjYXVzZSBgbnVsbCA9PSB1bmRlZmluZWRgLlxuICAgIGlmIChhID09IG51bGwgfHwgYiA9PSBudWxsKSByZXR1cm4gYSA9PT0gYjtcbiAgICAvLyBVbndyYXAgYW55IHdyYXBwZWQgb2JqZWN0cy5cbiAgICBpZiAoYSBpbnN0YW5jZW9mIF8pIGEgPSBhLl93cmFwcGVkO1xuICAgIGlmIChiIGluc3RhbmNlb2YgXykgYiA9IGIuX3dyYXBwZWQ7XG4gICAgLy8gQ29tcGFyZSBgW1tDbGFzc11dYCBuYW1lcy5cbiAgICB2YXIgY2xhc3NOYW1lID0gdG9TdHJpbmcuY2FsbChhKTtcbiAgICBpZiAoY2xhc3NOYW1lICE9IHRvU3RyaW5nLmNhbGwoYikpIHJldHVybiBmYWxzZTtcbiAgICBzd2l0Y2ggKGNsYXNzTmFtZSkge1xuICAgICAgLy8gU3RyaW5ncywgbnVtYmVycywgZGF0ZXMsIGFuZCBib29sZWFucyBhcmUgY29tcGFyZWQgYnkgdmFsdWUuXG4gICAgICBjYXNlICdbb2JqZWN0IFN0cmluZ10nOlxuICAgICAgICAvLyBQcmltaXRpdmVzIGFuZCB0aGVpciBjb3JyZXNwb25kaW5nIG9iamVjdCB3cmFwcGVycyBhcmUgZXF1aXZhbGVudDsgdGh1cywgYFwiNVwiYCBpc1xuICAgICAgICAvLyBlcXVpdmFsZW50IHRvIGBuZXcgU3RyaW5nKFwiNVwiKWAuXG4gICAgICAgIHJldHVybiBhID09IFN0cmluZyhiKTtcbiAgICAgIGNhc2UgJ1tvYmplY3QgTnVtYmVyXSc6XG4gICAgICAgIC8vIGBOYU5gcyBhcmUgZXF1aXZhbGVudCwgYnV0IG5vbi1yZWZsZXhpdmUuIEFuIGBlZ2FsYCBjb21wYXJpc29uIGlzIHBlcmZvcm1lZCBmb3JcbiAgICAgICAgLy8gb3RoZXIgbnVtZXJpYyB2YWx1ZXMuXG4gICAgICAgIHJldHVybiBhICE9ICthID8gYiAhPSArYiA6IChhID09IDAgPyAxIC8gYSA9PSAxIC8gYiA6IGEgPT0gK2IpO1xuICAgICAgY2FzZSAnW29iamVjdCBEYXRlXSc6XG4gICAgICBjYXNlICdbb2JqZWN0IEJvb2xlYW5dJzpcbiAgICAgICAgLy8gQ29lcmNlIGRhdGVzIGFuZCBib29sZWFucyB0byBudW1lcmljIHByaW1pdGl2ZSB2YWx1ZXMuIERhdGVzIGFyZSBjb21wYXJlZCBieSB0aGVpclxuICAgICAgICAvLyBtaWxsaXNlY29uZCByZXByZXNlbnRhdGlvbnMuIE5vdGUgdGhhdCBpbnZhbGlkIGRhdGVzIHdpdGggbWlsbGlzZWNvbmQgcmVwcmVzZW50YXRpb25zXG4gICAgICAgIC8vIG9mIGBOYU5gIGFyZSBub3QgZXF1aXZhbGVudC5cbiAgICAgICAgcmV0dXJuICthID09ICtiO1xuICAgICAgLy8gUmVnRXhwcyBhcmUgY29tcGFyZWQgYnkgdGhlaXIgc291cmNlIHBhdHRlcm5zIGFuZCBmbGFncy5cbiAgICAgIGNhc2UgJ1tvYmplY3QgUmVnRXhwXSc6XG4gICAgICAgIHJldHVybiBhLnNvdXJjZSA9PSBiLnNvdXJjZSAmJlxuICAgICAgICAgICAgICAgYS5nbG9iYWwgPT0gYi5nbG9iYWwgJiZcbiAgICAgICAgICAgICAgIGEubXVsdGlsaW5lID09IGIubXVsdGlsaW5lICYmXG4gICAgICAgICAgICAgICBhLmlnbm9yZUNhc2UgPT0gYi5pZ25vcmVDYXNlO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIGEgIT0gJ29iamVjdCcgfHwgdHlwZW9mIGIgIT0gJ29iamVjdCcpIHJldHVybiBmYWxzZTtcbiAgICAvLyBBc3N1bWUgZXF1YWxpdHkgZm9yIGN5Y2xpYyBzdHJ1Y3R1cmVzLiBUaGUgYWxnb3JpdGhtIGZvciBkZXRlY3RpbmcgY3ljbGljXG4gICAgLy8gc3RydWN0dXJlcyBpcyBhZGFwdGVkIGZyb20gRVMgNS4xIHNlY3Rpb24gMTUuMTIuMywgYWJzdHJhY3Qgb3BlcmF0aW9uIGBKT2AuXG4gICAgdmFyIGxlbmd0aCA9IGFTdGFjay5sZW5ndGg7XG4gICAgd2hpbGUgKGxlbmd0aC0tKSB7XG4gICAgICAvLyBMaW5lYXIgc2VhcmNoLiBQZXJmb3JtYW5jZSBpcyBpbnZlcnNlbHkgcHJvcG9ydGlvbmFsIHRvIHRoZSBudW1iZXIgb2ZcbiAgICAgIC8vIHVuaXF1ZSBuZXN0ZWQgc3RydWN0dXJlcy5cbiAgICAgIGlmIChhU3RhY2tbbGVuZ3RoXSA9PSBhKSByZXR1cm4gYlN0YWNrW2xlbmd0aF0gPT0gYjtcbiAgICB9XG4gICAgLy8gT2JqZWN0cyB3aXRoIGRpZmZlcmVudCBjb25zdHJ1Y3RvcnMgYXJlIG5vdCBlcXVpdmFsZW50LCBidXQgYE9iamVjdGBzXG4gICAgLy8gZnJvbSBkaWZmZXJlbnQgZnJhbWVzIGFyZS5cbiAgICB2YXIgYUN0b3IgPSBhLmNvbnN0cnVjdG9yLCBiQ3RvciA9IGIuY29uc3RydWN0b3I7XG4gICAgaWYgKGFDdG9yICE9PSBiQ3RvciAmJiAhKF8uaXNGdW5jdGlvbihhQ3RvcikgJiYgKGFDdG9yIGluc3RhbmNlb2YgYUN0b3IpICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIF8uaXNGdW5jdGlvbihiQ3RvcikgJiYgKGJDdG9yIGluc3RhbmNlb2YgYkN0b3IpKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICAvLyBBZGQgdGhlIGZpcnN0IG9iamVjdCB0byB0aGUgc3RhY2sgb2YgdHJhdmVyc2VkIG9iamVjdHMuXG4gICAgYVN0YWNrLnB1c2goYSk7XG4gICAgYlN0YWNrLnB1c2goYik7XG4gICAgdmFyIHNpemUgPSAwLCByZXN1bHQgPSB0cnVlO1xuICAgIC8vIFJlY3Vyc2l2ZWx5IGNvbXBhcmUgb2JqZWN0cyBhbmQgYXJyYXlzLlxuICAgIGlmIChjbGFzc05hbWUgPT0gJ1tvYmplY3QgQXJyYXldJykge1xuICAgICAgLy8gQ29tcGFyZSBhcnJheSBsZW5ndGhzIHRvIGRldGVybWluZSBpZiBhIGRlZXAgY29tcGFyaXNvbiBpcyBuZWNlc3NhcnkuXG4gICAgICBzaXplID0gYS5sZW5ndGg7XG4gICAgICByZXN1bHQgPSBzaXplID09IGIubGVuZ3RoO1xuICAgICAgaWYgKHJlc3VsdCkge1xuICAgICAgICAvLyBEZWVwIGNvbXBhcmUgdGhlIGNvbnRlbnRzLCBpZ25vcmluZyBub24tbnVtZXJpYyBwcm9wZXJ0aWVzLlxuICAgICAgICB3aGlsZSAoc2l6ZS0tKSB7XG4gICAgICAgICAgaWYgKCEocmVzdWx0ID0gZXEoYVtzaXplXSwgYltzaXplXSwgYVN0YWNrLCBiU3RhY2spKSkgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gRGVlcCBjb21wYXJlIG9iamVjdHMuXG4gICAgICBmb3IgKHZhciBrZXkgaW4gYSkge1xuICAgICAgICBpZiAoXy5oYXMoYSwga2V5KSkge1xuICAgICAgICAgIC8vIENvdW50IHRoZSBleHBlY3RlZCBudW1iZXIgb2YgcHJvcGVydGllcy5cbiAgICAgICAgICBzaXplKys7XG4gICAgICAgICAgLy8gRGVlcCBjb21wYXJlIGVhY2ggbWVtYmVyLlxuICAgICAgICAgIGlmICghKHJlc3VsdCA9IF8uaGFzKGIsIGtleSkgJiYgZXEoYVtrZXldLCBiW2tleV0sIGFTdGFjaywgYlN0YWNrKSkpIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICAvLyBFbnN1cmUgdGhhdCBib3RoIG9iamVjdHMgY29udGFpbiB0aGUgc2FtZSBudW1iZXIgb2YgcHJvcGVydGllcy5cbiAgICAgIGlmIChyZXN1bHQpIHtcbiAgICAgICAgZm9yIChrZXkgaW4gYikge1xuICAgICAgICAgIGlmIChfLmhhcyhiLCBrZXkpICYmICEoc2l6ZS0tKSkgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgcmVzdWx0ID0gIXNpemU7XG4gICAgICB9XG4gICAgfVxuICAgIC8vIFJlbW92ZSB0aGUgZmlyc3Qgb2JqZWN0IGZyb20gdGhlIHN0YWNrIG9mIHRyYXZlcnNlZCBvYmplY3RzLlxuICAgIGFTdGFjay5wb3AoKTtcbiAgICBiU3RhY2sucG9wKCk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcblxuICAvLyBQZXJmb3JtIGEgZGVlcCBjb21wYXJpc29uIHRvIGNoZWNrIGlmIHR3byBvYmplY3RzIGFyZSBlcXVhbC5cbiAgXy5pc0VxdWFsID0gZnVuY3Rpb24oYSwgYikge1xuICAgIHJldHVybiBlcShhLCBiLCBbXSwgW10pO1xuICB9O1xuXG4gIC8vIElzIGEgZ2l2ZW4gYXJyYXksIHN0cmluZywgb3Igb2JqZWN0IGVtcHR5P1xuICAvLyBBbiBcImVtcHR5XCIgb2JqZWN0IGhhcyBubyBlbnVtZXJhYmxlIG93bi1wcm9wZXJ0aWVzLlxuICBfLmlzRW1wdHkgPSBmdW5jdGlvbihvYmopIHtcbiAgICBpZiAob2JqID09IG51bGwpIHJldHVybiB0cnVlO1xuICAgIGlmIChfLmlzQXJyYXkob2JqKSB8fCBfLmlzU3RyaW5nKG9iaikpIHJldHVybiBvYmoubGVuZ3RoID09PSAwO1xuICAgIGZvciAodmFyIGtleSBpbiBvYmopIGlmIChfLmhhcyhvYmosIGtleSkpIHJldHVybiBmYWxzZTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfTtcblxuICAvLyBJcyBhIGdpdmVuIHZhbHVlIGEgRE9NIGVsZW1lbnQ/XG4gIF8uaXNFbGVtZW50ID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuICEhKG9iaiAmJiBvYmoubm9kZVR5cGUgPT09IDEpO1xuICB9O1xuXG4gIC8vIElzIGEgZ2l2ZW4gdmFsdWUgYW4gYXJyYXk/XG4gIC8vIERlbGVnYXRlcyB0byBFQ01BNSdzIG5hdGl2ZSBBcnJheS5pc0FycmF5XG4gIF8uaXNBcnJheSA9IG5hdGl2ZUlzQXJyYXkgfHwgZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIHRvU3RyaW5nLmNhbGwob2JqKSA9PSAnW29iamVjdCBBcnJheV0nO1xuICB9O1xuXG4gIC8vIElzIGEgZ2l2ZW4gdmFyaWFibGUgYW4gb2JqZWN0P1xuICBfLmlzT2JqZWN0ID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIG9iaiA9PT0gT2JqZWN0KG9iaik7XG4gIH07XG5cbiAgLy8gQWRkIHNvbWUgaXNUeXBlIG1ldGhvZHM6IGlzQXJndW1lbnRzLCBpc0Z1bmN0aW9uLCBpc1N0cmluZywgaXNOdW1iZXIsIGlzRGF0ZSwgaXNSZWdFeHAuXG4gIGVhY2goWydBcmd1bWVudHMnLCAnRnVuY3Rpb24nLCAnU3RyaW5nJywgJ051bWJlcicsICdEYXRlJywgJ1JlZ0V4cCddLCBmdW5jdGlvbihuYW1lKSB7XG4gICAgX1snaXMnICsgbmFtZV0gPSBmdW5jdGlvbihvYmopIHtcbiAgICAgIHJldHVybiB0b1N0cmluZy5jYWxsKG9iaikgPT0gJ1tvYmplY3QgJyArIG5hbWUgKyAnXSc7XG4gICAgfTtcbiAgfSk7XG5cbiAgLy8gRGVmaW5lIGEgZmFsbGJhY2sgdmVyc2lvbiBvZiB0aGUgbWV0aG9kIGluIGJyb3dzZXJzIChhaGVtLCBJRSksIHdoZXJlXG4gIC8vIHRoZXJlIGlzbid0IGFueSBpbnNwZWN0YWJsZSBcIkFyZ3VtZW50c1wiIHR5cGUuXG4gIGlmICghXy5pc0FyZ3VtZW50cyhhcmd1bWVudHMpKSB7XG4gICAgXy5pc0FyZ3VtZW50cyA9IGZ1bmN0aW9uKG9iaikge1xuICAgICAgcmV0dXJuICEhKG9iaiAmJiBfLmhhcyhvYmosICdjYWxsZWUnKSk7XG4gICAgfTtcbiAgfVxuXG4gIC8vIE9wdGltaXplIGBpc0Z1bmN0aW9uYCBpZiBhcHByb3ByaWF0ZS5cbiAgaWYgKHR5cGVvZiAoLy4vKSAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIF8uaXNGdW5jdGlvbiA9IGZ1bmN0aW9uKG9iaikge1xuICAgICAgcmV0dXJuIHR5cGVvZiBvYmogPT09ICdmdW5jdGlvbic7XG4gICAgfTtcbiAgfVxuXG4gIC8vIElzIGEgZ2l2ZW4gb2JqZWN0IGEgZmluaXRlIG51bWJlcj9cbiAgXy5pc0Zpbml0ZSA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiBpc0Zpbml0ZShvYmopICYmICFpc05hTihwYXJzZUZsb2F0KG9iaikpO1xuICB9O1xuXG4gIC8vIElzIHRoZSBnaXZlbiB2YWx1ZSBgTmFOYD8gKE5hTiBpcyB0aGUgb25seSBudW1iZXIgd2hpY2ggZG9lcyBub3QgZXF1YWwgaXRzZWxmKS5cbiAgXy5pc05hTiA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiBfLmlzTnVtYmVyKG9iaikgJiYgb2JqICE9ICtvYmo7XG4gIH07XG5cbiAgLy8gSXMgYSBnaXZlbiB2YWx1ZSBhIGJvb2xlYW4/XG4gIF8uaXNCb29sZWFuID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIG9iaiA9PT0gdHJ1ZSB8fCBvYmogPT09IGZhbHNlIHx8IHRvU3RyaW5nLmNhbGwob2JqKSA9PSAnW29iamVjdCBCb29sZWFuXSc7XG4gIH07XG5cbiAgLy8gSXMgYSBnaXZlbiB2YWx1ZSBlcXVhbCB0byBudWxsP1xuICBfLmlzTnVsbCA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiBvYmogPT09IG51bGw7XG4gIH07XG5cbiAgLy8gSXMgYSBnaXZlbiB2YXJpYWJsZSB1bmRlZmluZWQ/XG4gIF8uaXNVbmRlZmluZWQgPSBmdW5jdGlvbihvYmopIHtcbiAgICByZXR1cm4gb2JqID09PSB2b2lkIDA7XG4gIH07XG5cbiAgLy8gU2hvcnRjdXQgZnVuY3Rpb24gZm9yIGNoZWNraW5nIGlmIGFuIG9iamVjdCBoYXMgYSBnaXZlbiBwcm9wZXJ0eSBkaXJlY3RseVxuICAvLyBvbiBpdHNlbGYgKGluIG90aGVyIHdvcmRzLCBub3Qgb24gYSBwcm90b3R5cGUpLlxuICBfLmhhcyA9IGZ1bmN0aW9uKG9iaiwga2V5KSB7XG4gICAgcmV0dXJuIGhhc093blByb3BlcnR5LmNhbGwob2JqLCBrZXkpO1xuICB9O1xuXG4gIC8vIFV0aWxpdHkgRnVuY3Rpb25zXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gUnVuIFVuZGVyc2NvcmUuanMgaW4gKm5vQ29uZmxpY3QqIG1vZGUsIHJldHVybmluZyB0aGUgYF9gIHZhcmlhYmxlIHRvIGl0c1xuICAvLyBwcmV2aW91cyBvd25lci4gUmV0dXJucyBhIHJlZmVyZW5jZSB0byB0aGUgVW5kZXJzY29yZSBvYmplY3QuXG4gIF8ubm9Db25mbGljdCA9IGZ1bmN0aW9uKCkge1xuICAgIHJvb3QuXyA9IHByZXZpb3VzVW5kZXJzY29yZTtcbiAgICByZXR1cm4gdGhpcztcbiAgfTtcblxuICAvLyBLZWVwIHRoZSBpZGVudGl0eSBmdW5jdGlvbiBhcm91bmQgZm9yIGRlZmF1bHQgaXRlcmF0b3JzLlxuICBfLmlkZW50aXR5ID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH07XG5cbiAgLy8gUnVuIGEgZnVuY3Rpb24gKipuKiogdGltZXMuXG4gIF8udGltZXMgPSBmdW5jdGlvbihuLCBpdGVyYXRvciwgY29udGV4dCkge1xuICAgIHZhciBhY2N1bSA9IEFycmF5KE1hdGgubWF4KDAsIG4pKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG47IGkrKykgYWNjdW1baV0gPSBpdGVyYXRvci5jYWxsKGNvbnRleHQsIGkpO1xuICAgIHJldHVybiBhY2N1bTtcbiAgfTtcblxuICAvLyBSZXR1cm4gYSByYW5kb20gaW50ZWdlciBiZXR3ZWVuIG1pbiBhbmQgbWF4IChpbmNsdXNpdmUpLlxuICBfLnJhbmRvbSA9IGZ1bmN0aW9uKG1pbiwgbWF4KSB7XG4gICAgaWYgKG1heCA9PSBudWxsKSB7XG4gICAgICBtYXggPSBtaW47XG4gICAgICBtaW4gPSAwO1xuICAgIH1cbiAgICByZXR1cm4gbWluICsgTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogKG1heCAtIG1pbiArIDEpKTtcbiAgfTtcblxuICAvLyBMaXN0IG9mIEhUTUwgZW50aXRpZXMgZm9yIGVzY2FwaW5nLlxuICB2YXIgZW50aXR5TWFwID0ge1xuICAgIGVzY2FwZToge1xuICAgICAgJyYnOiAnJmFtcDsnLFxuICAgICAgJzwnOiAnJmx0OycsXG4gICAgICAnPic6ICcmZ3Q7JyxcbiAgICAgICdcIic6ICcmcXVvdDsnLFxuICAgICAgXCInXCI6ICcmI3gyNzsnXG4gICAgfVxuICB9O1xuICBlbnRpdHlNYXAudW5lc2NhcGUgPSBfLmludmVydChlbnRpdHlNYXAuZXNjYXBlKTtcblxuICAvLyBSZWdleGVzIGNvbnRhaW5pbmcgdGhlIGtleXMgYW5kIHZhbHVlcyBsaXN0ZWQgaW1tZWRpYXRlbHkgYWJvdmUuXG4gIHZhciBlbnRpdHlSZWdleGVzID0ge1xuICAgIGVzY2FwZTogICBuZXcgUmVnRXhwKCdbJyArIF8ua2V5cyhlbnRpdHlNYXAuZXNjYXBlKS5qb2luKCcnKSArICddJywgJ2cnKSxcbiAgICB1bmVzY2FwZTogbmV3IFJlZ0V4cCgnKCcgKyBfLmtleXMoZW50aXR5TWFwLnVuZXNjYXBlKS5qb2luKCd8JykgKyAnKScsICdnJylcbiAgfTtcblxuICAvLyBGdW5jdGlvbnMgZm9yIGVzY2FwaW5nIGFuZCB1bmVzY2FwaW5nIHN0cmluZ3MgdG8vZnJvbSBIVE1MIGludGVycG9sYXRpb24uXG4gIF8uZWFjaChbJ2VzY2FwZScsICd1bmVzY2FwZSddLCBmdW5jdGlvbihtZXRob2QpIHtcbiAgICBfW21ldGhvZF0gPSBmdW5jdGlvbihzdHJpbmcpIHtcbiAgICAgIGlmIChzdHJpbmcgPT0gbnVsbCkgcmV0dXJuICcnO1xuICAgICAgcmV0dXJuICgnJyArIHN0cmluZykucmVwbGFjZShlbnRpdHlSZWdleGVzW21ldGhvZF0sIGZ1bmN0aW9uKG1hdGNoKSB7XG4gICAgICAgIHJldHVybiBlbnRpdHlNYXBbbWV0aG9kXVttYXRjaF07XG4gICAgICB9KTtcbiAgICB9O1xuICB9KTtcblxuICAvLyBJZiB0aGUgdmFsdWUgb2YgdGhlIG5hbWVkIGBwcm9wZXJ0eWAgaXMgYSBmdW5jdGlvbiB0aGVuIGludm9rZSBpdCB3aXRoIHRoZVxuICAvLyBgb2JqZWN0YCBhcyBjb250ZXh0OyBvdGhlcndpc2UsIHJldHVybiBpdC5cbiAgXy5yZXN1bHQgPSBmdW5jdGlvbihvYmplY3QsIHByb3BlcnR5KSB7XG4gICAgaWYgKG9iamVjdCA9PSBudWxsKSByZXR1cm4gdm9pZCAwO1xuICAgIHZhciB2YWx1ZSA9IG9iamVjdFtwcm9wZXJ0eV07XG4gICAgcmV0dXJuIF8uaXNGdW5jdGlvbih2YWx1ZSkgPyB2YWx1ZS5jYWxsKG9iamVjdCkgOiB2YWx1ZTtcbiAgfTtcblxuICAvLyBBZGQgeW91ciBvd24gY3VzdG9tIGZ1bmN0aW9ucyB0byB0aGUgVW5kZXJzY29yZSBvYmplY3QuXG4gIF8ubWl4aW4gPSBmdW5jdGlvbihvYmopIHtcbiAgICBlYWNoKF8uZnVuY3Rpb25zKG9iaiksIGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgIHZhciBmdW5jID0gX1tuYW1lXSA9IG9ialtuYW1lXTtcbiAgICAgIF8ucHJvdG90eXBlW25hbWVdID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBhcmdzID0gW3RoaXMuX3dyYXBwZWRdO1xuICAgICAgICBwdXNoLmFwcGx5KGFyZ3MsIGFyZ3VtZW50cyk7XG4gICAgICAgIHJldHVybiByZXN1bHQuY2FsbCh0aGlzLCBmdW5jLmFwcGx5KF8sIGFyZ3MpKTtcbiAgICAgIH07XG4gICAgfSk7XG4gIH07XG5cbiAgLy8gR2VuZXJhdGUgYSB1bmlxdWUgaW50ZWdlciBpZCAodW5pcXVlIHdpdGhpbiB0aGUgZW50aXJlIGNsaWVudCBzZXNzaW9uKS5cbiAgLy8gVXNlZnVsIGZvciB0ZW1wb3JhcnkgRE9NIGlkcy5cbiAgdmFyIGlkQ291bnRlciA9IDA7XG4gIF8udW5pcXVlSWQgPSBmdW5jdGlvbihwcmVmaXgpIHtcbiAgICB2YXIgaWQgPSArK2lkQ291bnRlciArICcnO1xuICAgIHJldHVybiBwcmVmaXggPyBwcmVmaXggKyBpZCA6IGlkO1xuICB9O1xuXG4gIC8vIEJ5IGRlZmF1bHQsIFVuZGVyc2NvcmUgdXNlcyBFUkItc3R5bGUgdGVtcGxhdGUgZGVsaW1pdGVycywgY2hhbmdlIHRoZVxuICAvLyBmb2xsb3dpbmcgdGVtcGxhdGUgc2V0dGluZ3MgdG8gdXNlIGFsdGVybmF0aXZlIGRlbGltaXRlcnMuXG4gIF8udGVtcGxhdGVTZXR0aW5ncyA9IHtcbiAgICBldmFsdWF0ZSAgICA6IC88JShbXFxzXFxTXSs/KSU+L2csXG4gICAgaW50ZXJwb2xhdGUgOiAvPCU9KFtcXHNcXFNdKz8pJT4vZyxcbiAgICBlc2NhcGUgICAgICA6IC88JS0oW1xcc1xcU10rPyklPi9nXG4gIH07XG5cbiAgLy8gV2hlbiBjdXN0b21pemluZyBgdGVtcGxhdGVTZXR0aW5nc2AsIGlmIHlvdSBkb24ndCB3YW50IHRvIGRlZmluZSBhblxuICAvLyBpbnRlcnBvbGF0aW9uLCBldmFsdWF0aW9uIG9yIGVzY2FwaW5nIHJlZ2V4LCB3ZSBuZWVkIG9uZSB0aGF0IGlzXG4gIC8vIGd1YXJhbnRlZWQgbm90IHRvIG1hdGNoLlxuICB2YXIgbm9NYXRjaCA9IC8oLileLztcblxuICAvLyBDZXJ0YWluIGNoYXJhY3RlcnMgbmVlZCB0byBiZSBlc2NhcGVkIHNvIHRoYXQgdGhleSBjYW4gYmUgcHV0IGludG8gYVxuICAvLyBzdHJpbmcgbGl0ZXJhbC5cbiAgdmFyIGVzY2FwZXMgPSB7XG4gICAgXCInXCI6ICAgICAgXCInXCIsXG4gICAgJ1xcXFwnOiAgICAgJ1xcXFwnLFxuICAgICdcXHInOiAgICAgJ3InLFxuICAgICdcXG4nOiAgICAgJ24nLFxuICAgICdcXHQnOiAgICAgJ3QnLFxuICAgICdcXHUyMDI4JzogJ3UyMDI4JyxcbiAgICAnXFx1MjAyOSc6ICd1MjAyOSdcbiAgfTtcblxuICB2YXIgZXNjYXBlciA9IC9cXFxcfCd8XFxyfFxcbnxcXHR8XFx1MjAyOHxcXHUyMDI5L2c7XG5cbiAgLy8gSmF2YVNjcmlwdCBtaWNyby10ZW1wbGF0aW5nLCBzaW1pbGFyIHRvIEpvaG4gUmVzaWcncyBpbXBsZW1lbnRhdGlvbi5cbiAgLy8gVW5kZXJzY29yZSB0ZW1wbGF0aW5nIGhhbmRsZXMgYXJiaXRyYXJ5IGRlbGltaXRlcnMsIHByZXNlcnZlcyB3aGl0ZXNwYWNlLFxuICAvLyBhbmQgY29ycmVjdGx5IGVzY2FwZXMgcXVvdGVzIHdpdGhpbiBpbnRlcnBvbGF0ZWQgY29kZS5cbiAgXy50ZW1wbGF0ZSA9IGZ1bmN0aW9uKHRleHQsIGRhdGEsIHNldHRpbmdzKSB7XG4gICAgdmFyIHJlbmRlcjtcbiAgICBzZXR0aW5ncyA9IF8uZGVmYXVsdHMoe30sIHNldHRpbmdzLCBfLnRlbXBsYXRlU2V0dGluZ3MpO1xuXG4gICAgLy8gQ29tYmluZSBkZWxpbWl0ZXJzIGludG8gb25lIHJlZ3VsYXIgZXhwcmVzc2lvbiB2aWEgYWx0ZXJuYXRpb24uXG4gICAgdmFyIG1hdGNoZXIgPSBuZXcgUmVnRXhwKFtcbiAgICAgIChzZXR0aW5ncy5lc2NhcGUgfHwgbm9NYXRjaCkuc291cmNlLFxuICAgICAgKHNldHRpbmdzLmludGVycG9sYXRlIHx8IG5vTWF0Y2gpLnNvdXJjZSxcbiAgICAgIChzZXR0aW5ncy5ldmFsdWF0ZSB8fCBub01hdGNoKS5zb3VyY2VcbiAgICBdLmpvaW4oJ3wnKSArICd8JCcsICdnJyk7XG5cbiAgICAvLyBDb21waWxlIHRoZSB0ZW1wbGF0ZSBzb3VyY2UsIGVzY2FwaW5nIHN0cmluZyBsaXRlcmFscyBhcHByb3ByaWF0ZWx5LlxuICAgIHZhciBpbmRleCA9IDA7XG4gICAgdmFyIHNvdXJjZSA9IFwiX19wKz0nXCI7XG4gICAgdGV4dC5yZXBsYWNlKG1hdGNoZXIsIGZ1bmN0aW9uKG1hdGNoLCBlc2NhcGUsIGludGVycG9sYXRlLCBldmFsdWF0ZSwgb2Zmc2V0KSB7XG4gICAgICBzb3VyY2UgKz0gdGV4dC5zbGljZShpbmRleCwgb2Zmc2V0KVxuICAgICAgICAucmVwbGFjZShlc2NhcGVyLCBmdW5jdGlvbihtYXRjaCkgeyByZXR1cm4gJ1xcXFwnICsgZXNjYXBlc1ttYXRjaF07IH0pO1xuXG4gICAgICBpZiAoZXNjYXBlKSB7XG4gICAgICAgIHNvdXJjZSArPSBcIicrXFxuKChfX3Q9KFwiICsgZXNjYXBlICsgXCIpKT09bnVsbD8nJzpfLmVzY2FwZShfX3QpKStcXG4nXCI7XG4gICAgICB9XG4gICAgICBpZiAoaW50ZXJwb2xhdGUpIHtcbiAgICAgICAgc291cmNlICs9IFwiJytcXG4oKF9fdD0oXCIgKyBpbnRlcnBvbGF0ZSArIFwiKSk9PW51bGw/Jyc6X190KStcXG4nXCI7XG4gICAgICB9XG4gICAgICBpZiAoZXZhbHVhdGUpIHtcbiAgICAgICAgc291cmNlICs9IFwiJztcXG5cIiArIGV2YWx1YXRlICsgXCJcXG5fX3ArPSdcIjtcbiAgICAgIH1cbiAgICAgIGluZGV4ID0gb2Zmc2V0ICsgbWF0Y2gubGVuZ3RoO1xuICAgICAgcmV0dXJuIG1hdGNoO1xuICAgIH0pO1xuICAgIHNvdXJjZSArPSBcIic7XFxuXCI7XG5cbiAgICAvLyBJZiBhIHZhcmlhYmxlIGlzIG5vdCBzcGVjaWZpZWQsIHBsYWNlIGRhdGEgdmFsdWVzIGluIGxvY2FsIHNjb3BlLlxuICAgIGlmICghc2V0dGluZ3MudmFyaWFibGUpIHNvdXJjZSA9ICd3aXRoKG9ianx8e30pe1xcbicgKyBzb3VyY2UgKyAnfVxcbic7XG5cbiAgICBzb3VyY2UgPSBcInZhciBfX3QsX19wPScnLF9faj1BcnJheS5wcm90b3R5cGUuam9pbixcIiArXG4gICAgICBcInByaW50PWZ1bmN0aW9uKCl7X19wKz1fX2ouY2FsbChhcmd1bWVudHMsJycpO307XFxuXCIgK1xuICAgICAgc291cmNlICsgXCJyZXR1cm4gX19wO1xcblwiO1xuXG4gICAgdHJ5IHtcbiAgICAgIHJlbmRlciA9IG5ldyBGdW5jdGlvbihzZXR0aW5ncy52YXJpYWJsZSB8fCAnb2JqJywgJ18nLCBzb3VyY2UpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGUuc291cmNlID0gc291cmNlO1xuICAgICAgdGhyb3cgZTtcbiAgICB9XG5cbiAgICBpZiAoZGF0YSkgcmV0dXJuIHJlbmRlcihkYXRhLCBfKTtcbiAgICB2YXIgdGVtcGxhdGUgPSBmdW5jdGlvbihkYXRhKSB7XG4gICAgICByZXR1cm4gcmVuZGVyLmNhbGwodGhpcywgZGF0YSwgXyk7XG4gICAgfTtcblxuICAgIC8vIFByb3ZpZGUgdGhlIGNvbXBpbGVkIGZ1bmN0aW9uIHNvdXJjZSBhcyBhIGNvbnZlbmllbmNlIGZvciBwcmVjb21waWxhdGlvbi5cbiAgICB0ZW1wbGF0ZS5zb3VyY2UgPSAnZnVuY3Rpb24oJyArIChzZXR0aW5ncy52YXJpYWJsZSB8fCAnb2JqJykgKyAnKXtcXG4nICsgc291cmNlICsgJ30nO1xuXG4gICAgcmV0dXJuIHRlbXBsYXRlO1xuICB9O1xuXG4gIC8vIEFkZCBhIFwiY2hhaW5cIiBmdW5jdGlvbiwgd2hpY2ggd2lsbCBkZWxlZ2F0ZSB0byB0aGUgd3JhcHBlci5cbiAgXy5jaGFpbiA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiBfKG9iaikuY2hhaW4oKTtcbiAgfTtcblxuICAvLyBPT1BcbiAgLy8gLS0tLS0tLS0tLS0tLS0tXG4gIC8vIElmIFVuZGVyc2NvcmUgaXMgY2FsbGVkIGFzIGEgZnVuY3Rpb24sIGl0IHJldHVybnMgYSB3cmFwcGVkIG9iamVjdCB0aGF0XG4gIC8vIGNhbiBiZSB1c2VkIE9PLXN0eWxlLiBUaGlzIHdyYXBwZXIgaG9sZHMgYWx0ZXJlZCB2ZXJzaW9ucyBvZiBhbGwgdGhlXG4gIC8vIHVuZGVyc2NvcmUgZnVuY3Rpb25zLiBXcmFwcGVkIG9iamVjdHMgbWF5IGJlIGNoYWluZWQuXG5cbiAgLy8gSGVscGVyIGZ1bmN0aW9uIHRvIGNvbnRpbnVlIGNoYWluaW5nIGludGVybWVkaWF0ZSByZXN1bHRzLlxuICB2YXIgcmVzdWx0ID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIHRoaXMuX2NoYWluID8gXyhvYmopLmNoYWluKCkgOiBvYmo7XG4gIH07XG5cbiAgLy8gQWRkIGFsbCBvZiB0aGUgVW5kZXJzY29yZSBmdW5jdGlvbnMgdG8gdGhlIHdyYXBwZXIgb2JqZWN0LlxuICBfLm1peGluKF8pO1xuXG4gIC8vIEFkZCBhbGwgbXV0YXRvciBBcnJheSBmdW5jdGlvbnMgdG8gdGhlIHdyYXBwZXIuXG4gIGVhY2goWydwb3AnLCAncHVzaCcsICdyZXZlcnNlJywgJ3NoaWZ0JywgJ3NvcnQnLCAnc3BsaWNlJywgJ3Vuc2hpZnQnXSwgZnVuY3Rpb24obmFtZSkge1xuICAgIHZhciBtZXRob2QgPSBBcnJheVByb3RvW25hbWVdO1xuICAgIF8ucHJvdG90eXBlW25hbWVdID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgb2JqID0gdGhpcy5fd3JhcHBlZDtcbiAgICAgIG1ldGhvZC5hcHBseShvYmosIGFyZ3VtZW50cyk7XG4gICAgICBpZiAoKG5hbWUgPT0gJ3NoaWZ0JyB8fCBuYW1lID09ICdzcGxpY2UnKSAmJiBvYmoubGVuZ3RoID09PSAwKSBkZWxldGUgb2JqWzBdO1xuICAgICAgcmV0dXJuIHJlc3VsdC5jYWxsKHRoaXMsIG9iaik7XG4gICAgfTtcbiAgfSk7XG5cbiAgLy8gQWRkIGFsbCBhY2Nlc3NvciBBcnJheSBmdW5jdGlvbnMgdG8gdGhlIHdyYXBwZXIuXG4gIGVhY2goWydjb25jYXQnLCAnam9pbicsICdzbGljZSddLCBmdW5jdGlvbihuYW1lKSB7XG4gICAgdmFyIG1ldGhvZCA9IEFycmF5UHJvdG9bbmFtZV07XG4gICAgXy5wcm90b3R5cGVbbmFtZV0gPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiByZXN1bHQuY2FsbCh0aGlzLCBtZXRob2QuYXBwbHkodGhpcy5fd3JhcHBlZCwgYXJndW1lbnRzKSk7XG4gICAgfTtcbiAgfSk7XG5cbiAgXy5leHRlbmQoXy5wcm90b3R5cGUsIHtcblxuICAgIC8vIFN0YXJ0IGNoYWluaW5nIGEgd3JhcHBlZCBVbmRlcnNjb3JlIG9iamVjdC5cbiAgICBjaGFpbjogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLl9jaGFpbiA9IHRydWU7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgLy8gRXh0cmFjdHMgdGhlIHJlc3VsdCBmcm9tIGEgd3JhcHBlZCBhbmQgY2hhaW5lZCBvYmplY3QuXG4gICAgdmFsdWU6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMuX3dyYXBwZWQ7XG4gICAgfVxuXG4gIH0pO1xuXG59KS5jYWxsKHRoaXMpO1xuIiwibW9kdWxlLmV4cG9ydHMgPSB7XG4gIGJhbmtzOiBbIFwic3B2XCIsIFwiZmFuYVwiLCBcImxsb3lkc1wiIF0sXG4gIGN1c3RvbWVyczogW1xuICAgIHsgYmFuazogXCJzcHZcIiwgbmFtZTogXCJib2JcIiB9LFxuICAgIHsgYmFuazogXCJmYW5hXCIsIG5hbWU6IFwiYWxpY2VcIiB9LFxuICAgIHsgYmFuazogXCJsbG95ZHNcIiwgbmFtZTogXCJjcmFpZ1wiIH0sXG4gICAgeyBiYW5rOiBcImZhbmFcIiwgbmFtZTogXCJkYXZpZFwiIH0sXG4gICAgeyBiYW5rOiBcInNwdlwiLCBuYW1lOiBcImVsbGFcIiB9LFxuICAgIHsgYmFuazogXCJmYW5hXCIsIG5hbWU6IFwiZnJhbmtcIiB9LFxuICAgIHsgYmFuazogXCJzcHZcIiwgbmFtZTogXCJnZW9yZ2VcIiB9LFxuICAgIHsgYmFuazogXCJmYW5hXCIsIG5hbWU6IFwiaGFubmFoXCIgfSxcbiAgICB7IGJhbms6IFwiZmFuYVwiLCBuYW1lOiBcImphbmVcIiB9LFxuICAgIHsgYmFuazogXCJsbG95ZHNcIiwgbmFtZTogXCJrcmlzXCIgfSxcbiAgICB7IGJhbms6IFwic3B2XCIsIG5hbWU6IFwiamFtZXNcIiB9XG4gIF1cbn1cbiIsIlxuXG4vL1xuLy8gVGhlIHNoaW1zIGluIHRoaXMgZmlsZSBhcmUgbm90IGZ1bGx5IGltcGxlbWVudGVkIHNoaW1zIGZvciB0aGUgRVM1XG4vLyBmZWF0dXJlcywgYnV0IGRvIHdvcmsgZm9yIHRoZSBwYXJ0aWN1bGFyIHVzZWNhc2VzIHRoZXJlIGlzIGluXG4vLyB0aGUgb3RoZXIgbW9kdWxlcy5cbi8vXG5cbnZhciB0b1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmc7XG52YXIgaGFzT3duUHJvcGVydHkgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xuXG4vLyBBcnJheS5pc0FycmF5IGlzIHN1cHBvcnRlZCBpbiBJRTlcbmZ1bmN0aW9uIGlzQXJyYXkoeHMpIHtcbiAgcmV0dXJuIHRvU3RyaW5nLmNhbGwoeHMpID09PSAnW29iamVjdCBBcnJheV0nO1xufVxuZXhwb3J0cy5pc0FycmF5ID0gdHlwZW9mIEFycmF5LmlzQXJyYXkgPT09ICdmdW5jdGlvbicgPyBBcnJheS5pc0FycmF5IDogaXNBcnJheTtcblxuLy8gQXJyYXkucHJvdG90eXBlLmluZGV4T2YgaXMgc3VwcG9ydGVkIGluIElFOVxuZXhwb3J0cy5pbmRleE9mID0gZnVuY3Rpb24gaW5kZXhPZih4cywgeCkge1xuICBpZiAoeHMuaW5kZXhPZikgcmV0dXJuIHhzLmluZGV4T2YoeCk7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgeHMubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoeCA9PT0geHNbaV0pIHJldHVybiBpO1xuICB9XG4gIHJldHVybiAtMTtcbn07XG5cbi8vIEFycmF5LnByb3RvdHlwZS5maWx0ZXIgaXMgc3VwcG9ydGVkIGluIElFOVxuZXhwb3J0cy5maWx0ZXIgPSBmdW5jdGlvbiBmaWx0ZXIoeHMsIGZuKSB7XG4gIGlmICh4cy5maWx0ZXIpIHJldHVybiB4cy5maWx0ZXIoZm4pO1xuICB2YXIgcmVzID0gW107XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgeHMubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoZm4oeHNbaV0sIGksIHhzKSkgcmVzLnB1c2goeHNbaV0pO1xuICB9XG4gIHJldHVybiByZXM7XG59O1xuXG4vLyBBcnJheS5wcm90b3R5cGUuZm9yRWFjaCBpcyBzdXBwb3J0ZWQgaW4gSUU5XG5leHBvcnRzLmZvckVhY2ggPSBmdW5jdGlvbiBmb3JFYWNoKHhzLCBmbiwgc2VsZikge1xuICBpZiAoeHMuZm9yRWFjaCkgcmV0dXJuIHhzLmZvckVhY2goZm4sIHNlbGYpO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IHhzLmxlbmd0aDsgaSsrKSB7XG4gICAgZm4uY2FsbChzZWxmLCB4c1tpXSwgaSwgeHMpO1xuICB9XG59O1xuXG4vLyBBcnJheS5wcm90b3R5cGUubWFwIGlzIHN1cHBvcnRlZCBpbiBJRTlcbmV4cG9ydHMubWFwID0gZnVuY3Rpb24gbWFwKHhzLCBmbikge1xuICBpZiAoeHMubWFwKSByZXR1cm4geHMubWFwKGZuKTtcbiAgdmFyIG91dCA9IG5ldyBBcnJheSh4cy5sZW5ndGgpO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IHhzLmxlbmd0aDsgaSsrKSB7XG4gICAgb3V0W2ldID0gZm4oeHNbaV0sIGksIHhzKTtcbiAgfVxuICByZXR1cm4gb3V0O1xufTtcblxuLy8gQXJyYXkucHJvdG90eXBlLnJlZHVjZSBpcyBzdXBwb3J0ZWQgaW4gSUU5XG5leHBvcnRzLnJlZHVjZSA9IGZ1bmN0aW9uIHJlZHVjZShhcnJheSwgY2FsbGJhY2ssIG9wdF9pbml0aWFsVmFsdWUpIHtcbiAgaWYgKGFycmF5LnJlZHVjZSkgcmV0dXJuIGFycmF5LnJlZHVjZShjYWxsYmFjaywgb3B0X2luaXRpYWxWYWx1ZSk7XG4gIHZhciB2YWx1ZSwgaXNWYWx1ZVNldCA9IGZhbHNlO1xuXG4gIGlmICgyIDwgYXJndW1lbnRzLmxlbmd0aCkge1xuICAgIHZhbHVlID0gb3B0X2luaXRpYWxWYWx1ZTtcbiAgICBpc1ZhbHVlU2V0ID0gdHJ1ZTtcbiAgfVxuICBmb3IgKHZhciBpID0gMCwgbCA9IGFycmF5Lmxlbmd0aDsgbCA+IGk7ICsraSkge1xuICAgIGlmIChhcnJheS5oYXNPd25Qcm9wZXJ0eShpKSkge1xuICAgICAgaWYgKGlzVmFsdWVTZXQpIHtcbiAgICAgICAgdmFsdWUgPSBjYWxsYmFjayh2YWx1ZSwgYXJyYXlbaV0sIGksIGFycmF5KTtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICB2YWx1ZSA9IGFycmF5W2ldO1xuICAgICAgICBpc1ZhbHVlU2V0ID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gdmFsdWU7XG59O1xuXG4vLyBTdHJpbmcucHJvdG90eXBlLnN1YnN0ciAtIG5lZ2F0aXZlIGluZGV4IGRvbid0IHdvcmsgaW4gSUU4XG5pZiAoJ2FiJy5zdWJzdHIoLTEpICE9PSAnYicpIHtcbiAgZXhwb3J0cy5zdWJzdHIgPSBmdW5jdGlvbiAoc3RyLCBzdGFydCwgbGVuZ3RoKSB7XG4gICAgLy8gZGlkIHdlIGdldCBhIG5lZ2F0aXZlIHN0YXJ0LCBjYWxjdWxhdGUgaG93IG11Y2ggaXQgaXMgZnJvbSB0aGUgYmVnaW5uaW5nIG9mIHRoZSBzdHJpbmdcbiAgICBpZiAoc3RhcnQgPCAwKSBzdGFydCA9IHN0ci5sZW5ndGggKyBzdGFydDtcblxuICAgIC8vIGNhbGwgdGhlIG9yaWdpbmFsIGZ1bmN0aW9uXG4gICAgcmV0dXJuIHN0ci5zdWJzdHIoc3RhcnQsIGxlbmd0aCk7XG4gIH07XG59IGVsc2Uge1xuICBleHBvcnRzLnN1YnN0ciA9IGZ1bmN0aW9uIChzdHIsIHN0YXJ0LCBsZW5ndGgpIHtcbiAgICByZXR1cm4gc3RyLnN1YnN0cihzdGFydCwgbGVuZ3RoKTtcbiAgfTtcbn1cblxuLy8gU3RyaW5nLnByb3RvdHlwZS50cmltIGlzIHN1cHBvcnRlZCBpbiBJRTlcbmV4cG9ydHMudHJpbSA9IGZ1bmN0aW9uIChzdHIpIHtcbiAgaWYgKHN0ci50cmltKSByZXR1cm4gc3RyLnRyaW0oKTtcbiAgcmV0dXJuIHN0ci5yZXBsYWNlKC9eXFxzK3xcXHMrJC9nLCAnJyk7XG59O1xuXG4vLyBGdW5jdGlvbi5wcm90b3R5cGUuYmluZCBpcyBzdXBwb3J0ZWQgaW4gSUU5XG5leHBvcnRzLmJpbmQgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKTtcbiAgdmFyIGZuID0gYXJncy5zaGlmdCgpO1xuICBpZiAoZm4uYmluZCkgcmV0dXJuIGZuLmJpbmQuYXBwbHkoZm4sIGFyZ3MpO1xuICB2YXIgc2VsZiA9IGFyZ3Muc2hpZnQoKTtcbiAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICBmbi5hcHBseShzZWxmLCBhcmdzLmNvbmNhdChbQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKV0pKTtcbiAgfTtcbn07XG5cbi8vIE9iamVjdC5jcmVhdGUgaXMgc3VwcG9ydGVkIGluIElFOVxuZnVuY3Rpb24gY3JlYXRlKHByb3RvdHlwZSwgcHJvcGVydGllcykge1xuICB2YXIgb2JqZWN0O1xuICBpZiAocHJvdG90eXBlID09PSBudWxsKSB7XG4gICAgb2JqZWN0ID0geyAnX19wcm90b19fJyA6IG51bGwgfTtcbiAgfVxuICBlbHNlIHtcbiAgICBpZiAodHlwZW9mIHByb3RvdHlwZSAhPT0gJ29iamVjdCcpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAgICd0eXBlb2YgcHJvdG90eXBlWycgKyAodHlwZW9mIHByb3RvdHlwZSkgKyAnXSAhPSBcXCdvYmplY3RcXCcnXG4gICAgICApO1xuICAgIH1cbiAgICB2YXIgVHlwZSA9IGZ1bmN0aW9uICgpIHt9O1xuICAgIFR5cGUucHJvdG90eXBlID0gcHJvdG90eXBlO1xuICAgIG9iamVjdCA9IG5ldyBUeXBlKCk7XG4gICAgb2JqZWN0Ll9fcHJvdG9fXyA9IHByb3RvdHlwZTtcbiAgfVxuICBpZiAodHlwZW9mIHByb3BlcnRpZXMgIT09ICd1bmRlZmluZWQnICYmIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKSB7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnRpZXMob2JqZWN0LCBwcm9wZXJ0aWVzKTtcbiAgfVxuICByZXR1cm4gb2JqZWN0O1xufVxuZXhwb3J0cy5jcmVhdGUgPSB0eXBlb2YgT2JqZWN0LmNyZWF0ZSA9PT0gJ2Z1bmN0aW9uJyA/IE9iamVjdC5jcmVhdGUgOiBjcmVhdGU7XG5cbi8vIE9iamVjdC5rZXlzIGFuZCBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyBpcyBzdXBwb3J0ZWQgaW4gSUU5IGhvd2V2ZXJcbi8vIHRoZXkgZG8gc2hvdyBhIGRlc2NyaXB0aW9uIGFuZCBudW1iZXIgcHJvcGVydHkgb24gRXJyb3Igb2JqZWN0c1xuZnVuY3Rpb24gbm90T2JqZWN0KG9iamVjdCkge1xuICByZXR1cm4gKCh0eXBlb2Ygb2JqZWN0ICE9IFwib2JqZWN0XCIgJiYgdHlwZW9mIG9iamVjdCAhPSBcImZ1bmN0aW9uXCIpIHx8IG9iamVjdCA9PT0gbnVsbCk7XG59XG5cbmZ1bmN0aW9uIGtleXNTaGltKG9iamVjdCkge1xuICBpZiAobm90T2JqZWN0KG9iamVjdCkpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiT2JqZWN0LmtleXMgY2FsbGVkIG9uIGEgbm9uLW9iamVjdFwiKTtcbiAgfVxuXG4gIHZhciByZXN1bHQgPSBbXTtcbiAgZm9yICh2YXIgbmFtZSBpbiBvYmplY3QpIHtcbiAgICBpZiAoaGFzT3duUHJvcGVydHkuY2FsbChvYmplY3QsIG5hbWUpKSB7XG4gICAgICByZXN1bHQucHVzaChuYW1lKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLy8gZ2V0T3duUHJvcGVydHlOYW1lcyBpcyBhbG1vc3QgdGhlIHNhbWUgYXMgT2JqZWN0LmtleXMgb25lIGtleSBmZWF0dXJlXG4vLyAgaXMgdGhhdCBpdCByZXR1cm5zIGhpZGRlbiBwcm9wZXJ0aWVzLCBzaW5jZSB0aGF0IGNhbid0IGJlIGltcGxlbWVudGVkLFxuLy8gIHRoaXMgZmVhdHVyZSBnZXRzIHJlZHVjZWQgc28gaXQganVzdCBzaG93cyB0aGUgbGVuZ3RoIHByb3BlcnR5IG9uIGFycmF5c1xuZnVuY3Rpb24gcHJvcGVydHlTaGltKG9iamVjdCkge1xuICBpZiAobm90T2JqZWN0KG9iamVjdCkpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMgY2FsbGVkIG9uIGEgbm9uLW9iamVjdFwiKTtcbiAgfVxuXG4gIHZhciByZXN1bHQgPSBrZXlzU2hpbShvYmplY3QpO1xuICBpZiAoZXhwb3J0cy5pc0FycmF5KG9iamVjdCkgJiYgZXhwb3J0cy5pbmRleE9mKG9iamVjdCwgJ2xlbmd0aCcpID09PSAtMSkge1xuICAgIHJlc3VsdC5wdXNoKCdsZW5ndGgnKTtcbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufVxuXG52YXIga2V5cyA9IHR5cGVvZiBPYmplY3Qua2V5cyA9PT0gJ2Z1bmN0aW9uJyA/IE9iamVjdC5rZXlzIDoga2V5c1NoaW07XG52YXIgZ2V0T3duUHJvcGVydHlOYW1lcyA9IHR5cGVvZiBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyA9PT0gJ2Z1bmN0aW9uJyA/XG4gIE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzIDogcHJvcGVydHlTaGltO1xuXG5pZiAobmV3IEVycm9yKCkuaGFzT3duUHJvcGVydHkoJ2Rlc2NyaXB0aW9uJykpIHtcbiAgdmFyIEVSUk9SX1BST1BFUlRZX0ZJTFRFUiA9IGZ1bmN0aW9uIChvYmosIGFycmF5KSB7XG4gICAgaWYgKHRvU3RyaW5nLmNhbGwob2JqKSA9PT0gJ1tvYmplY3QgRXJyb3JdJykge1xuICAgICAgYXJyYXkgPSBleHBvcnRzLmZpbHRlcihhcnJheSwgZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgcmV0dXJuIG5hbWUgIT09ICdkZXNjcmlwdGlvbicgJiYgbmFtZSAhPT0gJ251bWJlcicgJiYgbmFtZSAhPT0gJ21lc3NhZ2UnO1xuICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiBhcnJheTtcbiAgfTtcblxuICBleHBvcnRzLmtleXMgPSBmdW5jdGlvbiAob2JqZWN0KSB7XG4gICAgcmV0dXJuIEVSUk9SX1BST1BFUlRZX0ZJTFRFUihvYmplY3QsIGtleXMob2JqZWN0KSk7XG4gIH07XG4gIGV4cG9ydHMuZ2V0T3duUHJvcGVydHlOYW1lcyA9IGZ1bmN0aW9uIChvYmplY3QpIHtcbiAgICByZXR1cm4gRVJST1JfUFJPUEVSVFlfRklMVEVSKG9iamVjdCwgZ2V0T3duUHJvcGVydHlOYW1lcyhvYmplY3QpKTtcbiAgfTtcbn0gZWxzZSB7XG4gIGV4cG9ydHMua2V5cyA9IGtleXM7XG4gIGV4cG9ydHMuZ2V0T3duUHJvcGVydHlOYW1lcyA9IGdldE93blByb3BlcnR5TmFtZXM7XG59XG5cbi8vIE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IgLSBzdXBwb3J0ZWQgaW4gSUU4IGJ1dCBvbmx5IG9uIGRvbSBlbGVtZW50c1xuZnVuY3Rpb24gdmFsdWVPYmplY3QodmFsdWUsIGtleSkge1xuICByZXR1cm4geyB2YWx1ZTogdmFsdWVba2V5XSB9O1xufVxuXG5pZiAodHlwZW9mIE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IgPT09ICdmdW5jdGlvbicpIHtcbiAgdHJ5IHtcbiAgICBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHsnYSc6IDF9LCAnYScpO1xuICAgIGV4cG9ydHMuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcjtcbiAgfSBjYXRjaCAoZSkge1xuICAgIC8vIElFOCBkb20gZWxlbWVudCBpc3N1ZSAtIHVzZSBhIHRyeSBjYXRjaCBhbmQgZGVmYXVsdCB0byB2YWx1ZU9iamVjdFxuICAgIGV4cG9ydHMuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yID0gZnVuY3Rpb24gKHZhbHVlLCBrZXkpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIHJldHVybiBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHZhbHVlLCBrZXkpO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICByZXR1cm4gdmFsdWVPYmplY3QodmFsdWUsIGtleSk7XG4gICAgICB9XG4gICAgfTtcbiAgfVxufSBlbHNlIHtcbiAgZXhwb3J0cy5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IgPSB2YWx1ZU9iamVjdDtcbn1cbiIsIi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG52YXIgdXRpbCA9IHJlcXVpcmUoJ3V0aWwnKTtcblxuZnVuY3Rpb24gRXZlbnRFbWl0dGVyKCkge1xuICB0aGlzLl9ldmVudHMgPSB0aGlzLl9ldmVudHMgfHwge307XG4gIHRoaXMuX21heExpc3RlbmVycyA9IHRoaXMuX21heExpc3RlbmVycyB8fCB1bmRlZmluZWQ7XG59XG5tb2R1bGUuZXhwb3J0cyA9IEV2ZW50RW1pdHRlcjtcblxuLy8gQmFja3dhcmRzLWNvbXBhdCB3aXRoIG5vZGUgMC4xMC54XG5FdmVudEVtaXR0ZXIuRXZlbnRFbWl0dGVyID0gRXZlbnRFbWl0dGVyO1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLl9ldmVudHMgPSB1bmRlZmluZWQ7XG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLl9tYXhMaXN0ZW5lcnMgPSB1bmRlZmluZWQ7XG5cbi8vIEJ5IGRlZmF1bHQgRXZlbnRFbWl0dGVycyB3aWxsIHByaW50IGEgd2FybmluZyBpZiBtb3JlIHRoYW4gMTAgbGlzdGVuZXJzIGFyZVxuLy8gYWRkZWQgdG8gaXQuIFRoaXMgaXMgYSB1c2VmdWwgZGVmYXVsdCB3aGljaCBoZWxwcyBmaW5kaW5nIG1lbW9yeSBsZWFrcy5cbkV2ZW50RW1pdHRlci5kZWZhdWx0TWF4TGlzdGVuZXJzID0gMTA7XG5cbi8vIE9idmlvdXNseSBub3QgYWxsIEVtaXR0ZXJzIHNob3VsZCBiZSBsaW1pdGVkIHRvIDEwLiBUaGlzIGZ1bmN0aW9uIGFsbG93c1xuLy8gdGhhdCB0byBiZSBpbmNyZWFzZWQuIFNldCB0byB6ZXJvIGZvciB1bmxpbWl0ZWQuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnNldE1heExpc3RlbmVycyA9IGZ1bmN0aW9uKG4pIHtcbiAgaWYgKCF1dGlsLmlzTnVtYmVyKG4pIHx8IG4gPCAwKVxuICAgIHRocm93IFR5cGVFcnJvcignbiBtdXN0IGJlIGEgcG9zaXRpdmUgbnVtYmVyJyk7XG4gIHRoaXMuX21heExpc3RlbmVycyA9IG47XG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5lbWl0ID0gZnVuY3Rpb24odHlwZSkge1xuICB2YXIgZXIsIGhhbmRsZXIsIGxlbiwgYXJncywgaSwgbGlzdGVuZXJzO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuXG4gIC8vIElmIHRoZXJlIGlzIG5vICdlcnJvcicgZXZlbnQgbGlzdGVuZXIgdGhlbiB0aHJvdy5cbiAgaWYgKHR5cGUgPT09ICdlcnJvcicpIHtcbiAgICBpZiAoIXRoaXMuX2V2ZW50cy5lcnJvciB8fFxuICAgICAgICAodXRpbC5pc09iamVjdCh0aGlzLl9ldmVudHMuZXJyb3IpICYmICF0aGlzLl9ldmVudHMuZXJyb3IubGVuZ3RoKSkge1xuICAgICAgZXIgPSBhcmd1bWVudHNbMV07XG4gICAgICBpZiAoZXIgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgICB0aHJvdyBlcjsgLy8gVW5oYW5kbGVkICdlcnJvcicgZXZlbnRcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IFR5cGVFcnJvcignVW5jYXVnaHQsIHVuc3BlY2lmaWVkIFwiZXJyb3JcIiBldmVudC4nKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cblxuICBoYW5kbGVyID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gIGlmICh1dGlsLmlzVW5kZWZpbmVkKGhhbmRsZXIpKVxuICAgIHJldHVybiBmYWxzZTtcblxuICBpZiAodXRpbC5pc0Z1bmN0aW9uKGhhbmRsZXIpKSB7XG4gICAgc3dpdGNoIChhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAvLyBmYXN0IGNhc2VzXG4gICAgICBjYXNlIDE6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDI6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0pO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMzpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMsIGFyZ3VtZW50c1sxXSwgYXJndW1lbnRzWzJdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICAvLyBzbG93ZXJcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGxlbiA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgICAgIGFyZ3MgPSBuZXcgQXJyYXkobGVuIC0gMSk7XG4gICAgICAgIGZvciAoaSA9IDE7IGkgPCBsZW47IGkrKylcbiAgICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgaGFuZGxlci5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAodXRpbC5pc09iamVjdChoYW5kbGVyKSkge1xuICAgIGxlbiA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgYXJncyA9IG5ldyBBcnJheShsZW4gLSAxKTtcbiAgICBmb3IgKGkgPSAxOyBpIDwgbGVuOyBpKyspXG4gICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcblxuICAgIGxpc3RlbmVycyA9IGhhbmRsZXIuc2xpY2UoKTtcbiAgICBsZW4gPSBsaXN0ZW5lcnMubGVuZ3RoO1xuICAgIGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKylcbiAgICAgIGxpc3RlbmVyc1tpXS5hcHBseSh0aGlzLCBhcmdzKTtcbiAgfVxuXG4gIHJldHVybiB0cnVlO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lciA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIHZhciBtO1xuXG4gIGlmICghdXRpbC5pc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuXG4gIC8vIFRvIGF2b2lkIHJlY3Vyc2lvbiBpbiB0aGUgY2FzZSB0aGF0IHR5cGUgPT09IFwibmV3TGlzdGVuZXJcIiEgQmVmb3JlXG4gIC8vIGFkZGluZyBpdCB0byB0aGUgbGlzdGVuZXJzLCBmaXJzdCBlbWl0IFwibmV3TGlzdGVuZXJcIi5cbiAgaWYgKHRoaXMuX2V2ZW50cy5uZXdMaXN0ZW5lcilcbiAgICB0aGlzLmVtaXQoJ25ld0xpc3RlbmVyJywgdHlwZSxcbiAgICAgICAgICAgICAgdXRpbC5pc0Z1bmN0aW9uKGxpc3RlbmVyLmxpc3RlbmVyKSA/XG4gICAgICAgICAgICAgIGxpc3RlbmVyLmxpc3RlbmVyIDogbGlzdGVuZXIpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgIC8vIE9wdGltaXplIHRoZSBjYXNlIG9mIG9uZSBsaXN0ZW5lci4gRG9uJ3QgbmVlZCB0aGUgZXh0cmEgYXJyYXkgb2JqZWN0LlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IGxpc3RlbmVyO1xuICBlbHNlIGlmICh1dGlsLmlzT2JqZWN0KHRoaXMuX2V2ZW50c1t0eXBlXSkpXG4gICAgLy8gSWYgd2UndmUgYWxyZWFkeSBnb3QgYW4gYXJyYXksIGp1c3QgYXBwZW5kLlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXS5wdXNoKGxpc3RlbmVyKTtcbiAgZWxzZVxuICAgIC8vIEFkZGluZyB0aGUgc2Vjb25kIGVsZW1lbnQsIG5lZWQgdG8gY2hhbmdlIHRvIGFycmF5LlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IFt0aGlzLl9ldmVudHNbdHlwZV0sIGxpc3RlbmVyXTtcblxuICAvLyBDaGVjayBmb3IgbGlzdGVuZXIgbGVha1xuICBpZiAodXRpbC5pc09iamVjdCh0aGlzLl9ldmVudHNbdHlwZV0pICYmICF0aGlzLl9ldmVudHNbdHlwZV0ud2FybmVkKSB7XG4gICAgdmFyIG07XG4gICAgaWYgKCF1dGlsLmlzVW5kZWZpbmVkKHRoaXMuX21heExpc3RlbmVycykpIHtcbiAgICAgIG0gPSB0aGlzLl9tYXhMaXN0ZW5lcnM7XG4gICAgfSBlbHNlIHtcbiAgICAgIG0gPSBFdmVudEVtaXR0ZXIuZGVmYXVsdE1heExpc3RlbmVycztcbiAgICB9XG5cbiAgICBpZiAobSAmJiBtID4gMCAmJiB0aGlzLl9ldmVudHNbdHlwZV0ubGVuZ3RoID4gbSkge1xuICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLndhcm5lZCA9IHRydWU7XG4gICAgICBjb25zb2xlLmVycm9yKCcobm9kZSkgd2FybmluZzogcG9zc2libGUgRXZlbnRFbWl0dGVyIG1lbW9yeSAnICtcbiAgICAgICAgICAgICAgICAgICAgJ2xlYWsgZGV0ZWN0ZWQuICVkIGxpc3RlbmVycyBhZGRlZC4gJyArXG4gICAgICAgICAgICAgICAgICAgICdVc2UgZW1pdHRlci5zZXRNYXhMaXN0ZW5lcnMoKSB0byBpbmNyZWFzZSBsaW1pdC4nLFxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9ldmVudHNbdHlwZV0ubGVuZ3RoKTtcbiAgICAgIGNvbnNvbGUudHJhY2UoKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub24gPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyO1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uY2UgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICBpZiAoIXV0aWwuaXNGdW5jdGlvbihsaXN0ZW5lcikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCdsaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcblxuICBmdW5jdGlvbiBnKCkge1xuICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgZyk7XG4gICAgbGlzdGVuZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfVxuXG4gIGcubGlzdGVuZXIgPSBsaXN0ZW5lcjtcbiAgdGhpcy5vbih0eXBlLCBnKTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8vIGVtaXRzIGEgJ3JlbW92ZUxpc3RlbmVyJyBldmVudCBpZmYgdGhlIGxpc3RlbmVyIHdhcyByZW1vdmVkXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgdmFyIGxpc3QsIHBvc2l0aW9uLCBsZW5ndGgsIGk7XG5cbiAgaWYgKCF1dGlsLmlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICByZXR1cm4gdGhpcztcblxuICBsaXN0ID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuICBsZW5ndGggPSBsaXN0Lmxlbmd0aDtcbiAgcG9zaXRpb24gPSAtMTtcblxuICBpZiAobGlzdCA9PT0gbGlzdGVuZXIgfHxcbiAgICAgICh1dGlsLmlzRnVuY3Rpb24obGlzdC5saXN0ZW5lcikgJiYgbGlzdC5saXN0ZW5lciA9PT0gbGlzdGVuZXIpKSB7XG4gICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICBpZiAodGhpcy5fZXZlbnRzLnJlbW92ZUxpc3RlbmVyKVxuICAgICAgdGhpcy5lbWl0KCdyZW1vdmVMaXN0ZW5lcicsIHR5cGUsIGxpc3RlbmVyKTtcblxuICB9IGVsc2UgaWYgKHV0aWwuaXNPYmplY3QobGlzdCkpIHtcbiAgICBmb3IgKGkgPSBsZW5ndGg7IGktLSA+IDA7KSB7XG4gICAgICBpZiAobGlzdFtpXSA9PT0gbGlzdGVuZXIgfHxcbiAgICAgICAgICAobGlzdFtpXS5saXN0ZW5lciAmJiBsaXN0W2ldLmxpc3RlbmVyID09PSBsaXN0ZW5lcikpIHtcbiAgICAgICAgcG9zaXRpb24gPSBpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAocG9zaXRpb24gPCAwKVxuICAgICAgcmV0dXJuIHRoaXM7XG5cbiAgICBpZiAobGlzdC5sZW5ndGggPT09IDEpIHtcbiAgICAgIGxpc3QubGVuZ3RoID0gMDtcbiAgICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgfSBlbHNlIHtcbiAgICAgIGxpc3Quc3BsaWNlKHBvc2l0aW9uLCAxKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fZXZlbnRzLnJlbW92ZUxpc3RlbmVyKVxuICAgICAgdGhpcy5lbWl0KCdyZW1vdmVMaXN0ZW5lcicsIHR5cGUsIGxpc3RlbmVyKTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBmdW5jdGlvbih0eXBlKSB7XG4gIHZhciBrZXksIGxpc3RlbmVycztcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICByZXR1cm4gdGhpcztcblxuICAvLyBub3QgbGlzdGVuaW5nIGZvciByZW1vdmVMaXN0ZW5lciwgbm8gbmVlZCB0byBlbWl0XG4gIGlmICghdGhpcy5fZXZlbnRzLnJlbW92ZUxpc3RlbmVyKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApXG4gICAgICB0aGlzLl9ldmVudHMgPSB7fTtcbiAgICBlbHNlIGlmICh0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gZW1pdCByZW1vdmVMaXN0ZW5lciBmb3IgYWxsIGxpc3RlbmVycyBvbiBhbGwgZXZlbnRzXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgZm9yIChrZXkgaW4gdGhpcy5fZXZlbnRzKSB7XG4gICAgICBpZiAoa2V5ID09PSAncmVtb3ZlTGlzdGVuZXInKSBjb250aW51ZTtcbiAgICAgIHRoaXMucmVtb3ZlQWxsTGlzdGVuZXJzKGtleSk7XG4gICAgfVxuICAgIHRoaXMucmVtb3ZlQWxsTGlzdGVuZXJzKCdyZW1vdmVMaXN0ZW5lcicpO1xuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgbGlzdGVuZXJzID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gIGlmICh1dGlsLmlzRnVuY3Rpb24obGlzdGVuZXJzKSkge1xuICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgbGlzdGVuZXJzKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBMSUZPIG9yZGVyXG4gICAgd2hpbGUgKGxpc3RlbmVycy5sZW5ndGgpXG4gICAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGxpc3RlbmVyc1tsaXN0ZW5lcnMubGVuZ3RoIC0gMV0pO1xuICB9XG4gIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmxpc3RlbmVycyA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIHJldDtcbiAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICByZXQgPSBbXTtcbiAgZWxzZSBpZiAodXRpbC5pc0Z1bmN0aW9uKHRoaXMuX2V2ZW50c1t0eXBlXSkpXG4gICAgcmV0ID0gW3RoaXMuX2V2ZW50c1t0eXBlXV07XG4gIGVsc2VcbiAgICByZXQgPSB0aGlzLl9ldmVudHNbdHlwZV0uc2xpY2UoKTtcbiAgcmV0dXJuIHJldDtcbn07XG5cbkV2ZW50RW1pdHRlci5saXN0ZW5lckNvdW50ID0gZnVuY3Rpb24oZW1pdHRlciwgdHlwZSkge1xuICB2YXIgcmV0O1xuICBpZiAoIWVtaXR0ZXIuX2V2ZW50cyB8fCAhZW1pdHRlci5fZXZlbnRzW3R5cGVdKVxuICAgIHJldCA9IDA7XG4gIGVsc2UgaWYgKHV0aWwuaXNGdW5jdGlvbihlbWl0dGVyLl9ldmVudHNbdHlwZV0pKVxuICAgIHJldCA9IDE7XG4gIGVsc2VcbiAgICByZXQgPSBlbWl0dGVyLl9ldmVudHNbdHlwZV0ubGVuZ3RoO1xuICByZXR1cm4gcmV0O1xufTsiLCJcbi8vIG5vdCBpbXBsZW1lbnRlZFxuLy8gVGhlIHJlYXNvbiBmb3IgaGF2aW5nIGFuIGVtcHR5IGZpbGUgYW5kIG5vdCB0aHJvd2luZyBpcyB0byBhbGxvd1xuLy8gdW50cmFkaXRpb25hbCBpbXBsZW1lbnRhdGlvbiBvZiB0aGlzIG1vZHVsZS5cbiIsIi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG52YXIgc2hpbXMgPSByZXF1aXJlKCdfc2hpbXMnKTtcblxudmFyIGZvcm1hdFJlZ0V4cCA9IC8lW3NkaiVdL2c7XG5leHBvcnRzLmZvcm1hdCA9IGZ1bmN0aW9uKGYpIHtcbiAgaWYgKCFpc1N0cmluZyhmKSkge1xuICAgIHZhciBvYmplY3RzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIG9iamVjdHMucHVzaChpbnNwZWN0KGFyZ3VtZW50c1tpXSkpO1xuICAgIH1cbiAgICByZXR1cm4gb2JqZWN0cy5qb2luKCcgJyk7XG4gIH1cblxuICB2YXIgaSA9IDE7XG4gIHZhciBhcmdzID0gYXJndW1lbnRzO1xuICB2YXIgbGVuID0gYXJncy5sZW5ndGg7XG4gIHZhciBzdHIgPSBTdHJpbmcoZikucmVwbGFjZShmb3JtYXRSZWdFeHAsIGZ1bmN0aW9uKHgpIHtcbiAgICBpZiAoeCA9PT0gJyUlJykgcmV0dXJuICclJztcbiAgICBpZiAoaSA+PSBsZW4pIHJldHVybiB4O1xuICAgIHN3aXRjaCAoeCkge1xuICAgICAgY2FzZSAnJXMnOiByZXR1cm4gU3RyaW5nKGFyZ3NbaSsrXSk7XG4gICAgICBjYXNlICclZCc6IHJldHVybiBOdW1iZXIoYXJnc1tpKytdKTtcbiAgICAgIGNhc2UgJyVqJzpcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoYXJnc1tpKytdKTtcbiAgICAgICAgfSBjYXRjaCAoXykge1xuICAgICAgICAgIHJldHVybiAnW0NpcmN1bGFyXSc7XG4gICAgICAgIH1cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiB4O1xuICAgIH1cbiAgfSk7XG4gIGZvciAodmFyIHggPSBhcmdzW2ldOyBpIDwgbGVuOyB4ID0gYXJnc1srK2ldKSB7XG4gICAgaWYgKGlzTnVsbCh4KSB8fCAhaXNPYmplY3QoeCkpIHtcbiAgICAgIHN0ciArPSAnICcgKyB4O1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgKz0gJyAnICsgaW5zcGVjdCh4KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHN0cjtcbn07XG5cbi8qKlxuICogRWNob3MgdGhlIHZhbHVlIG9mIGEgdmFsdWUuIFRyeXMgdG8gcHJpbnQgdGhlIHZhbHVlIG91dFxuICogaW4gdGhlIGJlc3Qgd2F5IHBvc3NpYmxlIGdpdmVuIHRoZSBkaWZmZXJlbnQgdHlwZXMuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9iaiBUaGUgb2JqZWN0IHRvIHByaW50IG91dC5cbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzIE9wdGlvbmFsIG9wdGlvbnMgb2JqZWN0IHRoYXQgYWx0ZXJzIHRoZSBvdXRwdXQuXG4gKi9cbi8qIGxlZ2FjeTogb2JqLCBzaG93SGlkZGVuLCBkZXB0aCwgY29sb3JzKi9cbmZ1bmN0aW9uIGluc3BlY3Qob2JqLCBvcHRzKSB7XG4gIC8vIGRlZmF1bHQgb3B0aW9uc1xuICB2YXIgY3R4ID0ge1xuICAgIHNlZW46IFtdLFxuICAgIHN0eWxpemU6IHN0eWxpemVOb0NvbG9yXG4gIH07XG4gIC8vIGxlZ2FjeS4uLlxuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+PSAzKSBjdHguZGVwdGggPSBhcmd1bWVudHNbMl07XG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID49IDQpIGN0eC5jb2xvcnMgPSBhcmd1bWVudHNbM107XG4gIGlmIChpc0Jvb2xlYW4ob3B0cykpIHtcbiAgICAvLyBsZWdhY3kuLi5cbiAgICBjdHguc2hvd0hpZGRlbiA9IG9wdHM7XG4gIH0gZWxzZSBpZiAob3B0cykge1xuICAgIC8vIGdvdCBhbiBcIm9wdGlvbnNcIiBvYmplY3RcbiAgICBleHBvcnRzLl9leHRlbmQoY3R4LCBvcHRzKTtcbiAgfVxuICAvLyBzZXQgZGVmYXVsdCBvcHRpb25zXG4gIGlmIChpc1VuZGVmaW5lZChjdHguc2hvd0hpZGRlbikpIGN0eC5zaG93SGlkZGVuID0gZmFsc2U7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguZGVwdGgpKSBjdHguZGVwdGggPSAyO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmNvbG9ycykpIGN0eC5jb2xvcnMgPSBmYWxzZTtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5jdXN0b21JbnNwZWN0KSkgY3R4LmN1c3RvbUluc3BlY3QgPSB0cnVlO1xuICBpZiAoY3R4LmNvbG9ycykgY3R4LnN0eWxpemUgPSBzdHlsaXplV2l0aENvbG9yO1xuICByZXR1cm4gZm9ybWF0VmFsdWUoY3R4LCBvYmosIGN0eC5kZXB0aCk7XG59XG5leHBvcnRzLmluc3BlY3QgPSBpbnNwZWN0O1xuXG5cbi8vIGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvQU5TSV9lc2NhcGVfY29kZSNncmFwaGljc1xuaW5zcGVjdC5jb2xvcnMgPSB7XG4gICdib2xkJyA6IFsxLCAyMl0sXG4gICdpdGFsaWMnIDogWzMsIDIzXSxcbiAgJ3VuZGVybGluZScgOiBbNCwgMjRdLFxuICAnaW52ZXJzZScgOiBbNywgMjddLFxuICAnd2hpdGUnIDogWzM3LCAzOV0sXG4gICdncmV5JyA6IFs5MCwgMzldLFxuICAnYmxhY2snIDogWzMwLCAzOV0sXG4gICdibHVlJyA6IFszNCwgMzldLFxuICAnY3lhbicgOiBbMzYsIDM5XSxcbiAgJ2dyZWVuJyA6IFszMiwgMzldLFxuICAnbWFnZW50YScgOiBbMzUsIDM5XSxcbiAgJ3JlZCcgOiBbMzEsIDM5XSxcbiAgJ3llbGxvdycgOiBbMzMsIDM5XVxufTtcblxuLy8gRG9uJ3QgdXNlICdibHVlJyBub3QgdmlzaWJsZSBvbiBjbWQuZXhlXG5pbnNwZWN0LnN0eWxlcyA9IHtcbiAgJ3NwZWNpYWwnOiAnY3lhbicsXG4gICdudW1iZXInOiAneWVsbG93JyxcbiAgJ2Jvb2xlYW4nOiAneWVsbG93JyxcbiAgJ3VuZGVmaW5lZCc6ICdncmV5JyxcbiAgJ251bGwnOiAnYm9sZCcsXG4gICdzdHJpbmcnOiAnZ3JlZW4nLFxuICAnZGF0ZSc6ICdtYWdlbnRhJyxcbiAgLy8gXCJuYW1lXCI6IGludGVudGlvbmFsbHkgbm90IHN0eWxpbmdcbiAgJ3JlZ2V4cCc6ICdyZWQnXG59O1xuXG5cbmZ1bmN0aW9uIHN0eWxpemVXaXRoQ29sb3Ioc3RyLCBzdHlsZVR5cGUpIHtcbiAgdmFyIHN0eWxlID0gaW5zcGVjdC5zdHlsZXNbc3R5bGVUeXBlXTtcblxuICBpZiAoc3R5bGUpIHtcbiAgICByZXR1cm4gJ1xcdTAwMWJbJyArIGluc3BlY3QuY29sb3JzW3N0eWxlXVswXSArICdtJyArIHN0ciArXG4gICAgICAgICAgICdcXHUwMDFiWycgKyBpbnNwZWN0LmNvbG9yc1tzdHlsZV1bMV0gKyAnbSc7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHN0cjtcbiAgfVxufVxuXG5cbmZ1bmN0aW9uIHN0eWxpemVOb0NvbG9yKHN0ciwgc3R5bGVUeXBlKSB7XG4gIHJldHVybiBzdHI7XG59XG5cblxuZnVuY3Rpb24gYXJyYXlUb0hhc2goYXJyYXkpIHtcbiAgdmFyIGhhc2ggPSB7fTtcblxuICBzaGltcy5mb3JFYWNoKGFycmF5LCBmdW5jdGlvbih2YWwsIGlkeCkge1xuICAgIGhhc2hbdmFsXSA9IHRydWU7XG4gIH0pO1xuXG4gIHJldHVybiBoYXNoO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFZhbHVlKGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcykge1xuICAvLyBQcm92aWRlIGEgaG9vayBmb3IgdXNlci1zcGVjaWZpZWQgaW5zcGVjdCBmdW5jdGlvbnMuXG4gIC8vIENoZWNrIHRoYXQgdmFsdWUgaXMgYW4gb2JqZWN0IHdpdGggYW4gaW5zcGVjdCBmdW5jdGlvbiBvbiBpdFxuICBpZiAoY3R4LmN1c3RvbUluc3BlY3QgJiZcbiAgICAgIHZhbHVlICYmXG4gICAgICBpc0Z1bmN0aW9uKHZhbHVlLmluc3BlY3QpICYmXG4gICAgICAvLyBGaWx0ZXIgb3V0IHRoZSB1dGlsIG1vZHVsZSwgaXQncyBpbnNwZWN0IGZ1bmN0aW9uIGlzIHNwZWNpYWxcbiAgICAgIHZhbHVlLmluc3BlY3QgIT09IGV4cG9ydHMuaW5zcGVjdCAmJlxuICAgICAgLy8gQWxzbyBmaWx0ZXIgb3V0IGFueSBwcm90b3R5cGUgb2JqZWN0cyB1c2luZyB0aGUgY2lyY3VsYXIgY2hlY2suXG4gICAgICAhKHZhbHVlLmNvbnN0cnVjdG9yICYmIHZhbHVlLmNvbnN0cnVjdG9yLnByb3RvdHlwZSA9PT0gdmFsdWUpKSB7XG4gICAgdmFyIHJldCA9IHZhbHVlLmluc3BlY3QocmVjdXJzZVRpbWVzKTtcbiAgICBpZiAoIWlzU3RyaW5nKHJldCkpIHtcbiAgICAgIHJldCA9IGZvcm1hdFZhbHVlKGN0eCwgcmV0LCByZWN1cnNlVGltZXMpO1xuICAgIH1cbiAgICByZXR1cm4gcmV0O1xuICB9XG5cbiAgLy8gUHJpbWl0aXZlIHR5cGVzIGNhbm5vdCBoYXZlIHByb3BlcnRpZXNcbiAgdmFyIHByaW1pdGl2ZSA9IGZvcm1hdFByaW1pdGl2ZShjdHgsIHZhbHVlKTtcbiAgaWYgKHByaW1pdGl2ZSkge1xuICAgIHJldHVybiBwcmltaXRpdmU7XG4gIH1cblxuICAvLyBMb29rIHVwIHRoZSBrZXlzIG9mIHRoZSBvYmplY3QuXG4gIHZhciBrZXlzID0gc2hpbXMua2V5cyh2YWx1ZSk7XG4gIHZhciB2aXNpYmxlS2V5cyA9IGFycmF5VG9IYXNoKGtleXMpO1xuXG4gIGlmIChjdHguc2hvd0hpZGRlbikge1xuICAgIGtleXMgPSBzaGltcy5nZXRPd25Qcm9wZXJ0eU5hbWVzKHZhbHVlKTtcbiAgfVxuXG4gIC8vIFNvbWUgdHlwZSBvZiBvYmplY3Qgd2l0aG91dCBwcm9wZXJ0aWVzIGNhbiBiZSBzaG9ydGN1dHRlZC5cbiAgaWYgKGtleXMubGVuZ3RoID09PSAwKSB7XG4gICAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgICB2YXIgbmFtZSA9IHZhbHVlLm5hbWUgPyAnOiAnICsgdmFsdWUubmFtZSA6ICcnO1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKCdbRnVuY3Rpb24nICsgbmFtZSArICddJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gICAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKFJlZ0V4cC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdyZWdleHAnKTtcbiAgICB9XG4gICAgaWYgKGlzRGF0ZSh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShEYXRlLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ2RhdGUnKTtcbiAgICB9XG4gICAgaWYgKGlzRXJyb3IodmFsdWUpKSB7XG4gICAgICByZXR1cm4gZm9ybWF0RXJyb3IodmFsdWUpO1xuICAgIH1cbiAgfVxuXG4gIHZhciBiYXNlID0gJycsIGFycmF5ID0gZmFsc2UsIGJyYWNlcyA9IFsneycsICd9J107XG5cbiAgLy8gTWFrZSBBcnJheSBzYXkgdGhhdCB0aGV5IGFyZSBBcnJheVxuICBpZiAoaXNBcnJheSh2YWx1ZSkpIHtcbiAgICBhcnJheSA9IHRydWU7XG4gICAgYnJhY2VzID0gWydbJywgJ10nXTtcbiAgfVxuXG4gIC8vIE1ha2UgZnVuY3Rpb25zIHNheSB0aGF0IHRoZXkgYXJlIGZ1bmN0aW9uc1xuICBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcbiAgICB2YXIgbiA9IHZhbHVlLm5hbWUgPyAnOiAnICsgdmFsdWUubmFtZSA6ICcnO1xuICAgIGJhc2UgPSAnIFtGdW5jdGlvbicgKyBuICsgJ10nO1xuICB9XG5cbiAgLy8gTWFrZSBSZWdFeHBzIHNheSB0aGF0IHRoZXkgYXJlIFJlZ0V4cHNcbiAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpO1xuICB9XG5cbiAgLy8gTWFrZSBkYXRlcyB3aXRoIHByb3BlcnRpZXMgZmlyc3Qgc2F5IHRoZSBkYXRlXG4gIGlmIChpc0RhdGUodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIERhdGUucHJvdG90eXBlLnRvVVRDU3RyaW5nLmNhbGwodmFsdWUpO1xuICB9XG5cbiAgLy8gTWFrZSBlcnJvciB3aXRoIG1lc3NhZ2UgZmlyc3Qgc2F5IHRoZSBlcnJvclxuICBpZiAoaXNFcnJvcih2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgZm9ybWF0RXJyb3IodmFsdWUpO1xuICB9XG5cbiAgaWYgKGtleXMubGVuZ3RoID09PSAwICYmICghYXJyYXkgfHwgdmFsdWUubGVuZ3RoID09IDApKSB7XG4gICAgcmV0dXJuIGJyYWNlc1swXSArIGJhc2UgKyBicmFjZXNbMV07XG4gIH1cblxuICBpZiAocmVjdXJzZVRpbWVzIDwgMCkge1xuICAgIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAncmVnZXhwJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZSgnW09iamVjdF0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuXG4gIGN0eC5zZWVuLnB1c2godmFsdWUpO1xuXG4gIHZhciBvdXRwdXQ7XG4gIGlmIChhcnJheSkge1xuICAgIG91dHB1dCA9IGZvcm1hdEFycmF5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleXMpO1xuICB9IGVsc2Uge1xuICAgIG91dHB1dCA9IGtleXMubWFwKGZ1bmN0aW9uKGtleSkge1xuICAgICAgcmV0dXJuIGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleSwgYXJyYXkpO1xuICAgIH0pO1xuICB9XG5cbiAgY3R4LnNlZW4ucG9wKCk7XG5cbiAgcmV0dXJuIHJlZHVjZVRvU2luZ2xlU3RyaW5nKG91dHB1dCwgYmFzZSwgYnJhY2VzKTtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRQcmltaXRpdmUoY3R4LCB2YWx1ZSkge1xuICBpZiAoaXNVbmRlZmluZWQodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgndW5kZWZpbmVkJywgJ3VuZGVmaW5lZCcpO1xuICBpZiAoaXNTdHJpbmcodmFsdWUpKSB7XG4gICAgdmFyIHNpbXBsZSA9ICdcXCcnICsgSlNPTi5zdHJpbmdpZnkodmFsdWUpLnJlcGxhY2UoL15cInxcIiQvZywgJycpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvJy9nLCBcIlxcXFwnXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxcXFwiL2csICdcIicpICsgJ1xcJyc7XG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKHNpbXBsZSwgJ3N0cmluZycpO1xuICB9XG4gIGlmIChpc051bWJlcih2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCcnICsgdmFsdWUsICdudW1iZXInKTtcbiAgaWYgKGlzQm9vbGVhbih2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCcnICsgdmFsdWUsICdib29sZWFuJyk7XG4gIC8vIEZvciBzb21lIHJlYXNvbiB0eXBlb2YgbnVsbCBpcyBcIm9iamVjdFwiLCBzbyBzcGVjaWFsIGNhc2UgaGVyZS5cbiAgaWYgKGlzTnVsbCh2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCdudWxsJywgJ251bGwnKTtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRFcnJvcih2YWx1ZSkge1xuICByZXR1cm4gJ1snICsgRXJyb3IucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpICsgJ10nO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdEFycmF5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleXMpIHtcbiAgdmFyIG91dHB1dCA9IFtdO1xuICBmb3IgKHZhciBpID0gMCwgbCA9IHZhbHVlLmxlbmd0aDsgaSA8IGw7ICsraSkge1xuICAgIGlmIChoYXNPd25Qcm9wZXJ0eSh2YWx1ZSwgU3RyaW5nKGkpKSkge1xuICAgICAgb3V0cHV0LnB1c2goZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cyxcbiAgICAgICAgICBTdHJpbmcoaSksIHRydWUpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgb3V0cHV0LnB1c2goJycpO1xuICAgIH1cbiAgfVxuXG4gIHNoaW1zLmZvckVhY2goa2V5cywgZnVuY3Rpb24oa2V5KSB7XG4gICAgaWYgKCFrZXkubWF0Y2goL15cXGQrJC8pKSB7XG4gICAgICBvdXRwdXQucHVzaChmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLFxuICAgICAgICAgIGtleSwgdHJ1ZSkpO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiBvdXRwdXQ7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5LCBhcnJheSkge1xuICB2YXIgbmFtZSwgc3RyLCBkZXNjO1xuICBkZXNjID0gc2hpbXMuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHZhbHVlLCBrZXkpIHx8IHsgdmFsdWU6IHZhbHVlW2tleV0gfTtcbiAgaWYgKGRlc2MuZ2V0KSB7XG4gICAgaWYgKGRlc2Muc2V0KSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0dldHRlci9TZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tHZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgaWYgKGRlc2Muc2V0KSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW1NldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuXG4gIGlmICghaGFzT3duUHJvcGVydHkodmlzaWJsZUtleXMsIGtleSkpIHtcbiAgICBuYW1lID0gJ1snICsga2V5ICsgJ10nO1xuICB9XG4gIGlmICghc3RyKSB7XG4gICAgaWYgKHNoaW1zLmluZGV4T2YoY3R4LnNlZW4sIGRlc2MudmFsdWUpIDwgMCkge1xuICAgICAgaWYgKGlzTnVsbChyZWN1cnNlVGltZXMpKSB7XG4gICAgICAgIHN0ciA9IGZvcm1hdFZhbHVlKGN0eCwgZGVzYy52YWx1ZSwgbnVsbCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzdHIgPSBmb3JtYXRWYWx1ZShjdHgsIGRlc2MudmFsdWUsIHJlY3Vyc2VUaW1lcyAtIDEpO1xuICAgICAgfVxuICAgICAgaWYgKHN0ci5pbmRleE9mKCdcXG4nKSA+IC0xKSB7XG4gICAgICAgIGlmIChhcnJheSkge1xuICAgICAgICAgIHN0ciA9IHN0ci5zcGxpdCgnXFxuJykubWFwKGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgICAgICAgIHJldHVybiAnICAnICsgbGluZTtcbiAgICAgICAgICB9KS5qb2luKCdcXG4nKS5zdWJzdHIoMik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc3RyID0gJ1xcbicgKyBzdHIuc3BsaXQoJ1xcbicpLm1hcChmdW5jdGlvbihsaW5lKSB7XG4gICAgICAgICAgICByZXR1cm4gJyAgICcgKyBsaW5lO1xuICAgICAgICAgIH0pLmpvaW4oJ1xcbicpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbQ2lyY3VsYXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cbiAgaWYgKGlzVW5kZWZpbmVkKG5hbWUpKSB7XG4gICAgaWYgKGFycmF5ICYmIGtleS5tYXRjaCgvXlxcZCskLykpIHtcbiAgICAgIHJldHVybiBzdHI7XG4gICAgfVxuICAgIG5hbWUgPSBKU09OLnN0cmluZ2lmeSgnJyArIGtleSk7XG4gICAgaWYgKG5hbWUubWF0Y2goL15cIihbYS16QS1aX11bYS16QS1aXzAtOV0qKVwiJC8pKSB7XG4gICAgICBuYW1lID0gbmFtZS5zdWJzdHIoMSwgbmFtZS5sZW5ndGggLSAyKTtcbiAgICAgIG5hbWUgPSBjdHguc3R5bGl6ZShuYW1lLCAnbmFtZScpO1xuICAgIH0gZWxzZSB7XG4gICAgICBuYW1lID0gbmFtZS5yZXBsYWNlKC8nL2csIFwiXFxcXCdcIilcbiAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcXFxcIi9nLCAnXCInKVxuICAgICAgICAgICAgICAgICAucmVwbGFjZSgvKF5cInxcIiQpL2csIFwiJ1wiKTtcbiAgICAgIG5hbWUgPSBjdHguc3R5bGl6ZShuYW1lLCAnc3RyaW5nJyk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG5hbWUgKyAnOiAnICsgc3RyO1xufVxuXG5cbmZ1bmN0aW9uIHJlZHVjZVRvU2luZ2xlU3RyaW5nKG91dHB1dCwgYmFzZSwgYnJhY2VzKSB7XG4gIHZhciBudW1MaW5lc0VzdCA9IDA7XG4gIHZhciBsZW5ndGggPSBzaGltcy5yZWR1Y2Uob3V0cHV0LCBmdW5jdGlvbihwcmV2LCBjdXIpIHtcbiAgICBudW1MaW5lc0VzdCsrO1xuICAgIGlmIChjdXIuaW5kZXhPZignXFxuJykgPj0gMCkgbnVtTGluZXNFc3QrKztcbiAgICByZXR1cm4gcHJldiArIGN1ci5yZXBsYWNlKC9cXHUwMDFiXFxbXFxkXFxkP20vZywgJycpLmxlbmd0aCArIDE7XG4gIH0sIDApO1xuXG4gIGlmIChsZW5ndGggPiA2MCkge1xuICAgIHJldHVybiBicmFjZXNbMF0gK1xuICAgICAgICAgICAoYmFzZSA9PT0gJycgPyAnJyA6IGJhc2UgKyAnXFxuICcpICtcbiAgICAgICAgICAgJyAnICtcbiAgICAgICAgICAgb3V0cHV0LmpvaW4oJyxcXG4gICcpICtcbiAgICAgICAgICAgJyAnICtcbiAgICAgICAgICAgYnJhY2VzWzFdO1xuICB9XG5cbiAgcmV0dXJuIGJyYWNlc1swXSArIGJhc2UgKyAnICcgKyBvdXRwdXQuam9pbignLCAnKSArICcgJyArIGJyYWNlc1sxXTtcbn1cblxuXG4vLyBOT1RFOiBUaGVzZSB0eXBlIGNoZWNraW5nIGZ1bmN0aW9ucyBpbnRlbnRpb25hbGx5IGRvbid0IHVzZSBgaW5zdGFuY2VvZmBcbi8vIGJlY2F1c2UgaXQgaXMgZnJhZ2lsZSBhbmQgY2FuIGJlIGVhc2lseSBmYWtlZCB3aXRoIGBPYmplY3QuY3JlYXRlKClgLlxuZnVuY3Rpb24gaXNBcnJheShhcikge1xuICByZXR1cm4gc2hpbXMuaXNBcnJheShhcik7XG59XG5leHBvcnRzLmlzQXJyYXkgPSBpc0FycmF5O1xuXG5mdW5jdGlvbiBpc0Jvb2xlYW4oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnYm9vbGVhbic7XG59XG5leHBvcnRzLmlzQm9vbGVhbiA9IGlzQm9vbGVhbjtcblxuZnVuY3Rpb24gaXNOdWxsKGFyZykge1xuICByZXR1cm4gYXJnID09PSBudWxsO1xufVxuZXhwb3J0cy5pc051bGwgPSBpc051bGw7XG5cbmZ1bmN0aW9uIGlzTnVsbE9yVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09IG51bGw7XG59XG5leHBvcnRzLmlzTnVsbE9yVW5kZWZpbmVkID0gaXNOdWxsT3JVbmRlZmluZWQ7XG5cbmZ1bmN0aW9uIGlzTnVtYmVyKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ251bWJlcic7XG59XG5leHBvcnRzLmlzTnVtYmVyID0gaXNOdW1iZXI7XG5cbmZ1bmN0aW9uIGlzU3RyaW5nKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ3N0cmluZyc7XG59XG5leHBvcnRzLmlzU3RyaW5nID0gaXNTdHJpbmc7XG5cbmZ1bmN0aW9uIGlzU3ltYm9sKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ3N5bWJvbCc7XG59XG5leHBvcnRzLmlzU3ltYm9sID0gaXNTeW1ib2w7XG5cbmZ1bmN0aW9uIGlzVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09PSB2b2lkIDA7XG59XG5leHBvcnRzLmlzVW5kZWZpbmVkID0gaXNVbmRlZmluZWQ7XG5cbmZ1bmN0aW9uIGlzUmVnRXhwKHJlKSB7XG4gIHJldHVybiBpc09iamVjdChyZSkgJiYgb2JqZWN0VG9TdHJpbmcocmUpID09PSAnW29iamVjdCBSZWdFeHBdJztcbn1cbmV4cG9ydHMuaXNSZWdFeHAgPSBpc1JlZ0V4cDtcblxuZnVuY3Rpb24gaXNPYmplY3QoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnb2JqZWN0JyAmJiBhcmc7XG59XG5leHBvcnRzLmlzT2JqZWN0ID0gaXNPYmplY3Q7XG5cbmZ1bmN0aW9uIGlzRGF0ZShkKSB7XG4gIHJldHVybiBpc09iamVjdChkKSAmJiBvYmplY3RUb1N0cmluZyhkKSA9PT0gJ1tvYmplY3QgRGF0ZV0nO1xufVxuZXhwb3J0cy5pc0RhdGUgPSBpc0RhdGU7XG5cbmZ1bmN0aW9uIGlzRXJyb3IoZSkge1xuICByZXR1cm4gaXNPYmplY3QoZSkgJiYgb2JqZWN0VG9TdHJpbmcoZSkgPT09ICdbb2JqZWN0IEVycm9yXSc7XG59XG5leHBvcnRzLmlzRXJyb3IgPSBpc0Vycm9yO1xuXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Z1bmN0aW9uJztcbn1cbmV4cG9ydHMuaXNGdW5jdGlvbiA9IGlzRnVuY3Rpb247XG5cbmZ1bmN0aW9uIGlzUHJpbWl0aXZlKGFyZykge1xuICByZXR1cm4gYXJnID09PSBudWxsIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnYm9vbGVhbicgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdudW1iZXInIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnc3RyaW5nJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3N5bWJvbCcgfHwgIC8vIEVTNiBzeW1ib2xcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICd1bmRlZmluZWQnO1xufVxuZXhwb3J0cy5pc1ByaW1pdGl2ZSA9IGlzUHJpbWl0aXZlO1xuXG5mdW5jdGlvbiBpc0J1ZmZlcihhcmcpIHtcbiAgcmV0dXJuIGFyZyAmJiB0eXBlb2YgYXJnID09PSAnb2JqZWN0J1xuICAgICYmIHR5cGVvZiBhcmcuY29weSA9PT0gJ2Z1bmN0aW9uJ1xuICAgICYmIHR5cGVvZiBhcmcuZmlsbCA9PT0gJ2Z1bmN0aW9uJ1xuICAgICYmIHR5cGVvZiBhcmcuYmluYXJ5U2xpY2UgPT09ICdmdW5jdGlvbidcbiAgO1xufVxuZXhwb3J0cy5pc0J1ZmZlciA9IGlzQnVmZmVyO1xuXG5mdW5jdGlvbiBvYmplY3RUb1N0cmluZyhvKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwobyk7XG59XG5cblxuZnVuY3Rpb24gcGFkKG4pIHtcbiAgcmV0dXJuIG4gPCAxMCA/ICcwJyArIG4udG9TdHJpbmcoMTApIDogbi50b1N0cmluZygxMCk7XG59XG5cblxudmFyIG1vbnRocyA9IFsnSmFuJywgJ0ZlYicsICdNYXInLCAnQXByJywgJ01heScsICdKdW4nLCAnSnVsJywgJ0F1ZycsICdTZXAnLFxuICAgICAgICAgICAgICAnT2N0JywgJ05vdicsICdEZWMnXTtcblxuLy8gMjYgRmViIDE2OjE5OjM0XG5mdW5jdGlvbiB0aW1lc3RhbXAoKSB7XG4gIHZhciBkID0gbmV3IERhdGUoKTtcbiAgdmFyIHRpbWUgPSBbcGFkKGQuZ2V0SG91cnMoKSksXG4gICAgICAgICAgICAgIHBhZChkLmdldE1pbnV0ZXMoKSksXG4gICAgICAgICAgICAgIHBhZChkLmdldFNlY29uZHMoKSldLmpvaW4oJzonKTtcbiAgcmV0dXJuIFtkLmdldERhdGUoKSwgbW9udGhzW2QuZ2V0TW9udGgoKV0sIHRpbWVdLmpvaW4oJyAnKTtcbn1cblxuXG4vLyBsb2cgaXMganVzdCBhIHRoaW4gd3JhcHBlciB0byBjb25zb2xlLmxvZyB0aGF0IHByZXBlbmRzIGEgdGltZXN0YW1wXG5leHBvcnRzLmxvZyA9IGZ1bmN0aW9uKCkge1xuICBjb25zb2xlLmxvZygnJXMgLSAlcycsIHRpbWVzdGFtcCgpLCBleHBvcnRzLmZvcm1hdC5hcHBseShleHBvcnRzLCBhcmd1bWVudHMpKTtcbn07XG5cblxuLyoqXG4gKiBJbmhlcml0IHRoZSBwcm90b3R5cGUgbWV0aG9kcyBmcm9tIG9uZSBjb25zdHJ1Y3RvciBpbnRvIGFub3RoZXIuXG4gKlxuICogVGhlIEZ1bmN0aW9uLnByb3RvdHlwZS5pbmhlcml0cyBmcm9tIGxhbmcuanMgcmV3cml0dGVuIGFzIGEgc3RhbmRhbG9uZVxuICogZnVuY3Rpb24gKG5vdCBvbiBGdW5jdGlvbi5wcm90b3R5cGUpLiBOT1RFOiBJZiB0aGlzIGZpbGUgaXMgdG8gYmUgbG9hZGVkXG4gKiBkdXJpbmcgYm9vdHN0cmFwcGluZyB0aGlzIGZ1bmN0aW9uIG5lZWRzIHRvIGJlIHJld3JpdHRlbiB1c2luZyBzb21lIG5hdGl2ZVxuICogZnVuY3Rpb25zIGFzIHByb3RvdHlwZSBzZXR1cCB1c2luZyBub3JtYWwgSmF2YVNjcmlwdCBkb2VzIG5vdCB3b3JrIGFzXG4gKiBleHBlY3RlZCBkdXJpbmcgYm9vdHN0cmFwcGluZyAoc2VlIG1pcnJvci5qcyBpbiByMTE0OTAzKS5cbiAqXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBjdG9yIENvbnN0cnVjdG9yIGZ1bmN0aW9uIHdoaWNoIG5lZWRzIHRvIGluaGVyaXQgdGhlXG4gKiAgICAgcHJvdG90eXBlLlxuICogQHBhcmFtIHtmdW5jdGlvbn0gc3VwZXJDdG9yIENvbnN0cnVjdG9yIGZ1bmN0aW9uIHRvIGluaGVyaXQgcHJvdG90eXBlIGZyb20uXG4gKi9cbmV4cG9ydHMuaW5oZXJpdHMgPSBmdW5jdGlvbihjdG9yLCBzdXBlckN0b3IpIHtcbiAgY3Rvci5zdXBlcl8gPSBzdXBlckN0b3I7XG4gIGN0b3IucHJvdG90eXBlID0gc2hpbXMuY3JlYXRlKHN1cGVyQ3Rvci5wcm90b3R5cGUsIHtcbiAgICBjb25zdHJ1Y3Rvcjoge1xuICAgICAgdmFsdWU6IGN0b3IsXG4gICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfVxuICB9KTtcbn07XG5cbmV4cG9ydHMuX2V4dGVuZCA9IGZ1bmN0aW9uKG9yaWdpbiwgYWRkKSB7XG4gIC8vIERvbid0IGRvIGFueXRoaW5nIGlmIGFkZCBpc24ndCBhbiBvYmplY3RcbiAgaWYgKCFhZGQgfHwgIWlzT2JqZWN0KGFkZCkpIHJldHVybiBvcmlnaW47XG5cbiAgdmFyIGtleXMgPSBzaGltcy5rZXlzKGFkZCk7XG4gIHZhciBpID0ga2V5cy5sZW5ndGg7XG4gIHdoaWxlIChpLS0pIHtcbiAgICBvcmlnaW5ba2V5c1tpXV0gPSBhZGRba2V5c1tpXV07XG4gIH1cbiAgcmV0dXJuIG9yaWdpbjtcbn07XG5cbmZ1bmN0aW9uIGhhc093blByb3BlcnR5KG9iaiwgcHJvcCkge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCk7XG59XG4iXX0=
;