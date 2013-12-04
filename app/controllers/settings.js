
module.exports = function() {

	var mongoose = require('mongoose'),
		User = mongoose.model('User'),
		util = require('util'),
		Q = require('q');

	/**
	* Find user by id
	*/

	var user = function (req, res, next, id) {
		User.findOne({ _id : id })
			.exec(function (err, user) {
				if (err) return next(err)
				if (!user) return next(new Error('Failed to load User ' + id))
				req.profile = user
				next()
			})
	}

	/* Edit user
	*/

	var update = function (req, res) {

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

	/* Edit profile
	 */
	var profile = function(req, res, next) {

		res.render('settings/profile.ejs', {
			title: 'Profile'
		})

	};

	/* Manage providers
	 */
	var providers = function(req, res, next) {

		// TODO get providers

		User.find({
			'permissions.provider': { $ne: true }
			//'patients': { $in: user.id }
		}, function(err, patients) {
			if (err) {
				//
			} else {

			}

			console.log(err);
			console.log(patients);

		});

		res.render('settings/providers.ejs', {
			title: 'Providers',
			providers: []
		});

	};

	return {
		profile: profile,
		providers: providers
	}
}();
