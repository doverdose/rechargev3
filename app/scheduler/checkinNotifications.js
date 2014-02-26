/* Checkins notifications
 *
 * Send emails to users who have checkins schedules for today
 */

module.exports = (function() {
	'use strict';

	var mongoose = require('mongoose'),
		async = require('async'),
		moment = require('moment'),
		User = mongoose.model('User'),
		Schedule = mongoose.model('Schedule'),
		Checkin = mongoose.model('Checkin'),
		Notification = mongoose.model('Notification'),
		CheckinTemplate = mongoose.model('CheckinTemplate');

	var templatesDir,
		emailTemplates = require('email-templates');

	var nodemailer = require('nodemailer'),
		smtpTransport;

	var requiredCallbacks = 0,
		firedCallbacks = 0;
	var checkCallbacks = function(callback) {
		// check if all the async callbacks are done
		if(requiredCallbacks !== 0 && requiredCallbacks === firedCallbacks) {
			callback();
		}
	};

	var send = function(done) {
		var Checkin = mongoose.model('Checkin');
		var CheckinTemplate = mongoose.model('CheckinTemplate');

		var model = {};

		async.parallel([
			function(callback) {

				// get list of all patients
				User.find({
					'permissions.admin': { $ne: true },
					'permissions.provider': { $ne: true }
				}, function(err, patients) {
					if (err) {
						return err;
					}

					model.users = patients;

					callback();
				});

			},
			function(callback) {

				// get list of all checkin templates
				CheckinTemplate.find({}, function(err, checkinTemplates) {
					if (err) {
						return err;
					}

					model.checkinTemplates = checkinTemplates;
					callback();

				});

			}
		], function(err) {
			if(err) {
				return err;
			}

			var tomorrow = moment().add('days', 1).hour(0).minute(0).toDate(),
				today = moment().hour(0).minute(0).second(0).toDate();

			model.upcoming = {};

			model.users.forEach(function(patient, i) {

				// increased fired callbacks
				requiredCallbacks++;

				async.parallel([
					function(callback) {

						// get all checkins for patient
						Checkin.find({
							user_id: patient._id
						}, function(err, checkins) {
							if (err) {
								return err;
							}

							model.checkins = checkins;

							callback();

						});

					},
				   function(callback) {

						// get schedules for checking-in
						Schedule.find({
							user_id: patient._id,
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
								return err;
							}

							model.schedules = schedules;

							callback();

						});


					}
				], function(err) {
					if(err) {
						return err;
					}

					// for recurring dates, set the next
					model.schedules.forEach(function(schedule) {

						// if the due_date is past, but this is a recurring check-in
						if(schedule.due_date < new Date() && schedule.repeat_interval) {

							// calculate the number of possible recurring times
							// then add one more to get the 'next' recurring date
							var recurringTimes = parseInt(moment().diff(schedule.due_date, 'days') / schedule.repeat_interval) + 1;

							var nextDueDate = moment(schedule.due_date).add('days', schedule.repeat_interval * recurringTimes).toDate();

							schedule.due_date = nextDueDate;
						}

						// temporarily inject the template in the schedule object
						// to be used in checkin search and templating
						model.checkinTemplates.every(function(template) {
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
						};

						if(compareDate.date) {
							// parse all checkins, to see if we already made the required checkin
							var existingCheckin = false;
							model.checkins.every(function(checkin) {

								// look for a template with the same title and same template
								// made in the last day

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
								model.upcoming[compareDate.object].push(schedule);
							}
						}

					});

					console.log(model.upcoming);

					// increased fired callbacks
					firedCallbacks++;

					// check if all the asyncs are done
					checkCallbacks(done);

				});

			});

		});


	};

	return function(config) {

		smtpTransport = nodemailer.createTransport(config.mail.type, config.mail.transport);
		templatesDir = config.root + '/app/views/email';

		return {
			send: send
		}
	};

}());

