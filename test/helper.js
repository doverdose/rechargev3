/* Helper for tests
 */

var mongoose = require('mongoose'),
	async = require('async'),
	User = mongoose.model('User'),
	Checkin = mongoose.model('Checkin');

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
			Checkin.collection.remove(cb)
		}
	], done);
}
