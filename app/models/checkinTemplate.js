/* Checkin Template model
 */

module.exports = (function() {
	'use strict';

	var mongoose = require('mongoose'),
		Schema = mongoose.Schema;

	/**
	* CheckinTemplate Schema
	*/

	var CheckinTemplateSchema = new Schema({
		type: String,
		question: String,
		tips: String,
		score: Number,
		title: String,
		answers: [{
			text: String
		}]
	});

	/**
	* Virtuals
	*/

	CheckinTemplateSchema.virtual('id').get(function() {
		return this._id.toHexString();
	});

	mongoose.model('CheckinTemplate', CheckinTemplateSchema);

	return {};
}());
