/* Schedule controller
 */

module.exports = function() {

	var mongoose = require('mongoose'),
		util = require('util'),
		async = require('async'),
		Schedule = mongoose.model('Schedule'),
		User = mongoose.model('User'),
		CheckinTemplate = mongoose.model('CheckinTemplate');

	var remove = function(req, res) {

		Schedule.findOne({
			_id: req.body.id
		}, function(err, schedule) {
			if (!schedule) return res.redirect('/admin');

			schedule.remove();

			res.redirect('/admin');
		});

	};

	var update = function(req, res) {

		if(req.body.id) {

			// update
			Schedule.findOne({
				_id: req.body.id
			}, function(err, schedule) {
				if (!c) return res.redirect('/admin');

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
					console.log(err);
					res.redirect('/admin');
				}

				res.redirect('/schedule/' + newSchedule.id);
			});

		}

	};

	var updateView = function(req, res, next) {

		Schedule.findOne({
			_id: req.params.id
		}, function(err, c) {
			if (!c) return res.redirect('/admin');

			res.render('schedule/scheduleEdit.ejs', {
				schedule: schedule
			});
		});

	};

	var createView = function (req, res) {

		var templateVars = {
			schedule: {}
		};

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
			if (err) throw err;

			res.render('schedule/scheduleEdit.ejs', templateVars);
		});

	};

	var view = function(req, res) {

		Schedule.findOne({
			_id: req.params.id
		}, function(err, schedule) {
			if (!c) return res.redirect('/schedule');

			res.render('schedule/scheduleView.ejs', {
				schedule: schedule
			});
		});

	}


	return {
		createView: createView,
		update: update,
		updateView: updateView,
		remove: remove,
		view: view
	}

}();

