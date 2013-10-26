var mongoose = require('mongoose'),
	util = require('util'),
	Q = require('q'),
	User = mongoose.model('User'),
	Checkin = mongoose.model('Checkin'),
	Notification = mongoose.model('Notification'),
	dayMilliseconds = 24 * 60 * 60 * 1000,
  winston = require('winston');

var path = require('path'),
	templatesDir,
	emailTemplates = require('email-templates');

var nodemailer = require("nodemailer"),
	smtpTransport,
	config;

var allUsers = function() {

	// get list of all users

	var deferred = Q.defer();

	User.find({}, function(err, allUsers) {
		if (err) {
			deferred.reject(new Error(err));
		} else {
			deferred.resolve(allUsers);
		}
	});

	return deferred.promise;

};

var getCheckinsToday = function(user) {

	// get checkins for a user

	var deferred = Q.defer();

	Checkin.find({
		user_id: user._id,
		timestamp: new Date().getTime() - dayMilliseconds
	}, function(err, checkins) {
		if (err) {
			deferred.reject(new Error(err));
		} else {
			deferred.resolve(checkins);
		}
	});

	return deferred.promise;

};

var allNotifications = function(user) {

	// get not sent notifications

	var deferred = Q.defer();

	Notification.find({
		sent: {
			$ne: true
		}
	}, function(err, notifications) {
		if (err) {
			deferred.reject(new Error(err));
		} else {
			deferred.resolve(notifications);
		}
	});

	return deferred.promise;

};

var scheduleNotifications = function(req, res) {

	allUsers()
	.then(function(users) {

		users.forEach(function(user, i) {

			getCheckinsToday(user)
			.then(function(checkins) {

				if(checkins.length === 0) {

					// if the user has a notification set that is less than 24h ago, do nothing
					Notification.findOne({
						timestamp: { $gte: new Date().getTime() - dayMilliseconds }
					}, function(err, notification) {

						// if the user has no checkins already set for the day
						// schedule notification in 24h
						if(!notification) {

							var newNotification = new Notification({
								user_id: user._id,
								timestamp: new Date(new Date().getTime() + dayMilliseconds),
								sent: false
							});

							newNotification.save(function() {});

						}

					});


				}

			});

		});

	})
	.done()

};

var sendNotifications = function(req, res) {

	allNotifications()
	.then(function(notifications) {

		notifications.forEach(function(notification, i) {

			User.findOne({
				_id: notification.user_id
			}).exec(function (err, user) {

				emailTemplates(templatesDir, function(err, template) {

					if (err) {
						console.log(err);
					} else {

						// Prepare nodemailer transport object
						var transport = nodemailer.createTransport(config.mail.type, config.mail.transport);

						// An example users object with formatted email function
						var locals = {
							email: user.email,
							name: user.name
						};

						// Send a single email
						template('notification', locals, function(err, html, text) {
							if (err) {
								console.log(err);
							} else {
								transport.sendMail({
									from: config.mail.from,
									to: user.email,
									subject: 'Notification',
									html: html,
									text: text
								}, function(err, responseStatus) {
									if (err) {
										console.log(err);
									} else {
										console.log(responseStatus.message);

										notification.sent = "true";
										notification.sent_timestamp = new Date();

										notification.save(function(err, callback) {
											console.log(err);
										});
									}
								});
							}
						});

					}
				})

			});

		});

	})
	.done()

};

module.exports = function(cfg) {

	config = cfg;

	smtpTransport = nodemailer.createTransport(config.mail.type, config.mail.transport);
	templatesDir = config.root + '/app/views/email';

	// send notifications that are not sent
	// on server restart
	sendNotifications();
	scheduleNotifications();

	// run the interval every 24h
	setInterval(function() {
		sendNotifications();
		scheduleNotifications();
	}, dayMilliseconds);

}
