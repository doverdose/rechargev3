/* Admin tests
 */

var mongoose = require('mongoose'),
	should = require('should'),
	request = require('supertest'),
	app = require('../web'),
	context = describe,
	User = mongoose.model('User'),
	agent = request.agent(app);

var count,
	timestamp  = new Date().getTime(),
	adminUser = {
		email: 'admin@admin.com',
		name: 'Admin',
		username: 'admin',
		password: '123',
		permissions: {
			admin: true
		}
	},
	providerUser = {
		email: 'provider@provider.com',
		name: 'Provider',
		username: 'provider',
		password: '123',
		permissions: {
			provider: true
		}
	},
	patientUser = {
		email: 'patient@patient.com',
		name: 'Patient',
		username: 'patient',
		password: '123',
		permissions: {}
	};

describe('Admin', function () {

	before(function (done) {

		require('./helper').clearDb(function() {

			// create a new admin user
			var admin = new User(adminUser);
			admin.save(done);

		});

	});

	describe('GET /admin', function () {

		context('When not logged in', function () {
			it('should redirect to /login', function (done) {
				agent
				.get('/admin')
				.expect('Content-Type', /plain/)
				.expect(302)
				.expect('Location', '/login')
				.expect(/Moved Temporarily/)
				.end(done);
			});
		});

		context('When logged in as Admin', function () {
			before(function (done) {
				// login the user
				agent
				.post('/users/session')
				.field('email', adminUser.email)
				.field('password', adminUser.password)
				.end(done);
			});

			it('should respond with Content-Type text/html', function (done) {
				agent
				.get('/admin')
				.expect('Content-Type', /html/)
				.expect(200)
				.expect(/Admin/)
				.end(done)
			})
		})

		context('When logged in as Provider', function () {
			before(function (done) {
				// create a new provider user
				var provider = new User(providerUser);
				provider.save(function() {
					// login the user
					agent
					.post('/users/session')
					.field('email', providerUser.email)
					.field('password', providerUser.password)
					.end(done)
				});

			})

			it('should respond with Content-Type text/html', function (done) {
				agent
				.get('/admin')
				.expect('Content-Type', /html/)
				.expect(200)
				.expect(/Provider/)
				.end(done)
			})
		})

		context('When logged in as Patient', function () {
			before(function (done) {
				// create a new patient user
				var patient = new User(patientUser);
				patient.save(function() {
					// login the user
					agent
					.post('/users/session')
					.field('email', patientUser.email)
					.field('password', patientUser.password)
					.end(done)
				});

			})

			it('should respond with 403 Forbidden', function (done) {
				agent
				.get('/admin')
				.expect(403)
				.expect(/Forbidden/)
				.end(done)
			})
		})
	});

})
