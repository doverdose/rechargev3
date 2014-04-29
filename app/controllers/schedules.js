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
			if (err) {
				return next(err);
			}
			if (!schedule) {
				return next(new Error('Failed to find Schedule ' + req.body.id));
			}
			schedule.remove();
			res.redirect('/admin');
		});
	};

	var parseDates = function(obj, schedule) {
		// make sure we always use UTC dates
		if(!obj.due_date) {
			// in case the update does not have a new due_date
			obj.due_date = moment.utc(schedule.due_date).format('MM/DD/YYYY');
		}

		obj.due_date += ' UTC';
		if(obj.expiry) {
			var expiryPreset = {
				'1m': { months: 1 },
				'6m': { months: 6 },
				'1y': { years: 1 }
			};
			// set proper expire_date, based on expiry select
			if(obj.expiry === '0') {
				obj.expires = false;
			} else {
				obj.expires = true;
				if(obj.expiry === 'custom') {
					obj.expire_date += ' UTC';
				} else {
					obj.expire_date = moment.utc(obj.due_date).add(expiryPreset[obj.expiry]).toDate();
				}
			}
		}
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

				parseDates(req.body, schedule.toObject());

				// update schedule with
				schedule.user_id = req.body.user_id || schedule.user_id;
				schedule.template_id = req.body.template_id || schedule.template_id;
				schedule.repeat_interval = req.body.repeat_interval || schedule.repeat_interval;
				schedule.due_date = req.body.due_date || schedule.due_date;
				schedule.expires = req.body.expires;
				schedule.expire_date = req.body.expire_date || schedule.expire_date;

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
			templateVars.schedule.expire_date = moment(templateVars.schedule.expire_date).format('MM/DD/YYYY');

			formView(req, res, next, templateVars);
		});

	};

	var createView = function (req, res, next) {
		var templateVars = {
			schedule: {
				due_date: moment().format('MM/DD/YYYY'),
				expire_date: moment().add('years', 1).format('MM/DD/YYYY')
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
			},
			function(callback) {
				User.find({
					'permissions.admin': { $ne: true },
					'permissions.provider': true
				}, function(err, providers) {
					if (err) {
						callback(err);
						return;
					}
					templateVars.providers = providers;
					callback();
				});
			},
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

	var patients = function(req, res, next) {
		if(req.params.id === "-1") {
			User.find({
				'permissions.admin': { $ne: true },
				'permissions.provider': { $ne: true }
			}, {
				_id: true,
				name: true
			}, function(err, patients) {
				if (err) {
					next(err);
					return;
				}
				res.json(patients);
			});
		} else {
			User.findOne({
				_id: req.params.id
			}, function(err, user) {
				if (err) {
					next(err);
					return;
				}

				var ids = [];
				for(var i = 0; i < user.patients.length; i++) {
					ids.push(user.patients[i].id);
				}

				User.find({
					_id: {
						$in: ids
					}
				}, {
					_id: true,
					name: true
				}, function(err, patients) {
					if (err) {
						next(err);
						return;
					}
					res.json(patients);
				});
			});
		}
	};

	return {
		createView: createView,
		update: update,
		updateView: updateView,
		remove: remove,
		view: view,
		patients: patients
	};

}());

