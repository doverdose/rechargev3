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
		user_id: ObjectId,
		type: String,
		question: String,
		answers: [{
			text: String
		}],
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
