/* Checkins controller
 */

module.exports = function() {

	var mongoose = require('mongoose'),
		util = require('util'),
		extend = require('util-extend'),
		Checkin = mongoose.model('Checkin'),
		CheckinTemplate = mongoose.model('CheckinTemplate');

	var view = function(req, res) {
		Checkin.findOne({_id: req.params.id}, function(err, c) {
			if (!c) return res.redirect('/checkin');

			res.render('checkin/checkinView.ejs', {
				c: c,
				choice: (c.type === 'multiplechoice' || c.type === 'singlechoice')
			});
		});
	}

	var list = function(req, res) {
		var Checkin = mongoose.model('Checkin');
		var CheckinTemplate = mongoose.model('CheckinTemplate');

		Checkin.find({
			user_id: req.user._id
		}, function(err, checkins) {

			if (err) throw err;

			CheckinTemplate.find({}, function(err, checkinTemplates) {

				if (err) throw err;

				res.render('checkin/list.ejs', {
					c: checkins.reverse(),
					checkinTemplates: checkinTemplates
				});

			});

		});
	};

	var parseForm = function(form) {

		var newAnswers = [];

		if(form.answers) {
			form.answers.forEach(function(answer, i) {
				// don't add if just whitespace
				if(answer.trim()) {
					newAnswers.push({
						text: answer
					});
				}
			});
		};

		form.answers = newAnswers;

		return form;

	};

	var update = function(req, res) {

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
				if (!template) return res.redirect('/checkin');


				// TODO extend checkin template, and fill in req.body details
				var formParams = parseForm(req.body);

				// create new checkin
				var checkin = new Checkin(formParams);
				checkin.user_id = req.user.id;

				checkin.save(function(err, newCheckin) {
					if(err) {
						console.log(err);
						res.redirect('/checkin');
					}

					res.redirect('/checkin/' + newCheckin.id);
				});

			});


		}

	};

	var updateView = function(req, res) {

		Checkin.findOne({
			_id: req.params.id
		}, function(err, checkin) {
			if (!c) return res.redirect('/checkin');
			res.render('checkin/checkinEdit.ejs', {
				checkin: checkin
			});
		});

	};

	var createView = function (req, res) {

		CheckinTemplate.findOne({
			_id: req.body.id
		}, function(err, template) {
			if (!template) return res.redirect('/checkin');

			res.render('checkin/checkinEdit.ejs', {
				checkin: {},
				template: template
			});

		});

	};

	var remove = function(req, res) {

		Checkin.findOne({
			_id: req.body.id
		}, function(err, c) {
			if (!c) return res.redirect('/checkin');

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
	}

}();

