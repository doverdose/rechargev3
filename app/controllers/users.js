
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
	user.permissions = {
		admin: false,
		provider: (user.permissions) ? user.permissions.provider : false
	};

	user.save(function (err) {

		if(req.body.admin) {

			if(err && err.errors) {
				return res.render('users/new', {
					errors: err.errors,
					wrongUser: user,
					title: 'New user'
				})
			}

			// return to the admin
			return res.redirect('/admin')

		} else {

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
		}
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

/* View user
 */

exports.view = function (req, res, next) {

	if(req.user.permissions.provider) {
		// TODO if provider, see your own patients

	} else if(!req.user.permissions.admin) {
		// if patient, see only your profile
		if (req.user.id !== id) return next(new Error('Failed to load User ' + id))
	}

	User.findOne({ _id : req.params.id })
		.exec(function (err, user) {
			if (err) return next(err)
			if (!user) return next(new Error('Failed to load User ' + id))

			res.render('users/profile.ejs', {
				title: 'Profile',
				profile: user
			})

		})

};

/* New user
 */

exports.new = function (req, res, next) {


	// TODO if provider, assign users to yourself
	// if patient, see only your profile
	// do this in the template

	res.render('users/new.ejs', {
		title: 'New user',
		profile: new User()
	})

};

/* Edit user
 */

exports.update = function (req, res) {

	User.findOne({ _id : req.body.id })
		.exec(function (err, user) {
			if (err) return next(err)
			if (!user) return next(new Error('Failed to load User ' + id))

			if(req.body.name) user.name = req.body.name;
			if(req.body.email) user.email = req.body.email;
			if(req.body.username) user.username = req.body.username;
			if(req.body.password) user.password = req.body.password;

			user.save(function(err) {
				if (err) return console.log(err)
			});

		})

	res.redirect('/user/' + req.body.id);

}

exports.edit = function (req, res, next) {

	if(req.user.permissions.provider) {
		// TODO if provider, see your own patients

	} else if(!req.user.permissions.admin) {
		// if patient, see only your profile
		if (req.user.id !== id) return next(new Error('Failed to load User ' + id))
	}

	User.findOne({ _id : req.params.id })
		.exec(function (err, user) {
			if (err) return next(err)
			if (!user) return next(new Error('Failed to load User ' + id))

			res.render('users/edit.ejs', {
				title: 'Profile',
				profile: user
			})

		})

};

/* Delete user
 */

exports.delete = function (req, res) {

	User.findOne({ _id : req.params.id })
		.exec(function (err, user) {
			if (err) return next(err)
			if (!user) return next(new Error('Failed to load User ' + id))

			user.remove();

		})

	res.redirect('/admin');

}
