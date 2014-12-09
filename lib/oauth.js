
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
    , api_base = options.api_base || 'https://sandbox.familysearch.org/cis-web/oauth2/v3/'
    , hostChecker = middleware.ensureHost.bind(null, host)
    , check_login_path = options.check_login_path || '/oauth/check-login'

  var check_url = api_base + 'authorization?response_type=code' +
    '&client_id=' + options.key +
    '&redirect_uri=' + options.redirect;

  app.get(check_login_path, hostChecker, function (req, res) {
		check_login(check_url, req, res)
	})
  app.post('/auth/get-code', hostChecker, process_code.bind(null, check_url, options.key))
  app.get(options.callback_path, hostChecker, callback.bind(null, check_url, options.key))
  app.get(options.logout_path, logout.bind(null, options.logout_redirect))
}

function logout(redirect, req, res) {
  if (!req.session) return res.redirect(redirect)
  res.clearCookie('oauth')
  req.session.oauth = null
  req.cookies.oauth = null
  req.session.destroy()
  return res.redirect(redirect)
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
  if (!req.session) {
    console.error('Failed! A session must be defined for this to work.')
    return res.send(500, 'Invalid server setup for fs oauth')
  }
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

function process_code(check_url, key, req, res) {
  request.post('https://sandbox.familysearch.org/cis-web/oauth2/v3/token')
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
  /*
  request.post('https://sandbox.familysearch.org/cis-web/oauth2/v3/token')
    .set('Accept', 'application/json')
    .query({
      grant_type: 'code',
      code: code,
      client_id: key,
    })
    .end(function (err, response) {
      got_token(check_url, response.body.access_token, req, res)
      // res.send(200, 'Connecting...')
    })
    */
} 

/*
function createOAuth(apiBase, key, secret, callbackUrl) {
  debug('Creating oauth', apiBase, key, secret, callbackUrl)
  return new OAuth(
    apiBase + "request_token",
    apiBase + "access_token",
    key,
    secret,
    "1.0",
    callbackUrl,
    "PLAINTEXT",
    true // do the auth in the URL, not the Authorization header
  );
}
*/

  /*
  debug('step 1');
  // First, request a Token user the OAuth object created with oauth module
  oa.getOAuthRequestToken(function(err, token, secret) {
    if (err) {
      console.error("An error happened on getOAuthRequestToken : ");
      console.error(JSON.stringify(err));
      return res.send(401, 'Unable to connect to familysearch.org for authorization. Is the client key correct?');
    }
    req.session.oauth = {
      token: token,
      secret: secret
    };
    debug('step 1 successful', req.session.oauth);

    res.set('oauth-authorize-url', api_base + 'authorize?oauth_token=' + token)
    res.send(204)
  });

function OauthTpl(title, err, token, data) {
  var t = '<!doctype html><html><head><title>' + title + '</title></head>'
  t += '<body><h1>' + title + '</h1>'
  t += '<script>if (window.parent) {window.parent.authCallback(' + JSON.stringify(err) + ', "' + token + '", ' + JSON.stringify(data) + ')}</script>'
  t += '</body></html>'
  return t
}
  if (!req.session.oauth) {
    debug('step 2 - uninitialized');
    req.session.destroy();
    var txt = OauthTpl('Failed to login', 'No session found...')
    return res.send(txt)
  }
  debug('step 2');
  var oauth = req.session.oauth;
  oauth.verifier = req.query.oauth_verifier;

  // The user is verified. Now we can ask for an access token
  oa.getOAuthAccessToken(oauth.token, oauth.secret, oauth.verifier, 
    function(err, access_token, access_secret, results){
      if (err){
        debug("Error while getting the Access Token");
        req.session.destroy();
        var txt = OauthTpl('Failed to login', err)
        return res.send(txt)
      }
      // Store the access token in the session
      req.session.oauth.access_token = access_token;
      req.session.oauth.access_secret = access_secret;
      res.cookie('oauth', access_token);
      return utils.getData(access_token, function (err, data) {
        req.session.userId = data.id;
        var txt = OauthTpl('Login successful!', err, access_token, data)
        return res.send(txt)
      });
    }
  );
  */

