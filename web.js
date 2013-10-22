var express = require('express'),
	fs = require('fs'),
	routes = require('./app/controllers/index'),
	mongoose = require('mongoose'),
	mongoStore = require('connect-mongodb'),
	flash = require('connect-flash'),
	path = require('path'),
	engine = require('ejs-locals'),
	passport = require('passport'),
	winston = require('winston');

var app = express();

var env = process.env.NODE_ENV || 'development',
	config = require('./config/config')(app)[env];

// Bootstrap db connection
mongoose.connect(config.db)

// Bootstrap models
var models_path = __dirname + '/app/models'
fs.readdirSync(models_path).forEach(function (file) {
	if (~file.indexOf('.js')) require(models_path + '/' + file)
})

// bootstrap passport config
require('./config/passport')(passport);

// express settings
require('./config/express')(app, config, passport, env);

// Bootstrap routes
require('./config/routes')(app, passport)

module.exports = app;

// if not in development, log to file
if(env !== 'development') {
	console.log('Starting logger...');
	winston.add(winston.transports.File, {
		filename: 'logs/api.log'
	});

	winston.handleExceptions(new winston.transports.File({
		filename: 'logs/error.log'
	}));
}

var port = process.env.PORT || 8080;
app.listen(port);

