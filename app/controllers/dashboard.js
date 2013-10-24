var mongoose = require('mongoose'),
	util = require('util'),
	User = mongoose.model('User');

var loggedInThisWeek = function(callback) {

	var weekDays = 7 * 24 * 60 * 60 * 1000;

	User.find({
		last_login: { $gte: new Date().getTime() - weekDays }
	}, function(err, allUsers) {
		if (err) callback(err);

		callback(null, allUsers.length);
	});

};

exports.dashboard = function(req, res) {

	loggedInThisWeek(function(err, usersThisWeek) {
		res.render('dashboard/dashboard.ejs', {
			usersThisWeek: usersThisWeek
		});
	});

};


