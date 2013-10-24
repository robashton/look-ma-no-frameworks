var domready = require('domready')
  , Page = require('./customers/page')

function run(){
  var container = document.getElementById('container')

  // Routing goes here
  // Create a page around the current route
  // and detach when we change to a new page
  var subContainer = document.createElement('div')
  var page = new Page(subContainer)
  container.appendChild(subContainer)
}


domready(run)

