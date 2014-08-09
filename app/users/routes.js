var passport = require("passport");
var crypto              = require('crypto');

var UserModel           = require('app/users/models/UserModel');
var userGetScreen       = require('app/users/models/UserModel').userGetScreen;

var fetchUserById       = require('app/users/middleware/fetchUserById');

var ClientModel         = require('app/oauth2/models/ClientModel');
var AccessTokenModel    = require('app/oauth2/models/AccessTokenModel');

var log = require('app/modules/logger');
var rate = require('app/modules/rate');

var acl = require('app/modules/acl');

var userEvents = require('app/users/events/userEvents');
require('app/users/eventListeners/userEventsListener');


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

var postUserLimiter = rate(10, 20);
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

var patchUserLimiter = rate(10, 20);
function patchUser(req, res) {
    acl.isAllowed(req.user.id, 'users/'+req.userById.id, 'edit').then(function(result) {
        if(result) {
            var user = {
                currentPassword: req.body.currentPassword,
            };

            if (!req.userById.checkPassword(user.currentPassword)) { res.status(400).json({error: "wrong_password"});}

            if(req.body.email !== undefined) {
                req.userById.email = req.body.email;

                req.userById.save(function (err, user) {
                    if (!err) {
                        log.info("user updated");

                        userEvents.emit('user:email:changed', user);

                        res.status(201).json({user: userGetScreen(user)});
                    } else {
                        if(err.name == 'ValidationError') {
                            res.statusCode = 400;
                            res.send(err);
                        }             
                    }
                });
            }
        } else {
            res.status(403).json({error: "Action forbidden!"});
        }
    }, 
    function(err) {
        res.status(500).json({error: "Server error"});
    });
}

var deleteUserLimiter = rate(10, 20);
function deleteUser(req, res) {
    acl.isAllowed(req.user.id, 'users/'+req.userById.id, 'view').then(function(result) {
        if(result) {
            var user = {
                currentPassword: req.body.currentPassword,
            };

            if (!req.userById.checkPassword(user.currentPassword)) { res.status(400).json({error: "wrong_password"});}

            req.userById.remove({}, function (err) {
                if (!err) {
                    log.info("user deleted");

                    res.status(204).send();
                } else {
                    if(err.name == 'ValidationError') {
                        res.statusCode = 400;
                        res.send(err);
                    }             
                }
            });
        } else {
            res.status(403).json({error: "Action forbidden!"});
        }
    }, 
    function(err) {
        res.status(500).json({error: "Server error"});
    });
}

var putUsersForgotPasswordLimiter = rate(10, 20);
function putUsersForgotPassword(req, res) {
    email = req.body.email;

    UserModel.findOne({email: email}, function(err, user) {
        if(err) {
			res.json(500, {error: err});
		}
        if(!user) {
			res.json(204, {});
		}

        user.changePassToken = crypto.randomBytes(32).toString('base64');
        user.changePassTokenDate = Date.now();

        user.save();

        userEvents.emit('user:password:forgot', user);

        res.status(204).json({});
    });
}

var patchUsersChangePasswordLimiter = rate(10, 20);
function patchUsersChangePassword(req, res) {
    token = req.body.token;
    password = req.body.password;

    if (password === undefined) {
	    res.json(400, {error: "password_not_set", errorMessage: "There were no password set"});
    }

    UserModel.findOne({changePassToken: token}, function(err, user) {
        if(err) {
			res.json(500, {error: err});
		}
        if(!user) {
			res.json(400, {error: "token_doesnt_exist", errorMessage: "Providen token does not exist in database"});
		} else {
            now = new Date();
            now.setMinutes(now.getMinutes() - 10);

            if(user.changePassTokenDate <= now) {
                user.changePassToken = null;
                user.changePassTokenDate = null;

                user.save(function(err, user){
                    console.log(err);
                });
            
                res.json(422, {error: "token_time_expired", errorMessage: "Token time expired"});
            } else {
                user.password = password;
                user.changePassToken = null;
                user.changePassTokenDate = null;
            
                user.save();

                userEvents.emit('user:password:forgot:change', user);
                userEvents.emit('user:password:change', user);

                res.status(204).json({});
            }
        }
    });
}

var getUserLinksLimiter = rate(10, 20);
function getUserLinks(req, res) {
    acl.isAllowed(req.user.id, 'users/'+req.userById.id, 'view').then(function(result) {
        if(result) {
            providers = {};

            if(req.userById.email !== null && req.userById.email !== undefined) {
                providers.email = req.userById.email;
            }

            if(req.userById.facebookId !== null && req.userById.facebookId !== undefined) {
                providers.facebookId = req.userById.facebookId;
            }

            res.status(200).json({providers: providers});
        } else {
            res.status(403).json({error: "Action forbidden!"});
        }
    }, 
    function(err) {
        res.status(500).json({error: "Server error"});
    });
}

function setup(app) {
    app.namespace('/api/v1', function(){
        app.put('/users/forgot-password', putUsersForgotPasswordLimiter, putUsersForgotPassword);
        app.patch('/users/change-password', patchUsersChangePasswordLimiter, patchUsersChangePassword);

        app.post('/users', postUserLimiter, postUser);
        app.get('/users/me', getUsersMeLimiter, passport.authenticate('bearer', { session: false }), getUsersMe);
        app.get('/users/:id', getUserLimiter, passport.authenticate('bearer', { session: false }), fetchUserById, getUser);
        app.patch('/users/:id', patchUserLimiter, passport.authenticate('bearer', { session: false }), fetchUserById, patchUser);
        app.delete('/users/:id', deleteUserLimiter, passport.authenticate('bearer', { session: false }), fetchUserById, deleteUser);

        app.get('/users/:id/links', getUserLinksLimiter, passport.authenticate('bearer', { session: false }), fetchUserById, getUserLinks);


    });
}

module.exports = setup;
