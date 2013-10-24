var express = require('express'),
	site = require('../app/controllers/site'),
	dashboard = require('../app/controllers/dashboard'),
	checkin = require('../app/controllers/checkins'),
	auth = require('./middlewares/authorization');

module.exports = function(app, passport) {

	// site
	app.get('/', site.index);

	// user routes
	var users = require('../app/controllers/users');
	app.get('/login', auth.isLoggedIn, users.login);
	app.get('/signup', auth.isLoggedIn, users.signup);

	app.post('/users', users.create);
	app.post('/users/session',
		passport.authenticate('local', {
			failureRedirect: '/login',
			failureFlash: 'Invalid email or password.'
		}),
		users.session);

	app.get('/logout', auth.requiresLogin, users.logout);

	// restricted logged-in routes
	app.get('/dashboard', auth.requiresLogin, dashboard.dashboard);

	app.put('/checkin/:id.:format?', auth.requiresLogin, checkin.checkin_update);
	app.get('/checkin/:id.:format?/edit', auth.requiresLogin, checkin.checkin_edit);

	app.post('/checkin.:format?', auth.requiresLogin, checkin.checkin_create);
	app.get('/checkin/new', auth.requiresLogin, checkin.checkin_new);

	app.get('/checkin', auth.requiresLogin, checkin.list);
	app.get('/checkin/:id', auth.requiresLogin, checkin.checkin_view);
	app.get('/checkin/:id.:format?/delete', auth.requiresLogin, checkin.checkin_delete);

	app.param('userId', users.user);

};
