// Include required modules

var middleware = require('./lib/middleware')
  , addRoutes = require('./lib/oauth')

module.exports = function (host) {
  return {
    addRoutes: addRoutes.bind(null, host),
    middleware: middleware(host)
  }
}

