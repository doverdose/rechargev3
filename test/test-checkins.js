/* Checkin tests
 */

var mongoose = require('mongoose'),
	should = require('should'),
	request = require('supertest'),
	app = require('../web'),
	context = describe,
	User = mongoose.model('User'),
	Checkin = mongoose.model('Checkin'),
	CheckinTemplate = mongoose.model('CheckinTemplate'),
	agent = request.agent(app);

var userPatient = {
		email: 'patient@patient',
		name: 'Patient',
		username: 'patient',
		password: '123',
		permissions: {}
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
	checkinData = {
		type: 'multiplechoice',
		question: 'Checkin template question?',
		answers: [ 'answer1' ]
	};

describe('Checkins', function () {

	before(function(done) {
		require('./helper').clearDb(function() {

			// create new patient
			var patient = new User(userPatient);
			patient.save(function() {

				// create a new checkin template
				var checkin = new CheckinTemplate(checkinTemplateMchoice);
				checkin.save(done);

			});

		});

	});

	describe('POST /checkin', function () {

		context('When not logged in', function () {
			it('should redirect to /login', function (done) {
				agent
				.post('/checkin')
				.expect('Content-Type', /plain/)
				.expect(302)
				.expect('Location', '/login')
				.expect(/Moved Temporarily/)
				.end(done)
			});
		});

		context('When logged in', function () {

			before(function (done) {
				// login the user
				agent
				.post('/users/session')
				.field('email', userPatient.email)
				.field('password', userPatient.password)
				.end(done)
			});

			it('should create the new checkin and redirect', function (done) {
				agent
				.post('/checkin')
				.send(checkinData)
				.expect('Content-Type', /text/)
				.expect(302)
				.expect(/Moved Temporarily/)
				.end(done)
			});

			it('should contain the new checkin', function (done) {

				Checkin.findOne({
					question: checkinData.question
				}).exec(function (err, ct) {
					should.not.exist(err);
					should.exist(ct);

					checkinData.id = ct.id;

					done();
				});

			});

			it('should delete the checkin and redirect', function (done) {

				agent
				.post('/checkin/remove')
				.field('id', checkinData.id)
				.expect('Content-Type', /text/)
				.expect(302)
				.expect(/Moved Temporarily/)
				.end(done);

			});

			it('should not contain the deleted template', function (done) {

				Checkin.findOne({
					_id: checkinData.id
				}).exec(function (err, ct) {
					should.not.exist(err);
					should.not.exist(ct);

					done();
				});

			});

		});

	});

});
