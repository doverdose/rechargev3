/* Checkins controller
 */

module.exports = (function() {
	'use strict';

	var mongoose = require('mongoose'),
		Checkin = mongoose.model('Checkin'),
		moment = require("moment"),
		async = require('async');

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
			Checkin.find({
				timestamp: {
					$lt: weekEnd.toDate(),
					$gt: weekStart.toDate() 
				}
			}, {
				score: true
			}, {
				sort: {
					timestamp: 1
				}
			}, function(err, results) {
				if (err) {
					return next(err);
				}

				renderVars.weekResults = results;
				callback();
			});
		}, function(callback) {
			Checkin.find({
				timestamp: {
					$lt: monthEnd.toDate(),
					$gt: monthStart.toDate() 
				}
			}, {
				score: true
			}, {
				sort: {
					timestamp: 1
				}
			}, function(err, results) {
				if (err) {
					return next(err);
				}

				renderVars.monthResults = results;
				callback();
			});
		}, function(callback) {
			Checkin.find({
				timestamp: {
					$lt: yearEnd.toDate(),
					$gt: yearStart.toDate() 
				}
			}, {
				score: true
			}, {
				sort: {
					timestamp: 1
				}
			}, function(err, results) {
				if (err) {
					return next(err);
				}

				renderVars.yearResults = results;
				callback();
			});
		}], function(err) {
			if(err) {
				next(err);
			}
			console.log(renderVars);
		});

		res.render('dashboard/index.ejs');
	};

	return {
		index: index
	};

}());

