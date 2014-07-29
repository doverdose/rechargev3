/* Routes
 */

module.exports = function(app, passport) {
	'use strict';

	var site = require('../app/controllers/site'),
		stats = require('../app/controllers/stats'),
		checkin = require('../app/controllers/checkins'),
		checkinTemplate = require('../app/controllers/checkinTemplates'),
		users = require('../app/controllers/users'),
		dashboard = require('../app/controllers/dashboard'),
		following = require('../app/controllers/following'),
		settings = require('../app/controllers/settings'),
		providers = require('../app/controllers/providers'),
		surveys = require('../app/controllers/surveys'),
		admin = require('../app/controllers/admin'),
		schedules = require('../app/controllers/schedules'),
		auth = require('./middlewares/authorization');

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
	app.get('/stats', auth.requiresLogin, auth.requiresAdmin, stats.view);

	app.get('/user/new', auth.requiresLogin, auth.requiresAdmin, users.newView);
	app.get('/user/:id', auth.requiresLogin, users.view);
	app.get('/user/:id/edit', auth.requiresLogin, users.edit);

	app.post('/user/update', auth.requiresLogin, users.update);
	app.post('/user/delete', auth.requiresLogin, auth.requiresAdmin, users.remove);
	app.post('/user/follow', auth.requiresLogin, users.follow);
	app.post('/user/unfollow', auth.requiresLogin, users.unfollow);
	app.post('/follower/approve', auth.requiresLogin, users.approveFollow);
	app.post('/follower/reject', auth.requiresLogin, users.rejectFollow);
	app.post('/user/autoAssign', auth.requiresLogin, users.autoAssign);
  app.post('/user/assign', auth.requiresLogin, users.assign);

	app.post('/provider/user/remove', auth.requiresLogin, providers.removePatient);
	app.post('/provider/user/add', auth.requiresLogin, providers.addPatient);
	app.post('/provider/approve', auth.requiresLogin, providers.approve);
	app.post('/provider/revoke', auth.requiresLogin, providers.revoke);

	app.post('/schedule', auth.requiresLogin, auth.requiresAdmin, schedules.update);
	app.post('/schedule/remove', auth.requiresLogin, auth.requiresAdmin, schedules.remove);
	app.get('/schedule/new', auth.requiresLogin, auth.requiresAdmin, schedules.createView);
	app.get('/schedule/:id', auth.requiresLogin, auth.requiresAdmin, schedules.view);
	app.get('/schedule/:id/edit', auth.requiresLogin, auth.requiresAdmin, schedules.updateView);
	app.get('/schedule/patients/:id', auth.requiresLogin, auth.requiresAdmin, schedules.patients);

	app.post('/checkintemplate', auth.requiresLogin, auth.requiresAdmin, checkinTemplate.update);
	app.post('/checkintemplate/remove', auth.requiresLogin, auth.requiresAdmin, checkinTemplate.remove);
	app.post('/checkintemplate/link', auth.requiresLogin, auth.requiresAdmin, checkinTemplate.linkToSchedule);
	app.get('/checkintemplate/new', auth.requiresLogin, auth.requiresAdmin, checkinTemplate.createView);
	app.get('/checkintemplate/:id', auth.requiresLogin, auth.requiresAdmin, checkinTemplate.view);
	app.get('/checkintemplate/link/:id', auth.requiresLogin, auth.requiresAdmin, checkinTemplate.linkToSchedule);
	app.get('/checkintemplate/:id/edit', auth.requiresLogin, auth.requiresAdmin, checkinTemplate.updateView);

	app.post('/checkin', auth.requiresLogin, checkin.update);
	app.post('/checkin/remove', auth.requiresLogin, checkin.remove);
	app.post('/checkin/new', auth.requiresLogin, checkin.createView);
	app.post('/checkin/edit', auth.requiresLogin, checkin.editCheckin);
	app.post('/checkin/update', auth.requiresLogin, checkin.addAnswer);
	app.get('/checkin', auth.requiresLogin, checkin.listSurveys);
	app.get('/checkin/survey/:id', auth.requiresLogin, checkin.list);
	app.get('/checkin/:id', auth.requiresLogin, checkin.view);

	app.get('/settings', auth.requiresLogin, function(req, res) {
		res.redirect('/settings/profile');
	});
	app.get('/settings/profile', auth.requiresLogin, settings.profile);
	app.get('/settings/providers', auth.requiresLogin, settings.providers);
	app.get('/settings/following', auth.requiresLogin, settings.following);
	app.get('/settings/followers', auth.requiresLogin, settings.followers);

	app.post('/surveys/new', auth.requiresLogin, auth.requiresAdmin, surveys.create);
	app.post('/surveys/delete', auth.requiresLogin, auth.requiresAdmin, surveys.remove);
	app.post('/surveys/remove/checkin', auth.requiresLogin, auth.requiresAdmin, surveys.removeTemplate);
	app.post('/surveys/add/checkin', auth.requiresLogin, auth.requiresAdmin, surveys.addTemplate);
	app.get('/surveys/create', auth.requiresLogin, auth.requiresAdmin, surveys.create);
	app.get('/surveys/:id', auth.requiresLogin, auth.requiresAdmin, surveys.view);

	//dashboard
	app.get('/dashboard', auth.requiresLogin, dashboard.index);
	app.get('/following', auth.requiresLogin, following.index);

	app.param('userId', users.user);

};
