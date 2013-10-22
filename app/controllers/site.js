var mongoose = require('mongoose'),
	util = require('util');

// Error handling
function NotFound(msg) {
	this.name = "Not Found";
	Error.call(this, msg);
	Error.captureStackTrace(this, arguments.callee);
}

util.inherits(NotFound, Error);

exports.NotFound = NotFound;

exports.index = function(req,res){
	res.render('../views/site/index.ejs');
}

