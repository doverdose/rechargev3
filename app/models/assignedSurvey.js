/* Survey model */

module.exports = (function () {
    'use strict';

    var mongoose = require('mongoose'),
        Schema = mongoose.Schema;

    /**
     * AssignedSurvey Schema
     */

    var AssignedSurveySchema = new Schema({
        userId: String,
        surveyId: String,
        isDone: {type: Boolean, default: false}
    });

    /**
     * Virtuals
     */

    AssignedSurveySchema.virtual('id').get(function () {
        return this._id.toHexString();
    });

    mongoose.model('AssignedSurvey', AssignedSurveySchema);

    return {};
}());
