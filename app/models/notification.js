/**
 * Notification model
 */

module.exports = (function() {
	'use strict';

	var mongoose = require('mongoose'),
		Schema = mongoose.Schema,
		ObjectId = Schema.ObjectId;

	/**
	* Notification Schema
	*/
	var NotificationSchema = new Schema({
		user_id: ObjectId,
		schedule_id: ObjectId,
		timestamp: {
			type: Date,
			default: Date.now
		},
		status: String,
		response: String
	});

	/**
	* Virtuals
	*/

	NotificationSchema.virtual('id').get(function() {
		return this._id.toHexString();
	});


	mongoose.model('Notification', NotificationSchema);

	return {};

}());
