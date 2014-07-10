var mongoose = require("mongoose");
var validate = require('mongoose-validator').validate;
var screen = require('screener').screen;
var validator = require('validator');

var Schema = mongoose.Schema;

// validators
//var emailValidator = [validate('isEmail'), validate('len', 5, 100)];
//var tokenValidator = [validate('len', 5, 255)];


// schema
var File = new Schema({
    filename: {
        type: String,
        required: true
    },
    mimeType: {
        type: String,
        required: true
    },
    uniqueId: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    created: {
        type: Date,
        default: Date.now
    }
});

var FileModel = mongoose.model('File', File);


// screeners
//var get = function(object) {
    //return screen(object, {
        //id: 'string',
        //email: 'string',
        //facebookId: 'string'
    //});
//}


module.exports = FileModel;
//module.exports.userGetScreen = get;

