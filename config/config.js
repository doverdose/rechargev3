
var path = require('path'),
	rootPath = path.normalize(__dirname + '/..');

module.exports = function(app) {

	return {
		development: {
			db: 'mongodb://localhost/recharge-development',
			root: rootPath,
			mail: {
				from: 'ReCharge Health <contact@rechargehealth.com>',
				type: 'SMTP',
				transport: {
					// nodemailer transport
					service: "Gmail",
					auth: {
						user: "donotreply@barandisolutions.ro",
						pass: "Tn74_O0xsFZm"
					}
				}
			},
			app: {}
		},
		test: {
			db: 'mongodb://localhost/recharge-test',
			root: rootPath,
			mail: {
				from: 'ReCharge Health <contact@rechargehealth.com>',
				type: 'SMTP',
				transport: {
					// nodemailer transport
					service: "Gmail",
					auth: {
						user: "donotreply@barandisolutions.ro",
						pass: "Tn74_O0xsFZm"
					}
				}
			},
			app: {}
		},
		staging: {
			db: 'mongodb://komodo:theonlylivingdragon@ds049548.mongolab.com:49548/heroku_app18503207',
			root: rootPath,
			mail: {
				from: 'ReCharge Health <contact@rechargehealth.com>',
				type: 'SMTP',
				transport: {
					// nodemailer transport
					service: "Gmail",
					auth: {
						user: "donotreply@barandisolutions.ro",
						pass: "Tn74_O0xsFZm"
					}
				}
			},
			app: {}
		},
		production: {
			db: 'mongodb://localhost/recharge-production',
			root: rootPath,
			mail: {
				from: 'ReCharge Health <contact@rechargehealth.com>',
				type: 'SMTP',
				transport: {
					// nodemailer transport
					service: "Gmail",
					auth: {
						user: "donotreply@barandisolutions.ro",
						pass: "Tn74_O0xsFZm"
					}
				}
			},
			app: {}
		}
	}

}
