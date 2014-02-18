/* Schedules tests
 */

var mongoose = require('mongoose'),
	should = require('should'),
	request = require('supertest'),
	async = require('async'),
	moment = require('moment'),
	app = require('../web'),
	context = describe,
	User = mongoose.model('User'),
	Schedule = mongoose.model('Schedule'),
	CheckinTemplate = mongoose.model('CheckinTemplate'),
	agent = request.agent(app);

var userPatient = {
		email: 'patient@patient',
		name: 'Patient',
		username: 'patient',
		password: '123',
		permissions: {}
	},
	userAdmin = {
		email: 'admin@admin.com',
		name: 'Admin',
		username: 'admin',
		password: '123',
		permissions: {
			admin: true
		}
	},
	checkinTemplateMchoice = {
		type: 'multiplechoice',
		title: 'Checkin template',
		question: 'Checkin template question?',
		answers: [{
			text: 'answer1'
		}, {
			text: 'answer2'
		}]
	},
	scheduleData = {
		user_id: '',
		template_id: '',
		due_date: moment().add('days', 1).format('MM/DD/YYYY'),
		repeat_interval: 0,
		expires: false,
		expire_date: moment().format('MM/DD/YYYY')
	};

describe('Schedules', function () {

	before(function(done) {
		require('./helper').clearDb(function() {

			async.parallel([
				function(callback) {

					// create a new checkin template
					var template = new CheckinTemplate(checkinTemplateMchoice);
					template.save(function(err, ctemplate) {
						// set the new checkinTemplate id on the checkin data
						scheduleData.template_id = ctemplate._id;

						callback();
					});

				},
				function(callback) {

					// create new patient
					var patient = new User(userPatient);
					patient.save(function(err, user) {
						scheduleData.user_id = user._id;

						callback();
					});


				},
				function(callback) {

					// create new admin
					var admin = new User(userAdmin);
					admin.save(callback);

				}
			], function(err) {
				if(err) {
					console.log(err);
					return false;
				}

				done();
			});
		});

	});

	describe('POST /schedule', function () {

		context('When not logged in', function () {
			it('should redirect to /login', function (done) {
				agent
				.post('/schedule')
				.expect('Content-Type', /plain/)
				.expect(302)
				.expect('Location', '/login')
				.expect(/Moved Temporarily/)
				.end(done)
			});
		});

		context('When logged in as Patient', function () {

			before(function (done) {
				// login the user
				agent
				.post('/users/session')
				.field('email', userPatient.email)
				.field('password', userPatient.password)
				.end(done)
			});

			it('should respond with 403 Forbidden', function (done) {
				agent
				.post('/schedule')
				.send(scheduleData)
				.expect(403)
				.expect(/Forbidden/)
				.end(done)
			});

		});

		context('When logged in as Admin', function () {

			before(function (done) {
				// login the user
				agent
				.post('/users/session')
				.field('email', userAdmin.email)
				.field('password', userAdmin.password)
				.end(done)
			});

			it('should create the new schedule and redirect', function (done) {
				agent
				.post('/schedule')
				.send(scheduleData)
				.expect('Content-Type', /text/)
				.expect(302)
				.expect(/Moved Temporarily/)
				.end(done)
			});

			it('should contain the new schedule', function (done) {

				Schedule.findOne({
					user_id: scheduleData.user_id
				}).exec(function (err, schedule) {
					should.not.exist(err);
					should.exist(schedule);

					scheduleData._id = schedule._id;

					done();
				});

			});

			it('should update the schedule and redirect', function (done) {

				agent
				.post('/schedule')
				.field('id', scheduleData._id)
				.field('expiry', '1m')
				.expect('Content-Type', /text/)
				.expect(302)
				.expect(/Moved Temporarily/)
				.end(done)

			});

			it('expiry date should be 1 month later than due date', function (done) {

				Schedule.findOne({
					user_id: scheduleData.user_id
				}).exec(function (err, schedule) {
					should.not.exist(err);
					should.exist(schedule);

					var expectedDate = moment.utc(schedule.due_date).add('months', 1).unix();

					moment.utc(schedule.expire_date).unix().should.equal(expectedDate);

					done();
				});

			});

			it('should update the schedule and redirect', function (done) {

				agent
				.post('/schedule')
				.field('id', scheduleData._id)
				.field('expiry', '6m')
				.expect('Content-Type', /text/)
				.expect(302)
				.expect(/Moved Temporarily/)
				.end(done)

			});

			it('expiry date should be 6 months later than due date', function (done) {

				Schedule.findOne({
					user_id: scheduleData.user_id
				}).exec(function (err, schedule) {
					should.not.exist(err);
					should.exist(schedule);

					var expectedDate = moment.utc(schedule.due_date).add('months', 6).unix();

					moment.utc(schedule.expire_date).unix().should.equal(expectedDate);

					done();
				});

			});

		});

// 			before(function (done) {
// 				// login the user
// 				agent
// 				.post('/users/session')
// 				.field('email', userPatient.email)
// 				.field('password', userPatient.password)
// 				.end(done)
// 			});
//
// 			it('should create the new checkin and redirect', function (done) {
// 				agent
// 				.post('/checkin')
// 				.send(checkinData)
// 				.expect('Content-Type', /text/)
// 				.expect(302)
// 				.expect(/Moved Temporarily/)
// 				.end(done)
// 			});
//
// 			it('should contain the new checkin', function (done) {
//
// 				Checkin.findOne({
// 					question: checkinData.question
// 				}).exec(function (err, ct) {
// 					should.not.exist(err);
// 					should.exist(ct);
//
// 					checkinData.id = ct.id;
//
// 					done();
// 				});
//
// 			});
//
// 			it('should delete the checkin and redirect', function (done) {
//
// 				agent
// 				.post('/checkin/remove')
// 				.field('id', checkinData.id)
// 				.expect('Content-Type', /text/)
// 				.expect(302)
// 				.expect(/Moved Temporarily/)
// 				.end(done);
//
// 			});
//
// 			it('should not contain the deleted template', function (done) {
//
// 				Checkin.findOne({
// 					_id: checkinData.id
// 				}).exec(function (err, ct) {
// 					should.not.exist(err);
// 					should.not.exist(ct);
//
// 					done();
// 				});
//
// 			});


	});

});
