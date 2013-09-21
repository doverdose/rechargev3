var express = require('express')
  , routes = require('./routes')
  , path = require('path')
  , mongoose = require('mongoose')
  , crypto = require('crypto')
  , mongoStore = require('connect-mongodb')
  , Checkin
  , User
  , LoginToken;

var app = express();

/* model setup, breakout into separate file */
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

app.set('views', path.join(__dirname, '/views'));
app.set('db-uri', 'mongodb://localhost/recharge-development');
app.engine('html', require('ejs').renderFile);
app.use(express.logger('dev'));
app.use(app.router);
app.use(express.static(path.join(__dirname, 'assets')));

defineModels(mongoose, function() {
    app.Checkin = Checkin = mongoose.model('Checkin');
    app.User = User = mongoose.model('User');
    db = mongoose.connect(app.set('db-uri'));
})


app.get('/dashboard', routes.dashboard);
app.get('/checkin/new', routes.checkin_new);
app.get('/checkin', routes.checkin);
app.get('/', routes.index);

app.listen(8080);
