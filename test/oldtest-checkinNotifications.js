var mongoose = require('mongoose'),
	should = require('should'),
	moment = require('moment'),
	request = require('supertest'),
	app = require('../web'),
	context = describe,
	User = mongoose.model('User'),
	Checkin = mongoose.model('Checkin'),
	CheckinTemplate = mongoose.model('CheckinTemplate'),
	Schedule = mongoose.model('Schedule'),
	Notification = mongoose.model('Notification'),
	agent = request.agent(app),
	scheduler = require('../app/scheduler/checkinNotifications')(require('../config/config')()['test']);

var userData = {
	id: '',
	email: 'pacient1@test.com',
	name: 'pacient1',
	username: 'pacient1',
	password: '123',
};

var checkinTemplateData = {
	id: '',
	type: 'text',
	title: 'Test',
	score: 100,
	tips: 'Tip',
	question: 'Question',
};

var scheduleData = {
	id: '',
	due_date: moment().add('days', 1).hour(10).minute(59).second(59).toDate(),
	expire_date: moment().add('days', 10).hour(10).minute(59).second(59).toDate(),
	expires: true,
	repeat_interval: 1,
	template_id: '',
	user_id: ''
};

describe('CheckinNotifications', function () {
	before(function (done) {
		require('./helper').clearDb(function() {
			var user = new User(userData);
			user.save(function(err, newUser) {
				userData.id = newUser._id;

				var checkinTemplate = new CheckinTemplate(checkinTemplateData);
				checkinTemplate.save(function(err, newTemplate) {
					scheduleData.user_id = newUser._id;
					scheduleData.template_id = checkinTemplate._id;

					var schedule = new Schedule(scheduleData);
					schedule.save(function(err, newSchedule) {
						scheduleData.id = newSchedule._id;
						done();
					});
				});
			});
		});
	});
		
	describe('#send()', function () {
		it('should return one schedule and one notification \n(please make sure that smtp access is granted\nif using a google account make sure you have \nlogged in the browser before running test)', function(done) {
			this.timeout(20000);
			scheduler.sendEmails = false;
			scheduler.send(function(err) {
				should.not.exist(err);
				scheduler.resulted.length.should.equal(1);
				if(scheduler.resulted.length == 1) {
					scheduler.resulted[0].email.should.equal(userData.email);
					scheduler.resulted[0].name.should.equal(userData.name);
					scheduler.resulted[0].schedules.length.should.equal(1)

					Notification.find({
						user_id: userData.id,
					}).exec(function(err, notification) {
						notification.length.should.equal(1);
						if(notification.length == 1) {
							notification[0].schedule_id.toString().should.equal(scheduleData.id.toString());
							notification[0].status.should.equal('sent');
							done();
						}
					});
				}
			})
		});
	});
});