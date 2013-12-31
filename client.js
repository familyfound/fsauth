
// client-side

var request = require('superagent')

function showDialog(url, modal) {
  var node = document.createElement('iframe');
  node.src = url + '&template=mobile';
  node.className = 'fsauth' + (modal ? ' modal' : '')
  document.body.appendChild(node)
  return node
}

module.exports = function (url, next) {
  request.get('/oauth/check-login', function (err, res) {
    if (err) return next(err);
    if (res.body.error) return next(res.body.error);
    if (res.body.authorized) return next(null, res.body.data);
    var dialog;
    window.authCallback = function (res) {
      dialog.parentNode.removeChild(dialog)
      if (res.err) return next(res.err);
      if (!res.authorized) return next('Unauthorized');
      return next(null, res.data);
    };
    dialog = showDialog(res.body.url);
  });
}

