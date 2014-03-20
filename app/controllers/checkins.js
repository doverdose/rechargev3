/* Checkins controller
 */

module.exports = (function() {
	'use strict';

	var mongoose = require('mongoose'),
		async = require('async'),
		moment = require('moment'),
		Schedule = mongoose.model('Schedule'),
		Checkin = mongoose.model('Checkin'),
		CheckinTemplate = mongoose.model('CheckinTemplate');

	var view = function(req, res, next) {
		Checkin.findOne({
			_id: req.params.id
		}, function(err, c) {
			if (!c) {
				return next(new Error('Failed to load Check-in ' + req.params.id));
			}

			res.render('checkin/checkinView.ejs', {
				c: c,
				choice: (c.type.indexOf('choice') !== -1)
			});
		});
	};

	var list = function(req, res, next) {
		var Checkin = mongoose.model('Checkin');
		var CheckinTemplate = mongoose.model('CheckinTemplate');

		var templateVars = {};

		async.parallel([
			function(callback) {

				// get checkin details
				Checkin.find({
					user_id: req.user._id
				}, function(err, checkins) {
					if (err) {
						return next(err);
					}

					// calculate user score
					var totalScore = 0;
					checkins.forEach(function(checkin) {
						totalScore += checkin.score || 0;
					});

					templateVars.totalScore = totalScore;
					templateVars.checkins = checkins.reverse();
					callback();

				});

			},
			function(callback) {

				// get list of checkin templates to
				// show them in the new checkin selector
				CheckinTemplate.find({}, function(err, checkinTemplates) {
					if (err) {
						return next(err);
					}

					templateVars.checkinTemplates = checkinTemplates;
					callback();

				});

			}
		], function(err) {
			if(err) {
				next(err);
			}

			var nextMonday = moment().day(8).hour(0).minute(0).toDate(),
				tomorrow = moment().add('days', 1).hour(0).minute(0).toDate(),
				today = moment().hour(0).minute(0).second(0).toDate();

			// get schedules for checking-in
			Schedule.find({
				user_id: req.user._id,
				$and: [
					{
						$or: [
							{
								expires: false
							},
							{
								expire_date: {
									$gte: today
								}
							}
						]
					},
					{
						$or: [
							{
								due_date: {
									$gte: today
								}
							},
							{
								repeat_interval: {
									$gt: 0
								}
							}
						]
					}
				]
			}, function(err, schedules) {
				if (err) {
					return next(err);
				}

				templateVars.schedules = {
					today: [],
					thisWeek: []
				};

				// for recurring dates, set the next
				schedules.forEach(function(schedule) {

					// if the due_date has passed, but this is a recurring check-in
					if(schedule.due_date < new Date() && schedule.repeat_interval) {
						// calculate the number of possible recurring times
						// then add one more to get the 'next' recurring date
						var recurringTimes = parseInt(moment().diff(schedule.due_date, 'days') / schedule.repeat_interval) + 1;

						var nextDueDate = moment(schedule.due_date).add('days', schedule.repeat_interval * recurringTimes).toDate();

						schedule.due_date = nextDueDate;
					}

					// temporarily inject the template in the schedule object
					// to be used in checkin search and templating
					templateVars.checkinTemplates.every(function(template) {
						if(schedule.template_id.equals(template._id)) {
							schedule.template = template;
							return false;
						}
						return true;
					});

					var compareDate = {
						date: null,
						object: null
					};

					// check if the user has already checked-in in the last interval
					if(schedule.due_date < tomorrow) {
						compareDate.date = tomorrow;
						compareDate.object = 'today';
					} else if (schedule.due_date < nextMonday) {
						compareDate.date = nextMonday;
						compareDate.object = 'thisWeek';
					}

					if(compareDate.date) {
						// parse all checkins, to see if we already made the required checkin
						var existingCheckin = false;
						templateVars.checkins.every(function(checkin) {

							// look for a template with the same title made in the last day
							if(
								checkin.title === schedule.template.title &&
								checkin.timestamp > moment(compareDate.date).subtract(schedule.repeat_interval, 'days').toDate() &&
								checkin.timestamp < compareDate.date
							) {

								existingCheckin = true;
								return false;
							}

							return true;
						});

						if(!existingCheckin) {
							templateVars.schedules[compareDate.object].push(schedule);
						}
					}


				});

				res.render('checkin/list.ejs', templateVars);

			});


		});


	};

	var parseForm = function(form) {

		var newAnswers = [];

		if(form.answers && form.answers.length) {
			form.answers.forEach(function(answer) {
				// don't add if just whitespace
				if(answer.trim()) {
					newAnswers.push({
						text: answer
					});
				}
			});
		}

		form.answers = newAnswers;

		return form;

	};

	var update = function(req, res, next) {
		CheckinTemplate.findOne({
			_id: req.body.templateId
		}, function(err, template) {
			if(err) {
				return next(err);
			}

			if (!template) {
				return next(new Error('Failed to load Check-in Template' + req.body.templateId));
			}

			template = template.toObject();

			// copy the properties from the checkin template
			req.body.type = template.type;
			req.body.title = template.title;
			req.body.question = template.question;
			req.body.tips = template.tips;
			req.body.score = template.score;
			req.body.title = template.title;

			var formParams = parseForm(req.body);

			// create new checkin
			var checkin = new Checkin(formParams);
			checkin.user_id = req.user.id;

			checkin.save(function(err, newCheckin) {
				if(err) {
					return next(err);
				}

				res.redirect('/checkin/' + newCheckin.id);
			});

		});

	};

	var updateView = function(req, res, next) {

		Checkin.findOne({
			_id: req.params.id
		}, function(err, checkin) {
			if (!checkin) {
				return next(new Error('Failed to load Check-in ' + req.params.id));
			}
			res.render('checkin/checkinEdit.ejs', {
				checkin: checkin
			});
		});

	};

	var createView = function (req, res, next) {

		CheckinTemplate.findOne({
			_id: req.body.id
		}, function(err, template) {
			if (!template) {
				return next(new Error('Failed to load Check-in Template ' + req.body.id));
			}

			res.render('checkin/checkinEdit.ejs', {
				checkin: {},
				template: template
			});

		});

	};

	var remove = function(req, res, next) {

		Checkin.findOne({
			_id: req.body.id
		}, function(err, c) {
			if (!c) {
				return next(new Error('Failed to load Check-in ' + req.body.id));
			}

			c.remove();

			res.redirect('/checkin');
		});

	};

	return {
		createView: createView,
		update: update,
		updateView: updateView,
		remove: remove,
		view: view,
		list: list
	};

}());

