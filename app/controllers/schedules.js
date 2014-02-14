/* Schedule controller
 */

module.exports = (function() {
	'use strict';

	var mongoose = require('mongoose'),
		async = require('async'),
		moment = require('moment'),
		Schedule = mongoose.model('Schedule'),
		User = mongoose.model('User'),
		CheckinTemplate = mongoose.model('CheckinTemplate');

	var remove = function(req, res, next) {

		Schedule.findOne({
			_id: req.body.id
		}, function(err, schedule) {
			if (!schedule) {
				return next(new Error('Failed to find Schedule ' + req.body.id));
			}

			schedule.remove();

			res.redirect('/admin');
		});

	};

	var update = function(req, res, next) {

		if(req.body.id) {

			// update
			Schedule.findOne({
				_id: req.body.id
			}, function(err, schedule) {
				if (!schedule) {
					return next(new Error('Failed to find Schedule ' + req.body.id));
				}

				// update schedule with
				schedule.template_id = req.body.template_id || schedule.template_id;
				schedule.repeat_interval = req.body.repeat_interval || schedule.repeat_interval;
				schedule.due_date = req.body.due_date || schedule.due_date;

				schedule.save(function() {
					res.redirect('/schedule/' + schedule.id);
				});
			});

		} else {

			// create
			var schedule = new Schedule(req.body);

			schedule.save(function(err, newSchedule) {
				if (err) {
					return next(err);
				}

				res.redirect('/schedule/' + newSchedule.id);
			});

		}

	};

	var updateView = function(req, res, next) {

		Schedule.findOne({
			_id: req.params.id
		}, function(err, schedule) {
			if (!schedule) {
				return next(new Error('Failed to find Schedule ' + req.params.id));
			}

			var templateVars = {
				schedule: schedule.toObject()
			};

			templateVars.schedule.due_date = moment(templateVars.schedule.due_date).format('MM/DD/YYYY');

			formView(req, res, next, templateVars);

		});

	};

	var createView = function (req, res, next) {

		var templateVars = {
			schedule: {
				due_date: moment().format('MM/DD/YYYY')
			}
		};

		formView(req, res, next, templateVars);

	};

	var formView = function(req, res, next, templateVars) {

		async.parallel([
			function(callback) {

				CheckinTemplate.find({
				}, function(err, templates) {
					if (err) {
						callback(err);
						return;
					}

					templateVars.templates = templates;

					callback();
				});

			},
			function(callback) {

				User.find({
					'permissions.admin': { $ne: true },
					'permissions.provider': { $ne: true }
				}, function(err, patients) {
					if (err) {
						callback(err);
						return;
					}

					templateVars.patients = patients;

					callback();
				});

			}
		], function(err) {
			if (err) {
				return next(err);
			}

			res.render('schedule/scheduleEdit.ejs', templateVars);
		});

	};

	var view = function(req, res, next) {

		var templateVars = {};

		Schedule.findOne({
			_id: req.params.id
		}, function(err, schedule) {
			if (!schedule) {
				return next(new Error('Failed to find Schedule ' + req.params.id));
			}

			templateVars.schedule = schedule;

			async.parallel([
				function(callback) {

					User.findOne({
						_id: schedule.user_id
					}, function(err, user) {
						if (!user) {
							return next(new Error('Failed to find User ' + schedule.user_id));
						}

						templateVars.forUser = user;

						callback();
					});

				},
				function(callback) {

					CheckinTemplate.findOne({
						_id: schedule.template_id
					}, function(err, template) {
						if (!template) {
							return next(new Error('Failed to find Checkin Template ' + schedule.template_id));
						}

						templateVars.template = template;

						callback();
					});

				}
			], function() {

				res.render('schedule/scheduleView.ejs', templateVars);

			});

		});

	};

	return {
		createView: createView,
		update: update,
		updateView: updateView,
		remove: remove,
		view: view
	};

}());

