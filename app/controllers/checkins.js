/* Checkins controller
 */

module.exports = (function() {
	'use strict';

	var mongoose = require('mongoose'),
		Checkin = mongoose.model('Checkin'),
		CheckinTemplate = mongoose.model('CheckinTemplate');

	var view = function(req, res, next) {
		Checkin.findOne({
			_id: req.params.id
		}, function(err, c) {
			if (!c) {
				return next(new Error('Failed to load Check-in ' + req.params.id));
			}

			res.render('checkin/checkinView.ejs', {
				c: c,
				choice: (c.type.indexOf('choice') !== -1)
			});
		});
	};

	var list = function(req, res, next) {
		var Checkin = mongoose.model('Checkin');
		var CheckinTemplate = mongoose.model('CheckinTemplate');

		Checkin.find({
			user_id: req.user._id
		}, function(err, checkins) {
			if (err) {
				return next(err);
			}

			// calculate user score
			var totalScore = 0;
			checkins.forEach(function(checkin) {
				totalScore += checkin.score || 0;
			});

			// get list of checkin templates to
			// show them in the new checkin selector
			CheckinTemplate.find({}, function(err, checkinTemplates) {
				if (err) {
					return next(err);
				}

				res.render('checkin/list.ejs', {
					c: checkins.reverse(),
					checkinTemplates: checkinTemplates,
					totalScore: totalScore
				});

			});

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

// 			// update
// 			Checkin.findOne({
// 				_id: req.body.id
// 			}, function(err, c) {
// 				if (!c) return res.redirect('/checkin');
//
// 				c.type = req.body.type || c.type;
// 				c.title = req.body.title || c.title;
// 				c.question = req.body.question || c.question;
//
// 				if(req.body.answers && req.body.answers.length) {
// 					c.answers = parseForm(req.body).answers;
// 				};
//
// 				c.save(function() {
// 					res.redirect('/checkin/' + c.id);
// 				});
// 			});

		} else {

			CheckinTemplate.findOne({
				_id: req.body.templateId
			}, function(err, template) {
				if(err) {
					return next(err);
				}

				if (!template) {
					return next(new Error('Failed to load Check-in Template' + req.body.templateId));
				}

				template = template.toObject();

				// copy the properties from the checkin template
				req.body.type = template.type;
				req.body.title = template.title;
				req.body.question = template.question;
				req.body.tips = template.tips;
				req.body.score = template.score;

				var formParams = parseForm(req.body);

				// create new checkin
				var checkin = new Checkin(formParams);
				checkin.user_id = req.user.id;

				checkin.save(function(err, newCheckin) {
					if(err) {
						return next(err);
					}

					res.redirect('/checkin/' + newCheckin.id);
				});

			});


		}

	};

	var updateView = function(req, res, next) {

		Checkin.findOne({
			_id: req.params.id
		}, function(err, checkin) {
			if (!checkin) {
				return next(new Error('Failed to load Check-in ' + req.params.id));
			}
			res.render('checkin/checkinEdit.ejs', {
				checkin: checkin
			});
		});

	};

	var createView = function (req, res, next) {

		CheckinTemplate.findOne({
			_id: req.body.id
		}, function(err, template) {
			if (!template) {
				return next(new Error('Failed to load Check-in Template ' + req.body.id));
			}

			res.render('checkin/checkinEdit.ejs', {
				checkin: {},
				template: template
			});

		});

	};

	var remove = function(req, res, next) {

		Checkin.findOne({
			_id: req.body.id
		}, function(err, c) {
			if (!c) {
				return next(new Error('Failed to load Check-in ' + req.body.id));
			}

			c.remove();

			res.redirect('/checkin');
		});

	};

	return {
		createView: createView,
		update: update,
		updateView: updateView,
		remove: remove,
		view: view,
		list: list
	};

}());

