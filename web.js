var express = require('express'),
	fs = require('fs'),
	mongoose = require('mongoose'),
	passport = require('passport'),
	winston = require('winston');

var app = express();

var env = process.env.NODE_ENV || 'staging',
	config = require('./config/config')(app)[env];

// Bootstrap db connection
mongoose.connect(config.db);

// Bootstrap models
var models_path = __dirname + '/app/models'
fs.readdirSync(models_path).forEach(function (file) {
	if (~file.indexOf('.js')) require(models_path + '/' + file)
});

// bootstrap passport config
require('./config/passport')(passport);

// express settings
require('./config/express')(app, config, passport, env);

// Bootstrap routes
require('./config/routes')(app, passport)

//run notificationsManager
require('./app/notifications/notificationsManager');

module.exports = app;

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

var port = process.env.PORT || 8080;
app.listen(port);
