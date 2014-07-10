var mongoose = require("mongoose");
var config = require("app/config");
var log = require("app/modules/logger");

mongoose.connect(config.mongodb.url);
var db = mongoose.connection;

db.on('error', function (err) {
    log.error('connection error:', err.message);
});
db.once('open', function callback () {
    log.info("Connected to DB!");
});


module.exports = db;
