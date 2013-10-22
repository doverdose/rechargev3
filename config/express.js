var express = require('express'),
	site = require('../app/controllers/site'),
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
			if (err instanceof site.NotFound) {
				res.redirect('/checkin');
			} else {
				next(err)
			}
		});

		// if in development, compile sass
		if(env === 'development') {
			outFile = './public/css/main.css';
			sass.render({
				file: './public/css/main.scss',
				success: function(css) {

					fs.writeFile(outFile, css, function(err) {
						console.log(err);
					});

				},
				error: function(error) {
					console.log(error);
				}
			});
		};

		// testing
		app.set('test-uri', 'http://54.213.21.154:8080/');

		// cookieParser should be above session
		app.use(express.cookieParser())

		// bodyParser should be above methodOverride
		app.use(express.bodyParser())
		app.use(express.methodOverride())

		// express/mongo session storage
		app.use(express.session({
			secret: 're-health charge session token',
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

		// adds CSRF support
		if (process.env.NODE_ENV !== 'test') {
			app.use(express.csrf())

			// This could be moved to view-helpers :-)
			app.use(function(req, res, next){
				res.locals.csrf_token = req.csrfToken()
				next()
			})
		}

		app.use(app.router);
	});

}


