var express = require('express'),
	routes = require('../app/controllers/index'),
	mongoose = require('mongoose'),
	mongoStore = require('connect-mongodb'),
	flash = require('connect-flash'),
	path = require('path'),
	engine = require('ejs-locals'),
	sass = require('node-sass'),
	fs = require('fs');

module.exports = function(app, config, passport, env) {
 
    app.configure(function() {
        app.engine('html', engine);
        app.engine('ejs', engine);

        // set views path, template engine and default layout
        app.set('views', config.root + '/app/views')
        app.set('view engine', 'ejs');

        app.use(express.logger('dev'));

        app.use(express.static(config.root + '/public'));
        app.use(function(err, req, res, next) {
        if (err instanceof routes.NotFound) {
            res.redirect('/checkin');
        } else {
            next(err)
        }
        });

		// if in development, compile sass
		if(env === 'development') {
			app.use(
				sass.middleware({
					force: true,
					src: config.root + '/public',
					debug: true
				})
			);
		}

        // cookieParser should be above session
        app.use(express.cookieParser())

        // bodyParser should be above methodOverride
        app.use(express.bodyParser())
        app.use(express.methodOverride())

        // express/mongo session storage
		app.use(express.session({
			secret: 'TODO: Most probably need to use a better secret string.',
			store:
				new mongoStore({
					url: config.db,
					collection : 'sessions'
				})
        }));

        // use passport session
        app.use(passport.initialize())
        app.use(passport.session())

		// insert the user in all templates
		app.use(function(req, res, next){
			res.locals.user = req.user || false;
			next();
		});

        // connect flash for flash messages - should be declared after sessions
        app.use(flash())

//         db.defineModels(mongoose, function() {
//             app.Checkin = Checkin = mongoose.model('Checkin');
//             app.User = User = mongoose.model('User');
//             db = mongoose.connect(app.set('db-uri'));
//         });

        app.use(app.router);
    });


}


