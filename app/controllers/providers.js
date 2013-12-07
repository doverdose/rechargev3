
module.exports = function() {

	var mongoose = require('mongoose'),
		User = mongoose.model('User'),
		util = require('util'),
		Q = require('q');

	/* Remove user from provider
	 */

	var removePatient = function (req, res) {

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

		} else {
			// redirect patient to dashboard
			res.redirect(req.session.lastUrl || '/dashboard');
		}

	};

	/* Add user to provider
	 */

	var addPatient = function (req, res) {

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

		} else {
			// redirect patient to dashboard
			res.redirect(req.session.lastUrl || '/dashboard');
		}

	};

	/* Approve provider
	 */
	var approve = function(req, res) {

		// change your own status in the provider's account
		User.findOne({ _id : req.body.providerId })
			.exec(function (err, provider) {
				if (err) return next(err)
				if (!provider) return next(new Error('Failed to load Provider ' + req.body.providerId))

				// find yourself in the provider's patients
				provider.patients.forEach(function(p, i) {
					if(p.id === req.user.id) {
						p.approved = true;
						return false;
					}
				});

				provider.save(function(err) {
					if (err) return next(new Error('Failed to save Provider ' + req.body.providerId));

					// redirect patient to dashboard
					res.redirect(req.session.lastUrl || '/settings/providers');
				});

			})

	};

	/* Reject provider
	 */
	var revoke = function(req, res) {

		// change your own status in the provider's account
		User.findOne({ _id : req.body.providerId })
			.exec(function (err, provider) {
				if (err) return next(err)
				if (!provider) return next(new Error('Failed to load Provider ' + req.body.providerId))

				// find yourself in the provider's patients
				provider.patients.forEach(function(p, i) {
					if(p.id === req.user.id) {
						p.approved = false;
						return false;
					}
				});

				provider.save(function(err) {
					if (err) return next(new Error('Failed to save Provider ' + req.body.providerId));

					// redirect patient to dashboard
					res.redirect(req.session.lastUrl || '/settings/providers');
				});

			})

	};

	return {
		addPatient: addPatient,
		removePatient: removePatient,
		approve: approve,
		revoke: revoke
	}
}();
