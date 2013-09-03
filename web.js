var express = require('express')
  , routes = require('./routes')
  , path = require('path')
  , mongoose = require('mongoose');

var app = express();

app.set('views', path.join(__dirname, '/views'));
app.engine('html', require('ejs').renderFile);
app.use(express.logger('dev'));
app.use(app.router);
app.use(express.static(path.join(__dirname, 'assets')));

app.get('/dashboard', routes.dashboard);
app.get('/form', routes.form);
app.get('/', routes.index);

app.listen(8080);
