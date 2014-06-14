#!/usr/bin/env node
require('express-namespace');
var config = require("app/config");
var express = require("express");
var passport = require("passport");
var mongoose = require("mongoose");
var bodyParser = require('body-parser');
var app = express();

var log = require("winston").loggers.get("app:server");

mongoose.connect("mongodb://"+config.mongodb.host+":"+config.mongodb.port+"/testAPIconfig");
var db = mongoose.connection;


db.on('error', function (err) {
    log.error('connection error:', err.message);
});
db.once('open', function callback () {
    log.info("Connected to DB!");
});

app.set("views", __dirname);
app.set("view engine", "jade");

app.use(passport.initialize());
app.use(bodyParser());

[
"app/users/routes",
"app/oAuth2/routes"
].forEach(function (routePath) {
    require(routePath)(app);
});

app.use(require("../app/middleware").notFound);

app.listen(config.express.port, config.express.ip, function (error) {
    if (error) {
        log.error("unable to listen for connections", error);
        process.exit(10);
    }
    log.info("express is listening on http://" +
        config.express.ip + ":" + config.express.port);
});
