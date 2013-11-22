module.exports = function() {

	var mongoose = require('mongoose'),
		util = require('util'),
		Q = require('q'),
		User = mongoose.model('User'),
		Checkin = mongoose.model('Checkin'),
		dayMilliseconds = 24 * 60 * 60 * 1000;

	var getPatients = function(req) {

		var deferred = Q.defer();

		// get list of users who are not admins or providers
		var patientConditions = {
			'permissions.admin': { $ne: true },
			'permissions.provider': { $ne: true }
		};

		// only see users that are not already your patients
		if(req.user.permissions.provider) {
			var patientIds = [];
			req.user.patients.forEach(function(patient, i){
				patientIds.push(patient.id);
			});
			patientConditions['_id'] = { $nin: patientIds };
		}

		User.find(patientConditions, function(err, patients) {
			if (err) {
				deferred.reject(new Error(err));
			} else {
				deferred.resolve(patients);
			}
		});

		return deferred.promise;

	};

	var getYourPatients = function(req) {

		var deferred = Q.defer();

		// if admin return
		if(req.user.permissions.admin) {
			deferred.resolve([]);
			return deferred.promise;
		}

		// get list of users who are not admins or providers
		var patientConditions = {
			'permissions.admin': { $ne: true },
			'permissions.provider': { $ne: true }
		};

		// only see your own patients
		if(req.user.permissions.provider) {
			var patientIds = [];
			req.user.patients.forEach(function(patient, i){
				patientIds.push(patient.id);
			});
			patientConditions['_id'] = { $in: patientIds };
		}

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
			yourPatients = [],
			providers = [];

		getPatients(req)
		.then(function(allPatients) {
			patients = allPatients;
			return getYourPatients(req);
		}, function(error) {})
		.then(function(yPatients) {
			yourPatients = yPatients;
			return getProviders()
		})
		.then(function(allProviders) {
			providers = allProviders;

			var templateVars = {
				patients: patients,
				yourPatients: yourPatients
			};

			if(req.user.permissions.admin) {
				templateVars.providers = providers;
			}

			var adminTemplate = 'admin/provider';
			if(req.user.permissions.admin) {
				adminTemplate = 'admin/admin';
			};

			res.render(adminTemplate, templateVars);

			return;
		});

	};

	return {
		admin: admin
	}
}();
