var crypto = require('crypto');
var mongoose = require("mongoose");
var validate = require('mongoose-validator').validate;
var screen = require('screener').screen;
var validator = require('validator');

var Schema = mongoose.Schema;

// validators
var emailValidator = [validate('isEmail'), validate('len', 5, 100)];
var tokenValidator = [validate('len', 5, 255)];


// schema
var User = new Schema({
    email: {
        type: String,
        unique: true,
        required: true,
        validate: emailValidator
    },
    hashedPassword: {
        type: String,
    },
    salt: {
        type: String,
    },
    facebookId: {
        type: String,
        validate: tokenValidator
    },
    facebookAccessToken: {
        type: String,
        validate: tokenValidator
    },
    created: {
        type: Date,
        default: Date.now
    }
});

User.methods.encryptPassword = function(password) {
    return crypto.createHmac('sha1', this.salt).update(password).digest('hex');
};

User.virtual('userId')
    .get(function () {
        return this.id;
    });

User.virtual('password')
    .set(function(password) {
        this._plainPassword = password;
        this.salt = crypto.randomBytes(32).toString('base64');
        this.hashedPassword = this.encryptPassword(password);
    })
    .get(function() { return this._plainPassword; });


User.methods.checkPassword = function(password) {
    return this.encryptPassword(password) === this.hashedPassword;
};

var UserModel = mongoose.model('User', User);


// extended validation
UserModel.schema.path('hashedPassword').validate(function(v) {
  if (this._plainPassword) {
    if (!validator.isLength(this._plainPassword, 6)) {
      this.invalidate('password', 'must be at least 6 characters.');
    }
  }
}, null);

// screeners
var get = function(object) {
    return screen(object, {
        id: 'string',
        email: 'string',
        facebookId: 'string'
    });
}


module.exports = UserModel;
module.exports.userGetScreen = get;

