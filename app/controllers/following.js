/* Following controller */

module.exports = (function() {
	'use strict';

	var mongoose = require('mongoose'),
		moment = require('moment'),
		Checkin = mongoose.model('Checkin'),
		User = mongoose.model('User'),
		async = require('async');

	var getFollowigStream = function(userID, limit, skip, callback) {
		User.find({
			_id: userID,
			'following.approved': true
		}, 'following.id' , function(err, results) {
			if (err) {
				callback(err, null);
			}
			async.map(results, function(item, callback) {
				callback(null, item.id);
			}, function(err, ids) {
				if(err) {
					callback(err, null);
				}
				Checkin.find({
					user_id: {
						$in: ids
					}
				}, {
					title: true,
					timestamp: true,
					user_id: true,
				}, {
					sort: {
						timestamp: 1
					},
					limit: limit,
					skip: skip
				}, function(err, results) {
					if (err) {
						callback(err, null);
					}
					async.map(results, function(item, callback) {
						var transformed = {};
						transformed.title = item.title;
						transformed.date = moment(item.timestamp).fromNow();

						User.findById(item.user_id, function(err, user) {
							if(err) {
								callback(err, null);
							}
							transformed.user = {
								name: user.name
							};
							callback(null, transformed);
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
		getFollowigStream(req.user._id, 20, 0, function(err, results) {
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
		getFollowigStream: getFollowigStream
	};

}());

