/* Users controller
 */

module.exports = (function() {
	'use strict';

	var mongoose = require('mongoose'),
		User = mongoose.model('User');

	var login = function (req, res, next) {
		// update last_login date
		if(req.user) {

			User.findOne({
				_id: req.user._id
			}, function(err, u) {

				if (!u) {
					return next(new Error('Could not find User'));
				} else {
					// update last_login
					u.last_login = new Date();

					u.save(function(err) {
						if (err) {
							return console.log(err);
						}
					});
				}

			});
		}

		if (req.session.returnTo) {
			res.redirect(req.session.returnTo);
			delete req.session.returnTo;
			return;
		}

		if(req.user.permissions.provider || req.user.permissions.admin) {
			res.redirect('/admin');
		} else {
			res.redirect('/dashboard');
		}
	};

	/**
	* Login
	*/

	var signin = function (req, res) {
		res.render('users/login', {
			title: 'Login',
			message: req.flash('error')
		});
	};

	/**
	* Sign-up
	*/

	var signup = function (req, res) {
		res.render('users/signup', {
			title: 'Sign up',
			user: new User()
		});
	};


	/**
	* Create new user
	*/
	var create = function (req, res, next) {
		var user = new User(req.body);
		user.provider = 'local';

		var isProvider = false;

		if(user.permissions && user.permissions.provider || req.body.type === 'provider') {
			isProvider = true;
		}

		// remove any sneaky permissions
		user.permissions = {
			admin: false,
			provider: isProvider
		};

		user.save(function (err) {

			if(req.body.admin) {
				if(err && err.errors) {
					return res.render('users/new', {
						errors: err.errors,
						wrongUser: user,
						title: 'New user'
					});
				}

				// return to the admin
				return res.redirect('/admin');

			} else {
				if(err) {
					return res.render('users/signup', {
						errors: err.errors,
						wrongUser: user,
						title: 'Sign up'
					});
				}

				// manually login the user once successfully signed up
				req.logIn(user, function(err) {
					if (err) {
						return next(err);
					}
					return res.redirect('/');
				});
			}
		});
	};


	/**
	* Logout
	*/

	var logout = function (req, res) {
		req.logout();
		res.redirect('/login');
	};

	/**
	* Find user by id
	*/

	var user = function (req, res, next, id) {
		User.findOne({ _id : id })
			.exec(function (err, user) {
				if(err) {
					return next(err);
				}

				if(!user) {
					return next(new Error('Failed to load User ' + id));
				}

				req.profile = user;
				next();
			});
	};


// 	var getProviderPatients = function(patientIds) {
//
// 		// get list of users who are not admins or providers
// 		var deferred = Q.defer();
//
// 		User.find({
// 			'_id': { $in: patientIds }
// 		}, function(err, patients){
// 			if (err) {
// 				deferred.reject(new Error(err));
// 			} else {
// 				deferred.resolve(patients);
// 			}
// 		});
//
// 		return deferred.promise;
//
// 	};

	/* View user
	*/

	var view = function (req, res, next) {

		var providerPatients = [],
			allPatients = [],
			patientIds = [];

		if(req.user.permissions.provider || req.user.permissions.admin) {

			// if provider, only see your own patients
			if(req.user.permissions.provider) {
				req.user.patients.forEach(function(patient){
					patientIds.push(patient.id);
				});

				if(patientIds.indexOf(req.params.id) === -1) {
					return next(new Error('You can only see your own profile'));
				}
			}

		} else {
			// if patient, see only your profile
			if (req.user.id !== req.params.id) {
				return next(new Error('You can only see your own profile'));
			}
		}

		User.findOne({ _id : req.params.id })
			.exec(function (err, user) {
				if (err) {
					return next(err);
				}
				if (!user) {
					return next(new Error('Failed to load User ' + req.params.id));
				}

				if(user.permissions.provider) {

					// get list of provider's patients
					var patientConditions = {
						'permissions.admin': { $ne: true },
						'permissions.provider': { $ne: true }
					};

					// get your own patients
					var patientIds = [];
					user.patients.forEach(function(patient){
						patientIds.push(patient.id);
					});
					patientConditions._id = { $in: patientIds };

					// get current providers patients
					User.find(patientConditions, function(err, patients) {
						if (err) {
							//
						} else {
							providerPatients = patients;

							// get all possible patients
							// those that are not already added to the provider
							User.find({
								'permissions.admin': { $ne: true },
								'permissions.provider': { $ne: true },
								'_id': { $nin: patientIds }
							}, function(err, patients) {
								if (err) {
									//
								} else {

									allPatients = patients;

									res.render('users/view.ejs', {
										title: 'Details',
										profile: user,
										providerPatients: providerPatients,
										allPatients: allPatients
									});

								}
							});

						}
					});

				} else {

					res.render('users/view.ejs', {
						title: 'Details',
						profile: user
					});

				}

			});

	};

	/* New user
	*/

	var newView = function (req, res) {

		// TODO if provider, assign users to yourself
		// if patient, see only your profile
		// do this in the template

		res.render('users/new.ejs', {
			title: 'New user',
			profile: new User()
		});

	};

	/* Edit user
	*/

	var update = function (req, res, next) {

		User.findOne({ _id : req.body.id })
			.exec(function (err, user) {
				if (err) {
					return next(err);
				}

				if(!user) {
					return next(new Error('Failed to load User ' + req.body.id));
				}

				user.name = req.body.name || user.name;
				user.email = req.body.email || user.email;
				user.username = req.body.username || user.username;
				user.phoneNumber = req.body.phoneNumber || user.phoneNumber;
				user.smsNotifications = req.body._smsNotifications || user.smsNotifications;

				if(req.body.password) {
					user.password = req.body.password;
				}

				user.save(function(err) {
					if (err) {
						return console.log(err);
					}
				});

			});

		res.redirect('/settings/profile');

	};

	var edit = function (req, res, next) {

		// edit users only if admin
		// only editing your own details
		if(req.user.permissions.admin || req.user.id === req.params.id) {

			User.findOne({ _id : req.params.id })
				.exec(function (err, user) {
					if (err) {
						return next(err);
					}
					if (!user) {
						return next(new Error('Failed to load User ' + req.params.id));
					}

					res.render('users/edit.ejs', {
						title: 'Profile',
						profile: user
					});

				});

		} else {
			// if patient, see only your profile
			return next(new Error('Only admin can edit user details'));
		}

	};

	/* Delete user
	*/

	var remove = function (req, res, next) {

		User.findOne({ _id : req.body.userId })
			.exec(function (err, user) {
				if (err) {
					return next(err);
				}

				if (!user) {
					return next(new Error('Failed to load User ' + req.body.userId));
				}

				user.remove();
			});

		res.redirect('/admin');

	};

	/* Follow user
	 */
	var follow = function (req, res) {

		req.user.following.push({
			id: req.body.userId,
			approved: false
		});

		req.user.save();

		res.redirect(req.session.lastUrl || '/');

	};

	/* Unfollow user
	 */
	var unfollow = function (req, res) {

		req.user.following.every(function(following, i) {
			if(following.id === req.body.userId) {
				req.user.following.splice(i, 1);
				return false;
			}
			return true;
		});

		req.user.save();

		res.redirect(req.session.lastUrl || '/');

	};

	/* Approve follow
	 */
	var approveFollow = function (req, res, next) {

		/* Find user with followerId.
		 * Then find the current logged-in user in the users' following array
		 * and set it's approved value to true
		 */
		User.findOne({ _id : req.body.followerId })
			.exec(function (err, follower) {
				if (err) {
					return next(err);
				}
				if (!user) {
					return next(new Error('Failed to load User ' + req.body.followerId));
				}

				follower.following.every(function(following) {
					if(following.id === req.user.id) {
						following.approved = true;
						return false;
					}

					return true;
				});

				follower.save();
				res.redirect(req.session.lastUrl || '/');

			});

	};

	/* Reject follow
	 */
	var rejectFollow = function (req, res, next) {

		/* Find user with followerId.
		 * Then find the current logged-in user in the users' following array
		 * and set it's approved value to false
		 */
		User.findOne({ _id : req.body.followerId })
			.exec(function (err, follower) {
				if (err) {
					return next(err);
				}

				if (!follower) {
					return next(new Error('Failed to load User ' + req.body.followerId));
				}

				follower.following.every(function(following) {
					if(following.id === req.user.id) {
						following.approved = false;
						return false;
					}

					return true;
				});

				follower.save();
				res.redirect(req.session.lastUrl || '/');

			});

	};


	return {
		authCallback: login,
		session: login,
		signup: signup,
		signin: signin,
		logout: logout,
		user: user,
		create: create,
		newView: newView,
		view: view,
		edit: edit,
		update: update,
		remove: remove,
		follow: follow,
		approveFollow: approveFollow,
		rejectFollow: rejectFollow,
		unfollow: unfollow
	};

}());
