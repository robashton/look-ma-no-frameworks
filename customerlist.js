var templates = require('./templates')
  , mustache = require('mustache')

function CustomerList(element, customers) {
  this.element = element
  this.customers = customers
  this.render()
}

CustomerList.prototype = {
  render: function() {
    var self = this
    this.element.innerHTML = mustache.render(templates.customers, this)
  },
  detach: function() {

  }
}


module.exports = CustomerList
