var passport = require("passport");
var crypto              = require('crypto');

var UserModel           = require('app/users/models/UserModel');
var userGetScreen       = require('app/users/models/UserModel').userGetScreen;

var fetchUserById       = require('app/users/middleware/fetchUserById');

var ClientModel         = require('app/oauth2/models/ClientModel');
var AccessTokenModel    = require('app/oauth2/models/AccessTokenModel');

var redisPublisher = require('app/modules/redis').publisher;

var log = require('app/modules/logger');
var rate = require('app/modules/rate');

var acl = require('app/modules/acl');

var userEvents = require('app/users/events/userEvents');
require('app/users/eventListeners/userEventsListener');

var request = require('request');


var getUsersMeLimiter = rate(10, 20);
function getUsersMe(req, res) {
    var accessToken = req.headers.authorization.substring(7);
    //redisPublisher.publish("user:" + accessToken, JSON.stringify({user: userGetScreen(req.user)}));
    //redisPublisher.publish("system", "{\"message\": \"do wszystkich!\"}");
    res.status(200).json({user: userGetScreen(req.user)});
}


var getUserLimiter = rate(10, 20);
function getUser(req, res, next) {
    acl.check(req.user.id, 'users/'+req.userById.id, 'view', next, function() {
        res.status(200).json({user: userGetScreen(req.userById)});
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
function patchUser(req, res, next) {
    acl.check(req.user.id, 'users/'+req.userById.id, 'edit', next, function() {
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
    });
}

var deleteUserLimiter = rate(10, 20);
function deleteUser(req, res, next) {
    acl.check(req.user.id, 'users/'+req.userById.id, 'delete', next, function() {
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
    });
}

var putUsersForgotPasswordLimiter = rate(10, 20);
function putUsersForgotPassword(req, res) {
    email = req.body.email;

    UserModel.findOne({email: email}, function(err, user) {
        if(err) {
            next(err);
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
            next(err);
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
function getUserLinks(req, res, next) {
    acl.check(req.user.id, 'users/'+req.userById.id, 'view', next, function() {
        providers = {};

        if(req.userById.email !== null && req.userById.email !== undefined) {
            providers.email = req.userById.email;
        }

        if(req.userById.facebookId !== null && req.userById.facebookId !== undefined) {
            providers.facebookId = req.userById.facebookId;
        }

        res.status(200).json({providers: providers});
    }); 
}

var postUserLinkLimiter = rate(10, 20);
function postUserLink(req, res, next) {
    acl.check(req.user.id, 'users/'+req.userById.id, 'edit', next, function() {
        accessToken = req.body.accessToken;
        slug = req.params.slug;

        allowedProviders = ["facebook"];

        if(slug === undefined || allowedProviders.indexOf(slug) === -1) {
            res.json(400, {error: "unknown_provider", errorMessage: "Specified provider doesnt exist"});
        } else {
            switch(slug) {
                case 'facebook':
                    request('https://graph.facebook.com/v2.0/me?access_token='+accessToken, function (error, response, body) {
                        if(error || response.statusCode != 200) {
                            res.status(400).json({error: "wrong or expired access_token"});
                        } else {
                            var json = JSON.parse(body);

                            var facebookId = json.id;
                            var email = json.email;

                            // check if user with given facebook id already exists
                            UserModel.findOne({ facebookId: facebookId }, function(err, user) { 
                                if(err) {
                                    next(err);
                                }
                                if(!user) {
                                    req.userById.facebookId = facebookId;
                                    req.userById.facebookAccessToken = accessToken;

                                    req.userById.save();
                                    res.json(201, {});
                                } else {
                                    res.json(400, {error: "account_already_linked", errorMessage: "Given account is already linked to account in system"});
                                }
                            });
                        }
            });
            break;
            }
        }
    }); 
}

var deleteUserLinkLimiter = rate(10, 20);
function deleteUserLink(req, res, next) {
    acl.check(req.user.id, 'users/'+req.userById.id, 'delete', next, function() {
        accessToken = req.body.access_token;
        slug = req.params.slug;

        providers = [];

        if(req.userById.facebookId !== null && req.userById.facebookId !== undefined) {
            providers.push('facebook');
        }

        if(slug === undefined || providers.indexOf(slug) === -1) {
            res.json(400, {error: "unknown_provider", errorMessage: "Specified provider doesnt exist"});
        } else {
            if(req.userById.hashedPassword === undefined || req.userById.hashedPassword === null) {
                res.json(400, {error: "password_not_set", errorMessage: "Cannot delete link when there's no password set"});
            } else {
                switch(slug) {
                    case 'facebook':
                        req.userById.facebookId = null;
                        req.userById.facebookAccessToken = null;
                        break;
                }

                req.userById.save();

                res.status(204).json({});
            }
        }
    });
}

function setup(app) {
    app.namespace('/api/v1', function(){
        app.put('/users/forgot-password', putUsersForgotPasswordLimiter, putUsersForgotPassword);
        app.patch('/users/change-password', patchUsersChangePasswordLimiter, patchUsersChangePassword);

        app.get('/users/:id/links', getUserLinksLimiter, passport.authenticate('bearer', { session: false }), fetchUserById, getUserLinks);
        app.post('/users/:id/links/:slug', postUserLinkLimiter, passport.authenticate('bearer', { session: false }), fetchUserById, postUserLink);
        app.delete('/users/:id/links/:slug', deleteUserLinkLimiter, passport.authenticate('bearer', { session: false }), fetchUserById, deleteUserLink);

        app.post('/users', postUserLimiter, postUser);
        app.get('/users/me', getUsersMeLimiter, passport.authenticate('bearer', { session: false }), getUsersMe);
        app.get('/users/:id', getUserLimiter, passport.authenticate('bearer', { session: false }), fetchUserById, getUser);
        app.patch('/users/:id', patchUserLimiter, passport.authenticate('bearer', { session: false }), fetchUserById, patchUser);
        app.delete('/users/:id', deleteUserLimiter, passport.authenticate('bearer', { session: false }), fetchUserById, deleteUser);
    });
}

module.exports = setup;
