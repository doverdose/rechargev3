var mongoose = require('mongoose');


exports.index = function(req,res){
    res.render('index.html');
}

exports.dashboard = function(req, res) {
    res.render('dashboard.html');
}

exports.checkin_update = function(req, res) {
    Checkin.findById(req.body.checkin.id, function(c) {
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

exports.checkin_create = function(req, res) {
    var Checkin = mongoose.model('Checkin');
    console.log(req);
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
    res.render('form.html');
}

