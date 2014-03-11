/* Dashboard controller
 */

module.exports = (function() {
	'use strict';

	var mongoose = require('mongoose'),
		Checkin = mongoose.model('Checkin'),
		moment = require('moment'),
		async = require('async');

	var checkinsForInterval = function(userID, startDate, endDate, index, renderVars, callback) {
		Checkin.find({
			timestamp: {
				$lt: endDate.toDate(),
				$gt: startDate.toDate()
			},
			user_id: userID
		}, {
			score: true,
			timestamp: true
		}, {
			sort: {
				timestamp: 1
			}
		}, function(err, results) {
			if (err) {
				callback(err);
			}
			renderVars[index] = results;
			callback(null, results);
		});
	};

	var index = function(req, res, next) {

		var date = moment(),
			weekStart = moment(date).isoWeekday(1).startOf('iweek').hour(0).minute(0).second(0),
			weekEnd = moment(date).isoWeekday(1).startOf('iweek').hour(23).minute(59).second(59).add({days: 6}),
			monthStart = moment(date).isoWeekday(1).startOf('month').hour(0).minute(0).second(0),
			monthEnd = moment(date).isoWeekday(1).endOf('month').hour(23).minute(59).second(59),
			yearStart = moment(date).isoWeekday(1).startOf('year').hour(0).minute(0).second(0),
			yearEnd = moment(date).isoWeekday(1).endOf('year').hour(23).minute(59).second(59);

		var renderVars = {};
		async.parallel([function(callback) {
			checkinsForInterval(req.user._id, weekStart, weekEnd, 'weekResults', renderVars, callback);
		}, function(callback) {
			checkinsForInterval(req.user._id, monthStart, monthEnd, 'monthResults', renderVars, callback);
		}, function(callback) {
			checkinsForInterval(req.user._id, yearStart, yearEnd, 'yearResults', renderVars, callback);
		}], function(err) {
			if(err) {
				next(err);
			}
			res.render('dashboard/index.ejs', {
				jsVars: renderVars
			});
		});
	};

	return {
		index: index,
		checkinsForInterval: checkinsForInterval
	};

}());

