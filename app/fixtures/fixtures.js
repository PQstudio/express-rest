var mongoose = require("mongoose");
var log = require("winston").loggers.get("app:server");
var UserModel           = require('app/users/models/UserModel');
var ClientModel         = require('app/oauth2/models/ClientModel');
var AccessTokenModel    = require('app/oauth2/models/AccessTokenModel');
var RefreshTokenModel   = require('app/oauth2/models/RefreshTokenModel');
var config = require("app/config");

mongoose.connect(config.mongodb.url);
var db = mongoose.connection;


db.on('error', function (err) {
    log.error('connection error:', err.message);
});
db.once('open', function callback () {
    log.info("Connected to DB!");
});

UserModel.remove({}, function(err) {
    var user = new UserModel({ email: "gregory90@gmail.com", password: "qazxsw21!" });
    user.save(function(err, user) {
        if(err) return log.error(err);
        else log.info("New user - %s:%s",user.username,user.password);
    });
});

ClientModel.remove({}, function(err) {
    var client = new ClientModel({ name: "webapp", clientId: "clientid", clientSecret:"clientsecret" });
    client.save(function(err, client) {
        if(err) return log.error(err);
        else log.info("New client - %s:%s",client.clientId,client.clientSecret);
    });
});
AccessTokenModel.remove({}, function (err) {
    if (err) return log.error(err);
});
RefreshTokenModel.remove({}, function (err) {
    if (err) return log.error(err);
});

setTimeout(function() {
    mongoose.disconnect();
}, 3000);
