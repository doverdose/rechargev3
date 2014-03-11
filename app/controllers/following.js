/* Following controller */

module.exports = (function() {
	'use strict';

	var mongoose = require('mongoose'),
		moment = require('moment'),
		async = require('async');

	var index = function(req, res, next) {
		res.render('following/index.ejs', {
		});
	};

	return {
		index: index
	};

}());

