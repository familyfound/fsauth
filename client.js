
// client-side

var request = require('superagent')

module.exports = function (check_url, code_url, done) {

  request.get(check_url, function (err, res) {
    if (err) return onUrl(err);
    if (res.status >= 300 || res.status < 200) {
      return onUrl(res.text)
    }
    if (res.status == 200) {
      return done(null, res.header['oauth-access-token'], res.body);
    }

    var created = window.open(res.header['oauth-authorize-url'], 'FamilySearch Auth', 'width=400,height=600')

    waitForWindow(created, function (err) {
      if (err) return done(err)
      var search = params(created.location.search.slice(1))
      request.post(code_url)
        .query({'code': search.code})
        .end(function (err, res) {
          if (err) return done(err)
          created.close()
          done(null, res.header['oauth-access-token'], res.body)
        })
    })
  });

}

module.exports.modal = function (check_url, next) {
  module.exports(check_url, function (err, url) {
    if (err) return next(err)
    showDialog(url)
  }, function (err, token, data) {
    dialog.parentNode.removeChild(dialog)
    next(err, token, data)
  })
}

function showDialog(url, modal) {
  var node = document.createElement('iframe');
  node.src = url + '&template=mobile';
  node.className = 'fsauth' + (modal ? ' modal' : '')
  document.body.appendChild(node)
  return node
}


/**
 * Expect an external window to be done sometime soon
 */
function waitForWindow(window, initial, step, done) {
  if (arguments.length === 2) {
    done = initial
    initial = 500
    step = 100
  }
  waitFor(initial, step, function () {
    if (window.closed) {
      done(new Error('User aborder auth'))
      return true
    }
    try {
      var m = window.location.search;
    } catch (e) {
      return false
    }
    done()
    return true
  })
}

// wait for something to happen
function waitFor(start, ival, done) {
  setTimeout(function () {
    if (done()) return
    var clear = setInterval(function () {
      if (done()) {
        clearInterval(clear)
      }
    }, ival)
  }, start)
}

var chrs = '0123456789abcdefghijklmnopqrtsuvwxyz'
function uuid(num) {
  num = num || 32
  var res = ''
  for (var i=0; i<num; i++) {
    res += chrs[parseInt(Math.random() * chrs.length)]
  }
  return res
}

function params(what) {
  if ('string' === typeof what) return parseParams(what)
  return Object.keys(what).map(function (name) {return name + '=' + encodeURIComponent(what[name])}).join('&');
}

function parseParams(what) {
  var obj = {}
  what.split('&').forEach(function (part) {
    var subs = part.split('=')
    obj[subs[0]] = decodeURIComponent(subs.slice(1).join('='))
  })
  return obj
}


