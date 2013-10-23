var testdata = require('./testdata')
  , Dropdown = require('./dropdown')
  , CustomerList = require('./customerlist')

var Page = function(element) {
  this.element = element
  var dropdown = document.createElement('div')
  container.appendChild(dropdown)
  var customers = document.createElement('div')
  container.appendChild(customers)

  this.banks = new Dropdown('banks', dropdown, testdata.banks)
  this.banks.on('changed', this.onBankChanged.bind(this))
  this.customers = new CustomerList(customers, testdata.customers)
}

Page.prototype = {
  detach: function() {
    this.banks.detach()
  },
  onBankChanged: function(newBank) {

  }
}

module.exports = Page
