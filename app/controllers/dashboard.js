/* Dashboard controller
 */

module.exports = (function() {
	'use strict';

	var mongoose = require('mongoose'),
		Q = require('q'),
		User = mongoose.model('User'),
		Checkin = mongoose.model('Checkin'),
		CheckinTemplate = mongoose.model('CheckinTemplate'),
		dayMilliseconds = 24 * 60 * 60 * 1000;

	var activeUsers = function(day1, day2) {

		// get list of users who have logged-in between the two #daysago

		var deferred = Q.defer();

		User.find({
			last_login: {
				$gte: new Date().getTime() - (day1 * dayMilliseconds),
				$lte: new Date().getTime() - (day2 * dayMilliseconds)
			}
		}, function(err, allUsers) {
			if (err) {
				deferred.reject(new Error(err));
			} else {
				deferred.resolve(allUsers.length);
			}
		});

		return deferred.promise;

	};

	var inactiveUsers = function(days) {

		// get list of users who have not logged-in for more than #days

		var deferred = Q.defer();

		User.find({
			last_login: {
				$lte: new Date().getTime() - (days * dayMilliseconds)
			}
		}, function(err, allUsers) {
			if (err) {
				deferred.reject(new Error(err));
			} else {
				deferred.resolve(allUsers.length);
			}
		});

		return deferred.promise;

	};

	var countWords = function(string) {
		var s = string.replace(/(^\s*)|(\s*$)/gi, '');
		s = s.replace(/[ ]{2,}/gi, ' ');
		s = s.replace(/\n /, '\n');
		return s.split(' ').length;
	};

	var checkinsDays = function(day1, day2) {

		var deferred = Q.defer();

		Checkin.find({
			timestamp: {
				$gte: new Date().getTime() - (day1 * dayMilliseconds),
				$lte: new Date().getTime() - (day2 * dayMilliseconds)
			}
		}, function(err, checkins) {
			if (err) {
				deferred.reject(new Error(err));
			} else {
				deferred.resolve(checkins);
			}
		});

		return deferred.promise;

	};

	var checkinTemplatesCount = function() {

		// get complete count of checkin templates

		var deferred = Q.defer();

		CheckinTemplate.count({},
		function(err, checkinTemplatesCount) {
			if (err) {
				deferred.reject(new Error(err));
			} else {
				deferred.resolve(checkinTemplatesCount);
			}
		});

		return deferred.promise;

	};

	var dashboard = function(req, res) {

		var stats = [
			{
				name: 'Last 7 days',
				days: [7, 0]
			},
			{
				name: 'Two weeks ago',
				days: [14, 7]
			},
			{
				name: 'Three weeks ago',
				days: [21, 14]
			},
			{
				name: 'Four weeks ago',
				days: [28, 21]
			}
		];

		var i = 0;
		function iterateUntil(endValue){

			var stat = stats[i];

			return Q.resolve()
			.then(function() {
				return inactiveUsers(stat.days[0]);
			})
			.then(function(inactiveUsers) {
				stat.inactiveUsers = inactiveUsers;
			})
			.then(function() {
				return activeUsers(stat.days[0], stat.days[1]);
			})
			.then(function(users) {
				stat.users = users;

				return checkinTemplatesCount();
			})
			.then(function(checkinTemplates) {
				// count checkin templates
				stat.checkinTemplates = checkinTemplates;

				return checkinsDays(stat.days[0], stat.days[1]);
			})
			.then(function(checkins) {
				var deferred = Q.defer();

				stat.checkins = checkins.length;

				var sumWords = 0;

				checkins.forEach(function(c) {
					c.answers.forEach(function(answer) {
						sumWords += countWords(answer.text);
					});
				});

				stat.words = parseInt(sumWords / stat.checkins, 10) || 0;
				stat.completion = parseFloat(Math.round(stat.checkins / (stat.users * stat.checkinTemplates) * 100)) || 0;

				deferred.resolve();

				return deferred.promise;
			})
			.then(function(){
				if (i === endValue) {

					res.render('dashboard/dashboard.ejs', {
						stats: stats
					});

					return;
				} else {
					i++;
					return iterateUntil(endValue);
				}
			}, function(err) {
				console.log(err);
			});
		}

		iterateUntil(stats.length - 1);

	};

	return {
		dashboard: dashboard
	};

}());


