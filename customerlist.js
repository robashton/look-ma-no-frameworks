var templates = require('./templates')
  , mustache = require('mustache')
  , Delegate = require('dom-delegate')
  , dope = require('dope')

function CustomerList(element, customers) {
  this.element = element
  this.customers = customers
  this.render()
  this.delegate = new Delegate(this.element)
  this.delegate.on('click', '.customer', this.onCustomerClicked.bind(this))
}

CustomerList.prototype = {
  render: function() {
    var self = this
    this.element.innerHTML = mustache.render(templates.customers, this)
  },
  onCustomerClicked: function(e, row) {
    alert('Clicked ' + dope.dataset(row).customer)
  },
  detach: function() {

  }
}


module.exports = CustomerList
