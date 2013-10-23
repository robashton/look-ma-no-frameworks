var ko = require('knockout')
  , domready = require('domready')
  , testdata = require('./testdata')
  , Dropdown = require('./dropdown')
  , mustache = require('mustache')

function run(){
  var container = document.getElementById('container')
  var page = new Page(container)
}

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

domready(run)

var templates = {
  customers: ["<table>",
              "{{#customers}}",
                '<tr class="customer"><td>{{name}}</td><td>{{bank}}</td></tr>',
              "{{/customers}}",
              "</table>"].join("\n"),
}


function getTemplate(name) {
  var container = document.getElementsByClassName(name + "-template")[0]
  return container.innerHTML
}

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




