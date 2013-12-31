// Include required modules


var middleware = require('./lib/middleware')
  , addRoutes = require('./lib/oauth')

module.exports = function (host) {
  var mid = middleware(host)

  return {
    addRoutes: addRoutes.bind(null, host, mid.hostChecker),
    middleware: mid
  }
}

