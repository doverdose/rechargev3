/* Surveys controller */

module.exports = (function() {
	'use strict';

	var mongoose = require('mongoose'),
		Survey = mongoose.model('Survey'),
		CheckinTemplate = mongoose.model('CheckinTemplate'),
        AssignedSurvey = mongoose.model('AssignedSurvey'),
        User = mongoose.model('User');

	var addTemplate = function(req, res, next) {
		Survey.findOne({
			_id: req.body.surveyID
		}, function(err, survey) {
			survey.checkinTemplates.push(req.body.id);
			survey.save(function(err) {
				if(err) {
					next(err);
				}
				res.redirect('/surveys/' + req.body.surveyID);
			});
		});
	};

	var removeTemplate = function(req, res, next) {
		Survey.findOne({
			_id: req.body.surveyID
		}, function(err, survey) {
			survey.checkinTemplates.splice(survey.checkinTemplates.indexOf(req.body.id), 1);
			survey.save(function(err) {
				if(err) {
					next(err);
				}
				res.redirect('/surveys/' + req.body.surveyID);
			});
		});
	};

	var remove = function(req, res, next) {
		Survey.findOneAndRemove({
			_id: req.body.id
		}, function(err) {
			if(err) {
				next(err);
			}
			res.redirect('/admin');
		});
	};

	var view = function(req, res, next) {
		Survey.findOne({
			_id: req.params.id
		}, function(err, survey) {
			if(err) {
				next(err);
			}
			CheckinTemplate.find({
				_id: {
					$in: survey.checkinTemplates
				}
			}, function(err, templates) {
				if(err) {
					next(err);
				}
				CheckinTemplate.find({
					_id: {
						$nin: survey.checkinTemplates
					}
				}, function(err, missingTemplates) {
					res.render('surveys/view', {
						templates: templates,
						survey: survey,
						missingTemplates: missingTemplates
					});
				});
			});
		});
	};

	var create = function(req, res, next) {
        //if request was a post (if a new survey was created)
		if(req.body.id) {
			if(req.body.checkinTemplates && req.body.title) {
				if(req.body.id === 'false') {
                    var isStartingSurvey = false;
                    if(req.body.isStartingSurvey){
                        isStartingSurvey = true;
                    }

					var data = {
						checkinTemplates: req.body.checkinTemplates,
						title: req.body.title,
                        isStartingSurvey: isStartingSurvey
					};

					var survey = new Survey(data);
					survey.save(function(err, savedSurvey) {
						if(err) {
							next(err);
						}
                        else {
                            //update all the surveys different than the current one with the value of "isStartingSurvey" set to false
                            Survey.update({_id: {$ne:savedSurvey._id} },{isStartingSurvey:false},{multi:true}, function(err,num){});

                            if(savedSurvey.isStartingSurvey){
                                User.find({ 'permissions.admin':false,'permissions.provider':false},"",function(err, allUsers){
                                    if(err){}
                                    else{
                                        AssignedSurvey.find({surveyId:savedSurvey._id},"",function(err, assignedSurveys){
                                            if(err){}
                                            else{
                                                var assignedSurveysToInsert = [];
                                                var isUserAssigned = false;

                                                allUsers.forEach(function(user){
                                                    isUserAssigned = false;

                                                    assignedSurveys.forEach(function(assignedSurvey){
                                                        if(user._id == assignedSurvey.userId){
                                                            isUserAssigned = true;
                                                        }
                                                    });

                                                    if(!isUserAssigned){
                                                        assignedSurveysToInsert.push({
                                                            userId: user.id,
                                                            surveyId: savedSurvey.id,
                                                            isDone:false,
                                                            _v:0
                                                        });
                                                    }
                                                });

                                                AssignedSurvey.collection.insert(assignedSurveysToInsert, function(err,items){});
                                            }
                                        });
                                    }
                                });
                            }
                        }
						res.redirect('/admin');
					});
				}
			} else {
				CheckinTemplate.find({}, function(err, templates) {
					if(err) {
						next(err);
					}

					var error  = {};
					if(!req.body.title) {
						error.title = 'Please enter in a title';
					} else if(!req.body.checkinTemplates) {
						error.template = 'Please select at least one template';
					}

					res.render('surveys/create', {
						templates: templates,
						id: false,
						error: error
					});
				});
			}
		} else {
			// show view
			CheckinTemplate.find({}, function(err, templates) {
				if(err) {
					next(err);
				}
				res.render('surveys/create', {
					templates: templates,
					id: false
				});
			});
		}
	};

	return {
		create: create,
		view: view,
		remove: remove,
		removeTemplate: removeTemplate,
		addTemplate: addTemplate
	};

}());

