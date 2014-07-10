var passport = require("passport");

var UserModel           = require('app/users/models/UserModel');
var userGetScreen       = require('app/users/models/UserModel').userGetScreen;

var fetchUserById       = require('app/users/middleware/fetchUserById');

var ClientModel         = require('app/oauth2/models/ClientModel');
var AccessTokenModel    = require('app/oauth2/models/AccessTokenModel');

var log = require('app/modules/logger');
var rate = require('app/modules/rate');

var acl = require('app/modules/acl');


var getUsersMeLimiter = rate(10, 20);
function getUsersMe(req, res) {
    res.status(200).json({user: userGetScreen(req.user)});
}

var getUserLimiter = rate(10, 20);
function getUser(req, res) {
    acl.isAllowed(req.user.id, 'users/'+req.userById.id, 'view').then(function(result) {
        if(result) {
            res.status(200).json({user: userGetScreen(req.userById)});
        } else {
            res.status(403).json({error: "Action forbidden!"});
        }
    }, 
    function(err) {
        res.status(500).json({error: "Server error"});
    });
}

function postUser(req, res) {
    var user = new UserModel({
        email: req.body.email,
        password: req.body.password,
    });

    user.save(function (err) {
        if (!err) {
            log.info("user created");
            
            acl.allow(user.id, 'users/'+user.id, ['view', 'edit', 'delete']);
            acl.allow('admin', 'users/'+user.id, ['view', 'edit', 'delete']);
            acl.addUserRoles(user.id, user.id)

            res.status(201).json({user: userGetScreen(user)});
        } else {
            if(err.name == 'ValidationError') {
                res.statusCode = 400;
                res.send(err);
            }             
        }
    });
}

function setup(app) {
    app.namespace('/api/v1', function(){
        app.post('/users', postUser);
        app.get('/users/me', getUsersMeLimiter, passport.authenticate('bearer', { session: false }), getUsersMe);
        app.get('/users/:id', getUserLimiter, passport.authenticate('bearer', { session: false }), fetchUserById, getUser);
    });
}

module.exports = setup;
