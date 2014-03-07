/**
 * Module dependencies.
 */
var express = require('express');
var ejsMiddleware = require('ejs-middleware');
var http = require('http');
var path = require('path');
var routes = require('./routes');
var config = require('./config');

var RedisStore = require('connect-redis')(express);

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser());
app.use(express.session({
  store: new RedisStore(config.redis),
  secret: 'mysecret'
}));
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));
app.use(ejsMiddleware(path.join(__dirname, 'views')));

app.post('/api/session', routes.session.start);
app.post('/api/score', routes.score.incr);
app.get('/api/score', routes.score.list);
app.del('/api/score', routes.score.clear);
app.post('/api/chat', routes.chat);
app.get('/api/score/rank', routes.score.rank);

http.createServer(app).listen(app.get('port'), function () {
  console.log('Express server listening on port ' + app.get('port'));
});
