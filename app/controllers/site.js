var mongoose = require('mongoose'),
	util = require('util');

exports.index = function(req,res){
	res.render('site/index.ejs');
}

