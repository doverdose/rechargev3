/* Following controller */

module.exports = (function() {
	'use strict';

	var mongoose = require('mongoose'),
		moment = require('moment'),
		Checkin = mongoose.model('Checkin'),
		User = mongoose.model('User'),
    Survey = mongoose.model('Survey'),
    helper = require('./components/helper'),
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
        
        ids.forEach(function(user_id) {
          helper.getMeds(user_id, function(meds){            
          });
        });
        
        getFollowingCheckins(ids, limit, skip, {}, callback);          
          
			});
		});
	};

  var getFollowingCheckins = function(user_id, limit, skip, meds, callback) {
    Checkin.find({         
      'user_id': {$in: user_id}          
    }, {
      'survey_id': true,
      'timestamp': true,
      'user_id': true,
      'answers': true
    }, {
      sort: {
        'timestamp': -1
      },
      limit: limit,
      skip: skip
    }, function(err, results) {
      if (err) {
        callback(err, null, null);
      }
      async.map(results, function(item, callback) {
        var transformed = {};
        transformed.date = moment(item.timestamp).fromNow();

        var answers = item.answers.map(function(answer){
          return {
            title: answer.title,
            text: answer.text,
            score: answer.score
          };
        });

        transformed.answers = answers;

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
          callback(err, null, null);
        }        
        
        callback(null, results, meds);
      });
    });
  }
  
	var index = function(req, res, next) {
		getFollowingStream(req.user._id, 10, 0, function(err, results, meds) {
			if(err) {
				next(err);
			}
			res.render('following/index.ejs', {
				results: results,
        meds: meds
			});
		});
	};

	return {
		index: index,
		getFollowingStream: getFollowingStream
	};

}());

