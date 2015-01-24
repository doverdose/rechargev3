/**
/* Checkin model
 */

module.exports = (function() {
	'use strict';

	var mongoose = require('mongoose'),
		Schema = mongoose.Schema,
		ObjectId = Schema.ObjectId;

	/**
	* Checkin Schema
	*/
	var CheckinSchema = new Schema({
		user_id: ObjectId,
		survey_id: String,
		template_id: String,
		type: String,
		question: String,
		tips: String,
		score: Number,
		title: String,
		answers: [{
			text: String,
			timestamp: {
				type: Date,
				default: Date.now
			}
		}],
		pastAnswers: [{
			text: String,
			timestamp: {
				type: Date
			}
		}],
		timestamp: {
			type: Date,
			default: Date.now
		},
    surveyVersion: Number
	});

	/**
	* Virtuals
	*/

	CheckinSchema.virtual('id').get(function() {
		return this._id.toHexString();
	});

	mongoose.model('Checkin', CheckinSchema);

	return {};

}());
