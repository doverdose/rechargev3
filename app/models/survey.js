/* Survey model */

module.exports = (function() {
	'use strict';

	var mongoose = require('mongoose'),
		Schema = mongoose.Schema;

	/**
	* CheckinTemplate Schema
	*/

	var SurveySchema = new Schema({
		title: String,
		checkinTemplates: [],
        isStartingSurvey: Boolean,
        duration: String,
        recurrence: String
	});

	/**
	* Virtuals
	*/

	SurveySchema.virtual('id').get(function() {
		return this._id.toHexString();
	});

	mongoose.model('Survey', SurveySchema);

	return {};
}());
