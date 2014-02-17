/**
/* Schedule model
 */

module.exports = (function() {
	'use strict';

	var mongoose = require('mongoose'),
		Schema = mongoose.Schema,
		ObjectId = Schema.ObjectId;

	/**
	* Schedule Schema
	*/
	var ScheduleSchema = new Schema({
		user_id: ObjectId,
		template_id: ObjectId,
		due_date: Date,
		repeat_interval: Number,
		expires: Boolean,
		expire_date: Date
	});

	/**
	* Virtuals
	*/

	ScheduleSchema.virtual('id').get(function() {
		return this._id.toHexString();
	});

	mongoose.model('Schedule', ScheduleSchema);

	return {};

}());
