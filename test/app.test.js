process.env.NODE_ENV = 'test';

var chai = require('chai')
  , request = require('request')
  , app = require('../web')
  , expect = chai.expect;

describe('My Server', function() {
    describe('Get /', function() {
	it('should respond with home page', function(done) {
	    request(app.set('test-uri'), function (err, res, body) {
		expect(err).to.not.be.instanceof(Error);
		expect(res.statusCode).to.equal(200);
		expect(body).to.include('<title>');
		done();
	    });
	});
    });
});


