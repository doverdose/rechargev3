/* Checkin Template tests
 */

var mongoose = require('mongoose'),
	should = require('should'),
	request = require('supertest'),
	app = require('../web'),
	context = describe,
	User = mongoose.model('User'),
	CheckinTemplate = mongoose.model('CheckinTemplate'),
	agent = request.agent(app);

var adminUser = {
		email: 'admin@admin.com',
		name: 'Admin',
		username: 'admin',
		password: '123',
		permissions: {
			admin: true
		}
	},
	checkinTemplateData = {
		type: 'multiplechoice',
		title: 'Checkin template',
		question: 'Checkin template question?',
		answers: [ 'answer1', 'answer2' ]
	},
	newQuestion = 'New question';

describe('Checkin Template', function () {

	before(function (done) {

		require('./helper').clearDb(function() {

			// create a new admin user
			var admin = new User(adminUser);
			admin.save(done);

		});

	});

	describe('POST /checkintemplate', function () {

		context('When not logged in', function () {
			it('should redirect to /login', function (done) {
				agent
				.post('/checkintemplate')
				.expect('Content-Type', /plain/)
				.expect(302)
				.expect('Location', '/login')
				.expect(/Moved Temporarily/)
				.end(done)
			});
		});

		context('When logged in as Admin', function () {

			before(function (done) {
				// login the user
				agent
				.post('/users/session')
				.field('email', adminUser.email)
				.field('password', adminUser.password)
				.end(done)
			});

			it('should create the new checkin template and redirect', function (done) {
				agent
				.post('/checkintemplate')
				.send(checkinTemplateData)
				.expect('Content-Type', /text/)
				.expect(302)
				.expect(/Moved Temporarily/)
				.end(done)
			});

			it('should contain the new template', function (done) {

				CheckinTemplate.findOne({
					title: checkinTemplateData.title
				}).exec(function (err, ct) {
					should.not.exist(err);
					should.exist(ct);

					checkinTemplateData.id = ct.id;

					done();
				});

			});

			it('should edit the template and redirect', function (done) {

				agent
				.post('/checkintemplate')
				.field('id', checkinTemplateData.id)
				.field('question', newQuestion)
				.expect('Content-Type', /text/)
				.expect(302)
				.expect(/Moved Temporarily/)
				.end(done);

			});

			it('should contain the edited template', function (done) {

				CheckinTemplate.findOne({
					_id: checkinTemplateData.id
				}).exec(function (err, ct) {
					should.not.exist(err);

					ct.title.should.equal(checkinTemplateData.title);
					ct.type.should.equal(checkinTemplateData.type);

					ct.answers.forEach(function(answer, i) {
						answer.should.have.property('text', checkinTemplateData.answers[i]);
					});

					ct.question.should.equal(newQuestion);

					done();
				});

			});

			it('should delete the template and redirect', function (done) {

				agent
				.post('/checkintemplate/remove')
				.field('id', checkinTemplateData.id)
				.expect('Content-Type', /text/)
				.expect(302)
				.expect(/Moved Temporarily/)
				.end(done);

			});

			it('should not contain the deleted template', function (done) {

				CheckinTemplate.findOne({
					_id: checkinTemplateData.id
				}).exec(function (err, ct) {
					should.not.exist(err);
					should.not.exist(ct);

					done();
				});

			});

		});

	});

});
