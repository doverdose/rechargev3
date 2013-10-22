var mongoose = require('mongoose'),
	util = require('util'),
	Checkin = mongoose.model('Checkin');

exports.dashboard = function(req, res) {
	res.render('../views/dashboard/dashboard.ejs');
}


