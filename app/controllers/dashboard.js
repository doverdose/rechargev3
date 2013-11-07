var mongoose = require('mongoose'),
	util = require('util'),
	Q = require('q'),
	User = mongoose.model('User'),
	Checkin = mongoose.model('Checkin'),
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
	var s = string.replace(/(^\s*)|(\s*$)/gi,"");
	s = s.replace(/[ ]{2,}/gi," ");
	s = s.replace(/\n /,"\n");
	return s.split(' ').length;
}

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

exports.dashboard = function(req, res) {

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

		stat = stats[i];

		return Q.resolve()
		.then(function() {
			return inactiveUsers(stat.days[0]);
		})
		.then(function(inactiveUsers) {
			stat.inactiveUsers = inactiveUsers;
		})
		.then(function() {
			return activeUsers(stat.days[0], stat.days[1])
		})
		.then(function(users) {
			stat.users = users;

			return checkinsDays(stat.days[0], stat.days[1])
		})
		.then(function(checkins) {
			var deferred = Q.defer();

			stat.checkins = checkins.length

			var sumWords = 0,
				sumQuestions = 0,
				answeredQuestions = 0;

			checkins.forEach(function(c) {
				if(c.questions.length) {
					c.questions.forEach(function(q) {
						sumWords += countWords(q.answer);
						sumQuestions++;
						if(q.answer.length) answeredQuestions++;
					});
				};
			});

			stat.words = parseInt(sumWords / sumQuestions, 10) || 0;
			stat.completion = parseFloat(Math.round((answeredQuestions / sumQuestions || 0) * 100) / 100).toFixed(1);

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
		});
	}

	iterateUntil(stats.length - 1);

};


