var mongoose   = require('mongoose')
var should     = require('should')
var moment     = require('moment')
var request    = require('supertest')
var app        = require('../web')
var dashboard  = require('../app/controllers/dashboard')
var context    = describe
var User       = mongoose.model('User')
var Checkin    = mongoose.model('Checkin')
var agent      = request.agent(app)

var userData = {
	email: 'patient@test.com',
	name: 'testPatient',
	username: 'patient0',
	hashed_password: '277321a1a4b39075565262e285aa09724f1d75db',
  permissions: {
    "admin": false,
    "provider": false
  }
}

var	checkinData1 = {
	type: 'multiplechoice',
	question: 'Checkin template question?',
	timestamp: new Date('2014-02-18T07:00:00.000Z')
}
var	checkinData2 = {
	type: 'multiplechoice',
	question: 'Checkin template question?',
	timestamp: new Date('2014-02-19T07:00:00.000Z')
}
var	checkinData3 = {
	type: 'multiplechoice',
	question: 'Checkin template question?',
	timestamp: new Date('2014-02-20T07:00:00.000Z')
}

var validDates = {
	week: {
		start: moment("2014-02-17 07:00:00"),
		end: moment("2014-02-23 07:00:00")
	},
	month: {
		start: moment("2014-02-01 07:00:00"),
		end: moment("2014-02-28 07:00:00")
	},
	year: {
		start: moment("2014-01-01 07:00:00"),
		end: moment("2014-12-31 07:00:00")
	}
}

var invalidDates = {
	week: {
		start: moment("2014-01-17 07:00:00"),
		end: moment("2014-01-23 07:00:00")
	},
	month: {
		start: moment("2014-01-01 07:00:00"),
		end: moment("2014-01-28 07:00:00")
	},
	year: {
		start: moment("2013-01-01 07:00:00"),
		end: moment("2013-12-31 07:00:00")
	}
}


describe('Dashboard', function () {
  
  /*
	before(function (done) {
		require('./helper').clearDb(function() {
			var user = new User(userData)
			user.save(function(err, result) {
        
				userData.id           = result._id
				checkinData1.user_id  = result._id
				checkinData2.user_id  = result._id
				checkinData3.user_id  = result._id

				var checkinModel1 = new Checkin(checkinData1)
				checkinModel1.save(function(err, result) {
					var checkinModel2 = new Checkin(checkinData2)
					checkinModel2.save(function(err, result) {
						var checkinModel3 = new Checkin(checkinData3)
						checkinModel3.save(done)
					})
				})
			})
		})
	})

	describe('#checkinsForInterval()', function () {
		it('should return 0 values for invalid dates', function(done) {
			var response = {}
			dashboard.checkinsForInterval(userData.id, invalidDates.week.start, invalidDates.week.end, 'weekResults', response, function(err) {
				should.not.exist(err)
				response.weekResults.length.should.equal(0)

				dashboard.checkinsForInterval(userData.id, invalidDates.month.start, invalidDates.month.end, 'monthResults', response, function() {
					should.not.exist(err)
					response.monthResults.length.should.equal(0)

					dashboard.checkinsForInterval(userData.id, invalidDates.year.start, invalidDates.year.end, 'yearResults', response, function() {
						should.not.exist(err)
						response.yearResults.length.should.equal(0)

						done()
					})
				})
			})
		})

		it('should return values for valid dates', function(done) {
			var response = {};
			dashboard.checkinsForInterval(userData.id, validDates.week.start, validDates.week.end, 'weekResults', response, function(err) {
				should.not.exist(err)
				response.weekResults.length.should.equal(3)

				dashboard.checkinsForInterval(userData.id, validDates.month.start, validDates.month.end, 'monthResults', response, function() {
					should.not.exist(err)
					response.monthResults.length.should.equal(3)

					dashboard.checkinsForInterval(userData.id, validDates.year.start, validDates.year.end, 'yearResults', response, function() {
						should.not.exist(err)
						response.yearResults.length.should.equal(3)
						done()
					})
				})
			})
		})
	})

	describe('GET /dashboard', function () {
		context('When not logged in', function () {
			it('should redirect to /login', function (done) {
				agent.get('/dashboard')
					.expect('Content-Type', /plain/)
					.expect(302)
					.expect('Location', '/login')
					.expect(/Moved Temporarily/)
					.end(done)
			})
		})
		context('When logged in', function () {
			before(function (done) {
				agent.post('/users/session')
					.field('email', userData.email)
					.field('password', userData.password)
					.end(done)
			})
			it('should respond with Content-Type text/html', function (done) {
				agent.get('/dashboard')
				.expect('Content-Type', /html/)
				.expect(200)
				.expect(/dashboard/)
				.end(done)
			})
		})
	})
  */
})