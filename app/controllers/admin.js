module.exports = function() {

	var mongoose = require('mongoose'),
		util = require('util'),
		async = require('async'),
		User = mongoose.model('User'),
		Checkin = mongoose.model('Checkin'),
		CheckinTemplate = mongoose.model('CheckinTemplate'),
		Schedule = mongoose.model('Schedule'),
		dayMilliseconds = 24 * 60 * 60 * 1000;

	var admin = function(req, res) {

		var templateVars = {};

		async.parallel([
		function(callback) {

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
					callback(err);
					return;
				}

				templateVars.patients = patients;

				// convert patients array to object, so we can use in template for schedules
				templateVars.patientsObject = {};
				templateVars.patients.forEach(function(patient, i) {
					templateVars.patientsObject[patient._id] = patient;
				});

				callback();
			});

		},
		function(callback) {

			// if admin return
			if(req.user.permissions.admin) {
				callback();
				return;
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
					callback(err);
					return;
				}
				templateVars.yourPatients = patients;
				callback();
			});

		},
		function(callback) {

			// get full list of providers
			if(req.user.permissions.admin) {
				User.find({
					'permissions.provider': true
				}, function(err, providers) {
					if (err) {
						callback(err);
						return;
					}
					templateVars.providers = providers;
					callback();
				});
			}

		},
		function(callback) {

			// get list of checkin templates
			CheckinTemplate.find({}, function(err, checkinTemplates) {
				if (err) {
					callback(err);
					return;
				}
				templateVars.checkinTemplates = checkinTemplates;

				// convert checkinTemplates array to object, so we can use in template for schedules
				templateVars.templatesObject = {};
				templateVars.checkinTemplates.forEach(function(template, i) {
					templateVars.templatesObject[template._id] = template;
				});

				callback();
			});

		},
		function(callback) {

			// get list of schedules
			Schedule.find({
			}, function(err, schedules) {
				if (err) {
					callback(err);
					return;
				}

				templateVars.schedules = schedules;
				callback();
			});

		}
		], function(err) {

			if (err) throw err;

			var adminTemplate = 'admin/provider';
			if(req.user.permissions.admin) {
				adminTemplate = 'admin/admin';
			};

			res.render(adminTemplate, templateVars);

		});

	};

	return {
		admin: admin
	}
}();
