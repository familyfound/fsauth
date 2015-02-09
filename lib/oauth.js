
var OAuth = require('oauth').OAuth
  , debug = require('debug')('fsauth')
  , util = require('util')
  , request = require('superagent')

  , utils = require('./utils')
  , middleware = require('./middleware')

var Unauthorized = function () {
  Error.apply(this, arguments);
};
util.inherits(Unauthorized, Error);

module.exports = addRoutes

function addRoutes(host, app, options) {
  var uri = host + options.callback_path
    , api_base = options.api_base || 'https://' + (options.sandbox ? 'sandbox.' : '') + 'familysearch.org/cis-web/oauth2/v3/'
    , hostChecker = middleware.ensureHost.bind(null, host)
    , check_login_path = options.check_login_path || '/oauth/check-login'

  var check_url = api_base + 'authorization?response_type=code' +
    '&client_id=' + options.key +
    '&redirect_uri=' + options.redirect;

  app.get(check_login_path, hostChecker, function (req, res) {
		check_login(check_url, req, res)
	})
  app.post('/auth/get-code', hostChecker, process_code.bind(null, api_base, check_url, options.key))
  app.get(options.callback_path, hostChecker, callback.bind(null, check_url, options.key))
  app.get(options.logout_path, logout.bind(null, options.logout_redirect))
  app.get('/auth/set-token', hostChecker, set_token_page)
  app.post('/auth/set-token', hostChecker, set_token.bind(null, check_url))
}

function logout(redirect, req, res) {
  if (!req.session) return res.redirect(redirect)
  res.clearCookie('oauth')
  req.session.oauth = null
  req.cookies.oauth = null
  req.session.destroy()
  return res.redirect(redirect)
}

function set_token_page(req, res) {
  res.send(200, '<form method=POST><input name="token"><submit/></form>')
}

function set_token(check_url, req, res) {
  got_token(check_url, req.param('token'), req, res)
}

function got_token(check_url, token, req, res) {
  req.session.oauth = req.session.oauth || {}
  req.session.oauth.access_token = token
  res.cookie('already oauthed', req.session.oauth.access_token);
  return utils.getData(token, function (err, data) {
    if (err) {
      res.clearCookie('oauth')
      req.session.oauth = null;
      req.cookies.oauth = null;
      debug('Error check-login get data. Probably old session', err);
      // am I allowed to do this?
      return check_login(check_url, req, res);
    }
    req.session.userId = data.id;
    res.set('oauth-access-token', token)
    // res.cookie('oauth-access-token', token)
    return res.send(200, data);
  });
}

function check_login(check_url, req, res) {
  console.log('check login')
  if (!req.session) {
    console.error('Failed! A session must be defined for this to work.')
    return res.send(500, 'Invalid server setup for fs oauth')
  }
  console.log(req.cookies)
  if (req.cookies.oauth) {
    req.session.oauth = {
      access_token: req.cookies.oauth
    }
  }
  if (req.session.oauth && req.session.oauth.access_token) {
    return got_token(check_url, req.session.oauth.access_token, req, res)
  }
  res.set('oauth-authorize-url', check_url)
  res.send(204)
}

function process_code(api_base, check_url, key, req, res) {
  request.post(api_base + 'token')
    .set('Accept', 'application/json')
    .query({
      grant_type: 'authorization_code',
      code: req.param('code'),
      client_id: key,
    })
    .end(function (err, response) {
      got_token(check_url, response.body.access_token, req, res)
      // res.send(200, 'Connecting...')
    })
}

function callback(check_url, key, req, res) {
  var code = req.param('code')
  res.send(200, 'Connecting...')
} 

