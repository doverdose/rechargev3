var express = require('express'),
	site = require('../app/controllers/site'),
	dashboard = require('../app/controllers/dashboard'),
	auth = require('./middlewares/authorization');

module.exports = function(app, passport) {

	// site
	app.get('/', site.index);

	// user routes
	var users = require('../app/controllers/users');
	app.get('/login', users.login);
	app.get('/signup', users.signup)
	app.post('/users', users.create)
	app.post('/users/session',
	passport.authenticate('local', {
		failureRedirect: '/login',
		failureFlash: 'Invalid email or password.'
	}), users.session)

	app.get('/logout', users.logout);

	// restricted logged-in routes
	app.get('/dashboard', auth.requiresLogin, dashboard.dashboard);
	app.put('/checkin/:id.:format?', auth.requiresLogin, dashboard.checkin_update);
	app.get('/checkin/:id.:format?/edit', auth.requiresLogin, dashboard.checkin_edit);
	app.post('/checkin.:format?', auth.requiresLogin, dashboard.checkin_create);
	app.get('/checkin/new', auth.requiresLogin, dashboard.checkin_new);
	app.get('/checkin', auth.requiresLogin, dashboard.checkin);

	app.param('userId', users.user);

};
