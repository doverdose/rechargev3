var express = require('express')
  , routes = require('./routes');

var app = express();

app.set('views', __dirname + '/views');
app.engine('html', require('ejs').renderFile);
app.use(express.logger('dev'));
app.use(app.router);

app.get('/', routes.index);

app.listen(8080);
