/* User tests
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
		email: 'patient@rechargehealth.com',
		name: 'Patient',
		username: 'patient',
		password: '123'
	},
	fakeProvider = {
		email: 'provider@rechargehealth.com',
		name: 'Provider',
		username: 'provider',
		password: '123',
		permissions: {
			provider: true
		}
	},
	fakeAdmin = {
		email: 'admin@rechargehealth.com',
		name: 'Admin',
		username: 'admin',
		password: '123',
		permissions: {
			admin: true
		}
	},
	newName = 'Patient2',
	userId;

describe('Users', function () {

	describe('Create new Patient', function () {

		it('should register the new user and redirect to /', function (done) {
			agent
			.post('/users')
			.field('name', fakeUser.name)
			.field('username', fakeUser.username)
			.field('email', fakeUser.email)
			.field('password', fakeUser.password)
			.field('permissions[admin]', 'true')
			.expect('Content-Type', /plain/)
			.expect(302)
			.expect('Location', '/')
			.end(done)
		})

			it('should save the user to the database', function (done) {

				User.findOne({ username: fakeUser.username }).exec(function (err, user) {
					should.not.exist(err);
					user.should.be.an.instanceOf(User);
					user.email.should.equal(fakeUser.email);
					done();
				});

			});

		it('should login the new user and redirect to /', function (done) {
			agent
			.post('/users/session')
			.field('email', fakeUser.email)
			.field('password', fakeUser.password)
			.expect('Content-Type', /plain/)
			.expect(302)
			.expect('Location', '/')
			.end(done)
		})

		it('should not have Admin permission', function (done) {

			User.findOne({ username: fakeUser.username }).exec(function (err, user) {
				should.not.exist(err)
				user.permissions.admin.should.not.equal(true)
				done()
			})

		})

		after(function (done) {
			require('./helper').clearDb(done);
		})

	})

	describe('Create new Provider', function () {

		it('should register the new user and redirect to /', function (done) {
			agent
			.post('/users')
			.field('name', fakeProvider.name)
			.field('username', fakeProvider.username)
			.field('email', fakeProvider.email)
			.field('password', fakeProvider.password)
			.field('type', 'provider')
			.expect('Content-Type', /plain/)
			.expect(302)
			.expect('Location', '/')
			.end(done)
		})

		it('should save the user to the database', function (done) {

			User.findOne({ username: fakeProvider.username }).exec(function (err, user) {
				should.not.exist(err);
				user.should.be.an.instanceOf(User);
				user.email.should.equal(fakeProvider.email);
				done();
			});

		});

		it('should login the new user and redirect to /', function (done) {
			agent
			.post('/users/session')
			.field('email', fakeProvider.email)
			.field('password', fakeProvider.password)
			.expect('Content-Type', /plain/)
			.expect(302)
			.expect('Location', '/')
			.end(done)
		})

		it('should have Provider permission', function (done) {

			User.findOne({ username: fakeProvider.username }).exec(function (err, user) {
				should.not.exist(err)
				user.permissions.provider.should.equal(true)
				done()
			})

		})

		after(function (done) {
			require('./helper').clearDb(done);
		})

	})

	describe('Edit user details', function () {

		context('When not logged in', function () {

			it('should redirect to /login', function (done) {
				agent
				.post('/user/update')
				.expect('Content-Type', /plain/)
				.expect(302)
				.expect('Location', '/login')
				.expect(/Moved Temporarily/)
				.end(done)
			})

		})

		context('When logged in as edited user', function () {

			before(function (done) {
				// create a new patient user
				var user = new User(fakeUser);
				user.save(function(err, user) {

					// login the user
					agent
					.post('/users/session')
					.field('email', fakeUser.email)
					.field('password', fakeUser.password)
					.end(done)

					userId = user._id + '';
				})
			})

			it('should respond with Content-Type plain and redirect', function (done) {

				agent
				.post('/user/update')
				.field('id', userId)
				.field('name', newName)
				.expect('Content-Type', /plain/)
				.expect(302)
				.end(done)

			})

			it('should have new name', function (done) {

				User.findOne({ username: fakeUser.username }).exec(function (err, user) {
					should.not.exist(err)
					user.name.should.equal(newName)
					done()
				})

			})

		})

		after(function (done) {
			require('./helper').clearDb(done);
		})

	})

	describe('Delete user', function () {

		before(function (done) {

			// create a new patient user
			var user = new User(fakeUser);
			user.save(function(err, user) {
				userId = user._id + '';
				done();
			})

		});

		context('When not logged in', function () {

			it('should redirect to /login', function (done) {
				agent
				.post('/user/delete')
				.field('userId', userId)
				.expect('Content-Type', /plain/)
				.expect(302)
				.expect('Location', '/login')
				.expect(/Moved Temporarily/)
				.end(done)
			})

		})

		context('When logged in as patient', function () {

			before(function (done) {
				// login the user
				agent
				.post('/users/session')
				.field('email', fakeUser.email)
				.field('password', fakeUser.password)
				.end(done)
			})

			it('should redirect to /dashboard', function (done) {
				agent
				.post('/user/delete')
				.field('userId', userId)
				.expect('Content-Type', /plain/)
				.expect(302)
				.expect('Location', '/dashboard')
				.expect(/Moved Temporarily/)
				.end(done)
			})

			it('should not delete user', function (done) {

				User.findOne({
					username: fakeUser.username
				}).exec(function (err, user) {
					should.not.exist(err)
					user.name.should.equal(fakeUser.name)
					done()
				})

			})

		})

		context('When logged in as admin', function () {

			before(function (done) {
				// create a new admin user
				var user = new User(fakeAdmin);
				user.save(function(err, user) {

					// login the admin
					agent
					.post('/users/session')
					.field('email', fakeAdmin.email)
					.field('password', fakeAdmin.password)
					.end(done)

				})
			})

			it('should delete and redirect to /admin', function (done) {
				agent
				.post('/user/delete')
				.field('userId', userId)
				.expect('Content-Type', /plain/)
				.expect(302)
				.expect('Location', '/admin')
				.expect(/Moved Temporarily/)
				.end(done)
			})

			it('should not contain the user', function (done) {

				User.findOne({
					username: fakeUser.username
				}).exec(function (err, user) {
					should.not.exist(err)
					should.not.exist(user);
					done()
				})

			})

		})

	})

	after(function (done) {
		require('./helper').clearDb(done);
	})
})
