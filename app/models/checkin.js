/**
 * Module dependencies.
 */

var mongoose = require('mongoose'),
	Schema = mongoose.Schema,
	ObjectId = Schema.ObjectId;

/**
 * Checkin Schema
 */

var CheckinSchema = new Schema({
	'questions': [{
		'question': String,
		'answer': String
	}],
	'user_id': ObjectId,
	'timestamp': {
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
