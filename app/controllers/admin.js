/* Admin controller
 */

module.exports = (function() {
	'use strict';

	var mongoose = require('mongoose')
	var	async = require('async')
	var	User = mongoose.model('User')
	var	Survey = mongoose.model('Survey')
	var	CheckinTemplate = mongoose.model('CheckinTemplate')
	var	Schedule = mongoose.model('Schedule')
  var Medication = mongoose.model('Medication')
  var helper = require('./components/helper')
  
	var admin = function(req, res, next) {

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
					req.user.patients.forEach(function(patient){
						patientIds.push(patient.id);
					});
					patientConditions._id = {
						$nin: patientIds
					};
				}

				User.find(patientConditions, function(err, patients) {
					if (err) {
						callback(err);
						return;
					}

					templateVars.patients = patients;

					// convert patients array to object, so we can use in template for schedules
					templateVars.patientsObject = {};
					templateVars.patients.forEach(function(patient) {
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
					req.user.patients.forEach(function(patient){
						patientIds.push(patient.id);
					});
					patientConditions._id = { $in: patientIds };
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
				} else {
					callback();
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
					templateVars.checkinTemplates.forEach(function(template) {
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

			},
			function(callback) {
				// get full list of surveys
				Survey.find({
				}, function(err, surveys) {
					if (err) {
						callback(err);
						return;
					}

          var assignableSurveys = [];
          surveys.forEach(function(survey){
              if(!survey.isGenerated){
                  assignableSurveys.push(survey);
              }
          });

          if(req.user.permissions.admin){
              templateVars.surveys = surveys;

          } else{
              templateVars.surveys = assignableSurveys;
          }
					callback();
				});
			},
      function(callback) {
//                get full medication list
          Medication.find({
          }, function(err, items) {
              if (err) {
                  callback(err);
                  return;
              }
              templateVars.medication = items;
              callback();
          });
      },
			function(callback) {
				helper.getCheckinHistory(10, function(err, results){
					templateVars.history = results
					callback()
				})
			}
		], function(err) {

			if (err) {
				return next(err);
			}

			var adminTemplate = 'admin/provider';
			if(req.user.permissions.admin) {
				adminTemplate = 'admin/admin';
			}
			res.render(adminTemplate, templateVars);

		});

	};

	return {
		admin: admin
	};
}());
