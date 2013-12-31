
var warning = 'Wrong host. Please check your setup. Due to security' +
              'restrictions, you must access the site from the same url that is' +
              'configured for your OAuth callback.'

  , debug = require('debug')('fsauth:middleware')
  , utils = require('./utils')

module.exports = function (host) {
  return {
    ensureHost: ensureHost.bind(null, host),
    ensureLoggedIn: ensureLoggedIn
  }
}
module.exports.ensureHost = ensureHost
module.exports.ensureLoggedIn = ensureLoggedIn

function ensureHost(myhost, req, res, next) {
  var protocol;
  if (req.headers['x-forwarded-proto']) {
    protocol = req.headers['x-forwarded-proto'];
  } else {
    protocol = req.protocol;
  }
  var host = protocol + '://' + req.headers.host
  if (host !== myhost) {
    if (protocol == 'http' && 'https://' + req.headers.host.split(':')[0] === myhost) {
      debug('redirecting to https');
      return res.redirect(myhost + req.headers.path);
    }
    debug('Got request from invalid host', host, req.headers.host, myhost);
    return res.send(401, warning);
  }
  return next();
}

// middleware for amking sure they are already logged in
function ensureLoggedIn(req, res, next) {
  if (req.session.oauth && req.session.oauth.access_token) {
    return next();
  }
  if (req.cookies.oauth) {
    req.session.oauth = {
      access_token: req.cookies.oauth
    }
    return next()
  } else if (!req.headers.authorization) {
    return res.send(401, {error: 'Not logged in'});
  }
  // coming from extension, check the session token
  req.session.oauth = {
    access_token: req.headers.authorization.split(' ')[1]
  };
  return utils.getData(req.session.oauth.access_token, function (err, data) {
    if (err) {
      debug('Error check-login get data. Probably old session', err);
      req.session.destroy();
      // am I allowed to do this?
      return res.send(401, {error: 'Not logged in'});
    }
    req.session.userId = data.id;
    return next();
  });
}

