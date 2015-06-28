/* Following controller */

module.exports = (function() {
	'use strict';

	var mongoose = require('mongoose'),
		moment = require('moment'),
		Checkin = mongoose.model('Checkin'),
		User = mongoose.model('User'),
    Survey = mongoose.model('Survey'),
		async = require('async');

	var getFollowingStream = function(userID, limit, skip, callback) {
		User.find({
			_id: userID,
			'following.approved': true
		}, 'following.id' , function(err, results) {
			if (err) {
				callback(err, null);
			}
      async.map(results[0].following, function(item, callback) {         
        callback(null, item.id);  
			}, function(err, ids) {        
        if(err) {
					callback(err, null);
				}

        Checkin.find({         
          'user_id': {$in: ids }          
				}, {
					'survey_id': true,
					'timestamp': true,
					'user_id': true,
				}, {
					sort: {
						'timestamp': 1
					},
					limit: limit,
					skip: skip
				}, function(err, results) {
					if (err) {
						callback(err, null);
					}
					async.map(results, function(item, callback) {
          	var transformed = {};
						transformed.date = moment(item.timestamp).fromNow();
           
            
            User.findById(item.user_id, function(err, user) {
                if(err) {
                  callback(err, null);
                }
                transformed.user = {
                  name: user.name
                };
                Survey.findById(item.survey_id, function(err, survey) {
                  if (err) {
                    callback (err, null);
                  }
                  transformed.title = survey.title;
                  callback(null, transformed);
                });                
            });                           
					}, function(err, results) {
						if (err) {
							callback(err, null);
						}
						callback(null, results);
					});
				});
			});
		});
	};

	var index = function(req, res, next) {
		getFollowingStream(req.user._id, 10, 0, function(err, results) {
			if(err) {
				next(err);
			}
			res.render('following/index.ejs', {
				results: results
			});
		});
	};

	return {
		index: index,
		getFollowingStream: getFollowingStream
	};

}());

