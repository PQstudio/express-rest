var passport = require("passport");
var UserModel           = require('app/users/UserModel').UserModel;
var ClientModel         = require('app/oAuth2/ClientModel').ClientModel;
var log = require("winston").loggers.get("app:server");

function getUsersMe(req, res) {
    res.send(process.env);
    //res.status(200).json({"user":{ "email": "gregory90@gmail.com"}})
}

function postUser(req, res) {
    console.log(req.body);

var user = new UserModel({ email: "gregory90@gmail.com", password: "pass" });
    user.save(function(err, user) {
        if(err) return log.error(err);
        else log.info("New user - %s:%s",user.email,user.password);
    });

//var client = new ClientModel({ name: "OurService iOS client v1", clientId: "clientid", clientSecret:"clientsecret" });
    //client.save(function(err, client) {
        //if(err) return log.error(err);
        //else log.info("New client - %s:%s",client.clientId,client.clientSecret);
    //});
    //var user = req.body;

    res.status(201).json(user);
}

function setup(app) {
    app.namespace('/api/v1', function(){
        app.post('/users', postUser);
        //app.get('/users/me', passport.authenticate('bearer', { session: false }), getUsersMe);
        app.get('/users/me', getUsersMe);
    });
}

module.exports = setup;
