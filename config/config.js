/* App config
 */

module.exports = function() {
	'use strict';

	var path = require('path'),
		rootPath = path.normalize(__dirname + '/..');

	return {
		development: {
			db: 'mongodb://localhost/recharge-development',
			root: rootPath,
			mail: {
				from: 'ReCharge Health <recharge@gmail.com>',
				type: 'SMTP',
				transport: {
					// nodemailer transport
					service: 'Gmail',
					auth: {
						user: 'rechargeapp.donotreply@gmail.com',
						pass: 'thisisjustwhatweneeded'
					}
				}
			},
			sms: {
				from: 'TWILIO_NUMBER',
				type: 'SMS',
				transport: {
					// nodemailer transport
					service: 'TWILIO',
					auth: {
						user: 'TWILIO_SID',
						pass: 'TWILIO_AUTH_TOKEN'
					}
				}
			},
			app: {}
		},
		nitrous: {
			db: 'mongodb://kimodo:kimono@ds051868.mongolab.com:51868/recharge-dev',
			root: rootPath,
			mail: {
				from: 'ReCharge Health <rechargeapp@gmail.com>',
				type: 'SMTP',
				transport: {
					// nodemailer transport
					service: 'Gmail',
					auth: {
						user: 'rechargeapp.donotreply@gmail.com',
						pass: 'thisisjustwhatweneeded'
					}
				}
			},
			sms: {
				from: 'TWILIO_NUMBER',
				type: 'SMS',
				transport: {
					// nodemailer transport
					service: 'TWILIO',
					auth: {
						user: 'TWILIO_NUMBER',
						pass: 'TWILIO_AUTH_TOKEN'
					}
				}
			},
			app: {}
		},
		test: {
			db: 'mongodb://localhost/recharge-test',
			root: rootPath,
			mail: {
				from: 'ReCharge Health <rechargeapp@gmail.com>',
				type: 'SMTP',
				transport: {
					// nodemailer transport
					service: 'Gmail',
					auth: {
						user: 'rechargeapp.donotreply@gmail.com',
						pass: 'thisisjustwhatweneeded'
					}
				}
			},
			sms: {
				from: 'TWILIO_NUMBER',
				type: 'SMS',
				transport: {
					// nodemailer transport
					service: 'TWILIO',
					auth: {
						user: 'TWILIO_NUMBER',
						pass: 'TWILIO_AUTH_TOKEN'
					}
				}
			},
			app: {}
		},
		staging: {
			db: 'mongodb://komodo:theonlylivingdragon@ds049548.mongolab.com:49548/heroku_app18503207',
			root: rootPath,
			mail: {
				from: 'ReCharge Health <rechargeapp@gmail.com>',
				type: 'SMTP',
				transport: {
					// nodemailer transport
					service: 'Gmail',
					auth: {
						user: 'rechargeapp.donotreply@gmail.com',
						pass: 'thisisjustwhatweneeded'
					}
				}
			},
			sms: {
				from: 'TWILIO_NUMBER',
				type: 'SMS',
				transport: {
					// nodemailer transport
					service: 'TWILIO',
					auth: {
						user: 'TWILIO_NUMBER',
						pass: 'TWILIO_AUTH_TOKEN'
					}
				}
			},
			app: {}
		},
		production: {
			db: 'mongodb://localhost/recharge-production',
			root: rootPath,
			mail: {
				from: 'ReCharge Health <rechargeapp@gmail.com>',
				type: 'SMTP',
				transport: {
					// nodemailer transport
					service: 'Gmail',
					auth: {
						user: 'rechargeapp.donotreply@gmail.com',
						pass: 'thisisjustwhatweneeded'
					}
				}
			},
			sms: {
				from: 'TWILIO_NUMBER',
				type: 'SMS',
				transport: {
					// nodemailer transport
					service: 'TWILIO',
					auth: {
						user: 'TWILIO_NUMBER',
						pass: 'TWILIO_AUTH_TOKEN'
					}
				}
			},
			app: {}
		}
	};

};
