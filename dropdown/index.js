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
