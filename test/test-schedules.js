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
		due_date: moment.utc().add('days', 1).format('MM/DD/YYYY'),
		repeat_interval: 0,
		expires: false,
		expire_date: moment.utc().format('MM/DD/YYYY')
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
						userPatient._id = user._id;
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

			it('should create the new schedule', function (done) {
				agent
				.post('/schedule')
				.send(scheduleData)
				.expect('Content-Type', /text/)
				.expect(302)
				.expect(/Moved Temporarily/)
				.end(function(err, res) {
					if (err) {
						return done(err);
					}

					Schedule.findOne({
						user_id: scheduleData.user_id
					}).exec(function (err, schedule) {
						if (err) {
							return done(err);
						}

						should.exist(schedule);

						scheduleData._id = schedule._id;

						done();
					});

				});
			});

			it('should update the schedule expire date by 1 month', function (done) {

				agent
				.post('/schedule')
				.field('id', scheduleData._id)
				.field('expiry', '1m')
				.expect('Content-Type', /text/)
				.expect(302)
				.expect(/Moved Temporarily/)
				.end(function(err, res){
					if (err) {
						return done(err);
					}

					Schedule.findOne({
						user_id: scheduleData.user_id
					}).exec(function (err, schedule) {
						if (err) {
							return done(err);
						}

						should.exist(schedule);

						var expectedDate = moment.utc(schedule.due_date).add('months', 1).unix();

						moment.utc(schedule.expire_date).unix().should.equal(expectedDate);

						done();
					});

				});

			});

			it('should update the schedule expire date by 6 months', function (done) {

				agent
				.post('/schedule')
				.field('id', scheduleData._id)
				.field('expiry', '6m')
				.expect('Content-Type', /text/)
				.expect(302)
				.expect(/Moved Temporarily/)
				.end(function(err, res){
					if (err) {
						return done(err);
					}

					Schedule.findOne({
						user_id: scheduleData.user_id
					}).exec(function (err, schedule) {
						if (err) {
							return done(err);
						}

						should.exist(schedule);

						var expectedDate = moment.utc(schedule.due_date).add('months', 6).unix();

						moment.utc(schedule.expire_date).unix().should.equal(expectedDate);

						done();
					});

				});

			});

			it('should update the schedule expire date by 1 year', function (done) {

				agent
				.post('/schedule')
				.field('id', scheduleData._id)
				.field('expiry', '1y')
				.expect('Content-Type', /text/)
				.expect(302)
				.expect(/Moved Temporarily/)
				.end(function(err, res){
					if (err) {
						return done(err);
					}

					Schedule.findOne({
						user_id: scheduleData.user_id
					}).exec(function (err, schedule) {
						if (err) {
							return done(err);
						}

						should.exist(schedule);

						var expectedDate = moment.utc(schedule.due_date).add('years', 1).unix();

						moment.utc(schedule.expire_date).unix().should.equal(expectedDate);

						done();
					});

				});

			});

			it('should update the schedule expire date with custom date', function (done) {

				var expireDate = moment.utc(scheduleData.due_date).add('years', 1).format('MM/DD/YYYY');

				agent
				.post('/schedule')
				.field('id', scheduleData._id)
				.field('expiry', 'custom')
				.field('expire_date', expireDate)
				.expect('Content-Type', /text/)
				.expect(302)
				.expect(/Moved Temporarily/)
				.end(function(err, res){
					if (err) {
						return done(err);
					}

					Schedule.findOne({
						user_id: scheduleData.user_id
					}).exec(function (err, schedule) {
						if (err) {
							return done(err);
						}

						should.exist(schedule);

						var expectedDate = moment.utc(expireDate + ' UTC').unix();

						moment.utc(schedule.expire_date).unix().should.equal(expectedDate);

						done();
					});

				});

			});

			it('should update the schedule due date', function (done) {

				var dueDate = moment.utc(scheduleData.due_date).add('years', 1).format('MM/DD/YYYY');

				agent
				.post('/schedule')
				.field('id', scheduleData._id)
				.field('due_date', dueDate)
				.expect('Content-Type', /text/)
				.expect(302)
				.expect(/Moved Temporarily/)
				.end(function(err, res){
					if (err) {
						return done(err);
					}

					Schedule.findOne({
						user_id: scheduleData.user_id
					}).exec(function (err, schedule) {
						if (err) {
							return done(err);
						}

						should.exist(schedule);

						var expectedDate = moment.utc(dueDate + ' UTC').unix();

						moment.utc(schedule.due_date).unix().should.equal(expectedDate);

						done();
					});

				});

			});

			it('should update the schedule repeat interval', function (done) {

				agent
				.post('/schedule')
				.field('id', scheduleData._id)
				.field('repeat_interval', '7')
				.expect('Content-Type', /text/)
				.expect(302)
				.expect(/Moved Temporarily/)
				.end(function(err, res){
					if (err) {
						return done(err);
					}

					Schedule.findOne({
						user_id: scheduleData.user_id
					}).exec(function (err, schedule) {
						if (err) {
							return done(err);
						}

						should.exist(schedule);

						schedule.repeat_interval.should.equal(7);

						done();
					});

				});

			});

			it('should update the schedule template id', function (done) {

				// delete existing checkin template
				CheckinTemplate.findOne({
					_id: scheduleData.template_id
				}, function(err, template) {
					if (err) {
						return done(err);
					}

					template.remove(function (err, deletedTemplate) {
						if (err) {
							return done(err);
						}

						// create a new checkin template
						var template = new CheckinTemplate(checkinTemplateMchoice);
						template.save(function(err, newTemplate) {

							agent
							.post('/schedule')
							.field('id', scheduleData._id)
							.field('template_id', newTemplate._id)
							.expect('Content-Type', /text/)
							.expect(302)
							.expect(/Moved Temporarily/)
							.end(function(err, res){
								if (err) {
									return done(err);
								}

								Schedule.findOne({
									user_id: scheduleData.user_id
								}).exec(function (err, schedule) {
									if (err) {
										return done(err);
									}

									should.exist(schedule);

									(schedule.template_id.equals(newTemplate._id)).should.be.true;

									done();
								});

							});

						});

					})

				});

			});

			it('should update the schedule user id', function (done) {

				// delete existing checkin template
				User.findOne({
					_id: userPatient._id
				}, function(err, user) {
					if (err) {
						return done(err);
					}

					// delete old patient
					user.remove(function(err, deletedUser) {
						if (err) {
							return done(err);
						}

						// create a new patient user
						var patient = new User(userPatient);
						patient.save(function(err, newPatient) {

							agent
							.post('/schedule')
							.field('id', scheduleData._id)
							.field('user_id', newPatient._id)
							.expect('Content-Type', /text/)
							.expect(302)
							.expect(/Moved Temporarily/)
							.end(function(err, res){
								if (err) {
									return done(err);
								}

								Schedule.findOne({
									user_id: newPatient._id
								}).exec(function (err, schedule) {
									if (err) {
										return done(err);
									}

									should.exist(schedule);

									(schedule.user_id.equals(newPatient._id)).should.be.true;

									done();
								});

							});

						});

					});


				});

			});


		});


	});

	describe('POST /schedule/remove', function () {

		before(function(done) {
			// logout the user
			agent
			.get('/logout')
			.end(done)
		});

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

			it('should delete the schedule', function (done) {

				// find the new schedule
				Schedule.findOne({
					user_id: scheduleData.user_id
				}).exec(function (err, schedule) {
					if (err) {
						return done(err);
					}

					should.exist(schedule);

					// delete the new schedule
					agent
					.post('/schedule/remove')
					.field('id', schedule._id)
					.expect('Content-Type', /text/)
					.expect(302)
					.expect(/Moved Temporarily/)
					.end(function(err, res) {
						if (err) {
							return done(err);
						}

						// make sure the schedule does not exist
						Schedule.findOne({
							user_id: scheduleData.user_id
						}).exec(function (err, schedule) {
							if (err) {
								return done(err);
							}

							should.not.exist(schedule);

							done();
						});

					});

				});

			});

		});

	});

});
