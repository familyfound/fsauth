
// client-side

var request = require('superagent')

function showDialog(url, modal) {
  var node = document.createElement('iframe');
  node.src = url + '&template=mobile';
  node.className = 'fsauth' + (modal ? ' modal' : '')
  document.body.appendChild(node)
  return node
}

module.exports = function (check_url, onUrl, onData) {
  request.get(check_url, function (err, res) {
    if (err) return next(err);
    if (res.status >= 300 || res.status < 200) {
      return onUrl(res.text)
    }
    if (res.status == 200) {
      return onData(null, res.body);
    }
    var dialog;
    window.authCallback = onData;
    onUrl(null, res.header['oauth-authorize-url']);
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

