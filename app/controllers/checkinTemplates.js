/* Checkin Templates controller
 */

module.exports = (function() {
	'use strict';

	var mongoose = require('mongoose'),
  CheckinTemplate = mongoose.model('CheckinTemplate'),
  Checkin = mongoose.model('Checkin');

	var remove = function(req, res, next) {
		CheckinTemplate.findOne({
			_id: req.body.id
		}, function(err, c) {
			if(!c) {
				return next(new Error('Failed to load Check-in Template' + req.body.id));
			}

			c.remove();

			res.redirect('/admin');
		});
	};

	var parseForm = function(form) {
		var newAnswers = [];
		if(form.answers && form.answers.length) {
			form.answers.forEach(function(answer) {
				// don't add if just whitespace
				if(answer.trim()) {
					newAnswers.push({
						text: answer
					});
				}
			});
		}

		form.answers = newAnswers;
		return form;

	};

	var update = function(req, res, next) {
		if(req.body.id) {
			// update
			CheckinTemplate.findOne({
				_id: req.body.id
			}, function(err, c) {
				if (!c) {
					return next(new Error('Failed to load Check-in Template' + req.body.id));
				}

				// update checkin with
				c.type = req.body.type || c.type;
				c.title = req.body.title || c.title;
				c.question = req.body.question || c.question;
				c.tips = req.body.tips || c.tips;
				c.score = req.body.score || c.score;

				// parse the array of answers, and turn it into an array of objects
				if(req.body.answers && req.body.answers.length) {
					c.answers = parseForm(req.body).answers;
				}

				c.save(function() {
					res.redirect('/checkintemplate/' + c.id);
				});
			});
		} else {
			var formParams = parseForm(req.body);
			// create
			var c = new CheckinTemplate(formParams);
			c.save(function(err, newCheckin) {
				if (err) {
					return next(err);
				}

				res.redirect('/checkintemplate/' + newCheckin.id);
			});
		}
	};

	var updateView = function(req, res, next) {
		CheckinTemplate.findOne({
			_id: req.params.id
		}, function(err, c) {
			if (!c) {
				return next(new Error('Failed to load Check-in Template' + req.params.id));
			}

			res.render('checkinTemplates/checkinTemplateEdit.ejs', {
				c: c
			});
		});
	};

	var createView = function (req, res) {
		// we do this so we can re-use the same template
		// when both editing and creating templates
		var c = {
			answers: [{ text: '' }]
		};
		res.render('checkinTemplates/checkinTemplateEdit.ejs', {
			c: c
		});
	};

	var view = function(req, res, next) {
		CheckinTemplate.findOne({
			_id: req.params.id
		}, function(err, c) {
			if (!c) {
				return next(new Error('Failed to load Check-in Template' + req.params.id));
			}
      
      var checkins = [];
      
      Checkin.find({    
        template_id: c.id
      }, function(err, ci) {
        res.render('checkinTemplates/checkinTemplateView.ejs', {
          c: c,
          checkins: ci, 
          viewer: req.user
        });     
      });         
      
			
		});
	};

	var linkToSchedule = function(req, res, next) {
		if(req.body.id) {
			CheckinTemplate.findOne({
				_id: req.body.id
			}, function(err, checkin) {
				if(err) {
					next(err);
				}
				checkin.schedules = [];
				for(var i = 0; i < req.body.due.length; i++) {
					var scheduleTemplate = {};
					scheduleTemplate.answer = checkin.answers[i].text;
					scheduleTemplate.due_date = req.body.due[i];
					scheduleTemplate.repeat_interval = req.body.interval[i];
					scheduleTemplate.expire_date = req.body['expire_date' + i];
					scheduleTemplate.expires = req.body.expiry[i];
					checkin.schedules.push(scheduleTemplate);
				}
				checkin.save(function(err) {
					if(err) {
						next(err);
					}
					res.redirect('/admin/');
				});
			});
		} else {
			CheckinTemplate.findOne({
				_id: req.params.id
			}, function(err, c) {
				if (!c) {
					return next(new Error('Failed to load Check-in Template' + req.params.id));
				}
				res.render('checkinTemplates/linkToSchedule.ejs', {
					c: c
				});
			});
		}
	};

	return {
		createView: createView,
		update: update,
		updateView: updateView,
		remove: remove,
		view: view,
		linkToSchedule: linkToSchedule
	};

}());

