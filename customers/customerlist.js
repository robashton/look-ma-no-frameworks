var mustache = require('mustache')
  , Delegate = require('dom-delegate')
  , dope = require('dope')
  , _ = require('underscore')
  , fs = require('fs')

function CustomerList(element, customers) {
  this.element = element
  this.template = fs.readFileSync(__dirname + "/customerlist.html")
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

  }
}


module.exports = CustomerList
