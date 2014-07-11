var mongoose = require("mongoose");
var validate = require('mongoose-validator').validate;
var screen = require('screener').screen;
var validator = require('validator');
var config = require('app/config');

var Schema = mongoose.Schema;

// validators
//var emailValidator = [validate('isEmail'), validate('len', 5, 100)];
//var tokenValidator = [validate('len', 5, 255)];


// schema
var File = new Schema({
    name: {
        type: String,
        required: true
    },
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
    size: {
        type: Number,
        required: true
    },
    created: {
        type: Date,
        default: Date.now
    }
});

File.methods.validateFile = function(cb) {
    var err = [];

    var fileConfig = config.app.fileUpload[this.type];

    if(fileConfig == undefined) {
        err.push('type_not_allowed');
        cb(err);
        return;
    }

    var path = config.app.fileUpload.tmpPath;

    if(this.size > fileConfig.maxSize) {
        err.push('file_size_too_big');
    }

    if(fileConfig.allowedMimeTypes.indexOf(this.mimeType) < 0) {
        err.push('mime_type_not_allowed');
    }

    cb(err, path);
};

var FileModel = mongoose.model('File', File);


// screeners
var get = function(object) {
    return screen(object, {
        id: 'string',
        name: 'string',
        uniqueId: 'string',
        type: 'string',
        size: 'integer'
    });
}


module.exports = FileModel;
module.exports.fileGetScreen = get;

