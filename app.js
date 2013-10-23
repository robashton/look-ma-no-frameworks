var domready = require('domready')
  , Page = require('./customers/page')

function run(){
  var container = document.getElementById('container')
  // Routing goes here
  // Create a page around the current route
  // and detach when we change to a new page
  var page = new Page(container)
}


domready(run)

