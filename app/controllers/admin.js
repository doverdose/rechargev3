module.exports = function() {

	var mongoose = require('mongoose'),
		util = require('util'),
		Q = require('q'),
		User = mongoose.model('User'),
		Checkin = mongoose.model('Checkin'),
		dayMilliseconds = 24 * 60 * 60 * 1000;

	var getPatients = function(req) {

		var patientConditions = {
			'permissions.admin': { $ne: true },
			'permissions.provider': { $ne: true }
		};

		// if provider, only see your own patients
		if(req.user.permissions.provider) {

			var patientIds = [];

			req.user.patients.forEach(function(patient, i){
				patientIds.push(patient._id);
			});

			patientConditions['_id'] = { $in: patientIds };

		}

		// get list of users who are not admins or providers
		var deferred = Q.defer();

		User.find(patientConditions, function(err, patients) {
			if (err) {
				deferred.reject(new Error(err));
			} else {
				deferred.resolve(patients);
			}
		});

		return deferred.promise;

	};

	var getProviders = function() {

		// get list of users who are not admins or providers
		var deferred = Q.defer();

		User.find({
			'permissions.provider': true
		}, function(err, providers) {
			if (err) {
				deferred.reject(new Error(err));
			} else {
				deferred.resolve(providers);
			}
		});

		return deferred.promise;

	};

	var admin = function(req, res) {

		var patients = [],
			providers = [];

		getPatients(req)
		.then(function(allPatients) {
			patients = allPatients;
			return getProviders()
		})
		.then(function(allProviders) {
			providers = allProviders;

			var templateVars = {
				patients: patients
			};

			if(req.user.permissions.admin) {
				templateVars.providers = providers;
			}

			var adminTemplate = 'admin/admin';
			if(req.user.permissions.provider) {
				adminTemplate = 'admin/provider';
			};


			res.render(adminTemplate, templateVars);

			return;
		});

	};

	return {
		admin: admin
	}
}();
