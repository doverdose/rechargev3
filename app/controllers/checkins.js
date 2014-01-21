/* Checkins controller
 */

module.exports = function() {

	var mongoose = require('mongoose'),
		util = require('util'),
		Checkin = mongoose.model('Checkin'),
		CheckinTemplate = mongoose.model('CheckinTemplate');

	var checkinUpdate = function(req, res) {
		Checkin.findOne({_id: req.params.id}, function(err, c) {
			if (!c) return res.redirect('/checkin');
			c.save(function() {
				res.redirect('/checkin');
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

			var formParams = parseForm(req.body);

			// create
			var c = new Checkin(formParams);

			c.save(function(err, newCheckin) {
				 if(err) {
					console.log(err);
					res.redirect('/admin');
				}

				res.redirect('/checkin/' + newCheckin.id);
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



	};

	return {
		createView: createView,
		update: update,
		updateView: updateView,
		remove: remove,

		checkinNew: checkinNew,
		checkinCreate: checkinCreate,
		checkinEdit: checkinEdit,
		checkinUpdate: checkinUpdate,
		checkinView: checkinView,
		checkinDelete: checkinDelete,
		list: list
	}

}();

