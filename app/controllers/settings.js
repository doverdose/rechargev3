
module.exports = function() {

	var mongoose = require('mongoose'),
		User = mongoose.model('User'),
		util = require('util'),
		Q = require('q');

	/**
	* Find user by id
	*/

	var user = function (req, res, next, id) {
		User.findOne({ _id : id })
			.exec(function (err, user) {
				if (err) return next(err)
				if (!user) return next(new Error('Failed to load User ' + id))
				req.profile = user
				next()
			})
	}

	/* Edit user
	*/

	var update = function (req, res) {

		User.findOne({ _id : req.body.id })
			.exec(function (err, user) {
				if (err) return next(err)
				if (!user) return next(new Error('Failed to load User ' + id))

				if(req.body.name) user.name = req.body.name;
				if(req.body.email) user.email = req.body.email;
				if(req.body.username) user.username = req.body.username;
				if(req.body.password) user.password = req.body.password;

				user.save(function(err) {
					if (err) return console.log(err)
				});

			})

		res.redirect('/user/' + req.body.id);

	}

	/* Edit profile
	 */
	var profile = function(req, res, next) {

		res.render('settings/profile.ejs', {
			title: 'Profile'
		})

	};

	/* Manage providers
	 */
	var providers = function(req, res, next) {

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

					provider.patients.forEach(function(patient, j) {

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
		var patientIds = [];
		req.user.following.forEach(function(patient, i){
			patientIds.push(patient.id);
		});
		patientConditions['_id'] = { $nin: patientIds };

		User.find(patientConditions, function(err, patients) {
			if (err) {
				deferred.reject(new Error(err));
			} else {
				deferred.resolve(patients);
			}
		});

		return deferred.promise;

	};

	/* Get followers
	 */
	var getFollowers = function(req) {

		var deferred = Q.defer();

		// get list of users who are not admins or providers
		var patientConditions = {
			'permissions.admin': { $ne: true },
			'permissions.provider': { $ne: true }
		};

		// parse ids of followers
		var followerIds = [];
		req.user.following.forEach(function(follower, i){
			followerIds.push(follower.id);
		});
		patientConditions['_id'] = { $in: followerIds };

		User.find(patientConditions, function(err, patients) {
			if (err) {
				deferred.reject(new Error(err));
			} else {
				deferred.resolve(patients);
			}
		});

		return deferred.promise;

	};

	var following = function (req, res, next) {

		var followers,
			approved = [];

		// get list of all patients
		getFollowers(req)
		.then(function(followerDetails) {

			followers = followerDetails;
			return getPatients(req);
		}, function(err) {})
		.then(function(patients) {

			// see approved followers
			var approved = [];
			followers.forEach(function(follower, i) {

				var followerFind = {
					id: follower.id,
					approved: true
				};

				console.log(patients.indexOf(followerFind));

				if(patients.indexOf(followerFind) !== -1) {
					approved[i] = true;
				} else {
					approved[i] = false;
				}

// 				req.user.following.forEach(function(patient, j) {
//
// 					if(patient.approved === true) {
// 						approved[i] = true;
// 					} else {
// 						approved[i] = false;
// 					}
//
// 				});

			});

			res.render('settings/following.ejs', {
				title: 'Following',
				patients: patients,
				followers: followers,
				approved: approved
			});

		}, function(error) {});

	};

	return {
		profile: profile,
		providers: providers,
		following: following
	}
}();
