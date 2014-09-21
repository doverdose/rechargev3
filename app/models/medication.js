/* Survey model */

module.exports = (function () {
    'use strict';

    var mongoose = require('mongoose'),
        Schema = mongoose.Schema;

    /**
     * Medication Schema
     */

    var MedicationSchema = new Schema({
        genericName: String,
        tradeName: String
    });

    /**
     * Virtuals
     */

    MedicationSchema.virtual('id').get(function () {
        return this._id.toHexString();
    });

    mongoose.model('Medication', MedicationSchema);

    return {};
}());
