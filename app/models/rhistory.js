/* Checkin Template model
 */

module.exports = (function() {
	'use strict';

	var mongoose = require('mongoose'),
		Schema = mongoose.Schema;

	/**
	* CheckinTemplate Schema
	*/

	var RHistorySchema = new Schema({
		user_id: String,
		url: String,
		date: {
			type: Date,
			default: Date.now
		}
	});
	/**
	* Virtuals
	*/

	RHistorySchema.virtual('id').get(function() {
		return this._id.toHexString();
	});

	mongoose.model('RHistory', RHistorySchema);

	return {};
}());
