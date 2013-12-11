/**
/* Checkin model
 */

module.exports = function() {

	var mongoose = require('mongoose'),
		Schema = mongoose.Schema,
		ObjectId = Schema.ObjectId;

	/**
	* Checkin Schema
	*/

	var CheckinSchema = new Schema({
		templateId: ObjectId,
		user_id: ObjectId,
		answer: String,
		timestamp: {
			type: Date,
			default: Date.now
		}
	});

	/**
	* Virtuals
	*/

	CheckinSchema.virtual('id').get(function() {
		return this._id.toHexString();
	});


	mongoose.model('Checkin', CheckinSchema)

	return {};
	
}();
