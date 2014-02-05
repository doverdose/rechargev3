module.exports = function() {

	var mongoose = require('mongoose'),
		util = require('util'),
		Q = require('q'),
		User = mongoose.model('User'),
		Checkin = mongoose.model('Checkin'),
		CheckinTemplate = mongoose.model('CheckinTemplate'),
		Schedule = mongoose.model('Schedule'),
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

	var getSchedules = function() {

		// get list of users who are not admins or providers
		var deferred = Q.defer();

		Schedule.find({
		}, function(err, schedules) {
			if (err) {
				deferred.reject(new Error(err));
			} else {
				deferred.resolve(schedules);
			}
		});

		return deferred.promise;

	};

	var getCheckinTemplates = function() {

		// get list of users who are not admins or providers
		var deferred = Q.defer();

		CheckinTemplate.find({}, function(err, checkinTemplates) {
			if (err) {
				deferred.reject(new Error(err));
			} else {
				deferred.resolve(checkinTemplates);
			}
		});

		return deferred.promise;

	};

	var admin = function(req, res) {

		var templateVars = {};

		// TODO replace all promise functionality with async.parallel
		// for much better performance and error handling

		getPatients(req)
		.then(function(allPatients) {
			templateVars.patients = allPatients;
			return getYourPatients(req);
		}, function(error) {})
		.then(function(yPatients) {
			templateVars.yourPatients = yPatients;
			return getProviders()
		})
		.then(function(allProviders) {

			if(req.user.permissions.admin) {
				templateVars.providers = allProviders;
			}

			return getCheckinTemplates()
		})
		.then(function(checkinTemplates) {
			templateVars.checkinTemplates = checkinTemplates;
			return getSchedules()
		})
		.then(function(schedules) {
			templateVars.schedules = schedules;

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
