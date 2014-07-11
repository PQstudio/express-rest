#!/usr/bin/env node
require('express-namespace');
var config = require("app/config");
var express = require("express");
var passport = require("passport");
var bodyParser = require('body-parser');
var app = express();

var db = require('app/modules/db');

var log = require("app/modules/logger");

app.set("views", __dirname);
app.set("view engine", "jade");

app.use(passport.initialize());
app.use(bodyParser.json())
   .use(bodyParser.urlencoded({ extended: false }));

[
"app/users/routes",
"app/oauth2/routes",
"app/recaptcha/routes",
"app/fileUpload/routes"
].forEach(function (routePath) {
    require(routePath)(app);
});

app.use(require("app/middleware").notFound);

app.listen(config.express.port, config.express.ip, function (error) {
    if (error) {
        log.error("unable to listen for connections", error);
        process.exit(10);
    }
    log.info("express is listening on http://" +
        config.express.ip + ":" + config.express.port);
});
