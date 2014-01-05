
// client-side

var request = require('superagent')

function showDialog(url, modal) {
  var node = document.createElement('iframe');
  node.src = url + '&template=mobile';
  node.className = 'fsauth' + (modal ? ' modal' : '')
  document.body.appendChild(node)
  return node
}

module.exports = function (check_url, next) {
  request.get(check_url, function (err, res) {
    if (err) return next(err);
    if (res.status >= 300 || res.status < 200) {
      return next(res.text)
    }
    if (res.status == 200) {
      return next(null, res.body);
    }
    var dialog;
    window.authCallback = function (err, data) {
      dialog.parentNode.removeChild(dialog)
      if (err) return next(err);
      return next(null, data);
    };
    dialog = showDialog(res.header['oauth-authorize-url']);
  });
}

