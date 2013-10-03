process.env.NODE_ENV = 'test';

var chai = require('chai')
  , request = require('request');

var expect = chai.expect;



describe('My Server', function() {
    describe('Get /', function() {
	it('should respond with home page', function(done) {
	    request('http://54.213.21.154:8080', function (err, res, body) {
		expect(err).to.be.instanceof(Error);
		expect(res.statusCode).to.equal(200);
		expect(body).to.include('<title>');
		done();
	    });
	});
    });
});


