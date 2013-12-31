
var vars = {
  host: process.env.HOST || 'http://localhost:3000',
  check_login_path: process.env.CHECK_LOGIN_PATH || '/oauth/check-login',
  callback_path: process.env.CALLBACK_PATH || '/oauth/callback',
  key: process.env.KEY,
  secret: process.env.SECRET,
  api_base: null
}

var app = require('./service.js')(vars.host, vars.check_login_path, vars.callback_path, vars.key, vars.secret, vars.api_base)

