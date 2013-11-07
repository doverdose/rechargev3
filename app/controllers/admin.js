var mongoose = require('mongoose'),
	util = require('util'),
	Q = require('q'),
	User = mongoose.model('User'),
	Checkin = mongoose.model('Checkin'),
	dayMilliseconds = 24 * 60 * 60 * 1000;

var allUsers = function(day1, day2) {

	// get list of users who have logged-in between the two #daysago

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

exports.admin = function(req, res) {

	allUsers()
	.then(function(users) {
		var users = users;

		res.render('admin/admin.ejs', {
			users: users
		});

		return;
	});


};


