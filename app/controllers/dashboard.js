/* Dashboard controller
 */

module.exports = (function() {
	'use strict';

	var mongoose = require('mongoose'),
		Checkin = mongoose.model('Checkin'),
        Survey = mongoose.model('Survey'),
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

		var renderVars = {},
            recentCheckins = {};

		async.parallel([function(callback) {
			checkinsForInterval(req.user._id, weekStart, weekEnd, 'weekResults', renderVars, callback);
		}, function(callback) {
			checkinsForInterval(req.user._id, monthStart, monthEnd, 'monthResults', renderVars, callback);
		}, function(callback) {
			checkinsForInterval(req.user._id, yearStart, yearEnd, 'yearResults', renderVars, callback);
		},function(callback) {
            //get question and answers of the most recent wizard survey (aka medication survey) from the DB
//            checkinsForInterval(req.user._id, yearStart, yearEnd, 'yearResults', renderVars, callback);

            //find a survey that is a wizard survey
            Survey.findOne({isWizardSurvey:true},function(err,survey){
                if(err){next(err)}

                Checkin.find({
                    user_id: req.user._id,
                    survey_id: survey._id
                }, function(err, checkins) {
                    if (err) {
                        return next(err);
                    }
                    checkins = checkins.reverse();
                    checkins.forEach(function(checkin){
                        var checkin = checkin.toObject();

                        var question = checkin.question;
                        var answer = checkin.answers[0].text;

                        if(question in recentCheckins){}
                        else{
                            recentCheckins[question] = [];
                        }
                        recentCheckins[question].push(answer);
                    });

                    callback();
                });
            });

        }], function(err) {
			if(err) {
				next(err);
			}
			res.render('dashboard/index.ejs', {
				jsVars: renderVars,
                recentCheckins:recentCheckins
			});
		});
	};

	return {
		index: index,
		checkinsForInterval: checkinsForInterval
	};

}());

