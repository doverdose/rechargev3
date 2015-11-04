var mongoose         = require('mongoose')
var should           = require('should')
var moment           = require('moment')
var request          = require('supertest')
var app              = require('../web')
var helper           = require('../app/controllers/components/helper')
var context          = describe
var AssignedSurvey   = mongoose.model('AssignedSurvey')
var agent            = request.agent(app)


describe('Controller Helper', function() {
  
  describe('#getAssignedSurveys', function() {
    it('should return error if the userId argument is not a string', function(done){
      done()
    })
  })
})