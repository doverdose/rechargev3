/* Settings controller
 */

module.exports = (function() {
	'use strict';

	var mongoose = require('mongoose'),
		User = mongoose.model('User'),
		Q = require('q');

	/**
	* Find user by id
	*/

// 	var user = function (req, res, next, id) {
// 		User.findOne({ _id : id })
// 			.exec(function (err, user) {
// 				if (err) {
// 					return next(err);
// 				}
// 				if (!user) {
// 					return next(new Error('Failed to load User ' + id));
// 				}
// 				req.profile = user;
// 				next();
// 			});
// 	};

	/* Edit user
	*/

// 	var update = function (req, res, next) {
//
// 		User.findOne({ _id : req.body.id })
// 			.exec(function (err, user) {
// 				if (err) {
// 					return next(err);
// 				}
// 				if (!user) {
// 					return next(new Error('Failed to load User ' + req.body.id));
// 				}
//
// 				user.name = req.body.name || user.name;
// 				user.email = req.body.email || user.email;
// 				user.username = req.body.username || user.username;
// 				user.password = req.body.password || user.password;
//
// 				user.save(function(err) {
// 					if (err) {
// 						return console.log(err);
// 					}
// 				});
//
// 			});
//
// 		res.redirect('/user/' + req.body.id);
//
// 	};

	/* Edit profile
	 */
	var profile = function(req, res) {

		res.render('settings/profile.ejs', {
			title: 'Profile'
		});

	};

	/* Manage providers
	 */
	var providers = function(req, res) {

		// get providers for current patient
		User.find({
			'permissions.admin': { $ne: true },
			'permissions.provider': true,
			'patients': {
				$elemMatch: {
					id: req.user.id
				}
			}
		}, function(err, providers) {
			if (err) {
				console.log(err);
			} else {

				// see approved providers
				var approved = [];
				providers.forEach(function(provider, i) {

					provider.patients.forEach(function(patient) {

						if(patient.approved === true) {
							approved[i] = true;
						} else {
							approved[i] = false;
						}

					});

				});

				res.render('settings/providers.ejs', {
					title: 'Providers',
					providers: providers,
					approved: approved
				});
			}
		});

	};

	/* Get all patients
	 */
	var getPatients = function(req) {

		var deferred = Q.defer();

		// get list of users who are not admins or providers
		var patientConditions = {
			'permissions.admin': { $ne: true },
			'permissions.provider': { $ne: true }
		};

		// only see users that you are not already following
		var patientIds = [ req.user.id ];
		req.user.following.forEach(function(patient){
			patientIds.push(patient.id);
		});
		patientConditions._id = { $nin: patientIds };

		User.find(patientConditions, function(err, patients) {
			if (err) {
				deferred.reject(new Error(err));
			} else {
				deferred.resolve(patients);
			}
		});

		return deferred.promise;

	};

	/* Get complete user details for users that the patient is following
	 */
	var getFollowingDetails = function(req) {

		var deferred = Q.defer();

		// get list of users who are not admins or providers
		var patientConditions = {
			'permissions.admin': { $ne: true },
			'permissions.provider': { $ne: true }
		};

		// parse ids of followers
		var followerIds = [];
		req.user.following.forEach(function(follower){
			followerIds.push(follower.id);
		});
		patientConditions._id = { $in: followerIds };

		User.find(patientConditions, function(err, patients) {
			if (err) {
				deferred.reject(new Error(err));
			} else {
				deferred.resolve(patients);
			}
		});

		return deferred.promise;

	};

	/* Render the following page
	 */
	var following = function (req, res) {

		var following;

		// get list of all patients
		getFollowingDetails(req)
		.then(function(followerDetails) {

			following = followerDetails;
			return getPatients(req);
		}, function(err) {
			console.log(err);
		})
		.then(function(patients) {

			// see approved followers
			var approved = {};
			following.forEach(function(patient) {

				req.user.following.forEach(function(f) {
					if(f.id === patient.id && f.approved === true) {
						approved[f.id] = true;
						return false;
					}
				});

			});

			res.render('settings/following.ejs', {
				title: 'Following',
				patients: patients,
				following: following,
				approved: approved
			});

		}, function() {});

	};

	/* Get complete user details for users that are following the current patient
	 */
	var getFollowersDetails = function(req) {

		var deferred = Q.defer();

		// get list of users who are not admins or providers
		var patientConditions = {
			'permissions.admin': { $ne: true },
			'permissions.provider': { $ne: true }
		};

		patientConditions.following = {
			$all: {
				$elemMatch: { id: req.user.id }
			}
		};

		User.find(patientConditions, function(err, patients) {
			if (err) {
				deferred.reject(new Error(err));
			} else {
				deferred.resolve(patients);
			}
		});

		return deferred.promise;

	};

	/* Render the followers page
	 */
	var followers = function (req, res) {

		// TODO get list of users following you,
		// approve or deny following you

		// get list of all patients
		getFollowersDetails(req)
		.then(function(followerDetails) {

			var followers = followerDetails;

			// see approved followers
			var approved = {};
			followers.forEach(function(follower) {

				follower.following.forEach(function(f) {
					if(f.id === req.user.id && f.approved === true) {
						approved[follower.id] = true;
						return false;
					}
				});

			});
			res.render('settings/followers.ejs', {
				title: 'Followers',
				followers: followers,
				approved: approved
			});

		}, function(err) {

			console.log(err);

		});

	};

	return {
		profile: profile,
		providers: providers,
		following: following,
		followers: followers
	};

}());
