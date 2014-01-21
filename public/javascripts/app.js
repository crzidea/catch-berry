// init
var xhr = new XMLHttpRequest;
var trial = 0;
xhr.onload = function () {
  var res = JSON.parse(xhr.response);
  if (res.code) {
    // create a session
    if (++trial > 3) return;
    var name = prompt(res.message);
    if (name) {
      xhr.open('post', '/api/session', true);
      xhr.setRequestHeader('Content-Type', 'application/json')
      xhr.send(JSON.stringify({
        name: name
      }));
    }
  } else {
    game(res.score);
  }
}
xhr.open('post', '/api/session', true);
xhr.send();