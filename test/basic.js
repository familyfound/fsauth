
var vars = {
  host: process.env.HOST || 'http://familyfound.local:3000',
  check_login_path: process.env.CHECK_LOGIN_PATH || '/oauth/check-login',
  callback_path: process.env.CALLBACK_PATH || '/oauth/callback',
  key: process.env.KEY,
  api_base: null
}

var app = require('./service.js')(vars.host, vars.check_login_path, vars.callback_path, vars.key, vars.api_base)

