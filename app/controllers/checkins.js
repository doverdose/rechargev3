/* Checkins controller
 */

module.exports = function() {

	var mongoose = require('mongoose'),
		util = require('util'),
		Checkin = mongoose.model('Checkin');

	var checkinUpdate = function(req, res) {
		Checkin.findOne({_id: req.params.id}, function(err, c) {
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

	var checkinEdit = function(req, res, next) {
		Checkin.findOne({_id: req.params.id}, function(err, c) {
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

	var checkinCreate = function(req, res) {
		var c = new Checkin(req.body);
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

	}

	var checkinDelete = function(req, res) {

		Checkin.findOne({
			_id: req.params.id
		}, function(err, c) {
			if (!c) return res.redirect('/checkin');

			c.remove();

			res.redirect('/checkin');
		});


	}

	var checkinNew = function (req, res) {
		res.render('checkin/checkin_new.ejs', {c: {}});
	}

	var checkinView = function(req, res) {
		Checkin.findOne({_id: req.params.id}, function(err, c) {
			if (!c) return res.redirect('/checkin');

			switch (req.params.format) {
				case 'json':
					res.send(c.__doc);
					break;
				default:
					res.render('checkin/checkin.ejs', {c: c});
			}
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
	}

	return {
		checkinNew: checkinNew,
		checkinCreate: checkinCreate,
		checkinEdit: checkinEdit,
		checkinUpdate: checkinUpdate,
		checkinView: checkinView,
		checkinDelete: checkinDelete,
		list: list
	}

}();

