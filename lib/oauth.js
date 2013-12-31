
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

function addRoutes(host, app, check_login_path, callback_path, key, secret, api_base) {
  api_base = api_base || 'https://api.familysearch.org/identity/v2/'
  var uri = host + callback_path
    , oa = createOAuth(api_base, key, secret, uri)
    , hostChecker = middleware.ensureHost.bind(null, host)
  check_login_path = check_login_path || '/oauth/check-login'

  app.get(check_login_path, hostChecker, check_login.bind(null, oa, api_base))
  app.get(callback_path, hostChecker, callback.bind(null, oa))
}

function createOAuth(apiBase, key, secret, callbackUrl) {
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
        return check_login(req, res);
      }
      req.session.userId = data.id;
      return res.send({authorized: true, data: data});
    });
  }
  debug('step 1');
  // First, request a Token user the OAuth object created with oauth module
  oa.getOAuthRequestToken(function(err, token, secret) {
    if (err) {
      debug("An error happened on getOAuthRequestToken : ");
      debug(err);
      return res.send({authorized: false,
                error: 'Unable to connect to familysearch.org for authorization'});
    }
    req.session.oauth = {
      token: token,
      secret: secret
    };
    debug('step 1 successful', req.session.oauth);

    res.send({authorized: false, url: api_base + 'authorize?oauth_token=' + token});
  });
}

function callback(oa, req, res) {
  if (!req.session.oauth) {
    debug('step 2 - uninitialized');
    req.session.destroy();
    return res.render('oauth-status', {
      title: 'Failed to login',
      response: {
        authorized: false,
        error: 'No session found...'
      }
    });
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
        return res.render('oauth-status', {
          title: 'Failed to login',
          response: {
            authorized: false,
            error: err
          }
        });
      }
      // Store the access token in the session
      req.session.oauth.access_token = access_token;
      req.session.oauth.access_secret = access_secret;
      res.cookie('oauth', access_token);
      return utils.getData(access_token, function (err, data) {
        req.session.userId = data.id;
        return res.render('oauth-status', {
          title: 'Login successful!',
          response: {
            authorized: true,
            data: data,
            error: err
          }
        });
      });
    }
  );
} 



