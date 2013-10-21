var express = require('express')
  , routes = require('./routes')
  , mongoose = require('mongoose')
  , mongoStore = require('connect-mongodb')
  , flash = require('connect-flash')
  , path = require('path')
  , engine = require('ejs-locals')
  , db = require('./db')
  , passport = require('passport');

var app = express();

module.exports = app;

app.configure('test', function() {
    app.set('db-uri', 'mongodb://localhost/recharge-test');
});

app.configure('development', function() {
    app.set('db-uri', 'mongodb://localhost/recharge-development');
    app.use(express.errorHandler({ dumpExceptions: true}));
});

app.configure('production', function() {
    app.set('db-uri', 'mongodb://localhost/recharge-production');
});
 
app.configure(function() {
    app.engine('html', engine);
    app.engine('ejs', engine);
    app.set('view engine', 'ejs');
    app.set('views', path.join(__dirname, '/views'));
    app.use(express.logger('dev'));

    app.use(express.static(path.join(__dirname, '/assets')));
    app.use(function(err, req, res, next) {
	if (err instanceof routes.NotFound) {
	    res.redirect('/checkin');
	} else {
	    next(err) 
	}
    });

    // cookieParser should be above session
    app.use(express.cookieParser())

    // bodyParser should be above methodOverride
    app.use(express.bodyParser())
    app.use(express.methodOverride())

    // express/mongo session storage
    app.use(express.session({
      secret: 'TODO: Most probably need to use a better secret string.',
      store: new mongoStore({
//         url: config.db,
        url: app.set('db-uri'),
        collection : 'sessions'
      })
    }))

    // use passport session
    app.use(passport.initialize())
    app.use(passport.session())

    // connect flash for flash messages - should be declared after sessions
    app.use(flash())

    db.defineModels(mongoose, function() {
        app.Checkin = Checkin = mongoose.model('Checkin');
        app.User = User = mongoose.model('User');
        db = mongoose.connect(app.set('db-uri'));
    });

    app.use(app.router);

});

app.get('/dashboard', routes.dashboard);
app.put('/checkin/:id.:format?', routes.checkin_update);
app.get('/checkin/:id.:format?/edit', routes.checkin_edit);
app.post('/checkin.:format?', routes.checkin_create);
app.get('/checkin/new', routes.checkin_new);
app.get('/checkin', routes.checkin);
app.get('/', routes.index);

// bootstrap passport config
require('./config/passport')(passport);

// user routes
var users = require('./routes/users');
app.get('/login', users.login);
app.get('/signup', users.signup)
app.post('/users', users.create)
app.post('/users/session',
passport.authenticate('local', {
    failureRedirect: '/login',
    failureFlash: 'Invalid email or password.'
}), users.session)

app.get('/logout', users.logout);

app.param('userId', users.user);


app.listen(8080);


