/* Checkin Template model
 */

module.exports = function() {

	var mongoose = require('mongoose'),
		Schema = mongoose.Schema,
		ObjectId = Schema.ObjectId;

	/**
	* CheckinTemplate Schema
	*/

	var CheckinTemplateSchema = new Schema({
		type: String,
		question: String,
		valid:  [{
			value: String
		}]
	});

	/**
	* Virtuals
	*/

	CheckinTemplateSchema.virtual('id').get(function() {
		return this._id.toHexString();
	});


	mongoose.model('CheckinTemplate', CheckinTemplateSchema)

	return {}
}();
