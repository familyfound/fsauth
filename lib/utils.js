
var fs = require('familysearch').single()

module.exports = {
  getData: getData
}

function getData(token, next) {
  fs.get('current-user', {}, token, function (err, data) {
    if (err) return next(err);
    next(null, data.users[0]);
  });
}

