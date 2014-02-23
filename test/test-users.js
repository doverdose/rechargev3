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
	fakeUser2 = {
		email: 'patient2@rechargehealth.com',
		name: 'Patient2',
		username: 'patient2',
		password: '123'
	},
	fakeProvider = {
		email: 'provider@rechargehealth.com',
		name: 'Provider',
		username: 'provider',
		password: '123',
		patients: [],
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
	userId,
	userId2,
	providerId;

describe('Users', function () {

	before(function(done) {
		require('./helper').clearDb(done);
	});

	describe('Create new Patient/Signup', function () {

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

		context('When logged in as user to be edited', function () {

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

				User.findOne({
					username: fakeUser.username
				}).exec(function (err, user) {
					should.not.exist(err);
					user.name.should.equal(newName);
					done();
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

		context('When logged in as Patient', function () {

			before(function (done) {
				// login the user
				agent
				.post('/users/session')
				.field('email', fakeUser.email)
				.field('password', fakeUser.password)
				.end(done)
			})

			it('should respond with 403 Forbidden', function (done) {
				agent
				.post('/user/delete')
				.field('userId', userId)
				.expect(403)
				.expect(/Forbidden/)
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

		context('When logged in as Admin', function () {

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

		after(function (done) {
			require('./helper').clearDb(done);
		})

	})

	describe('Add Patient to Provider', function () {

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
				.post('/provider/user/add')
				.expect('Content-Type', /plain/)
				.expect(302)
				.expect('Location', '/login')
				.expect(/Moved Temporarily/)
				.end(done)
			})

		})

		context('When logged in as Patient', function () {

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
				.post('/provider/user/add')
				.expect('Content-Type', /plain/)
				.expect(302)
				.expect('Location', '/dashboard')
				.expect(/Moved Temporarily/)
				.end(done)
			})

		})

		context('When logged in as Provider', function () {

			before(function (done) {
				// create a new admin user
				var user = new User(fakeProvider);
				user.save(function(err, user) {

					providerId = user._id + '';

					// login the admin
					agent
					.post('/users/session')
					.field('email', fakeProvider.email)
					.field('password', fakeProvider.password)
					.end(done)

				})
			})

			it('should add user to provider and redirect to /admin', function (done) {
				agent
				.post('/provider/user/add')
				.field('userId', userId)
				.field('providerId', providerId)
				.expect('Content-Type', /plain/)
				.expect(302)
				.expect('Location', '/admin')
				.expect(/Moved Temporarily/)
				.end(done)
			})

			it('should contain the patient', function (done) {

				User.findOne({
					username: fakeProvider.username
				}).exec(function (err, user) {

					var patientIds = [];
					user.patients.forEach(function(patient, i) {
						patientIds.push(patient.id);
					});

					patientIds.should.include(userId);

					done()
				})

			})

		})

		context('When logged in as Admin', function () {

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

			it('should add user to provider and redirect to /admin', function (done) {
				agent
				.post('/provider/user/add')
				.field('userId', userId)
				.field('providerId', providerId)
				.expect('Content-Type', /plain/)
				.expect(302)
				.expect('Location', '/admin')
				.expect(/Moved Temporarily/)
				.end(done)
			})

			it('should contain the patient', function (done) {

				User.findOne({
					username: fakeProvider.username
				}).exec(function (err, user) {

					var patientIds = [];
					user.patients.forEach(function(patient, i) {
						patientIds.push(patient.id);
					});

					patientIds.should.include(userId);

					done()
				})

			})

		})

		after(function (done) {
			require('./helper').clearDb(done);
		})

	})

	describe('Remove Patient from Provider', function () {

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
				.post('/provider/user/remove')
				.expect('Content-Type', /plain/)
				.expect(302)
				.expect('Location', '/login')
				.expect(/Moved Temporarily/)
				.end(done)
			})

		})

		context('When logged in as Patient', function () {

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
				.post('/provider/user/remove')
				.expect('Content-Type', /plain/)
				.expect(302)
				.expect('Location', '/dashboard')
				.expect(/Moved Temporarily/)
				.end(done)
			})

		})

		context('When logged in as Provider', function () {

			before(function (done) {

				var provider = JSON.parse(JSON.stringify(fakeProvider));
				provider.patients.push({
					id: userId
				});

				// create a new provider user
				var user = new User(provider);
				user.save(function(err, user) {

					providerId = user._id + '';

					// login the provider
					agent
					.post('/users/session')
					.field('email', fakeProvider.email)
					.field('password', fakeProvider.password)
					.end(done)

				})
			})

			it('should remove user from provider and redirect to /admin', function (done) {
				agent
				.post('/provider/user/remove')
				.field('userId', userId)
				.field('providerId', providerId)
				.expect('Content-Type', /plain/)
				.expect(302)
				.expect('Location', '/admin')
				.expect(/Moved Temporarily/)
				.end(done)
			})

			it('should not contain the patient', function (done) {

				User.findOne({
					username: fakeProvider.username
				}).exec(function (err, user) {

					var patientIds = [];
					user.patients.forEach(function(patient, i) {
						patientIds.push(patient.id);
					});

					patientIds.should.not.include(userId);

					done()
				})

			})

			after(function(done) {

				// delete provider
				User.findOne({
					username: fakeProvider.username
				}).exec(function (err, user) {
					user.remove(done);
				});

			});

		})

		context('When logged in as Admin', function () {

			before(function (done) {
				// create a new admin user
				var user = new User(fakeAdmin);
				user.save(function(err, user) {

					var provider = JSON.parse(JSON.stringify(fakeProvider));
					provider.patients.push({
						id: userId
					});

					// create a new provider user
					var user = new User(provider);
					user.save(function(err, user) {

						providerId = user._id + '';

						// login the admin
						agent
						.post('/users/session')
						.field('email', fakeAdmin.email)
						.field('password', fakeAdmin.password)
						.end(done)

					})

				})
			})

			it('should remove user from provider and redirect to /admin', function (done) {
				agent
				.post('/provider/user/remove')
				.field('userId', userId)
				.field('providerId', providerId)
				.expect('Content-Type', /plain/)
				.expect(302)
				.expect('Location', '/admin')
				.expect(/Moved Temporarily/)
				.end(done)
			})

			it('should not contain the patient', function (done) {

				User.findOne({
					username: fakeProvider.username
				}).exec(function (err, user) {

					var patientIds = [];
					user.patients.forEach(function(patient, i) {
						patientIds.push(patient.id);
					});

					patientIds.should.not.include(userId);

					done()
				})

			})

		})

		after(function (done) {
			require('./helper').clearDb(done);
		})

	})

	describe('Follow patient', function () {

		before(function (done) {

			// create two new patient user
			var user = new User(fakeUser);
			user.save(function(err, user) {
				userId = user._id + '';

				var user2 = new User(fakeUser2);
				user2.save(function(err, user2) {
					userId2 = user2._id + '';

					done();
				});
			});

		});

		context('When not logged in', function () {

			it('should redirect to /login', function (done) {
				agent
				.post('/user/follow')
				.field('userId', userId)
				.expect('Content-Type', /plain/)
				.expect(302)
				.expect('Location', '/login')
				.expect(/Moved Temporarily/)
				.end(done)
			})

		})

		context('When logged in as Patient', function () {

			before(function (done) {
				// login the user
				agent
				.post('/users/session')
				.field('email', fakeUser.email)
				.field('password', fakeUser.password)
				.end(function() {

					agent
					.post('/user/follow')
					.field('userId', userId2)
					.end(done);

				})
			})

			it('should contain the followed user', function (done) {

				User.findOne({
					username: fakeUser.username
				}).exec(function (err, user) {

					var foundFollowing = false;

					user.following.forEach(function(f, i) {
						if(f.id === userId2) {
							foundFollowing = true;
							return false;
						}
					});

					foundFollowing.should.be.true;

				});

				done();

			})

		})

		after(function (done) {
			require('./helper').clearDb(done);
		})

	})

	describe('Unfollow patient', function () {

		before(function (done) {

			// create two new patient user
			var user = new User(fakeUser);
			user.save(function(err, user) {
				userId = user._id + '';

				var user2 = new User(fakeUser2);
				user2.save(function(err, user2) {
					userId2 = user2._id + '';

					done();
				});
			});

		});

		context('When not logged in', function () {

			it('should redirect to /login', function (done) {
				agent
				.post('/user/unfollow')
				.field('userId', userId)
				.expect('Content-Type', /plain/)
				.expect(302)
				.expect('Location', '/login')
				.expect(/Moved Temporarily/)
				.end(done)
			})

		})

		context('When logged in as Patient', function () {

			before(function (done) {
				// login the user
				agent
				.post('/users/session')
				.field('email', fakeUser.email)
				.field('password', fakeUser.password)
				.end(function() {

					// follow the second user
					agent
					.post('/user/follow')
					.field('userId', userId2)
					.end(function() {

						// un follow the user
						agent
						.post('/user/unfollow')
						.field('userId', userId2)
						.end(done);

					});

				})
			})

			it('should not contain the followed user', function (done) {

				User.findOne({
					username: fakeUser.username
				}).exec(function (err, user) {

					var foundFollowing = false;

					user.following.forEach(function(f, i) {
						if(f.id === userId2) {
							foundFollowing = true;
							return false;
						}
					});

					foundFollowing.should.be.false;

					done();
				});

			})

		});

		after(function (done) {
			require('./helper').clearDb(done);
		});

	});

	describe('Approve Follower', function () {

		before(function (done) {

			// create two new patient user
			var user = new User(fakeUser);
			user.save(function(err, user) {
				userId = user._id + '';

				var user2 = new User(fakeUser2);
				user2.save(function(err, user2) {
					userId2 = user2._id + '';

					done();
				});
			});

		});

		context('When not logged in', function () {

			it('should redirect to /login', function (done) {
				agent
				.post('/user/follow')
				.field('userId', userId)
				.expect('Content-Type', /plain/)
				.expect(302)
				.expect('Location', '/login')
				.expect(/Moved Temporarily/)
				.end(done)
			})

		})

		context('When logged in as Patient', function () {

			before(function (done) {
				// login the user
				agent
				.post('/users/session')
				.field('email', fakeUser.email)
				.field('password', fakeUser.password)
				.end(function() {
					// follow the second user
					agent
					.post('/user/follow')
					.field('userId', userId2)
					.end(function() {

						// login the followed user
						agent
						.get('/logout')
						.end(function() {

							agent
							.post('/users/session')
							.field('email', fakeUser2.email)
							.field('password', fakeUser2.password)
							.end(function() {

								// approve the follower
								agent
								.post('/follower/approve')
								.field('followerId', userId)
								.end(done);

							});

						});

					});
				});
			});

			it('should contain the approved follower', function (done) {

				User.findOne({
					username: fakeUser.username
				}).exec(function (err, user) {

					user.following.forEach(function(f, i) {
						if(f.id === userId2) {
							f.approved.should.be.true;
							return false;
						}
					});

					done();
				});

			});

		});

		after(function (done) {
			require('./helper').clearDb(done);
		});

	});

	describe('Reject Follower', function () {

		before(function (done) {

			// create two new patient user
			var user = new User(fakeUser);
			user.save(function(err, user) {
				userId = user._id + '';

				var user2 = new User(fakeUser2);
				user2.save(function(err, user2) {
					userId2 = user2._id + '';

					done();
				});
			});

		});

		context('When not logged in', function () {

			it('should redirect to /login', function (done) {
				agent
				.post('/user/follow')
				.field('userId', userId)
				.expect('Content-Type', /plain/)
				.expect(302)
				.expect('Location', '/login')
				.expect(/Moved Temporarily/)
				.end(done)
			})

		})

		context('When logged in as Patient', function () {

			before(function (done) {
				// login the user
				agent
				.post('/users/session')
				.field('email', fakeUser.email)
				.field('password', fakeUser.password)
				.end(function() {
					// follow the second user
					agent
					.post('/user/follow')
					.field('userId', userId2)
					.end(function() {

						// login the followed user
						agent
						.get('/logout')
						.end(function() {

							agent
							.post('/users/session')
							.field('email', fakeUser2.email)
							.field('password', fakeUser2.password)
							.end(function() {

								// approve the follower
								agent
								.post('/follower/approve')
								.field('followerId', userId)
								.end(function() {

									// reject the follower
									agent
									.post('/follower/reject')
									.field('followerId', userId)
									.end(done);

								});

							});

						});

					});
				});
			});

			it('should follower should not be approved', function (done) {

				User.findOne({
					username: fakeUser.username
				}).exec(function (err, user) {

					user.following.forEach(function(f, i) {
						if(f.id === userId2) {
							f.approved.should.be.false;
							return false;
						}
					});

					done();
				});

			});

		});

		after(function (done) {
			require('./helper').clearDb(done);
		});

	});

})
