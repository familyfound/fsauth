
var express = require('express')

module.exports = function (host, check_login_path, callback_path, key, secret, api_base) {
  var fsauth = require('../server')(host)
    , app = express()

  app.get('/env.js', function (req, res) {
    res.set('Content-type', 'application/javascript')
   res.send('window.check_url = "' + check_login_path + '";')
  })
  app.use(express.static(__dirname + '/static'))

  fsauth.addRoutes(app, check_login_path, callback_path, key, secret, api_base)

  app.listen(3000, function () {
    console.log('listening')
  })

  return app
}

