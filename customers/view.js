var testdata = require('../testdata')
  , fs = require('fs')
  , mustache = require('mustache')
  , _ = require('underscore')

var View = function(element, opts) {
  this.element = element
  this.template = fs.readFileSync(__dirname + "/view.html")
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
