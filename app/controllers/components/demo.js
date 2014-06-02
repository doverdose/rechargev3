module.exports = (function() {
	'use strict';

	var mongoose = require('mongoose'),
		User = mongoose.model('User');

	var createPatient = function(providerID, callback) {
		var patientData = {
			email: 'patient@rechargehealth.com',
			name: 'Demo Patient',
			username: 'patient',
			password: '1234'
		};

		var user = new User(patientData);
		user.save(function(err, user) {
			User.findOne({
				_id: providerID
			}, function(err, provider) {
				provider.patients.push({
					id: user._id,
					approved: true
				});

				provider.save(function() {
					callback();
				});
			});
		});
	};

	var autoAssign = function(userID, callback) {
		User.findOne({
			_id: userID
		}, function(err, patient) {
			patient.autoAssign = Math.floor(Math.random() * 3) + 1

			patient.save(function() {
				callback();
			});
		});
	};

	return {
		createPatient: createPatient,
		autoAssign: autoAssign
	}
}());