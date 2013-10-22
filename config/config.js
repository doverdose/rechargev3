
var path = require('path'),
	rootPath = path.normalize(__dirname + '/..');

module.exports = function(app) {

	return {
		development: {
			db: 'mongodb://localhost/recharge-development',
			root: rootPath,
			app: {}
		},
		test: {
			db: 'mongodb://localhost/recharge-test',
			root: rootPath,
			app: {}
		},
		staging: {
			db: 'mongodb://komodo:theonlylivingdragon@ds049548.mongolab.com:49548/heroku_app18503207',
			root: rootPath,
			app: {}
		},
		production: {
			db: 'mongodb://localhost/recharge-production',
			root: rootPath,
			app: {}
		}
	}

}
