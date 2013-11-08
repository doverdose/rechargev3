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
	fakeUser = {
		email: 'admin@admin.com',
		name: 'Admin',
		username: 'admin',
		password: '123',
		permissions: {
			admin: true
		}
	};

describe('Admin', function () {

	before(function (done) {
		// create a new admin user
		var user = new User(fakeUser);
		user.save(done)
	})

	describe('GET /admin', function () {

		context('When not logged in', function () {
			it('should redirect to /login', function (done) {
				agent
				.get('/admin')
				.expect('Content-Type', /plain/)
				.expect(302)
				.expect('Location', '/login')
				.expect(/Moved Temporarily/)
				.end(done)
			})
		})

		context('When logged in', function () {
			before(function (done) {
				// login the user
				agent
				.post('/users/session')
				.field('email', fakeUser.email)
				.field('password', fakeUser.password)
				.end(done)
			})

			it('should respond with Content-Type text/html', function (done) {
				agent
				.get('/admin')
				.expect('Content-Type', /html/)
				.expect(200)
				.expect(/Admin/)
				.end(done)
			})
		})
	})

	after(function (done) {
		require('./helper').clearDb(done);
	})
})
