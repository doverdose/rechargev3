var mongoose = require('mongoose'),
	util = require('util'),
	User = mongoose.model('User'),
	Checkin = mongoose.model('Checkin'),
	weekDays = 7 * 24 * 60 * 60 * 1000;

var loggedInThisWeek = function(callback) {

	User.find({
		last_login: { $gte: new Date().getTime() - weekDays }
	}, function(err, allUsers) {
		if (err) callback(err);

		callback(null, allUsers.length);
	});

};

var checkinsThisWeek = function(callback) {

	Checkin.find({
		timestamp: { $gte: new Date().getTime() - weekDays }
	}, function(err, allUsers) {
		if (err) callback(err);

		callback(null, allUsers.length);
	});

};

exports.dashboard = function(req, res) {

	loggedInThisWeek(function(err, users) {

		checkinsThisWeek(function(err, checkins) {

			res.render('dashboard/dashboard.ejs', {
				usersThisWeek: users,
				checkinsThisWeek: checkins
			});

		});

	});

};


