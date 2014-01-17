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
				c.answers = [];

				req.body.answers.forEach(function(a, i) {
					// don't add if just whitespace
					if(a.trim()) {
						c.answers.push({
							value: a
						});
					}
				});

				c.save(function() {
					res.redirect('/checkintemplate/' + c.id);
				});
			});

		} else {

			// create
			var c = new CheckinTemplate(req.body);

			c.save(function(err, newCheckin) {
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

