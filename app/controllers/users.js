
/**
 * Module dependencies.
 */

var mongoose = require('mongoose'),
	User = mongoose.model('User'),
	util = require('util');

var login = function (req, res) {
	// update last_login date
	if(req.user) {
		User.findById(req.user._id, function(err, u) {
			if (!u)
				return next(new Error('Could not find User'));
			else {
				// update last_login
				u.last_login = new Date();

				u.save(function(err) {
					if (err) return console.log(err)
				});
			}
		});
	}

	if (req.session.returnTo) {
		res.redirect(req.session.returnTo)
		delete req.session.returnTo
		return
	}
	res.redirect('/')
}

//exports.signin = function (req, res) {}

/**
 * Auth callback
 */

exports.authCallback = login

/**
 * Login
 */

exports.login = function (req, res) {
	res.render('users/login', {
		title: 'Login',
		message: req.flash('error')
	})
}

/**
 * Sign-up
 */

exports.signup = function (req, res) {
	res.render('users/signup', {
		title: 'Sign up',
		user: new User()
	})
}


/**
 * Create new user
 */

exports.create = function (req, res) {
	var user = new User(req.body);
	user.provider = 'local';

	// remove any sneaky permissions
	delete user.permissions;

	user.save(function (err) {
		if(err) {
			return res.render('users/signup', {
				errors: err.errors,
				wrongUser: user,
				title: 'Sign up'
			})
		}

		// manually login the user once successfully signed up
		req.logIn(user, function(err) {
			if (err) return next(err)
			return res.redirect('/')
		})
	})
}


/**
 * Logout
 */

exports.logout = function (req, res) {
	req.logout();
	res.redirect('/login');
}

/**
 * Session
 */

exports.session = login

/**
 * Find user by id
 */

exports.user = function (req, res, next, id) {
	User.findOne({ _id : id })
		.exec(function (err, user) {
			if (err) return next(err)
			if (!user) return next(new Error('Failed to load User ' + id))
			req.profile = user
			next()
		})
}
