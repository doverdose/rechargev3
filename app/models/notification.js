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
		timestamp: {
			type: Date,
			default: Date.now
		},
		sent: {
			type: Boolean,
			default: false
		},
		sent_timestamp: {
			type: Date,
			default: ''
		}
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
