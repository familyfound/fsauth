
var fs = require('familysearch').single()

module.exports = {
  getData: getData
}

function getData(token, next) {
  fs.get('current-user', {}, token, function (err, data) {
    if (err) return next(err);
    if (!data.users) {
      console.log('failed to get current user?', data)
      return next(new Error('Not sure why'))
    }
    next(null, data.users[0]);
  });
}

