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
