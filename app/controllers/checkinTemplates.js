/* Checkin Templates controller
 */

module.exports = function() {

	var mongoose = require('mongoose'),
		util = require('util'),
		CheckinTemplate = mongoose.model('CheckinTemplate');

	var remove = function(req, res) {

		CheckinTemplate.findOne({
			_id: req.params.id
		}, function(err, c) {
			if (!c) return res.redirect('/checkin');

			c.remove();

			res.redirect('/checkin');
		});


	}

	var update = function(req, res) {

		CheckinTemplate.findOne({_id: req.params.id}, function(err, c) {
			if (!c) return res.redirect('/checkin');
			c.save(function() {
				switch (req.params.format) {
				case 'json':
				res.send(c.__doc);
				break;
				default:
				res.redirect('/checkin');
				}
			});
		});

	}

	var updateView = function(req, res, next) {
		CheckinTemplate.findOne({_id: req.params.id}, function(err, c) {
			if (!c) return res.redirect('/checkin');
			switch (req.params.format) {
			case 'json':
				res.send(c.__doc);
				break;
			default:
				res.render('checkin/checkin_edit.ejs', {c: c});
			}
		});
	}

	var create = function (req, res) {

		var c = new CheckinTemplate(req.body);
		c.user_id = req.user._id;

		c.save(function() {
			switch (req.params.format) {
				case 'json':
					res.send(c.__doc);
					break;
				default:
					res.redirect('/checkin');
			}
		});

	};

	var createView = function (req, res) {
		res.render('checkinTemplates/checkinTemplateNew.ejs', { c: {} });
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
		create: create,
		createView: createView,
		update: update,
		updateView: updateView,
		remove: remove,
		view: view
	}

}();

