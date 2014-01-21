/* Helper for tests
 */

var mongoose = require('mongoose'),
	async = require('async'),
	User = mongoose.model('User'),
	Checkin = mongoose.model('Checkin'),
	CheckinTemplate = mongoose.model('CheckinTemplate');

/**
 * Clear database
 *
 */

exports.clearDb = function (done) {
	async.parallel([
		function (cb) {
			User.collection.remove(cb)
		},
		function (cb) {
			CheckinTemplate.collection.remove(cb)
		},
		function (cb) {
			Checkin.collection.remove(cb)
		}
	], done);
}
