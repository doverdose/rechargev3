var crypto = require('crypto')
  , mongoStore = require('connect-mongodb')
  , Checkin
  , User
  , LoginToken;


function defineModels(mongoose, fn) {
    var Schema = mongoose.Schema, 
        ObjectId = Schema.ObjectId;

    /* Model: Check-in */

    Checkin  = new Schema({
	'data': String,
	'user_id': ObjectId,
        'timestamp': { type: Date, default: Date.now }
    });

    Checkin.virtual('id')
	.get(function() {
	    return this._id.toHexString();
	});

    /* Model: User */

    function validatePresenceOf(value) {
	return value && value.length;
    }

    User = new Schema({
	'email' : { type: String, validate: [validatePresenceOf, 'an email is required'], index: { unique: true } }, 
	'hashed_password' : String, 
	'salt' : String
    });

    User.virtual('id')
	.get(function() {
	    return this._id.toHexString();
	});

    User.virtual('password')
	.set(function(password) {
	    this._password = password;
	    this.salt = this.makeSalt();
	    this.hashed_password = this.encryptPassword(password);
	})
	.get(function() {return this._password;});

    User.method('authenticate', function(plainText) {
	return this.encryptPassword(plainText) === this.hashed_password;
    });

    User.method('makeSalt', function() {
	return Math.round((new Date().valueOf() * Math.random())) + '';
    });

    User.method('encryptPassword', function(password) {
	return crypto.createHmac('sha1', this.salt).update(password).digest('hex');
    });

    User.pre('save', function(next) {
	if (!validatePresenceOf(this.password)) {
	    next(new Error('Invalid password'));
	} else {
	    next();
	}
    });

    mongoose.model('Checkin', Checkin);
    mongoose.model('User', User);

    fn();
}


exports.defineModels = defineModels; 
