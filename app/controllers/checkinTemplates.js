/* Checkin Templates controller
 */

module.exports = function() {

	var mongoose = require('mongoose'),
		util = require('util'),
		CheckinTemplate = mongoose.model('CheckinTemplate');

	var remove = function(req, res) {

		CheckinTemplate.findOne({
			_id: req.body.id
		}, function(err, c) {
			if (!c) return res.redirect('/admin');

			c.remove();

			res.redirect('/admin');
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

			// update
			CheckinTemplate.findOne({
				_id: req.body.id
			}, function(err, c) {
				if (!c) return res.redirect('/admin');

				c.type = req.body.type;
				c.title = req.body.title;
				c.question = req.body.question;
				c.answers = parseForm(req.body).answers;

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
					console.log(err);
					res.redirect('/admin');
				}
				res.redirect('/checkintemplate/' + newCheckin.id);
			});

		}

	}

	var updateView = function(req, res, next) {

		CheckinTemplate.findOne({
			_id: req.params.id
		}, function(err, c) {
			if (!c) return res.redirect('/admin');

			switch (req.params.format) {
			case 'json':
				res.send(c.__doc);
				break;
			default:
				res.render('checkinTemplates/checkinTemplateEdit.ejs', {
					c: c
				});
			}
		});

	}

	var createView = function (req, res) {
		res.render('checkinTemplates/checkinTemplateEdit.ejs', { c: {} });
	}

	var view = function(req, res) {

		CheckinTemplate.findOne({
			_id: req.params.id
		}, function(err, c) {
			if (!c) return res.redirect('/checkin');

			switch (req.params.format) {
				case 'json':
					res.send(c.__doc);
					break;
				default:
					res.render('checkinTemplates/checkinTemplateView.ejs', {c: c});
			}
		});

	}


	return {
		createView: createView,
		update: update,
		updateView: updateView,
		remove: remove,
		view: view
	}

}();

