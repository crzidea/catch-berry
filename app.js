/**
 * Module dependencies.
 */
var express = require('express');
var ejsMiddleware = require('ejs-middleware');
var routes = require('./routes');
var http = require('http');
var path = require('path');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'uploads')));
app.use(ejsMiddleware(path.join(__dirname, 'views')));

app.post('/session', routes.session.start);
app.get('/score', routes.score.list);
app.get('/score/:id', routes.score.scored);
app.del('/score', routes.score.clear);
app.post('/score/:id', routes.score.get);


http.createServer(app).listen(app.get('port'), function () {
  console.log('Express server listening on port ' + app.get('port'));
});