/* Recharge scheduler
 *
 * Sends emails
 */

module.exports = (function() {
	'use strict';

	var fs = require('fs'),
		mongoose = require('mongoose'),
		winston = require('winston');

	var env = process.env.NODE_ENV || 'development',
		config = require('./config/config')()[env];

	// Bootstrap db connection
	mongoose.connect(config.db);

	// Bootstrap models
	var models_path = __dirname + '/app/models'
	fs.readdirSync(models_path).forEach(function (file) {
		if (~file.indexOf('.js')) {
			require(models_path + '/' + file);
		}
	});

	// if not in development, log to file
	if(env !== 'development') {
		console.log('Starting logger...');
		winston.add(winston.transports.File, {
			filename: 'api.log'
		});

		winston.handleExceptions(new winston.transports.File({
			filename: 'error.log'
		}));
	}

	// run checkin notification sender
	var checkinNotifications = require(__dirname + '/app/scheduler/checkinNotifications')(config);
	checkinNotifications.send(function() {
		// once done, exit
		process.exit();
	});

	return {};
}());
