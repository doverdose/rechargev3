/*jshint -W083 */
/* Checkins controller */

module.exports = (function() {
	'use strict';

	var mongoose = require('mongoose'),
        Medication = mongoose.model('Medication');

    var createView = function(req, res, next){

        res.render('medications/createUpdate.ejs', {
            title: 'New medication',
            submitButtonText:"Create new medication",
            // setting the medication object to an empty object when not existent prevents the error
            // that comes up when rendering any of its values in the template
            // ex: medication.genericName || ''
            medication:{},
            formAction:'/medications/create'
        });
    };

    var create = function(req, res, next){

        var medication = req.body.medication;

        if(medication && medication.genericName && medication.tradeName){

            var medicationObj = new Medication({
                genericName: medication.genericName,
                tradeName: medication.tradeName
            });

            medicationObj.save(function(err){
                if(err) {
                    next(err);
                }

                res.redirect('/admin');
            });

        }
        //if submitted fields are blank, construct an error object and redirect to creation form again
        else{
            var error  = {};
            if(!medication.genericName) {
                error.genericName = 'Please enter a generic name';
            }
            if(!medication.tradeName) {
                error.tradeName = 'Please enter a trade name';
            }
            res.render('medications/createUpdate.ejs', {
                error: error,
                title: 'New medication',
                submitButtonText:"Create new medication",
                medication:medication,
                formAction:'/medications/create'
            });
        }
    };

    var updateView = function(req,res,next){

        Medication.findOne({_id: req.params.id}, function (err, item) {
            if (err) {
                next(err);
            }
            res.render('medications/createUpdate.ejs', {
                title: 'Edit medication',
                submitButtonText: "Update medication",
                medication: item,
                formAction:'/medications/update'
            });
        });

    };

    var update = function(req,res,next){

        var medication = req.body.medication;
        if(medication && medication.id && medication.genericName && medication.tradeName){

            //find object from the database and update it
            Medication.findOne({_id:medication.id}, function(err, item){
                item.genericName = medication.genericName;
                item.tradeName = medication.tradeName;

                item.save(function(err){
                    if(err) {
                        next(err);
                    }
                    res.redirect('/admin');
                });
            });
        }
        //if submitted fields are blank, construct an error object and redirect to creation form again
        else{
            var error  = {};
            if(!medication.genericName) {
                error.genericName = 'Please enter a generic name';
            }
            if(!medication.tradeName) {
                error.tradeName = 'Please enter a trade name';
            }
            res.render('medications/createUpdate.ejs', {
                error: error,
                title: 'Edit medication',
                submitButtonText:"Update medication",
                medication:medication,
                formAction:'/medications/update'
            });
        }
    };

    var remove = function(req, res, next){

        Medication.findOne({_id:req.body.medicationId},function(err,item){
            if(err){
                next(err);
            }

            if (!item) {
                    return next(new Error('Failed to load Medication ' + req.body.medicationId));
            }

            item.remove();
        })

        res.redirect('/admin');
    };

    return{
        createView: createView,
        create: create,
        updateView: updateView,
        update: update,
        remove:remove
    };
}());

