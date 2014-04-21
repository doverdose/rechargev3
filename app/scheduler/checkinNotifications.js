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
		twilio = require('twilio'),
		CheckinTemplate = mongoose.model('CheckinTemplate');

	var templatesDir,
		emailTemplates = require('email-templates'),
		templates;

	var nodemailer = require('nodemailer'),
		smtpTransport,
		config;

	var mailer = [],
		scheduler = [];

	var tomorrow,
		today;

	var resulted = [];

	var send = function(done) {

		tomorrow = moment().add('days', 1).hour(23).minute(59).second(59).toDate();
		today = moment().hour(0).minute(0).second(0).toDate();

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
						callback(err);
						return;
					}
					model.users = patients;
					callback();
				});
			},
			function(callback) {
				// get list of all checkin templates
				CheckinTemplate.find({}, function(err, checkinTemplates) {
					if (err) {
						callback(err);
						return;
					}
					model.checkinTemplates = checkinTemplates;
					callback();
				});

			}
		], function(err) {
			if(err) {
				done(err);
				return;
			}
			model.users.forEach(function(patient, i) {
				scheduler.push(function(callback) {
					scheduleNotification(callback, model, patient);
				});
			});

			async.parallel(scheduler, function(err) {
				if(err) {
					done(err);
					return;
				}
				// run mailer async
				async.parallel(mailer, function(err) {
					if(err) {
						done(err);
						return;
					}
					// done sending emails
					done();
				});

			});
		});

	};

	var scheduleNotification = function(callback, model, patient) {
		var user = {
			upcoming: {}
		};

		async.parallel([
			function(callback) {
				// get all checkins for patient
				Checkin.find({
					user_id: patient._id
				}, function(err, checkins) {
					if (err) {
						callback(err);
						return;
					}
					user.checkins = checkins;
					callback();
				});

			},
			function(callback) {
				// get schedules for checking-in
				Schedule.find({
					user_id: patient._id,
					$and: [{
						$or: [{
							expires: false
						}, {
							expire_date: {
								$gte: today
							}
						}]
					}, {
						$or: [{
							due_date: {
								$gte: today
							}
						}, {
							repeat_interval: {
								$gt: 0
							}
						}]
					}]
				}, function(err, schedules) {
					if (err) {
						callback(err);
						return;
					}
					user.schedules = schedules;

					callback();
				});
			}
		], function(err) {
			if(err) {
				callback(err);
				return;
			}
			// for recurring dates, set the next
			user.schedules.forEach(function(schedule) {
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

					if(user.upcoming[compareDate.object] === undefined) {
						user.upcoming[compareDate.object] = [];
					}
				};
				if(compareDate.date) {
					// parse all checkins, to see if we already made the required checkin
					var existingCheckin = false;
					user.checkins.every(function(checkin) {
						// look for a template with the same title and same template
						// made in the last day

						if(checkin.title === schedule.template.title &&
							checkin.timestamp > moment(compareDate.date).subtract(schedule.repeat_interval, 'days').toDate() &&
							checkin.timestamp < compareDate.date) {

							existingCheckin = true;
							return false;
						}

						return true;
					});
					if(!existingCheckin) {
						user.upcoming[compareDate.object].push(schedule);
					}
				}
			});
			if(user.upcoming['today'] && user.upcoming['today'].length) {
				mailer.push(sendMail(user.upcoming['today'], patient));
			}
			callback();
		});

	};

	var sendMail = function(schedules, patient) {
		return function(done) {
			var transport = nodemailer.createTransport(config.mail.type, config.mail.transport);

			var locals = {
				email: patient.email,
				name: patient.name,
				schedules: []
			};
			var existingSchedules = [];

			async.each(schedules, function(item, callback) {
				var currentItem = item;
				existingSchedules.push(function(callback) {
					Notification.find({
						user_id: patient._id,
						schedule_id: currentItem._id,
						status: 'sent',
						timestamp: {
							$gt: today
						}
					}).exec(function(err, notifications) {
						if (err) {
							callback(err, null);
							return;
						}

						if(notifications.length) {
							callback(null, null);
							return;
						}

						callback(null, currentItem);
					});
				});
				callback(null);
			}, function(err) {
				async.parallel(existingSchedules, function(err, results) {
					for(var i = 0; i < results.length; i++) {
						if(results[i] != null) {
							locals.schedules.push(results[i]);
						}
					}

					if(locals.schedules.length) {
						templates('notification', locals, function(err, html, text) {
							if (err) {
								done(err);
								return;
							}

							resulted.push(locals);

							var notifs = [];
							for(var i = 0; i < locals.schedules.length; i++) {
								var notif = new Notification({
									user_id: patient._id,
									schedule_id: locals.schedules[i]._id,
									status: 'pending',
									timestamp: new Date()
								});
								notif.save();

								notifs.push(notif);
							}

							transport.sendMail({
								from: config.mail.from,
								to: patient.email,
								subject: 'ReCharge Health scheduled check-in',
								html: html,
								text: text
							}, function(err, responseStatus) {
								if (err) {
									done(err);
									return;
								}

								var eachNotif = function(item, callback) {
									item.status = 'sent';
									item.response = responseStatus.message;
									item.timestamp = new Date();

									item.save(function(err) {
										if(err) {
											callback(err);
											return;
										}
										callback();
									});
								};
								var afterEachNotif = function(err) {
									if(err) {
										done(err);
										return;
									}
									done();
								};

								if(patient.phoneNumber !== '' && patient.smsNotifications === true) {
									var client = new twilio.RestClient(config.sms.transport.auth.user, config.sms.transport.auth.pass);
									client.sms.messages.create({
									    to: patient.phoneNumber,
									    from: config.sms.from,
									    body: "This is a notification from ReCharge Health because you have a checked-in scheduled for today."
									}, function(err) {
									    if (err) {
											done(err);
											return;
										}

										async.each(notifs, eachNotif, afterEachNotif);
									});
								} else {
									async.each(notifs, eachNotif, afterEachNotif);
								}
							});
						});
					} else {
						done();
					}
				});
			});
		};
	};

	return function(conf) {
		config = conf;

		smtpTransport = nodemailer.createTransport(config.mail.type, config.mail.transport);
		templatesDir = config.root + '/app/views/email';

		// get all email templates in folder
		emailTemplates(templatesDir, function(err, tmpl) {
			if (err) {
				return err;
			}
			templates = tmpl;
		});

		return {
			send: send,
			resulted: resulted
		}
	};

}());

