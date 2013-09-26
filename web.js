var express = require('express')
  , routes = require('./routes')
  , mongoose = require('mongoose')
  , path = require('path')
  , engine = require('ejs-locals')
  , db = require('./db');

var app = express();

module.exports = app;


app.configure('test', function() {
    app.set('db-uri', 'mongodb://localhost/recharge-test');
});

app.configure('development', function() {
    app.set('db-uri', 'mongodb://localhost/recharge-development');
});

app.configure('production', function() {
    app.set('db-uri', 'mongodb://localhost/recharge-production');
});
 
app.configure(function() {
    app.engine('html', engine);
    app.engine('ejs', engine);
    app.set('views', path.join(__dirname, '/views'));
    app.use(express.logger('dev'));
    app.use(express.methodOverride());
    app.use(express.bodyParser());
    app.use(app.router);
    app.use(express.static(path.join(__dirname, '/assets')));

    db.defineModels(mongoose, function() {
	app.Checkin = Checkin = mongoose.model('Checkin');
	app.User = User = mongoose.model('User');
	db = mongoose.connect(app.set('db-uri'));
    })
});

app.get('/dashboard', routes.dashboard);
app.put('/checkin/:id.:format?', routes.checkin_update);
app.post('/checkin.:format?', routes.checkin_create);
app.get('/checkin/new', routes.checkin_new);
app.get('/checkin', routes.checkin);
app.get('/', routes.index);



app.listen(8080);


