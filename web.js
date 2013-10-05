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
    app.use(express.errorHandler({ dumpExceptions: true}));
});

app.configure('staging', function() {
    app.set('db-uri', 'mongodb://komodo:theonlylivingdragon@ds049548.mongolab.com:49548/heroku_app18503207');
});

app.configure('production', function() {
    app.set('db-uri', 'mongodb://localhost/recharge-production');
});
 
app.configure(function() {
    app.engine('html', engine);
    app.engine('ejs', engine);
    app.set('views', path.join(__dirname, '/views'));
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express.static(path.join(__dirname, '/assets')));
    app.use(function(err, req, res, next) {
	if (err instanceof routes.NotFound) {
	    res.redirect('/checkin');
	} else {
	    next(err) 
	}
    });
    db.defineModels(mongoose, function() {
	app.Checkin = Checkin = mongoose.model('Checkin');
	app.User = User = mongoose.model('User');
	db = mongoose.connect(app.set('db-uri'));
    })
});


app.get('/dashboard', routes.dashboard);
app.put('/checkin/:id.:format?', routes.checkin_update);
app.get('/checkin/:id.:format?/edit', routes.checkin_edit);
app.post('/checkin.:format?', routes.checkin_create);
app.get('/checkin/new', routes.checkin_new);
app.get('/checkin', routes.checkin);
app.get('/', routes.index);


var port = process.env.PORT || 3000;
app.listen(port);


