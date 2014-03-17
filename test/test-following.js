var mongoose = require('mongoose'),
	should = require('should'),
	moment = require('moment'),
	request = require('supertest'),
	app = require('../web'),
	following = require('../app/controllers/following')
	context = describe,
	User = mongoose.model('User'),
	Checkin = mongoose.model('Checkin'),
	agent = request.agent(app);

var userData1 = {
	id: '',
	email: 'pacient1@test.com',
	name: 'pacient1',
	username: 'pacient1',
	password: '123',
};
var userData2 = {
	id: '',
	email: 'pacient2@test.com',
	name: 'pacient2',
	username: 'pacient2',
	password: '123',
};
var userData3 = {
	id: '',
	email: 'pacient3@test.com',
	name: 'pacient3',
	username: 'pacient3',
	password: '123',
};
var	checkinData1 = {
	title: 'checkinData1',
	type: 'multiplechoice',
	question: 'Checkin template question?',
	timestamp: new Date('2014-02-18T07:00:00.000Z')
};
var	checkinData2 = {
	title: 'checkinData2',
	type: 'multiplechoice',
	question: 'Checkin template question?',
	timestamp: new Date('2014-02-19T07:00:00.000Z')
};
var	checkinData3 = {
	title: 'checkinData3',
	type: 'multiplechoice',
	question: 'Checkin template question?',
	timestamp: new Date('2014-02-20T07:00:00.000Z')
};

describe('Following', function () {
	before(function (done) {
		require('./helper').clearDb(function() {
			var followingUser = new User(userData2);
			followingUser.save(function(err, newUser) {
				userData2.id = newUser._id;

				userData1.following = [];
				userData1.following.push({
					id: newUser._id,
					approved: true
				});
				var user = new User(userData1);
				user.save(function(err, result) {
					userData1.id = result._id;
					checkinData1.user_id = result._id;
					checkinData2.user_id = result._id;
					checkinData3.user_id = result._id;

					var checkinModel1 = new Checkin(checkinData1);
					checkinModel1.save(function(err, result) {
						var checkinModel2 = new Checkin(checkinData2);
						checkinModel2.save(function(err, result) {
							var checkinModel3 = new Checkin(checkinData3);
							checkinModel3.save(function(err, result) {
								userData3.following = [];
								userData3.following.push({
									id: newUser._id,
									approved: false
								});

								var user = new User(userData3);
								user.save(function(err, result) {
									userData3.id = result._id;
									checkinData1.user_id = result._id;
									checkinData2.user_id = result._id;
									checkinData3.user_id = result._id;

									var checkinModel1 = new Checkin(checkinData1);
									checkinModel1.save(function(err, result) {
										var checkinModel2 = new Checkin(checkinData2);
										checkinModel2.save(function(err, result) {
											var checkinModel3 = new Checkin(checkinData3);
											checkinModel3.save(done);
										});
									});
								});
							});
						});
					});
				});
			});
		});
	});

	describe('#getFollowigStream()', function () {
		it('should return 3 checkins', function(done) {
			following.getFollowigStream(userData1.id, 20, 0, function(err, results) {
				should.not.exist(err);
				results.length.should.equal(3);
				done();
			});
		});

		it('should return 0 checkins', function(done) {
			following.getFollowigStream(userData3.id, 20, 0, function(err, results) {
				should.not.exist(err);
				results.length.should.equal(0);
				done();
			});
		});
	});

	describe('GET /following', function () {
		context('When not logged in', function () {
			it('should redirect to /login', function (done) {
				agent.get('/following')
					.expect('Content-Type', /plain/)
					.expect(302)
					.expect('Location', '/login')
					.expect(/Moved Temporarily/)
					.end(done)
			});
		});
		context('When logged in', function () {
			before(function (done) {
				agent.post('/users/session')
					.field('email', userData3.email)
					.field('password', userData3.password)
					.end(done)
			});
			it('should respond with Content-Type text/html', function (done) {
				agent.get('/following')
				.expect('Content-Type', /html/)
				.expect(200)
				.expect(/following/)
				.end(done)
			});
		});
	});
});