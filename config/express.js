var express = require('express'),
	site = require('../app/controllers/site'),
	mongoose = require('mongoose'),
	mongoStore = require('connect-mongodb'),
	flash = require('connect-flash'),
	path = require('path'),
	engine = require('ejs-locals'),
	fs = require('fs');

module.exports = function(app, config, passport, env) {

	app.configure(function() {
		app.engine('html', engine);
		app.engine('ejs', engine);

		// set views path, template engine and default layout
		if(env === 'development') {
			app.set('views', config.root + '/app/views');
		} else {
			app.set('views', config.root + '/public/views');
		}
		app.set('view engine', 'ejs');

		var ejs = require('ejs'),
			moment = require('moment');

		ejs.filters.fromNow = function(date){
			return moment(date).fromNow();
		}

		app.use(express.logger('dev'));

		if(env === 'development') {
			app.use(require('connect-livereload')({
				port: 35729
			}));

			app.use(express.static(config.root + '/app'));
			app.use(express.static(config.root + '/.tmp'));
		}

		app.use(express.static(config.root + '/public'));

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

		app.use(function(req, res, next){
			// insert the user in templates
			res.locals.user = req.user || false;

			// insert active page in templates
			res.locals.activePage = req.path || false;

			next();
		});

		// connect flash for flash messages - should be declared after sessions
		app.use(flash())

		// adds CSRF support
		if(env === 'test') {
			app.use(function(req, res, next){
				res.locals.csrf_token = '';
				next()
			})
		} else {
			app.use(express.csrf())

			app.use(function(req, res, next){
				res.locals.csrf_token = req.csrfToken()
				next()
			})
		}

		app.use(app.router);

		// pretty 500 errors
		if(env !== 'development') {
			// assume "not found" in the error msgs
			app.use(function(err, req, res, next){
				// treat as 404
				if (err.message
					&& (~err.message.indexOf('not found')
					|| (~err.message.indexOf('Cast to ObjectId failed')))) {
					return next()
				}

				// log it
				console.error(err.stack)

				// error page
				res.status(500).render('500', {
					error: err.stack
				})
			});
		}

		// assume 404 since no middleware responded
		app.use(function(req, res, next){
			res.status(404).render('404', {
				url: req.originalUrl,
				error: 'Not found'
			})
		});

	});

}


