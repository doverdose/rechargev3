var express = require('express'),
	routes = require('../app/controllers/index'),
	auth = require('./middlewares/authorization');

module.exports = function(app, passport) {

// 	app.get('/dashboard', routes.dashboard);
	app.get('/dashboard', auth.requiresLogin, routes.dashboard);

	app.put('/checkin/:id.:format?', routes.checkin_update);
	app.get('/checkin/:id.:format?/edit', routes.checkin_edit);
	app.post('/checkin.:format?', routes.checkin_create);
	app.get('/checkin/new', routes.checkin_new);
	app.get('/checkin', routes.checkin);
	app.get('/', routes.index);

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

	app.param('userId', users.user);

};
