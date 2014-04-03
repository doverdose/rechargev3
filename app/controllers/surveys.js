/* Surveys controller */

module.exports = (function() {
	'use strict';

	var mongoose = require('mongoose'),
		Survey = mongoose.model('Survey'),
		CheckinTemplate = mongoose.model('CheckinTemplate');

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
		if(req.body.id) {
			if(req.body.checkinTemplates && req.body.title) {
				if(req.body.id === 'false') {
					var data = {
						checkinTemplates: req.body.checkinTemplates,
						title: req.body.title
					};
					var survey = new Survey(data);
					survey.save(function(err) {
						if(err) {
							next(err);
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

