Recharge v3
===========

ReCharge Health app with MongoDB, Express, Bootstrap. Testing with Mocha.

Server will be running on port `8080`, by default.

	http://localhost:8080/

## Development

While developing, run the server with Grunt. This will give you live reload, and a lot of other goodies.

	grunt server


## Tests

Run tests with:

	npm test

Run `jshint` tests with:

	grunt


## Deployment

Before deploying, make sure to build the latest version with Grunt. This will concatenate the scripts, optimize the images, compile and optimize the Sass, etc.

	grunt build

Run on development server with:

	npm start

