
var OAuth = require('oauth').OAuth
  , debug = require('debug')('fsauth')
  , util = require('util')

  , utils = require('./utils')
  , middleware = require('./middleware')

var Unauthorized = function () {
  Error.apply(this, arguments);
};
util.inherits(Unauthorized, Error);

module.exports = addRoutes

function addRoutes(host, app, check_login_path, callback_path, key, api_base) {
  api_base = api_base || 'https://api.familysearch.org/identity/v2/'
  var uri = host + callback_path
    , oa = createOAuth(api_base, key, null, uri)
    , hostChecker = middleware.ensureHost.bind(null, host)
  check_login_path = check_login_path || '/oauth/check-login'

  app.get(check_login_path, hostChecker, function (req, res) {
		check_login(oa, api_base, req, res)
	})
  app.get(callback_path, hostChecker, callback.bind(null, oa))
}

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

function check_login(oa, api_base, req, res) {
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
    res.cookie('already oauthed', req.session.oauth.access_token);
    return utils.getData(req.session.oauth.access_token, function (err, data) {
      if (err) {
        res.clearCookie('oauth')
        req.session.oauth = null;
        req.cookies.oauth = null;
        debug('Error check-login get data. Probably old session', err);
        // am I allowed to do this?
        return check_login(oa, api_base, req, res);
      }
      req.session.userId = data.id;
			res.set('oauth-access-token', req.session.oauth.access_token)
      return res.send(200, data);
    });
  }
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
}

function OauthTpl(title, err, token, data) {
  var t = '<!doctype html><html><head><title>' + title + '</title></head>'
  t += '<body><h1>' + title + '</h1>'
  t += '<script>if (window.parent) {window.parent.authCallback(' + JSON.stringify(err) + ', "' + token + '", ' + JSON.stringify(data) + ')}</script>'
  t += '</body></html>'
  return t
}

function callback(oa, req, res) {
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
} 

