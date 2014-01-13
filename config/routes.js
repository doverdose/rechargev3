var express = require('express'),
	site = require('../app/controllers/site'),
	dashboard = require('../app/controllers/dashboard'),
	checkin = require('../app/controllers/checkins'),
	checkinTemplate = require('../app/controllers/checkinTemplates'),
	users = require('../app/controllers/users'),
	settings = require('../app/controllers/settings'),
	providers = require('../app/controllers/providers'),
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

	app.get('/user/new', auth.requiresLogin, auth.requiresAdmin, users.newView);
	app.get('/user/:id', auth.requiresLogin, users.view);
	app.get('/user/:id/edit', auth.requiresLogin, users.edit);

	app.post('/user/update', auth.requiresLogin, users.update);
	app.post('/user/delete', auth.requiresLogin, auth.requiresAdmin, users.remove);
	app.post('/user/follow', auth.requiresLogin, users.follow);
	app.post('/user/unfollow', auth.requiresLogin, users.unfollow);

	app.post('/provider/user/remove', auth.requiresLogin, providers.removePatient);
	app.post('/provider/user/add', auth.requiresLogin, providers.addPatient);
	app.post('/provider/approve', auth.requiresLogin, providers.approve);
	app.post('/provider/revoke', auth.requiresLogin, providers.revoke);

	app.post('/checkintemplate', auth.requiresLogin, auth.requiresAdmin, checkinTemplate.create);
	app.post('/checkintemplate/edit', auth.requiresLogin, auth.requiresAdmin, checkinTemplate.update);
	app.post('/checkintemplate/remove', auth.requiresLogin, auth.requiresAdmin, checkinTemplate.remove);
	app.get('/checkintemplate/new', auth.requiresLogin, auth.requiresAdmin, checkinTemplate.createView);
	app.get('/checkintemplate/:id', auth.requiresLogin, auth.requiresAdmin, checkinTemplate.view);
	app.get('/checkintemplate/:id/edit', auth.requiresLogin, auth.requiresAdmin, checkinTemplate.updateView);

	app.put('/checkin/:id.:format?', auth.requiresLogin, checkin.checkinUpdate);
	app.get('/checkin/:id.:format?/edit', auth.requiresLogin, checkin.checkinEdit);

	app.post('/checkin.:format?', auth.requiresLogin, checkin.checkinCreate);
	app.get('/checkin/new', auth.requiresLogin, checkin.checkinNew);

	app.get('/checkin', auth.requiresLogin, checkin.list);
	app.get('/checkin/:id', auth.requiresLogin, checkin.checkinView);
	app.get('/checkin/:id.:format?/delete', auth.requiresLogin, checkin.checkinDelete);

	app.get('/settings/profile', auth.requiresLogin, settings.profile);
	app.get('/settings/providers', auth.requiresLogin, settings.providers);
	app.get('/settings/following', auth.requiresLogin, settings.following);
	app.get('/settings/followers', auth.requiresLogin, settings.followers);

	app.param('userId', users.user);

};
