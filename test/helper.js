/* Helper for tests
 */

var mongoose = require('mongoose'),
	async = require('async'),
	models = mongoose.modelNames(),
	clearCollection = [];

/**
 * Clear database
 *
 */

// generate an array of functions for each model
// that will clear the model's collection
models.forEach(function(modelName) {
	clearCollection.push(function(callback) {
		mongoose.model(modelName).collection.remove(callback);
	});
});

exports.clearDb = function (done) {
	async.parallel(clearCollection, done);
}
