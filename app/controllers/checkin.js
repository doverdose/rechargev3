var mongoose = require('mongoose'),
	util = require('util'),
	Checkin = mongoose.model('Checkin');

exports.checkin_update = function(req, res) {
	Checkin.findOne({_id: req.params.id}, function(err, c) {
		if (!c) return next(new NotFound('Checkin not found'));
		c.data = req.body.checkin.data;
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

exports.checkin_edit = function(req, res, next) {
    Checkin.findOne({_id: req.params.id}, function(err, c) {
		if (!c) return next(new NotFound('Checkin not found'));
		switch (req.params.format) {
		case 'json':
			res.send(c.__doc);
			break;
		default:
			res.render('checkin/checkin_edit.ejs', {c: c});
		}
    });
}

exports.checkin_create = function(req, res) {
	var c = new Checkin(req.body.checkin);
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

exports.checkin_new = function (req, res) {
	res.render('checkin/checkin_new.ejs', {c: {}});
}

exports.checkin = function(req, res) {
	var Checkin = mongoose.model('Checkin');
	Checkin.find({}, function(err, checkins){
		if (err) throw err;
		res.render('checkin/checkin.ejs', {c: checkins});
	});
}
