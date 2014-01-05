
require('fsauth')(check_url, function (err, data) {
  console.log('got', err, data)
  document.getElementById('data').innerHTML = JSON.stringify(err || data)
})

