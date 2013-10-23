var domready = require('domready')
  , Page = require('./page')

function run(){
  var container = document.getElementById('container')
  var page = new Page(container)
}


domready(run)

