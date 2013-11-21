
module.exports = function() {

	var mongoose = require('mongoose'),
		User = mongoose.model('User'),
		util = require('util'),
		Q = require('q');

	var login = function (req, res) {
		// update last_login date
		if(req.user) {
			User.findById(req.user._id, function(err, u) {
				if (!u)
					return next(new Error('Could not find User'));
				else {
					// update last_login
					u.last_login = new Date();

					u.save(function(err) {
						if (err) return console.log(err)
					});
				}
			});
		}

		if (req.session.returnTo) {
			res.redirect(req.session.returnTo)
			delete req.session.returnTo
			return
		}
		res.redirect('/')
	}

	/**
	* Login
	*/

	var signin = function (req, res) {
		res.render('users/login', {
			title: 'Login',
			message: req.flash('error')
		})
	}

	/**
	* Sign-up
	*/

	var signup = function (req, res) {
		res.render('users/signup', {
			title: 'Sign up',
			user: new User()
		})
	}


	/**
	* Create new user
	*/

	var create = function (req, res) {
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
					})
				}

				// return to the admin
				return res.redirect('/admin')

			} else {

				if(err) {
					return res.render('users/signup', {
						errors: err.errors,
						wrongUser: user,
						title: 'Sign up'
					})
				}

				// manually login the user once successfully signed up
				req.logIn(user, function(err) {
					if (err) return next(err)
					return res.redirect('/')
				})
			}
		})
	}


	/**
	* Logout
	*/

	var logout = function (req, res) {
		req.logout();
		res.redirect('/login');
	}

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


	var getProviderPatients = function(patientIds) {

		// get list of users who are not admins or providers
		var deferred = Q.defer();

		User.find({
			'_id': { $in: patientIds }
		}, function(err, docs){
			if (err) {
				deferred.reject(new Error(err));
			} else {
				deferred.resolve(providers);
			}
		});

		return deferred.promise;

	};

	/* View user
	*/

	var view = function (req, res, next) {

		var providerPatients = [],
			allPatients = [],
			patientIds = [];

		if(req.user.permissions.provider || req.user.permissions.admin) {

			// if provider, only see your own patients
			if(req.user.permissions.provider) {
				req.user.patients.forEach(function(patient, i){
					patientIds.push(patient.id);
				});

				if(patientIds.indexOf(req.params.id) === -1) return next(new Error('You can only see your own profile'))
			}

		} else {
			// if patient, see only your profile
			if (req.user.id !== req.params.id) return next(new Error('You can only see your own profile'))
		}

		User.findOne({ _id : req.params.id })
			.exec(function (err, user) {
				if (err) return next(err)
				if (!user) return next(new Error('Failed to load User ' + id))

				if(user.permissions.provider) {

					// get list of provider's patients
					var patientConditions = {
						'permissions.admin': { $ne: true },
						'permissions.provider': { $ne: true }
					};

					// get your own patients
					var patientIds = [];
					user.patients.forEach(function(patient, i){
						patientIds.push(patient.id);
					});
					patientConditions['_id'] = { $in: patientIds };

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

									res.render('users/profile.ejs', {
										title: 'Profile',
										profile: user,
										providerPatients: providerPatients,
										allPatients: allPatients
									})

								}
							});

						}
					});

				} else {

					res.render('users/profile.ejs', {
						title: 'Profile',
						profile: user
					})

				}


			})

	};

	/* New user
	*/

	var newView = function (req, res, next) {

		// TODO if provider, assign users to yourself
		// if patient, see only your profile
		// do this in the template

		res.render('users/new.ejs', {
			title: 'New user',
			profile: new User()
		})

	};

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

	var edit = function (req, res, next) {

		// edit users only if admin
		// only editing your own details
		if(req.user.permissions.admin || req.user.id === req.params.id) {

			User.findOne({ _id : req.params.id })
				.exec(function (err, user) {
					if (err) return next(err)
					if (!user) return next(new Error('Failed to load User ' + id))

					res.render('users/edit.ejs', {
						title: 'Profile',
						profile: user
					})

				})

		} else {
			// if patient, see only your profile
			 return next(new Error('Only admin can edit user details'))
		}


	};

	/* Delete user
	*/

	var remove = function (req, res) {

		User.findOne({ _id : req.body.userId })
			.exec(function (err, user) {
				if (err) return next(err)
				if (!user) return next(new Error('Failed to load User ' + id))

				user.remove();
			});

		res.redirect('/admin');

	}

	/* Remove user from provider
	 */

	var removeFromProvider = function (req, res) {

		var foundUserIndex = false,
			provider;

		var removeUser = function() {

			// remove user with id from list of patients
			provider.patients.forEach(function(patient, i) {
				if(patient.id === req.body.userId) {
					foundUserIndex = i;
					return false;
				}
			});

			if(foundUserIndex !== false) {
				provider.patients.splice(foundUserIndex, 1);
				provider.save();
			}

			res.redirect(req.session.lastUrl || '/admin');

		};

		// check if admin
		if(req.user.permissions.admin) {
			// allow editing on any provider

			User.findOne({ _id : req.body.providerId })
				.exec(function (err, user) {
					if (err) return next(err)
					if (!user) return next(new Error('Failed to load User ' + id))

					provider = user;

					removeUser();
				})

		} else if(req.user.permissions.provider) {

			// allow editing only on your provider account
			if(req.body.providerId === req.user.id) {
				provider = req.user;

				removeUser();
			}

		}

	};

	/* Add user to provider
	 */

	var addToProvider = function (req, res) {

		var provider;

		var addUser = function() {

			// check for empty id
			if(req.body.userId) {
				var patientExists = false;
				provider.patients.forEach(function(patient, i) {
					if(patient.id === req.body.userId) {
						patientExists = true;
						return false;
					}
				});

				// if user already exists, don't add him again
				if(!patientExists) {
					provider.patients.push({
						id: req.body.userId
					});
					provider.save();
				}

			}

			res.redirect(req.session.lastUrl || '/admin');

		};

		// check if admin
		if(req.user.permissions.admin) {
			// allow editing on any provider

			User.findOne({ _id : req.body.providerId })
				.exec(function (err, user) {
					if (err) return next(err)
					if (!user) return next(new Error('Failed to load User ' + id))

					provider = user;

					addUser();
				})

		} else if(req.user.permissions.provider) {

			// allow editing only on your provider account
			if(req.body.providerId === req.user.id) {
				provider = req.user;
				addUser();
			}

		}



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
		removeFromProvider: removeFromProvider,
		addToProvider: addToProvider
	}
}();
