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
		answers: [{
			text: String,
      template_id: String,
      question: String,
      score: String,
      title: String,
      type: String,
      group_id: String,
      surveyVersion: Number,
			timestamp: {
				type: Date,
				default: Date.now
			}
		}],
		pastAnswers: [{
			text: String,
      template_id: String,
      question: String,
      score: String,
      title: String,
      type: String,
      group_id: String,
      surveyVersion: Number,
			timestamp: {
				type: Date
			}
		}],
		timestamp: {
			type: Date,
			default: Date.now
		},
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
