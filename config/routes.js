var express = require('express'),
	site = require('../app/controllers/site'),
	dashboard = require('../app/controllers/dashboard'),
	checkin = require('../app/controllers/checkins'),
	users = require('../app/controllers/users'),
	admin = require('../app/controllers/admin'),
	auth = require('./middlewares/authorization');

module.exports = function(app, passport) {

	// site
	app.get('/', site.index);

	// user routes
	app.get('/login', auth.isLoggedIn, users.signin);
	app.get('/signup', auth.isLoggedIn, users.signup);

	app.post('/users', users.create);
	app.post('/users/session',
		passport.authenticate('local', {
			failureRedirect: '/login',
			failureFlash: 'Invalid email or password.'
		}),
		users.session);

	app.get('/logout', users.logout);

	// admin
	app.get('/admin', auth.requiresLogin, auth.requiresProvider, admin.admin);

	// restricted logged-in routes
	app.get('/dashboard', auth.requiresLogin, dashboard.dashboard);

	app.post('/user/update', auth.requiresLogin, users.update);
	app.get('/user/new', auth.requiresLogin, auth.requiresAdmin, users.newView);
	app.get('/user/:id', auth.requiresLogin, users.view);
	app.get('/user/:id/edit', auth.requiresLogin, users.edit);
	app.get('/user/:id/delete', auth.requiresLogin, auth.requiresAdmin, users.remove);

	app.get('/provider/user/:id/remove', auth.requiresLogin, users.removeFromProvider);

	app.put('/checkin/:id.:format?', auth.requiresLogin, checkin.checkin_update);
	app.get('/checkin/:id.:format?/edit', auth.requiresLogin, checkin.checkin_edit);

	app.post('/checkin.:format?', auth.requiresLogin, checkin.checkin_create);
	app.get('/checkin/new', auth.requiresLogin, checkin.checkin_new);

	app.get('/checkin', auth.requiresLogin, checkin.list);
	app.get('/checkin/:id', auth.requiresLogin, checkin.checkin_view);
	app.get('/checkin/:id.:format?/delete', auth.requiresLogin, checkin.checkin_delete);

	app.param('userId', users.user);

};
