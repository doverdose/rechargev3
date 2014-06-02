/**
 * User model
 */

module.exports = (function() {
	'use strict';

	var mongoose = require('mongoose'),
		Schema = mongoose.Schema,
		crypto = require('crypto');

	/**
	* User Schema
	*/

	var UserSchema = new Schema({
		name: { type: String, default: '' },
		email: { type: String, default: '' },
		phoneNumber: { type: String, default: '' },
		smsNotifications: { type: Boolean, default: false },
		username: { type: String, default: '' },
		provider: { type: String, default: '' },
		hashed_password: { type: String, default: '' },
		salt: { type: String, default: '' },
		autoAssign: { type: Number, default: 0 },
		authToken: { type: String, default: '' },
		permissions: {
			admin: {
				type: Boolean,
				default: 'false'
			},
			provider: {
				type: Boolean,
				default: 'false'
			}
		},
		patients: [{
			id: String,
			approved: Boolean
		}],
		following: [{
			id: String,
			approved: Boolean
		}],
		last_login: {
			type: Date,
			default: Date.now
		}
	});

	/**
	* Virtuals
	*/

	UserSchema
		.virtual('password')
		.set(function(password) {
			this._password = password;
			this.salt = this.makeSalt();
			this.hashed_password = this.encryptPassword(password);
		})
		.get(function() { return this._password; });

	/**
	* Validations
	*/

	var validatePresenceOf = function (value) {
		return value && value.length;
	};

	// validate
	UserSchema.path('name').validate(function (name) {
		return name.length;
	}, 'Name cannot be blank');

	UserSchema.path('email').validate(function (email) {
		return email.length;
	}, 'Email cannot be blank');

	UserSchema.path('email').validate(function (email, fn) {
		var User = mongoose.model('User');

		// Check only when it is a new user or when email field is modified
		if (this.isNew || this.isModified('email')) {
			User.find({ email: email }).exec(function (err, users) {
				fn(!err && users.length === 0);
			});
		} else {
			fn(true);
		}
	}, 'Email already exists');

	UserSchema.path('username').validate(function (username) {
		return username.length;
	}, 'Username cannot be blank');

	UserSchema.path('username').validate(function(username, fn) {
		var User = mongoose.model('User');

		// Check only when it is a new user or when email field is modified
		if (this.isNew || this.isModified('username')) {
			User.find({ username: username }).exec(function (err, users) {
				fn(!err && users.length === 0);
			});
		} else {
			fn(true);
		}

	}, 'Username already exists');

	UserSchema.path('hashed_password').validate(function (hashed_password) {
		return hashed_password.length;
	}, 'Password cannot be blank');

	UserSchema.path('hashed_password').validate(function() {
		var re = /^[0-9]{0,10}$/;
		return !this._password || re.test(this._password);
	}, 'Password must must be a PIN number with less than 10 digits.');

	/**
	* Pre-save hook
	*/

	UserSchema.pre('save', function(next) {
		if (!this.isNew) {
			return next();
		}

		if (!validatePresenceOf(this.password)) {
			next(new Error('Invalid password'));
		} else {
			next();
		}
	});

	/**
	* Methods
	*/

	UserSchema.methods = {

		/**
		* Authenticate - check if the passwords are the same
		*
		* @param {String} plainText
		* @return {Boolean}
		* @api public
		*/

		authenticate: function (plainText) {
			return this.encryptPassword(plainText) === this.hashed_password;
		},

		/**
		* Make salt
		*
		* @return {String}
		* @api public
		*/

		makeSalt: function () {
			return Math.round((new Date().valueOf() * Math.random())) + '';
		},

		/**
		* Encrypt password
		*
		* @param {String} password
		* @return {String}
		* @api public
		*/

		encryptPassword: function (password) {
			if (!password) {
				return '';
			}

			try {
				var encrypted = crypto.createHmac('sha1', this.salt).update(password).digest('hex');
				return encrypted;
			} catch (err) {
				return '';
			}
		}
	};

	mongoose.model('User', UserSchema);

	return {};

}());
