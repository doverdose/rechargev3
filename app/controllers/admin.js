module.exports = function() {

	var mongoose = require('mongoose'),
		util = require('util'),
		Q = require('q'),
		User = mongoose.model('User'),
		Checkin = mongoose.model('Checkin'),
		dayMilliseconds = 24 * 60 * 60 * 1000;

	var getPatients = function() {

		// get list of users who are not admins or providers
		var deferred = Q.defer();

		User.find({
			'permissions.admin': { $ne: true },
			'permissions.provider': { $ne: true }
		}, function(err, patients) {
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

		getPatients()
		.then(function(allPatients) {
			patients = allPatients;
			return getProviders()
		})
		.then(function(allProviders) {
			providers = allProviders;

			res.render('admin/admin.ejs', {
				patients: patients,
				providers: providers
			});

			return;
		});

	};

	return {
		admin: admin
	}
}();
