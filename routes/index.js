var mongoose = require('mongoose')
  , util = require('util');

// Error handling
function NotFound(msg) {
    this.name = "Not Found";
    Error.call(this, msg);
    Error.captureStackTrace(this, arguments.callee);
}

util.inherits(NotFound, Error);

exports.NotFound = NotFound;

exports.index = function(req,res){
    res.render('index.ejs');
}

exports.dashboard = function(req, res) {
    res.render('dashboard.ejs');
}

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
    var Checkin = mongoose.model('Checkin');
    Checkin.findOne({_id: req.params.id}, function(err, c) {
	if (!c) return next(new NotFound('Checkin not found'));
	switch (req.params.format) {
	case 'json':
	    res.send(c.__doc);
	    break;
	default:
	    res.render('checkin_edit.ejs', {c: c, dummy: 1});
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
    res.render('checkin_new.ejs');
}

exports.checkin = function(req, res) {
    var Checkin = mongoose.model('Checkin');
    Checkin.find({}, function(err, checkins){
	if (err) throw err;
	res.render('checkin.ejs', {c: checkins});
    });

}

