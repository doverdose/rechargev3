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
		}],
		schedules: [{
			answer: String,
			due_date: Date,
			repeat_interval: Number,
			expires: Boolean,
			expire_date: Date
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
